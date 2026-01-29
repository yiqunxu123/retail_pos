/**
 * Products Data Hook
 * 
 * Provides real-time synced product data from PowerSync.
 * Joins with unit_prices table for pricing info.
 * 
 * Usage:
 *   const { products, isLoading } = useProducts();
 *   const { product } = useProductById(id);
 */

import { useMemo } from 'react';
import { useSyncStream } from '../useSyncStream';

// ============================================================================
// Types
// ============================================================================

/** Raw joined data from database */
interface ProductJoinRow {
  id: string;
  brand_id: number | null;
  name: string;
  weight: number | null;
  weight_unit: number | null;
  sku: string;
  upc: string;
  upc_2: string | null;
  upc_3: string | null;
  mlc: string | null;
  bin: string | null;
  description: string;
  is_online: number;
  status: number;
  unit_of_measurement: number | null;
  slug: string;
  sold_count: number | null;
  is_featured: number | null;
  main_category_id: number | null;
  images: string | null;
  created_at: string;
  updated_at: string;
  // From unit_prices join (actual field names)
  price: number | null;       // sale price
  cost: number | null;        // cost price
  base_cost: number | null;   // base cost
}

/** Product data as displayed in the UI */
export interface ProductView {
  id: string;
  name: string;
  sku: string;
  upc: string;
  description: string;
  brandId: number | null;
  categoryId: number | null;
  weight: number | null;
  weightUnit: number | null;
  bin: string;
  mlc: string;
  onlineSale: boolean;
  isFeatured: boolean;
  soldCount: number;
  salePrice: number;      // price
  costPrice: number;      // cost
  baseCostPrice: number;  // base_cost
  isActive: boolean;
  images: string[];
  createdAt: string;
  updatedAt: string;
}

// ============================================================================
// Data Transformers
// ============================================================================

/** Transform database record to UI view */
function toProductView(db: ProductJoinRow): ProductView {
  let images: string[] = [];
  try {
    if (db.images) {
      images = JSON.parse(db.images);
    }
  } catch (e) {
    // Invalid JSON, keep empty array
  }

  return {
    id: db.id,
    name: db.name || '',
    sku: db.sku || '',
    upc: db.upc || '',
    description: db.description || '',
    brandId: db.brand_id,
    categoryId: db.main_category_id,
    weight: db.weight,
    weightUnit: db.weight_unit,
    bin: db.bin || '',
    mlc: db.mlc || '',
    onlineSale: db.is_online === 1,
    isFeatured: db.is_featured === 1,
    soldCount: db.sold_count || 0,
    salePrice: db.price || 0,
    costPrice: db.cost || 0,
    baseCostPrice: db.base_cost || 0,
    isActive: db.status === 1,
    images,
    createdAt: db.created_at || '',
    updatedAt: db.updated_at || '',
  };
}

// ============================================================================
// Hooks
// ============================================================================

/** Get all products with real-time sync */
export function useProducts() {
  // Join with primary channel (channel_id = 1) for prices
  const { data, isLoading, error, isStreaming, refresh } = useSyncStream<ProductJoinRow>(
    `SELECT 
      p.*,
      up.price,
      up.cost,
      up.base_cost
     FROM products p
     LEFT JOIN unit_prices up ON p.id = up.product_id AND up.channel_id = 1
     ORDER BY p.name ASC`
  );

  const products = useMemo(() => data.map(toProductView), [data]);

  return {
    products,
    isLoading,
    error,
    isStreaming,
    refresh,
    count: products.length,
  };
}

/** Get a single product by ID */
export function useProductById(id: string | null) {
  // Join with primary channel (channel_id = 1) for prices
  const { data, isLoading, error } = useSyncStream<ProductJoinRow>(
    `SELECT 
      p.*,
      up.price,
      up.cost,
      up.base_cost
     FROM products p
     LEFT JOIN unit_prices up ON p.id = up.product_id AND up.channel_id = 1
     WHERE p.id = ?`,
    id ? [id] : [],
    { enabled: !!id }
  );

  const product = useMemo(() => (data[0] ? toProductView(data[0]) : null), [data]);

  return { product, isLoading, error };
}

/** Search products by name, SKU, or UPC */
export function useProductSearch(query: string) {
  const searchTerm = `%${query}%`;
  
  // Join with primary channel (channel_id = 1) for prices
  const { data, isLoading, error } = useSyncStream<ProductJoinRow>(
    `SELECT 
      p.*,
      up.price,
      up.cost,
      up.base_cost
     FROM products p
     LEFT JOIN unit_prices up ON p.id = up.product_id AND up.channel_id = 1
     WHERE p.name LIKE ? OR p.sku LIKE ? OR p.upc LIKE ?
     ORDER BY p.name ASC
     LIMIT 50`,
    [searchTerm, searchTerm, searchTerm],
    { enabled: query.length >= 2 }
  );

  const products = useMemo(() => data.map(toProductView), [data]);

  return { products, isLoading, error };
}
