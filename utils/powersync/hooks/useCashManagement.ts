/**
 * Cash Management Hook
 * 
 * All constants verified against:
 * kapp/server/constants/__init__.py
 */

import { useMemo } from 'react';
import { SaleOrderStatus, SaleType } from '../../constants';
import { useSyncStream } from '../useSyncStream';

// ============================================================================
// Types
// ============================================================================

export interface CashSummary {
  openingBalance: number;
  totalSales: number;
  totalRefunds: number;
  expectedCash: number;
}

interface CashRow {
  total: number;
}

// ============================================================================
// Hooks
// ============================================================================

/** Opening balance - TODO: implement cash register session tracking */
function useOpeningBalance() {
  return 200.00;
}

/**
 * Total sales today
 * K Web: status NOT IN (90, 80) AND balance_adjustment_id IS NULL
 */
function useTotalSales() {
  const { data } = useSyncStream<CashRow>(
    `SELECT COALESCE(SUM(total_price), 0) as total 
     FROM sale_orders 
     WHERE status NOT IN (${SaleOrderStatus.VOID}, ${SaleOrderStatus.DISCARDED})
     AND balance_adjustment_id IS NULL
     AND DATE(order_date) = DATE('now', 'localtime')`
  );
  const result = data[0]?.total || 0;
  console.log('[CashMgmt] Total Sales:', result);
  return result;
}

/**
 * Total refunds today
 * K Web: sale_type = 2 (RETURN), status NOT IN (90, 80)
 */
function useTotalRefunds() {
  const { data } = useSyncStream<CashRow>(
    `SELECT COALESCE(SUM(total_price), 0) as total 
     FROM sale_orders 
     WHERE sale_type = ${SaleType.RETURN}
     AND status NOT IN (${SaleOrderStatus.VOID}, ${SaleOrderStatus.DISCARDED})
     AND DATE(order_date) = DATE('now', 'localtime')`
  );
  const result = data[0]?.total || 0;
  console.log('[CashMgmt] Total Refunds:', result);
  return result;
}

/**
 * User sales today
 */
function useUserSales(userId?: string | number) {
  const query = userId
    ? `SELECT COALESCE(SUM(total_price), 0) as total 
       FROM sale_orders 
       WHERE created_by_id = ${userId}
       AND status NOT IN (${SaleOrderStatus.VOID}, ${SaleOrderStatus.DISCARDED})
       AND balance_adjustment_id IS NULL
       AND DATE(order_date) = DATE('now', 'localtime')`
    : `SELECT 0 as total`;

  const { data } = useSyncStream<CashRow>(query);
  const result = data[0]?.total || 0;
  console.log('[CashMgmt] User Sales (userId=' + userId + '):', result);
  return result;
}

/** Main hook */
export function useCashManagement(userId?: string | number) {
  const openingBalance = useOpeningBalance();
  const totalSales = useTotalSales();
  const totalRefunds = useTotalRefunds();
  const userSales = useUserSales(userId);

  const cashSummary = useMemo<CashSummary>(() => ({
    openingBalance,
    totalSales,
    totalRefunds,
    expectedCash: openingBalance + totalSales - totalRefunds,
  }), [openingBalance, totalSales, totalRefunds]);

  return { cashSummary, userSales, isLoading: false };
}
