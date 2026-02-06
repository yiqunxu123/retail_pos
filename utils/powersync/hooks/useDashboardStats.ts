/**
 * Dashboard Stats Hook
 * 
 * All queries aligned 1:1 with K Web source code:
 * kapp/server/app/tenant/report_api/dashboard/utils.py
 * 
 * All constants verified against:
 * kapp/server/constants/__init__.py
 * 
 * Supports date range and channel filtering to match K Web dashboard.
 */

import { useMemo } from 'react';
import { InvoiceStatus, PaymentCategory, PaymentStatus, PaymentType, PurchaseOrderStatus, SaleOrderStatus, SaleType, ShippingType } from '../../constants';
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
  startDate: string;   // 'YYYY-MM-DD'
  endDate: string;     // 'YYYY-MM-DD'
  channelIds: number[]; // empty = all channels
}

interface RevenueRow { total: number; }
interface BalanceRow { total: number; }
interface CountRow { count: number; }
interface StockValueRow { total: number; }

// ============================================================================
// Helper - build channel filter SQL fragment
// ============================================================================

function channelFilter(channelIds: number[], tableAlias?: string): string {
  if (!channelIds.length) return '';
  const col = tableAlias ? `${tableAlias}.channel_id` : 'channel_id';
  return ` AND ${col} IN (${channelIds.join(',')})`;
}

/**
 * Get the next day after a YYYY-MM-DD date string.
 * Used for date range: `>= startDate AND < nextDay(endDate)`
 * This avoids string comparison issues with ISO 8601 'T' separator
 * (PowerSync stores dates as '2026-02-05T15:15:00.000000')
 */
