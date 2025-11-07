# Password Setup Email Configuration

## Overview

When a new account is created in the Payload admin panel, the system automatically sends a password setup email to the account's email address. The user can then click the link in the email to set their password.

## How It Works

1. **Admin creates account**: Admin/staff creates a new account with just an email address (no password needed)
2. **Auto-generate account number**: System automatically generates account number (e.g., ACC-000001)
3. **Send password setup email**: System automatically sends a "forgot password" email with a link to set password
4. **User sets password**: User clicks link in email and sets their password

## Email Configuration

### Environment Variables

Add these to your `.env` file:

```env
# SMTP Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM_ADDRESS=noreply@yourdomain.com
SMTP_FROM_NAME=BandL Disposal
```

### Common SMTP Providers

#### Gmail
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password  # Use App Password, not regular password
```

**Note**: For Gmail, you need to:
1. Enable 2-factor authentication
2. Generate an App Password: https://myaccount.google.com/apppasswords

#### SendGrid
```env
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=apikey
SMTP_PASS=your-sendgrid-api-key
```

#### Mailgun
```env
SMTP_HOST=smtp.mailgun.org
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-mailgun-username
SMTP_PASS=your-mailgun-password
```

#### AWS SES
```env
SMTP_HOST=email-smtp.us-east-1.amazonaws.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-aws-ses-username
SMTP_PASS=your-aws-ses-password
```

## Customizing the Email Template

Payload uses default email templates for password reset. To customize:

1. Create custom email templates in your Payload config
2. Override the default email content
3. Customize the email subject and body

### Example: Custom Email Template

You can customize the email by modifying the `forgotPassword` hook in your accounts collection or by creating custom email templates.

## Testing

### Test Email Sending

1. Create a new account in Payload admin panel
2. Check the email inbox for the password setup email
3. Click the link in the email
4. Set a password
5. Login with the new password

### Development Testing

For development, you can use services like:
- **Mailtrap**: https://mailtrap.io (catches emails without sending)
- **MailHog**: https://github.com/mailhog/MailHog (local email testing)
- **Ethereal Email**: https://ethereal.email (generates test accounts)

#### Using Mailtrap

```env
SMTP_HOST=smtp.mailtrap.io
SMTP_PORT=2525
SMTP_SECURE=false
SMTP_USER=your-mailtrap-username
SMTP_PASS=your-mailtrap-password
```

## Troubleshooting

### Email Not Sending

1. **Check SMTP credentials**: Verify all SMTP environment variables are correct
2. **Check email adapter**: Ensure `@payloadcms/email-nodemailer` is installed
3. **Check logs**: Look for error messages in console
4. **Test SMTP connection**: Use a tool like `telnet` or `openssl` to test SMTP

### Email Goes to Spam

1. **SPF Records**: Add SPF records to your domain DNS
2. **DKIM**: Set up DKIM signing
3. **From Address**: Use a verified domain email address
4. **Email Content**: Avoid spam trigger words

### Password Reset Link Not Working

1. **Check URL**: Ensure the reset URL is correct
2. **Check token**: Verify the token hasn't expired
3. **Check frontend**: Ensure the frontend route is set up correctly

## Frontend Integration

### Password Reset Page

Create a page at `/reset-password` that handles the password reset:

```typescript
// app/reset-password/page.tsx
'use client'

import { useState } from 'react'

export default function ResetPasswordPage() {
  const [token, setToken] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (password !== confirmPassword) {
      alert('Passwords do not match')
      return
    }

    const response = await fetch('/api/accounts/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, password }),
    })

    if (response.ok) {
      alert('Password reset successfully!')
      window.location.href = '/login'
    } else {
      alert('Password reset failed')
    }
  }

  // Get token from URL query params
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    setToken(params.get('token') || '')
  }, [])

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="password"
        placeholder="New Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
      />
      <input
        type="password"
        placeholder="Confirm Password"
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
        required
      />
      <button type="submit">Reset Password</button>
    </form>
  )
}
```

### Update Email URL

In your Payload config, you can customize the reset password URL:

```typescript
// payload.config.ts
export default buildConfig({
  // ... other config
  collections: [
    Accounts: {
      // ... account config
      auth: {
        forgotPassword: {
          generateEmailURL: ({ token, user }) => {
            return `${process.env.NEXT_PUBLIC_APP_URL}/reset-password?token=${token}`
          },
        },
      },
    },
  ],
})
```

## Summary

✅ **Automatic**: Password setup email sent automatically on account creation  
✅ **Secure**: Uses Payload's built-in password reset functionality  
✅ **Customizable**: Can customize email templates and URLs  
✅ **Flexible**: Works with any SMTP provider  

The system is now configured to automatically send password setup emails when new accounts are created!

