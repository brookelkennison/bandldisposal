# Quick Reference: Using Payload Collections

## API Endpoints

| Collection | Endpoint | Auth Required |
|------------|----------|---------------|
| Users | `/api/users` | Admin/Staff |
| Boroughs | `/api/boroughs` | Public (read) |
| Accounts (Residential) | `/api/accounts` | Public (read), Admin (write) |
| Commercial Accounts | `/api/commercial-accounts` | Public (read), Admin (write) |
| Residential Billing | `/api/residential-billing` | Public (read), Admin (write) |

## Authentication Endpoints

- **Admin/Staff Login**: `POST /api/users/login`
- **Residential Customer Login**: `POST /api/accounts/login`
- **Commercial Customer Login**: `POST /api/commercial-accounts/login`

## Quick Examples

### Fetch Accounts (Server Component)

```typescript
import { getPayload } from 'payload'
import config from '@/payload.config'

const payload = await getPayload({ config })
const accounts = await payload.find({
  collection: 'accounts',
  limit: 50,
})
```

### Fetch Accounts (Client Component)

```typescript
const response = await fetch('/api/accounts?limit=50')
const data = await response.json()
const accounts = data.docs
```

### Create Account

```typescript
const account = await payload.create({
  collection: 'accounts',
  data: {
    accountNumber: 'RES-000001',
    name: 'John Doe',
    email: 'john@example.com',
    borough: boroughId,
    serviceInfo: {
      serviceStartDate: '2024-01-01',
      serviceStatus: 'active',
    },
    billingInfo: {
      billingDate: 1,
      billingCadence: 'monthly',
    },
  },
})
```

### Create Billing Record (Auto-updates Account Balance)

```typescript
const billing = await payload.create({
  collection: 'residential-billing',
  data: {
    account: accountId,
    amount: 75.00,
    billingDate: '2024-03-15',
    dueDate: '2024-04-15',
    status: 'pending',
  },
})
```

### Mark Billing as Paid (Auto-updates Account Balance)

```typescript
await payload.update({
  collection: 'residential-billing',
  id: billingId,
  data: {
    status: 'paid',
    paidDate: '2024-03-20',
    paidAmount: 75.00,
  },
})
```

### Find Late Accounts

```typescript
const lateAccounts = await payload.find({
  collection: 'accounts',
  where: {
    'paymentInfo.isLate': {
      equals: 'late',
    },
  },
})
```

### Customer Login

```typescript
const response = await fetch('/api/accounts/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'customer@example.com',
    password: 'password',
  }),
})

const { user, token } = await response.json()
```

### Authenticated Request

```typescript
const response = await fetch('/api/accounts/me', {
  headers: {
    'Authorization': `JWT ${token}`,
    'Content-Type': 'application/json',
  },
})
```

## Automatic Features

✅ **Account Balance Updates**: Creating/updating billing records automatically updates account balance

✅ **Next Billing Date**: Automatically calculated from billing date and cadence

✅ **Pickup Days Sync**: Automatically synced from borough when account is created/updated

✅ **Late Payment Detection**: Automatically calculated based on due date, balance, and grace period

✅ **Password Setup Emails**: Automatically sent when new account is created

## Common Queries

### Get Accounts by Borough

```typescript
const accounts = await payload.find({
  collection: 'accounts',
  where: {
    borough: { equals: boroughId },
  },
})
```

### Get Billing History

```typescript
const billing = await payload.find({
  collection: 'residential-billing',
  where: {
    account: { equals: accountId },
  },
  sort: '-billingDate',
})
```

### Search Accounts

```typescript
const accounts = await payload.find({
  collection: 'accounts',
  where: {
    or: [
      { accountNumber: { contains: query } },
      { name: { contains: query } },
      { email: { contains: query } },
    ],
  },
})
```

## Common Field Paths

### Accounts

- `serviceInfo.serviceStatus` - Service status (active, suspended, cancelled, pending)
- `serviceInfo.serviceStartDate` - Service start date
- `serviceInfo.pickupDays` - Pickup days (auto-synced from borough)
- `billingInfo.billingDate` - Day of month for billing (1-31)
- `billingInfo.billingCadence` - Billing frequency (weekly, bi-weekly, monthly, quarterly, annually)
- `billingInfo.nextBillingDate` - Next billing date (auto-calculated)
- `billingInfo.accountBalance` - Current account balance
- `paymentInfo.isLate` - Payment status (current, late) - auto-calculated
- `paymentInfo.latePaymentCount` - Total late payments
- `paymentInfo.gracePeriodDays` - Grace period in days (default: 5)

### Residential Billing

- `account` - Relationship to account (ID)
- `amount` - Billing amount
- `billingDate` - Date billing was issued
- `dueDate` - Payment due date
- `status` - Status (pending, paid, overdue, cancelled)
- `paidDate` - Date payment was received
- `paidAmount` - Amount that was paid

## Access Control Summary

| Operation | Admin/Staff | Customer | Public |
|-----------|------------|----------|--------|
| Read Accounts | ✅ All | ✅ Own only | ✅ All (read-only) |
| Create Accounts | ✅ | ❌ | ❌ |
| Update Accounts | ✅ | ❌ | ❌ |
| Delete Accounts | ✅ | ❌ | ❌ |
| Create Billing | ✅ | ❌ | ❌ |
| Update Billing | ✅ | ❌ | ❌ |
| Read Boroughs | ✅ | ✅ | ✅ |

## Next Steps

1. **Read Full Guide**: See `USAGE_GUIDE.md` for detailed documentation
2. **View Examples**: Check `examples/api-usage-examples.ts` for code examples
3. **Component Examples**: See `examples/AccountList.tsx` for React components
4. **Seed Data**: Run `npm run seed` to populate initial data
5. **Access Admin**: Navigate to `/admin` for Payload admin interface

