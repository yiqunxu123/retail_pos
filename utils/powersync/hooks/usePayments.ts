/**
 * Payments Data Hook
 * 
 * Provides real-time synced payment data from PowerSync.
 * 
 * Usage:
 *   const { payments, isLoading } = usePayments();
 */

import { useMemo } from 'react';
import { useSyncStream } from '../useSyncStream';

// ============================================================================
// Types
// ============================================================================

/** Raw joined data from database */
interface PaymentJoinRow {
  id: string;
  customer_id: number | null;
  invoice_id: number | null;
  no: string;
  status: number;
  payment_type: number;
  payment_date: string;
  amount: number;
  category: number;
  memo: string | null;
  created_at: string;
  updated_at: string;
  // From customer join
  customer_name: string | null;
  business_name: string | null;
}

/** Payment data as displayed in the UI */
export interface PaymentView {
  id: string;
  paymentNo: string;
  customerId: number | null;
  customerName: string;
  businessName: string;
  invoiceId: number | null;
  status: number;
  paymentType: number;
  paymentDate: string;
  amount: number;
  category: number;
  memo: string;
  createdAt: string;
}

// Payment type mappings
export const PAYMENT_TYPE = {
  0: 'Cash',
  1: 'Check',
  2: 'Credit Card',
  3: 'Bank Transfer',
  4: 'Other',
} as const;

export const PAYMENT_STATUS = {
  0: 'Pending',
  1: 'Completed',
  2: 'Failed',
  3: 'Refunded',
} as const;

// ============================================================================
// Data Transformers
// ============================================================================

/** Transform database record to UI view */
function toPaymentView(db: PaymentJoinRow): PaymentView {
  return {
    id: db.id,
    paymentNo: db.no || '',
    customerId: db.customer_id,
    customerName: db.customer_name || '',
    businessName: db.business_name || '',
    invoiceId: db.invoice_id,
    status: db.status,
    paymentType: db.payment_type,
    paymentDate: db.payment_date || db.created_at || '',
    amount: db.amount || 0,
    category: db.category,
    memo: db.memo || '',
    createdAt: db.created_at || '',
  };
}

// ============================================================================
// Hooks
// ============================================================================

/** Get all payments with real-time sync */
export function usePayments() {
  const { data, isLoading, error, isStreaming, refresh } = useSyncStream<PaymentJoinRow>(
    `SELECT 
      p.*,
      c.name as customer_name,
      c.business_name
     FROM payments p
     LEFT JOIN customers c ON p.customer_id = c.id
     ORDER BY p.created_at DESC`
  );

  const payments = useMemo(() => data.map(toPaymentView), [data]);

  return {
    payments,
    isLoading,
    error,
    isStreaming,
    refresh,
    count: payments.length,
  };
}

/** Get a single payment by ID */
export function usePaymentById(id: string | null) {
  const { data, isLoading, error } = useSyncStream<PaymentJoinRow>(
    `SELECT 
      p.*,
      c.name as customer_name,
      c.business_name
     FROM payments p
     LEFT JOIN customers c ON p.customer_id = c.id
     WHERE p.id = ?`,
    id ? [id] : [],
    { enabled: !!id }
  );

  const payment = useMemo(() => (data[0] ? toPaymentView(data[0]) : null), [data]);

  return { payment, isLoading, error };
}

/** Search payments by payment number or customer name */
export function usePaymentSearch(query: string) {
  const searchTerm = `%${query}%`;
  
  const { data, isLoading, error } = useSyncStream<PaymentJoinRow>(
    `SELECT 
      p.*,
      c.name as customer_name,
      c.business_name
     FROM payments p
     LEFT JOIN customers c ON p.customer_id = c.id
     WHERE p.no LIKE ? OR c.name LIKE ? OR c.business_name LIKE ?
     ORDER BY p.created_at DESC
     LIMIT 50`,
    [searchTerm, searchTerm, searchTerm],
    { enabled: query.length >= 2 }
  );

  const payments = useMemo(() => data.map(toPaymentView), [data]);

  return { payments, isLoading, error };
}
