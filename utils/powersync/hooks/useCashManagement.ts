/**
 * Cash Management Hook
 *
 * All constants verified against:
 *   kapp/server/constants/__init__.py
 *
 * Filtering logic delegated to shared sqlFilters module.
 *
 * Consolidates all cash queries into a SINGLE useSyncStream call
 * to minimize PowerSync watch subscriptions and reduce mount overhead.
 */

import { useMemo } from 'react';
import { SaleOrderStatus, SaleType } from '../../constants';
import { dateTodayLocal } from '../sqlFilters';
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

// ============================================================================
// Constants
// ============================================================================

const OPENING_BALANCE = 200.00;

// ============================================================================
// Hooks
// ============================================================================

/** Main hook - single query for all cash management stats */
export function useCashManagement(userId?: string | number) {
  const todayFilter = dateTodayLocal('order_date');

  const userSalesClause = userId
    ? `COALESCE((SELECT SUM(total_price) FROM sale_orders
        WHERE created_by_id = ${userId}
          AND status NOT IN (${SaleOrderStatus.VOID}, ${SaleOrderStatus.DISCARDED})
          AND balance_adjustment_id IS NULL
          AND ${todayFilter}), 0)`
    : '0';

  const { data } = useSyncStream<Record<string, number>>(
    `SELECT
      COALESCE((SELECT SUM(total_price) FROM sale_orders
        WHERE status NOT IN (${SaleOrderStatus.VOID}, ${SaleOrderStatus.DISCARDED})
          AND balance_adjustment_id IS NULL
          AND ${todayFilter}), 0) AS totalSales,
      COALESCE((SELECT SUM(total_price) FROM sale_orders
        WHERE sale_type = ${SaleType.RETURN}
          AND status NOT IN (${SaleOrderStatus.VOID}, ${SaleOrderStatus.DISCARDED})
          AND ${todayFilter}), 0) AS totalRefunds,
      ${userSalesClause} AS userSales`
  );

  const row = data[0];
  const totalSales = Number(row?.totalSales) || 0;
  const totalRefunds = Number(row?.totalRefunds) || 0;
  const userSales = Number(row?.userSales) || 0;

  const cashSummary = useMemo<CashSummary>(() => ({
    openingBalance: OPENING_BALANCE,
    totalSales,
    totalRefunds,
    expectedCash: OPENING_BALANCE + totalSales - totalRefunds,
  }), [totalSales, totalRefunds]);

  return { cashSummary, userSales, isLoading: false };
}
