/**
 * Dashboard Stats Hook
 * 
 * Provides real-time dashboard statistics from PowerSync.
 * 
 * Stats available:
 * - Total Revenue (from sale_orders)
 * - Paid Amount (from payments)
 * - Receivable Amount (from customers.balance)
 * - Payable Amount (from suppliers.balance)
 * - Extended Stock Value (stock qty * cost)
 * - Delivery Orders Count
 * 
 * Usage:
 *   const { stats, isLoading } = useDashboardStats();
 */

import { useMemo } from 'react';
import {
  InvoiceStatus,
  PaymentCategory,
  PaymentStatus,
  PaymentType,
  PurchaseOrderStatus,
  SaleOrderStatus,
  SaleType,
  ShippingType,
} from '../../constants';
import {
  channelFilterDirect,
  channelFilterViaInvoice,
  channelFilterViaPayment,
  dateRangeLocal,
  dateRangeUTCConverted,
  dateRangeUTCRaw,
  getLocalToday,
} from '../sqlFilters';
import { useSyncStream } from '../useSyncStream';

// ============================================================================
// Types
// ============================================================================

export interface DashboardStats {
  totalRevenue: number;
  paidAmount: number;
  receivableAmount: number;
  payableAmount: number;
  extendedStockValue: number;
  pickupOrdersCount: number;
  deliveryOrdersCount: number;
  dropOffOrdersCount: number;
  // Counts
  customerCount: number;
  productCount: number;
  orderCount: number;
}

// Kept for compatibility with callers that pass dashboard filters.
export interface DashboardFilters {
  startDate: string;
  endDate: string;
  channelIds: number[];
}

interface RevenueRow {
  total: number;
}

interface BalanceRow {
  total: number;
}

interface CountRow {
  count: number;
}

interface StockValueRow {
  total: number;
}

// ============================================================================
// Hooks
// ============================================================================

/** Get total revenue from sale orders */
function useTotalRevenue() {
  const { data } = useSyncStream<RevenueRow>(
    `SELECT COALESCE(SUM(total_price), 0) as total FROM sale_orders`
  );
  return data[0]?.total || 0;
}

/** Get paid amount from payments */
function usePaidAmount() {
  const { data } = useSyncStream<RevenueRow>(
    `SELECT COALESCE(SUM(amount), 0) as total FROM payments WHERE status = 1`
  );
  return data[0]?.total || 0;
}

/** Get receivable amount (customer balances) */
function useReceivableAmount() {
  const { data } = useSyncStream<BalanceRow>(
    `SELECT COALESCE(SUM(balance), 0) as total FROM customers WHERE balance > 0`
  );
  return data[0]?.total || 0;
}

/** Get payable amount (supplier balances) */
function usePayableAmount() {
  const { data } = useSyncStream<BalanceRow>(
    `SELECT COALESCE(SUM(balance), 0) as total FROM suppliers WHERE balance > 0`
  );
  return data[0]?.total || 0;
}

/** Get extended stock value (qty * cost) */
function useExtendedStockValue() {
  const { data } = useSyncStream<StockValueRow>(
    `SELECT COALESCE(SUM(s.qty * COALESCE(up.cost, 0)), 0) as total 
     FROM stocks s 
     LEFT JOIN unit_prices up ON s.product_id = up.product_id AND s.channel_id = up.channel_id`
  );
  return data[0]?.total || 0;
}

/** Get shipping-type order count */
function useShippingOrdersCount(shippingType: number) {
  const { data } = useSyncStream<CountRow>(
    `SELECT COUNT(*) as count FROM sale_orders WHERE shipping_type = ${shippingType}`
  );
  return data[0]?.count || 0;
}

/** Get pickup orders count */
function usePickupOrdersCount() {
  return useShippingOrdersCount(ShippingType.PICK_UP);
}

/** Get delivery orders count */
function useDeliveryOrdersCount() {
  return useShippingOrdersCount(ShippingType.DELIVERY);
}

/** Get drop-off orders count */
function useDropOffOrdersCount() {
  return useShippingOrdersCount(ShippingType.DROP_OFF);
}

/** Get customer count */
function useCustomerCount() {
  const { data } = useSyncStream<CountRow>(
    `SELECT COUNT(*) as count FROM customers`
  );
  return data[0]?.count || 0;
}

/** Get product count */
function useProductCount() {
  const { data } = useSyncStream<CountRow>(
    `SELECT COUNT(*) as count FROM products`
  );
  return data[0]?.count || 0;
}

/** Get order count */
function useOrderCount() {
  const { data } = useSyncStream<CountRow>(
    `SELECT COUNT(*) as count FROM sale_orders`
  );
  return data[0]?.count || 0;
}

