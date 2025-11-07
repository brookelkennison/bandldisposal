import { buildConfig } from 'payload'
import { mongooseAdapter } from '@payloadcms/db-mongodb'
import { nodemailerAdapter } from '@payloadcms/email-nodemailer'
import nodemailer from 'nodemailer'
import Accounts from './collections/accounts'
import Boroughs from './collections/boroughs'
import Users from './collections/users'

if (!process.env.PAYLOAD_SECRET) {
  throw new Error('PAYLOAD_SECRET environment variable is required')
}

if (!process.env.DATABASE_URI) {
  throw new Error('DATABASE_URI environment variable is required')
}

const payloadSecret = process.env.PAYLOAD_SECRET!
const databaseUri = process.env.DATABASE_URI!

// Email configuration
const emailAdapter = process.env.SMTP_HOST
  ? nodemailerAdapter({
      defaultFromAddress: process.env.SMTP_FROM_ADDRESS || 'noreply@example.com',
      defaultFromName: process.env.SMTP_FROM_NAME || 'BandL Disposal',
      transport: nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      }),
    })
  : undefined

export default buildConfig({
  secret: payloadSecret,
  db: mongooseAdapter({
    url: databaseUri,
  }),
  email: emailAdapter,
  collections: [
    Users,
    {
      slug: 'pages',
      fields: [
        {
          name: 'title',
          type: 'text',
        },
      ],
    },
    Boroughs,
    Accounts,
  ],
})