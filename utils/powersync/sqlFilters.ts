/**
 * Unified SQL Filter Builders for PowerSync/SQLite queries.
 *
 * Centralizes ALL date range, timezone conversion, and channel filtering logic
 * so query hooks only compose pre-built fragments instead of hand-writing SQL clauses.
 *
 * Design rationale (aligned with K Web):
 *   kapp/server/app/tenant/report_api/dashboard/utils.py
 *
 *   - order_date / payment_date  → stored in LOCAL time  → compare directly
 *   - invoices.created_at        → stored in UTC         → K Web uses convert_timezone_for_client()
 *   - purchase_invoices.created_at → stored in UTC       → K Web uses raw DATE() (no tz conversion)
 *
 *   - channel filter on sale_orders  → direct column
 *   - channel filter on invoices     → JOIN sale_orders via sale_order_id
 *   - channel filter on payments     → JOIN invoices → sale_orders
 *   - channel filter on purchase_*   → direct column on purchase_orders
 */

import {
    SaleOrderStatus,
} from '../constants';
import {
    getSqliteTimezoneOffset,
    getTodayInTimezone,
} from '../timezone';

// ============================================================================
// Date Helpers
// ============================================================================

/**
 * Next calendar day after a YYYY-MM-DD string.
 *
 * PowerSync stores timestamps as `2026-02-05T15:15:00.000000`.
 * SQLite string comparison: 'T' (0x54) > ' ' (0x20), so
 *   `col <= '2026-02-05 23:59:59'` incorrectly EXCLUDES records with 'T'.
 * Using `col < nextDay(endDate)` avoids this entirely.
 */
export function nextDay(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  d.setDate(d.getDate() + 1);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/**
 * Today's date as YYYY-MM-DD in the **configured** timezone.
 *
 * When the user has selected a specific timezone in Settings,
 * returns today's date in that timezone. Otherwise falls back to the
 * device's local timezone.
 */
export function getLocalToday(): string {
  return getTodayInTimezone();
}

// ============================================================================
// Date Range Filters
// ============================================================================

/**
 * Date range for **local-time** columns (`order_date`, `payment_date`).
 *
 * These columns already store timestamps in the client's local timezone,
 * so no conversion is needed.
 *
 * Strategy: `>= start AND < nextDay(end)` to safely handle the 'T' separator.
 *
 * K Web equivalent:
 *   `AND col >= '{start}' AND col <= '{end}'`
 */
export function dateRangeLocal(
  column: string,
  startDate: string,
  endDate: string,
): string {
  return `${column} >= '${startDate}' AND ${column} < '${nextDay(endDate)}'`;
}

/**
 * Date range for **UTC** columns **with** timezone conversion.
 *
 * For columns like `invoices.created_at` that are stored in UTC.
 * Converts to the **configured** timezone before extracting DATE.
 *
 * K Web equivalent:
 *   `date(convert_timezone_for_client(col::TIMESTAMPTZ, '{tz}'))`
 * SQLite equivalent:
 *   `DATE(datetime(col, '<offset>'))` where <offset> comes from the
 *   user's timezone setting (e.g. '+08:00', 'localtime').
 */
export function dateRangeUTCConverted(
  column: string,
  startDate: string,
  endDate: string,
): string {
  const tzModifier = getSqliteTimezoneOffset();
  const expr = `DATE(datetime(${column}, '${tzModifier}'))`;
  return `${expr} >= '${startDate}' AND ${expr} <= '${endDate}'`;
}

/**
 * Date range for **UTC** columns **without** timezone conversion.
 *
 * K Web's `get_payable_amount` uses raw `DATE(created_at)` without calling
 * `convert_timezone_for_client`. We match that exactly.
 */
export function dateRangeUTCRaw(
  column: string,
  startDate: string,
  endDate: string,
): string {
  return `DATE(${column}) >= '${startDate}' AND DATE(${column}) <= '${endDate}'`;
}

/**
 * "Today" filter for **local-time** columns.
 *
 * Uses the **configured** timezone so the comparison is against the
 * business's local date, not necessarily the device timezone.
 *
 * SQLite: `DATE('now', '<offset>')` where <offset> is e.g. '+08:00' or 'localtime'.
 */
export function dateTodayLocal(column: string): string {
  const tzModifier = getSqliteTimezoneOffset();
  return `DATE(${column}) = DATE('now', '${tzModifier}')`;
}

// ============================================================================
// Channel Filters
// ============================================================================

/**
 * Simple channel filter for tables with a direct `channel_id` column.
 *
 * Used by: `sale_orders`, `purchase_orders`.
 * Returns empty string when `channelIds` is empty (= all channels).
 */
export function channelFilterDirect(
  channelIds: number[],
  column: string = 'channel_id',
): string {
  if (!channelIds.length) return '';
  const normalizedColumn = column
    .replace(/channelId/g, 'channel_id')
    .replace(/channeLid/g, 'channel_id');
  return ` AND ${normalizedColumn} IN (${channelIds.join(',')})`;
}

/** Return type for JOIN-based channel filters. */
export interface JoinFilter {
  joins: string;
  conditions: string;
}

/**
 * Channel filter for **invoices** (requires JOIN → `sale_orders`).
 *
 * K Web (get_receivable_amount):
 *   LEFT JOIN sale_orders ON sale_orders.id = invoices.sale_order_id
 *   AND sale_orders.channel_id IN (...)
 *   AND sale_orders.status NOT IN (VOID, PARKED, DISCARDED)
 */
export function channelFilterViaInvoice(channelIds: number[]): JoinFilter {
  if (!channelIds.length) return { joins: '', conditions: '' };
  return {
    joins: 'LEFT JOIN sale_orders ON sale_orders.id = invoices.sale_order_id',
    conditions:
      ` AND sale_orders.channel_id IN (${channelIds.join(',')})` +
      ` AND sale_orders.status NOT IN (${SaleOrderStatus.VOID}, ${SaleOrderStatus.PARKED}, ${SaleOrderStatus.DISCARDED})`,
  };
}

/**
 * Channel filter for **payments** (requires JOIN → `invoices` → `sale_orders`).
 *
 * K Web (get_paid_amounts):
 *   LEFT JOIN invoices inv ON inv.id = payments.invoice_id
 *   LEFT JOIN sale_orders so ON so.id = inv.sale_order_id
 *   AND so.channel_id IN (...)
 */
export function channelFilterViaPayment(channelIds: number[]): JoinFilter {
  if (!channelIds.length) return { joins: '', conditions: '' };
  return {
    joins:
      'LEFT JOIN invoices inv ON inv.id = payments.invoice_id\n' +
      '     LEFT JOIN sale_orders so ON so.id = inv.sale_order_id',
    conditions: ` AND so.channel_id IN (${channelIds.join(',')})`,
  };
}
