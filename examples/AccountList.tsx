/**
 * Example React Component: Account List
 * 
 * This component demonstrates how to fetch and display accounts
 * in a Next.js Server Component or Client Component
 */

'use client'

import { useState, useEffect } from 'react'

interface Account {
  id: string
  accountNumber: string
  name: string
  email: string
  serviceInfo?: {
    serviceStatus: string
    serviceStartDate: string
  }
  billingInfo?: {
    accountBalance: number
    nextBillingDate: string
  }
  paymentInfo?: {
    isLate: string
    latePaymentCount: number
  }
}

export function AccountList() {
  const [accounts, setAccounts] = useState<Account[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchAccounts() {
      try {
        const response = await fetch('/api/accounts?limit=50&where[serviceInfo.serviceStatus][equals]=active')
        
        if (!response.ok) {
          throw new Error('Failed to fetch accounts')
        }

        const data = await response.json()
        setAccounts(data.docs)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred')
      } finally {
        setLoading(false)
      }
    }

    fetchAccounts()
  }, [])

  if (loading) {
    return <div>Loading accounts...</div>
  }

  if (error) {
    return <div className="text-red-600">Error: {error}</div>
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Residential Accounts</h2>
      
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Account Number
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Balance
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Payment Status
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {accounts.map((account) => (
              <tr key={account.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {account.accountNumber}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {account.name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    account.serviceInfo?.serviceStatus === 'active'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {account.serviceInfo?.serviceStatus || 'N/A'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  ${(account.billingInfo?.accountBalance || 0).toFixed(2)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    account.paymentInfo?.isLate === 'late'
                      ? 'bg-red-100 text-red-800'
                      : 'bg-green-100 text-green-800'
                  }`}>
                    {account.paymentInfo?.isLate === 'late' ? 'Late' : 'Current'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {accounts.length === 0 && (
        <div className="text-center text-gray-500 py-8">
          No accounts found
        </div>
      )}
    </div>
  )
}

/**
 * Server Component Example (Alternative)
 * 
 * Use this in: app/accounts/page.tsx
 */

import { getPayload } from 'payload'
import config from '@/payload.config'

export async function AccountListServer() {
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

  const accounts = result.docs

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Residential Accounts</h2>
      
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Account Number
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Balance
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Payment Status
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {accounts.map((account: any) => (
              <tr key={account.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {account.accountNumber}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {account.name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    account.serviceInfo?.serviceStatus === 'active'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {account.serviceInfo?.serviceStatus || 'N/A'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  ${(account.billingInfo?.accountBalance || 0).toFixed(2)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    account.paymentInfo?.isLate === 'late'
                      ? 'bg-red-100 text-red-800'
                      : 'bg-green-100 text-green-800'
                  }`}>
                    {account.paymentInfo?.isLate === 'late' ? 'Late' : 'Current'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {accounts.length === 0 && (
        <div className="text-center text-gray-500 py-8">
          No accounts found
        </div>
      )}
    </div>
  )
}