/** Main hook - combines all dashboard stats in a SINGLE query */
export function useDashboardStats(filters?: DashboardFilters) {
  const startDate = filters?.startDate || getLocalToday();
  const endDate = filters?.endDate || getLocalToday();
  const channelIds = filters?.channelIds || [];

  const saleDateFilter = dateRangeLocal('so.order_date', startDate, endDate);
  const paymentDateFilter = dateRangeLocal('payments.payment_date', startDate, endDate);
  const receivableDateFilter = dateRangeUTCConverted('invoices.created_at', startDate, endDate);
  const payableDateFilter = dateRangeUTCRaw('purchase_invoices.created_at', startDate, endDate);

  const saleChannelFilter = channelFilterDirect(channelIds, 'so.channel_id');
  // purchase_orders in the local PowerSync schema has no channel_id column.
  // Keep payable query aligned with available local schema to avoid runtime SQL errors.
  const purchaseChannelFilter = '';
  const stockChannelFilter = channelFilterDirect(channelIds, 's.channel_id');
  const invoiceChannelFilter = channelFilterViaInvoice(channelIds);
  const paymentChannelFilter = channelFilterViaPayment(channelIds);

  const { data, isLoading } = useSyncStream<Record<string, number>>(
    `SELECT
      COALESCE((
        SELECT SUM(so.total_price)
        FROM sale_orders so
        WHERE so.status NOT IN (${SaleOrderStatus.VOID}, ${SaleOrderStatus.DISCARDED})
          AND so.balance_adjustment_id IS NULL
          AND ${saleDateFilter}
          ${saleChannelFilter}
      ), 0) AS totalRevenue,
      COALESCE((
        SELECT SUM(
          CASE
            WHEN payments.category IN (${PaymentCategory.SALE_RECEIPT}, ${PaymentCategory.RECHARGE}, ${PaymentCategory.MUTUAL_PAYMENT})
              THEN payments.amount
            WHEN payments.category = ${PaymentCategory.SALE_REFUND}
              THEN payments.amount * -1
            ELSE 0
          END
        )
        FROM payments
        ${paymentChannelFilter.joins}
        WHERE payments.status IN (${PaymentStatus.PAID}, ${PaymentStatus.PENDING})
          AND payments.invoice_id IS NOT NULL
          AND payments.payment_type NOT IN (${PaymentType.CUSTOMER_ADD_CREDIT}, ${PaymentType.CUSTOMER_USE_CREDIT})
          AND payments.category IN (${PaymentCategory.SALE_RECEIPT}, ${PaymentCategory.SALE_REFUND}, ${PaymentCategory.RECHARGE}, ${PaymentCategory.MUTUAL_PAYMENT})
          AND ${paymentDateFilter}
          ${paymentChannelFilter.conditions}
      ), 0) AS paidAmount,
      COALESCE((
        SELECT ABS(SUM(purchase_invoices.invoice_balance))
        FROM purchase_orders
        JOIN purchase_invoices ON purchase_orders.id = purchase_invoices.purchase_order_id
        WHERE purchase_orders.status IN (${PurchaseOrderStatus.PARTIALLY_RECEIVED}, ${PurchaseOrderStatus.RECEIVED}, ${PurchaseOrderStatus.CLOSED})
          AND ${payableDateFilter}
          ${purchaseChannelFilter}
      ), 0) AS payableAmount,
      COALESCE((
        SELECT SUM(invoices.remaining_amount)
        FROM invoices
        ${invoiceChannelFilter.joins}
        WHERE invoices.status != ${InvoiceStatus.PAID}
          AND ${receivableDateFilter}
          ${invoiceChannelFilter.conditions}
      ), 0) AS receivableAmount,
      COALESCE((
        SELECT SUM(s.qty * COALESCE(up.cost, 0))
        FROM stocks s
        LEFT JOIN unit_prices up ON s.product_id = up.product_id AND s.channel_id = up.channel_id
        WHERE 1=1
          ${stockChannelFilter}
      ), 0) AS extendedStockValue,
      COALESCE((
        SELECT COUNT(*)
        FROM sale_orders so
        WHERE so.shipping_type = ${ShippingType.PICK_UP}
          AND so.sale_type = ${SaleType.ORDER}
          AND ${saleDateFilter}
          ${saleChannelFilter}
      ), 0) AS pickupOrdersCount,
      COALESCE((
        SELECT COUNT(*)
        FROM sale_orders so
        WHERE so.shipping_type = ${ShippingType.DELIVERY}
          AND so.sale_type = ${SaleType.ORDER}
          AND ${saleDateFilter}
          ${saleChannelFilter}
      ), 0) AS deliveryOrdersCount,
      COALESCE((
        SELECT COUNT(*)
        FROM sale_orders so
        WHERE so.shipping_type = ${ShippingType.DROP_OFF}
          AND so.sale_type = ${SaleType.ORDER}
          AND ${saleDateFilter}
          ${saleChannelFilter}
      ), 0) AS dropOffOrdersCount,
      COALESCE((SELECT COUNT(*) FROM customers), 0) AS customerCount,
      COALESCE((SELECT COUNT(*) FROM products), 0) AS productCount,
      COALESCE((
        SELECT COUNT(*)
        FROM sale_orders so
        WHERE so.status NOT IN (${SaleOrderStatus.VOID}, ${SaleOrderStatus.DISCARDED})
          AND so.balance_adjustment_id IS NULL
          AND ${saleDateFilter}
          ${saleChannelFilter}
      ), 0) AS orderCount`
  );

  const row = data[0];
  const stats = useMemo<DashboardStats>(() => ({
    totalRevenue: Number(row?.totalRevenue) || 0,
    paidAmount: Number(row?.paidAmount) || 0,
    receivableAmount: Number(row?.receivableAmount) || 0,
    payableAmount: Number(row?.payableAmount) || 0,
    extendedStockValue: Number(row?.extendedStockValue) || 0,
    pickupOrdersCount: Number(row?.pickupOrdersCount) || 0,
    deliveryOrdersCount: Number(row?.deliveryOrdersCount) || 0,
    dropOffOrdersCount: Number(row?.dropOffOrdersCount) || 0,
    customerCount: Number(row?.customerCount) || 0,
    productCount: Number(row?.productCount) || 0,
    orderCount: Number(row?.orderCount) || 0,
  }), [row]);

  return { stats, isLoading };
}
