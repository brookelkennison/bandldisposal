import { buildConfig } from 'payload'
import { mongooseAdapter } from '@payloadcms/db-mongodb'

if (!process.env.PAYLOAD_SECRET) {
  throw new Error('PAYLOAD_SECRET environment variable is required')
}

if (!process.env.DATABASE_URI) {
  throw new Error('DATABASE_URI environment variable is required')
}

const payloadSecret = process.env.PAYLOAD_SECRET!
const databaseUri = process.env.DATABASE_URI!

export default buildConfig({
  secret: payloadSecret,
  db: mongooseAdapter({
    url: databaseUri,
  }),
  collections: [
    {
      slug: 'pages',
      fields: [
        {
          name: 'title',
          type: 'text',
        },
      ],
    },
  ],
})