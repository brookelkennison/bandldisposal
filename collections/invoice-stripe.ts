/**
 * Stripe Invoice Integration for Residential Billing
 * 
 * This module handles creating Stripe invoices from billing records
 * and sending email notifications to residential account holders.
 */

import Stripe from 'stripe'
import type { Payload } from 'payload'
import nodemailer from 'nodemailer'

// Initialize Stripe client
let stripeInstance: Stripe | null = null

function getStripe(): Stripe | null {
  if (!process.env.STRIPE_SECRET_KEY) {
    return null
  }

  if (!stripeInstance) {
    stripeInstance = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2024-12-18.acacia',
    })
  }

  return stripeInstance
}

/**
 * Create a Stripe invoice for a billing record
 */
export async function createStripeInvoice({
  payload,
  billingRecord,
  account,
}: {
  payload: Payload
  billingRecord: any
  account: any
}): Promise<string | null> {
  const stripe = getStripe()
  if (!stripe) {
    console.warn('Stripe not configured - skipping invoice creation')
    return null
  }

  // Ensure account has a Stripe customer ID
  if (!account.stripeCustomerId) {
    console.warn(`Account ${account.accountNumber} does not have a Stripe customer ID`)
    return null
  }

  try {
    // Create invoice item
    const invoiceItem = await stripe.invoiceItems.create({
      customer: account.stripeCustomerId,
      amount: Math.round((billingRecord.amount || 0) * 100), // Convert to cents
      currency: 'usd',
      description: billingRecord.description || `Invoice ${billingRecord.billingNumber}`,
      metadata: {
        billingNumber: billingRecord.billingNumber,
        accountNumber: account.accountNumber,
        payloadBillingId: billingRecord.id,
      },
    })

    // Create invoice
    const invoice = await stripe.invoices.create({
      customer: account.stripeCustomerId,
      collection_method: 'send_invoice', // Send invoice via email
      days_until_due: calculateDaysUntilDue(billingRecord.dueDate),
      description: billingRecord.description || `Invoice ${billingRecord.billingNumber}`,
      metadata: {
        billingNumber: billingRecord.billingNumber,
        accountNumber: account.accountNumber,
        payloadBillingId: billingRecord.id,
      },
      auto_advance: false, // Don't automatically finalize
    })

    // Finalize the invoice (this makes it ready to be sent)
    const finalizedInvoice = await stripe.invoices.finalizeInvoice(invoice.id)

    // Send the invoice via email
    await stripe.invoices.sendInvoice(finalizedInvoice.id)

    return finalizedInvoice.id
  } catch (error) {
    console.error('Error creating Stripe invoice:', error)
    throw error
  }
}

/**
 * Calculate days until due date
 */
function calculateDaysUntilDue(dueDate: string | Date): number {
  const due = typeof dueDate === 'string' ? new Date(dueDate) : dueDate
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  due.setHours(0, 0, 0, 0)
  
  const diffTime = due.getTime() - today.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  
  return Math.max(0, diffDays) // Return at least 0
}

/**
 * Get invoice payment link from Stripe
 */
export async function getInvoicePaymentLink(invoiceId: string): Promise<string | null> {
  const stripe = getStripe()
  if (!stripe) {
    return null
  }

  try {
    const invoice = await stripe.invoices.retrieve(invoiceId)
    return invoice.hosted_invoice_url || null
  } catch (error) {
    console.error('Error retrieving invoice payment link:', error)
    return null
  }
}

/**
 * Send invoice email to residential account holder
 */
