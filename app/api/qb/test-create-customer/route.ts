import { NextRequest, NextResponse } from 'next/server';
import { createCustomerFromResident, type Resident } from '../../../../services/quickbooks';

export const runtime = 'nodejs';

/**
 * POST /api/qb/test-create-customer
 * 
 * Test endpoint to create a customer in QuickBooks from a resident.
 * 
 * Body (optional):
 * {
 *   name: string,
 *   email: string,
 *   accountNumber?: string,
 *   contactInfo?: {
 *     phone?: string,
 *     address?: string,
 *     city?: string,
 *     state?: string,
 *     zip?: string
 *   }
 * }
 * 
 * If no body is provided, uses a default test resident.
 */
export async function POST(req: NextRequest) {
  try {
    let resident: Resident;

    // Check if request has a body
    const contentType = req.headers.get('content-type');
    if (contentType?.includes('application/json')) {
      try {
        const body = await req.json();
        
        // Validate required fields
        if (!body.name || !body.email) {
          return NextResponse.json(
            { error: 'Missing required fields: name and email are required' },
            { status: 400 }
          );
        }

        resident = {
          name: body.name,
          email: body.email,
          accountNumber: body.accountNumber,
          contactInfo: body.contactInfo ? {
            phone: body.contactInfo.phone,
            address: body.contactInfo.address,
            city: body.contactInfo.city,
            state: body.contactInfo.state,
            zip: body.contactInfo.zip,
          } : undefined,
        };
      } catch (error) {
        return NextResponse.json(
          { error: 'Invalid JSON in request body' },
          { status: 400 }
        );
      }
    } else {
      // Use default test resident if no body provided
      resident = {
        name: 'Test Customer',
        email: `test-${Date.now()}@example.com`,
        accountNumber: `TEST-${Date.now()}`,
        contactInfo: {
          phone: '555-123-4567',
          address: '123 Test Street',
          city: 'Test City',
          state: 'NY',
          zip: '10001',
        },
      };
    }

    console.log('[Test Route] Creating customer with resident data:', resident);

    // Create customer in QuickBooks
    const qbCustomerId = await createCustomerFromResident(resident);

    return NextResponse.json({
      success: true,
      message: 'Customer created successfully in QuickBooks',
      data: {
        qbCustomerId,
        resident: {
          name: resident.name,
          email: resident.email,
          accountNumber: resident.accountNumber,
        },
      },
    });
  } catch (error: any) {
    console.error('[Test Route] Error creating customer:', error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to create customer in QuickBooks',
        details: error.response?.data || undefined,
      },
      { status: error.response?.status || 500 }
    );
  }
}

/**
 * GET /api/qb/test-create-customer
 * 
 * Test endpoint that creates a customer with default test data.
 */
export async function GET() {
  try {
    // Use default test resident
    const resident: Resident = {
      name: 'Test Customer',
      email: `test-${Date.now()}@example.com`,
      accountNumber: `TEST-${Date.now()}`,
      contactInfo: {
        phone: '555-123-4567',
        address: '123 Test Street',
        city: 'Test City',
        state: 'NY',
        zip: '10001',
      },
    };

    console.log('[Test Route] Creating customer with default test data:', resident);

    // Create customer in QuickBooks
    const qbCustomerId = await createCustomerFromResident(resident);

    return NextResponse.json({
      success: true,
      message: 'Customer created successfully in QuickBooks',
      data: {
        qbCustomerId,
        resident: {
          name: resident.name,
          email: resident.email,
          accountNumber: resident.accountNumber,
        },
      },
    });
  } catch (error: any) {
    console.error('[Test Route] Error creating customer:', error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to create customer in QuickBooks',
        details: error.response?.data || undefined,
      },
      { status: error.response?.status || 500 }
    );
  }
}

