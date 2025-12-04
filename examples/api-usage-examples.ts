/**
 * Practical examples of using Payload CMS collections in your application
 * 
 * These examples can be used in:
 * - Next.js API Routes (app/api/.../route.ts)
 * - Server Components (app/.../page.tsx)
 * - Server Actions
 */

import { getPayload } from 'payload'
import config from '@/payload.config'

// ============================================================================
// EXAMPLE 1: Server Component - Display Accounts List
// ============================================================================
// Use in: app/accounts/page.tsx

export async function getAccountsList() {
  const payload = await getPayload({ config })

  const result = await payload.find({
    collection: 'accounts',
    limit: 50,
    where: {
      'serviceInfo.serviceStatus': {
        equals: 'active',
      },
    },
    sort: '-createdAt',
  })

  return result.docs
}

// ============================================================================
// EXAMPLE 2: API Route - Get Account by ID
// ============================================================================
// Use in: app/api/accounts/[id]/route.ts

export async function getAccountById(accountId: string) {
  const payload = await getPayload({ config })

  try {
    const account = await payload.findByID({
      collection: 'accounts',
      id: accountId,
      depth: 1, // Populate borough relationship
    })

    return account
  } catch (error) {
    console.error('Error fetching account:', error)
    return null
  }
}

// ============================================================================
// EXAMPLE 3: API Route - Create New Account
// ============================================================================
// Use in: app/api/accounts/route.ts (POST handler)

export async function createAccount(accountData: {
  accountNumber: string
  name: string
  email: string
  borough: string
  contactInfo: {
    phone?: string
    address: string
    city: string
    state: string
    zip: string
  }
  serviceInfo: {
    serviceStartDate: string
    serviceStatus: 'active' | 'suspended' | 'cancelled' | 'pending'
  }
  billingInfo: {
    billingDate: number
    billingCadence: 'weekly' | 'bi-weekly' | 'monthly' | 'quarterly' | 'annually'
  }
  paymentInfo?: {
    paymentMethod?: string
    autoPay?: boolean
    gracePeriodDays?: number
  }
}) {
  const payload = await getPayload({ config })

  try {
    const account = await payload.create({
      collection: 'accounts',
      data: accountData,
    })

    // Password setup email is automatically sent via afterChange hook
    return account
  } catch (error) {
    console.error('Error creating account:', error)
    throw error
  }
}

// ============================================================================
// EXAMPLE 4: Get Accounts with Late Payments
// ============================================================================

export async function getLateAccounts() {
  const payload = await getPayload({ config })

  const result = await payload.find({
    collection: 'accounts',
    where: {
      and: [
        {
          'paymentInfo.isLate': {
            equals: 'late',
          },
        },
        {
          'billingInfo.accountBalance': {
            greater_than: 0,
          },
        },
      ],
    },
    sort: '-billingInfo.accountBalance', // Sort by balance descending
  })

  return result.docs
}

// ============================================================================
// EXAMPLE 5: Create Billing Record (Auto-updates Account Balance)
// ============================================================================
// Use in: app/api/billing/route.ts (POST handler)

export async function createBillingRecord(billingData: {
  account: string
  amount: number
  billingDate: string
  dueDate: string
  description?: string
  billingPeriod?: {
    startDate: string
    endDate: string
  }
}) {
  const payload = await getPayload({ config })

  try {
    const billing = await payload.create({
      collection: 'residential-billing',
      data: {
        ...billingData,
        status: 'pending',
      },
    })

    // Account balance is automatically updated via afterChange hook
    return billing
  } catch (error) {
    console.error('Error creating billing record:', error)
    throw error
  }
}

// ============================================================================
// EXAMPLE 6: Mark Billing as Paid (Auto-updates Account Balance)
// ============================================================================

export async function markBillingAsPaid(
  billingId: string,
  paidAmount: number,
  paidDate?: string
) {
  const payload = await getPayload({ config })

  try {
    const billing = await payload.update({
      collection: 'residential-billing',
      id: billingId,
      data: {
        status: 'paid',
        paidDate: paidDate || new Date().toISOString().split('T')[0],
        paidAmount: paidAmount,
      },
    })

    // Account balance and payment info are automatically updated
    return billing
  } catch (error) {
    console.error('Error updating billing record:', error)
    throw error
  }
}

// ============================================================================
// EXAMPLE 7: Get Billing History for Account
// ============================================================================

export async function getBillingHistory(accountId: string, limit = 12) {
  const payload = await getPayload({ config })

  const result = await payload.find({
    collection: 'residential-billing',
    where: {
      account: {
        equals: accountId,
      },
    },
    sort: '-billingDate',
    limit,
  })

  return result.docs
}

// ============================================================================
// EXAMPLE 8: Get Accounts by Borough
// ============================================================================

export async function getAccountsByBorough(boroughId: string) {
  const payload = await getPayload({ config })

  const result = await payload.find({
    collection: 'accounts',
    where: {
      borough: {
        equals: boroughId,
      },
    },
    depth: 1, // Populate borough details
  })

  return result.docs
}

// ============================================================================
// EXAMPLE 9: Update Account Balance Manually
// ============================================================================

export async function updateAccountBalance(
  accountId: string,
  newBalance: number
) {
  const payload = await getPayload({ config })

  try {
    const account = await payload.update({
      collection: 'accounts',
      id: accountId,
      data: {
        billingInfo: {
          accountBalance: newBalance,
        },
      },
    })

    // Late payment status will be recalculated automatically
    return account
  } catch (error) {
    console.error('Error updating account balance:', error)
    throw error
  }
}

