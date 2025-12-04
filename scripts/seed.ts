// Load environment variables from .env file FIRST (before any imports)
// Use require() instead of import to ensure it runs synchronously before ES6 imports are hoisted
const path = require('path')
const dotenv = require('dotenv')

// Explicitly load .env from project root
const envPath = path.resolve(process.cwd(), '.env')
const envResult = dotenv.config({ path: envPath })
if (envResult.error) {
  console.warn(`⚠️  Warning: Could not load .env from ${envPath}:`, envResult.error.message)
}

// Also try .env.local if it exists
const envLocalPath = path.resolve(process.cwd(), '.env.local')
const envLocalResult = dotenv.config({ path: envLocalPath, override: false })
if (envLocalResult.error && envLocalResult.error.code !== 'ENOENT') {
  console.warn(`⚠️  Warning: Could not load .env.local from ${envLocalPath}:`, envLocalResult.error.message)
}

// Debug: Show which env vars are loaded (without showing values)
console.log('🔍 Environment check:')
console.log(`   PAYLOAD_SECRET: ${process.env.PAYLOAD_SECRET ? '✅ Set' : '❌ Not set'}`)
console.log(`   DATABASE_URI: ${process.env.DATABASE_URI ? '✅ Set' : '❌ Not set'}`)
console.log(`   Working directory: ${process.cwd()}`)
console.log(`   .env path: ${envPath}`)
console.log('')

// Verify required environment variables
if (!process.env.PAYLOAD_SECRET) {
  console.error('❌ Error: PAYLOAD_SECRET environment variable is required')
  console.error('   Please create a .env file in the project root with PAYLOAD_SECRET and DATABASE_URI')
  console.error(`   Current working directory: ${process.cwd()}`)
  console.error(`   Looking for .env at: ${envPath}`)
  console.error('   Or set PAYLOAD_SECRET as a system environment variable')
  process.exit(1)
}

if (!process.env.DATABASE_URI) {
  console.error('❌ Error: DATABASE_URI environment variable is required')
  console.error('   Please create a .env file in the project root with PAYLOAD_SECRET and DATABASE_URI')
  console.error(`   Current working directory: ${process.cwd()}`)
  console.error(`   Looking for .env at: ${envPath}`)
  console.error('   Or set DATABASE_URI as a system environment variable')
  process.exit(1)
}

// Import getPayload - when called outside Next.js request context, it automatically uses Local API
import { getPayload } from 'payload'

