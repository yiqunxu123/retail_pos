/**
 * Dashboard Stats Hook
 *
 * All queries aligned 1:1 with K Web source code:
 *   kapp/server/app/tenant/report_api/dashboard/utils.py
 *
 * All constants verified against:
 *   kapp/server/constants/__init__.py
 *
 * Filtering logic delegated to shared sqlFilters module.
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
  deliveryOrdersCount: number;
  pickupOrdersCount: number;
  dropOffOrdersCount: number;
  customerCount: number;
  productCount: number;
  orderCount: number;
}

export interface DashboardFilters {
  startDate: string;    // 'YYYY-MM-DD'
  endDate: string;      // 'YYYY-MM-DD'
  channelIds: number[]; // empty = all channels
}

interface RevenueRow { total: number }
interface BalanceRow { total: number }
interface CountRow   { count: number }
interface StockValueRow { total: number }

// ============================================================================
// Individual Stat Hooks
// ============================================================================

/**
 * Total Revenue (get_sales)
 * Source: utils.py line 132
 *
 * K Web SQL:
 *   SELECT coalesce(sum(total_price), 0) FROM sale_orders
 *   WHERE status NOT IN (90, 80)
 *     AND balance_adjustment_id IS NULL
 *     AND order_date >= start AND order_date <= end
 */
function useTotalRevenue(filters: DashboardFilters) {
  // K Web sends timezone-shifted start/end timestamps from frontend before
  // filtering `order_date` on backend. In app we select plain YYYY-MM-DD, so
  // we convert `order_date` (stored as UTC timestamp text) to configured local
  // date first, which yields the same business-day window as K Web.
  const dateFilter = dateRangeUTCConverted('sale_orders.order_date', filters.startDate, filters.endDate);
  const chFilter   = channelFilterDirect(filters.channelIds, 'sale_orders.channel_id');

  const { data } = useSyncStream<RevenueRow>(
    `SELECT COALESCE(SUM(total_price), 0) as total
     FROM sale_orders
     WHERE status NOT IN (${SaleOrderStatus.VOID}, ${SaleOrderStatus.DISCARDED})
       AND balance_adjustment_id IS NULL
       AND ${dateFilter}${chFilter}`
  );
  const result = data[0]?.total || 0;
  console.log('[Dashboard] Total Revenue:', { startDate: filters.startDate, endDate: filters.endDate, result });
  return result;
}

/**
 * Paid Amount (get_paid_amounts)
 * Source: utils.py line 157
 *
 * K Web SQL:
 *   SELECT sum(case ...) FROM payments
 *   [LEFT JOIN invoices → sale_orders when channel filter]
 *   WHERE status IN (2, 1)
 *     AND invoice_id IS NOT NULL
 *     AND payment_type NOT IN (9, 8)
 *     AND category IN (1, 2, 6, 5)
 *     AND payment_date >= start AND payment_date <= end
 */
function usePaidAmount(filters: DashboardFilters) {
  const dateFilter = dateRangeLocal('payments.payment_date', filters.startDate, filters.endDate);
  const { joins, conditions: chCond } = channelFilterViaPayment(filters.channelIds);

  const { data } = useSyncStream<RevenueRow>(
    `SELECT COALESCE(SUM(
       CASE
         WHEN category IN (${PaymentCategory.SALE_RECEIPT}, ${PaymentCategory.RECHARGE}, ${PaymentCategory.MUTUAL_PAYMENT}) THEN amount
         WHEN category = ${PaymentCategory.SALE_REFUND} THEN amount * -1
         ELSE 0
       END
     ), 0) as total
     FROM payments ${joins}
     WHERE payments.status IN (${PaymentStatus.PAID}, ${PaymentStatus.PENDING})
       AND payments.invoice_id IS NOT NULL
       AND payments.payment_type NOT IN (${PaymentType.CUSTOMER_ADD_CREDIT}, ${PaymentType.CUSTOMER_USE_CREDIT})
       AND payments.category IN (${PaymentCategory.SALE_RECEIPT}, ${PaymentCategory.SALE_REFUND}, ${PaymentCategory.RECHARGE}, ${PaymentCategory.MUTUAL_PAYMENT})
       AND ${dateFilter}${chCond}`
  );
  const result = data[0]?.total || 0;
  console.log('[Dashboard] Paid Amount:', result);
  return result;
}

/**
 * Receivable Amount (get_receivable_amount)
 * Source: utils.py line 213
 *
 * K Web SQL:
 *   SELECT sum(invoices.remaining_amount) FROM invoices
 *   [LEFT JOIN sale_orders when channel filter]
 *   WHERE status != 3
 *     AND date(convert_timezone_for_client(created_at, tz)) >= start / <= end
 *
 * Note: created_at is UTC → converted to local via datetime(col, 'localtime').
 */
function useReceivableAmount(filters: DashboardFilters) {
  const dateFilter = dateRangeUTCConverted('invoices.created_at', filters.startDate, filters.endDate);
  const { joins, conditions: chCond } = channelFilterViaInvoice(filters.channelIds);

  const { data } = useSyncStream<BalanceRow>(
    `SELECT COALESCE(SUM(invoices.remaining_amount), 0) as total
     FROM invoices ${joins}
     WHERE invoices.status != ${InvoiceStatus.PAID}
       AND ${dateFilter}${chCond}`
  );
  const result = data[0]?.total || 0;
  console.log('[Dashboard] Receivable Amount:', result);
  return result;
}

