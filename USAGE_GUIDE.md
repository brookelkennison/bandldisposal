# Usage Guide: Payload CMS Collections

This guide explains how to properly use the Payload CMS collections in your application.

## Table of Contents
1. [API Endpoints](#api-endpoints)
2. [Authentication](#authentication)
3. [Frontend Usage](#frontend-usage)
4. [Common Operations](#common-operations)
5. [Collection-Specific Examples](#collection-specific-examples)

## API Endpoints

All collections are accessible via REST API at `/api/{collection-slug}`. The base URL is your Next.js app URL (e.g., `http://localhost:3000`).

### Available Collections

- **Users**: `/api/users` - Admin and staff users
- **Boroughs**: `/api/boroughs` - Borough settings and route information
- **Accounts**: `/api/accounts` - Residential customer accounts (with authentication)
- **Commercial Accounts**: `/api/commercial-accounts` - Commercial customer accounts (with authentication)
- **Residential Billing**: `/api/residential-billing` - Billing records for residential accounts

### Standard REST Operations

All collections support standard REST operations:

- `GET /api/{collection}` - List documents (with query parameters)
- `GET /api/{collection}/{id}` - Get a single document
- `POST /api/{collection}` - Create a new document
- `PATCH /api/{collection}/{id}` - Update a document
- `DELETE /api/{collection}/{id}` - Delete a document

## Authentication

### Admin/Staff Authentication

Admin and staff users authenticate via the `users` collection:

```typescript
// Login
const response = await fetch('/api/users/login', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    email: 'admin@bandldisposal.com',
    password: 'admin123',
  }),
})

const data = await response.json()
// Response includes: user, token, exp
```

### Customer Authentication

#### Residential Accounts

```typescript
// Login
const response = await fetch('/api/accounts/login', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    email: 'customer@example.com',
    password: 'customer-password',
  }),
})
```

#### Commercial Accounts

```typescript
// Login
const response = await fetch('/api/commercial-accounts/login', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    email: 'business@example.com',
    password: 'business-password',
  }),
})
```

### Using Authentication Tokens

After login, include the token in subsequent requests:

```typescript
const token = 'your-jwt-token'

const response = await fetch('/api/accounts', {
  headers: {
    'Authorization': `JWT ${token}`,
    'Content-Type': 'application/json',
  },
})
```

## Frontend Usage

### Using Payload Client (Recommended)

Install the Payload client:

```bash
npm install payload
```

Then use it in your components:

```typescript
import { getPayload } from 'payload'
import config from '@/payload.config'

// In a Server Component or API Route
const payload = await getPayload({ config })

// Fetch accounts
const accounts = await payload.find({
  collection: 'accounts',
  limit: 10,
  where: {
    'serviceInfo.serviceStatus': {
      equals: 'active',
    },
  },
})
```

### Using Fetch API

```typescript
// Client-side example
async function fetchAccounts() {
  const response = await fetch('/api/accounts?limit=10&where[serviceInfo.serviceStatus][equals]=active', {
    headers: {
      'Content-Type': 'application/json',
    },
  })
  
  const data = await response.json()
  return data.docs
}
```

### React Hook Example

```typescript
'use client'

import { useState, useEffect } from 'react'

export function useAccounts() {
  const [accounts, setAccounts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    async function fetchAccounts() {
      try {
        const response = await fetch('/api/accounts?limit=100')
        const data = await response.json()
        setAccounts(data.docs)
      } catch (err) {
        setError(err)
      } finally {
        setLoading(false)
      }
    }

    fetchAccounts()
  }, [])

  return { accounts, loading, error }
}
```

## Common Operations

### Querying with Filters

```typescript
// Find accounts with late payments
const lateAccounts = await payload.find({
  collection: 'accounts',
  where: {
    'paymentInfo.isLate': {
      equals: 'late',
    },
    'billingInfo.accountBalance': {
      greater_than: 0,
    },
  },
})

// Find billing records for a specific account
const billingRecords = await payload.find({
  collection: 'residential-billing',
  where: {
    account: {
      equals: accountId,
    },
  },
  sort: '-billingDate', // Sort by billing date descending
})
```

### Creating Documents

```typescript
// Create a new residential account
const newAccount = await payload.create({
  collection: 'accounts',
  data: {
    accountNumber: 'RES-000004',
    name: 'Alice Johnson',
    email: 'alice@example.com',
    borough: boroughId, // ID of a borough
    contactInfo: {
      phone: '555-0104',
      address: '400 Pine Street',
      city: 'Upper Township',
      state: 'NJ',
      zip: '08210',
    },
    serviceInfo: {
      serviceStartDate: '2024-03-01',
      serviceStatus: 'active',
    },
    billingInfo: {
      billingDate: 1,
      billingCadence: 'monthly',
    },
    paymentInfo: {
      paymentMethod: 'credit-card',
      autoPay: false,
      gracePeriodDays: 5,
    },
  },
})
```

### Updating Documents

```typescript
// Update account balance
await payload.update({
  collection: 'accounts',
  id: accountId,
  data: {
    billingInfo: {
      accountBalance: 250.00,
    },
  },
})

// Create a billing record (automatically updates account balance)
const billing = await payload.create({
  collection: 'residential-billing',
  data: {
    account: accountId,
    amount: 75.00,
    billingDate: '2024-03-15',
    dueDate: '2024-04-15',
    status: 'pending',
    description: 'Monthly service fee',
  },
})
// The account balance will be automatically updated
```

### Relationships

```typescript
// Fetch account with populated borough
const account = await payload.findByID({
  collection: 'accounts',
  id: accountId,
  depth: 1, // Populate relationships 1 level deep
})

// account.borough will be the full borough object, not just the ID

// Fetch billing records with account details
const billing = await payload.find({
  collection: 'residential-billing',
  where: {
    account: {
      equals: accountId,
    },
  },
  depth: 1, // Populate account relationship
})
```

## Collection-Specific Examples

### Accounts (Residential)

#### List all active accounts

```typescript
const activeAccounts = await payload.find({
  collection: 'accounts',
  where: {
    'serviceInfo.serviceStatus': {
      equals: 'active',
    },
  },
})
```

#### Find accounts by borough

```typescript
const accounts = await payload.find({
  collection: 'accounts',
  where: {
    borough: {
      equals: boroughId,
    },
  },
})
```

#### Customer self-service: Get own account

```typescript
// When authenticated as a customer
const myAccount = await payload.find({
  collection: 'accounts',
  where: {
    email: {
      equals: customerEmail,
    },
  },
  limit: 1,
})
```

### Commercial Accounts

#### List all commercial accounts

```typescript
const commercialAccounts = await payload.find({
  collection: 'commercial-accounts',
  where: {
    'serviceInfo.serviceStatus': {
      equals: 'active',
    },
  },
})
```

### Residential Billing

#### Create a billing record

```typescript
// This automatically updates the account balance
const billing = await payload.create({
  collection: 'residential-billing',
  data: {
    account: accountId,
    amount: 100.00,
    billingDate: '2024-03-15',
    dueDate: '2024-04-15',
    status: 'pending',
    description: 'Monthly service fee',
    billingPeriod: {
      startDate: '2024-03-01',
      endDate: '2024-03-31',
    },
  },
})
```

#### Mark billing as paid

```typescript
// This automatically updates account balance and payment info
await payload.update({
  collection: 'residential-billing',
  id: billingId,
  data: {
    status: 'paid',
    paidDate: '2024-03-20',
    paidAmount: 100.00,
  },
})
```

#### Get billing history for an account

```typescript
const billingHistory = await payload.find({
  collection: 'residential-billing',
  where: {
    account: {
      equals: accountId,
    },
  },
  sort: '-billingDate',
  limit: 12, // Last 12 billing records
})
```

### Boroughs

#### List all boroughs

```typescript
const boroughs = await payload.find({
  collection: 'boroughs',
})
```

#### Get borough with route days

```typescript
const borough = await payload.findByID({
  collection: 'boroughs',
  id: boroughId,
})

// Access route days
const routeDays = borough.routeDaysGroup?.routeDay
// ['monday', 'wednesday', 'friday']
```

## Automatic Features

### Account Balance Updates

When you create or update a `residential-billing` record, the account balance is automatically updated:

- **Create**: Adds the billing amount to account balance
- **Update**: Adjusts balance based on amount change
- **Delete**: Subtracts the billing amount from account balance
- **Mark as Paid**: Subtracts paid amount from balance

### Next Billing Date Calculation

The `nextBillingDate` is automatically calculated based on:
- `billingDate` (day of month)
- `billingCadence` (weekly, bi-weekly, monthly, quarterly, annually)
- `serviceStartDate` (for weekly/bi-weekly cadences)

### Pickup Days Sync

For residential accounts, `pickupDays` are automatically synced from the selected borough's `routeDaysGroup.routeDay` when the account is created or updated.

### Late Payment Detection

The `paymentInfo.isLate` field is automatically calculated based on:
- `nextBillingDate`
- `accountBalance`
- `gracePeriodDays`
- `lastPaymentDate`

### Password Setup Emails

When a new account is created, a password setup email is automatically sent to the customer's email address using Payload's forgot password functionality.

## Access Control

### Admin/Staff Access

Only users with `role: 'admin'` or `role: 'staff'` can:
- Create accounts
- Update accounts
- Delete accounts
- Create billing records
- Update billing records

### Customer Access

Customers can:
- Read their own account (via authentication)
- Update their own password (via forgot password flow)
- Cannot modify account data through the API (only through admin panel)

### Public Access

- Boroughs: Read-only for everyone
- Accounts: Read-only for everyone (but customers can only see their own via auth)

## Next Steps

1. **Seed Data**: Run `npm run seed` to populate initial data
2. **Create Admin User**: Run `npm run make-admin` to create an admin user
3. **Access Admin Panel**: Navigate to `/admin` to use the Payload admin interface
4. **Build Frontend**: Use the examples above to build customer-facing pages

## Additional Resources

- [Payload CMS Documentation](https://payloadcms.com/docs)
- [Payload REST API](https://payloadcms.com/docs/rest-api/overview)
- [Payload Authentication](https://payloadcms.com/docs/authentication/overview)

