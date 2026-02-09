/**
 * Products API
 *
 * CRUD operations for products, strictly aligned with kapp's
 * productsCrud.js implementation.
 *
 * Backend endpoints:
 *   POST   /tenant/api/v1/catalog/products          – create product
 *   PUT    /tenant/api/v1/catalog/products/:id       – update product
 *   GET    /tenant/api/v1/catalog/products/:id       – get product by id
 *   DELETE /tenant/api/v1/catalog/products/:id       – delete product
 *   GET    /tenant/api/v1/catalog/products/list3     – list products
 *   GET    /tenant/api/v1/catalog/products/generate-sku – auto-generate SKU
 *   POST   /tenant/api/v1/catalog/products/upc-image – fetch image by UPC
 *   POST   /tenant/api/v1/catalog/products/upc-exists – check UPC existence
 *   GET    /tenant/api/v1/catalog/categories         – list categories
 *   GET    /tenant/api/v1/catalog/brands/list        – list brands
 *   GET    /tenant/api/v1/inventory/suppliers/list    – list suppliers
 *   GET    /tenant/api/v1/catalog/manufacturers/list  – list manufacturers
 *   GET    /tenant/api/v1/catalog/tags/list           – list tags
 */

import { AxiosError } from 'axios';
import khubApi from './khub';

// ---------------------------------------------------------------------------
// URL constants (mirrors kapp/client/tenant/src/constants/config/index.js)
// ---------------------------------------------------------------------------
const PRODUCT_URL = '/tenant/api/v1/catalog/products';
const CATEGORY_URL = '/tenant/api/v1/catalog/categories';
const BRAND_URL = '/tenant/api/v1/catalog/brands';
const SUPPLIER_URL = '/tenant/api/v1/inventory/suppliers';
const MANUFACTURER_URL = '/tenant/api/v1/catalog/manufacturers';
const TAG_URL = '/tenant/api/v1/catalog/tags';
const PROMOTIONS_URL = '/tenant/api/v1/marketing/promotions';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Unit price tier (Tier 1 – Tier 5) */
export interface UnitPriceTier {
  tier_id: number;
  price: number | null;
}

/** A single unit-price entry inside channel_info */
export interface UnitPricePayload {
  unit: number;           // 1=Piece, 2=Pack, 3=Case, 4=Pallet
  unit_name?: string;
  definition: number | null;
  upc: string;
  base_cost: number | null;
  cost: number | null;
  price: number | null;
  margin: number | null;
  margin_type: number;
  lowest_selling_price?: number | null;
  ecom_price?: number | null;
  msrp_price?: number | null;
  unit_price_tiers: UnitPriceTier[];
}

/** Channel info block submitted with the product */
export interface ChannelInfoPayload {
  channel_id: number;
  channel_name?: string;
  in_hand: number;
  on_hold: number;
  damaged: number;
  min_qty: number;
  max_qty: number;
  sold_by_unit: number;
  bought_by_unit: number;
  ps_allowed_qty?: number | null;
  back_order?: number | null;
  coming_soon?: number | null;
  autoCalculate?: boolean;
  unit_prices: UnitPricePayload[];
}

/** SEO metadata */
export interface ProductSeoMeta {
  title: string;
  description: string;
}

/**
 * Full payload for creating / updating a product.
 * Mirrors kapp's initialValues + parseToIntData output.
 */
export interface ProductPayload {
  id?: number;
  name: string;
  ecom_name?: string | null;
  sku?: string;
  slug?: string;
  auto_generate_sku: boolean;
  auto_fetch_img?: boolean;
  is_tax_applicable: boolean;
  is_msa_compliant: boolean;
  is_online: boolean;
  is_featured: boolean;
  is_hot_seller: boolean;
  is_new_arrival: boolean;
  back_order_portal: boolean;
  back_order_ecom: boolean;
  weight?: number;
  weight_unit: number;       // 1=kg, 2=lb
  description?: string;
  upc?: string;
  upc_2?: string;
  upc_3?: string;
  bin?: string;
  mlc?: string;
  zone?: string;
  aisle?: string;
  brand_id?: number | null;
  main_category_id?: number | null;
  category_ids: number[];
  supplier_ids: number[];
  manufacturer_ids?: number[];
  tag_values: string[];
  status: number;            // 1=Active, 2=Inactive
  unit_of_measurement: number; // 1=Count, 2=Weight
  channel_info: ChannelInfoPayload[];
  images?: string[];
  images_seo?: Array<{ url: string; alt_text: string }>;
  video?: string;
  video_type?: number;
  video_link?: string;
  product_seo_meta_data?: ProductSeoMeta;
  msa_attributes?: Record<string, unknown>;
}

