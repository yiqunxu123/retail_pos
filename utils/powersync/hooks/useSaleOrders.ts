/**
 * Sale Orders Data Hook
 * 
 * Provides real-time synced sale order data from PowerSync.
 * 
 * Usage:
 *   const { orders, isLoading } = useSaleOrders();
 */

import { useMemo } from 'react';
import { powerSyncDb } from '../PowerSyncProvider';
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
  /** Pre-formatted date string for display (avoids toLocaleString in render) */
  orderDateFormatted: string;
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

/** Fast date formatter - avoids slow toLocaleString on Hermes/Android */
function formatOrderDate(dateStr: string): string {
  if (!dateStr) return '-';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '-';
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    const yyyy = d.getFullYear();
    let hh = d.getHours();
    const min = String(d.getMinutes()).padStart(2, '0');
    const sec = String(d.getSeconds()).padStart(2, '0');
    const ampm = hh >= 12 ? 'PM' : 'AM';
    hh = hh % 12 || 12;
    return `${mm}/${dd}/${yyyy}, ${String(hh).padStart(2, '0')}:${min}:${sec} ${ampm} , CST`;
  } catch {
    return '-';
  }
}

/** Transform database record to UI view */
function toSaleOrderView(db: SaleOrderJoinRow): SaleOrderView {
  // Build creator name from first_name and last_name, fallback to username
  const createdByName = db.created_by_first_name && db.created_by_last_name
    ? `${db.created_by_first_name} ${db.created_by_last_name}`
    : db.created_by_username || 'Unknown';

  const rawDate = db.order_date || db.created_at || '';

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
    orderDate: rawDate,
    orderDateFormatted: formatOrderDate(rawDate),
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

/** Get all parked sale orders (status = 70) with item count */
export function useParkedOrders() {
  const { data, isLoading, error, isStreaming, refresh } = useSyncStream<
    SaleOrderJoinRow & { item_count: number; channel_name: string | null }
  >(
    `SELECT 
      so.*,
      c.name as customer_name,
      c.business_name,
      u.username as created_by_username,
      u.first_name as created_by_first_name,
      u.last_name as created_by_last_name,
      ch.name as channel_name,
      COALESCE(sod_agg.item_count, 0) as item_count
     FROM sale_orders so
     LEFT JOIN customers c ON so.customer_id = c.id
     LEFT JOIN tenant_users u ON so.created_by_id = u.id
     LEFT JOIN channels ch ON so.channel_id = ch.id
     LEFT JOIN (
       SELECT sale_order_id, SUM(qty) as item_count
       FROM sale_order_details
       GROUP BY sale_order_id
     ) sod_agg ON sod_agg.sale_order_id = so.id
     WHERE so.status = 70
     ORDER BY so.created_at DESC`
  );

  const orders = useMemo(
    () =>
      data.map((row) => ({
        ...toSaleOrderView(row),
        itemCount: row.item_count || 0,
        channelName: row.channel_name || 'Primary',
      })),
    [data]
  );

  return {
    orders,
    isLoading,
    error,
    isStreaming,
    refresh,
    count: orders.length,
  };
}

export type ParkedOrderView = ReturnType<typeof useParkedOrders>['orders'][number];

// ============================================================================
// One-shot fetchers (non-hook, for imperative use)
// ============================================================================

/** Raw row from sale_order_details JOIN products */
interface SaleOrderDetailRow {
  id: string;
  sale_order_id: number;
  product_id: number;
  qty: number;
  price: number;
  discount: number;
  total_price: number;
  product_name: string | null;
  product_sku: string | null;
  product_upc: string | null;
}

/** Resolved product item ready for OrderContext */
export interface ResolvedOrderProduct {
  id: string;
  productId: string;
  sku: string;
  name: string;
  salePrice: number;
  unit: string;
  quantity: number;
  tnVaporTax: number;
  ncVaporTax: number;
  total: number;
}

/**
 * Fetch sale order detail rows + product info from local PowerSync DB.
 * This is a one-shot query (not a hook) intended for imperative resume flow.
 */
export async function fetchSaleOrderProducts(
  saleOrderId: string
): Promise<ResolvedOrderProduct[]> {
  const rows = await powerSyncDb.getAll<SaleOrderDetailRow>(
    `SELECT
       sod.id,
       sod.sale_order_id,
       sod.product_id,
       sod.qty,
       sod.price,
       sod.discount,
       sod.total_price,
       p.name  AS product_name,
       p.sku   AS product_sku,
       p.upc   AS product_upc
     FROM sale_order_details sod
     LEFT JOIN products p ON p.id = sod.product_id
     WHERE sod.sale_order_id = ?`,
    [saleOrderId]
  );

  return rows.map((r) => ({
    id: `${r.product_id}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    productId: String(r.product_id),
    sku: r.product_sku || '',
    name: r.product_name || `Product #${r.product_id}`,
    salePrice: r.price || 0,
    unit: 'Piece',
    quantity: r.qty || 1,
    tnVaporTax: 0,
    ncVaporTax: 0,
    total: r.total_price || (r.price || 0) * (r.qty || 1),
  }));
}

/** Get all sale returns (sale_type = 2) with real-time sync */
export function useSaleReturns() {
  const { data, isLoading, error, isStreaming, refresh } = useSyncStream<
    SaleOrderJoinRow & { channel_name: string | null }
  >(
    `SELECT 
      so.*,
      c.name as customer_name,
      c.business_name,
      u.username as created_by_username,
      u.first_name as created_by_first_name,
      u.last_name as created_by_last_name,
      ch.name as channel_name
     FROM sale_orders so
     LEFT JOIN customers c ON so.customer_id = c.id
     LEFT JOIN tenant_users u ON so.created_by_id = u.id
     LEFT JOIN channels ch ON so.channel_id = ch.id
     WHERE so.sale_type = 2
     ORDER BY so.created_at DESC`
  );

  const returns = useMemo(
    () =>
      data.map((row) => ({
        ...toSaleOrderView(row),
        channelName: row.channel_name || 'Primary',
      })),
    [data]
  );

  return {
    returns,
    isLoading,
    error,
    isStreaming,
    refresh,
    count: returns.length,
  };
}

export type SaleReturnView = ReturnType<typeof useSaleReturns>['returns'][number];

/** Fulfillment view for fulfillments screen */
export interface FulfillmentView {
  id: string;
  businessName: string;
  customerName: string;
  orderNo: string;
  shippingType: string;
  pickerDetails: string;
  pickerAssigned: boolean;
}

function getShippingTypeLabel(type: number): string {
  switch (type) {
    case 1: return 'Delivery';
    case 2: return 'Shipping';
    default: return 'Pickup';
  }
}

/** Get fulfillments - sale orders in progress (pending, picking, packing, etc.) */
export function useFulfillments() {
  const FULFILLMENT_STATUSES = [10, 15, 20, 21, 22, 23, 26, 30, 35]; // Pending through Partially Executed
  const { data, isLoading, error, isStreaming, refresh } = useSyncStream<
    SaleOrderJoinRow & { channel_name: string | null }
  >(
    `SELECT 
      so.*,
      c.name as customer_name,
      c.business_name,
      u.username as created_by_username,
      u.first_name as created_by_first_name,
      u.last_name as created_by_last_name,
      ch.name as channel_name
     FROM sale_orders so
     LEFT JOIN customers c ON so.customer_id = c.id
     LEFT JOIN tenant_users u ON so.created_by_id = u.id
     LEFT JOIN channels ch ON so.channel_id = ch.id
     WHERE so.sale_type = 1
       AND so.status IN (${FULFILLMENT_STATUSES.join(',')})
     ORDER BY so.created_at DESC`
  );

  const fulfillments = useMemo<FulfillmentView[]>(
    () =>
      data.map((row) => ({
        id: row.id,
        businessName: row.business_name || row.customer_name || 'Guest',
        customerName: row.customer_name || '',
        orderNo: row.no || '',
        shippingType: getShippingTypeLabel(row.shipping_type),
        pickerDetails: 'Not assigned',
        pickerAssigned: false,
      })),
    [data]
  );

  return {
    fulfillments,
    isLoading,
    error,
    isStreaming,
    refresh,
    count: fulfillments.length,
  };
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