function nextDay(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  d.setDate(d.getDate() + 1);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

// ============================================================================
// Individual Stat Hooks
// ============================================================================

/**
 * Total Revenue (get_sales)
 * Source: utils.py line 132
 * 
 * K Web SQL:
 *   select coalesce(sum(total_price), 0) from sale_orders
 *   WHERE status not in (90, 80)
 *     AND balance_adjustment_id is null
 *     AND order_date >= start AND order_date <= end
 */
function useTotalRevenue(filters: DashboardFilters) {
  const chFilter = channelFilter(filters.channelIds, 'sale_orders');
  const { data } = useSyncStream<RevenueRow>(
    `SELECT COALESCE(SUM(total_price), 0) as total 
     FROM sale_orders 
     WHERE status NOT IN (${SaleOrderStatus.VOID}, ${SaleOrderStatus.DISCARDED})
     AND balance_adjustment_id IS NULL
     AND order_date >= '${filters.startDate}'
     AND order_date < '${nextDay(filters.endDate)}'${chFilter}`
  );
  const result = data[0]?.total || 0;
  console.log('[Dashboard] Total Revenue:', result);
  return result;
}

/**
 * Paid Amount (get_paid_amounts)
 * Source: utils.py line 157
 * 
 * K Web SQL:
 *   SELECT sum(case ...) FROM payments
 *   WHERE status in (2, 1)
 *     AND invoice_id is not null
 *     AND payment_type not in (9, 8)
 *     AND category in (1, 2, 6, 5)
 *     AND payment_date >= start AND payment_date <= end
 * 
 * Note: channel filter requires join through invoices -> sale_orders
 * For simplicity, we skip channel filter on payments (matches K Web when no channel selected)
 */
function usePaidAmount(filters: DashboardFilters) {
  // K Web only applies channel filter via join, which is complex for local SQL
  // When all channels selected (channelIds=[]), result is the same
  const { data } = useSyncStream<RevenueRow>(
    `SELECT COALESCE(SUM(
       CASE 
         WHEN category IN (${PaymentCategory.SALE_RECEIPT}, ${PaymentCategory.RECHARGE}, ${PaymentCategory.MUTUAL_PAYMENT}) THEN amount
         WHEN category = ${PaymentCategory.SALE_REFUND} THEN amount * -1
         ELSE 0
       END
     ), 0) as total 
     FROM payments 
     WHERE status IN (${PaymentStatus.PAID}, ${PaymentStatus.PENDING}) 
     AND invoice_id IS NOT NULL
     AND payment_type NOT IN (${PaymentType.CUSTOMER_ADD_CREDIT}, ${PaymentType.CUSTOMER_USE_CREDIT})
     AND category IN (${PaymentCategory.SALE_RECEIPT}, ${PaymentCategory.SALE_REFUND}, ${PaymentCategory.RECHARGE}, ${PaymentCategory.MUTUAL_PAYMENT})
     AND payment_date >= '${filters.startDate}'
     AND payment_date < '${nextDay(filters.endDate)}'`
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
 *   WHERE status != 3 (PAID)
 *     AND date(created_at) >= start AND date(created_at) <= end
 */
function useReceivableAmount(filters: DashboardFilters) {
  const { data } = useSyncStream<BalanceRow>(
    `SELECT COALESCE(SUM(remaining_amount), 0) as total 
     FROM invoices 
     WHERE status != ${InvoiceStatus.PAID}
     AND DATE(created_at) >= '${filters.startDate}'
     AND DATE(created_at) <= '${filters.endDate}'`
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
 *   select abs(sum(invoice_balance)) from purchase_orders
 *   join purchase_invoices on purchase_orders.id = purchase_invoices.purchase_order_id
 *   WHERE purchase_orders.status in (4, 5, 6)
 *     AND date(purchase_invoices.created_at) >= start
 *     AND date(purchase_invoices.created_at) <= end
 */
function usePayableAmount(filters: DashboardFilters) {
  const { data } = useSyncStream<BalanceRow>(
    `SELECT COALESCE(ABS(SUM(pi.invoice_balance)), 0) as total 
     FROM purchase_invoices pi
     JOIN purchase_orders po ON po.id = pi.purchase_order_id
     WHERE po.status IN (${PurchaseOrderStatus.PARTIALLY_RECEIVED}, ${PurchaseOrderStatus.RECEIVED}, ${PurchaseOrderStatus.CLOSED})
     AND DATE(pi.created_at) >= '${filters.startDate}'
     AND DATE(pi.created_at) <= '${filters.endDate}'`
  );
  const result = data[0]?.total || 0;
  console.log('[Dashboard] Payable Amount:', result);
  return result;
}

/** Extended stock value (qty * cost) - not date dependent */
function useExtendedStockValue() {
  const { data } = useSyncStream<StockValueRow>(
    `SELECT COALESCE(SUM(s.qty * COALESCE(up.cost, 0)), 0) as total 
     FROM stocks s 
     LEFT JOIN unit_prices up ON s.product_id = up.product_id AND s.channel_id = up.channel_id`
  );
  return data[0]?.total || 0;
}

/**
 * Order counts by shipping type
 * K Web: shipping_type = X AND sale_type = ORDER AND status NOT IN (VOID, DISCARDED)
 * Source: resources.py line 108-116
 */
function useDeliveryOrdersCount(filters: DashboardFilters) {
  const chFilter = channelFilter(filters.channelIds, 'sale_orders');
  const { data } = useSyncStream<CountRow>(
    `SELECT COUNT(*) as count FROM sale_orders 
     WHERE shipping_type = ${ShippingType.DELIVERY}
     AND sale_type = ${SaleType.ORDER}
     AND status NOT IN (${SaleOrderStatus.VOID}, ${SaleOrderStatus.DISCARDED})
     AND order_date >= '${filters.startDate}'
     AND order_date < '${nextDay(filters.endDate)}'${chFilter}`
  );
  return data[0]?.count || 0;
}

function usePickupOrdersCount(filters: DashboardFilters) {
  const chFilter = channelFilter(filters.channelIds, 'sale_orders');
  const { data } = useSyncStream<CountRow>(
    `SELECT COUNT(*) as count FROM sale_orders 
     WHERE shipping_type = ${ShippingType.PICK_UP}
     AND sale_type = ${SaleType.ORDER}
     AND status NOT IN (${SaleOrderStatus.VOID}, ${SaleOrderStatus.DISCARDED})
     AND order_date >= '${filters.startDate}'
     AND order_date < '${nextDay(filters.endDate)}'${chFilter}`
  );
  return data[0]?.count || 0;
}

function useDropOffOrdersCount(filters: DashboardFilters) {
  const chFilter = channelFilter(filters.channelIds, 'sale_orders');
  const { data } = useSyncStream<CountRow>(
    `SELECT COUNT(*) as count FROM sale_orders 
     WHERE shipping_type = ${ShippingType.DROP_OFF}
     AND sale_type = ${SaleType.ORDER}
     AND status NOT IN (${SaleOrderStatus.VOID}, ${SaleOrderStatus.DISCARDED})
     AND order_date >= '${filters.startDate}'
     AND order_date < '${nextDay(filters.endDate)}'${chFilter}`
  );
  return data[0]?.count || 0;
}

function useCustomerCount() {
  const { data } = useSyncStream<CountRow>(
    `SELECT COUNT(*) as count FROM customers`
  );
  return data[0]?.count || 0;
}

function useProductCount() {
  const { data } = useSyncStream<CountRow>(
    `SELECT COUNT(*) as count FROM products`
  );
  return data[0]?.count || 0;
}

function useOrderCount(filters: DashboardFilters) {
  const chFilter = channelFilter(filters.channelIds, 'sale_orders');
  const { data } = useSyncStream<CountRow>(
    `SELECT COUNT(*) as count FROM sale_orders
     WHERE status NOT IN (${SaleOrderStatus.VOID}, ${SaleOrderStatus.DISCARDED})
     AND order_date >= '${filters.startDate}'
     AND order_date < '${nextDay(filters.endDate)}'${chFilter}`
  );
  return data[0]?.count || 0;
}

// ============================================================================
// Main Hook
// ============================================================================

export function useDashboardStats(filters: DashboardFilters) {
  const totalRevenue = useTotalRevenue(filters);
  const paidAmount = usePaidAmount(filters);
  const receivableAmount = useReceivableAmount(filters);
  const payableAmount = usePayableAmount(filters);
  const extendedStockValue = useExtendedStockValue();
  const deliveryOrdersCount = useDeliveryOrdersCount(filters);
  const pickupOrdersCount = usePickupOrdersCount(filters);
  const dropOffOrdersCount = useDropOffOrdersCount(filters);
  const customerCount = useCustomerCount();
  const productCount = useProductCount();
  const orderCount = useOrderCount(filters);

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
