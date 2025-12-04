'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';

type AccountType = 'residential' | 'commercial';

export default function LoginPage() {
  const router = useRouter();
  const [accountType, setAccountType] = useState<AccountType>('residential');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const collection = accountType === 'residential' ? 'accounts' : 'commercial-accounts';
      const response = await fetch(`/api/${collection}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Invalid email or password');
      }

      // Store token in localStorage
      if (data.token) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        localStorage.setItem('accountType', accountType);
      }

      // Redirect to account dashboard
      router.push('/account');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred during login');
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

        {/* Login Form */}
        <div className="bg-white border-2 border-gray-200 rounded-lg p-8">
          <h1 className="text-3xl font-bold mb-2 text-center" style={{ color: '#002F1F' }}>
            My Account Login
          </h1>
          <p className="text-gray-600 text-center mb-6">
            Sign in to access your account
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

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-[#002F1F]"
                placeholder="your@email.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-[#002F1F]"
                placeholder="Enter your password"
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember"
                  type="checkbox"
                  className="h-4 w-4 rounded border-gray-300"
                  style={{ accentColor: '#6ABF43' }}
                />
                <label htmlFor="remember" className="ml-2 block text-sm text-gray-700">
                  Remember me
                </label>
              </div>
              <Link
                href="/account/forgot-password"
                className="text-sm font-medium"
                style={{ color: '#6ABF43' }}
              >
                Forgot password?
              </Link>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 text-white text-lg font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ backgroundColor: '#6ABF43' }}
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          {/* Sign Up Link */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Don't have an account?{' '}
              <Link href="/start-service" className="font-medium" style={{ color: '#6ABF43' }}>
                Start Service
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

