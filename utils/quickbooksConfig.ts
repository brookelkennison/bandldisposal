export const qbConfig = {
    clientId: process.env.QB_CLIENT_ID!,
    clientSecret: process.env.QB_CLIENT_SECRET!,
    redirectUri: process.env.QB_REDIRECT_URI!,
    environment: process.env.QB_ENVIRONMENT ?? 'sandbox',
    scopes: process.env.QB_SCOPES ?? 'com.intuit.quickbooks.accounting',
  };
  
  export const QB_AUTH_URL = 'https://appcenter.intuit.com/connect/oauth2';
  export const QB_TOKEN_URL = 'https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer';
  