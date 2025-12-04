'use client';

import { useState, useEffect, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

interface Borough {
  id: string;
  name: string;
  code: string;
}

type ServiceType = 'residential' | 'commercial';

interface FormData {
  serviceType: ServiceType;
  firstName: string;
  lastName: string;
  businessName?: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  borough: string;
  desiredStartDate: string;
}

interface FormErrors {
  [key: string]: string;
}

export default function StartServicePage() {
  const router = useRouter();
  const [boroughs, setBoroughs] = useState<Borough[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [accountLoading, setAccountLoading] = useState(true);
  const [accountType, setAccountType] = useState<'residential' | 'commercial'>('residential');
  const [accountId, setAccountId] = useState<string | null>(null);
  const [formData, setFormData] = useState<FormData>({
    serviceType: 'residential',
    firstName: '',
    lastName: '',
    businessName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zip: '',
    borough: '',
    desiredStartDate: '',
  });

  // Check if user is logged in (optional - allows guest requests)
  useEffect(() => {
    async function checkAuthAndLoadAccount() {
      try {
        const token = localStorage.getItem('token');
        const storedAccountType = localStorage.getItem('accountType');
        const signupData = localStorage.getItem('signupData');

        // If logged in, pre-fill form with account data
        if (token && storedAccountType) {
          setAccountType(storedAccountType as 'residential' | 'commercial');
          setFormData(prev => ({
            ...prev,
            serviceType: storedAccountType as 'residential' | 'commercial',
          }));

          try {
            // Fetch account data
            const collection = storedAccountType === 'residential' ? 'accounts' : 'commercial-accounts';
            const response = await fetch(`/api/${collection}/me`, {
              headers: {
                Authorization: `JWT ${token}`,
              },
            });

            if (response.ok) {
              const account = await response.json();
              setAccountId(account.id);

              // Pre-fill form with account data
              setFormData(prev => ({
                ...prev,
                email: account.email || '',
                phone: account.contactInfo?.phone || '',
                address: account.contactInfo?.address || '',
                city: account.contactInfo?.city || '',
                state: account.contactInfo?.state || '',
                zip: account.contactInfo?.zip || '',
                borough: typeof account.borough === 'string' ? account.borough : account.borough?.id || '',
              }));

              // Try to parse name from account
              if (account.name) {
                if (storedAccountType === 'commercial') {
                  setFormData(prev => ({
                    ...prev,
                    businessName: account.name,
                  }));
                } else {
                  const nameParts = account.name.split(' ');
                  if (nameParts.length >= 2) {
                    setFormData(prev => ({
                      ...prev,
                      firstName: nameParts[0] || '',
                      lastName: nameParts.slice(1).join(' ') || '',
                    }));
                  }
                }
              }
            } else {
              // Token invalid, clear it but allow guest request
              localStorage.removeItem('token');
              localStorage.removeItem('user');
              localStorage.removeItem('accountType');
            }
          } catch (error) {
            console.error('Error loading account:', error);
            // Allow guest request even if account fetch fails
          }
        }

        // If we have signup data from redirect, use it
        if (signupData) {
          try {
            const signup = JSON.parse(signupData);
            setFormData(prev => ({
              ...prev,
              firstName: signup.firstName || prev.firstName,
              lastName: signup.lastName || prev.lastName,
              businessName: signup.businessName || prev.businessName,
              phone: signup.phone || prev.phone,
            }));
            // Clear signup data after using it
            localStorage.removeItem('signupData');
          } catch (e) {
            // Ignore parse errors
          }
        }
      } catch (error) {
        console.error('Error in checkAuthAndLoadAccount:', error);
      } finally {
        setAccountLoading(false);
      }
    }

    checkAuthAndLoadAccount();
  }, []);

  // Fetch boroughs from Payload on mount
  useEffect(() => {
    async function fetchBoroughs() {
      try {
        // Payload API endpoint - sort by name ascending
        const response = await fetch('/api/boroughs?limit=100&sort=name&depth=0');
        if (response.ok) {
          const data = await response.json();
          console.log('Boroughs API response:', data);
          if (data.docs && Array.isArray(data.docs)) {
            setBoroughs(data.docs);
            console.log('Boroughs loaded:', data.docs.length, data.docs);
          } else if (data.results && Array.isArray(data.results)) {
            // Some Payload versions use 'results' instead of 'docs'
            setBoroughs(data.results);
            console.log('Boroughs loaded (results):', data.results.length);
          } else {
            console.error('Unexpected response structure:', data);
            // Try to set boroughs anyway if data is an array
            if (Array.isArray(data)) {
              setBoroughs(data);
            }
          }
        } else {
          const errorText = await response.text();
          console.error('Failed to fetch boroughs:', response.status, response.statusText, errorText);
        }
      } catch (error) {
        console.error('Error fetching boroughs:', error);
      }
    }
    fetchBoroughs();
  }, []);

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // Required field validations
    if (!formData.firstName.trim()) {
      newErrors.firstName = 'First name is required';
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    }

    if (formData.serviceType === 'commercial' && !formData.businessName?.trim()) {
      newErrors.businessName = 'Business name is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }

    if (!formData.address.trim()) {
      newErrors.address = 'Address is required';
    }

    if (!formData.city.trim()) {
      newErrors.city = 'City is required';
    }

    if (!formData.state.trim()) {
      newErrors.state = 'State is required';
    } else if (formData.state.length !== 2) {
      newErrors.state = 'State must be 2 characters (e.g., NY, CA)';
    }

    if (!formData.zip.trim()) {
      newErrors.zip = 'ZIP code is required';
    } else if (!/^\d{5}(-\d{4})?$/.test(formData.zip)) {
      newErrors.zip = 'Invalid ZIP code format (use 12345 or 12345-6789)';
    }

    if (formData.serviceType === 'residential' && !formData.borough) {
      newErrors.borough = 'Borough is required';
    }

    if (!formData.desiredStartDate) {
      newErrors.desiredStartDate = 'Desired start date is required';
    } else {
      const selectedDate = new Date(formData.desiredStartDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (selectedDate < today) {
        newErrors.desiredStartDate = 'Start date cannot be in the past';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setErrors({});

    try {
      // Submit service request - the endpoint will update the account and process the request
      const serviceEndpoint = accountType === 'commercial' 
        ? '/api/commercial/start-service' 
        : '/api/residents/start-service';
      
      const response = await fetch(serviceEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...(accountId && { accountId }), // Only include accountId if user is logged in
          ...formData,
          name: accountType === 'commercial' 
            ? formData.businessName 
            : `${formData.firstName} ${formData.lastName}`.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        // Handle validation errors from API
        if (data.missingFields) {
          const apiErrors: FormErrors = {};
          data.missingFields.forEach((field: string) => {
            apiErrors[field] = `${field} is required`;
          });
          setErrors(apiErrors);
        } else if (data.errors) {
          const apiErrors: FormErrors = {};
          Object.keys(data.errors).forEach((field: string) => {
            apiErrors[field] = data.errors[field].message || `${field} is invalid`;
          });
          setErrors(apiErrors);
        } else {
          setErrors({ submit: data.error || 'Failed to submit service request' });
        }
        setLoading(false);
        return;
      }

      // Success
      setSubmitted(true);
    } catch (error) {
      console.error('Error submitting form:', error);
      setErrors({ submit: 'An error occurred. Please try again.' });
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  // Show loading while checking auth
  if (accountLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2" style={{ borderColor: '#6ABF43' }}></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-white py-16 px-4">
        <div className="max-w-3xl mx-auto">
          <div className="text-center">
            {/* Logo/Branding */}
            <div className="mb-12 flex items-center justify-center">
              <Image
                src="/bl-logo.png"
                alt="B&L Disposal Logo"
                width={300}
                height={200}
                className="h-auto "
                priority
                style={{ objectFit: 'contain' }}
                onError={(e) => {
                  // Fallback to text if image doesn't exist
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                  const fallback = target.nextElementSibling as HTMLElement;
                  if (fallback) fallback.style.display = 'flex';
                }}
              />
              <div className="text-left hidden" style={{ display: 'none' }} id="logo-fallback-success">
                <h2 className="text-3xl font-bold" style={{ color: '#002F1F' }}>
                  B&L DISPOSAL
                </h2>
                <p className="text-base" style={{ color: '#6ABF43' }}>
                  CREATIVE WASTE SOLUTIONS
                </p>
              </div>
            </div>

            <div className="mb-8">
              <svg
                className="mx-auto h-24 w-24"
                style={{ color: '#6ABF43' }}
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
            <h1 className="text-4xl font-bold mb-4" style={{ color: '#002F1F' }}>
              Service Request Submitted!
            </h1>
            <p className="text-xl text-gray-700 mb-6">
              We&apos;re setting up your billing and will contact you soon to confirm your service start date.
            </p>
            {!accountId && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <p className="text-base text-blue-900 font-medium mb-2">
                  📧 Check Your Email
                </p>
                <p className="text-sm text-blue-800">
                  We&apos;ve created an account for you and sent a password setup email to <strong>{formData.email}</strong>. 
                  Click the link in the email to set your password and access your account online.
                </p>
              </div>
            )}
            <p className="text-base text-gray-600">
              {accountId 
                ? 'You can manage your account and view service details in your account dashboard.'
                : 'Once you set up your password, you can log in to manage your account and view service details.'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white py-6 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6 text-center">
          <p className="text-base mb-1" style={{ color: '#002F1F' }}>
            B&L Disposal Trash & Recycling Service
          </p>
          <h1 className="text-4xl md:text-5xl font-bold mb-2" style={{ color: '#002F1F' }}>
            Start Service
          </h1>
          <p className="text-base text-gray-600 max-w-3xl mx-auto">
            We believe in service beyond expectations, achieved through a constant desire to anticipate and fulfill evolving customer needs.
          </p>
        </div>

        <div className="bg-white border-4 border-gray-300 p-6">
          <div className="mb-6">
            <h3 className="text-xl font-bold mb-1 text-gray-900">
              Choose Your Waste Solution
            </h3>
            <p className="text-sm text-gray-600">
              Enter your information to start service or get a quote.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Service Type Selection */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <button
                type="button"
                onClick={() => {
                  setFormData(prev => ({ ...prev, serviceType: 'residential' }));
                  setAccountType('residential');
                  setErrors(prev => {
                    const newErrors = { ...prev };
                    delete newErrors.businessName;
                    return newErrors;
                  });
                }}
                className={`p-4 border-4 rounded-lg text-left transition-all ${
                  formData.serviceType === 'residential'
                    ? 'bg-green-50 border-[#6ABF43]'
                    : 'bg-gray-50 border-gray-300 hover:border-gray-400'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <svg 
                      className={`w-8 h-8 ${formData.serviceType === 'residential' ? 'text-[#6ABF43]' : 'text-gray-400'}`}
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                    </svg>
                    <span className={`font-semibold ${formData.serviceType === 'residential' ? 'text-[#002F1F]' : 'text-gray-700'}`}>
                      For Your Home
                    </span>
                  </div>
                  <input
                    type="radio"
                    name="serviceType"
                    checked={formData.serviceType === 'residential'}
                    onChange={() => {}}
                    className="w-5 h-5"
                    style={{ accentColor: '#6ABF43' }}
                  />
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  setFormData(prev => ({ ...prev, serviceType: 'commercial' }));
                  setAccountType('commercial');
                }}
                className={`p-4 border-4 rounded-lg text-left transition-all ${
                  formData.serviceType === 'commercial'
                    ? 'bg-blue-50 border-blue-600'
                    : 'bg-gray-50 border-gray-300 hover:border-gray-400'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <svg 
                      className={`w-8 h-8 ${formData.serviceType === 'commercial' ? 'text-blue-600' : 'text-gray-400'}`}
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                    <span className={`font-semibold ${formData.serviceType === 'commercial' ? 'text-blue-900' : 'text-gray-700'}`}>
                      For Business & Organizations
                    </span>
                  </div>
                  <input
                    type="radio"
                    name="serviceType"
                    checked={formData.serviceType === 'commercial'}
                    onChange={() => {}}
                    className="w-5 h-5"
                    style={{ accentColor: '#2563eb' }}
                  />
                </div>
              </button>
            </div>

            {/* Address Field - First */}
            <div>
              <label htmlFor="address" className="block text-sm font-semibold text-gray-700 mb-1">
                Address <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none">
                  <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <input
                  type="text"
                  id="address"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  required
                  placeholder="e.g. 123 Main Street, NW, New York"
                  className={`w-full pl-8 pr-3 py-2 border-2 focus:outline-none ${
                    errors.address 
                      ? 'border-red-500' 
                      : 'border-gray-300 focus:border-[#002F1F]'
                  }`}
                />
              </div>
              {errors.address && (
                <p className="mt-1 text-xs text-red-500">{errors.address}</p>
              )}
            </div>

            {/* Business Name - Only for Commercial */}
            {formData.serviceType === 'commercial' && (
              <div>
                <label htmlFor="businessName" className="block text-sm font-semibold text-gray-700 mb-1">
                  Business Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="businessName"
                  name="businessName"
                  value={formData.businessName || ''}
                  onChange={handleChange}
                  required
                  placeholder="e.g. ABC Restaurant"
                  className={`w-full px-3 py-2 border-2 focus:outline-none ${
                    errors.businessName 
                      ? 'border-red-500' 
                      : 'border-gray-300 focus:border-[#002F1F]'
                  }`}
                />
                {errors.businessName && (
                  <p className="mt-1 text-xs text-red-500">{errors.businessName}</p>
                )}
              </div>
            )}

            {/* First Name and Last Name Row */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="firstName" className="block text-sm font-semibold text-gray-700 mb-1">
                  Name (First Name) <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none">
                    <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <input
                    type="text"
                    id="firstName"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleChange}
                    required
                    placeholder="e.g. Joshua"
                    className={`w-full pl-8 pr-3 py-2 border-2 focus:outline-none ${
                      errors.firstName 
                        ? 'border-red-500' 
                        : 'border-gray-300 focus:border-[#002F1F]'
                    }`}
                  />
                </div>
                {errors.firstName && (
                  <p className="mt-1 text-xs text-red-500">{errors.firstName}</p>
                )}
              </div>

              <div>
                <label htmlFor="lastName" className="block text-sm font-semibold text-gray-700 mb-1">
                  Last Name <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none">
                    <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <input
                    type="text"
                    id="lastName"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleChange}
                    required
                    placeholder="e.g. Smith"
                    className={`w-full pl-8 pr-3 py-2 border-2 focus:outline-none ${
                      errors.lastName 
                        ? 'border-red-500' 
                        : 'border-gray-300 focus:border-[#002F1F]'
                    }`}
                  />
                </div>
                {errors.lastName && (
                  <p className="mt-1 text-xs text-red-500">{errors.lastName}</p>
                )}
              </div>
            </div>

            {/* Email and Phone Row */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-1">
                  Email <span className="text-red-500">*</span>
                  {accountId && <span className="text-gray-500 text-xs ml-1">(from your account)</span>}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none">
                    <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    readOnly={!!accountId}
                    disabled={!!accountId}
                    placeholder="e.g. smith@myemail.com"
                    className={`w-full pl-8 pr-3 py-2 border-2 focus:outline-none ${
                      accountId 
                        ? 'bg-gray-100 text-gray-600 cursor-not-allowed border-gray-300'
                        : errors.email 
                          ? 'border-red-500' 
                          : 'border-gray-300 focus:border-[#002F1F]'
                    }`}
                  />
                </div>
                {errors.email && (
                  <p className="mt-1 text-xs text-red-500">{errors.email}</p>
                )}
              </div>

              <div>
                <label htmlFor="phone" className="block text-sm font-semibold text-gray-700 mb-1">
                  Phone
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none">
                    <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                  </div>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="e.g. 205-555-0168"
                    className="w-full pl-8 pr-3 py-2 border-2 border-gray-300 focus:outline-none focus:border-[#002F1F]"
                  />
                </div>
              </div>
            </div>

            {/* City, State, ZIP Row */}
            <div className="grid grid-cols-4 gap-4">
              <div className="col-span-2">
                <label htmlFor="city" className="block text-sm font-semibold text-gray-700 mb-1">
                  City <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="city"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  required
                  className={`w-full px-3 py-2 border-2 focus:outline-none ${
                    errors.city 
                      ? 'border-red-500' 
                      : 'border-gray-300 focus:border-[#002F1F]'
                  }`}
                />
                {errors.city && (
                  <p className="mt-1 text-xs text-red-500">{errors.city}</p>
                )}
              </div>

              <div>
                <label htmlFor="state" className="block text-sm font-semibold text-gray-700 mb-1">
                  State <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="state"
                  name="state"
                  value={formData.state}
                  onChange={handleChange}
                  required
                  maxLength={2}
                  placeholder="NY"
                  className={`w-full px-3 py-2 border-2 focus:outline-none ${
                    errors.state 
                      ? 'border-red-500' 
                      : 'border-gray-300 focus:border-[#002F1F]'
                  }`}
                />
                {errors.state && (
                  <p className="mt-1 text-xs text-red-500">{errors.state}</p>
                )}
              </div>

              <div>
                <label htmlFor="zip" className="block text-sm font-semibold text-gray-700 mb-1">
                  ZIP Code <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="zip"
                  name="zip"
                  value={formData.zip}
                  onChange={handleChange}
                  required
                  placeholder="12345"
                  className={`w-full px-3 py-2 border-2 focus:outline-none ${
                    errors.zip 
                      ? 'border-red-500' 
                      : 'border-gray-300 focus:border-[#002F1F]'
                  }`}
                />
                {errors.zip && (
                  <p className="mt-1 text-xs text-red-500">{errors.zip}</p>
                )}
              </div>
            </div>

            {/* Borough and Start Date Row */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="borough" className="block text-sm font-semibold text-gray-700 mb-1">
                  Borough {formData.serviceType === 'residential' && <span className="text-red-500">*</span>}
                </label>
                <select
                  id="borough"
                  name="borough"
                  value={formData.borough}
                  onChange={handleChange}
                  required={formData.serviceType === 'residential'}
                  className={`w-full px-3 py-2 border-2 focus:outline-none bg-white ${
                    errors.borough 
                      ? 'border-red-500' 
                      : 'border-gray-300 focus:border-[#002F1F]'
                  }`}
                >
                  <option value="">Select a borough</option>
                  {boroughs.length === 0 ? (
                    <option value="" disabled>Loading boroughs...</option>
                  ) : (

                    boroughs.map((borough) => (
                    <option key={borough.id} value={borough.id}>
                      {borough.name} ({borough.code})
                    </option>
                    ))
                  )}
                </select>
                {errors.borough && (
                  <p className="mt-1 text-xs text-red-500">{errors.borough}</p>
                )}
                {boroughs.length === 0 && (
                  <p className="mt-1 text-xs text-gray-500">No boroughs available. Check console for errors.</p>
                )}
              </div>

              <div>
                <label htmlFor="desiredStartDate" className="block text-sm font-semibold text-gray-700 mb-1">
                  Desired Start Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  id="desiredStartDate"
                  name="desiredStartDate"
                  value={formData.desiredStartDate}
                  onChange={handleChange}
                  required
                  min={new Date().toISOString().split('T')[0]}
                  className={`w-full px-3 py-2 border-2 focus:outline-none ${
                    errors.desiredStartDate 
                      ? 'border-red-500' 
                      : 'border-gray-300 focus:border-[#002F1F]'
                  }`}
                />
                {errors.desiredStartDate && (
                  <p className="mt-1 text-xs text-red-500">{errors.desiredStartDate}</p>
                )}
              </div>
            </div>

            {/* Terms and Conditions */}
            <div className="flex items-start pt-2">
              <input
                type="checkbox"
                id="terms"
                required
                className="mt-1 h-4 w-4 border-2 border-gray-300 focus:outline-none"
                style={{ accentColor: '#002F1F' }}
              />
              <label htmlFor="terms" className="ml-2 text-sm text-gray-600">
                I agree to the B&L Disposal{' '}
                <a href="#" className="underline" style={{ color: '#002F1F' }}>Terms of Service</a>
                {' '}and{' '}
                <a href="#" className="underline" style={{ color: '#002F1F' }}>Privacy Policy</a>.
              </label>
            </div>

            {/* Submit Error */}
            {errors.submit && (
              <div className="p-3 bg-red-50 border-2 border-red-200">
                <p className="text-sm text-red-600">{errors.submit}</p>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full text-white font-bold py-3 px-6 focus:outline-none disabled:opacity-60 disabled:cursor-not-allowed border-2"
              style={{
                backgroundColor: '#002F1F',
                borderColor: '#002F1F',
              }}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="none"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Submitting...
                </span>
              ) : (
                'See available services'
              )}
            </button>
          </form>

          <p className="mt-4 text-xs text-gray-500 text-center flex items-center justify-center gap-1">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            This site is protected by reCAPTCHA and the Google Privacy Policy and Terms of Service apply.
          </p>
        </div>
      </div>
    </div>
  );
}