/** Standard entity response from the backend */
export interface ProductEntityResponse {
  message: string;
  entity: Record<string, unknown>;
}

/** List response from the backend */
export interface ProductListResponse {
  totalCount: number;
  entities: Record<string, unknown>[];
}

/** Simple brand / category / supplier / manufacturer / tag list item */
export interface ListItem {
  id: number;
  name: string;
  [key: string]: unknown;
}

// ---------------------------------------------------------------------------
// Helper – strip fields that the backend doesn't accept
// (mirrors kapp's deleteExtraEntries)
// ---------------------------------------------------------------------------
function deleteExtraEntries(values: Record<string, unknown>): Record<string, unknown> {
  const keysToDelete = [
    'brand',
    'userEnteredSku',
    'catSuggestedSku',
    'suppliers',
    'categories',
    'price',
    'tags',
    'saleable_qty',
    'video_url',
    'created_at',
    'updated_at',
    'deleted_at',
  ];
  for (const key of keysToDelete) {
    delete values[key];
  }
  return values;
}

// ---------------------------------------------------------------------------
// Helper – parse API errors
// ---------------------------------------------------------------------------
export function parseProductApiError(error: AxiosError): string[] {
  const data = error.response?.data as { message?: string; errors?: string[] } | undefined;
  if (data?.errors?.length) return data.errors;
  if (data?.message) return [data.message];
  if (error.message) return [error.message];
  return ['An unexpected error occurred'];
}

// ---------------------------------------------------------------------------
// CRUD functions
// ---------------------------------------------------------------------------

/**
 * Create a new product.
 * Mirrors kapp: `POST /catalog/products`
 */
export async function createProduct(product: ProductPayload) {
  const payload = deleteExtraEntries({ ...product } as unknown as Record<string, unknown>);
  return khubApi.post<ProductEntityResponse>(PRODUCT_URL, payload);
}

/**
 * Update an existing product.
 * Mirrors kapp: `PUT /catalog/products/:id`
 */
export async function updateProduct(product: ProductPayload) {
  const payload = deleteExtraEntries({ ...product } as unknown as Record<string, unknown>);
  const id = payload.id;
  delete payload.id;
  return khubApi.put<ProductEntityResponse>(`${PRODUCT_URL}/${id}`, payload);
}

/**
 * Fetch a single product by ID.
 * Mirrors kapp: `GET /catalog/products/:id`
 */
export async function getProductById(productId: number | string) {
  return khubApi.get<ProductEntityResponse>(`${PRODUCT_URL}/${productId}`);
}

/**
 * Delete a product.
 * Mirrors kapp: `DELETE /catalog/products/:id`
 */
export async function deleteProduct(productId: number | string) {
  return khubApi.delete(`${PRODUCT_URL}/${productId}`);
}

/**
 * Generate a unique SKU.
 * Mirrors kapp: `GET /catalog/products/generate-sku`
 */
export async function generateSku(params?: Record<string, string>) {
  return khubApi.get<{ sku: string; message: string }>(
    `${PRODUCT_URL}/generate-sku`,
    { params },
  );
}

/**
 * Check if a UPC already exists.
 * Mirrors kapp: `POST /catalog/products/upc-exists`
 */
export async function checkUpcExists(upc: string) {
  return khubApi.post<{ exists: boolean }>(`${PRODUCT_URL}/upc-exists`, { product_upc: upc });
}

/**
 * Fetch product image by UPC.
 * Mirrors kapp: `POST /catalog/products/upc-image`
 */
export async function getImageByUpc(upc: Record<string, unknown>) {
  return khubApi.post<{ image_url: string; message: string }>(`${PRODUCT_URL}/upc-image`, upc);
}

// ---------------------------------------------------------------------------
// Related entity lists – used in the Add Product form
// ---------------------------------------------------------------------------

