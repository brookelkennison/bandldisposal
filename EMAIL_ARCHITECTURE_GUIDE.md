# Long-Term Email Architecture Guide

## Current State

- **Setup**: Nodemailer with SMTP
- **Issues**:
  - Synchronous email sending (blocks requests)
  - No retry logic for failed emails
  - No email queue system
  - Limited analytics/tracking
  - No delivery status webhooks
  - Hard to scale

## Recommended Long-Term Solution

### 1. **Transactional Email Service** (Choose One)

#### Option A: **Resend** (Recommended for Modern Apps)
- ✅ Modern API, great DX
- ✅ Built-in React email templates
- ✅ Excellent deliverability
- ✅ Free tier: 3,000 emails/month
- ✅ Simple setup
- ✅ Webhooks for delivery status

**Pricing**: Free up to 3K/month, then $20/month for 50K

#### Option B: **SendGrid**
- ✅ Industry standard, very reliable
- ✅ Excellent analytics dashboard
- ✅ Free tier: 100 emails/day
- ✅ Good for high volume
- ✅ Webhooks and APIs

**Pricing**: Free up to 100/day, then $19.95/month for 50K

#### Option C: **Postmark**
- ✅ Best deliverability rates
- ✅ Excellent for transactional emails
- ✅ Great support
- ✅ Free tier: 100 emails/month
- ⚠️ More expensive at scale

**Pricing**: Free up to 100/month, then $15/month for 10K

#### Option D: **AWS SES**
- ✅ Very cheap at scale ($0.10 per 1,000)
- ✅ Highly scalable
- ✅ Good for enterprise
- ⚠️ More complex setup
- ⚠️ Requires AWS account

**Pricing**: $0.10 per 1,000 emails

### 2. **Email Queue System** (Required for Production)

