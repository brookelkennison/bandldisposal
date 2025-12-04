import { NextResponse } from 'next/server';
import { qbConfig, QB_AUTH_URL } from '../../../../utils/quickbooksConfig';

export const runtime = 'nodejs';

export async function GET() {
  const state = 'static-state-for-now'; // TODO: real CSRF if you want

  const params = new URLSearchParams({
    client_id: qbConfig.clientId,
    redirect_uri: qbConfig.redirectUri,
    response_type: 'code',
    scope: qbConfig.scopes,
    state,
  });

  return NextResponse.redirect(`${QB_AUTH_URL}?${params.toString()}`);
}
