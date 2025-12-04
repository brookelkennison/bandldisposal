/**
 * QuickBooks Service
 * 
 * Handles all QuickBooks API interactions for customer management and payment links.
 */

import axios from 'axios';
import { getValidQuickBooksToken } from '../utils/quickbooksAuth';
import { qbConfig } from '../utils/quickbooksConfig';

/**
 * Resident type matching the accounts collection structure
 */
export interface Resident {
  id?: string;
  accountNumber?: string;
  name: string;
  email: string;
  qbCustomerId?: string;
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
  };
  billingInfo?: {
    billingDate?: number;
    billingCadence?: string;
    accountBalance?: number;
  };
}

/**
 * QuickBooks Customer response type
 */
interface QuickBooksCustomer {
  Id: string;
  DisplayName: string;
  PrimaryEmailAddr?: {
    Address: string;
  };
  PrimaryPhone?: {
    FreeFormNumber: string;
  };
  BillAddr?: {
    Line1?: string;
    City?: string;
    CountrySubDivisionCode?: string;
    PostalCode?: string;
  };
  SyncToken?: string;
}

/**
 * QuickBooks API response wrapper
 */
interface QuickBooksResponse<T> {
  QueryResponse?: {
    [key: string]: T[];
    maxResults?: number;
  };
  Customer?: T;
  time?: string;
  Fault?: {
    Error: Array<{
      Message: string;
      Detail: string;
      code: string;
    }>;
  };
}

/**
 * Get the QuickBooks API base URL based on environment
 */
function getApiBaseUrl(): string {
  return qbConfig.environment === 'production'
    ? 'https://quickbooks.api.intuit.com/v3/company'
    : 'https://sandbox-quickbooks.api.intuit.com/v3/company';
}

/**
 * Convert a Resident to QuickBooks Customer format
 */
function residentToQBCustomer(resident: Resident): any {
  // Try to split name into GivenName and FamilyName
  // If name contains a space, split it; otherwise use DisplayName
  const nameParts = resident.name.trim().split(/\s+/);
  const hasMultipleParts = nameParts.length > 1;

  const customer: any = {
    DisplayName: resident.accountNumber
      ? `${resident.name} (${resident.accountNumber})`
      : resident.name,
  };

  // Add GivenName and FamilyName if we can split the name
  if (hasMultipleParts) {
    customer.GivenName = nameParts[0];
    customer.FamilyName = nameParts.slice(1).join(' ');
  } else {
    // If single name, use DisplayName only (GivenName is required, so use it)
    customer.GivenName = resident.name;
  }

  // Add email if available
  if (resident.email) {
    customer.PrimaryEmailAddr = {
      Address: resident.email,
    };
  }

  // Add phone if available
  if (resident.contactInfo?.phone) {
    customer.PrimaryPhone = {
      FreeFormNumber: resident.contactInfo.phone,
    };
  }

  // Add billing address if available
  if (resident.contactInfo?.address) {
    customer.BillAddr = {
      Line1: resident.contactInfo.address,
      City: resident.contactInfo.city,
      CountrySubDivisionCode: resident.contactInfo.state,
      PostalCode: resident.contactInfo.zip,
      Country: 'US', // Default to US
    };
  }

  return customer;
}

/**
 * Create a customer in QuickBooks from a resident
 * 
 * @param resident - The resident/account to create as a QuickBooks customer
 * @returns The QuickBooks customer ID
 * @throws Error if the customer creation fails
 */
export async function createCustomerFromResident(
  resident: Resident
): Promise<string> {
  try {
    console.log('[QuickBooks] Creating customer from resident:', {
      accountNumber: resident.accountNumber,
      name: resident.name,
      email: resident.email,
    });

    // Get valid access token and realm ID
    const { accessToken, realmId } = await getValidQuickBooksToken();

    // Prepare customer data
    const customerData = residentToQBCustomer(resident);

    const apiBase = getApiBaseUrl();
    const url = `${apiBase}/${realmId}/customer?minorversion=65`;

    console.log('[QuickBooks] POST request to:', url);
    console.log('[QuickBooks] Customer data:', JSON.stringify(customerData, null, 2));

    // Make API call to create customer
    const response = await axios.post<QuickBooksResponse<QuickBooksCustomer>>(
      url,
      customerData,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
      }
    );

    // Check for errors in response
    if (response.data.Fault) {
      const errorMessages = response.data.Fault.Error.map(
        (err) => `${err.Message}: ${err.Detail}`
      ).join('; ');
      throw new Error(`QuickBooks API error: ${errorMessages}`);
    }

    // Extract customer ID from response
    const customer = response.data.Customer;
    if (!customer || !customer.Id) {
      throw new Error('QuickBooks API returned invalid response: missing customer ID');
    }

    const qbCustomerId = customer.Id;
    console.log('[QuickBooks] Customer created successfully:', {
      qbCustomerId,
      displayName: customer.DisplayName,
    });

    return qbCustomerId;
  } catch (error: any) {
    console.error('[QuickBooks] Error creating customer:', {
      error: error.message,
      response: error.response?.data,
      status: error.response?.status,
      resident: {
        accountNumber: resident.accountNumber,
        name: resident.name,
        email: resident.email,
      },
    });

    // Re-throw with more context
    if (error.response?.data) {
      const qbError = error.response.data;
      if (qbError.Fault) {
        const errorMessages = qbError.Fault.Error.map(
          (err: any) => `${err.Message}: ${err.Detail}`
        ).join('; ');
        throw new Error(`QuickBooks API error: ${errorMessages}`);
      }
      throw new Error(
        `QuickBooks API error: ${JSON.stringify(qbError)}`
      );
    }

    throw new Error(
      `Failed to create QuickBooks customer: ${error.message}`
    );
  }
}

