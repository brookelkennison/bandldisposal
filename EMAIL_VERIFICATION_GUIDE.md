# Email Verification Guide

## How to Verify Email Flow After Guest Service Request

### Step 1: Check Server Logs

When a guest submits a service request, you should see these log messages in your server console:

**For Residential Accounts:**
```
[Start Service] Creating new residential account for: user@example.com
[Accounts Hook] Sending password setup email to: user@example.com
[Accounts Hook] Password setup email sent successfully to: user@example.com
[Start Service] Account created successfully: <account-id> ACC-000001
[Start Service] Password setup email should have been sent to: user@example.com
```

**For Commercial Accounts:**
```
[Start Service] Creating new commercial account for: business@example.com
[Commercial Accounts Hook] Sending password setup email to: business@example.com
[Commercial Accounts Hook] Password setup email sent successfully to: business@example.com
[Start Service] Account created successfully: <account-id> ACC-000001
[Start Service] Password setup email should have been sent to: business@example.com
```

### Step 2: Check Email Configuration

Ensure your `.env` file has SMTP configuration:

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM_ADDRESS=noreply@yourdomain.com
SMTP_FROM_NAME=B&L Disposal
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Step 3: Test the Flow

1. **Submit a test service request** as a guest (not logged in)
   - Go to `/start-service`
   - Fill out the form with a valid email address
   - Submit the form

2. **Check the console logs** for the messages above

3. **Check the email inbox** for the email address you used
   - Subject: "Set Up Your B&L Disposal Account Password" (residential)
   - Subject: "Set Up Your B&L Disposal Commercial Account Password" (commercial)
   - Should contain a link to `/reset-password?token=...`

### Step 4: Troubleshooting

#### If you see error logs:

**Error: "Error sending password setup email"**
- Check SMTP credentials in `.env`
- Verify SMTP server is accessible
- Check if email adapter is configured in `payload.config.ts`

**Error: "SMTP not configured"**
- Ensure `SMTP_HOST` is set in `.env`
- Restart your development server after adding SMTP config

#### If emails aren't being sent:

1. **Verify hooks are firing:**
   - Check console for `[Accounts Hook]` or `[Commercial Accounts Hook]` messages
   - If you don't see these, the hooks aren't being triggered

2. **Check email adapter:**
   - Verify `emailAdapter` is not `undefined` in `payload.config.ts`
   - Check that `@payloadcms/email-nodemailer` is installed

3. **Test SMTP connection:**
   - Use a service like Mailtrap for development testing
   - Or verify SMTP credentials with your email provider

### Step 5: Development Testing

For development, use **Mailtrap** to catch emails without sending them:

```env
SMTP_HOST=smtp.mailtrap.io
SMTP_PORT=2525
SMTP_SECURE=false
SMTP_USER=your-mailtrap-username
SMTP_PASS=your-mailtrap-password
```

Then check your Mailtrap inbox to see the emails.

### Expected Email Content

The email should contain:
- B&L Disposal branding (green header)
- Welcome message with customer name
- "Set Your Password" button
- Link to `/reset-password?token=...`
- Expiration notice (24 hours)

### Verification Checklist

- [ ] Server logs show account creation
- [ ] Server logs show email sending attempt
- [ ] Server logs show email sent successfully (or error details)
- [ ] Email received in inbox (or Mailtrap)
- [ ] Email contains correct reset link
- [ ] Reset link works when clicked
- [ ] User can set password successfully

## Quick Test Command

To test the email flow quickly:

1. Start your dev server: `npm run dev`
2. Open browser console (F12)
3. Submit a test service request
4. Check server terminal for logs
5. Check email inbox (or Mailtrap)

## Notes

- Emails are sent asynchronously via `afterChange` hooks
- Account creation will succeed even if email fails (error is logged but not thrown)
- Email link expires after 24 hours
- Each account type (residential/commercial) has its own email template

