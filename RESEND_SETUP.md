# Resend Email Setup Guide

## Quick Setup

### 1. Get Your Resend API Key

1. Sign up at [Resend](https://resend.com)
2. Go to [API Keys](https://resend.com/api-keys)
3. Click "Create API Key"
4. Name it (e.g., "B&L Disposal Production")
5. Select "Sending access" permission
6. Copy the API key (starts with `re_`)

### 2. Verify Your Domain (Recommended for Production)

1. Go to [Domains](https://resend.com/domains) in Resend dashboard
2. Click "Add Domain"
3. Enter your domain (e.g., `yourdomain.com`)
4. Add the DNS records to your domain:
   - **SPF Record**: `v=spf1 include:_spf.resend.com ~all`
   - **DKIM Record**: (provided by Resend)
   - **DMARC Record**: (optional but recommended)
5. Wait for verification (usually a few minutes)

### 3. Update Environment Variables

Add to your `.env` file:

```env
# Resend Configuration (Preferred)
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Email Settings
SMTP_FROM_ADDRESS=noreply@yourdomain.com
SMTP_FROM_NAME=B&L Disposal
NEXT_PUBLIC_APP_URL=https://yourdomain.com
```

**Note**: For development/testing, you can use Resend's test domain:
```env
SMTP_FROM_ADDRESS=onboarding@resend.dev
```

### 4. Test Email Sending

1. Start your dev server: `npm run dev`
2. Submit a test service request
3. Check server logs for: `[Resend] Email sent successfully`
4. Check the email inbox

## Development Testing

### Option 1: Use Resend Test Domain
- Use `onboarding@resend.dev` as from address
- No domain verification needed
- Perfect for development

### Option 2: Use Mailtrap (Alternative)
If you prefer to catch emails locally:
```env
# Keep SMTP for Mailtrap
SMTP_HOST=smtp.mailtrap.io
SMTP_PORT=2525
SMTP_USER=your-mailtrap-username
SMTP_PASS=your-mailtrap-password
# Don't set RESEND_API_KEY to use SMTP fallback
```

## Production Checklist

- [ ] Resend account created
- [ ] API key added to `.env`
- [ ] Domain verified in Resend dashboard
- [ ] DNS records added and verified
- [ ] Test email sent successfully
- [ ] `SMTP_FROM_ADDRESS` uses verified domain
- [ ] Environment variables set in production

## Benefits of Resend

✅ **Better Deliverability**: Higher inbox rates than SMTP
✅ **Analytics**: Track opens, clicks, bounces in dashboard
✅ **Webhooks**: Get real-time delivery status
✅ **Simple API**: Easy to use and integrate
✅ **Free Tier**: 3,000 emails/month free
✅ **React Email**: Built-in support for React email templates

## Troubleshooting

### "Invalid API Key"
- Check that `RESEND_API_KEY` starts with `re_`
- Verify the key is correct in Resend dashboard
- Make sure there are no extra spaces in `.env`

### "Domain not verified"
- For production, verify your domain in Resend
- For development, use `onboarding@resend.dev`
- Check DNS records are correct

### "Email not sending"
- Check server logs for error messages
- Verify `RESEND_API_KEY` is set in environment
- Check Resend dashboard for error details
- Ensure `SMTP_FROM_ADDRESS` is valid

## Migration from SMTP

The system automatically falls back to SMTP if `RESEND_API_KEY` is not set, so you can:
1. Add Resend API key
2. Test thoroughly
3. Remove SMTP config when ready

No code changes needed - just environment variables!