/** Fetch categories tree */
export async function fetchCategories() {
  return khubApi.get<{ entities: ListItem[] }>(`${CATEGORY_URL}/list`);
}

/**
 * Create a new category.
 * Mirrors kapp: `POST /catalog/categories`
 */
export async function createCategory(payload: {
  name: string;
  parent_id?: number | null;
  code?: string | null;
  is_msa_compliant: boolean;
  visible_on_ecom: boolean;
}) {
  return khubApi.post<{ entity: ListItem; message: string }>(CATEGORY_URL, payload);
}

/** Fetch brands list */
export async function fetchBrands(params?: Record<string, unknown>) {
  return khubApi.get<{ entities: ListItem[] }>(`${BRAND_URL}/list`, { params });
}

/** Fetch suppliers list */
export async function fetchSuppliers(params?: Record<string, unknown>) {
  return khubApi.get<{ entities: ListItem[] }>(`${SUPPLIER_URL}/list`, { params });
}

/** Fetch manufacturers list */
export async function fetchManufacturers(params?: Record<string, unknown>) {
  return khubApi.get<{ entities: ListItem[] }>(`${MANUFACTURER_URL}/list`, { params });
}

/** Fetch tags list */
export async function fetchTags(params?: Record<string, unknown>) {
  return khubApi.get<{ entities: ListItem[] }>(`${TAG_URL}/list`, { params });
}

/** Fetch all channels (warehouses / storefronts) */
export async function fetchChannels(params?: Record<string, unknown>) {
  // kapp uses: CHANNEL_URL = `/inventory/channel`  →  getAllChannels: `${CHANNEL_URL}/list`
  return khubApi.get<{ entities: ListItem[] }>(
    '/tenant/api/v1/inventory/channel/list',
    { params },
  );
}

/**
 * Generate product description via AI.
 * Mirrors kapp: `POST /catalog/products/product-description`
 */
export async function generateProductDescription(params: {
  product_name: string;
  brand_name?: string;
  main_category_id?: number | null;
}) {
  return khubApi.post<{ description: string }>(
    `${PRODUCT_URL}/product-description`,
    params,
  );
}

// ---------------------------------------------------------------------------
// Promotions – mirrors kapp productsCrud.findPromotions
// ---------------------------------------------------------------------------

/** Query params for fetching promotions by product */
export interface PromotionQueryParams {
  searchKey?: string;
  statuses?: string;       // comma-separated status values e.g. "1,2"
  productIds?: string;     // comma-separated product ids
  pageNumber?: number;
  pageSize?: number;
  sort_by?: string;
}

/** Unit price info nested inside promotion detail */
export interface PromotionUnitPrice {
  id: number;
  unit: number;
  unit_name?: string;
  price?: number;
  definition?: number;
}

/** A single promotion detail (per product/unit) */
export interface PromotionDetail {
  id: number;
  unit_price?: PromotionUnitPrice;
  min_qty?: number;
  value: number;
  value_type: number;         // 1=% Disc., 2=Price Disc., 3=Fixed Price
  total_ecom_sold: number;
  total_tenant_sold: number;
  total_app_sold: number;
  total_sold: number;
  is_enabled: boolean;
  channel?: { id: number; name: string };
}

/** A promotion entity from the list endpoint */
export interface PromotionEntity {
  id: number;
  name: string;
  start_datetime: string;
  end_datetime: string | null;
  has_sale_badge: boolean;
  has_counter: boolean;
  applicable_to: number;
  applicable_for: number;     // 1=Ecom, 2=Portal, 3=Both
  promotion_status: number;   // 1=Active, 2=Upcoming, 3=Expired
  channel_ids: number[];
  customer_group_ids: number[];
  promotion_details: PromotionDetail[];
}

/** Flattened promotion row for display in the table */
export interface PromotionRow {
  promotion_detail_id: number;
  promotion_id: number;
  name: string;
  start_datetime: string;
  end_datetime: string | null;
  applicable_for: number;
  promotion_status: number;
  value: number;
  value_type: number;
  unit_price?: PromotionUnitPrice;
  total_sold: number;
  total_tenant_sold: number;
  total_ecom_sold: number;
  total_app_sold: number;
}

