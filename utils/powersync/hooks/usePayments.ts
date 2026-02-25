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

// ============================================================================
// Invoice-linked payment hooks (for Payment History tab, Order Details modal)
// ============================================================================

/** Raw row from payments JOIN invoices JOIN sale_orders */
interface PaymentWithInvoiceRow extends PaymentJoinRow {
  invoice_no: string | null;
  order_no: string | null;
  sale_order_id: number | null;
}

/** Payment with invoice/order context for display */
export interface PaymentWithInvoiceView extends PaymentView {
  invoiceNo: string;
  orderNo: string;
  saleOrderId: number | null;
}

/** Get payments with invoice and order info (for Payment by Invoice tab) */
export function usePaymentsWithInvoice() {
  const { data, isLoading, error, isStreaming, refresh } = useSyncStream<PaymentWithInvoiceRow>(
    `SELECT 
      p.*,
      c.name as customer_name,
      c.business_name,
      i.no as invoice_no,
      so.no as order_no,
      so.id as sale_order_id
     FROM payments p
     LEFT JOIN customers c ON p.customer_id = c.id
     LEFT JOIN invoices i ON p.invoice_id = i.id
     LEFT JOIN sale_orders so ON i.sale_order_id = so.id
     WHERE p.invoice_id IS NOT NULL
     ORDER BY p.created_at DESC`
  );

  const payments = useMemo<PaymentWithInvoiceView[]>(
    () =>
      data.map((db) => ({
        ...toPaymentView(db),
        invoiceNo: db.invoice_no || '-',
        orderNo: db.order_no || '-',
        saleOrderId: db.sale_order_id,
      })),
    [data]
  );

  /** Group payments by invoice for "Payment by Invoice" tab */
  const paymentsByInvoice = useMemo(() => {
    const map = new Map<string, PaymentWithInvoiceView[]>();
    for (const p of payments) {
      const key = p.invoiceId != null ? String(p.invoiceId) : p.invoiceNo;
      const list = map.get(key) || [];
      list.push(p);
      map.set(key, list);
    }
    return Array.from(map.entries()).map(([invoiceKey, payList]) => {
      const first = payList[0];
      return {
        invoiceId: first.invoiceId,
        invoiceNo: first.invoiceNo,
        orderNo: first.orderNo,
        saleOrderId: first.saleOrderId,
        customerName: first.businessName || first.customerName || '-',
        totalAmount: payList.reduce((sum, x) => sum + x.amount, 0),
        payments: payList,
        paymentCount: payList.length,
      };
    });
  }, [payments]);

  return {
    payments,
    paymentsByInvoice,
    isLoading,
    error,
    isStreaming,
    refresh,
  };
}

/** Get invoice and payments for a given sale order (for Order Details / Sales Return modal) */
export function useInvoiceWithPayments(saleOrderId: string | null) {
  const { data, isLoading, error } = useSyncStream<
    PaymentJoinRow & { invoice_no: string | null; inv_id: number | null }
  >(
    `SELECT 
      p.*,
      c.name as customer_name,
      c.business_name,
      i.no as invoice_no,
      i.id as inv_id
     FROM invoices i
     LEFT JOIN payments p ON p.invoice_id = i.id
     LEFT JOIN customers c ON p.customer_id = c.id
     WHERE i.sale_order_id = ?
     ORDER BY p.payment_date DESC`,
    saleOrderId ? [saleOrderId] : [],
    { enabled: !!saleOrderId }
  );

  const invoiceNo = useMemo(() => data[0]?.invoice_no ?? null, [data]);
  const invoiceId = useMemo(() => data[0]?.inv_id ?? null, [data]);
  const payments = useMemo(
    () =>
      data
        .filter((row) => row.id != null)
        .map((row) => ({
          ...toPaymentView(row),
          invoiceNo: row.invoice_no || '-',
        })),
    [data]
  );

  return {
    invoiceNo,
    invoiceId,
    payments,
    isLoading,
    error,
  };
}
