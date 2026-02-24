/**
 * Stocks Data Hook
 *
 * Provides real-time synced stock/inventory data from PowerSync with
 * filtering semantics aligned to KHUB web Stocks list query.
 *
 * Decoupled design: main query = stocks + product/channel/category/brand only;
 * unit prices are fetched in a separate simple query and merged in memory.
 */

import { useEffect, useMemo, useState } from "react";
import { powerSyncDb } from "../PowerSyncProvider";
import { useSyncStream } from "../useSyncStream";

// ============================================================================
// Types
// ============================================================================

/** Raw joined data from database */
interface StockJoinRow {
  id: string;
  channel_id: number;
  product_id: number;
  available_qty: number | null;
  on_hold_total_qty: number | null;
  back_order_qty: number | null;
  coming_soon_qty: number | null;
  hold_free_shipment: number | null;
  damage_qty: number | null;
  total_qty: number | null;
  status: number | null;
  deleted_at: string | null;
  product_name: string | null;
  sku: string | null;
  upc: string | null;
  bin: string | null;
  zone: string | null;
  aisle: string | null;
  channel_name: string | null;
  category_name: string | null;
  brand_name: string | null;
  price: number | null;
  cost: number | null;
  base_cost: number | null;
}

export interface StocksQueryFilters {
  searchKey?: string;
  channelIds?: Array<number | string>;
  brandIds?: Array<number | string>;
  supplierIds?: Array<number | string>;
  categoryIds?: Array<number | string>;
  productStatus?: Array<number | string>;
  searchZone?: string;
  searchAisle?: string;
  searchBin?: string;
  hasDamaged?: boolean;
  outOfStock?: boolean;
}

/** Stock data as displayed in the UI */
export interface StockView {
  id: string;
  channelId: number;
  productId: number;
  deletedAt: string | null;
  productName: string;
  sku: string;
  upc: string;
  bin: string;
  zone: string;
  aisle: string;
  channelName: string;
  categoryName: string;
  brandName: string;
  availableQty: number;
  onHoldQty: number;
  backOrderQty: number;
  comingSoonQty: number;
  deliveredWithoutStockQty: number;
  damagedQty: number;
  totalQty: number;
  minQty: number | null; // not available in local stream yet
  location: string | null; // not available in local stream yet
  baseCostPrice: number;
  salePrice: number;
  costPrice: number;
  totalCost: number;
  status: number;
}

interface BuiltQuery {
  query: string;
  params: Array<string | number>;
}

interface BuiltStocksQueries {
  dataQuery: BuiltQuery;
  countQuery: BuiltQuery;
}

interface CountRow {
  total_count: number | null;
}

/** Single row from unit_prices for merge (first per product_id+channel_id by unit, id) */
interface UnitPriceRow {
  product_id: number;
  channel_id: number;
  price: number | null;
  cost: number | null;
  base_cost: number | null;
}

export interface StocksPaginationOptions {
  page?: number;
  pageSize?: number;
}

export interface StocksPerfSnapshotMeta {
  phase: "data" | "count";
  query: string;
  params: any[];
  page: number;
  pageSize?: number;
  startedAtMs: number;
  endedAtMs: number;
  durationMs: number;
  rowCount: number;
  success: boolean;
  errorMessage?: string;
}

export interface StocksPerfCallbacks {
  onQuerySnapshotEnd?: (meta: StocksPerfSnapshotMeta) => void;
}

// ============================================================================
// Query Builders
// ============================================================================

function toIntArray(values?: Array<number | string>): number[] {
  if (!values) return [];
  return values
    .map((value) => Number(value))
    .filter((value) => Number.isInteger(value));
}

function pushInCondition(
  targetConditions: string[],
  targetParams: Array<string | number>,
  sqlLeft: string,
  values: number[]
) {
  if (values.length === 0) return;
  const placeholders = values.map(() => "?").join(", ");
  targetConditions.push(`${sqlLeft} IN (${placeholders})`);
  targetParams.push(...values);
}

