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
  description: column.text,
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
  created_at: column.text,
  updated_at: column.text,
})

// Customer groups table
const customer_groups = new Table({
  name: column.text,
  description: column.text,
  created_at: column.text,
  updated_at: column.text,
})

// Stocks table
const stocks = new Table({
  product_id: column.integer,
  qty: column.real,
  qty_alert: column.real,
  location: column.text,
  created_at: column.text,
  updated_at: column.text,
})

// Unit prices table
const unit_prices = new Table({
  product_id: column.integer,
  unit_price: column.real,
  sale_price: column.real,
  cost_price: column.real,
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
  order_no: column.text,
  customer_id: column.integer,
  user_id: column.integer,
  status: column.integer,
  sub_total: column.real,
  discount: column.real,
  tax: column.real,
  total: column.real,
  notes: column.text,
  created_at: column.text,
  updated_at: column.text,
})

// Sale order details table
const sale_order_details = new Table({
  sale_order_id: column.integer,
  product_id: column.integer,
  qty: column.real,
  unit_price: column.real,
  discount: column.real,
  tax: column.real,
  total: column.real,
  created_at: column.text,
  updated_at: column.text,
})

// Payments table
const payments = new Table({
  sale_order_id: column.integer,
  customer_id: column.integer,
  amount: column.real,
  method: column.text,
  reference: column.text,
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
  stocks,
  unit_prices,
  taxes,
  sale_orders,
  sale_order_details,
  payments,
  settings,
  tags,
  tenant_users,
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
export type Setting = Database['settings']
export type Tag = Database['tags']
export type TenantUser = Database['tenant_users']