/**
 * Payable Amount (get_payable_amount)
 * Source: utils.py line 193
 *
 * K Web SQL:
 *   SELECT abs(sum(invoice_balance)) FROM purchase_orders
 *   JOIN purchase_invoices ON …
 *   WHERE purchase_orders.status IN (4, 5, 6)
 *     AND date(purchase_invoices.created_at) >= start / <= end
 *
 * Note: K Web does NOT apply timezone conversion here — we match that.
 */
function usePayableAmount(filters: DashboardFilters) {
  const dateFilter = dateRangeUTCRaw('pi.created_at', filters.startDate, filters.endDate);

  const { data } = useSyncStream<BalanceRow>(
    `SELECT COALESCE(ABS(SUM(pi.invoice_balance)), 0) as total
     FROM purchase_invoices pi
     JOIN purchase_orders po ON po.id = pi.purchase_order_id
     WHERE po.status IN (${PurchaseOrderStatus.PARTIALLY_RECEIVED}, ${PurchaseOrderStatus.RECEIVED}, ${PurchaseOrderStatus.CLOSED})
       AND ${dateFilter}`
  );
  const result = data[0]?.total || 0;
  console.log('[Dashboard] Payable Amount:', result);
  return result;
}

/** Extended stock value (qty × cost) — not date dependent */
function useExtendedStockValue() {
  const { data } = useSyncStream<StockValueRow>(
    `SELECT COALESCE(SUM(s.qty * COALESCE(up.cost, 0)), 0) as total
     FROM stocks s
     LEFT JOIN unit_prices up ON s.product_id = up.product_id AND s.channel_id = up.channel_id`
  );
  return data[0]?.total || 0;
}

// ---------------------------------------------------------------------------
// Order counts by shipping type
// K Web: shipping_type = X AND sale_type = ORDER
//       date(convert_timezone_for_client(created_at, tz)) >= start / <= end
// Source: resources.py -> SaleOrder.count_by_date_rq
// ---------------------------------------------------------------------------

function useShippingTypeCount(filters: DashboardFilters, shippingType: number) {
  const dateFilter = dateRangeUTCConverted('sale_orders.created_at', filters.startDate, filters.endDate);
  const chFilter   = channelFilterDirect(filters.channelIds, 'sale_orders.channel_id');

  const { data } = useSyncStream<CountRow>(
    `SELECT COUNT(*) as count FROM sale_orders
     WHERE shipping_type = ${shippingType}
       AND sale_type = ${SaleType.ORDER}
       AND ${dateFilter}${chFilter}`
  );
  return data[0]?.count || 0;
}

function useDeliveryOrdersCount(filters: DashboardFilters) {
  return useShippingTypeCount(filters, ShippingType.DELIVERY);
}
function usePickupOrdersCount(filters: DashboardFilters) {
  return useShippingTypeCount(filters, ShippingType.PICK_UP);
}
function useDropOffOrdersCount(filters: DashboardFilters) {
  return useShippingTypeCount(filters, ShippingType.DROP_OFF);
}

function useCustomerCount() {
  const { data } = useSyncStream<CountRow>('SELECT COUNT(*) as count FROM customers');
  return data[0]?.count || 0;
}

function useProductCount() {
  const { data } = useSyncStream<CountRow>('SELECT COUNT(*) as count FROM products');
  return data[0]?.count || 0;
}

function useOrderCount(filters: DashboardFilters) {
  const dateFilter = dateRangeLocal('order_date', filters.startDate, filters.endDate);
  const chFilter   = channelFilterDirect(filters.channelIds, 'sale_orders.channel_id');

  const { data } = useSyncStream<CountRow>(
    `SELECT COUNT(*) as count FROM sale_orders
     WHERE status NOT IN (${SaleOrderStatus.VOID}, ${SaleOrderStatus.DISCARDED})
       AND ${dateFilter}${chFilter}`
  );
  return data[0]?.count || 0;
}

// ============================================================================
// Main Hook
// ============================================================================

export function useDashboardStats(filters: DashboardFilters) {
  const totalRevenue       = useTotalRevenue(filters);
  const paidAmount         = usePaidAmount(filters);
  const receivableAmount   = useReceivableAmount(filters);
  const payableAmount      = usePayableAmount(filters);
  const extendedStockValue = useExtendedStockValue();
  const deliveryOrdersCount = useDeliveryOrdersCount(filters);
  const pickupOrdersCount   = usePickupOrdersCount(filters);
  const dropOffOrdersCount  = useDropOffOrdersCount(filters);
  const customerCount = useCustomerCount();
  const productCount  = useProductCount();
  const orderCount    = useOrderCount(filters);

  const stats = useMemo<DashboardStats>(() => ({
    totalRevenue,
    paidAmount,
    receivableAmount,
    payableAmount,
    extendedStockValue,
    deliveryOrdersCount,
    pickupOrdersCount,
    dropOffOrdersCount,
    customerCount,
    productCount,
    orderCount,
  }), [
    totalRevenue, paidAmount, receivableAmount, payableAmount,
    extendedStockValue, deliveryOrdersCount, pickupOrdersCount, dropOffOrdersCount,
    customerCount, productCount, orderCount,
  ]);

  return { stats };
}