function buildStocksQuery(
  filters: StocksQueryFilters = {},
  options?: { limit?: number; offset?: number }
): BuiltStocksQueries {
  const conditions: string[] = [];
  const params: Array<string | number> = [];

  const searchKey = (filters.searchKey || "").trim().toLowerCase();
  const channelIds = toIntArray(filters.channelIds);
  const brandIds = toIntArray(filters.brandIds);
  const supplierIds = toIntArray(filters.supplierIds);
  const categoryIds = toIntArray(filters.categoryIds);

  // Match web parser default: product_status defaults to [1] when not supplied.
  const rawProductStatus =
    filters.productStatus === undefined ? [1] : toIntArray(filters.productStatus);
  const hasDamaged = Boolean(filters.hasDamaged);
  const outOfStock = Boolean(filters.outOfStock);
  const searchZone = (filters.searchZone || "").trim().toLowerCase();
  const searchAisle = (filters.searchAisle || "").trim().toLowerCase();
  const searchBin = (filters.searchBin || "").trim().toLowerCase();

  if (searchKey) {
    conditions.push(
      "(LOWER(COALESCE(p.name, '')) LIKE ? OR LOWER(COALESCE(p.sku, '')) LIKE ? OR LOWER(COALESCE(p.upc, '')) LIKE ?)"
    );
    const likeValue = `%${searchKey}%`;
    params.push(likeValue, likeValue, likeValue);
  }

  pushInCondition(conditions, params, "sbs.channel_id", channelIds);
  pushInCondition(conditions, params, "p.brand_id", brandIds);

  if (supplierIds.length > 0) {
    const placeholders = supplierIds.map(() => "?").join(", ");
    conditions.push(
      `EXISTS (
         SELECT 1 FROM products_suppliers ps
         WHERE ps.product_id = p.id AND ps.supplier_id IN (${placeholders})
       )`
    );
    params.push(...supplierIds);
  }

  if (categoryIds.length > 0) {
    const placeholders = categoryIds.map(() => "?").join(", ");
    conditions.push(
      `EXISTS (
         SELECT 1 FROM categories_products cp
         WHERE cp.product_id = p.id AND cp.category_id IN (${placeholders})
       )`
    );
    params.push(...categoryIds);
  }

  if (searchZone) {
    conditions.push("LOWER(COALESCE(p.zone, '')) LIKE ?");
    params.push(`%${searchZone}%`);
  }
  if (searchAisle) {
    conditions.push("LOWER(COALESCE(p.aisle, '')) LIKE ?");
    params.push(`%${searchAisle}%`);
  }
  if (searchBin) {
    conditions.push("LOWER(COALESCE(p.bin, '')) LIKE ?");
    params.push(`%${searchBin}%`);
  }

  if (hasDamaged) {
    conditions.push("COALESCE(sbs.damage_qty, 0) != 0");
  }
  if (outOfStock) {
    conditions.push("COALESCE(sbs.available_qty, 0) = 0");
  }

  if (rawProductStatus.length > 0) {
    const hasArchived = rawProductStatus.includes(3);
    const hasActiveOrInactive = rawProductStatus.includes(1) || rawProductStatus.includes(2);
    const placeholders = rawProductStatus.map(() => "?").join(", ");

    if (hasArchived) {
      if (hasActiveOrInactive) {
        conditions.push(`(p.status IN (${placeholders}) OR p.deleted_at IS NOT NULL)`);
        params.push(...rawProductStatus);
      } else {
        conditions.push("p.deleted_at IS NOT NULL");
      }
    } else if (hasActiveOrInactive) {
      conditions.push(`p.status IN (${placeholders}) AND p.deleted_at IS NULL`);
      params.push(...rawProductStatus);
    }
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
  const dataParams = [...params];
  let paginationClause = "";
  if (typeof options?.limit === "number" && options.limit > 0) {
    paginationClause += " LIMIT ?";
    dataParams.push(options.limit);
    if (typeof options?.offset === "number" && options.offset > 0) {
      paginationClause += " OFFSET ?";
      dataParams.push(options.offset);
    }
  }

  // Main query: stocks + product/channel/category/brand only (no unit_prices).
  // Prices are fetched in a separate decoupled query and merged in memory.
  const dataQuery = `
    WITH stock_by_status AS (
      SELECT
        s.product_id,
        s.channel_id,
        SUM(CASE WHEN s.status NOT IN (7, 9, 10, 11) THEN s.qty ELSE 0 END) AS total_qty,
        SUM(CASE WHEN s.status = 6 THEN s.qty ELSE 0 END) AS available_qty,
        SUM(CASE WHEN s.status = 3 THEN s.qty ELSE 0 END) AS on_hold_total_qty,
        SUM(CASE WHEN s.status = 8 THEN s.qty ELSE 0 END) AS damage_qty,
        SUM(CASE WHEN s.status = 9 THEN s.qty ELSE 0 END) AS back_order_qty,
        SUM(CASE WHEN s.status = 11 THEN s.qty ELSE 0 END) AS coming_soon_qty,
        SUM(CASE WHEN s.status = 10 THEN s.qty ELSE 0 END) AS hold_free_shipment
      FROM stocks s
      GROUP BY s.product_id, s.channel_id
    )
    SELECT
      CAST(sbs.product_id AS TEXT) || '-' || CAST(sbs.channel_id AS TEXT) AS id,
      sbs.channel_id,
      sbs.product_id,
      COALESCE(sbs.available_qty, 0) AS available_qty,
      COALESCE(sbs.on_hold_total_qty, 0) AS on_hold_total_qty,
      COALESCE(sbs.back_order_qty, 0) AS back_order_qty,
      COALESCE(sbs.coming_soon_qty, 0) AS coming_soon_qty,
      COALESCE(sbs.hold_free_shipment, 0) AS hold_free_shipment,
      COALESCE(sbs.damage_qty, 0) AS damage_qty,
      COALESCE(sbs.total_qty, 0) AS total_qty,
      p.status AS status,
      p.deleted_at AS deleted_at,
      p.name AS product_name,
      p.sku AS sku,
      p.upc AS upc,
      p.bin AS bin,
      p.zone AS zone,
      p.aisle AS aisle,
      ch.name AS channel_name,
      c.name AS category_name,
      b.name AS brand_name,
      NULL AS price,
      NULL AS cost,
      NULL AS base_cost
    FROM stock_by_status sbs
    INNER JOIN products p ON sbs.product_id = p.id
    LEFT JOIN channels ch ON sbs.channel_id = ch.id
    LEFT JOIN categories c ON p.main_category_id = c.id
    LEFT JOIN brands b ON p.brand_id = b.id
    ${whereClause}
    ORDER BY p.name ASC
    ${paginationClause}
  `;

  const countQuery = `
    WITH stock_by_status AS (
      SELECT
        s.product_id,
        s.channel_id,
        SUM(CASE WHEN s.status NOT IN (7, 9, 10, 11) THEN s.qty ELSE 0 END) AS total_qty,
        SUM(CASE WHEN s.status = 6 THEN s.qty ELSE 0 END) AS available_qty,
        SUM(CASE WHEN s.status = 3 THEN s.qty ELSE 0 END) AS on_hold_total_qty,
        SUM(CASE WHEN s.status = 8 THEN s.qty ELSE 0 END) AS damage_qty
      FROM stocks s
      GROUP BY s.product_id, s.channel_id
    )
    SELECT COUNT(*) AS total_count
    FROM stock_by_status sbs
    INNER JOIN products p ON sbs.product_id = p.id
    ${whereClause}
  `;

  return {
    dataQuery: { query: dataQuery, params: dataParams },
    countQuery: { query: countQuery, params },
  };
}

/** Build a simple query to fetch first unit_price per (product_id, channel_id) by unit, id. */
function buildUnitPricesQueryAndParams(
  pairs: Array<{ product_id: number; channel_id: number }>
): { query: string; params: number[] } {
  if (pairs.length === 0) {
    return { query: "SELECT NULL AS product_id, NULL AS channel_id, NULL AS price, NULL AS cost, NULL AS base_cost WHERE 0", params: [] };
  }
  const conditions = pairs.map(() => "(product_id = ? AND channel_id = ?)").join(" OR ");
  const params = pairs.flatMap((p) => [p.product_id, p.channel_id]);
  const query = `SELECT product_id, channel_id, price, cost, base_cost FROM unit_prices WHERE ${conditions} ORDER BY product_id, channel_id, unit ASC, id ASC`;
  return { query, params };
}

/** Take first row per (product_id, channel_id) from ordered unit price rows. */
function firstUnitPricePerPair(rows: UnitPriceRow[]): Map<string, { price: number | null; cost: number | null; base_cost: number | null }> {
  const map = new Map<string, { price: number | null; cost: number | null; base_cost: number | null }>();
  for (const r of rows) {
    const key = `${r.product_id}-${r.channel_id}`;
    if (!map.has(key)) map.set(key, { price: r.price, cost: r.cost, base_cost: r.base_cost });
  }
  return map;
}

// ============================================================================
// Data Transformers
// ============================================================================

function toNumber(value: number | null | undefined): number {
  const parsed = Number(value ?? 0);
  return Number.isNaN(parsed) ? 0 : parsed;
}

/** Transform database record to UI view */
function toStockView(db: StockJoinRow): StockView {
  const availableQty = toNumber(db.available_qty);
  const onHoldQty = toNumber(db.on_hold_total_qty);
  const backOrderQty = toNumber(db.back_order_qty);
  const comingSoonQty = toNumber(db.coming_soon_qty);
  const deliveredWithoutStockQty = toNumber(db.hold_free_shipment);
  const damagedQty = toNumber(db.damage_qty);
  const totalQty = toNumber(db.total_qty);
  const costPrice = toNumber(db.cost);
  const productStatus = toNumber(db.status);

  return {
    id: db.id,
    channelId: toNumber(db.channel_id),
    productId: toNumber(db.product_id),
    deletedAt: db.deleted_at ?? null,
    productName: db.product_name || "",
    sku: db.sku || "",
    upc: db.upc || "",
    bin: db.bin || "",
    zone: db.zone || "",
    aisle: db.aisle || "",
    channelName: db.channel_name || "",
    categoryName: db.category_name || "",
    brandName: db.brand_name || "",
    availableQty,
    onHoldQty,
    backOrderQty,
    comingSoonQty,
    deliveredWithoutStockQty,
    damagedQty,
    totalQty,
    minQty: null,
    location: null,
    baseCostPrice: toNumber(db.base_cost),
    salePrice: toNumber(db.price),
    costPrice,
    totalCost: availableQty * costPrice,
    status: productStatus,
  };
}

// ============================================================================
// Hooks
// ============================================================================

/** Get all stocks with product info and web-aligned filter semantics.
 *  Uses client-side pagination: SQL fetches ALL matching rows once,
 *  then slicing happens in-memory so page changes are instant (~10ms). */
export function useStocks(
  filters: StocksQueryFilters = {},
  pagination?: StocksPaginationOptions,
  perfCallbacks?: StocksPerfCallbacks,
  streamOptions?: { deferInteractions?: boolean }
) {
  const pageSize =
    typeof pagination?.pageSize === "number" && pagination.pageSize > 0
      ? Math.floor(pagination.pageSize)
      : undefined;
  const page =
    typeof pagination?.page === "number" && pagination.page > 0
      ? Math.floor(pagination.page)
      : 1;

  // No LIMIT/OFFSET in SQL — fetch all matching rows, paginate in memory
  const queryConfig = useMemo(
    () => buildStocksQuery(filters),
    [filters]
  );


  const { data, isLoading, error, isStreaming, refresh } = useSyncStream<StockJoinRow>(
    queryConfig.dataQuery.query,
    queryConfig.dataQuery.params,
    {
      keepPreviousData: true,
      deferInteractions: streamOptions?.deferInteractions,
      onSnapshotEnd: (meta) => {
        perfCallbacks?.onQuerySnapshotEnd?.({
          phase: "data",
          query: queryConfig.dataQuery.query,
          params: queryConfig.dataQuery.params,
          page,
          pageSize,
          startedAtMs: meta.startedAtMs,
          endedAtMs: meta.endedAtMs,
          durationMs: meta.durationMs,
          rowCount: meta.rowCount,
          success: meta.success,
          errorMessage: meta.errorMessage,
        });
      },
    }
  );

  // Decoupled: fetch unit prices in a separate simple query and merge.
  const [unitPricesMap, setUnitPricesMap] = useState<Map<string, { price: number | null; cost: number | null; base_cost: number | null }>>(new Map());
  useEffect(() => {
    if (data.length === 0) {
      setUnitPricesMap(new Map());
      return;
    }
    const pairs = data.map((r) => ({ product_id: r.product_id, channel_id: r.channel_id }));
    const { query: upQuery, params: upParams } = buildUnitPricesQueryAndParams(pairs);
    let cancelled = false;
    powerSyncDb.getAll<UnitPriceRow>(upQuery, upParams).then((rows) => {
      if (cancelled) return;
      setUnitPricesMap(firstUnitPricePerPair(rows));
    });
    return () => { cancelled = true; };
  }, [data]);

  const mergedData = useMemo(() => {
    if (unitPricesMap.size === 0 && data.length > 0) return data;
    return data.map((row) => {
      const prices = unitPricesMap.get(row.id);
      if (!prices) return row;
      return { ...row, price: prices.price, cost: prices.cost, base_cost: prices.base_cost };
    });
  }, [data, unitPricesMap]);

  // All rows transformed once
  const allStocks = useMemo(() => mergedData.map(toStockView), [mergedData]);

  // Client-side pagination: slice the cached array (instant)
  const stocks = useMemo(() => {
    if (!pageSize) return allStocks;
    const start = (page - 1) * pageSize;
    return allStocks.slice(start, start + pageSize);
  }, [allStocks, page, pageSize]);

  const count = allStocks.length;

  return {
    stocks,
    isLoading,
    error,
    isStreaming,
    refresh,
    count,
  };
}

/** StockAlert shape for stock-alerts screen */
export interface StockAlertView {
  id: string;
  productName: string;
  skuUpc: string;
  channelName: string;
  categoryName: string;
  availableQty: number;
  backOrderQty: number;
  totalQty: number;
  minQty: number;
  maxQty: number;
}

function toStockAlertView(s: StockView): StockAlertView {
  return {
    id: s.id,
    productName: s.productName,
    skuUpc: [s.sku, s.upc].filter(Boolean).join(' / ') || '-',
    channelName: s.channelName || 'Primary',
    categoryName: s.categoryName || '',
    availableQty: s.availableQty,
    backOrderQty: s.backOrderQty,
    totalQty: s.totalQty,
    minQty: s.minQty ?? 0,
    maxQty: 99999,
  };
}

/** Get low stock alerts - items with available_qty = 0 or below threshold */
export function useStockAlerts() {
  const { stocks, isLoading, error, isStreaming, refresh } = useStocks({
    outOfStock: true,
    productStatus: [1],
  });
  const alerts = useMemo(() => stocks.map(toStockAlertView), [stocks]);
  return {
    alerts,
    isLoading,
    error,
    isStreaming,
    refresh,
    count: alerts.length,
  };
}

/** Search stocks by product name, SKU, or UPC */
export function useStockSearch(query: string) {
  const searchKey = query.trim();
  const queryConfig = useMemo(
    () => buildStocksQuery({ searchKey }, { limit: 50 }),
    [searchKey]
  );

  const { data, isLoading, error } = useSyncStream<StockJoinRow>(
    queryConfig.dataQuery.query,
    queryConfig.dataQuery.params,
    { enabled: searchKey.length >= 2 }
  );

  const stocks = useMemo(() => data.map(toStockView), [data]);
  return { stocks, isLoading, error };
}