/**
 * Fetch promotions for a product.
 * Mirrors kapp: `GET /marketing/promotions/list?product_ids=...`
 */
export async function fetchPromotionsByProductId(
  queryParams: PromotionQueryParams,
  productId: number | string,
) {
  const params = {
    search_key: queryParams.searchKey || '',
    statuses: queryParams.statuses || '',
    page: queryParams.pageNumber || 1,
    product_ids: String(productId),
    page_size: queryParams.pageSize || 20,
    sort_by: queryParams.sort_by || 'created_at:desc',
  };
  const qs = Object.entries(params)
    .map(([k, v]) => `${k}=${encodeURIComponent(v)}`)
    .join('&');
  return khubApi.get<{ entities: PromotionEntity[]; totalCount: number }>(
    `${PROMOTIONS_URL}/list?${qs}`,
  );
}

/**
 * Seed ~10 promotions by writing directly to PowerSync local DB.
 * Data will be synced to the server automatically by PowerSync.
 *
 * Reads local `products` and `unit_prices` tables for references,
 * then inserts into `promotions` and `promotion_details`.
 */
export async function seedPromotions(
  db: { execute: (sql: string, params?: any[]) => Promise<any>; getAll: <T>(sql: string) => Promise<T[]> },
): Promise<number> {
  // 1. Read local products + unit_prices to get references
  const unitPrices = await db.getAll<{ id: string; product_id: number; channel_id: number; unit: number }>(
    `SELECT id, product_id, channel_id, unit FROM unit_prices LIMIT 30`,
  );

  if (unitPrices.length === 0) {
    throw new Error('No unit_prices in local DB. Please sync products first.');
  }

  const now = new Date();
  const fmtDt = (d: Date) => d.toISOString().replace('T', ' ').split('.')[0];
  const nowStr = fmtDt(now);

  // 2. Promotion configs
  const promoConfigs = [
    { name: 'Summer Sale 2026 - 10% Off',     start: -5,  end: 40,   af: 3, vt: 1, v: 10,    upIdx: [0, 1] },
    { name: 'Flash Deal - $2 Off',             start: 0,   end: 3,    af: 3, vt: 2, v: 2,     upIdx: [0] },
    { name: 'Weekend Special - Fixed $4.99',   start: -2,  end: 5,    af: 2, vt: 3, v: 4.99,  upIdx: [1] },
    { name: 'Ecom Exclusive - 15% Off',        start: -10, end: 20,   af: 1, vt: 1, v: 15,    upIdx: [2] },
    { name: 'Clearance - 30% Off',             start: -30, end: -1,   af: 3, vt: 1, v: 30,    upIdx: [0, 2] },
    { name: 'New Year Promo - $1 Disc.',       start: -37, end: -7,   af: 2, vt: 2, v: 1,     upIdx: [3] },
    { name: 'VIP Member Deal - Fixed $9.99',   start: 0,   end: null, af: 3, vt: 3, v: 9.99,  upIdx: [0, 3] },
    { name: 'Back to School - 20% Off',        start: 30,  end: 75,   af: 3, vt: 1, v: 20,    upIdx: [1, 4] },
    { name: 'POS Only - $3 Off',               start: 1,   end: 14,   af: 2, vt: 2, v: 3,     upIdx: [5] },
    { name: 'Holiday Bundle - Fixed $12.50',   start: 60,  end: 90,   af: 3, vt: 3, v: 12.50, upIdx: [0, 1, 6] },
  ];

  const addDays = (d: Date, n: number) => {
    const r = new Date(d);
    r.setDate(r.getDate() + n);
    return r;
  };

  let created = 0;
  let detailIdCounter = Date.now(); // simple unique id seed

  for (const cfg of promoConfigs) {
    // Resolve upIdx to valid local unit_prices (modulo)
    const refs = cfg.upIdx
      .map((i) => unitPrices[i % unitPrices.length])
      .filter(Boolean);

    // Deduplicate
    const seen = new Set<string>();
    const uniqueRefs = refs.filter((r) => {
      if (seen.has(r.id)) return false;
      seen.add(r.id);
      return true;
    });

    if (uniqueRefs.length === 0) continue;

    const startDt = fmtDt(addDays(now, cfg.start));
    const endDt = cfg.end !== null ? fmtDt(addDays(now, cfg.end)) : null;

    // Generate a unique id for the promotion
    const promoId = `seed-promo-${created + 1}-${Date.now()}`;

    // Insert promotion
    await db.execute(
      `INSERT INTO promotions (id, name, start_datetime, end_datetime, status, applicable_for, applicable_to, has_sale_badge, has_counter, customer_group_ids, channel_ids, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [promoId, cfg.name, startDt, endDt, 1, cfg.af, 1, 1, 0, '[]', '[1]', nowStr, nowStr],
    );

    // Insert promotion_details
    for (const ref of uniqueRefs) {
      detailIdCounter++;
      const detailId = `seed-pd-${detailIdCounter}`;
      await db.execute(
        `INSERT INTO promotion_details (id, promotion_id, product_id, unit_price_id, channel_id, min_qty, value_type, value, is_enabled, total_ecom_sold, total_tenant_sold, total_app_sold, unit, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [detailId, promoId, ref.product_id, ref.id, ref.channel_id || 1, 0, cfg.vt, cfg.v, 1, 0, 0, 0, ref.unit || 1, nowStr, nowStr],
      );
    }

    created++;
  }

  return created;
}

