import { NextRequest, NextResponse } from 'next/server';
import { getPayloadHMR } from '@payloadcms/next/utilities';
import configPromise from '@/payload.config';

export const runtime = 'nodejs';

/**
 * POST /api/commercial/start-service
 * 
 * Creates a new commercial account with status "pending"
 * 
 * Body:
 * {
 *   firstName: string,
 *   lastName: string,
 *   businessName: string,
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
    const payload = await getPayloadHMR({ config: configPromise });
    const body = await req.json();

    // Validate required fields (email not required if accountId is provided)
    const requiredFields = body.accountId
      ? ['firstName', 'lastName', 'businessName', 'address', 'city', 'state', 'zip', 'desiredStartDate']
      : ['firstName', 'lastName', 'businessName', 'email', 'address', 'city', 'state', 'zip', 'desiredStartDate'];
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

    // Validate email format (only if not updating existing account)
    if (!body.accountId) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(body.email)) {
        return NextResponse.json(
          { error: 'Invalid email format' },
          { status: 400 }
        );
      }
    }

    // Validate ZIP code format
    const zipRegex = /^\d{5}(-\d{4})?$/;
    if (!zipRegex.test(body.zip)) {
      return NextResponse.json(
        { error: 'Invalid ZIP code format. Use 12345 or 12345-6789' },
        { status: 400 }
      );
    }

    // Borough is optional for commercial accounts, but validate if provided
    if (body.borough) {
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
    }

    // Validate date format
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(body.desiredStartDate)) {
      return NextResponse.json(
        { error: 'Invalid date format. Use YYYY-MM-DD' },
        { status: 400 }
      );
    }

    let account;

    // If accountId is provided, update existing account; otherwise create new one
    if (body.accountId) {
      // Update existing account
      account = await payload.update({
        collection: 'commercial-accounts',
        id: body.accountId,
        data: {
          name: body.businessName,
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
        },
      });
    } else {
      // Check if email already exists (only for new accounts)
      const existingAccount = await payload.find({
        collection: 'commercial-accounts',
        where: {
          email: {
            equals: body.email,
          },
        },
        limit: 1,
      });

      if (existingAccount.totalDocs > 0) {
        return NextResponse.json(
          { error: 'An account with this email already exists. Please log in instead.' },
          { status: 409 }
        );
      }

      // Create new account
      // Note: afterChange hook will automatically send password setup email
      console.log('[Start Service] Creating new commercial account for:', body.email);
      account = await payload.create({
        collection: 'commercial-accounts',
        data: {
          name: body.businessName,
          email: body.email,
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
            gracePeriodDays: 7,
            latePaymentCount: 0,
            totalLateFees: 0,
          },
        },
      });
      console.log('[Start Service] Account created successfully:', account.id, account.accountNumber);
      console.log('[Start Service] Password setup email should have been sent to:', account.email);
    }

    return NextResponse.json({
      success: true,
      message: 'Service request submitted successfully',
      data: {
        accountId: account.id,
        accountNumber: account.accountNumber,
        status: account.serviceInfo?.serviceStatus,
      },
    });
  } catch (error: any) {
    console.error('[Start Service API] Error creating commercial account:', error);

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

