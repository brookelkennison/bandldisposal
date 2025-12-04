'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';

type AccountType = 'residential' | 'commercial';

export default function SignupPage() {
  const router = useRouter();
  const [accountType, setAccountType] = useState<AccountType>('residential');
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    businessName: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
    // Clear error when user starts typing
    if (error) setError('');
  };

  const validateForm = (): boolean => {
    if (!formData.firstName.trim()) {
      setError('First name is required');
      return false;
    }
    if (!formData.lastName.trim()) {
      setError('Last name is required');
      return false;
    }
    if (accountType === 'commercial' && !formData.businessName.trim()) {
      setError('Business name is required');
      return false;
    }
    if (!formData.email.trim()) {
      setError('Email is required');
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      setError('Please enter a valid email address');
      return false;
    }
    if (!formData.password) {
      setError('Password is required');
      return false;
    }
    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters');
      return false;
    }
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const collection = accountType === 'residential' ? 'accounts' : 'commercial-accounts';
      
      // Create account with password
      const accountData: any = {
        email: formData.email,
        password: formData.password,
        name: accountType === 'commercial' 
          ? formData.businessName 
          : `${formData.firstName} ${formData.lastName}`.trim(),
        contactInfo: {
          phone: formData.phone || undefined,
        },
      };

      // For residential, we'll add borough and service info in the next step
      // For commercial, same thing
      if (accountType === 'residential') {
        accountData.serviceInfo = {
          serviceStatus: 'pending',
        };
        accountData.billingInfo = {
          billingDate: 1,
          billingCadence: 'monthly',
          accountBalance: 0,
        };
        accountData.paymentInfo = {
          isLate: 'current',
          gracePeriodDays: 5,
          latePaymentCount: 0,
          totalLateFees: 0,
        };
      } else {
        accountData.serviceInfo = {
          serviceStatus: 'pending',
        };
        accountData.billingInfo = {
          billingDate: 1,
          billingCadence: 'monthly',
          accountBalance: 0,
        };
        accountData.paymentInfo = {
          isLate: 'current',
          gracePeriodDays: 7,
          latePaymentCount: 0,
          totalLateFees: 0,
        };
      }

      const createResponse = await fetch(`/api/${collection}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(accountData),
      });

      if (!createResponse.ok) {
        const errorData = await createResponse.json();
        throw new Error(errorData.message || errorData.error || 'Failed to create account');
      }

      const account = await createResponse.json();

      // Now login with the created account
      const loginResponse = await fetch(`/api/${collection}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
        }),
      });

      if (!loginResponse.ok) {
        throw new Error('Account created but login failed. Please try logging in.');
      }

      const loginData = await loginResponse.json();

      // Store token and redirect to start service
      if (loginData.token) {
        localStorage.setItem('token', loginData.token);
        localStorage.setItem('user', JSON.stringify(loginData.user));
        localStorage.setItem('accountType', accountType);
        localStorage.setItem('signupData', JSON.stringify({
          firstName: formData.firstName,
          lastName: formData.lastName,
          businessName: formData.businessName,
          phone: formData.phone,
        }));

        // Redirect to start service page
        router.push('/start-service');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred during signup');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-block">
            <Image
              src="/bl-logo.png"
              alt="B&L Disposal Logo"
              width={200}
              height={133}
              className="h-auto object-contain mx-auto"
            />
          </Link>
        </div>

        {/* Signup Form */}
        <div className="bg-white border-2 border-gray-200 rounded-lg p-8">
          <h1 className="text-3xl font-bold mb-2 text-center" style={{ color: '#002F1F' }}>
            Create Your Account
          </h1>
          <p className="text-gray-600 text-center mb-6">
            Sign up to start your service request
          </p>

          {/* Account Type Toggle */}
          <div className="mb-6">
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                type="button"
                onClick={() => setAccountType('residential')}
                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                  accountType === 'residential'
                    ? 'bg-white text-[#002F1F] shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Residential
              </button>
              <button
                type="button"
                onClick={() => setAccountType('commercial')}
                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                  accountType === 'commercial'
                    ? 'bg-white text-[#002F1F] shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Commercial
              </button>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {/* Signup Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">
                  First Name *
                </label>
                <input
                  id="firstName"
                  name="firstName"
                  type="text"
                  required
                  value={formData.firstName}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-[#002F1F]"
                />
              </div>
              <div>
                <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">
                  Last Name *
                </label>
                <input
                  id="lastName"
                  name="lastName"
                  type="text"
                  required
                  value={formData.lastName}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-[#002F1F]"
                />
              </div>
            </div>

            {accountType === 'commercial' && (
              <div>
                <label htmlFor="businessName" className="block text-sm font-medium text-gray-700 mb-1">
                  Business Name *
                </label>
                <input
                  id="businessName"
                  name="businessName"
                  type="text"
                  required
                  value={formData.businessName}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-[#002F1F]"
                />
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email Address *
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                value={formData.email}
                onChange={handleChange}
                className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-[#002F1F]"
                placeholder="your@email.com"
              />
            </div>

            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                Phone Number
              </label>
              <input
                id="phone"
                name="phone"
                type="tel"
                value={formData.phone}
                onChange={handleChange}
                className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-[#002F1F]"
                placeholder="(555) 123-4567"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Password *
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                value={formData.password}
                onChange={handleChange}
                className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-[#002F1F]"
                placeholder="At least 8 characters"
              />
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                Confirm Password *
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                required
                value={formData.confirmPassword}
                onChange={handleChange}
                className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-[#002F1F]"
                placeholder="Re-enter your password"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 text-white text-lg font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ backgroundColor: '#6ABF43' }}
            >
              {loading ? 'Creating Account...' : 'Create Account & Continue'}
            </button>
          </form>

          {/* Login Link */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Already have an account?{' '}
              <Link href="/account/login" className="font-medium" style={{ color: '#6ABF43' }}>
                Sign In
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