// ============================================================================
// EXAMPLE 10: Customer Login (Residential Account)
// ============================================================================
// Use in: app/api/accounts/login/route.ts

export async function customerLogin(email: string, password: string) {
  const payload = await getPayload({ config })

  try {
    const result = await payload.login({
      collection: 'accounts',
      data: {
        email,
        password,
      },
    })

    return {
      user: result.user,
      token: result.token,
      exp: result.exp,
    }
  } catch (error) {
    console.error('Login error:', error)
    throw new Error('Invalid email or password')
  }
}

// ============================================================================
// EXAMPLE 11: Get Customer's Own Account (Authenticated)
// ============================================================================
// Use in: app/api/accounts/me/route.ts

export async function getMyAccount(token: string) {
  const payload = await getPayload({ config })

  try {
    // Verify token and get user
    const { user } = await payload.auth({
      collection: 'accounts',
      token,
    })

    // Get account details
    const account = await payload.findByID({
      collection: 'accounts',
      id: user.id,
      depth: 1,
    })

    return account
  } catch (error) {
    console.error('Error fetching account:', error)
    throw new Error('Unauthorized')
  }
}

// ============================================================================
// EXAMPLE 12: Get Account Statistics
// ============================================================================

export async function getAccountStatistics() {
  const payload = await getPayload({ config })

  const [totalAccounts, activeAccounts, lateAccounts, totalBalance] =
    await Promise.all([
      payload.count({ collection: 'accounts' }),
      payload.count({
        collection: 'accounts',
        where: {
          'serviceInfo.serviceStatus': {
            equals: 'active',
          },
        },
      }),
      payload.count({
        collection: 'accounts',
        where: {
          'paymentInfo.isLate': {
            equals: 'late',
          },
        },
      }),
      // Get total balance (requires aggregation or fetching all accounts)
      payload.find({
        collection: 'accounts',
        limit: 1000,
        select: {
          'billingInfo.accountBalance': true,
        },
      }),
    ])

  const totalBalanceAmount = totalBalance.docs.reduce(
    (sum, account) => sum + (account.billingInfo?.accountBalance || 0),
    0
  )

  return {
    total: totalAccounts.totalDocs,
    active: activeAccounts.totalDocs,
    late: lateAccounts.totalDocs,
    totalBalance: totalBalanceAmount,
  }
}

// ============================================================================
// EXAMPLE 13: Search Accounts
// ============================================================================

export async function searchAccounts(query: string) {
  const payload = await getPayload({ config })

  const result = await payload.find({
    collection: 'accounts',
    where: {
      or: [
        {
          accountNumber: {
            contains: query,
          },
        },
        {
          name: {
            contains: query,
          },
        },
        {
          email: {
            contains: query,
          },
        },
      ],
    },
    limit: 20,
  })

  return result.docs
}

// ============================================================================
// EXAMPLE 14: Get Boroughs with Route Days
// ============================================================================

export async function getAllBoroughs() {
  const payload = await getPayload({ config })

  const result = await payload.find({
    collection: 'boroughs',
    sort: 'name',
  })

  return result.docs
}

// ============================================================================
// EXAMPLE 15: Commercial Accounts - List All
// ============================================================================

export async function getCommercialAccounts() {
  const payload = await getPayload({ config })

  const result = await payload.find({
    collection: 'commercial-accounts',
    where: {
      'serviceInfo.serviceStatus': {
        equals: 'active',
      },
    },
    sort: '-createdAt',
  })

  return result.docs
}

// ============================================================================
// EXAMPLE 16: Using Fetch API (Client-Side)
// ============================================================================
// Use in: Client Components or API Routes that call external APIs

export async function fetchAccountsClient() {
  const response = await fetch('/api/accounts?limit=50&where[serviceInfo.serviceStatus][equals]=active', {
    headers: {
      'Content-Type': 'application/json',
    },
  })

  if (!response.ok) {
    throw new Error('Failed to fetch accounts')
  }

  const data = await response.json()
  return data.docs
}

// ============================================================================
// EXAMPLE 17: Authenticated Request (Client-Side)
// ============================================================================

export async function fetchMyAccount(token: string) {
  const response = await fetch('/api/accounts/me', {
    headers: {
      'Authorization': `JWT ${token}`,
      'Content-Type': 'application/json',
    },
  })

  if (!response.ok) {
    throw new Error('Failed to fetch account')
  }

  return await response.json()
}

// ============================================================================
// EXAMPLE 18: Create Account with Error Handling
// ============================================================================

export async function createAccountWithValidation(accountData: any) {
  const payload = await getPayload({ config })

  try {
    // Validate required fields
    if (!accountData.email || !accountData.name || !accountData.borough) {
      throw new Error('Missing required fields')
    }

    // Check if email already exists
    const existing = await payload.find({
      collection: 'accounts',
      where: {
        email: {
          equals: accountData.email,
        },
      },
      limit: 1,
    })

    if (existing.docs.length > 0) {
      throw new Error('Account with this email already exists')
    }

    // Check if account number already exists
    if (accountData.accountNumber) {
      const existingNumber = await payload.find({
        collection: 'accounts',
        where: {
          accountNumber: {
            equals: accountData.accountNumber,
          },
        },
        limit: 1,
      })

      if (existingNumber.docs.length > 0) {
        throw new Error('Account number already exists')
      }
    }

    // Create account
    const account = await payload.create({
      collection: 'accounts',
      data: accountData,
    })

    return { success: true, account }
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Failed to create account',
    }
  }
}