/**
 * Clear all local promotions & promotion_details from PowerSync,
 * AND purge the corresponding pending CRUD queue entries so they
 * stop retrying uploads to the backend.
 *
 * Returns a human-readable summary string.
 */
export async function clearPromotions(
  db: { execute: (sql: string, params?: any[]) => Promise<any>; getAll: <T>(sql: string) => Promise<T[]> },
): Promise<string> {
  // 1. Count existing records for the summary
  const promos = await db.getAll<{ cnt: number }>('SELECT COUNT(*) as cnt FROM promotions');
  const details = await db.getAll<{ cnt: number }>('SELECT COUNT(*) as cnt FROM promotion_details');
  const promoCount = (promos[0] as any)?.cnt || 0;
  const detailCount = (details[0] as any)?.cnt || 0;

  // 2. Clear pending CRUD queue entries for these tables BEFORE deleting,
  //    so the old PUT/PATCH operations stop retrying.
  try {
    await db.execute(
      `DELETE FROM ps_crud WHERE data LIKE '%"type":"promotions"%' OR data LIKE '%"type":"promotion_details"%'`,
    );
  } catch (e) {
    console.warn('[clearPromotions] Could not clear ps_crud (1st pass):', e);
  }

  // 3. Delete all local data
  await db.execute('DELETE FROM promotion_details');
  await db.execute('DELETE FROM promotions');

  // 4. Clear the CRUD entries generated by the DELETEs above,
  //    so we don't send DELETE requests for records the backend never had.
  try {
    await db.execute(
      `DELETE FROM ps_crud WHERE data LIKE '%"type":"promotions"%' OR data LIKE '%"type":"promotion_details"%'`,
    );
  } catch (e) {
    console.warn('[clearPromotions] Could not clear ps_crud (2nd pass):', e);
  }

  console.log(`[clearPromotions] Cleared ${promoCount} promotions, ${detailCount} details`);
  return `Cleanup complete: ${promoCount} promotions, ${detailCount} promotion_details`;
}

/**
 * Flatten promotion entities into rows (one row per promotion_detail).
 * Mirrors kapp productsSlice.promotionsFetched reducer.
 */
export function flattenPromotionEntities(entities: PromotionEntity[]): PromotionRow[] {
  const rows: PromotionRow[] = [];
  for (const entity of entities) {
    for (const detail of entity.promotion_details) {
      rows.push({
        promotion_detail_id: detail.id,
        promotion_id: entity.id,
        name: entity.name,
        start_datetime: entity.start_datetime,
        end_datetime: entity.end_datetime,
        applicable_for: entity.applicable_for,
        promotion_status: entity.promotion_status,
        value: detail.value,
        value_type: detail.value_type,
        unit_price: detail.unit_price,
        total_sold: detail.total_sold,
        total_tenant_sold: detail.total_tenant_sold,
        total_ecom_sold: detail.total_ecom_sold,
        total_app_sold: detail.total_app_sold,
      });
    }
  }
  return rows;
}
