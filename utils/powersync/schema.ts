import { column, Schema, Table } from '@powersync/react-native'

// Products table
const products = new Table({
  brand_id: column.integer,
  name: column.text,
  weight: column.real,
  weight_unit: column.integer,
  sku: column.text,
  upc: column.text,
  upc_2: column.text,
  upc_3: column.text,
  mlc: column.text,
  bin: column.text,
  description: column.text,
  is_online: column.integer, // boolean
  status: column.integer,
  unit_of_measurement: column.integer,
  slug: column.text,
  sold_count: column.integer,
  is_featured: column.integer, // boolean
  main_category_id: column.integer,
  images: column.text, // JSON string
  created_at: column.text,
  updated_at: column.text,
})

// Categories table
const categories = new Table({
  name: column.text,
  code: column.text,
  slug: column.text,
  is_featured: column.integer, // boolean
  image: column.text,
  parent_id: column.integer,
  created_at: column.text,
  updated_at: column.text,
})

// Brands table
const brands = new Table({
  name: column.text,
  slug: column.text,
  image: column.text,
  is_featured: column.integer, // boolean
  created_at: column.text,
  updated_at: column.text,
})

// Customers table
const customers = new Table({
  no: column.text,
  name: column.text,
  email: column.text,
  balance: column.real,
  balance_limit: column.real,
  phone_no: column.text,
  business_name: column.text,
  business_city: column.text,
  business_state: column.text,
  business_country: column.text,
  business_zip_code: column.text,
  business_phone_no: column.text,
  address: column.text,
  status: column.integer,
  allow_ecom: column.text, // 'Y' or 'N'
  created_at: column.text,
  updated_at: column.text,
})

// Customer groups table
// NOTE: description field does not exist in database
const customer_groups = new Table({
  name: column.text,
  is_active: column.integer, // boolean
  tier_id: column.integer,
  created_at: column.text,
  updated_at: column.text,
})

// Customer groups - customer relation (for counting customers per group)
// NOTE: id is a synthetic composite key (customer_group_id-customer_id)
const customer_groups_customer = new Table({
  customer_group_id: column.integer,
  customer_id: column.integer,
})

// Stocks table
// NOTE: qty_alert, location fields do not exist in database
const stocks = new Table({
  channel_id: column.integer,
  product_id: column.integer,
  qty: column.integer,
  status: column.integer,
  created_at: column.text,
  updated_at: column.text,
})

// Unit prices table
// NOTE: actual field names differ from initial design
const unit_prices = new Table({
  product_id: column.integer,
  channel_id: column.integer,
  cost: column.real,        // cost price
  price: column.real,       // sale price
  base_cost: column.real,   // base cost
  ecom_price: column.real,  // ecommerce price
  upc: column.text,
  unit: column.integer,
  created_at: column.text,
  updated_at: column.text,
})

// Taxes table
const taxes = new Table({
  name: column.text,
  rate: column.real,
  type: column.text,
  enabled: column.integer, // boolean
  created_at: column.text,
  updated_at: column.text,
})

// Sale orders table
const sale_orders = new Table({
  customer_id: column.integer,
  channel_id: column.integer,
  no: column.text,
  order_type: column.integer,
  sale_type: column.integer,
  status: column.integer,
  total_price: column.real,
  tax: column.real,
  discount: column.real,
  total_discount: column.real,
  delivery_charges: column.real,
  shipping_type: column.integer,
  fulfilment_status: column.integer,
  order_date: column.text,
  created_by_id: column.integer,
  balance_adjustment_id: column.integer,
  created_at: column.text,
  updated_at: column.text,
})

// Sale order details table
const sale_order_details = new Table({
  sale_order_id: column.integer,
  product_id: column.integer,
  channel_id: column.integer,
  unit_price_id: column.integer,
  qty: column.real,
  price: column.real,
  discount: column.real,
  total_price: column.real,
  created_at: column.text,
  updated_at: column.text,
})

// Payments table
const payments = new Table({
  customer_id: column.integer,
  invoice_id: column.integer,
  no: column.text,
  status: column.integer,
  payment_type: column.integer,
  payment_date: column.text,
  amount: column.real,
  category: column.integer,
  memo: column.text,
  created_at: column.text,
  updated_at: column.text,
})

// Invoices table (for receivable amount)
const invoices = new Table({
  sale_order_id: column.integer,
  customer_id: column.integer,
  no: column.text,
  status: column.integer,
  remaining_amount: column.real,
  total_amount: column.real,
  created_at: column.text,
  updated_at: column.text,
})

