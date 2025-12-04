'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';

interface AccountData {
  id: string;
  accountNumber?: string;
  name?: string;
  email?: string;
  contactInfo?: {
    phone?: string;
    address?: string;
    city?: string;
    state?: string;
    zip?: string;
  };
  serviceInfo?: {
    serviceStartDate?: string;
    serviceStatus?: string;
    pickupDays?: string[];
  };
  billingInfo?: {
    accountBalance?: number;
    nextBillingDate?: string;
    billingCadence?: string;
  };
  paymentInfo?: {
    isLate?: string;
    lastPaymentDate?: string;
    lastPaymentAmount?: number;
  };
}

export default function AccountPage() {
  const router = useRouter();
  const [account, setAccount] = useState<AccountData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'overview' | 'billing' | 'service' | 'settings'>('overview');

  useEffect(() => {
    const token = localStorage.getItem('token');
    const accountType = localStorage.getItem('accountType');

    if (!token || !accountType) {
      router.push('/account/login');
      return;
    }

    fetchAccount(token, accountType);
  }, [router]);

  const fetchAccount = async (token: string, accountType: string) => {
    try {
      const collection = accountType === 'residential' ? 'accounts' : 'commercial-accounts';
      const response = await fetch(`/api/${collection}/me`, {
        headers: {
          Authorization: `JWT ${token}`,
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          // Token expired or invalid
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          localStorage.removeItem('accountType');
          router.push('/account/login');
          return;
        }
        throw new Error('Failed to fetch account');
      }

      const data = await response.json();
      setAccount(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load account');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('accountType');
    router.push('/account/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2" style={{ borderColor: '#6ABF43' }}></div>
          <p className="mt-4 text-gray-600">Loading your account...</p>
        </div>
      </div>
    );
  }

  if (error || !account) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <p className="text-red-600 mb-4">{error || 'Account not found'}</p>
          <Link
            href="/account/login"
            className="inline-block px-6 py-2 text-white font-medium rounded-lg"
            style={{ backgroundColor: '#6ABF43' }}
          >
            Go to Login
          </Link>
        </div>
      </div>
    );
  }

  const formatCurrency = (amount: number | undefined) => {
    if (amount === undefined) return '$0.00';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold" style={{ color: '#002F1F' }}>
                My Account
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                {account.accountNumber && `Account #${account.accountNumber}`}
              </p>
            </div>
            <button
              onClick={handleLogout}
              className="px-4 py-2 text-sm font-medium rounded-lg border-2 transition-colors"
              style={{
                borderColor: '#002F1F',
                color: '#002F1F'
              }}
            >
              Logout
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tabs */}
        <div className="mb-6 border-b border-gray-200">
          <nav className="flex space-x-8">
            {(['overview', 'billing', 'service', 'settings'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab
                    ? 'border-[#6ABF43] text-[#002F1F]'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold mb-4" style={{ color: '#002F1F' }}>
                  Account Overview
                </h2>
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-sm text-gray-600 mb-1">Account Balance</p>
                    <p className={`text-2xl font-bold ${(account.billingInfo?.accountBalance || 0) > 0 ? 'text-red-600' : 'text-green-600'}`}>
                      {formatCurrency(account.billingInfo?.accountBalance)}
                    </p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-sm text-gray-600 mb-1">Service Status</p>
                    <p className="text-2xl font-bold capitalize" style={{ color: '#002F1F' }}>
                      {account.serviceInfo?.serviceStatus || 'N/A'}
                    </p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-sm text-gray-600 mb-1">Next Billing Date</p>
                    <p className="text-lg font-semibold" style={{ color: '#002F1F' }}>
                      {formatDate(account.billingInfo?.nextBillingDate)}
                    </p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-sm text-gray-600 mb-1">Payment Status</p>
                    <p className={`text-lg font-semibold capitalize ${account.paymentInfo?.isLate === 'late' ? 'text-red-600' : 'text-green-600'}`}>
                      {account.paymentInfo?.isLate === 'late' ? 'Late' : 'Current'}
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-3" style={{ color: '#002F1F' }}>
                  Contact Information
                </h3>
                <div className="space-y-2 text-gray-700">
                  <p><strong>Name:</strong> {account.name || 'N/A'}</p>
                  <p><strong>Email:</strong> {account.email || 'N/A'}</p>
                  {account.contactInfo?.phone && (
                    <p><strong>Phone:</strong> {account.contactInfo.phone}</p>
                  )}
                  {account.contactInfo?.address && (
                    <p>
                      <strong>Address:</strong> {account.contactInfo.address}
                      {account.contactInfo.city && `, ${account.contactInfo.city}`}
                      {account.contactInfo.state && `, ${account.contactInfo.state}`}
                      {account.contactInfo.zip && ` ${account.contactInfo.zip}`}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'billing' && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold mb-4" style={{ color: '#002F1F' }}>
                Billing Information
              </h2>
              <div className="space-y-4">
                <div className="flex justify-between items-center py-3 border-b border-gray-200">
                  <span className="text-gray-600">Current Balance</span>
                  <span className={`text-lg font-semibold ${(account.billingInfo?.accountBalance || 0) > 0 ? 'text-red-600' : 'text-green-600'}`}>
                    {formatCurrency(account.billingInfo?.accountBalance)}
                  </span>
                </div>
                <div className="flex justify-between items-center py-3 border-b border-gray-200">
                  <span className="text-gray-600">Next Billing Date</span>
                  <span className="font-medium">{formatDate(account.billingInfo?.nextBillingDate)}</span>
                </div>
                <div className="flex justify-between items-center py-3 border-b border-gray-200">
                  <span className="text-gray-600">Billing Frequency</span>
                  <span className="font-medium capitalize">{account.billingInfo?.billingCadence || 'N/A'}</span>
                </div>
                {account.paymentInfo?.lastPaymentDate && (
                  <div className="flex justify-between items-center py-3 border-b border-gray-200">
                    <span className="text-gray-600">Last Payment</span>
                    <div className="text-right">
                      <p className="font-medium">{formatDate(account.paymentInfo.lastPaymentDate)}</p>
                      {account.paymentInfo.lastPaymentAmount && (
                        <p className="text-sm text-gray-500">{formatCurrency(account.paymentInfo.lastPaymentAmount)}</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
              <div className="mt-6">
                <Link
                  href="/pay-bill"
                  className="inline-block px-6 py-3 text-white font-semibold rounded-lg transition-colors"
                  style={{ backgroundColor: '#6ABF43' }}
                >
                  Pay My Bill
                </Link>
              </div>
            </div>
          )}

          {activeTab === 'service' && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold mb-4" style={{ color: '#002F1F' }}>
                Service Information
              </h2>
              <div className="space-y-4">
                <div className="flex justify-between items-center py-3 border-b border-gray-200">
                  <span className="text-gray-600">Service Status</span>
                  <span className="font-medium capitalize">{account.serviceInfo?.serviceStatus || 'N/A'}</span>
                </div>
                <div className="flex justify-between items-center py-3 border-b border-gray-200">
                  <span className="text-gray-600">Service Start Date</span>
                  <span className="font-medium">{formatDate(account.serviceInfo?.serviceStartDate)}</span>
                </div>
                {account.serviceInfo?.pickupDays && account.serviceInfo.pickupDays.length > 0 && (
                  <div className="py-3 border-b border-gray-200">
                    <span className="text-gray-600 block mb-2">Pickup Days</span>
                    <div className="flex flex-wrap gap-2">
                      {account.serviceInfo.pickupDays.map((day) => (
                        <span
                          key={day}
                          className="px-3 py-1 bg-gray-100 rounded-full text-sm font-medium capitalize"
                        >
                          {day}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold mb-4" style={{ color: '#002F1F' }}>
                Account Settings
              </h2>
              <div className="space-y-4">
                <div>
                  <h3 className="font-medium mb-2" style={{ color: '#002F1F' }}>Profile Information</h3>
                  <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                      <input
                        type="text"
                        defaultValue={account.name || ''}
                        className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-[#002F1F]"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                      <input
                        type="email"
                        defaultValue={account.email || ''}
                        className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-[#002F1F]"
                      />
                    </div>
                  </div>
                </div>
                <div>
                  <Link
                    href="/account/change-password"
                    className="inline-block px-6 py-2 text-sm font-medium rounded-lg border-2 transition-colors"
                    style={{
                      borderColor: '#002F1F',
                      color: '#002F1F'
                    }}
                  >
                    Change Password
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

