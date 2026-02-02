/**
 * Stocks Data Hook
 * 
 * Provides real-time synced stock/inventory data from PowerSync.
 * Joins stocks with products and unit_prices tables.
 * 
 * NOTE: qty_alert and location fields do not exist in database, displayed as "-"
 * 
 * Usage:
 *   const { stocks, isLoading } = useStocks();
 */

import { useMemo } from 'react';
import { useSyncStream } from '../useSyncStream';

// ============================================================================
// Types
// ============================================================================

/** Raw joined data from database */
interface StockJoinRow {
  id: string;
  channel_id: number;
  product_id: number;
  qty: number;
  status: number;
  product_name: string;
  sku: string;
  upc: string;
  bin: string | null;
  // From unit_prices (actual field names)
  price: number | null;      // sale price
  cost: number | null;       // cost price
}

/** Stock data as displayed in the UI */
export interface StockView {
  id: string;
  channelId: number;
  productId: number;
  productName: string;
  sku: string;
  upc: string;
  bin: string;
  availableQty: number;
  minQty: number | null;      // DB does not have qty_alert, returns null
  location: string | null;    // DB does not have location, returns null
  salePrice: number;
  costPrice: number;
  status: number;
}

// ============================================================================
// Data Transformers
// ============================================================================

/** Transform database record to UI view */
function toStockView(db: StockJoinRow): StockView {
  return {
    id: db.id,
    channelId: db.channel_id,
    productId: db.product_id,
    productName: db.product_name || '',
    sku: db.sku || '',
    upc: db.upc || '',
    bin: db.bin || '',
    availableQty: db.qty || 0,
    minQty: null,              // DB does not have this field
    location: null,            // DB does not have this field
    salePrice: db.price || 0,
    costPrice: db.cost || 0,
    status: db.status,
  };
}

// ============================================================================
// Hooks
// ============================================================================

/** Get all stocks with product info and prices */
export function useStocks() {
  const { data, isLoading, error, isStreaming, refresh } = useSyncStream<StockJoinRow>(
    `SELECT 
      s.id,
      s.channel_id,
      s.product_id,
      s.qty,
      s.status,
      p.name as product_name,
      p.sku,
      p.upc,
      p.bin,
      up.price,
      up.cost
     FROM stocks s
     LEFT JOIN products p ON s.product_id = p.id
     LEFT JOIN unit_prices up ON s.product_id = up.product_id AND s.channel_id = up.channel_id
     ORDER BY p.name ASC`
  );

  const stocks = useMemo(() => data.map(toStockView), [data]);

  return {
    stocks,
    isLoading,
    error,
    isStreaming,
    refresh,
    count: stocks.length,
  };
}

/** Get low stock alerts - NOTE: DB does not have qty_alert, this feature is unavailable */
export function useStockAlerts() {
  // DB does not have qty_alert field, returns empty array
  return {
    alerts: [] as StockView[],
    isLoading: false,
    error: null,
    isStreaming: false,
    refresh: async () => {},
    count: 0,
  };
}

/** Search stocks by product name, SKU, or UPC */
export function useStockSearch(query: string) {
  const searchTerm = `%${query}%`;
  
  const { data, isLoading, error } = useSyncStream<StockJoinRow>(
    `SELECT 
      s.id,
      s.channel_id,
      s.product_id,
      s.qty,
      s.status,
      p.name as product_name,
      p.sku,
      p.upc,
      p.bin,
      up.price,
      up.cost
     FROM stocks s
     LEFT JOIN products p ON s.product_id = p.id
     LEFT JOIN unit_prices up ON s.product_id = up.product_id AND s.channel_id = up.channel_id
     WHERE p.name LIKE ? OR p.sku LIKE ? OR p.upc LIKE ?
     ORDER BY p.name ASC
     LIMIT 50`,
    [searchTerm, searchTerm, searchTerm],
    { enabled: query.length >= 2 }
  );

  const stocks = useMemo(() => data.map(toStockView), [data]);

  return { stocks, isLoading, error };
}
