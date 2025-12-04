'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';

type AccountType = 'residential' | 'commercial';

export default function ResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [accountType, setAccountType] = useState<AccountType>('residential');
  const [token, setToken] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Get token from URL query params
    const tokenParam = searchParams.get('token');
    if (tokenParam) {
      setToken(tokenParam);
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!token) {
      setError('Invalid or missing reset token. Please check your email link.');
      return;
    }

    if (!password) {
      setError('Password is required');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);

    try {
      const collection = accountType === 'residential' ? 'accounts' : 'commercial-accounts';
      
      const response = await fetch(`/api/${collection}/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token,
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || data.error || 'Failed to reset password');
      }

      setSuccess(true);
      
      // Redirect to login after 2 seconds
      setTimeout(() => {
        router.push('/account/login');
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred while resetting your password');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-white py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md mx-auto">
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

          <div className="bg-white border-2 border-gray-200 rounded-lg p-8 text-center">
            <div className="mb-4">
              <svg
                className="w-16 h-16 mx-auto text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h1 className="text-2xl font-bold mb-4" style={{ color: '#002F1F' }}>
              Password Set Successfully!
            </h1>
            <p className="text-gray-600 mb-6">
              Your password has been set. You can now log in to your account.
            </p>
            <p className="text-sm text-gray-500">
              Redirecting to login page...
            </p>
          </div>
        </div>
      </div>
    );
  }

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

        {/* Reset Password Form */}
        <div className="bg-white border-2 border-gray-200 rounded-lg p-8">
          <h1 className="text-3xl font-bold mb-2 text-center" style={{ color: '#002F1F' }}>
            Set Your Password
          </h1>
          <p className="text-gray-600 text-center mb-6">
            {token 
              ? 'Enter your new password to complete your account setup.'
              : 'Please check your email for the password setup link.'}
          </p>

          {!token && (
            <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
              <p className="text-sm text-yellow-800">
                No reset token found. Please click the link in your email to set your password.
              </p>
            </div>
          )}

          {/* Account Type Toggle */}
          {token && (
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
          )}

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {/* Reset Password Form */}
          {token && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                  New Password *
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-[#002F1F]"
                  placeholder="At least 8 characters"
                  minLength={8}
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
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-[#002F1F]"
                  placeholder="Re-enter your password"
                  minLength={8}
                />
              </div>

              <button
                type="submit"
                disabled={loading || !token}
                className="w-full py-3 px-4 text-white text-lg font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ backgroundColor: '#6ABF43' }}
              >
                {loading ? 'Setting Password...' : 'Set Password'}
              </button>
            </form>
          )}

          {/* Login Link */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Remember your password?{' '}
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

