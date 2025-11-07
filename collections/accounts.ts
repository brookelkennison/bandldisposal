import type { CollectionConfig } from 'payload'

const Accounts: CollectionConfig = {
  slug: 'accounts',
  labels: { singular: 'Account', plural: 'Accounts' },
  admin: {
    useAsTitle: 'accountNumber',
    defaultColumns: ['accountNumber', 'email', 'name', 'updatedAt'],
    description: 'Customer accounts with authentication and contact information.',
  },
  auth: true, // Enables customer authentication via /api/accounts/login
  access: {
    read: () => true,
    create: ({ req }) => ['admin', 'staff'].includes(req.user?.role),
    update: ({ req }) => ['admin', 'staff'].includes(req.user?.role),
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
        return data
      },
    ],
    afterChange: [
      async ({ doc, req, operation }) => {
        // Send password setup email when account is created
        // This allows customers to set their own password
        if (operation === 'create' && doc.email) {
          try {
            // Use Payload's forgot password functionality to send setup email
            await req.payload.forgotPassword({
              collection: 'accounts',
              data: {
                email: doc.email,
              },
              req,
            })
          } catch (error) {
            console.error('Error sending password setup email:', error)
            // Don't throw - account creation should succeed even if email fails
          }
        }
      },
    ],
  },
  fields: [
    {
      name: 'email',
      label: 'Email',
      type: 'email',
      required: true,
      unique: true,
      admin: {
        hidden: true,
      },
    },
    // Password fields are automatically added by auth: true
    // They cannot be overridden, but hooks prevent password updates from admin
    // Passwords are managed entirely by customers through the frontend
    {
      name: 'name',
      label: 'Name',
      type: 'text',
      required: true,
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
            description: 'Phone number',
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
  ],
}

export default Accounts