export async function sendInvoiceEmail({
  payload,
  account,
  billingRecord,
  invoiceId,
  paymentLink,
}: {
  payload: Payload
  account: any
  billingRecord: any
  invoiceId: string | null
  paymentLink: string | null
}): Promise<void> {
  if (!account.email) {
    console.warn(`Account ${account.accountNumber} does not have an email address`)
    return
  }

  // Format amount as currency
  const formattedAmount = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(billingRecord.amount || 0)

  // Format dates
  const billingDate = billingRecord.billingDate
    ? new Date(billingRecord.billingDate).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : 'N/A'

  const dueDate = billingRecord.dueDate
    ? new Date(billingRecord.dueDate).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : 'N/A'

  // Create email subject
  const subject = `Invoice ${billingRecord.billingNumber} - ${formattedAmount} Due ${dueDate}`

  // Create email HTML body
  const htmlBody = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body {
          font-family: Arial, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
        }
        .header {
          background-color: #4CAF50;
          color: white;
          padding: 20px;
          text-align: center;
          border-radius: 5px 5px 0 0;
        }
        .content {
          background-color: #f9f9f9;
          padding: 20px;
          border: 1px solid #ddd;
        }
        .invoice-details {
          background-color: white;
          padding: 15px;
          margin: 20px 0;
          border-radius: 5px;
          border-left: 4px solid #4CAF50;
        }
        .amount {
          font-size: 24px;
          font-weight: bold;
          color: #4CAF50;
          margin: 10px 0;
        }
        .button {
          display: inline-block;
          padding: 12px 24px;
          background-color: #4CAF50;
          color: white;
          text-decoration: none;
          border-radius: 5px;
          margin: 20px 0;
          font-weight: bold;
        }
        .button:hover {
          background-color: #45a049;
        }
        .footer {
          margin-top: 20px;
          padding-top: 20px;
          border-top: 1px solid #ddd;
          font-size: 12px;
          color: #666;
        }
        .info-row {
          display: flex;
          justify-content: space-between;
          padding: 8px 0;
          border-bottom: 1px solid #eee;
        }
        .info-label {
          font-weight: bold;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>BandL Disposal</h1>
        <p>Invoice Notification</p>
      </div>
      
      <div class="content">
        <p>Dear ${account.name || 'Valued Customer'},</p>
        
        <p>Your invoice has been generated for your waste disposal service.</p>
        
        <div class="invoice-details">
          <h2>Invoice Details</h2>
          <div class="info-row">
            <span class="info-label">Invoice Number:</span>
            <span>${billingRecord.billingNumber}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Account Number:</span>
            <span>${account.accountNumber}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Billing Date:</span>
            <span>${billingDate}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Due Date:</span>
            <span>${dueDate}</span>
          </div>
          ${billingRecord.description ? `
          <div class="info-row">
            <span class="info-label">Description:</span>
            <span>${billingRecord.description}</span>
          </div>
          ` : ''}
          <div class="amount">
            Amount Due: ${formattedAmount}
          </div>
        </div>

        ${paymentLink ? `
        <div style="text-align: center;">
          <a href="${paymentLink}" class="button">Pay Invoice Online</a>
        </div>
        ` : ''}

        <p>Please make payment by the due date to avoid any late fees or service interruptions.</p>

        ${paymentLink ? `
        <p>You can pay securely online by clicking the button above, or visit your account portal to view and pay your invoice.</p>
        ` : `
        <p>Please contact us to arrange payment or visit your account portal to view your invoice.</p>
        `}

        <div class="footer">
          <p><strong>BandL Disposal</strong></p>
          <p>Thank you for your business!</p>
          <p>If you have any questions about this invoice, please contact our customer service team.</p>
        </div>
      </div>
    </body>
    </html>
  `

  // Create plain text version
  const textBody = `
BandL Disposal - Invoice Notification

Dear ${account.name || 'Valued Customer'},

Your invoice has been generated for your waste disposal service.

Invoice Details:
- Invoice Number: ${billingRecord.billingNumber}
- Account Number: ${account.accountNumber}
- Billing Date: ${billingDate}
- Due Date: ${dueDate}
${billingRecord.description ? `- Description: ${billingRecord.description}\n` : ''}
Amount Due: ${formattedAmount}

${paymentLink ? `Pay Invoice Online: ${paymentLink}\n` : ''}

Please make payment by the due date to avoid any late fees or service interruptions.

${paymentLink ? 'You can pay securely online using the link above, or visit your account portal to view and pay your invoice.' : 'Please contact us to arrange payment or visit your account portal to view your invoice.'}

Thank you for your business!

BandL Disposal
  `.trim()

  try {
    // Send email using nodemailer (same configuration as Payload)
    if (!process.env.SMTP_HOST) {
      console.warn('SMTP not configured - skipping invoice email')
      return
    }

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_ACCESS_TOKEN,
        pass: process.env.SMTP_SECRET_TOKEN,
      },
    })

    await transporter.sendMail({
      from: `${process.env.SMTP_FROM_NAME || 'BandL Disposal'} <${process.env.SMTP_FROM_ADDRESS || 'noreply@example.com'}>`,
      to: account.email,
      subject,
      html: htmlBody,
      text: textBody,
    })
  } catch (error) {
    console.error('Error sending invoice email:', error)
  // Don't throw - invoice creation should succeed even if email fails
  }
}

