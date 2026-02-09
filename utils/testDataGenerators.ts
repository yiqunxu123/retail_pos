/**
 * Test Data Generators
 *
 * Provides test data generators for 20 PowerSync-synced tables.
 * Each table has column definitions, type info, and smart default value generators.
 *
 * - Numeric fields: random within reasonable ranges
 * - String fields: appended with _index suffix
 * - Foreign keys: auto-linked in quick actions
 */

// ============================================================================
// Helpers
// ============================================================================

/** Generate random integer in range [min, max] */
export function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

/** Generate random float in range, rounded to 2 decimals */
export function randFloat(min: number, max: number): number {
  return Math.round((Math.random() * (max - min) + min) * 100) / 100
}

/** Generate random UUID (v4-like) */
export function uuid(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

/** Generate random 12-digit UPC code */
function randUpc(): string {
  let upc = ''
  for (let i = 0; i < 12; i++) upc += randInt(0, 9).toString()
  return upc
}

/** Get random date string within last N days */
function randRecentDate(days = 90): string {
  const now = Date.now()
  const offset = randInt(0, days * 24 * 60 * 60 * 1000)
  return new Date(now - offset).toISOString()
}

/** Current time as ISO string */
function nowISO(): string {
  return new Date().toISOString()
}

// ============================================================================
// Column Type
// ============================================================================

export type ColumnType = 'text' | 'integer' | 'real'

export interface ColumnDef {
  name: string
  type: ColumnType
  /** Column display label */
  label: string
  /** Default value generator function, index is the batch sequence number */
  defaultValue: (index: number) => string | number | null
}

export interface TableConfig {
  /** Table name */
  name: string
  /** Display label */
  label: string
  /** Column definitions (excluding id, id is auto-generated as uuid) */
  columns: ColumnDef[]
}

// ============================================================================
// Table Configs - all 20 PowerSync tables
// ============================================================================

export const TABLE_CONFIGS: TableConfig[] = [
  // ---- Categories ----
  {
    name: 'categories',
    label: 'Categories',
    columns: [
      { name: 'name', type: 'text', label: 'Name', defaultValue: (i) => `Category_${i}` },
      { name: 'code', type: 'text', label: 'Code', defaultValue: (i) => `CAT${String(i).padStart(3, '0')}` },
      { name: 'slug', type: 'text', label: 'Slug', defaultValue: (i) => `category-${i}` },
      { name: 'is_featured', type: 'integer', label: 'Featured', defaultValue: () => randInt(0, 1) },
      { name: 'image', type: 'text', label: 'Image', defaultValue: () => '' },
      { name: 'parent_id', type: 'integer', label: 'Parent Cat. ID', defaultValue: () => null },
      { name: 'created_at', type: 'text', label: 'Created At', defaultValue: () => nowISO() },
      { name: 'updated_at', type: 'text', label: 'Updated At', defaultValue: () => nowISO() },
    ],
  },

  // ---- Brands ----
  {
    name: 'brands',
    label: 'Brands',
    columns: [
      { name: 'name', type: 'text', label: 'Name', defaultValue: (i) => `Brand_${i}` },
      { name: 'slug', type: 'text', label: 'Slug', defaultValue: (i) => `brand-${i}` },
      { name: 'image', type: 'text', label: 'Image', defaultValue: () => '' },
      { name: 'is_featured', type: 'integer', label: 'Featured', defaultValue: () => randInt(0, 1) },
      { name: 'created_at', type: 'text', label: 'Created At', defaultValue: () => nowISO() },
      { name: 'updated_at', type: 'text', label: 'Updated At', defaultValue: () => nowISO() },
    ],
  },

  // ---- Channels ----
  {
    name: 'channels',
    label: 'Channels',
    columns: [
      { name: 'name', type: 'text', label: 'Name', defaultValue: (i) => `Channel_${i}` },
      { name: 'description', type: 'text', label: 'Description', defaultValue: (i) => `Test channel ${i}` },
      { name: 'is_primary', type: 'integer', label: 'Primary', defaultValue: (i) => (i === 1 ? 1 : 0) },
      { name: 'type', type: 'integer', label: 'Type', defaultValue: () => 1 },
      { name: 'created_at', type: 'text', label: 'Created At', defaultValue: () => nowISO() },
      { name: 'updated_at', type: 'text', label: 'Updated At', defaultValue: () => nowISO() },
    ],
  },

  // ---- Products ----
  {
    name: 'products',
    label: 'Products',
    columns: [
      { name: 'brand_id', type: 'integer', label: 'Brand ID', defaultValue: () => null },
      { name: 'name', type: 'text', label: 'Name', defaultValue: (i) => `Product_${i}` },
      { name: 'weight', type: 'real', label: 'Weight', defaultValue: () => randFloat(0.1, 50) },
      { name: 'weight_unit', type: 'integer', label: 'Weight Unit', defaultValue: () => 1 },
      { name: 'sku', type: 'text', label: 'SKU', defaultValue: (i) => `SKU-${String(i).padStart(5, '0')}` },
      { name: 'upc', type: 'text', label: 'UPC', defaultValue: () => randUpc() },
      { name: 'upc_2', type: 'text', label: 'UPC 2', defaultValue: () => '' },
      { name: 'upc_3', type: 'text', label: 'UPC 3', defaultValue: () => '' },
      { name: 'mlc', type: 'text', label: 'MLC', defaultValue: () => '' },
      { name: 'bin', type: 'text', label: 'Bin', defaultValue: (i) => `BIN-${String(i).padStart(3, '0')}` },
      { name: 'description', type: 'text', label: 'Description', defaultValue: (i) => `Test product description ${i}` },
      { name: 'is_online', type: 'integer', label: 'Online', defaultValue: () => 1 },
      { name: 'status', type: 'integer', label: 'Status (1=active)', defaultValue: () => 1 },
      { name: 'unit_of_measurement', type: 'integer', label: 'Unit of Measure', defaultValue: () => 1 },
      { name: 'slug', type: 'text', label: 'Slug', defaultValue: (i) => `product-${i}` },
      { name: 'sold_count', type: 'integer', label: 'Sold Count', defaultValue: () => randInt(0, 500) },
      { name: 'is_featured', type: 'integer', label: 'Featured', defaultValue: () => randInt(0, 1) },
      { name: 'main_category_id', type: 'integer', label: 'Main Cat. ID', defaultValue: () => null },
      { name: 'images', type: 'text', label: 'Images (JSON)', defaultValue: () => '[]' },
      { name: 'created_at', type: 'text', label: 'Created At', defaultValue: () => nowISO() },
      { name: 'updated_at', type: 'text', label: 'Updated At', defaultValue: () => nowISO() },
    ],
  },

  // ---- Unit Prices ----
  {
    name: 'unit_prices',
    label: 'Unit Prices',
    columns: [
      { name: 'product_id', type: 'integer', label: 'Product ID', defaultValue: () => null },
      { name: 'channel_id', type: 'integer', label: 'Channel ID', defaultValue: () => 1 },
      { name: 'cost', type: 'real', label: 'Cost', defaultValue: () => randFloat(1, 500) },
      { name: 'price', type: 'real', label: 'Price', defaultValue: () => randFloat(5, 999) },
      { name: 'base_cost', type: 'real', label: 'Base Cost', defaultValue: () => randFloat(1, 400) },
      { name: 'ecom_price', type: 'real', label: 'E-com Price', defaultValue: () => randFloat(5, 999) },
      { name: 'upc', type: 'text', label: 'UPC', defaultValue: () => '' },
      { name: 'unit', type: 'integer', label: 'Unit', defaultValue: () => 1 },
      { name: 'created_at', type: 'text', label: 'Created At', defaultValue: () => nowISO() },
      { name: 'updated_at', type: 'text', label: 'Updated At', defaultValue: () => nowISO() },
    ],
  },

  // ---- Stocks ----
  {
    name: 'stocks',
    label: 'Stocks',
    columns: [
      { name: 'channel_id', type: 'integer', label: 'Channel ID', defaultValue: () => 1 },
      { name: 'product_id', type: 'integer', label: 'Product ID', defaultValue: () => null },
      { name: 'qty', type: 'integer', label: 'Qty', defaultValue: () => randInt(0, 1000) },
      { name: 'status', type: 'integer', label: 'Status', defaultValue: () => 1 },
      { name: 'created_at', type: 'text', label: 'Created At', defaultValue: () => nowISO() },
      { name: 'updated_at', type: 'text', label: 'Updated At', defaultValue: () => nowISO() },
    ],
  },

  // ---- Customers ----
  {
    name: 'customers',
    label: 'Customers',
    columns: [
      { name: 'no', type: 'text', label: 'No.', defaultValue: (i) => `CUST-${String(i).padStart(4, '0')}` },
      { name: 'name', type: 'text', label: 'Name', defaultValue: (i) => `Customer_${i}` },
      { name: 'email', type: 'text', label: 'Email', defaultValue: (i) => `customer${i}@test.com` },
      { name: 'balance', type: 'real', label: 'Balance', defaultValue: () => randFloat(0, 10000) },
      { name: 'balance_limit', type: 'real', label: 'Balance Limit', defaultValue: () => randFloat(5000, 50000) },
      { name: 'phone_no', type: 'text', label: 'Phone', defaultValue: (i) => `555-${String(1000 + i).slice(-4)}` },
      { name: 'business_name', type: 'text', label: 'Business Name', defaultValue: (i) => `Business_${i} LLC` },
      { name: 'business_city', type: 'text', label: 'City', defaultValue: () => 'New York' },
      { name: 'business_state', type: 'text', label: 'State', defaultValue: () => 'NY' },
      { name: 'business_country', type: 'text', label: 'Country', defaultValue: () => 'US' },
      { name: 'business_zip_code', type: 'text', label: 'Zip Code', defaultValue: () => String(randInt(10000, 99999)) },
      { name: 'business_phone_no', type: 'text', label: 'Business Phone', defaultValue: (i) => `555-${String(2000 + i).slice(-4)}` },
      { name: 'address', type: 'text', label: 'Address', defaultValue: (i) => `${randInt(1, 999)} Test Street #${i}` },
      { name: 'status', type: 'integer', label: 'Status (1=active)', defaultValue: () => 1 },
      { name: 'allow_ecom', type: 'text', label: 'Allow E-com (Y/N)', defaultValue: () => 'Y' },
      { name: 'created_at', type: 'text', label: 'Created At', defaultValue: () => nowISO() },
      { name: 'updated_at', type: 'text', label: 'Updated At', defaultValue: () => nowISO() },
    ],
  },

  // ---- Customer Groups ----
  {
    name: 'customer_groups',
    label: 'Customer Groups',
    columns: [
      { name: 'name', type: 'text', label: 'Name', defaultValue: (i) => `Group_${i}` },
      { name: 'is_active', type: 'integer', label: 'Active', defaultValue: () => 1 },
      { name: 'tier_id', type: 'integer', label: 'Tier ID', defaultValue: () => null },
      { name: 'created_at', type: 'text', label: 'Created At', defaultValue: () => nowISO() },
      { name: 'updated_at', type: 'text', label: 'Updated At', defaultValue: () => nowISO() },
    ],
  },

  // ---- Group-Customer Links ----
  {
    name: 'customer_groups_customer',
    label: 'Group-Customer Links',
    columns: [
      { name: 'customer_group_id', type: 'integer', label: 'Group ID', defaultValue: () => null },
      { name: 'customer_id', type: 'integer', label: 'Customer ID', defaultValue: () => null },
    ],
  },

  // ---- Suppliers ----
  {
    name: 'suppliers',
    label: 'Suppliers',
    columns: [
      { name: 'name', type: 'text', label: 'Name', defaultValue: (i) => `Supplier_${i}` },
      { name: 'email', type: 'text', label: 'Email', defaultValue: (i) => `supplier${i}@test.com` },
      { name: 'phone_no', type: 'text', label: 'Phone', defaultValue: (i) => `555-${String(3000 + i).slice(-4)}` },
      { name: 'balance', type: 'real', label: 'Balance', defaultValue: () => randFloat(0, 50000) },
      { name: 'status', type: 'integer', label: 'Status', defaultValue: () => 1 },
      { name: 'created_at', type: 'text', label: 'Created At', defaultValue: () => nowISO() },
      { name: 'updated_at', type: 'text', label: 'Updated At', defaultValue: () => nowISO() },
    ],
  },

  // ---- Taxes ----
  {
    name: 'taxes',
    label: 'Taxes',
    columns: [
      { name: 'name', type: 'text', label: 'Name', defaultValue: (i) => `Tax_${i}` },
      { name: 'rate', type: 'real', label: 'Tax Rate', defaultValue: () => randFloat(0.01, 0.15) },
      { name: 'type', type: 'text', label: 'Type', defaultValue: () => 'percentage' },
      { name: 'enabled', type: 'integer', label: 'Enabled', defaultValue: () => 1 },
      { name: 'created_at', type: 'text', label: 'Created At', defaultValue: () => nowISO() },
      { name: 'updated_at', type: 'text', label: 'Updated At', defaultValue: () => nowISO() },
    ],
  },

  // ---- Sale Orders ----
  {
    name: 'sale_orders',
    label: 'Sale Orders',
    columns: [
      { name: 'customer_id', type: 'integer', label: 'Customer ID', defaultValue: () => null },
      { name: 'channel_id', type: 'integer', label: 'Channel ID', defaultValue: () => 1 },
      { name: 'no', type: 'text', label: 'Order No.', defaultValue: (i) => `SO-${String(i).padStart(5, '0')}` },
      { name: 'order_type', type: 'integer', label: 'Order Type', defaultValue: () => 1 },
      { name: 'sale_type', type: 'integer', label: 'Sale Type', defaultValue: () => 1 },
      { name: 'status', type: 'integer', label: 'Status (1-5)', defaultValue: () => randInt(1, 5) },
      { name: 'total_price', type: 'real', label: 'Total Price', defaultValue: () => randFloat(10, 5000) },
      { name: 'tax', type: 'real', label: 'Tax', defaultValue: () => randFloat(0, 500) },
      { name: 'discount', type: 'real', label: 'Discount', defaultValue: () => randFloat(0, 100) },
      { name: 'total_discount', type: 'real', label: 'Total Discount', defaultValue: () => randFloat(0, 200) },
      { name: 'delivery_charges', type: 'real', label: 'Delivery Charges', defaultValue: () => randFloat(0, 50) },
      { name: 'shipping_type', type: 'integer', label: 'Shipping Type', defaultValue: () => 1 },
      { name: 'fulfilment_status', type: 'integer', label: 'Fulfilment Status', defaultValue: () => randInt(0, 3) },
      { name: 'order_date', type: 'text', label: 'Order Date', defaultValue: () => randRecentDate(90) },
      { name: 'created_by_id', type: 'integer', label: 'Created By ID', defaultValue: () => null },
      { name: 'balance_adjustment_id', type: 'integer', label: 'Balance Adj. ID', defaultValue: () => null },
      { name: 'created_at', type: 'text', label: 'Created At', defaultValue: () => nowISO() },
      { name: 'updated_at', type: 'text', label: 'Updated At', defaultValue: () => nowISO() },
    ],
  },

  // ---- Sale Order Details ----
  {
    name: 'sale_order_details',
    label: 'Sale Order Details',
    columns: [
      { name: 'sale_order_id', type: 'integer', label: 'Order ID', defaultValue: () => null },
      { name: 'product_id', type: 'integer', label: 'Product ID', defaultValue: () => null },
      { name: 'channel_id', type: 'integer', label: 'Channel ID', defaultValue: () => 1 },
      { name: 'unit_price_id', type: 'integer', label: 'Unit Price ID', defaultValue: () => null },
      { name: 'qty', type: 'real', label: 'Qty', defaultValue: () => randInt(1, 100) },
      { name: 'price', type: 'real', label: 'Unit Price', defaultValue: () => randFloat(1, 999) },
      { name: 'discount', type: 'real', label: 'Discount', defaultValue: () => randFloat(0, 50) },
      { name: 'total_price', type: 'real', label: 'Subtotal', defaultValue: () => randFloat(10, 5000) },
      { name: 'created_at', type: 'text', label: 'Created At', defaultValue: () => nowISO() },
      { name: 'updated_at', type: 'text', label: 'Updated At', defaultValue: () => nowISO() },
    ],
  },

  // ---- Payments ----
  {
    name: 'payments',
    label: 'Payments',
    columns: [
      { name: 'customer_id', type: 'integer', label: 'Customer ID', defaultValue: () => null },
      { name: 'invoice_id', type: 'integer', label: 'Invoice ID', defaultValue: () => null },
      { name: 'no', type: 'text', label: 'Payment No.', defaultValue: (i) => `PAY-${String(i).padStart(5, '0')}` },
      { name: 'status', type: 'integer', label: 'Status', defaultValue: () => randInt(1, 3) },
      { name: 'payment_type', type: 'integer', label: 'Payment Type (1-4)', defaultValue: () => randInt(1, 4) },
      { name: 'payment_date', type: 'text', label: 'Payment Date', defaultValue: () => randRecentDate(60) },
      { name: 'amount', type: 'real', label: 'Amount', defaultValue: () => randFloat(10, 5000) },
      { name: 'category', type: 'integer', label: 'Category', defaultValue: () => 1 },
      { name: 'memo', type: 'text', label: 'Memo', defaultValue: (i) => `Payment memo ${i}` },
      { name: 'created_at', type: 'text', label: 'Created At', defaultValue: () => nowISO() },
      { name: 'updated_at', type: 'text', label: 'Updated At', defaultValue: () => nowISO() },
    ],
  },

  // ---- Invoices ----
  {
    name: 'invoices',
    label: 'Invoices',
    columns: [
      { name: 'sale_order_id', type: 'integer', label: 'Order ID', defaultValue: () => null },
      { name: 'customer_id', type: 'integer', label: 'Customer ID', defaultValue: () => null },
      { name: 'no', type: 'text', label: 'Invoice No.', defaultValue: (i) => `INV-${String(i).padStart(5, '0')}` },
      { name: 'status', type: 'integer', label: 'Status', defaultValue: () => randInt(1, 3) },
      { name: 'remaining_amount', type: 'real', label: 'Remaining Amount', defaultValue: () => randFloat(0, 2000) },
      { name: 'total_amount', type: 'real', label: 'Total Amount', defaultValue: () => randFloat(100, 5000) },
      { name: 'created_at', type: 'text', label: 'Created At', defaultValue: () => nowISO() },
      { name: 'updated_at', type: 'text', label: 'Updated At', defaultValue: () => nowISO() },
    ],
  },

  // ---- Purchase Invoices ----
  {
    name: 'purchase_invoices',
    label: 'Purchase Invoices',
    columns: [
      { name: 'purchase_order_id', type: 'integer', label: 'Purchase Order ID', defaultValue: () => null },
      { name: 'supplier_id', type: 'integer', label: 'Supplier ID', defaultValue: () => null },
      { name: 'no', type: 'text', label: 'Invoice No.', defaultValue: (i) => `PI-${String(i).padStart(5, '0')}` },
      { name: 'status', type: 'integer', label: 'Status', defaultValue: () => randInt(1, 3) },
      { name: 'invoice_balance', type: 'real', label: 'Invoice Balance', defaultValue: () => randFloat(0, 10000) },
      { name: 'total_amount', type: 'real', label: 'Total Amount', defaultValue: () => randFloat(500, 50000) },
      { name: 'created_at', type: 'text', label: 'Created At', defaultValue: () => nowISO() },
      { name: 'updated_at', type: 'text', label: 'Updated At', defaultValue: () => nowISO() },
    ],
  },

  // ---- Purchase Orders ----
  {
    name: 'purchase_orders',
    label: 'Purchase Orders',
    columns: [
      { name: 'supplier_id', type: 'integer', label: 'Supplier ID', defaultValue: () => null },
      { name: 'no', type: 'text', label: 'Order No.', defaultValue: (i) => `PO-${String(i).padStart(5, '0')}` },
      { name: 'status', type: 'integer', label: 'Status', defaultValue: () => randInt(1, 4) },
      { name: 'total_price', type: 'real', label: 'Total Price', defaultValue: () => randFloat(500, 50000) },
      { name: 'order_date', type: 'text', label: 'Order Date', defaultValue: () => randRecentDate(60) },
      { name: 'created_at', type: 'text', label: 'Created At', defaultValue: () => nowISO() },
      { name: 'updated_at', type: 'text', label: 'Updated At', defaultValue: () => nowISO() },
    ],
  },

  // ---- Tags ----
  {
    name: 'tags',
    label: 'Tags',
    columns: [
      { name: 'name', type: 'text', label: 'Name', defaultValue: (i) => `Tag_${i}` },
      { name: 'slug', type: 'text', label: 'Slug', defaultValue: (i) => `tag-${i}` },
      { name: 'type', type: 'text', label: 'Type', defaultValue: () => 'product' },
      { name: 'created_at', type: 'text', label: 'Created At', defaultValue: () => nowISO() },
      { name: 'updated_at', type: 'text', label: 'Updated At', defaultValue: () => nowISO() },
    ],
  },

  // ---- Settings ----
  {
    name: 'settings',
    label: 'Settings',
    columns: [
      { name: 'type', type: 'text', label: 'Type', defaultValue: () => 'test' },
      { name: 'sub_type', type: 'text', label: 'Sub Type', defaultValue: (i) => `setting_${i}` },
      { name: 'value', type: 'text', label: 'Value (JSON)', defaultValue: (i) => JSON.stringify({ key: `value_${i}`, enabled: true }) },
      { name: 'created_at', type: 'text', label: 'Created At', defaultValue: () => nowISO() },
      { name: 'updated_at', type: 'text', label: 'Updated At', defaultValue: () => nowISO() },
    ],
  },

  // ---- Tenant Users ----
  {
    name: 'tenant_users',
    label: 'Tenant Users',
    columns: [
      { name: 'first_name', type: 'text', label: 'First Name', defaultValue: (i) => `User_${i}` },
      { name: 'last_name', type: 'text', label: 'Last Name', defaultValue: (i) => `Test_${i}` },
      { name: 'username', type: 'text', label: 'Username', defaultValue: (i) => `user${i}` },
      { name: 'email', type: 'text', label: 'Email', defaultValue: (i) => `user${i}@test.com` },
      { name: 'phone_no', type: 'text', label: 'Phone', defaultValue: (i) => `555-${String(4000 + i).slice(-4)}` },
      { name: 'image', type: 'text', label: 'Avatar', defaultValue: () => '' },
      { name: 'master_admin', type: 'integer', label: 'Master Admin', defaultValue: () => 0 },
      { name: 'status', type: 'integer', label: 'Status', defaultValue: () => 1 },
      { name: 'assign_customer', type: 'integer', label: 'Assign Customer', defaultValue: () => 0 },
      { name: 'view_all_customers', type: 'integer', label: 'View All Customers', defaultValue: () => 1 },
      { name: 'created_at', type: 'text', label: 'Created At', defaultValue: () => nowISO() },
      { name: 'updated_at', type: 'text', label: 'Updated At', defaultValue: () => nowISO() },
    ],
  },
]

// ============================================================================
// Get config by table name
// ============================================================================

export function getTableConfig(tableName: string): TableConfig | undefined {
  return TABLE_CONFIGS.find((t) => t.name === tableName)
}

// ============================================================================
// Generate a single record
// ============================================================================

export function generateRecord(
  tableName: string,
  index: number
): Record<string, string | number | null> | null {
  const config = getTableConfig(tableName)
  if (!config) return null

  const record: Record<string, string | number | null> = {
    id: uuid(),
  }
  for (const col of config.columns) {
    record[col.name] = col.defaultValue(index)
  }
  return record
}

// ============================================================================
// Quick action: generate a full POS test dataset
// ============================================================================

export interface FullDatasetCounts {
  categories: number
  brands: number
  channels: number
  products: number
  customers: number
  suppliers: number
  sale_orders: number
  payments: number
}

export const DEFAULT_DATASET_COUNTS: FullDatasetCounts = {
  categories: 5,
  brands: 5,
  channels: 2,
  products: 20,
  customers: 10,
  suppliers: 5,
  sale_orders: 15,
  payments: 10,
}

/**
 * Generate a full linked test dataset.
 * Returns a Map<tableName, records[]>, ordered by insertion sequence.
 * Foreign keys automatically reference ids of previously generated records.
 */
export function generateFullDataset(
  counts: FullDatasetCounts = DEFAULT_DATASET_COUNTS
): Map<string, Record<string, string | number | null>[]> {
  const dataset = new Map<string, Record<string, string | number | null>[]>()

  // 1. Categories
  const cats: Record<string, string | number | null>[] = []
  for (let i = 1; i <= counts.categories; i++) {
    cats.push(generateRecord('categories', i)!)
  }
  dataset.set('categories', cats)

  // 2. Brands
  const brs: Record<string, string | number | null>[] = []
  for (let i = 1; i <= counts.brands; i++) {
    brs.push(generateRecord('brands', i)!)
  }
  dataset.set('brands', brs)

  // 3. Channels
  const chs: Record<string, string | number | null>[] = []
  for (let i = 1; i <= counts.channels; i++) {
    chs.push(generateRecord('channels', i)!)
  }
  dataset.set('channels', chs)

  // 4. Products (linked to brands and categories)
  const prods: Record<string, string | number | null>[] = []
  for (let i = 1; i <= counts.products; i++) {
    const rec = generateRecord('products', i)!
    // Link to random brand
    if (brs.length > 0) {
      rec.brand_id = brs[randInt(0, brs.length - 1)].id
    }
    // Link to random category
    if (cats.length > 0) {
      rec.main_category_id = cats[randInt(0, cats.length - 1)].id
    }
    prods.push(rec)
  }
  dataset.set('products', prods)

  // 5. Unit prices (linked to products and channels)
  const ups: Record<string, string | number | null>[] = []
  for (const prod of prods) {
    for (const ch of chs) {
      const cost = randFloat(1, 500)
      ups.push({
        id: uuid(),
        product_id: prod.id,
        channel_id: ch.id,
        cost,
        price: randFloat(cost, cost * 2.5),
        base_cost: cost * 0.9,
        ecom_price: randFloat(cost, cost * 2),
        upc: '',
        unit: 1,
        created_at: nowISO(),
        updated_at: nowISO(),
      })
    }
  }
  dataset.set('unit_prices', ups)

  // 6. Stocks (linked to products and channels)
  const stks: Record<string, string | number | null>[] = []
  for (const prod of prods) {
    for (const ch of chs) {
      stks.push({
        id: uuid(),
        channel_id: ch.id,
        product_id: prod.id,
        qty: randInt(0, 1000),
        status: 1,
        created_at: nowISO(),
        updated_at: nowISO(),
      })
    }
  }
  dataset.set('stocks', stks)

  // 7. Customers
  const custs: Record<string, string | number | null>[] = []
  for (let i = 1; i <= counts.customers; i++) {
    custs.push(generateRecord('customers', i)!)
  }
  dataset.set('customers', custs)

  // 8. Suppliers
  const supps: Record<string, string | number | null>[] = []
  for (let i = 1; i <= counts.suppliers; i++) {
    supps.push(generateRecord('suppliers', i)!)
  }
  dataset.set('suppliers', supps)

  // 9. Sale orders (linked to customers and channels)
  const sos: Record<string, string | number | null>[] = []
  for (let i = 1; i <= counts.sale_orders; i++) {
    const rec = generateRecord('sale_orders', i)!
    if (custs.length > 0) {
      rec.customer_id = custs[randInt(0, custs.length - 1)].id
    }
    if (chs.length > 0) {
      rec.channel_id = chs[randInt(0, chs.length - 1)].id
    }
    sos.push(rec)
  }
  dataset.set('sale_orders', sos)

  // 10. Sale order details (1-3 details per order)
  const sods: Record<string, string | number | null>[] = []
  for (const so of sos) {
    const detailCount = randInt(1, 3)
    for (let j = 0; j < detailCount; j++) {
      const prod = prods[randInt(0, prods.length - 1)]
      const qty = randInt(1, 20)
      const price = randFloat(5, 500)
      sods.push({
        id: uuid(),
        sale_order_id: so.id,
        product_id: prod.id,
        channel_id: so.channel_id,
        unit_price_id: null,
        qty,
        price,
        discount: randFloat(0, 20),
        total_price: Math.round(qty * price * 100) / 100,
        created_at: nowISO(),
        updated_at: nowISO(),
      })
    }
  }
  dataset.set('sale_order_details', sods)

  // 11. Invoices (one per order)
  const invs: Record<string, string | number | null>[] = []
  for (let i = 0; i < sos.length; i++) {
    const so = sos[i]
    const total = (so.total_price as number) || randFloat(100, 5000)
    invs.push({
      id: uuid(),
      sale_order_id: so.id,
      customer_id: so.customer_id,
      no: `INV-${String(i + 1).padStart(5, '0')}`,
      status: randInt(1, 3),
      remaining_amount: randFloat(0, total),
      total_amount: total,
      created_at: nowISO(),
      updated_at: nowISO(),
    })
  }
  dataset.set('invoices', invs)

  // 12. Payments (linked to invoices and customers)
  const pays: Record<string, string | number | null>[] = []
  for (let i = 1; i <= counts.payments; i++) {
    const inv = invs[randInt(0, invs.length - 1)]
    pays.push({
      id: uuid(),
      customer_id: inv.customer_id,
      invoice_id: inv.id,
      no: `PAY-${String(i).padStart(5, '0')}`,
      status: 1,
      payment_type: randInt(1, 4),
      payment_date: randRecentDate(60),
      amount: randFloat(10, (inv.total_amount as number) || 1000),
      category: 1,
      memo: `Payment memo ${i}`,
      created_at: nowISO(),
      updated_at: nowISO(),
    })
  }
  dataset.set('payments', pays)

  // 13. Purchase orders (linked to suppliers)
  const pos: Record<string, string | number | null>[] = []
  for (let i = 1; i <= counts.suppliers; i++) {
    const supp = supps[i - 1]
    pos.push({
      id: uuid(),
      supplier_id: supp.id,
      no: `PO-${String(i).padStart(5, '0')}`,
      status: randInt(1, 4),
      total_price: randFloat(500, 50000),
      order_date: randRecentDate(60),
      created_at: nowISO(),
      updated_at: nowISO(),
    })
  }
  dataset.set('purchase_orders', pos)

  // 14. Purchase invoices (linked to purchase orders and suppliers)
  const pis: Record<string, string | number | null>[] = []
  for (let i = 0; i < pos.length; i++) {
    const po = pos[i]
    pis.push({
      id: uuid(),
      purchase_order_id: po.id,
      supplier_id: po.supplier_id,
      no: `PI-${String(i + 1).padStart(5, '0')}`,
      status: randInt(1, 3),
      invoice_balance: randFloat(0, (po.total_price as number) || 10000),
      total_amount: po.total_price,
      created_at: nowISO(),
      updated_at: nowISO(),
    })
  }
  dataset.set('purchase_invoices', pis)

  return dataset
}
