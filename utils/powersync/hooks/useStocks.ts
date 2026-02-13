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
  channel_name: string | null;
  category_name: string | null;
  brand_name: string | null;
  // From unit_prices (actual field names)
  price: number | null;      // sale price
  cost: number | null;       // cost price
  base_cost: number | null;  // base cost
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
  channelName: string;
  categoryName: string;
  brandName: string;
  availableQty: number;
  onHoldQty: number | null;
  backOrderQty: number | null;
  comingSoonQty: number | null;
  deliveredWithoutStockQty: number | null;
  damagedQty: number | null;
  totalQty: number;
  minQty: number | null;      // DB does not have qty_alert, returns null
  location: string | null;    // DB does not have location, returns null
  baseCostPrice: number;
  salePrice: number;
  costPrice: number;
  totalCost: number;
  status: number;
}

// ============================================================================
// Data Transformers
// ============================================================================

/** Transform database record to UI view */
function toStockView(db: StockJoinRow): StockView {
  const availableQty = db.qty || 0;
  const costPrice = db.cost || 0;

  return {
    id: db.id,
    channelId: db.channel_id,
    productId: db.product_id,
    productName: db.product_name || '',
    sku: db.sku || '',
    upc: db.upc || '',
    bin: db.bin || '',
    channelName: db.channel_name || '',
    categoryName: db.category_name || '',
    brandName: db.brand_name || '',
    availableQty,
    onHoldQty: null,             // DB does not have this field
    backOrderQty: null,          // DB does not have this field
    comingSoonQty: null,         // DB does not have this field
    deliveredWithoutStockQty: null, // DB does not have this field
    damagedQty: null,            // DB does not have this field
    totalQty: availableQty,      // fallback when additional qty buckets are unavailable
    minQty: null,              // DB does not have this field
    location: null,            // DB does not have this field
    baseCostPrice: db.base_cost || 0,
    salePrice: db.price || 0,
    costPrice,
    totalCost: availableQty * costPrice,
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
      ch.name as channel_name,
      c.name as category_name,
      b.name as brand_name,
      up.price,
      up.cost,
      up.base_cost
     FROM stocks s
     LEFT JOIN products p ON s.product_id = p.id
     LEFT JOIN channels ch ON s.channel_id = ch.id
     LEFT JOIN categories c ON p.main_category_id = c.id
     LEFT JOIN brands b ON p.brand_id = b.id
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
      ch.name as channel_name,
      c.name as category_name,
      b.name as brand_name,
      up.price,
      up.cost,
      up.base_cost
     FROM stocks s
     LEFT JOIN products p ON s.product_id = p.id
     LEFT JOIN channels ch ON s.channel_id = ch.id
     LEFT JOIN categories c ON p.main_category_id = c.id
     LEFT JOIN brands b ON p.brand_id = b.id
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
