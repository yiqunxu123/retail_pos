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
  // Counts
  customerCount: number;
  productCount: number;
  orderCount: number;
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

/** Get delivery orders count */
function useDeliveryOrdersCount() {
  const { data } = useSyncStream<CountRow>(
    `SELECT COUNT(*) as count FROM sale_orders WHERE shipping_type > 0`
  );
  return data[0]?.count || 0;
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

/** Main hook - combines all dashboard stats */
export function useDashboardStats() {
  const totalRevenue = useTotalRevenue();
  const paidAmount = usePaidAmount();
  const receivableAmount = useReceivableAmount();
  const payableAmount = usePayableAmount();
  const extendedStockValue = useExtendedStockValue();
  const deliveryOrdersCount = useDeliveryOrdersCount();
  const customerCount = useCustomerCount();
  const productCount = useProductCount();
  const orderCount = useOrderCount();

  const stats = useMemo<DashboardStats>(() => ({
    totalRevenue,
    paidAmount,
    receivableAmount,
    payableAmount,
    extendedStockValue,
    deliveryOrdersCount,
    customerCount,
    productCount,
    orderCount,
  }), [
    totalRevenue,
    paidAmount,
    receivableAmount,
    payableAmount,
    extendedStockValue,
    deliveryOrdersCount,
    customerCount,
    productCount,
    orderCount,
  ]);

  return { stats };
}