/**
 * Update a customer in QuickBooks from a resident
 * 
 * @param resident - The resident/account to update in QuickBooks (must have qbCustomerId)
 * @returns The QuickBooks customer ID
 * @throws Error if the customer update fails
 */
export async function updateCustomerFromResident(
  resident: Resident
): Promise<string> {
  try {
    if (!resident.qbCustomerId) {
      throw new Error('Resident must have qbCustomerId to update customer');
    }

    console.log('[QuickBooks] Updating customer from resident:', {
      qbCustomerId: resident.qbCustomerId,
      accountNumber: resident.accountNumber,
      name: resident.name,
      email: resident.email,
    });

    // Get valid access token and realm ID
    const { accessToken, realmId } = await getValidQuickBooksToken();

    // First, fetch the existing customer to get the SyncToken (required for updates)
    const apiBase = getApiBaseUrl();
    // Query the customer by ID
    const getUrl = `${apiBase}/${realmId}/query?query=select * from Customer where Id = '${resident.qbCustomerId}'&minorversion=65`;

    console.log('[QuickBooks] GET request to fetch existing customer:', getUrl);

    const getResponse = await axios.get<QuickBooksResponse<QuickBooksCustomer>>(
      getUrl,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: 'application/json',
        },
      }
    );

    if (getResponse.data.Fault) {
      const errorMessages = getResponse.data.Fault.Error.map(
        (err) => `${err.Message}: ${err.Detail}`
      ).join('; ');
      throw new Error(`QuickBooks API error fetching customer: ${errorMessages}`);
    }

    // Extract customer from QueryResponse
    const existingCustomer = getResponse.data.QueryResponse?.Customer?.[0];
    if (!existingCustomer) {
      throw new Error(`Customer with ID ${resident.qbCustomerId} not found in QuickBooks`);
    }

    // Prepare updated customer data
    const customerData = residentToQBCustomer(resident);
    customerData.Id = resident.qbCustomerId;
    customerData.SyncToken = existingCustomer.SyncToken;

    const updateUrl = `${apiBase}/${realmId}/customer?minorversion=65`;

    console.log('[QuickBooks] POST request to update customer:', updateUrl);
    console.log('[QuickBooks] Updated customer data:', JSON.stringify(customerData, null, 2));

    // Make API call to update customer
    const response = await axios.post<QuickBooksResponse<QuickBooksCustomer>>(
      updateUrl,
      customerData,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
      }
    );

    // Check for errors in response
    if (response.data.Fault) {
      const errorMessages = response.data.Fault.Error.map(
        (err) => `${err.Message}: ${err.Detail}`
      ).join('; ');
      throw new Error(`QuickBooks API error: ${errorMessages}`);
    }

    // Extract customer ID from response
    const customer = response.data.Customer;
    if (!customer || !customer.Id) {
      throw new Error('QuickBooks API returned invalid response: missing customer ID');
    }

    const qbCustomerId = customer.Id;
    console.log('[QuickBooks] Customer updated successfully:', {
      qbCustomerId,
      displayName: customer.DisplayName,
    });

    return qbCustomerId;
  } catch (error: any) {
    console.error('[QuickBooks] Error updating customer:', {
      error: error.message,
      response: error.response?.data,
      status: error.response?.status,
      resident: {
        qbCustomerId: resident.qbCustomerId,
        accountNumber: resident.accountNumber,
        name: resident.name,
        email: resident.email,
      },
    });

    // Re-throw with more context
    if (error.response?.data) {
      const qbError = error.response.data;
      if (qbError.Fault) {
        const errorMessages = qbError.Fault.Error.map(
          (err: any) => `${err.Message}: ${err.Detail}`
        ).join('; ');
        throw new Error(`QuickBooks API error: ${errorMessages}`);
      }
      throw new Error(
        `QuickBooks API error: ${JSON.stringify(qbError)}`
      );
    }

    throw new Error(
      `Failed to update QuickBooks customer: ${error.message}`
    );
  }
}

/**
 * Create a payment link for a QuickBooks customer
 * 
 * @param qbCustomerId - The QuickBooks customer ID
 * @param amountOrPlan - Either a fixed amount (number) or a plan identifier (string)
 * @returns The payment link URL (stubbed for now)
 * @throws Error if the payment link creation fails
 */
export async function createPaymentLink(
  qbCustomerId: string,
  amountOrPlan: number | string
): Promise<string> {
  try {
    console.log('[QuickBooks] Creating payment link:', {
      qbCustomerId,
      amountOrPlan,
    });

    // TODO: Implement actual QuickBooks payment link creation
    // For now, this is a stub that returns a placeholder URL
    // QuickBooks Payments API would be used here when implemented
    
    // Stub implementation
    const isAmount = typeof amountOrPlan === 'number';
    const amount = isAmount ? amountOrPlan : 0; // Default amount for plan
    const planId = isAmount ? undefined : amountOrPlan;

    // Placeholder URL - replace with actual QuickBooks payment link when implemented
    const paymentLink = `https://quickbooks.intuit.com/payments/${qbCustomerId}?amount=${amount}${planId ? `&plan=${planId}` : ''}`;

    console.log('[QuickBooks] Payment link created (stub):', paymentLink);

    return paymentLink;
  } catch (error: any) {
    console.error('[QuickBooks] Error creating payment link:', {
      error: error.message,
      qbCustomerId,
      amountOrPlan,
    });

    throw new Error(
      `Failed to create QuickBooks payment link: ${error.message}`
    );
  }
}

