import axios from 'axios';
import { getPayloadHMR } from '@payloadcms/next/utilities';
import configPromise from '../payload.config';
import { qbConfig, QB_TOKEN_URL } from './quickbooksConfig';

export async function getValidQuickBooksToken() {
  const payload = await getPayloadHMR({ config: configPromise });

  const qb: any = await payload.findGlobal({ slug: 'quickbooksAuth' });
  const now = Date.now();

  if (!qb?.refreshToken || !qb?.realmId) {
    throw new Error('QuickBooks not connected.');
  }

  if (qb.accessToken && qb.accessTokenExpiresAt > now + 60_000) {
    return { accessToken: qb.accessToken as string, realmId: qb.realmId as string };
  }

  const basicAuth = Buffer.from(
    `${qbConfig.clientId}:${qbConfig.clientSecret}`,
  ).toString('base64');

  const params = new URLSearchParams({
    grant_type: 'refresh_token',
    refresh_token: qb.refreshToken as string,
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

  await payload.updateGlobal({
    slug: 'quickbooksAuth',
    data: {
      accessToken: access_token,
      refreshToken: refresh_token,
      accessTokenExpiresAt: now + expires_in * 1000,
      refreshTokenExpiresAt: now + x_refresh_token_expires_in * 1000,
    },
  });

  return { accessToken: access_token as string, realmId: qb.realmId as string };
}
