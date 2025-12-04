import { NextRequest, NextResponse } from 'next/server';
import { getPayloadHMR } from '@payloadcms/next/utilities';
import configPromise from '@/payload.config';
import { createCustomerFromResident, createPaymentLink } from '@/services/quickbooks';
import type { Resident } from '@/services/quickbooks';
import nodemailer from 'nodemailer';
import { sendEmail } from "@/services/email";
import crypto from "crypto";

export const runtime = 'nodejs';

/**
 * POST /api/residents/start-service
 * 
 * Creates a new resident account with status "pending"
 * 
 * Body:
 * {
 *   firstName: string,
 *   lastName: string,
 *   email: string,
 *   phone?: string,
 *   address: string,
 *   city: string,
 *   state: string,
 *   zip: string,
 *   borough: string (borough ID),
 *   desiredStartDate: string (YYYY-MM-DD),
 *   name: string (computed from firstName + lastName)
 * }
 */
export async function POST(req: NextRequest) {
  try {
    const token = crypto.randomBytes(32).toString("hex");
    const expires = new Date(Date.now() + 1000 * 60 * 60 * 24); // 24 hours
    const payload = await getPayloadHMR({ config: configPromise });
    const body = await req.json();

    // Validate required fields
    const requiredFields = ['firstName', 'lastName', 'email', 'address', 'city', 'state', 'zip', 'borough', 'desiredStartDate'];
    const missingFields = requiredFields.filter(field => !body[field]);

    if (missingFields.length > 0) {
      return NextResponse.json(
        { 
          error: 'Missing required fields',
          missingFields 
        },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(body.email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Validate ZIP code format
    const zipRegex = /^\d{5}(-\d{4})?$/;
    if (!zipRegex.test(body.zip)) {
      return NextResponse.json(
        { error: 'Invalid ZIP code format. Use 12345 or 12345-6789' },
        { status: 400 }
      );
    }

    // Validate borough exists
    try {
      const borough = await payload.findByID({
        collection: 'boroughs',
        id: body.borough,
      });

      if (!borough) {
        return NextResponse.json(
          { error: 'Invalid borough selected' },
          { status: 400 }
        );
      }
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid borough selected' },
        { status: 400 }
      );
    }

    // Validate date format
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(body.desiredStartDate)) {
      return NextResponse.json(
        { error: 'Invalid date format. Use YYYY-MM-DD' },
        { status: 400 }
      );
    }

    // Check if email already exists
    const existingAccount = await payload.find({
      collection: 'accounts',
      where: {
        email: {
          equals: body.email,
        },
      },
      limit: 1,
    });

    if (existingAccount.totalDocs > 0) {
      return NextResponse.json(
        { error: 'An account with this email already exists' },
        { status: 409 }
      );
    }

    // Step 1: Create the account in Payload with status "pending"
    const account = await payload.create({
      collection: 'accounts',
      data: {
        // Temporary random password so Payload auth validation passes;
        // customer will set their real password via email link
        password: crypto.randomBytes(32).toString("hex"),
        name: body.name || `${body.firstName} ${body.lastName}`.trim(),
        email: body.email,
        borough: body.borough,
        contactInfo: {
          phone: body.phone || undefined,
          address: body.address,
          city: body.city,
          state: body.state,
          zip: body.zip,
        },
        serviceInfo: {
          serviceStartDate: body.desiredStartDate,
          serviceStatus: 'pending',
        },
        billingInfo: {
          billingDate: 1, // Default to 1st of month
          billingCadence: 'monthly', // Default to monthly
          accountBalance: 0,
        },
        paymentInfo: {
          isLate: 'current',
          gracePeriodDays: 5,
          latePaymentCount: 0,
          totalLateFees: 0,
        },
        // Store timestamp for reminder system (will be set by reminder system)
      },
    });

    // Send account setup email with password creation link
    try {
      const link = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/complete-setup?token=${token}`;

      await sendEmail({
        to: body.email,
        subject: "Complete Your B&L Disposal Account Setup",
        html: `
          <p>Hello ${body.firstName || ""},</p>
          <p>Click the link below to finish setting up your B&L Disposal account and create your password:</p>
          <p><a href="${link}">Complete Account Setup</a></p>
          <p>This link expires in 24 hours.</p>
          <p>Thank you,<br>B&L Disposal Team</p>
        `,
        messageStream: "new-account-setup",
      });
    } catch (emailError) {
      console.error('[Start Service] Error sending password setup email:', emailError);
      // Continue even if password setup email fails
    }

    let qbCustomerId: string | null = null;
    let paymentLink: string | null = null;

    try {
      // Step 2: Create customer in QuickBooks
      const resident: Resident = {
        id: account.id.toString(),
        accountNumber: account.accountNumber,
        name: account.name,
        email: account.email,
        contactInfo: {
          phone: account.contactInfo?.phone,
          address: account.contactInfo?.address,
          city: account.contactInfo?.city,
          state: account.contactInfo?.state,
          zip: account.contactInfo?.zip,
        },
        serviceInfo: {
          serviceStartDate: account.serviceInfo?.serviceStartDate,
          serviceStatus: account.serviceInfo?.serviceStatus,
        },
      };

      qbCustomerId = await createCustomerFromResident(resident);

      // Update account with QuickBooks customer ID
      await payload.update({
        collection: 'accounts',
        id: account.id,
        data: {
          qbCustomerId,
          setupToken: token,
          setupTokenExpiresAt: expires.toISOString(),
        },
      });

      // Step 3: Create payment setup link
      try {
        paymentLink = await createPaymentLink(qbCustomerId, 'setup');
      } catch (error) {
        console.error('[Start Service] Error creating payment link:', error);
        // Continue even if payment link creation fails
      }
    } catch (error: any) {
      console.error('[Start Service] Error creating QuickBooks customer:', error);
      // Continue even if QuickBooks creation fails - account is still created
    }

    // Step 3: Send email to customer with payment setup information
    try {
      await sendPaymentSetupEmail({
        account,
        paymentLink,
        qbCustomerId,
      });
    } catch (error) {
      console.error('[Start Service] Error sending payment setup email:', error);
      // Continue even if email fails
    }

    return NextResponse.json({
      success: true,
      message: 'Service request submitted successfully',
      data: {
        accountId: account.id,
        accountNumber: account.accountNumber,
        status: account.serviceInfo?.serviceStatus,
        qbCustomerId,
      },
    });
  } catch (error: any) {
    console.error('[Start Service API] Error creating account:', error);

    // Handle Payload validation errors
    if (error.data) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation error',
          details: error.data,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to create service request',
      },
      { status: 500 }
    );
  }
}

/**
 * Send payment setup email to customer
 */
async function sendPaymentSetupEmail({
  account,
  paymentLink,
  qbCustomerId,
}: {
  account: any;
  paymentLink: string | null;
  qbCustomerId: string | null;
}): Promise<void> {
  if (!account.email) {
    console.warn(`Account ${account.accountNumber} does not have an email address`);
    return;
  }

  if (!process.env.SMTP_HOST) {
    console.warn('SMTP not configured - skipping payment setup email');
    return;
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.VERCEL_URL 
    ? `https://${process.env.VERCEL_URL}` 
    : 'http://localhost:3000';

  // Create payment setup URL (this would be your frontend page for payment setup)
  const setupUrl = paymentLink || `${baseUrl}/setup-payment?account=${account.accountNumber}&token=${account.onboardingToken || ''}`;

  const subject = `Complete Your Payment Setup - B&L Disposal Account ${account.accountNumber}`;

  const htmlBody = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body {
          font-family: Arial, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
        }
        .header {
          background-color: #002F1F;
          color: white;
          padding: 20px;
          text-align: center;
          border-radius: 5px 5px 0 0;
        }
        .content {
          background-color: #f9f9f9;
          padding: 20px;
          border: 1px solid #ddd;
        }
        .button {
          display: inline-block;
          padding: 12px 24px;
          background-color: #6ABF43;
          color: white;
          text-decoration: none;
          border-radius: 5px;
          margin: 20px 0;
          font-weight: bold;
        }
        .button:hover {
          background-color: #5aa832;
        }
        .footer {
          margin-top: 20px;
          padding-top: 20px;
          border-top: 1px solid #ddd;
          font-size: 12px;
          color: #666;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>B&L Disposal</h1>
        <p>Complete Your Payment Setup</p>
      </div>
      
      <div class="content">
        <p>Dear ${account.name || 'Valued Customer'},</p>
        
        <p>Thank you for starting service with B&L Disposal! Your account has been created successfully.</p>
        
        <p><strong>Account Number:</strong> ${account.accountNumber}</p>
        <p><strong>Service Start Date:</strong> ${account.serviceInfo?.serviceStartDate ? new Date(account.serviceInfo.serviceStartDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : 'Pending'}</p>
        
        <p>To complete your account setup, please add your payment information by clicking the button below:</p>
        
        <div style="text-align: center;">
          <a href="${setupUrl}" class="button">Complete Payment Setup</a>
        </div>
        
        <p>Or copy and paste this link into your browser:</p>
        <p style="word-break: break-all; color: #6ABF43;">${setupUrl}</p>
        
        <p>This link will allow you to securely add your payment method and complete your account setup.</p>
        
        <p>If you have any questions, please don't hesitate to contact our customer service team.</p>
        
        <div class="footer">
          <p><strong>B&L Disposal</strong></p>
          <p>Creative Waste Solutions</p>
          <p>Thank you for choosing B&L Disposal!</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const textBody = `
B&L Disposal - Complete Your Payment Setup

Dear ${account.name || 'Valued Customer'},

Thank you for starting service with B&L Disposal! Your account has been created successfully.

Account Number: ${account.accountNumber}
Service Start Date: ${account.serviceInfo?.serviceStartDate ? new Date(account.serviceInfo.serviceStartDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : 'Pending'}

To complete your account setup, please add your payment information by visiting:

${setupUrl}

This link will allow you to securely add your payment method and complete your account setup.

If you have any questions, please don't hesitate to contact our customer service team.

B&L Disposal
Creative Waste Solutions
Thank you for choosing B&L Disposal!
  `.trim();

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_ACCESS_TOKEN,
      pass: process.env.SMTP_SECRET_TOKEN,
    },
  });

  await transporter.sendMail({
    from: `${process.env.SMTP_FROM_NAME || 'B&L Disposal'} <${process.env.SMTP_FROM_ADDRESS || 'noreply@example.com'}>`,
    to: account.email,
    subject,
    html: htmlBody,
    text: textBody,
  });

  console.log(`[Start Service] Payment setup email sent to ${account.email}`);
}

