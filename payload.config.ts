import { buildConfig, type GlobalConfig } from 'payload'
import { mongooseAdapter } from '@payloadcms/db-mongodb'
import Accounts from './collections/accounts'
import Boroughs from './collections/boroughs'
import CommercialAccounts from './collections/commercial-accounts'
import Invoices from './collections/invoices'
import ResidentialBilling from './collections/residential-billing'
import Users from './collections/users'


if (!process.env.PAYLOAD_SECRET) {
  throw new Error('PAYLOAD_SECRET environment variable is required')
}

if (!process.env.DATABASE_URI) {
  throw new Error('DATABASE_URI environment variable is required')
}

const payloadSecret = process.env.PAYLOAD_SECRET!
const databaseUri = process.env.DATABASE_URI!

const QuickBooksAuth: GlobalConfig = {
  slug: 'quickbooksAuth',
  access: {
    read: () => true,
    update: () => true,
  },
  fields: [
    { name: 'realmId', type: 'text' },
    { name: 'accessToken', type: 'textarea' },
    { name: 'refreshToken', type: 'textarea' },
    { name: 'accessTokenExpiresAt', type: 'number' },
    { name: 'refreshTokenExpiresAt', type: 'number' },
  ],
};


export default buildConfig({
  secret: payloadSecret,
  db: mongooseAdapter({
    url: databaseUri,
  }),
  collections: [
    Users,
    {
      slug: 'pages',
      admin: {
        group: 'Content',
      },
      fields: [
        {
          name: 'title',
          type: 'text',
        },
      ],
    },
    Boroughs,
    Accounts,
    CommercialAccounts,
    Invoices,
    ResidentialBilling,
  ],
  globals: [
    QuickBooksAuth,
  ],
})