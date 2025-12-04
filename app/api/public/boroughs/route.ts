import { NextRequest, NextResponse } from 'next/server';
import { getPayloadHMR } from '@payloadcms/next/utilities';
import configPromise from '@/payload.config';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  try {
    const payload = await getPayloadHMR({ config: configPromise });
    
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get('limit') || '100');
    const sort = searchParams.get('sort') || 'name';
    const depth = parseInt(searchParams.get('depth') || '0');

    const result = await payload.find({
      collection: 'boroughs',
      limit,
      sort,
      depth,
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('[PUBLIC Boroughs API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch boroughs', message: error.message },
      { status: 500 }
    );
  }
}
