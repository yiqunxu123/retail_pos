/**
 * Customers Data Hook
 * 
 * Provides real-time synced customer data from PowerSync.
 * 
 * Usage:
 *   const { customers, isLoading } = useCustomers();
 *   const { customer } = useCustomerById(id);
 */

import { useMemo } from 'react';
import { Customer as DBCustomer } from '../schema';
import { useSyncStream } from '../useSyncStream';

// ============================================================================
// Types
// ============================================================================

/** Customer data as displayed in the UI */
export interface CustomerView {
  id: string;
  no: string;
  businessName: string;
  name: string;
  email: string;
  phone: string;
  businessPhone: string;
  address: string;
  city: string;
  state: string;
  country: string;
  zipCode: string;
  balance: number;
  balanceLimit: number;
  allowEcom: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// ============================================================================
// Data Transformers
// ============================================================================

/** Transform database record to UI view */
function toCustomerView(db: DBCustomer & { id: string }): CustomerView {
  return {
    id: db.id,
    no: db.no || '',
    businessName: db.business_name || '',
    name: db.name || '',
    email: db.email || '',
    phone: db.phone_no || '',
    businessPhone: db.business_phone_no || '',
    address: db.address || '',
    city: db.business_city || '',
    state: db.business_state || '',
    country: db.business_country || '',
    zipCode: db.business_zip_code || '',
    balance: db.balance || 0,
    balanceLimit: db.balance_limit || 0,
    allowEcom: db.allow_ecom === 'Y',
    isActive: db.status === 1,
    createdAt: db.created_at || '',
    updatedAt: db.updated_at || '',
  };
}

// ============================================================================
// Hooks
// ============================================================================

/** Get all customers with real-time sync */
export function useCustomers() {
  const { data, isLoading, error, isStreaming, refresh } = useSyncStream<DBCustomer & { id: string }>(
    `SELECT * FROM customers ORDER BY business_name ASC`
  );

  const customers = useMemo(() => data.map(toCustomerView), [data]);

  return {
    customers,
    isLoading,
    error,
    isStreaming,
    refresh,
    count: customers.length,
  };
}

/** Get a single customer by ID */
export function useCustomerById(id: string | null) {
  const { data, isLoading, error } = useSyncStream<DBCustomer & { id: string }>(
    `SELECT * FROM customers WHERE id = ?`,
    id ? [id] : [],
    { enabled: !!id }
  );

  const customer = useMemo(() => (data[0] ? toCustomerView(data[0]) : null), [data]);

  return { customer, isLoading, error };
}

/** Search customers by name or business name */
export function useCustomerSearch(query: string) {
  const searchTerm = `%${query}%`;
  
  const { data, isLoading, error } = useSyncStream<DBCustomer & { id: string }>(
    `SELECT * FROM customers 
     WHERE business_name LIKE ? OR name LIKE ? OR email LIKE ? OR phone_no LIKE ?
     ORDER BY business_name ASC
     LIMIT 50`,
    [searchTerm, searchTerm, searchTerm, searchTerm],
    { enabled: query.length >= 2 }
  );

  const customers = useMemo(() => data.map(toCustomerView), [data]);

  return { customers, isLoading, error };
}