async function seed() {
  // Dynamically import config AFTER environment variables are loaded
  // This ensures .env is loaded before payload.config.ts checks for env vars
  const config = await import('../payload.config')
  
  // Initialize Payload - automatically uses Local API when called outside request context
  // This bypasses access control, which is what we want for seeding
  const payload = await getPayload({
    config: config.default,
  })

  console.log('🌱 Starting seed process...\n')

  try {
    // 1. Seed Boroughs
    console.log('📍 Seeding Boroughs...')
    const boroughs = [
      {
        code: 'UPT',
        name: 'Upper Township',
        routeDaysGroup: {
          routeDay: ['monday', 'wednesday', 'friday'],
        },
        address: '123 Main Street',
        city: 'Upper Township',
        state: 'NJ',
        zip: '08210',
      },
      {
        code: 'LWT',
        name: 'Lower Township',
        routeDaysGroup: {
          routeDay: ['tuesday', 'thursday'],
        },
        address: '456 Oak Avenue',
        city: 'Lower Township',
        state: 'NJ',
        zip: '08211',
      },
      {
        code: 'MID',
        name: 'Middle Township',
        routeDaysGroup: {
          routeDay: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
        },
        address: '789 Pine Road',
        city: 'Middle Township',
        state: 'NJ',
        zip: '08212',
      },
    ]

    const createdBoroughs = []
    for (const boroughData of boroughs) {
      try {
        // Check if borough already exists
        const existing = await payload.find({
          collection: 'boroughs',
          where: {
            code: {
              equals: boroughData.code,
            },
          },
          limit: 1,
        })

        if (existing.docs.length > 0) {
          console.log(`  ⏭️  Borough ${boroughData.code} already exists, skipping...`)
          createdBoroughs.push(existing.docs[0])
        } else {
          const borough = await payload.create({
            collection: 'boroughs',
            data: boroughData,
          })
          createdBoroughs.push(borough)
          console.log(`  ✅ Created borough: ${borough.name} (${borough.code})`)
        }
      } catch (error) {
        console.error(`  ❌ Error creating borough ${boroughData.code}:`, error)
      }
    }

    // 2. Seed Users
    console.log('\n👥 Seeding Users...')
    const users = [
      {
        email: 'admin@bandldisposal.com',
        password: 'admin123',
        role: 'admin',
      },
      {
        email: 'staff@bandldisposal.com',
        password: 'staff123',
        role: 'staff',
      },
    ]

    const createdUsers = []
    for (const userData of users) {
      try {
        const existing = await payload.find({
          collection: 'users',
          where: {
            email: {
              equals: userData.email,
            },
          },
          limit: 1,
        })

        if (existing.docs.length > 0) {
          console.log(`  ⏭️  User ${userData.email} already exists, skipping...`)
          createdUsers.push(existing.docs[0])
        } else {
          const user = await payload.create({
            collection: 'users',
            data: userData,
          })
          createdUsers.push(user)
          console.log(`  ✅ Created user: ${user.email} (${user.role})`)
        }
      } catch (error) {
        console.error(`  ❌ Error creating user ${userData.email}:`, error)
      }
    }

    // 3. Seed Residential Accounts
    console.log('\n🏠 Seeding Residential Accounts...')
    const residentialAccounts = [
      {
        accountNumber: 'RES-000001',
        name: 'John Smith',
        email: 'john.smith@example.com',
        borough: createdBoroughs[0]?.id,
        contactInfo: {
          phone: '555-0101',
          address: '100 Elm Street',
          city: 'Upper Township',
          state: 'NJ',
          zip: '08210',
        },
        serviceInfo: {
          serviceStartDate: '2024-01-15',
          serviceStatus: 'active',
        },
        billingInfo: {
          billingDate: 15,
          billingCadence: 'monthly',
        },
        paymentInfo: {
          paymentMethod: 'credit-card',
          autoPay: true,
          gracePeriodDays: 5,
        },
      },
      {
        accountNumber: 'RES-000002',
        name: 'Jane Doe',
        email: 'jane.doe@example.com',
        borough: createdBoroughs[1]?.id,
        contactInfo: {
          phone: '555-0102',
          address: '200 Maple Avenue',
          city: 'Lower Township',
          state: 'NJ',
          zip: '08211',
        },
        serviceInfo: {
          serviceStartDate: '2024-02-01',
          serviceStatus: 'active',
        },
        billingInfo: {
          billingDate: 1,
          billingCadence: 'monthly',
        },
        paymentInfo: {
          paymentMethod: 'ach',
          autoPay: false,
          gracePeriodDays: 5,
        },
      },
      {
        accountNumber: 'RES-000003',
        name: 'Bob Johnson',
        email: 'bob.johnson@example.com',
        borough: createdBoroughs[2]?.id,
        contactInfo: {
          phone: '555-0103',
          address: '300 Oak Road',
          city: 'Middle Township',
          state: 'NJ',
          zip: '08212',
        },
        serviceInfo: {
          serviceStartDate: '2023-12-10',
          serviceStatus: 'active',
        },
        billingInfo: {
          billingDate: 10,
          billingCadence: 'bi-weekly',
          accountBalance: 150.00,
        },
        paymentInfo: {
          paymentMethod: 'credit-card',
          autoPay: true,
          gracePeriodDays: 5,
          isLate: 'late',
          latePaymentCount: 1,
        },
      },
    ]

    const createdAccounts = []
    for (const accountData of residentialAccounts) {
      try {
        const existing = await payload.find({
          collection: 'accounts',
          where: {
            accountNumber: {
              equals: accountData.accountNumber,
            },
          },
          limit: 1,
        })

        if (existing.docs.length > 0) {
          console.log(`  ⏭️  Account ${accountData.accountNumber} already exists, skipping...`)
          createdAccounts.push(existing.docs[0])
        } else {
          const account = await payload.create({
            collection: 'accounts',
            data: accountData,
          })
          createdAccounts.push(account)
          console.log(`  ✅ Created account: ${account.accountNumber} - ${account.name}`)
        }
      } catch (error) {
        console.error(`  ❌ Error creating account ${accountData.accountNumber}:`, error)
      }
    }

    // 4. Seed Commercial Accounts
    console.log('\n🏢 Seeding Commercial Accounts...')
    const commercialAccounts = [
      {
        accountNumber: 'COM-000001',
        name: 'ABC Restaurant',
        email: 'contact@abcrestaurant.com',
        contactInfo: {
          phone: '555-0201',
          address: '500 Business Boulevard',
          city: 'Upper Township',
          state: 'NJ',
          zip: '08210',
        },
        serviceInfo: {
          serviceStartDate: '2024-01-01',
          serviceStatus: 'active',
        },
        billingInfo: {
          billingDate: 1,
          billingCadence: 'weekly',
        },
        paymentInfo: {
          paymentMethod: 'ach',
          autoPay: true,
          gracePeriodDays: 7,
        },
      },
      {
        accountNumber: 'COM-000002',
        name: 'XYZ Office Building',
        email: 'admin@xyzoffice.com',
        contactInfo: {
          phone: '555-0202',
          address: '600 Corporate Drive',
          city: 'Middle Township',
          state: 'NJ',
          zip: '08212',
        },
        serviceInfo: {
          serviceStartDate: '2023-11-15',
          serviceStatus: 'active',
        },
        billingInfo: {
          billingDate: 15,
          billingCadence: 'monthly',
          accountBalance: 500.00,
        },
        paymentInfo: {
          paymentMethod: 'credit-card',
          autoPay: false,
          gracePeriodDays: 10,
        },
      },
    ]

    const createdCommercialAccounts = []
    for (const accountData of commercialAccounts) {
      try {
        const existing = await payload.find({
          collection: 'commercial-accounts',
          where: {
            accountNumber: {
              equals: accountData.accountNumber,
            },
          },
          limit: 1,
        })

        if (existing.docs.length > 0) {
          console.log(`  ⏭️  Commercial account ${accountData.accountNumber} already exists, skipping...`)
          createdCommercialAccounts.push(existing.docs[0])
        } else {
          const account = await payload.create({
            collection: 'commercial-accounts',
            data: accountData,
          })
          createdCommercialAccounts.push(account)
          console.log(`  ✅ Created commercial account: ${account.accountNumber} - ${account.name}`)
        }
      } catch (error) {
        console.error(`  ❌ Error creating commercial account ${accountData.accountNumber}:`, error)
      }
    }

    // 5. Seed Residential Billing Records
    console.log('\n💰 Seeding Residential Billing Records...')
    const today = new Date()
    const lastMonth = new Date(today)
    lastMonth.setMonth(lastMonth.getMonth() - 1)
    const nextMonth = new Date(today)
    nextMonth.setMonth(nextMonth.getMonth() + 1)

    const billingRecords = [
      {
        account: createdAccounts[0]?.id,
        amount: 75.00,
        billingDate: lastMonth.toISOString().split('T')[0],
        dueDate: new Date(lastMonth.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        status: 'paid',
        paidDate: lastMonth.toISOString().split('T')[0],
        paidAmount: 75.00,
        description: 'Monthly service fee',
        billingPeriod: {
          startDate: lastMonth.toISOString().split('T')[0],
          endDate: today.toISOString().split('T')[0],
        },
      },
      {
        account: createdAccounts[0]?.id,
        amount: 75.00,
        billingDate: today.toISOString().split('T')[0],
        dueDate: nextMonth.toISOString().split('T')[0],
        status: 'pending',
        description: 'Monthly service fee',
        billingPeriod: {
          startDate: today.toISOString().split('T')[0],
          endDate: nextMonth.toISOString().split('T')[0],
        },
      },
      {
        account: createdAccounts[1]?.id,
        amount: 80.00,
        billingDate: lastMonth.toISOString().split('T')[0],
        dueDate: new Date(lastMonth.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        status: 'paid',
        paidDate: lastMonth.toISOString().split('T')[0],
        paidAmount: 80.00,
        description: 'Monthly service fee',
        billingPeriod: {
          startDate: lastMonth.toISOString().split('T')[0],
          endDate: today.toISOString().split('T')[0],
        },
      },
      {
        account: createdAccounts[2]?.id,
        amount: 150.00,
        billingDate: lastMonth.toISOString().split('T')[0],
        dueDate: new Date(lastMonth.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        status: 'overdue',
        description: 'Bi-weekly service fee (overdue)',
        billingPeriod: {
          startDate: lastMonth.toISOString().split('T')[0],
          endDate: today.toISOString().split('T')[0],
        },
      },
    ]

    let createdBillingCount = 0
    for (const billingData of billingRecords) {
      try {
        if (!billingData.account) {
          console.log(`  ⏭️  Skipping billing record - no account available`)
          continue
        }

        // Check if billing record already exists (same account, billing date, and amount)
        const existing = await payload.find({
          collection: 'residential-billing',
          where: {
            and: [
              {
                account: {
                  equals: billingData.account,
                },
              },
              {
                billingDate: {
                  equals: billingData.billingDate,
                },
              },
              {
                amount: {
                  equals: billingData.amount,
                },
              },
            ],
          },
          limit: 1,
        })

        if (existing.docs.length > 0) {
          console.log(`  ⏭️  Billing record already exists for account ${billingData.account} on ${billingData.billingDate}, skipping...`)
          continue
        }

        const billing = await payload.create({
          collection: 'residential-billing',
          data: billingData,
        })
        createdBillingCount++
        console.log(`  ✅ Created billing record: ${billing.billingNumber} - $${billing.amount}`)
      } catch (error) {
        console.error(`  ❌ Error creating billing record:`, error)
      }
    }

    console.log('\n✨ Seed process completed successfully!')
    console.log('\n📊 Summary:')
    console.log(`  - Boroughs: ${createdBoroughs.length}`)
    console.log(`  - Users: ${createdUsers.length}`)
    console.log(`  - Residential Accounts: ${createdAccounts.length}`)
    console.log(`  - Commercial Accounts: ${createdCommercialAccounts.length}`)
    console.log(`  - Billing Records: ${createdBillingCount}`)
    console.log('\n🔑 Default credentials:')
    console.log('  Admin: admin@bandldisposal.com / admin123')
    console.log('  Staff: staff@bandldisposal.com / staff123')

    process.exit(0)
  } catch (error) {
    console.error('\n❌ Seed process failed:', error)
    process.exit(1)
  }
}

seed()

