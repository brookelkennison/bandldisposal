import { NextResponse } from 'next/server';
import axios from 'axios';
import { getValidQuickBooksToken } from '../../../../utils/quickbooksAuth';
import { qbConfig } from '../../../../utils/quickbooksConfig';

export const runtime = 'nodejs';

export async function GET() {
  try {
    const { accessToken, realmId } = await getValidQuickBooksToken();

    // Use correct API base URL based on environment
    const apiBase = qbConfig.environment === 'production'
      ? 'https://quickbooks.api.intuit.com/v3/company'
      : 'https://sandbox-quickbooks.api.intuit.com/v3/company';

    const url = `${apiBase}/${realmId}/companyinfo/${realmId}?minorversion=65`;

    const res = await axios.get(url, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/json',
      },
    });

    return NextResponse.json(res.data);
  } catch (err: any) {
    console.error('QB company info error:', err.response?.data || err.message);
    
    // Return more detailed error information
    if (err.message === 'QuickBooks not connected.') {
      return NextResponse.json(
        { error: 'QuickBooks is not connected. Please connect first.' },
        { status: 401 },
      );
    }

    const statusCode = err.response?.status || 500;
    const errorData = err.response?.data || { message: err.message };

    return NextResponse.json(
      {
        error: 'Failed to fetch company info from QuickBooks.',
        details: errorData,
        status: statusCode,
      },
      { status: statusCode },
    );
  }
}
