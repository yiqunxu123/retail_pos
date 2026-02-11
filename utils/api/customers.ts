/**
 * Customers API
 *
 * Backend endpoints:
 *   POST   /tenant/api/v1/sale/customers          – create customer
 *   PUT    /tenant/api/v1/sale/customers/:id       – update customer
 *   GET    /tenant/api/v1/sale/customers/:id       – get customer by id
 *   GET    /tenant/api/v1/sale/customers/list2     – search customers
 *   GET    /tenant/api/v1/core/user/list           – list users (for sales rep)
 */

import { AxiosError } from 'axios';
import khubApi from './khub';

const CUSTOMERS_URL = '/tenant/api/v1/sale/customers';
const USER_URL = '/tenant/api/v1/core/user';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface SaleAgent {
  id: number;
  first_name: string;
  last_name: string;
}

export interface QuickCustomerPayload {
  business_name: string;
  email: string | null;
  business_phone_no: string | null;
  class_of_trades: string;
  customer_type: number | null;
  sale_agent_obj: { label: string; value: number | null; key?: number | null };
  is_active: boolean;
  balance_limit_check: boolean;
  invoice_aging: number;
  allow_ecom: string;
}

export interface CustomerBillingDetails {
  address?: string;
  city?: string;
  county?: string;
  state?: string;
  country?: string;
  [key: string]: unknown;
}

export interface CustomerEntity {
  id: number;
  no?: string;
  business_name: string;
  name?: string;
  email?: string | null;
  phone_no?: string | null;
  business_phone_no?: string | null;
  class_of_trades?: string;
  customer_type?: number | null;
  is_active?: boolean;
  balance?: number;
  balance_limit?: number;
  allow_ecom?: string;
  invoice_aging?: number;
  tenant_users?: SaleAgent | null;
  customer_shipping_details?: Record<string, unknown>;
  customer_billing_details?: CustomerBillingDetails | null;
  company_name?: string;
  [key: string]: unknown;
}

export interface CustomerSearchParams {
  searchbyNameBusinessName?: string;
  searchbyIdNumber?: string;
  searchbyEmailAddressPhone?: string;
  isActive?: number;
  sort_by?: string;
}

export interface CustomerListResponse {
  entities: CustomerEntity[];
  totalCount?: number;
}

export interface CustomerEntityResponse {
  message: string;
  entity: CustomerEntity;
  errors?: string[];
}

// ---------------------------------------------------------------------------
// Helper – parse API errors
// ---------------------------------------------------------------------------
export function parseCustomerApiError(error: AxiosError): string[] {
  const data = error.response?.data as { message?: string; errors?: string[] } | undefined;
  if (data?.errors?.length) return data.errors;
  if (data?.message) return [data.message];
  if (error.message) return [error.message];
  return ['An unexpected error occurred'];
}

// ---------------------------------------------------------------------------
// CRUD functions
// ---------------------------------------------------------------------------

export async function createQuickCustomer(customer: QuickCustomerPayload) {
  return khubApi.post<CustomerEntityResponse>(CUSTOMERS_URL, customer);
}

export async function updateCustomer(customer: Partial<QuickCustomerPayload> & Record<string, unknown>, customerId: number) {
  return khubApi.put<CustomerEntityResponse>(`${CUSTOMERS_URL}/${customerId}`, customer);
}

export async function getCustomerById(customerId: number) {
  return khubApi.get<CustomerEntityResponse>(`${CUSTOMERS_URL}/${customerId}`);
}

export async function fetchSalesReps() {
  return khubApi.get<{ entities: SaleAgent[] }>(`${USER_URL}/list`, {
    params: { assign_customer: 1 },
  });
}

export async function searchCustomers(params: CustomerSearchParams) {
  const search_name_business_name = params.searchbyNameBusinessName?.trimStart() ?? '';
  const search_number_id = params.searchbyIdNumber?.trimStart() ?? '';
  const search_email_address_phone = params.searchbyEmailAddressPhone?.trimStart() ?? '';
  const is_active = params.isActive ?? 1;
  const sort_by = params.sort_by || 'name:asc';

  return khubApi.get<CustomerListResponse>(
    `${CUSTOMERS_URL}/list2`, {
      params: {
        search_name_business_name,
        search_number_id,
        search_email_address_phone,
        sort_by,
        is_active,
      },
    }
  );
}
