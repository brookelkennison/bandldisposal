import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import { getPayloadHMR } from '@payloadcms/next/utilities';
import configPromise from '@/payload.config';
import { qbConfig, QB_TOKEN_URL } from '../../../../utils/quickbooksConfig';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const code = url.searchParams.get('code');
  const realmId = url.searchParams.get('realmId');

  if (!code || !realmId) {
    return new NextResponse('Missing code or realmId.', { status: 400 });
  }

  try {
    const basicAuth = Buffer.from(
      `${qbConfig.clientId}:${qbConfig.clientSecret}`,
    ).toString('base64');

    const params = new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: qbConfig.redirectUri,
    });

    const tokenRes = await axios.post(QB_TOKEN_URL, params.toString(), {
      headers: {
        Authorization: `Basic ${basicAuth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });

    const {
      access_token,
      refresh_token,
      expires_in,
      x_refresh_token_expires_in,
    } = tokenRes.data;

    const now = Date.now();

    const payload = await getPayloadHMR({ config: configPromise });

    await payload.updateGlobal({
      slug: 'quickbooksAuth',
      data: {
        realmId,
        accessToken: access_token,
        refreshToken: refresh_token,
        accessTokenExpiresAt: now + expires_in * 1000,
        refreshTokenExpiresAt: now + x_refresh_token_expires_in * 1000,
      },
    });

    return new NextResponse('QuickBooks connected. You can close this window.');
  } catch (err: any) {
    console.error('QB OAuth error:', err.response?.data || err.message);
    return new NextResponse('Failed to connect to QuickBooks.', { status: 500 });
  }
}
