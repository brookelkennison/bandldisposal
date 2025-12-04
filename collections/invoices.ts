import type { CollectionConfig } from 'payload';

const Invoices: CollectionConfig = {
  slug: 'invoices',
  admin: {
    useAsTitle: 'invoiceNumber',
    defaultColumns: ['invoiceNumber', 'customer', 'status', 'total'],
  },
  hooks: {
    beforeChange: [
      async ({ data, req, operation, originalDoc }) => {
        // Generate invoice number when customer is selected/changed
        // Only generate if customer is set and invoice number is missing or needs updating
        if (data && typeof data === 'object' && data.customer) {
          // Get customer account to find borough code
          let customerId: string | undefined
          if (data.customer) {
            if (typeof data.customer === 'string') {
              customerId = data.customer
            } else if (data.customer && typeof data.customer === 'object') {
              customerId = data.customer.id || (data.customer as any)._id
            }
          }

          // Check if customer changed (for updates) or if invoice number is missing (for creates)
          const customerChanged = originalDoc && 
            originalDoc.customer && 
            (typeof originalDoc.customer === 'string' 
              ? originalDoc.customer !== customerId 
              : (originalDoc.customer as any).id !== customerId)

          // Generate invoice number if:
          // 1. Creating and invoice number is missing, OR
          // 2. Customer changed and we need to regenerate
          const shouldGenerate = (!data.invoiceNumber || customerChanged) && customerId

          if (shouldGenerate && customerId) {
            try {
              // Get the customer account
              const account = await req.payload.findByID({
                collection: 'accounts',
                id: customerId,
              })

              if (account && account.borough) {
                // Get the borough to find the code
                let boroughId: string | undefined
                if (typeof account.borough === 'string') {
                  boroughId = account.borough
                } else if (account.borough && typeof account.borough === 'object') {
                  boroughId = account.borough.id || (account.borough as any)._id
                }

                if (boroughId) {
                  const borough = await req.payload.findByID({
                    collection: 'boroughs',
                    id: boroughId,
                  })

                  if (borough && borough.code) {
                    const boroughCode = borough.code
                    
                    // Count existing invoices with this borough code prefix
                    // Use contains to narrow down results, then filter by exact prefix
                    const prefix = `${boroughCode}-`
                    const invoicesWithCode = await req.payload.find({
                      collection: 'invoices',
                      where: {
                        invoiceNumber: {
                          contains: boroughCode,
                        },
                      },
                      limit: 1000, // Reasonable limit
                    })
                    
                    // Filter to only those that start with the exact prefix
                    const matchingInvoices = invoicesWithCode.docs.filter((inv: any) => 
                      inv.invoiceNumber && inv.invoiceNumber.startsWith(prefix)
                    )

                    // Generate next sequential number
                    const nextNumber = matchingInvoices.length + 1
                    data.invoiceNumber = `${boroughCode}-${String(nextNumber).padStart(6, '0')}`
                  }
                }
              }
            } catch (error) {
              console.error('Error generating invoice number:', error)
              // Fallback if borough lookup fails
              if (!data.invoiceNumber) {
                const count = await req.payload.count({
                  collection: 'invoices',
                })
                data.invoiceNumber = `INV-${String(count.totalDocs + 1).padStart(6, '0')}`
              }
            }
          }
        }
        return data
      },
    ],
  },
  fields: [
    {
      name: 'customer',
      type: 'relationship',
      relationTo: 'accounts', // << your customer collection slug
      required: true,
      hooks: {
        beforeChange: [
          async ({ value, data, req }) => {
            // When customer is selected, generate invoice number immediately
            if (value && data && typeof data === 'object') {
              let customerId: string | undefined
              if (typeof value === 'string') {
                customerId = value
              } else if (value && typeof value === 'object') {
                customerId = value.id || (value as any)._id
              }

              if (customerId) {
                try {
                  // Get the customer account
                  const account = await req.payload.findByID({
                    collection: 'accounts',
                    id: customerId,
                  })

                  if (account && account.borough) {
                    // Get the borough to find the code
                    let boroughId: string | undefined
                    if (typeof account.borough === 'string') {
                      boroughId = account.borough
                    } else if (account.borough && typeof account.borough === 'object') {
                      boroughId = account.borough.id || (account.borough as any)._id
                    }

                    if (boroughId) {
                      const borough = await req.payload.findByID({
                        collection: 'boroughs',
                        id: boroughId,
                      })

                      if (borough && borough.code) {
                        const boroughCode = borough.code
                        
                        // Count existing invoices with this borough code prefix
                        const prefix = `${boroughCode}-`
                        const invoicesWithCode = await req.payload.find({
                          collection: 'invoices',
                          where: {
                            invoiceNumber: {
                              contains: boroughCode,
                            },
                          },
                          limit: 1000,
                        })
                        
                        // Filter to only those that start with the exact prefix
                        const matchingInvoices = invoicesWithCode.docs.filter((inv: any) => 
                          inv.invoiceNumber && inv.invoiceNumber.startsWith(prefix)
                        )

                        // Generate next sequential number and set it in data
                        const nextNumber = matchingInvoices.length + 1
                        data.invoiceNumber = `${boroughCode}-${String(nextNumber).padStart(6, '0')}`
                      }
                    }
                  }
                } catch (error) {
                  console.error('Error generating invoice number in customer hook:', error)
                }
              }
            }
            return value
          },
        ],
      },
    },
    {
      name: 'invoiceNumber',
      type: 'text',
      required: true,
      unique: true,
      // No defaultValue - will be generated when customer is selected
      admin: {
        description: 'Auto-generated invoice identifier based on customer borough code',
        readOnly: true,
        components: {
          Field: '@/components/InvoiceNumberField#default' as any,
        },
      },
    },
    {
      name: 'status',
      type: 'select',
      options: [
        { label: 'Draft', value: 'draft' },
        { label: 'Pending', value: 'pending' },
        { label: 'Paid', value: 'paid' },
        { label: 'Overdue', value: 'overdue' },
        { label: 'Cancelled', value: 'cancelled' },
      ],
      defaultValue: 'draft',
      required: true,
    },
    {
      name: 'lineItems',
      type: 'array',
      labels: {
        singular: 'Line Item',
        plural: 'Line Items',
      },
      fields: [
        {
          name: 'description',
          type: 'text',
          required: true,
        },
        {
          name: 'quantity',
          type: 'number',
          required: true,
          min: 0,
        },
        {
          name: 'unitPrice',
          type: 'number',
          required: true,
          min: 0,
        },
        {
          name: 'total',
          type: 'number',
          admin: {
            readOnly: true,
          },
        },
      ],
    },
    {
      name: 'subTotal',
      type: 'number',
      admin: { readOnly: true },
    },
    {
      name: 'taxTotal',
      type: 'number',
      admin: { readOnly: true },
    },
    {
      name: 'total',
      type: 'number',
      required: true,
      admin: { readOnly: true },
    },
    {
      name: 'pdfLink',
      type: 'text', // or 'upload' if you’ll store the PDF in Payload media
    },
  ],
};

export default Invoices;