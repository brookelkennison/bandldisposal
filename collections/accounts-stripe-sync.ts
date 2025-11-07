/**
 * Stripe Integration Helper for Accounts Collection
 * 
 * This file demonstrates how to sync Payload accounts with Stripe.
 * You'll need to install Stripe: npm install stripe
 * 
 * Usage:
 * 1. Add this hook to your accounts collection's beforeChange hook
 * 2. Set STRIPE_SECRET_KEY in your .env file
 * 3. Create API routes for payment processing
 */

import Stripe from 'stripe'

// Initialize Stripe (you'll need to install: npm install stripe)
// const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
//   apiVersion: '2024-12-18.acacia',
// })

/**
 * Sync account to Stripe when created or updated
 * Add this to your accounts collection's beforeChange hook
 */
export async function syncAccountToStripe({
  data,
  req,
  operation,
}: {
  data: any
  req: any
  operation: 'create' | 'update'
}) {
  // Only sync if Stripe is configured
  if (!process.env.STRIPE_SECRET_KEY) {
    return data
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2024-12-18.acacia',
  })

  try {
    if (operation === 'create') {
      // Create Stripe customer on account creation
      const customer = await stripe.customers.create({
        email: data.email,
        name: data.contactInfo?.name,
        phone: data.contactInfo?.phone,
        address: data.contactInfo?.address
          ? {
              line1: data.contactInfo.address,
              city: data.contactInfo.city,
              state: data.contactInfo.state,
              postal_code: data.contactInfo.zip,
              country: 'US', // Adjust as needed
            }
          : undefined,
        metadata: {
          accountNumber: data.accountNumber,
          payloadAccountId: data.id || 'pending',
        },
      })

      // Store Stripe customer ID
      data.stripeCustomerId = customer.id
    } else if (operation === 'update' && data.stripeCustomerId) {
      // Update Stripe customer when account is updated
      await stripe.customers.update(data.stripeCustomerId, {
        email: data.email,
        name: data.contactInfo?.name,
        phone: data.contactInfo?.phone,
        address: data.contactInfo?.address
          ? {
              line1: data.contactInfo.address,
              city: data.contactInfo.city,
              state: data.contactInfo.state,
              postal_code: data.contactInfo.zip,
              country: 'US',
            }
          : undefined,
        metadata: {
          accountNumber: data.accountNumber,
          payloadAccountId: data.id,
        },
      })
    }
  } catch (error) {
    console.error('Error syncing to Stripe:', error)
    // Don't throw - allow account creation even if Stripe sync fails
  }

  return data
}

/**
 * Example: Create a checkout session for an account
 * Use this in your API routes (e.g., app/api/create-checkout-session/route.ts)
 */
export async function createCheckoutSession({
  accountId,
  priceId,
  successUrl,
  cancelUrl,
}: {
  accountId: string
  priceId: string
  successUrl: string
  cancelUrl: string
}) {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error('Stripe not configured')
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2024-12-18.acacia',
  })

  // Get account from Payload to get Stripe customer ID
  // const account = await payload.findByID({
  //   collection: 'accounts',
  //   id: accountId,
  // })

  // const session = await stripe.checkout.sessions.create({
  //   customer: account.stripeCustomerId,
  //   payment_method_types: ['card'],
  //   line_items: [
  //     {
  //       price: priceId,
  //       quantity: 1,
  //     },
  //   ],
  //   mode: 'subscription', // or 'payment' for one-time
  //   success_url: successUrl,
  //   cancel_url: cancelUrl,
  // })

  // return session
}

