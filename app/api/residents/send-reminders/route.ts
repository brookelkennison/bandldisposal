import { NextRequest, NextResponse } from 'next/server';
import { getPayloadHMR } from '@payloadcms/next/utilities';
import configPromise from '@/payload.config';
import nodemailer from 'nodemailer';

export const runtime = 'nodejs';

/**
 * POST /api/residents/send-reminders
 * 
 * Sends reminder emails to customers who haven't completed payment setup
 * after 2 hours from account creation.
 * 
 * This endpoint should be called by a scheduled job/cron every hour or so.
 */
export async function POST(req: NextRequest) {
  try {
    const payload = await getPayloadHMR({ config: configPromise });

    // Calculate the time 2 hours ago
    const twoHoursAgo = new Date();
    twoHoursAgo.setHours(twoHoursAgo.getHours() - 2);

    // Find accounts that:
    // 1. Were created at least 2 hours ago
    // 2. Have status "pending" (haven't completed setup) OR don't have a payment method
    // 3. Haven't had a reminder sent yet
    // 4. Have an email address
    const accountsNeedingReminder = await payload.find({
      collection: 'accounts',
      where: {
        and: [
          {
            createdAt: {
              less_than: twoHoursAgo.toISOString(),
            },
          },
          {
            or: [
              {
                'serviceInfo.serviceStatus': {
                  equals: 'pending',
                },
              },
              {
                'paymentInfo.paymentMethod': {
                  exists: false,
                },
              },
            ],
          },
          {
            paymentSetupReminderSent: {
              equals: false,
            },
          },
          {
            email: {
              exists: true,
            },
          },
        ],
      },
      limit: 100,
    });

    console.log(`[Reminder System] Found ${accountsNeedingReminder.totalDocs} accounts needing reminders`);

    const results = {
      sent: 0,
      failed: 0,
      errors: [] as string[],
    };

    // Send reminder emails
    for (const account of accountsNeedingReminder.docs) {
      try {
        await sendReminderEmail(account);
        
        // Mark reminder as sent
        await payload.update({
          collection: 'accounts',
          id: account.id,
          data: {
            paymentSetupReminderSent: true,
            paymentSetupReminderSentAt: new Date().toISOString(),
          },
        });

        results.sent++;
        console.log(`[Reminder System] Reminder sent to ${account.email} (${account.accountNumber})`);
      } catch (error: any) {
        results.failed++;
        const errorMsg = `Failed to send reminder to ${account.email}: ${error.message}`;
        results.errors.push(errorMsg);
        console.error(`[Reminder System] ${errorMsg}`, error);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Reminder emails processed`,
      data: {
        totalFound: accountsNeedingReminder.totalDocs,
        sent: results.sent,
        failed: results.failed,
        errors: results.errors,
      },
    });
  } catch (error: any) {
    console.error('[Reminder System] Error processing reminders:', error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to process reminders',
      },
      { status: 500 }
    );
  }
}

/**
 * Send reminder email to customer
 */
async function sendReminderEmail(account: any): Promise<void> {
  if (!account.email) {
    throw new Error('Account does not have an email address');
  }

  if (!process.env.SMTP_HOST) {
    throw new Error('SMTP not configured');
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.VERCEL_URL 
    ? `https://${process.env.VERCEL_URL}` 
    : 'http://localhost:3000';

  // Create payment setup URL
  const setupUrl = `${baseUrl}/setup-payment?account=${account.accountNumber}&token=${account.onboardingToken || ''}`;

  const subject = `Reminder: Complete Your Payment Setup - B&L Disposal Account ${account.accountNumber}`;

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
        .reminder-notice {
          background-color: #fff3cd;
          border-left: 4px solid #ffc107;
          padding: 15px;
          margin: 20px 0;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>B&L Disposal</h1>
        <p>Reminder: Complete Your Payment Setup</p>
      </div>
      
      <div class="content">
        <p>Dear ${account.name || 'Valued Customer'},</p>
        
        <div class="reminder-notice">
          <p><strong>This is a friendly reminder</strong> that you haven't yet completed your payment setup for your B&L Disposal account.</p>
        </div>
        
        <p>Your account was created successfully, but to activate your service, you need to complete your payment information setup.</p>
        
        <p><strong>Account Number:</strong> ${account.accountNumber}</p>
        <p><strong>Service Start Date:</strong> ${account.serviceInfo?.serviceStartDate ? new Date(account.serviceInfo.serviceStartDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : 'Pending'}</p>
        
        <p>Please complete your payment setup by clicking the button below:</p>
        
        <div style="text-align: center;">
          <a href="${setupUrl}" class="button">Complete Payment Setup Now</a>
        </div>
        
        <p>Or copy and paste this link into your browser:</p>
        <p style="word-break: break-all; color: #6ABF43;">${setupUrl}</p>
        
        <p>Completing your payment setup will ensure your service starts on time without any delays.</p>
        
        <p>If you have any questions or need assistance, please don't hesitate to contact our customer service team.</p>
        
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
B&L Disposal - Reminder: Complete Your Payment Setup

Dear ${account.name || 'Valued Customer'},

This is a friendly reminder that you haven't yet completed your payment setup for your B&L Disposal account.

Your account was created successfully, but to activate your service, you need to complete your payment information setup.

Account Number: ${account.accountNumber}
Service Start Date: ${account.serviceInfo?.serviceStartDate ? new Date(account.serviceInfo.serviceStartDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : 'Pending'}

Please complete your payment setup by visiting:

${setupUrl}

Completing your payment setup will ensure your service starts on time without any delays.

If you have any questions or need assistance, please don't hesitate to contact our customer service team.

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
}

