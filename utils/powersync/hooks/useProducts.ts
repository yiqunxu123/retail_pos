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

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { powerSyncDb } from '../PowerSyncProvider';
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
  // From categories join
  category_name: string | null;
  // From brands join
  brand_name: string | null;
}

interface ProductCountRow {
  total: number | string;
}

/** Product data as displayed in the UI */
export interface ProductView {
  id: string;
  name: string;
  sku: string;
  upc: string;
  description: string;
  brandId: number | null;
  brandName: string;
  categoryId: number | null;
  categoryName: string;
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
    brandName: db.brand_name || '',
    categoryId: db.main_category_id,
    categoryName: db.category_name || '',
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
export function useProducts(options?: { enabled?: boolean }) {
  // Join with primary channel (channel_id = 1) for prices, categories, and brands
  const { data, isLoading, error, isStreaming, refresh } = useSyncStream<ProductJoinRow>(
    `SELECT 
      p.*,
      up.price,
      up.cost,
      up.base_cost,
      c.name AS category_name,
      b.name AS brand_name
     FROM products p
     LEFT JOIN unit_prices up ON p.id = up.product_id AND up.channel_id = 1
     LEFT JOIN categories c ON p.main_category_id = c.id
     LEFT JOIN brands b ON p.brand_id = b.id
     ORDER BY p.name ASC`,
    [],
    { enabled: options?.enabled }
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
      up.base_cost,
      c.name AS category_name,
      b.name AS brand_name
     FROM products p
     LEFT JOIN unit_prices up ON p.id = up.product_id AND up.channel_id = 1
     LEFT JOIN categories c ON p.main_category_id = c.id
     LEFT JOIN brands b ON p.brand_id = b.id
     WHERE p.name LIKE ? OR p.sku LIKE ? OR p.upc LIKE ?
     ORDER BY p.name ASC
     LIMIT 50`,
    [searchTerm, searchTerm, searchTerm],
    { enabled: query.length >= 2 }
  );

  const products = useMemo(() => data.map(toProductView), [data]);

  return { products, isLoading, error };
}

/** Get products filtered by category ID (null = all) */
export function useProductsByCategory(categoryId: string | null) {
  const { data, isLoading, error } = useSyncStream<ProductJoinRow>(
    categoryId
      ? `SELECT 
          p.*,
          up.price,
          up.cost,
          up.base_cost,
          c.name AS category_name,
          b.name AS brand_name
         FROM products p
         LEFT JOIN unit_prices up ON p.id = up.product_id AND up.channel_id = 1
         LEFT JOIN categories c ON p.main_category_id = c.id
         LEFT JOIN brands b ON p.brand_id = b.id
         WHERE p.main_category_id = ?
         ORDER BY p.name ASC`
      : `SELECT 
          p.*,
          up.price,
          up.cost,
          up.base_cost,
          c.name AS category_name,
          b.name AS brand_name
         FROM products p
         LEFT JOIN unit_prices up ON p.id = up.product_id AND up.channel_id = 1
         LEFT JOIN categories c ON p.main_category_id = c.id
         LEFT JOIN brands b ON p.brand_id = b.id
         ORDER BY p.name ASC
         LIMIT 100`,
    categoryId ? [categoryId] : []
  );

  const products = useMemo(() => data.map(toProductView), [data]);

  return { products, isLoading, error };
}

interface UseProductsPageParams {
  query: string;
  page: number;
  pageSize: number;
  enabled?: boolean;
}

/** Get paged products filtered by name/SKU/UPC */
export function useProductsPage({
  query,
  page,
  pageSize,
  enabled = true,
}: UseProductsPageParams) {
  const normalizedPageSize = Math.max(1, Math.floor(pageSize || 10));
  const normalizedPage = Math.max(1, Math.floor(page || 1));
  const normalizedQuery = query.trim();
  const hasQuery = normalizedQuery.length > 0;
  const searchTerm = `%${normalizedQuery}%`;
  const offset = (normalizedPage - 1) * normalizedPageSize;

  const whereClause = hasQuery
    ? `WHERE p.name LIKE ? OR p.sku LIKE ? OR p.upc LIKE ?`
    : ``;

  const whereParams = useMemo(
    () => (hasQuery ? [searchTerm, searchTerm, searchTerm] : []),
    [hasQuery, searchTerm]
  );

  const listQuery = useMemo(
    () => `SELECT
      p.*,
      (
        SELECT MAX(up.price)
        FROM unit_prices up
        WHERE up.product_id = p.id AND up.channel_id = 1
      ) AS price,
      (
        SELECT MAX(up.cost)
        FROM unit_prices up
        WHERE up.product_id = p.id AND up.channel_id = 1
      ) AS cost,
      (
        SELECT MAX(up.base_cost)
        FROM unit_prices up
        WHERE up.product_id = p.id AND up.channel_id = 1
      ) AS base_cost,
      c.name AS category_name,
      b.name AS brand_name
     FROM products p
     LEFT JOIN categories c ON p.main_category_id = c.id
     LEFT JOIN brands b ON p.brand_id = b.id
     ${whereClause}
     ORDER BY p.name COLLATE NOCASE ASC, p.id ASC
     LIMIT ${normalizedPageSize} OFFSET ${offset}`,
    [normalizedPageSize, offset, whereClause]
  );

  const countQuery = useMemo(
    () => `SELECT
      COUNT(*) AS total
     FROM products p
     ${whereClause}`,
    [whereClause]
  );

  const [listRows, setListRows] = useState<ProductJoinRow[]>([]);
  const [countRows, setCountRows] = useState<ProductCountRow[]>([]);
  const [isListLoading, setIsListLoading] = useState(enabled);
  const [isCountLoading, setIsCountLoading] = useState(enabled);
  const [error, setError] = useState<Error | null>(null);
  const listRequestIdRef = useRef(0);
  const countRequestIdRef = useRef(0);
  const loadedCountKeyRef = useRef<string | null>(null);
  const countKey = useMemo(
    () => `${countQuery}::${JSON.stringify(whereParams)}`,
    [countQuery, whereParams]
  );

  const fetchListPage = useCallback(async () => {
    const requestId = listRequestIdRef.current + 1;
    listRequestIdRef.current = requestId;

    if (!enabled) {
      setListRows([]);
      setIsListLoading(false);
      return;
    }

    setError(null);
    setIsListLoading(true);

    try {
      const nextListRows = await powerSyncDb.getAll<ProductJoinRow>(listQuery, whereParams);
      if (listRequestIdRef.current !== requestId) return;
      setListRows([...nextListRows]);
    } catch (err) {
      if (listRequestIdRef.current !== requestId) return;
      const normalizedError = err instanceof Error ? err : new Error(String(err));
      setError(normalizedError);
    } finally {
      if (listRequestIdRef.current !== requestId) return;
      setIsListLoading(false);
    }
  }, [enabled, listQuery, whereParams]);

  const fetchCountIfNeeded = useCallback(async (force = false) => {
    const requestId = countRequestIdRef.current + 1;
    countRequestIdRef.current = requestId;

    if (!enabled) {
      loadedCountKeyRef.current = null;
      setCountRows([]);
      setIsCountLoading(false);
      return;
    }

    const shouldFetchCount = force || loadedCountKeyRef.current !== countKey;
    if (!shouldFetchCount) {
      setIsCountLoading(false);
      return;
    }

    setIsCountLoading(true);
    try {
      const nextCountRows = await powerSyncDb.getAll<ProductCountRow>(countQuery, whereParams);
      if (countRequestIdRef.current !== requestId) return;
      setCountRows([...nextCountRows]);
      loadedCountKeyRef.current = countKey;
    } catch (err) {
      if (countRequestIdRef.current !== requestId) return;
      const normalizedError = err instanceof Error ? err : new Error(String(err));
      setError((prev) => prev ?? normalizedError);
    } finally {
      if (countRequestIdRef.current !== requestId) return;
      setIsCountLoading(false);
    }
  }, [countKey, countQuery, enabled, whereParams]);

  useEffect(() => {
    void fetchListPage();
    return () => {
      listRequestIdRef.current += 1;
    };
  }, [fetchListPage]);

  useEffect(() => {
    void fetchCountIfNeeded();
    return () => {
      countRequestIdRef.current += 1;
    };
  }, [fetchCountIfNeeded]);

  const products = useMemo(() => listRows.map(toProductView), [listRows]);
  const totalCount = useMemo(() => {
    const raw = countRows[0]?.total ?? 0;
    const numeric = Number(raw);
    return Number.isFinite(numeric) ? numeric : 0;
  }, [countRows]);
  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(totalCount / normalizedPageSize)),
    [normalizedPageSize, totalCount]
  );
  const isLoading = isListLoading || isCountLoading;
  const isStreaming = false;

  const refresh = useCallback(async () => {
    await Promise.all([fetchListPage(), fetchCountIfNeeded(true)]);
  }, [fetchCountIfNeeded, fetchListPage]);

  return {
    products,
    totalCount,
    totalPages,
    page: normalizedPage,
    pageSize: normalizedPageSize,
    isListLoading,
    isCountLoading,
    isLoading,
    isStreaming,
    error,
    refresh,
  };
}
