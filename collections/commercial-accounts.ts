import type { CollectionConfig } from 'payload'

const CommercialAccounts: CollectionConfig = {
  slug: 'commercial-accounts',
  labels: { singular: 'Commercial Account', plural: 'Commercial Accounts' },
  admin: {
    group: 'Accounts',
    useAsTitle: 'accountNumber',
    defaultColumns: [
      'accountNumber',
      'name',
      'serviceInfo.serviceStatus',
      'serviceInfo.serviceStartDate',
      'billingInfo.nextBillingDate',
      'billingInfo.accountBalance',
      'paymentInfo.isLate',
      'paymentInfo.latePaymentCount',
      'updatedAt',
    ],
    description: 'Commercial customer accounts with authentication, service, and billing information.',
  },
  auth: {
    forgotPassword: {
      generateEmailHTML: (args) => {
        const token = args?.token || '';
        const user = args?.user || {};
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
        const resetUrl = `${baseUrl}/reset-password?token=${token}`;
        return `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background-color: #002F1F; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
              .content { background-color: #f9f9f9; padding: 20px; border: 1px solid #ddd; }
              .button { display: inline-block; padding: 12px 24px; background-color: #6ABF43; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; font-weight: bold; }
              .footer { margin-top: 20px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 12px; color: #666; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>B&L Disposal</h1>
                <p>Set Up Your Account Password</p>
              </div>
              <div class="content">
                <p>Hello ${user.name || 'Valued Customer'},</p>
                <p>Your commercial account has been created! To complete your account setup, please set your password by clicking the button below:</p>
                <p style="text-align: center;">
                  <a href="${resetUrl}" class="button">Set Your Password</a>
                </p>
                <p>Or copy and paste this link into your browser:</p>
                <p style="word-break: break-all; color: #666;">${resetUrl}</p>
                <p>This link will expire in 24 hours for security reasons.</p>
                <div class="footer">
                  <p>If you did not request this email, please ignore it.</p>
                  <p>&copy; ${new Date().getFullYear()} B&L Disposal. All rights reserved.</p>
                </div>
              </div>
            </div>
          </body>
          </html>
        `;
      },
      generateEmailSubject: () => {
        return 'Set Up Your B&L Disposal Commercial Account Password';
      },
    },
  }, // Enables customer authentication via /api/commercial-accounts/login
  access: {
    read: ({ req }) => {
      // Allow public read, or users can read their own account
      if (!req.user) return true
      if (['admin', 'staff'].includes(req.user.role)) return true
      // Customers can read their own account
      return {
        id: { equals: req.user.id },
      }
    },
    create: ({ req }) => ['admin', 'staff'].includes(req.user?.role),
    update: ({ req }) => {
      if (['admin', 'staff'].includes(req.user?.role)) return true
      // Customers can update their own account (but password changes are handled separately)
      if (req.user?.collection === 'commercial-accounts') {
        return {
          id: { equals: req.user.id },
        }
      }
      return false
    },
    delete: ({ req }) => ['admin', 'staff'].includes(req.user?.role),
  },
  hooks: {
    beforeValidate: [
      async ({ data, req, operation }) => {
        // Completely remove password fields from admin operations
        // Passwords are managed entirely by customers through the frontend
        if (data && typeof data === 'object') {
          if ('password' in data) {
            delete data.password
          }
          if ('confirmPassword' in data) {
            delete data.confirmPassword
          }
        }
        return data
      },
    ],
    beforeChange: [
      async ({ data, req, operation }) => {
        // Prevent any password updates from admin side
        // Passwords can only be set/reset by customers
        if (data && typeof data === 'object') {
          if ('password' in data) {
            delete data.password
          }
          if ('confirmPassword' in data) {
            delete data.confirmPassword
          }
        }

        // Calculate next billing date based on billing date and cadence
        if (data && typeof data === 'object' && data.billingInfo) {
          const billingInfo = data.billingInfo
          const billingDate = billingInfo.billingDate
          const cadence = billingInfo.billingCadence
          const serviceStartDate = data.serviceInfo?.serviceStartDate

          if (billingDate && cadence) {
            const today = new Date()
            let nextBilling = new Date(today)

            // For weekly/bi-weekly, use service start date or today as base
            // For monthly/quarterly/annually, use billing date (day of month)
            if (cadence === 'weekly' || cadence === 'bi-weekly') {
              // Use service start date if available, otherwise use today
              if (serviceStartDate) {
                nextBilling = new Date(serviceStartDate)
              }
              // Calculate weeks since start
              const weeksSinceStart = Math.floor(
                (today.getTime() - nextBilling.getTime()) / (1000 * 60 * 60 * 24 * 7)
              )
              const periodsSinceStart = cadence === 'weekly' ? weeksSinceStart : Math.floor(weeksSinceStart / 2)
              const periodsToAdd = cadence === 'weekly' ? periodsSinceStart + 1 : (periodsSinceStart + 1) * 2
              nextBilling.setDate(nextBilling.getDate() + periodsToAdd * 7)
            } else {
              // For monthly/quarterly/annually, use day of month
              nextBilling.setDate(billingDate)

              // If the billing date has passed this month, move to next period
              if (nextBilling < today) {
                switch (cadence) {
                  case 'monthly':
                    nextBilling.setMonth(nextBilling.getMonth() + 1)
                    break
                  case 'quarterly':
                    nextBilling.setMonth(nextBilling.getMonth() + 3)
                    break
                  case 'annually':
                    nextBilling.setFullYear(nextBilling.getFullYear() + 1)
                    break
                }
              }
            }

            // Format as YYYY-MM-DD for Payload date field
            const year = nextBilling.getFullYear()
            const month = String(nextBilling.getMonth() + 1).padStart(2, '0')
            const day = String(nextBilling.getDate()).padStart(2, '0')
            billingInfo.nextBillingDate = `${year}-${month}-${day}`
          }
        }

        // Check if account is late based on billing date and balance
        if (data && typeof data === 'object' && data.billingInfo && data.paymentInfo) {
          const billingInfo = data.billingInfo
          const paymentInfo = data.paymentInfo
          const accountBalance = billingInfo.accountBalance || 0
          const nextBillingDate = billingInfo.nextBillingDate
          const lastPaymentDate = paymentInfo.lastPaymentDate
          const gracePeriodDays = paymentInfo.gracePeriodDays || 5

          if (nextBillingDate && accountBalance > 0) {
            const today = new Date()
            const dueDate = new Date(nextBillingDate)
            
            // Add grace period to due date
            const lateDate = new Date(dueDate)
            lateDate.setDate(lateDate.getDate() + gracePeriodDays)

            // Check if payment is late
            // Account is late if:
            // 1. Today is past the due date + grace period
            // 2. Account has a positive balance
            // 3. Last payment was before the due date (or no payment recorded)
            const isLate = today > lateDate && 
                          accountBalance > 0 && 
                          (!lastPaymentDate || new Date(lastPaymentDate) < dueDate)

            paymentInfo.isLate = isLate ? 'late' : 'current'
          } else if (accountBalance <= 0) {
            // If balance is zero or negative, account is not late
            paymentInfo.isLate = 'current'
          }
        }

        return data
      },
    ],
    afterChange: [
      async ({ doc, req, operation }) => {
        // Send password setup email when account is created
        // This allows customers to set their own password
        if (operation === 'create' && doc.email) {
          try {
            console.log('[Commercial Accounts Hook] Sending password setup email to:', doc.email);
            // Use Payload's forgot password functionality to send setup email
            await req.payload.forgotPassword({
              collection: 'commercial-accounts',
              data: {
                email: doc.email,
              },
              req,
            })
            console.log('[Commercial Accounts Hook] Password setup email sent successfully to:', doc.email);
          } catch (error) {
            console.error('[Commercial Accounts Hook] Error sending password setup email:', error);
            // Don't throw - account creation should succeed even if email fails
          }
        }
      },
    ],
  },
  fields: [
    // Password fields are automatically added by auth: true
    // They cannot be overridden, but hooks prevent password updates from admin
    // Passwords are managed entirely by customers through the frontend
    {
      name: 'name',
      label: 'Business Name',
      type: 'text',
      required: true,
      admin: {
        description: 'Commercial business name',
      },
    },
    {
      name: 'email',
      label: 'Email Address',
      type: 'email',
      required: true,
      unique: true,
      admin: {
        description: 'Business email address',
      },
    },
    {
      name: 'accountNumber',
      label: 'Account Number',
      type: 'text',
      required: true,
      unique: true,
      index: true,
      admin: {
        description: 'Auto-generated account identifier',
        readOnly: true,
      },
    },
    {
      name: 'onboardingToken',
      label: 'Onboarding Token',
      type: 'text',
      admin: {
        description: 'Token used for account onboarding process',
      },
    },
    {
      name: 'stripeCustomerId',
      label: 'Stripe Customer ID',
      type: 'text',
      unique: true,
      index: true,
      admin: {
        description: 'Stripe customer identifier (auto-synced)',
        readOnly: true,
      },
    },
    {
      name: 'contactInfo',
      label: 'Contact Information',
      type: 'group',
      fields: [
        {
          name: 'phone',
          label: 'Phone',
          type: 'text',
          admin: {
            description: 'Business phone number',
          },
        },
        {
          name: 'address',
          label: 'Address',
          type: 'text',
          admin: {
            description: 'Street address',
          },
        },
        {
          name: 'city',
          label: 'City',
          type: 'text',
        },
        {
          name: 'state',
          label: 'State',
          type: 'text',
          admin: {
            description: 'State abbreviation (e.g., NY, CA)',
          },
        },
        {
          name: 'zip',
          label: 'ZIP Code',
          type: 'text',
          admin: {
            description: 'ZIP or postal code',
          },
          validate: (val: unknown) => {
            const zipStr = String(val ?? '').trim()
            return !zipStr || /^\d{5}(-\d{4})?$/.test(zipStr) || 'Enter a valid ZIP code (e.g., 12345 or 12345-6789)'
          },
        },
      ],
    },
    {
      name: 'serviceInfo',
      label: 'Service Information',
      type: 'group',
      fields: [
        {
          name: 'serviceStartDate',
          label: 'Service Start Date',
          type: 'date',
          required: true,
          admin: {
            description: 'Date when service began',
          },
        },
        {
          name: 'serviceStatus',
          label: 'Service Status',
          type: 'select',
          required: true,
          defaultValue: 'active',
          options: [
            { label: 'Active', value: 'active' },
            { label: 'Suspended', value: 'suspended' },
            { label: 'Cancelled', value: 'cancelled' },
            { label: 'Pending', value: 'pending' },
          ],
          admin: {
            description: 'Current status of the service',
          },
        },
        {
          name: 'pickupDays',
          label: 'Pickup Days',
          type: 'select',
          hasMany: true,
          required: true,
          options: [
            { label: 'Monday', value: 'monday' },
            { label: 'Tuesday', value: 'tuesday' },
            { label: 'Wednesday', value: 'wednesday' },
            { label: 'Thursday', value: 'thursday' },
            { label: 'Friday', value: 'friday' },
            { label: 'Saturday', value: 'saturday' },
          ],
          admin: {
            description: 'Days of the week for trash pickup',
          },
        },
        {
          name: 'serviceAddress',
          label: 'Service Address',
          type: 'group',
          admin: {
            description: 'Service address (if different from contact address)',
          },
          fields: [
            {
              name: 'address',
              label: 'Address',
              type: 'text',
            },
            {
              name: 'city',
              label: 'City',
              type: 'text',
            },
            {
              name: 'state',
              label: 'State',
              type: 'text',
              admin: {
                description: 'State abbreviation (e.g., NY, CA)',
              },
            },
            {
              name: 'zip',
              label: 'ZIP Code',
              type: 'text',
            },
          ],
        },
      ],
    },
    {
      name: 'billingInfo',
      label: 'Billing Information',
      type: 'group',
      fields: [
        {
          name: 'billingDate',
          label: 'Billing Date',
          type: 'number',
          required: true,
          min: 1,
          max: 31,
          admin: {
            description: 'Day of the month when billing occurs (1-31)',
          },
        },
        {
          name: 'billingCadence',
          label: 'Billing Cadence',
          type: 'select',
          required: true,
          defaultValue: 'monthly',
          options: [
            { label: 'Weekly', value: 'weekly' },
            { label: 'Bi-Weekly', value: 'bi-weekly' },
            { label: 'Monthly', value: 'monthly' },
            { label: 'Quarterly', value: 'quarterly' },
            { label: 'Annually', value: 'annually' },
          ],
          admin: {
            description: 'Frequency of billing',
          },
        },
        {
          name: 'nextBillingDate',
          label: 'Next Billing Date',
          type: 'date',
          admin: {
            description: 'Calculated next billing date',
            readOnly: true,
          },
        },
        {
          name: 'accountBalance',
          label: 'Account Balance',
          type: 'number',
          defaultValue: 0,
          admin: {
            description: 'Current outstanding balance (negative = credit)',
          },
        },
      ],
    },
    {
      name: 'paymentInfo',
      label: 'Payment Information',
      type: 'group',
      fields: [
        {
          name: 'paymentMethod',
          label: 'Payment Method',
          type: 'select',
          options: [
            { label: 'Credit Card', value: 'credit-card' },
            { label: 'Debit Card', value: 'debit-card' },
            { label: 'Bank Account (ACH)', value: 'ach' },
            { label: 'Check', value: 'check' },
            { label: 'Cash', value: 'cash' },
            { label: 'Other', value: 'other' },
          ],
          admin: {
            description: 'Preferred payment method',
          },
        },
        {
          name: 'lastPaymentDate',
          label: 'Last Payment Date',
          type: 'date',
          admin: {
            description: 'Date of last payment received',
          },
        },
        {
          name: 'lastPaymentAmount',
          label: 'Last Payment Amount',
          type: 'number',
          admin: {
            description: 'Amount of last payment',
          },
        },
        {
          name: 'autoPay',
          label: 'Auto Pay',
          type: 'checkbox',
          defaultValue: false,
          admin: {
            description: 'Enable automatic payments',
          },
        },
        {
          name: 'isLate',
          label: 'Payment Status',
          type: 'select',
          defaultValue: 'current',
          options: [
            { label: 'Current', value: 'current' },
            { label: 'Late', value: 'late' },
          ],
          admin: {
            description: 'Automatically calculated based on billing date, balance, and grace period',
            readOnly: true,
          },
        },
        {
          name: 'latePaymentCount',
          label: 'Total Late Payments',
          type: 'number',
          defaultValue: 0,
          admin: {
            description: 'Total number of late payments on record',
          },
        },
        {
          name: 'lastLatePaymentDate',
          label: 'Last Late Payment Date',
          type: 'date',
          admin: {
            description: 'Date of the most recent late payment',
          },
        },
        {
          name: 'totalLateFees',
          label: 'Total Late Fees',
          type: 'number',
          defaultValue: 0,
          admin: {
            description: 'Total late fees accrued (in dollars)',
          },
        },
        {
          name: 'gracePeriodDays',
          label: 'Grace Period (Days)',
          type: 'number',
          defaultValue: 5,
          min: 0,
          admin: {
            description: 'Number of days after due date before payment is considered late',
          },
        },
        {
          name: 'latePaymentHistory',
          label: 'Late Payment History',
          type: 'array',
          admin: {
            description: 'Historical record of late payments',
          },
          fields: [
            {
              name: 'dueDate',
              label: 'Due Date',
              type: 'date',
              required: true,
            },
            {
              name: 'paidDate',
              label: 'Paid Date',
              type: 'date',
              required: true,
            },
            {
              name: 'daysLate',
              label: 'Days Late',
              type: 'number',
              admin: {
                description: 'Number of days payment was late',
              },
            },
            {
              name: 'amount',
              label: 'Amount',
              type: 'number',
              required: true,
              admin: {
                description: 'Amount that was late',
              },
            },
            {
              name: 'lateFee',
              label: 'Late Fee',
              type: 'number',
              defaultValue: 0,
              admin: {
                description: 'Late fee charged for this payment',
              },
            },
            {
              name: 'notes',
              label: 'Notes',
              type: 'textarea',
              admin: {
                description: 'Additional notes about this late payment',
              },
            },
          ],
        },
      ],
    },
  ],
}

export default CommercialAccounts

