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
  return khubApi.get<{ entities: ListItem[] }>(
    '/tenant/api/v1/inventory/sale-stock-channels/list',
    { params },
  );
}
