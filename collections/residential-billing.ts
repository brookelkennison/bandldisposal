import type { CollectionConfig } from 'payload'
import { createStripeInvoice, sendInvoiceEmail, getInvoicePaymentLink } from './invoice-stripe'

const ResidentialBilling: CollectionConfig = {
  slug: 'residential-billing',
  labels: { singular: 'Residential Billing', plural: 'Residential Billing Records' },
  admin: {
    group: 'Billing',
    useAsTitle: 'billingNumber',
    defaultColumns: [
      'billingNumber',
      'account',
      'amount',
      'billingDate',
      'dueDate',
      'status',
      'updatedAt',
    ],
    description: 'Billing records for residential accounts. Creating or updating a billing record will automatically update the account balance.',
  },
  access: {
    read: () => true,
    create: ({ req }) => ['admin', 'staff'].includes(req.user?.role),
    update: ({ req }) => ['admin', 'staff'].includes(req.user?.role),
    delete: ({ req }) => ['admin', 'staff'].includes(req.user?.role),
  },
  hooks: {
    beforeChange: [
      async ({ data, req, operation, originalDoc }) => {
        // Auto-generate billing number if creating
        if (operation === 'create' && !data.billingNumber) {
          const count = await req.payload.count({
            collection: 'residential-billing',
          })
          data.billingNumber = `BILL-${String(count.totalDocs + 1).padStart(6, '0')}`
        }

        // Calculate due date if not provided
        if (data.billingDate && !data.dueDate) {
          const billingDate = new Date(data.billingDate)
          const dueDate = new Date(billingDate)
          // Default to 30 days from billing date
          dueDate.setDate(dueDate.getDate() + 30)
          data.dueDate = dueDate.toISOString().split('T')[0]
        }

        // Auto-set status to overdue if due date has passed and not paid/cancelled
        if (data.dueDate && data.status !== 'paid' && data.status !== 'cancelled') {
          const today = new Date()
          today.setHours(0, 0, 0, 0)
          const dueDate = new Date(data.dueDate)
          dueDate.setHours(0, 0, 0, 0)

          if (today > dueDate && (!data.status || data.status === 'pending')) {
            data.status = 'overdue'
          }
        }

        return data
      },
    ],
    afterChange: [
      async ({ doc, req, operation, previousDoc }) => {
        if (!doc.account || typeof doc.account !== 'string') {
          return
        }

        try {
          // Get the account
          const account = await req.payload.findByID({
            collection: 'accounts',
            id: doc.account,
          })

          if (!account) {
            console.error('Account not found for billing record:', doc.account)
            return
          }

          let balanceChange = 0

          if (operation === 'create') {
            // New billing record adds to balance
            balanceChange = doc.amount || 0
          } else if (operation === 'update' && previousDoc) {
            // Update: calculate the difference
            const previousAmount = previousDoc.amount || 0
            const currentAmount = doc.amount || 0
            balanceChange = currentAmount - previousAmount
          } else if (operation === 'delete') {
            // Deletion: subtract the amount
            balanceChange = -(doc.amount || 0)
          }

          // Calculate new balance
          const currentBalance = account.billingInfo?.accountBalance || 0
          const newBalance = currentBalance + balanceChange

          // Prepare update data
          const updateData: any = {
            billingInfo: {
              ...account.billingInfo,
              accountBalance: newBalance,
            },
          }

          // Handle payment status updates
          if (operation === 'update' && previousDoc) {
            const previousStatus = previousDoc.status
            const currentStatus = doc.status
            const previousPaidAmount = previousDoc.paidAmount || 0
            const currentPaidAmount = doc.paidAmount || 0

            // If status changed to paid, subtract paid amount from balance
            if (currentStatus === 'paid' && previousStatus !== 'paid') {
              const paidAmount = currentPaidAmount || doc.amount || 0
              updateData.paymentInfo = {
                ...account.paymentInfo,
                lastPaymentDate: doc.paidDate || new Date().toISOString().split('T')[0],
                lastPaymentAmount: paidAmount,
              }

              // Subtract paid amount from balance
              if (paidAmount > 0) {
                updateData.billingInfo.accountBalance = Math.max(0, newBalance - paidAmount)
              }
            }
            // If status changed from paid to something else, add back the previously paid amount
            else if (previousStatus === 'paid' && currentStatus !== 'paid') {
              if (previousPaidAmount > 0) {
                updateData.billingInfo.accountBalance = newBalance + previousPaidAmount
              }
            }
            // If already paid and paid amount changed, adjust balance
            else if (currentStatus === 'paid' && previousStatus === 'paid') {
              const paidAmountDifference = currentPaidAmount - previousPaidAmount
              if (paidAmountDifference !== 0) {
                updateData.billingInfo.accountBalance = Math.max(0, newBalance - paidAmountDifference)
                if (currentPaidAmount > 0) {
                  updateData.paymentInfo = {
                    ...account.paymentInfo,
                    lastPaymentDate: doc.paidDate || account.paymentInfo?.lastPaymentDate || new Date().toISOString().split('T')[0],
                    lastPaymentAmount: currentPaidAmount,
                  }
                }
              }
            }
          }

          // Check if bill is overdue and update account late status
          const today = new Date()
          const dueDate = doc.dueDate ? new Date(doc.dueDate) : null
          const gracePeriodDays = account.paymentInfo?.gracePeriodDays || 5

          if (dueDate && doc.status !== 'paid' && doc.status !== 'cancelled') {
            const lateDate = new Date(dueDate)
            lateDate.setDate(lateDate.getDate() + gracePeriodDays)
            const isOverdue = today > lateDate

            // Update billing record status if overdue
            if (isOverdue && doc.status === 'pending') {
              await req.payload.update({
                collection: 'residential-billing',
                id: doc.id,
                data: {
                  status: 'overdue',
                },
              })
            }

            // Update account late payment status
            if (!updateData.paymentInfo) {
              updateData.paymentInfo = { ...account.paymentInfo }
            }

            const accountBalance = updateData.billingInfo.accountBalance || 0
            const lastPaymentDate = updateData.paymentInfo.lastPaymentDate || account.paymentInfo?.lastPaymentDate

            if (isOverdue && accountBalance > 0) {
              const paymentWasLate = !lastPaymentDate || new Date(lastPaymentDate) < dueDate
              updateData.paymentInfo.isLate = paymentWasLate ? 'late' : 'current'
            } else if (accountBalance <= 0) {
              updateData.paymentInfo.isLate = 'current'
            }
          }

          // Update the account
          await req.payload.update({
            collection: 'accounts',
            id: doc.account,
            data: updateData,
          })

          // Create Stripe invoice and send email when billing record is created
          if (operation === 'create' && doc.status !== 'cancelled') {
            try {
              // Create Stripe invoice
              const invoiceId = await createStripeInvoice({
                payload: req.payload,
                billingRecord: doc,
                account,
              })

              if (invoiceId) {
                // Update billing record with Stripe invoice ID
                await req.payload.update({
                  collection: 'residential-billing',
                  id: doc.id,
                  data: {
                    stripeInvoiceId: invoiceId,
                  },
                })

                // Get payment link from Stripe
                const paymentLink = await getInvoicePaymentLink(invoiceId)

                // Send invoice email to resident
                await sendInvoiceEmail({
                  payload: req.payload,
                  account,
                  billingRecord: doc,
                  invoiceId,
                  paymentLink,
                })
              } else {
                // If Stripe invoice creation failed, still try to send email without payment link
                await sendInvoiceEmail({
                  payload: req.payload,
                  account,
                  billingRecord: doc,
                  invoiceId: null,
                  paymentLink: null,
                })
              }
            } catch (error) {
              console.error('Error creating Stripe invoice or sending email:', error)
              // Don't throw - billing record should still be saved
              // Try to send email without Stripe invoice
              try {
                await sendInvoiceEmail({
                  payload: req.payload,
                  account,
                  billingRecord: doc,
                  invoiceId: null,
                  paymentLink: null,
                })
              } catch (emailError) {
                console.error('Error sending invoice email:', emailError)
              }
            }
          }
        } catch (error) {
          console.error('Error updating account from billing record:', error)
          // Don't throw - billing record should still be saved
        }
      },
    ],
    afterDelete: [
      async ({ doc, req }) => {
        if (!doc.account || typeof doc.account !== 'string') {
          return
        }

        try {
          // Get the account
          const account = await req.payload.findByID({
            collection: 'accounts',
            id: doc.account,
          })

          if (!account) {
            return
          }

          // Subtract the billing amount from account balance
          const currentBalance = account.billingInfo?.accountBalance || 0
          const billingAmount = doc.amount || 0
          const newBalance = currentBalance - billingAmount

          await req.payload.update({
            collection: 'accounts',
            id: doc.account,
            data: {
              billingInfo: {
                ...account.billingInfo,
                accountBalance: newBalance,
              },
            },
          })
        } catch (error) {
          console.error('Error updating account balance after billing deletion:', error)
        }
      },
    ],
  },
  fields: [
    {
      name: 'billingNumber',
      label: 'Billing Number',
      type: 'text',
      required: true,
      unique: true,
      index: true,
      admin: {
        description: 'Auto-generated billing identifier',
        readOnly: true,
        width: '50%',
      },
    },
    {
      name: 'account',
      label: 'Residential Account',
      type: 'relationship',
      relationTo: 'accounts',
      required: true,
      admin: {
        description: 'Select the residential account for this billing record',
        width: '50%',
      },
    },
    {
      name: 'amount',
      label: 'Billing Amount',
      type: 'number',
      required: true,
      min: 0,
      admin: {
        description: 'Amount to bill (will be added to account balance)',
        width: '33%',
      },
    },
    {
      name: 'billingDate',
      label: 'Billing Date',
      type: 'date',
      required: true,
      admin: {
        description: 'Date when the billing was issued',
        width: '33%',
      },
    },
    {
      name: 'dueDate',
      label: 'Due Date',
      type: 'date',
      required: true,
      admin: {
        description: 'Date when payment is due (defaults to 30 days from billing date)',
        width: '34%',
      },
    },
    {
      name: 'status',
      label: 'Status',
      type: 'select',
      required: true,
      defaultValue: 'pending',
      options: [
        { label: 'Pending', value: 'pending' },
        { label: 'Paid', value: 'paid' },
        { label: 'Overdue', value: 'overdue' },
        { label: 'Cancelled', value: 'cancelled' },
      ],
      admin: {
        description: 'Current status of this billing record',
        width: '33%',
      },
    },
    {
      name: 'paidDate',
      label: 'Paid Date',
      type: 'date',
      admin: {
        description: 'Date when payment was received',
        width: '33%',
      },
    },
    {
      name: 'paidAmount',
      label: 'Paid Amount',
      type: 'number',
      min: 0,
      admin: {
        description: 'Amount that was actually paid (may differ from billing amount)',
        width: '34%',
      },
    },
    {
      name: 'description',
      label: 'Description',
      type: 'textarea',
      admin: {
        description: 'Additional details about this billing record',
        width: '100%',
      },
    },
    {
      name: 'billingPeriod',
      label: 'Billing Period',
      type: 'group',
      admin: {
        description: 'Period this billing covers',
      },
      fields: [
        {
          name: 'startDate',
          label: 'Start Date',
          type: 'date',
          admin: {
            description: 'Start of the billing period',
            width: '50%',
          },
        },
        {
          name: 'endDate',
          label: 'End Date',
          type: 'date',
          admin: {
            description: 'End of the billing period',
            width: '50%',
          },
        },
      ],
    },
    {
      name: 'notes',
      label: 'Notes',
      type: 'textarea',
      admin: {
        description: 'Internal notes about this billing record',
        width: '100%',
      },
    },
    {
      name: 'stripeInvoiceId',
      label: 'Stripe Invoice ID',
      type: 'text',
      admin: {
        description: 'Stripe invoice identifier (auto-created when billing record is created)',
        readOnly: true,
        width: '50%',
      },
    },
  ],
}

export default ResidentialBilling

