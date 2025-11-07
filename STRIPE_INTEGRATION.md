# Stripe Integration Architecture

## Overview

This document explains how Payload accounts integrate with Stripe for payments while maintaining Payload as the source of truth for account data.

## Architecture Pattern

```
┌─────────────────┐         ┌──────────────────┐
│   Frontend      │         │   Payload CMS    │
│   (Next.js)     │◄────────┤   (Accounts)     │
└────────┬────────┘         └────────┬─────────┘
         │                           │
         │                           │ Sync
         │                           ▼
         │                  ┌──────────────────┐
         └─────────────────►│     Stripe       │
                            │   (Payments)     │
                            └──────────────────┘
```

## Key Principles

1. **Payload = Source of Truth**: All account data lives in Payload
2. **Stripe = Payment Processor**: Stripe handles payments/subscriptions only
3. **Bidirectional Sync**: Account data syncs to Stripe, Stripe webhooks update Payload
4. **Payload Auth**: Users login through Payload, not Stripe

## Authentication Flow

### User Login
1. User logs in through **Payload's auth system** (not Stripe)
2. Frontend calls Payload API: `POST /api/accounts/login`
3. Payload validates credentials and returns JWT token
4. Frontend stores token and uses it for authenticated requests

### Example Login Flow:
```typescript
// Frontend login
const response = await fetch('/api/accounts/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email, password }),
})

const { token, user } = await response.json()
// Store token in localStorage/cookies
```

## Payment Flow

### 1. Account Creation
- Admin/staff creates account in Payload admin panel
- `beforeChange` hook automatically creates Stripe customer
- Stripe customer ID is stored in `stripeCustomerId` field

### 2. Frontend Payment
- User logs in through Payload
- Frontend calls your API route: `POST /api/create-checkout-session`
- API route:
  - Gets account from Payload (using auth token)
  - Gets Stripe customer ID from account
  - Creates Stripe Checkout session
  - Returns session URL
- Frontend redirects to Stripe Checkout
- After payment, Stripe redirects back with session ID
- Your webhook handler updates Payload account

### Example Payment Flow:
```typescript
// Frontend: Create checkout session
const response = await fetch('/api/create-checkout-session', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    priceId: 'price_xxx',
    successUrl: `${window.location.origin}/success`,
    cancelUrl: `${window.location.origin}/cancel`,
  }),
})

const { url } = await response.json()
window.location.href = url // Redirect to Stripe Checkout
```

## Implementation Steps

### 1. Install Stripe
```bash
npm install stripe
```

### 2. Add Environment Variables
```env
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

### 3. Update Accounts Collection
Add the `syncAccountToStripe` hook to your accounts collection:

```typescript
// collections/accounts.ts
import { syncAccountToStripe } from './accounts-stripe-sync'

const Accounts: CollectionConfig = {
  // ... existing config
  hooks: {
    beforeChange: [
      async ({ data, req, operation }) => {
        // Auto-generate accountNumber
        if (operation === 'create' && !data.accountNumber) {
          // ... existing code
        }
        // Sync to Stripe
        return await syncAccountToStripe({ data, req, operation })
      },
    ],
  },
}
```

### 4. Create API Routes

#### Create Checkout Session
`app/api/create-checkout-session/route.ts`:
```typescript
import { getPayload } from 'payload'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

export async function POST(req: Request) {
  const payload = await getPayload()
  const { priceId, successUrl, cancelUrl } = await req.json()
  
  // Get authenticated user from token
  const token = req.headers.get('authorization')?.replace('Bearer ', '')
  const user = await payload.auth({ headers: { authorization: `Bearer ${token}` } })
  
  // Get account
  const account = await payload.find({
    collection: 'accounts',
    where: { email: { equals: user.user.email } },
  })
  
  // Create Stripe checkout session
  const session = await stripe.checkout.sessions.create({
    customer: account.docs[0].stripeCustomerId,
    payment_method_types: ['card'],
    line_items: [{ price: priceId, quantity: 1 }],
    mode: 'subscription',
    success_url: successUrl,
    cancel_url: cancelUrl,
  })
  
  return Response.json({ url: session.url })
}
```

#### Stripe Webhook Handler
`app/api/stripe-webhook/route.ts`:
```typescript
import { getPayload } from 'payload'
import Stripe from 'stripe'
import { headers } from 'next/headers'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

export async function POST(req: Request) {
  const payload = await getPayload()
  const body = await req.text()
  const signature = (await headers()).get('stripe-signature')!
  
  let event: Stripe.Event
  
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (err) {
    return Response.json({ error: 'Webhook signature verification failed' }, { status: 400 })
  }
  
  // Handle different event types
  switch (event.type) {
    case 'checkout.session.completed':
      const session = event.data.object as Stripe.Checkout.Session
      // Update account in Payload
      await payload.update({
        collection: 'accounts',
        where: { stripeCustomerId: { equals: session.customer as string } },
        data: {
          // Update subscription status, etc.
        },
      })
      break
    // Handle other events...
  }
  
  return Response.json({ received: true })
}
```

## Benefits of This Architecture

✅ **Single Source of Truth**: All account data in Payload  
✅ **Flexible Relationships**: Link accounts to boroughs, orders, etc.  
✅ **Admin Management**: Manage accounts through Payload admin  
✅ **Stripe Integration**: Use Stripe for payments without duplicating data  
✅ **Custom Fields**: Add any fields you need (onboardingToken, etc.)  
✅ **Payload Auth**: Standard authentication, not Stripe auth  

## Frontend Integration

### Login Component
```typescript
// Login through Payload
const handleLogin = async (email: string, password: string) => {
  const res = await fetch('/api/accounts/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  })
  const { token, user } = await res.json()
  // Store token, redirect to dashboard
}
```

### Payment Component
```typescript
// After login, create checkout session
const handlePayment = async (priceId: string) => {
  const res = await fetch('/api/create-checkout-session', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` },
    body: JSON.stringify({ priceId, successUrl, cancelUrl }),
  })
  const { url } = await res.json()
  window.location.href = url
}
```

## Summary

- **Login**: Through Payload (`/api/accounts/login`)
- **Account Management**: In Payload admin panel
- **Payments**: Through Stripe Checkout (using Stripe customer ID from Payload)
- **Data Sync**: Automatic via hooks and webhooks
- **Frontend**: Uses Payload API for auth, Stripe for payments

This gives you the best of both worlds: full control over account data in Payload, and powerful payment processing with Stripe.

