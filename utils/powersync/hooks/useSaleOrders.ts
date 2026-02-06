/**
 * Sale Orders Data Hook
 * 
 * Provides real-time synced sale order data from PowerSync.
 * 
 * Usage:
 *   const { orders, isLoading } = useSaleOrders();
 */

import { useMemo } from 'react';
import { useSyncStream } from '../useSyncStream';

// ============================================================================
// Types
// ============================================================================

/** Raw joined data from database */
interface SaleOrderJoinRow {
  id: string;
  customer_id: number | null;
  no: string;
  order_type: number;
  sale_type: number;
  status: number;
  total_price: number;
  tax: number;
  discount: number;
  total_discount: number;
  delivery_charges: number;
  shipping_type: number;
  fulfilment_status: number;
  order_date: string;
  created_by_id: number | null;
  created_at: string;
  updated_at: string;
  // From customer join
  customer_name: string | null;
  business_name: string | null;
  // From user join
  created_by_username: string | null;
  created_by_first_name: string | null;
  created_by_last_name: string | null;
}

/** Sale order data as displayed in the UI */
export interface SaleOrderView {
  id: string;
  orderNo: string;
  customerId: number | null;
  customerName: string;
  businessName: string;
  orderType: number;
  saleType: number;
  status: number;
  totalPrice: number;
  tax: number;
  discount: number;
  deliveryCharges: number;
  shippingType: number;
  fulfilmentStatus: number;
  orderDate: string;
  createdById: number | null;
  createdByName: string;
  createdAt: string;
}

// Status mappings
export const ORDER_STATUS = {
  0: 'Draft',
  1: 'Pending',
  2: 'Confirmed',
  3: 'Processing',
  4: 'Completed',
  5: 'Cancelled',
} as const;

export const FULFILMENT_STATUS = {
  0: 'Unfulfilled',
  1: 'Partially Fulfilled',
  2: 'Fulfilled',
} as const;

// ============================================================================
// Data Transformers
// ============================================================================

/** Transform database record to UI view */
function toSaleOrderView(db: SaleOrderJoinRow): SaleOrderView {
  // Build creator name from first_name and last_name, fallback to username
  const createdByName = db.created_by_first_name && db.created_by_last_name
    ? `${db.created_by_first_name} ${db.created_by_last_name}`
    : db.created_by_username || 'Unknown';

  return {
    id: db.id,
    orderNo: db.no || '',
    customerId: db.customer_id,
    customerName: db.customer_name || '',
    businessName: db.business_name || '',
    orderType: db.order_type,
    saleType: db.sale_type,
    status: db.status,
    totalPrice: db.total_price || 0,
    tax: db.tax || 0,
    discount: db.discount || 0,
    deliveryCharges: db.delivery_charges || 0,
    shippingType: db.shipping_type,
    fulfilmentStatus: db.fulfilment_status,
    orderDate: db.order_date || db.created_at || '',
    createdById: db.created_by_id,
    createdByName,
    createdAt: db.created_at || '',
  };
}

// ============================================================================
// Hooks
// ============================================================================

/** Get all sale orders with real-time sync */
export function useSaleOrders() {
  const { data, isLoading, error, isStreaming, refresh } = useSyncStream<SaleOrderJoinRow>(
    `SELECT 
      so.*,
      c.name as customer_name,
      c.business_name,
      u.username as created_by_username,
      u.first_name as created_by_first_name,
      u.last_name as created_by_last_name
     FROM sale_orders so
     LEFT JOIN customers c ON so.customer_id = c.id
     LEFT JOIN tenant_users u ON so.created_by_id = u.id
     ORDER BY so.created_at DESC`
  );

  const orders = useMemo(() => data.map(toSaleOrderView), [data]);

  return {
    orders,
    isLoading,
    error,
    isStreaming,
    refresh,
    count: orders.length,
  };
}

/** Get a single sale order by ID */
export function useSaleOrderById(id: string | null) {
  const { data, isLoading, error } = useSyncStream<SaleOrderJoinRow>(
    `SELECT 
      so.*,
      c.name as customer_name,
      c.business_name,
      u.username as created_by_username,
      u.first_name as created_by_first_name,
      u.last_name as created_by_last_name
     FROM sale_orders so
     LEFT JOIN customers c ON so.customer_id = c.id
     LEFT JOIN tenant_users u ON so.created_by_id = u.id
     WHERE so.id = ?`,
    id ? [id] : [],
    { enabled: !!id }
  );

  const order = useMemo(() => (data[0] ? toSaleOrderView(data[0]) : null), [data]);

  return { order, isLoading, error };
}

/** Search sale orders by order number or customer name */
export function useSaleOrderSearch(query: string) {
  const searchTerm = `%${query}%`;
  
  const { data, isLoading, error } = useSyncStream<SaleOrderJoinRow>(
    `SELECT 
      so.*,
      c.name as customer_name,
      c.business_name,
      u.username as created_by_username,
      u.first_name as created_by_first_name,
      u.last_name as created_by_last_name
     FROM sale_orders so
     LEFT JOIN customers c ON so.customer_id = c.id
     LEFT JOIN tenant_users u ON so.created_by_id = u.id
     WHERE so.no LIKE ? OR c.name LIKE ? OR c.business_name LIKE ?
     ORDER BY so.created_at DESC
     LIMIT 50`,
    [searchTerm, searchTerm, searchTerm],
    { enabled: query.length >= 2 }
  );

  const orders = useMemo(() => data.map(toSaleOrderView), [data]);

  return { orders, isLoading, error };
}