// Purchase invoices table (for payable amount)
const purchase_invoices = new Table({
  purchase_order_id: column.integer,
  supplier_id: column.integer,
  no: column.text,
  status: column.integer,
  invoice_balance: column.real,
  total_amount: column.real,
  created_at: column.text,
  updated_at: column.text,
})

// Purchase orders table (for payable amount join)
const purchase_orders = new Table({
  supplier_id: column.integer,
  no: column.text,
  status: column.integer,
  total_price: column.real,
  order_date: column.text,
  created_at: column.text,
  updated_at: column.text,
})

// Suppliers table (for payable amount)
const suppliers = new Table({
  name: column.text,
  email: column.text,
  phone_no: column.text,
  balance: column.real,
  status: column.integer,
  created_at: column.text,
  updated_at: column.text,
})

// Settings table
const settings = new Table({
  type: column.text,
  sub_type: column.text,
  value: column.text, // JSON string
  created_at: column.text,
  updated_at: column.text,
})

// Tags table
const tags = new Table({
  name: column.text,
  slug: column.text,
  type: column.text,
  created_at: column.text,
  updated_at: column.text,
})

// Promotions table
const promotions = new Table({
  name: column.text,
  start_datetime: column.text,
  end_datetime: column.text,
  status: column.integer,
  applicable_for: column.integer,    // 1=Ecom, 2=Portal, 3=Both
  applicable_to: column.integer,     // 1=All, 2=Registered, 3=Groups
  has_sale_badge: column.integer,    // boolean
  has_counter: column.integer,       // boolean
  counter_duration: column.integer,
  customer_group_ids: column.text,   // JSON array string
  channel_ids: column.text,          // JSON array string
  created_at: column.text,
  updated_at: column.text,
})

// Promotion details table
const promotion_details = new Table({
  promotion_id: column.integer,
  product_id: column.integer,
  unit_price_id: column.integer,
  channel_id: column.integer,
  min_qty: column.integer,
  value_type: column.integer,        // 1=% Disc, 2=Price Disc, 3=Fixed
  value: column.real,
  is_enabled: column.integer,        // boolean
  total_ecom_sold: column.integer,
  total_tenant_sold: column.integer,
  total_app_sold: column.integer,
  unit: column.integer,
  created_at: column.text,
  updated_at: column.text,
})

// Channels table
const channels = new Table({
  name: column.text,
  description: column.text,
  is_primary: column.integer, // boolean
  type: column.integer,
  created_at: column.text,
  updated_at: column.text,
})

// Tenant Users table (synced user info for real-time updates)
const tenant_users = new Table({
  first_name: column.text,
  last_name: column.text,
  username: column.text,
  email: column.text,
  phone_no: column.text,
  image: column.text,
  master_admin: column.integer, // boolean
  status: column.integer,
  assign_customer: column.integer, // boolean
  view_all_customers: column.integer, // boolean
  created_at: column.text,
  updated_at: column.text,
})

// Export the schema
export const AppSchema = new Schema({
  products,
  categories,
  brands,
  customers,
  customer_groups,
  customer_groups_customer,
  stocks,
  unit_prices,
  taxes,
  sale_orders,
  sale_order_details,
  payments,
  invoices,
  purchase_invoices,
  purchase_orders,
  suppliers,
  settings,
  tags,
  channels,
  tenant_users,
  promotions,
  promotion_details,
})

// TypeScript types for the schema
export type Database = (typeof AppSchema)['types']
export type Product = Database['products']
export type Category = Database['categories']
export type Brand = Database['brands']
export type Customer = Database['customers']
export type CustomerGroup = Database['customer_groups']
export type Stock = Database['stocks']
export type UnitPrice = Database['unit_prices']
export type Tax = Database['taxes']
export type SaleOrder = Database['sale_orders']
export type SaleOrderDetail = Database['sale_order_details']
export type Payment = Database['payments']
export type Invoice = Database['invoices']
export type PurchaseInvoice = Database['purchase_invoices']
export type PurchaseOrder = Database['purchase_orders']
export type Supplier = Database['suppliers']
export type Setting = Database['settings']
export type Tag = Database['tags']
export type Channel = Database['channels']
export type TenantUser = Database['tenant_users']
export type Promotion = Database['promotions']
export type PromotionDetailRow = Database['promotion_details']