Use a job queue to:
- Send emails asynchronously (don't block requests)
- Retry failed emails automatically
- Handle rate limiting
- Scale email processing

**Recommended**: **BullMQ** with Redis

### 3. **Complete Architecture**

```
User Action → API Route → Queue Email Job → Email Service → User
                ↓
         (Don't wait for email)
```

## Implementation Plan

### Phase 1: Switch to Transactional Email Service

#### Step 1: Install Resend (Recommended)

```bash
npm install resend
```

#### Step 2: Update Payload Config

```typescript
// payload.config.ts
import { resendAdapter } from '@payloadcms/email-resend'

const emailAdapter = process.env.RESEND_API_KEY
  ? resendAdapter({
      defaultFromAddress: process.env.SMTP_FROM_ADDRESS || 'noreply@yourdomain.com',
      defaultFromName: process.env.SMTP_FROM_NAME || 'B&L Disposal',
      apiKey: process.env.RESEND_API_KEY,
    })
  : undefined
```

#### Step 3: Environment Variables

```env
# Replace SMTP with Resend
RESEND_API_KEY=re_xxxxxxxxxxxxx
SMTP_FROM_ADDRESS=noreply@yourdomain.com
SMTP_FROM_NAME=B&L Disposal
NEXT_PUBLIC_APP_URL=https://yourdomain.com
```

### Phase 2: Implement Email Queue (Critical for Production)

#### Step 1: Install Dependencies

```bash
npm install bullmq ioredis
npm install --save-dev @types/bullmq
```

#### Step 2: Create Email Queue

```typescript
// lib/email-queue.ts
import { Queue, Worker } from 'bullmq';
import Redis from 'ioredis';

const connection = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

export const emailQueue = new Queue('emails', { connection });

// Email job types
export interface EmailJob {
  type: 'password-setup' | 'reminder' | 'invoice' | 'payment-setup';
  to: string;
  subject: string;
  html: string;
  data?: any;
}

// Add email to queue
export async function queueEmail(job: EmailJob) {
  return await emailQueue.add('send-email', job, {
    attempts: 3, // Retry 3 times
    backoff: {
      type: 'exponential',
      delay: 2000, // Start with 2 seconds
    },
  });
}

// Worker to process emails
export function startEmailWorker() {
  const worker = new Worker(
    'emails',
    async (job) => {
      const { type, to, subject, html } = job.data as EmailJob;
      
      // Send via your email service
      // This will be async and won't block
      await sendEmailViaService({ to, subject, html });
    },
    { connection }
  );

  worker.on('completed', (job) => {
    console.log(`Email sent successfully: ${job.id}`);
  });

  worker.on('failed', (job, err) => {
    console.error(`Email failed: ${job?.id}`, err);
  });

  return worker;
}
```

#### Step 3: Update Hooks to Queue Emails

```typescript
// collections/accounts.ts
import { queueEmail } from '@/lib/email-queue';

afterChange: [
  async ({ doc, req, operation }) => {
    if (operation === 'create' && doc.email) {
      // Queue email instead of sending directly
      await queueEmail({
        type: 'password-setup',
        to: doc.email,
        subject: 'Set Up Your B&L Disposal Account Password',
        html: generatePasswordSetupEmail(doc),
      });
    }
  },
],
```

### Phase 3: Email Templates Management

#### Option A: React Email (Recommended with Resend)

```bash
npm install @react-email/components react-email
```

```typescript
// emails/password-setup.tsx
import { Html, Head, Body, Container, Text, Button } from '@react-email/components';

export function PasswordSetupEmail({ name, resetUrl }: { name: string; resetUrl: string }) {
  return (
    <Html>
      <Head />
      <Body style={main}>
        <Container style={container}>
          <Text style={heading}>B&L Disposal</Text>
          <Text>Hello {name},</Text>
          <Text>Your account has been created! Set your password:</Text>
          <Button href={resetUrl} style={button}>
            Set Your Password
          </Button>
        </Container>
      </Body>
    </Html>
  );
}
```

#### Option B: Centralized Template Functions

```typescript
// lib/email-templates.ts
export function generatePasswordSetupEmail(user: { name: string; email: string }, token: string) {
  const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL}/reset-password?token=${token}`;
  
  return `
    <!DOCTYPE html>
    <html>
      <!-- Your template here -->
    </html>
  `;
}
```

### Phase 4: Monitoring & Analytics

#### Track Email Events

```typescript
// lib/email-tracking.ts
export async function trackEmailEvent(
  emailId: string,
  event: 'sent' | 'delivered' | 'opened' | 'clicked' | 'bounced',
  metadata?: any
) {
  // Store in database or analytics service
  await payload.create({
    collection: 'email-events',
    data: {
      emailId,
      event,
      metadata,
      timestamp: new Date(),
    },
  });
}
```

#### Webhook Handler for Delivery Status

```typescript
// app/api/webhooks/resend/route.ts
export async function POST(req: NextRequest) {
  const event = await req.json();
  
  // Handle delivery, opens, clicks, bounces
  switch (event.type) {
    case 'email.delivered':
      await trackEmailEvent(event.data.email_id, 'delivered');
      break;
    case 'email.opened':
      await trackEmailEvent(event.data.email_id, 'opened');
      break;
    // ... etc
  }
  
  return NextResponse.json({ received: true });
}
```

## Recommended Stack (Best Practice)

### For Most Applications:
1. **Resend** - Transactional email service
2. **BullMQ + Redis** - Email queue
3. **React Email** - Template management
4. **Webhooks** - Delivery tracking

### For High Volume (10K+ emails/day):
1. **SendGrid** or **AWS SES** - Email service
2. **BullMQ + Redis** - Email queue
3. **Custom templates** - Template management
4. **Analytics dashboard** - Monitoring

## Migration Path

### Week 1: Switch Email Service
- [ ] Choose email service (Resend recommended)
- [ ] Update Payload config
- [ ] Test email sending
- [ ] Update environment variables

### Week 2: Implement Queue
- [ ] Set up Redis (local or cloud)
- [ ] Install BullMQ
- [ ] Create email queue
- [ ] Update hooks to use queue
- [ ] Test queue processing

### Week 3: Templates & Monitoring
- [ ] Set up React Email templates
- [ ] Create webhook handlers
- [ ] Add email tracking
- [ ] Set up monitoring dashboard

## Cost Comparison

### Current (SMTP):
- Gmail: Free (but limited, not for production)
- SendGrid SMTP: Free tier limited
- **Issues**: No queue, no retry, no analytics

### Recommended (Resend + Queue):
- Resend: $0-20/month (up to 50K emails)
- Redis (Upstash): $0-10/month
- **Total**: ~$10-30/month
- **Benefits**: Queue, retry, analytics, webhooks

### High Volume (SendGrid + Queue):
- SendGrid: $19.95/month (50K emails)
- Redis: $10/month
- **Total**: ~$30/month
- **Benefits**: Enterprise features, better at scale

## Best Practices

1. **Always use a queue** - Never send emails synchronously in production
2. **Retry failed emails** - Configure exponential backoff
3. **Monitor delivery rates** - Track bounces and failures
4. **Use webhooks** - Get real-time delivery status
5. **Template management** - Centralize email templates
6. **Rate limiting** - Respect email service limits
7. **Error handling** - Log failures, don't crash app
8. **Testing** - Use services like Mailtrap in development

## Quick Start: Resend + Queue

1. **Sign up for Resend**: https://resend.com
2. **Get API key** from dashboard
3. **Set up Redis**: Use Upstash (free tier) or local
4. **Install packages**: `npm install resend bullmq ioredis`
5. **Follow implementation steps above**

## Next Steps

1. Choose your email service (Resend recommended)
2. Set up email queue (BullMQ + Redis)
3. Migrate existing email code to use queue
4. Set up monitoring and webhooks
5. Test thoroughly before production

This architecture will scale with your business and provide reliable email delivery.

