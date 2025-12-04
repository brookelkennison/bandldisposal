import { NextRequest, NextResponse } from 'next/server';
import { getPayload } from 'payload';
import config from '@/payload.config';

export async function GET(req: NextRequest) {
  try {
    const payload = await getPayload({ config });
    
    // Get token from Authorization header
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('JWT ')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(4);
    
    // Verify token and get user
    const { user } = await payload.auth({
      collection: 'commercial-accounts',
      token,
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Fetch full account data
    const account = await payload.findByID({
      collection: 'commercial-accounts',
      id: user.id,
      depth: 1,
    });

    // Remove sensitive fields
    const { password, ...accountData } = account as any;

    return NextResponse.json(accountData);
  } catch (error) {
    console.error('Error fetching account:', error);
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }
}

