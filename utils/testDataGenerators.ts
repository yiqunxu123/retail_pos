/**
 * Test Data Generators
 *
 * 为 PowerSync 同步的 20 张数据表提供测试数据生成器。
 * 每张表有列定义、类型信息、以及智能默认值生成函数。
 *
 * - 数字字段：在合理范围内随机
 * - 字符串字段：加上 _index 后缀
 * - 外键引用：在快捷操作中自动关联
 */

// ============================================================================
// Helpers
// ============================================================================

/** 生成指定范围内的随机整数 [min, max] */
export function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

/** 生成指定范围内的随机浮点数，保留2位小数 */
export function randFloat(min: number, max: number): number {
  return Math.round((Math.random() * (max - min) + min) * 100) / 100
}

/** 生成随机 UUID (v4-like) */
export function uuid(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

/** 生成随机 12 位 UPC 码 */
function randUpc(): string {
  let upc = ''
  for (let i = 0; i < 12; i++) upc += randInt(0, 9).toString()
  return upc
}

/** 获取最近 N 天内的随机日期字符串 */
function randRecentDate(days = 90): string {
  const now = Date.now()
  const offset = randInt(0, days * 24 * 60 * 60 * 1000)
  return new Date(now - offset).toISOString()
}

/** 当前时间 ISO 字符串 */
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
  /** 列的中文标签 */
  label: string
  /** 默认值生成函数，index 为批量生成的序号 */
  defaultValue: (index: number) => string | number | null
}

export interface TableConfig {
  /** 表名 */
  name: string
  /** 中文显示名 */
  label: string
  /** 列定义（不含 id，id 自动生成 uuid） */
  columns: ColumnDef[]
}

// ============================================================================
// Table Configs - 全部 20 张 PowerSync 表
// ============================================================================

export const TABLE_CONFIGS: TableConfig[] = [
  // ---- 分类 ----
  {
    name: 'categories',
    label: '分类 (Categories)',
    columns: [
      { name: 'name', type: 'text', label: '名称', defaultValue: (i) => `Category_${i}` },
      { name: 'code', type: 'text', label: '编码', defaultValue: (i) => `CAT${String(i).padStart(3, '0')}` },
      { name: 'slug', type: 'text', label: 'Slug', defaultValue: (i) => `category-${i}` },
      { name: 'is_featured', type: 'integer', label: '是否推荐', defaultValue: () => randInt(0, 1) },
      { name: 'image', type: 'text', label: '图片', defaultValue: () => '' },
      { name: 'parent_id', type: 'integer', label: '父分类ID', defaultValue: () => null },
      { name: 'created_at', type: 'text', label: '创建时间', defaultValue: () => nowISO() },
      { name: 'updated_at', type: 'text', label: '更新时间', defaultValue: () => nowISO() },
    ],
  },

  // ---- 品牌 ----
  {
    name: 'brands',
    label: '品牌 (Brands)',
    columns: [
      { name: 'name', type: 'text', label: '名称', defaultValue: (i) => `Brand_${i}` },
      { name: 'slug', type: 'text', label: 'Slug', defaultValue: (i) => `brand-${i}` },
      { name: 'image', type: 'text', label: '图片', defaultValue: () => '' },
      { name: 'is_featured', type: 'integer', label: '是否推荐', defaultValue: () => randInt(0, 1) },
      { name: 'created_at', type: 'text', label: '创建时间', defaultValue: () => nowISO() },
      { name: 'updated_at', type: 'text', label: '更新时间', defaultValue: () => nowISO() },
    ],
  },

  // ---- 渠道 ----
  {
    name: 'channels',
    label: '渠道 (Channels)',
    columns: [
      { name: 'name', type: 'text', label: '名称', defaultValue: (i) => `Channel_${i}` },
      { name: 'description', type: 'text', label: '描述', defaultValue: (i) => `Test channel ${i}` },
      { name: 'is_primary', type: 'integer', label: '是否主渠道', defaultValue: (i) => (i === 1 ? 1 : 0) },
      { name: 'type', type: 'integer', label: '类型', defaultValue: () => 1 },
      { name: 'created_at', type: 'text', label: '创建时间', defaultValue: () => nowISO() },
      { name: 'updated_at', type: 'text', label: '更新时间', defaultValue: () => nowISO() },
    ],
  },

  // ---- 产品 ----
  {
    name: 'products',
    label: '产品 (Products)',
    columns: [
      { name: 'brand_id', type: 'integer', label: '品牌ID', defaultValue: () => null },
      { name: 'name', type: 'text', label: '名称', defaultValue: (i) => `Product_${i}` },
      { name: 'weight', type: 'real', label: '重量', defaultValue: () => randFloat(0.1, 50) },
      { name: 'weight_unit', type: 'integer', label: '重量单位', defaultValue: () => 1 },
      { name: 'sku', type: 'text', label: 'SKU', defaultValue: (i) => `SKU-${String(i).padStart(5, '0')}` },
      { name: 'upc', type: 'text', label: 'UPC', defaultValue: () => randUpc() },
      { name: 'upc_2', type: 'text', label: 'UPC 2', defaultValue: () => '' },
      { name: 'upc_3', type: 'text', label: 'UPC 3', defaultValue: () => '' },
      { name: 'mlc', type: 'text', label: 'MLC', defaultValue: () => '' },
      { name: 'bin', type: 'text', label: 'Bin', defaultValue: (i) => `BIN-${String(i).padStart(3, '0')}` },
      { name: 'description', type: 'text', label: '描述', defaultValue: (i) => `Test product description ${i}` },
      { name: 'is_online', type: 'integer', label: '线上销售', defaultValue: () => 1 },
      { name: 'status', type: 'integer', label: '状态(1=活跃)', defaultValue: () => 1 },
      { name: 'unit_of_measurement', type: 'integer', label: '计量单位', defaultValue: () => 1 },
      { name: 'slug', type: 'text', label: 'Slug', defaultValue: (i) => `product-${i}` },
      { name: 'sold_count', type: 'integer', label: '已售数量', defaultValue: () => randInt(0, 500) },
      { name: 'is_featured', type: 'integer', label: '是否推荐', defaultValue: () => randInt(0, 1) },
      { name: 'main_category_id', type: 'integer', label: '主分类ID', defaultValue: () => null },
      { name: 'images', type: 'text', label: '图片(JSON)', defaultValue: () => '[]' },
      { name: 'created_at', type: 'text', label: '创建时间', defaultValue: () => nowISO() },
      { name: 'updated_at', type: 'text', label: '更新时间', defaultValue: () => nowISO() },
    ],
  },

  // ---- 单价 ----
  {
    name: 'unit_prices',
    label: '单价 (Unit Prices)',
    columns: [
      { name: 'product_id', type: 'integer', label: '产品ID', defaultValue: () => null },
      { name: 'channel_id', type: 'integer', label: '渠道ID', defaultValue: () => 1 },
      { name: 'cost', type: 'real', label: '成本价', defaultValue: () => randFloat(1, 500) },
      { name: 'price', type: 'real', label: '售价', defaultValue: () => randFloat(5, 999) },
      { name: 'base_cost', type: 'real', label: '基础成本', defaultValue: () => randFloat(1, 400) },
      { name: 'ecom_price', type: 'real', label: '电商价', defaultValue: () => randFloat(5, 999) },
      { name: 'upc', type: 'text', label: 'UPC', defaultValue: () => '' },
      { name: 'unit', type: 'integer', label: '单位', defaultValue: () => 1 },
      { name: 'created_at', type: 'text', label: '创建时间', defaultValue: () => nowISO() },
      { name: 'updated_at', type: 'text', label: '更新时间', defaultValue: () => nowISO() },
    ],
  },

  // ---- 库存 ----
  {
    name: 'stocks',
    label: '库存 (Stocks)',
    columns: [
      { name: 'channel_id', type: 'integer', label: '渠道ID', defaultValue: () => 1 },
      { name: 'product_id', type: 'integer', label: '产品ID', defaultValue: () => null },
      { name: 'qty', type: 'integer', label: '数量', defaultValue: () => randInt(0, 1000) },
      { name: 'status', type: 'integer', label: '状态', defaultValue: () => 1 },
      { name: 'created_at', type: 'text', label: '创建时间', defaultValue: () => nowISO() },
      { name: 'updated_at', type: 'text', label: '更新时间', defaultValue: () => nowISO() },
    ],
  },

  // ---- 客户 ----
  {
    name: 'customers',
    label: '客户 (Customers)',
    columns: [
      { name: 'no', type: 'text', label: '编号', defaultValue: (i) => `CUST-${String(i).padStart(4, '0')}` },
      { name: 'name', type: 'text', label: '姓名', defaultValue: (i) => `Customer_${i}` },
      { name: 'email', type: 'text', label: '邮箱', defaultValue: (i) => `customer${i}@test.com` },
      { name: 'balance', type: 'real', label: '余额', defaultValue: () => randFloat(0, 10000) },
      { name: 'balance_limit', type: 'real', label: '余额限额', defaultValue: () => randFloat(5000, 50000) },
      { name: 'phone_no', type: 'text', label: '电话', defaultValue: (i) => `555-${String(1000 + i).slice(-4)}` },
      { name: 'business_name', type: 'text', label: '公司名', defaultValue: (i) => `Business_${i} LLC` },
      { name: 'business_city', type: 'text', label: '城市', defaultValue: () => 'New York' },
      { name: 'business_state', type: 'text', label: '州', defaultValue: () => 'NY' },
      { name: 'business_country', type: 'text', label: '国家', defaultValue: () => 'US' },
      { name: 'business_zip_code', type: 'text', label: '邮编', defaultValue: () => String(randInt(10000, 99999)) },
      { name: 'business_phone_no', type: 'text', label: '公司电话', defaultValue: (i) => `555-${String(2000 + i).slice(-4)}` },
      { name: 'address', type: 'text', label: '地址', defaultValue: (i) => `${randInt(1, 999)} Test Street #${i}` },
      { name: 'status', type: 'integer', label: '状态(1=活跃)', defaultValue: () => 1 },
      { name: 'allow_ecom', type: 'text', label: '允许电商(Y/N)', defaultValue: () => 'Y' },
      { name: 'created_at', type: 'text', label: '创建时间', defaultValue: () => nowISO() },
      { name: 'updated_at', type: 'text', label: '更新时间', defaultValue: () => nowISO() },
    ],
  },

  // ---- 客户分组 ----
  {
    name: 'customer_groups',
    label: '客户分组 (Customer Groups)',
    columns: [
      { name: 'name', type: 'text', label: '名称', defaultValue: (i) => `Group_${i}` },
      { name: 'is_active', type: 'integer', label: '是否活跃', defaultValue: () => 1 },
      { name: 'tier_id', type: 'integer', label: '等级ID', defaultValue: () => null },
      { name: 'created_at', type: 'text', label: '创建时间', defaultValue: () => nowISO() },
      { name: 'updated_at', type: 'text', label: '更新时间', defaultValue: () => nowISO() },
    ],
  },

  // ---- 客户分组关联 ----
  {
    name: 'customer_groups_customer',
    label: '客户分组关联 (Group-Customer)',
    columns: [
      { name: 'customer_group_id', type: 'integer', label: '分组ID', defaultValue: () => null },
      { name: 'customer_id', type: 'integer', label: '客户ID', defaultValue: () => null },
    ],
  },

  // ---- 供应商 ----
  {
    name: 'suppliers',
    label: '供应商 (Suppliers)',
    columns: [
      { name: 'name', type: 'text', label: '名称', defaultValue: (i) => `Supplier_${i}` },
      { name: 'email', type: 'text', label: '邮箱', defaultValue: (i) => `supplier${i}@test.com` },
      { name: 'phone_no', type: 'text', label: '电话', defaultValue: (i) => `555-${String(3000 + i).slice(-4)}` },
      { name: 'balance', type: 'real', label: '余额', defaultValue: () => randFloat(0, 50000) },
      { name: 'status', type: 'integer', label: '状态', defaultValue: () => 1 },
      { name: 'created_at', type: 'text', label: '创建时间', defaultValue: () => nowISO() },
      { name: 'updated_at', type: 'text', label: '更新时间', defaultValue: () => nowISO() },
    ],
  },

  // ---- 税率 ----
  {
    name: 'taxes',
    label: '税率 (Taxes)',
    columns: [
      { name: 'name', type: 'text', label: '名称', defaultValue: (i) => `Tax_${i}` },
      { name: 'rate', type: 'real', label: '税率', defaultValue: () => randFloat(0.01, 0.15) },
      { name: 'type', type: 'text', label: '类型', defaultValue: () => 'percentage' },
      { name: 'enabled', type: 'integer', label: '是否启用', defaultValue: () => 1 },
      { name: 'created_at', type: 'text', label: '创建时间', defaultValue: () => nowISO() },
      { name: 'updated_at', type: 'text', label: '更新时间', defaultValue: () => nowISO() },
    ],
  },

  // ---- 销售订单 ----
  {
    name: 'sale_orders',
    label: '销售订单 (Sale Orders)',
    columns: [
      { name: 'customer_id', type: 'integer', label: '客户ID', defaultValue: () => null },
      { name: 'channel_id', type: 'integer', label: '渠道ID', defaultValue: () => 1 },
      { name: 'no', type: 'text', label: '订单号', defaultValue: (i) => `SO-${String(i).padStart(5, '0')}` },
      { name: 'order_type', type: 'integer', label: '订单类型', defaultValue: () => 1 },
      { name: 'sale_type', type: 'integer', label: '销售类型', defaultValue: () => 1 },
      { name: 'status', type: 'integer', label: '状态(1-5)', defaultValue: () => randInt(1, 5) },
      { name: 'total_price', type: 'real', label: '总价', defaultValue: () => randFloat(10, 5000) },
      { name: 'tax', type: 'real', label: '税额', defaultValue: () => randFloat(0, 500) },
      { name: 'discount', type: 'real', label: '折扣', defaultValue: () => randFloat(0, 100) },
      { name: 'total_discount', type: 'real', label: '总折扣', defaultValue: () => randFloat(0, 200) },
      { name: 'delivery_charges', type: 'real', label: '运费', defaultValue: () => randFloat(0, 50) },
      { name: 'shipping_type', type: 'integer', label: '配送类型', defaultValue: () => 1 },
      { name: 'fulfilment_status', type: 'integer', label: '履约状态', defaultValue: () => randInt(0, 3) },
      { name: 'order_date', type: 'text', label: '订单日期', defaultValue: () => randRecentDate(90) },
      { name: 'created_by_id', type: 'integer', label: '创建人ID', defaultValue: () => null },
      { name: 'balance_adjustment_id', type: 'integer', label: '余额调整ID', defaultValue: () => null },
      { name: 'created_at', type: 'text', label: '创建时间', defaultValue: () => nowISO() },
      { name: 'updated_at', type: 'text', label: '更新时间', defaultValue: () => nowISO() },
    ],
  },

  // ---- 订单明细 ----
  {
    name: 'sale_order_details',
    label: '订单明细 (Sale Order Details)',
    columns: [
      { name: 'sale_order_id', type: 'integer', label: '订单ID', defaultValue: () => null },
      { name: 'product_id', type: 'integer', label: '产品ID', defaultValue: () => null },
      { name: 'channel_id', type: 'integer', label: '渠道ID', defaultValue: () => 1 },
      { name: 'unit_price_id', type: 'integer', label: '单价ID', defaultValue: () => null },
      { name: 'qty', type: 'real', label: '数量', defaultValue: () => randInt(1, 100) },
      { name: 'price', type: 'real', label: '单价', defaultValue: () => randFloat(1, 999) },
      { name: 'discount', type: 'real', label: '折扣', defaultValue: () => randFloat(0, 50) },
      { name: 'total_price', type: 'real', label: '小计', defaultValue: () => randFloat(10, 5000) },
      { name: 'created_at', type: 'text', label: '创建时间', defaultValue: () => nowISO() },
      { name: 'updated_at', type: 'text', label: '更新时间', defaultValue: () => nowISO() },
    ],
  },

  // ---- 支付 ----
  {
    name: 'payments',
    label: '支付 (Payments)',
    columns: [
      { name: 'customer_id', type: 'integer', label: '客户ID', defaultValue: () => null },
      { name: 'invoice_id', type: 'integer', label: '发票ID', defaultValue: () => null },
      { name: 'no', type: 'text', label: '支付号', defaultValue: (i) => `PAY-${String(i).padStart(5, '0')}` },
      { name: 'status', type: 'integer', label: '状态', defaultValue: () => randInt(1, 3) },
      { name: 'payment_type', type: 'integer', label: '支付方式(1-4)', defaultValue: () => randInt(1, 4) },
      { name: 'payment_date', type: 'text', label: '支付日期', defaultValue: () => randRecentDate(60) },
      { name: 'amount', type: 'real', label: '金额', defaultValue: () => randFloat(10, 5000) },
      { name: 'category', type: 'integer', label: '类别', defaultValue: () => 1 },
      { name: 'memo', type: 'text', label: '备注', defaultValue: (i) => `Payment memo ${i}` },
      { name: 'created_at', type: 'text', label: '创建时间', defaultValue: () => nowISO() },
      { name: 'updated_at', type: 'text', label: '更新时间', defaultValue: () => nowISO() },
    ],
  },

  // ---- 发票 ----
  {
    name: 'invoices',
    label: '发票 (Invoices)',
    columns: [
      { name: 'sale_order_id', type: 'integer', label: '订单ID', defaultValue: () => null },
      { name: 'customer_id', type: 'integer', label: '客户ID', defaultValue: () => null },
      { name: 'no', type: 'text', label: '发票号', defaultValue: (i) => `INV-${String(i).padStart(5, '0')}` },
      { name: 'status', type: 'integer', label: '状态', defaultValue: () => randInt(1, 3) },
      { name: 'remaining_amount', type: 'real', label: '剩余金额', defaultValue: () => randFloat(0, 2000) },
      { name: 'total_amount', type: 'real', label: '总金额', defaultValue: () => randFloat(100, 5000) },
      { name: 'created_at', type: 'text', label: '创建时间', defaultValue: () => nowISO() },
      { name: 'updated_at', type: 'text', label: '更新时间', defaultValue: () => nowISO() },
    ],
  },

  // ---- 采购发票 ----
  {
    name: 'purchase_invoices',
    label: '采购发票 (Purchase Invoices)',
    columns: [
      { name: 'purchase_order_id', type: 'integer', label: '采购订单ID', defaultValue: () => null },
      { name: 'supplier_id', type: 'integer', label: '供应商ID', defaultValue: () => null },
      { name: 'no', type: 'text', label: '发票号', defaultValue: (i) => `PI-${String(i).padStart(5, '0')}` },
      { name: 'status', type: 'integer', label: '状态', defaultValue: () => randInt(1, 3) },
      { name: 'invoice_balance', type: 'real', label: '发票余额', defaultValue: () => randFloat(0, 10000) },
      { name: 'total_amount', type: 'real', label: '总金额', defaultValue: () => randFloat(500, 50000) },
      { name: 'created_at', type: 'text', label: '创建时间', defaultValue: () => nowISO() },
      { name: 'updated_at', type: 'text', label: '更新时间', defaultValue: () => nowISO() },
    ],
  },

  // ---- 采购订单 ----
  {
    name: 'purchase_orders',
    label: '采购订单 (Purchase Orders)',
    columns: [
      { name: 'supplier_id', type: 'integer', label: '供应商ID', defaultValue: () => null },
      { name: 'no', type: 'text', label: '订单号', defaultValue: (i) => `PO-${String(i).padStart(5, '0')}` },
      { name: 'status', type: 'integer', label: '状态', defaultValue: () => randInt(1, 4) },
      { name: 'total_price', type: 'real', label: '总价', defaultValue: () => randFloat(500, 50000) },
      { name: 'order_date', type: 'text', label: '订单日期', defaultValue: () => randRecentDate(60) },
      { name: 'created_at', type: 'text', label: '创建时间', defaultValue: () => nowISO() },
      { name: 'updated_at', type: 'text', label: '更新时间', defaultValue: () => nowISO() },
    ],
  },

  // ---- 标签 ----
  {
    name: 'tags',
    label: '标签 (Tags)',
    columns: [
      { name: 'name', type: 'text', label: '名称', defaultValue: (i) => `Tag_${i}` },
      { name: 'slug', type: 'text', label: 'Slug', defaultValue: (i) => `tag-${i}` },
      { name: 'type', type: 'text', label: '类型', defaultValue: () => 'product' },
      { name: 'created_at', type: 'text', label: '创建时间', defaultValue: () => nowISO() },
      { name: 'updated_at', type: 'text', label: '更新时间', defaultValue: () => nowISO() },
    ],
  },

  // ---- 设置 ----
  {
    name: 'settings',
    label: '设置 (Settings)',
    columns: [
      { name: 'type', type: 'text', label: '类型', defaultValue: () => 'test' },
      { name: 'sub_type', type: 'text', label: '子类型', defaultValue: (i) => `setting_${i}` },
      { name: 'value', type: 'text', label: '值(JSON)', defaultValue: (i) => JSON.stringify({ key: `value_${i}`, enabled: true }) },
      { name: 'created_at', type: 'text', label: '创建时间', defaultValue: () => nowISO() },
      { name: 'updated_at', type: 'text', label: '更新时间', defaultValue: () => nowISO() },
    ],
  },

  // ---- 租户用户 ----
  {
    name: 'tenant_users',
    label: '租户用户 (Tenant Users)',
    columns: [
      { name: 'first_name', type: 'text', label: '名', defaultValue: (i) => `User_${i}` },
      { name: 'last_name', type: 'text', label: '姓', defaultValue: (i) => `Test_${i}` },
      { name: 'username', type: 'text', label: '用户名', defaultValue: (i) => `user${i}` },
      { name: 'email', type: 'text', label: '邮箱', defaultValue: (i) => `user${i}@test.com` },
      { name: 'phone_no', type: 'text', label: '电话', defaultValue: (i) => `555-${String(4000 + i).slice(-4)}` },
      { name: 'image', type: 'text', label: '头像', defaultValue: () => '' },
      { name: 'master_admin', type: 'integer', label: '超级管理员', defaultValue: () => 0 },
      { name: 'status', type: 'integer', label: '状态', defaultValue: () => 1 },
      { name: 'assign_customer', type: 'integer', label: '分配客户', defaultValue: () => 0 },
      { name: 'view_all_customers', type: 'integer', label: '查看所有客户', defaultValue: () => 1 },
      { name: 'created_at', type: 'text', label: '创建时间', defaultValue: () => nowISO() },
      { name: 'updated_at', type: 'text', label: '更新时间', defaultValue: () => nowISO() },
    ],
  },
]

// ============================================================================
// 根据表名获取配置
// ============================================================================

export function getTableConfig(tableName: string): TableConfig | undefined {
  return TABLE_CONFIGS.find((t) => t.name === tableName)
}

// ============================================================================
// 生成单条记录
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
// 快捷操作：生成完整 POS 测试数据集
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
 * 生成完整的关联测试数据集。
 * 返回一个 Map<tableName, records[]>，按插入顺序排列。
 * 外键会自动引用前面生成的记录的 id。
 */
export function generateFullDataset(
  counts: FullDatasetCounts = DEFAULT_DATASET_COUNTS
): Map<string, Record<string, string | number | null>[]> {
  const dataset = new Map<string, Record<string, string | number | null>[]>()

  // 1. 分类
  const cats: Record<string, string | number | null>[] = []
  for (let i = 1; i <= counts.categories; i++) {
    cats.push(generateRecord('categories', i)!)
  }
  dataset.set('categories', cats)

  // 2. 品牌
  const brs: Record<string, string | number | null>[] = []
  for (let i = 1; i <= counts.brands; i++) {
    brs.push(generateRecord('brands', i)!)
  }
  dataset.set('brands', brs)

  // 3. 渠道
  const chs: Record<string, string | number | null>[] = []
  for (let i = 1; i <= counts.channels; i++) {
    chs.push(generateRecord('channels', i)!)
  }
  dataset.set('channels', chs)

  // 4. 产品（关联品牌和分类）
  const prods: Record<string, string | number | null>[] = []
  for (let i = 1; i <= counts.products; i++) {
    const rec = generateRecord('products', i)!
    // 关联随机品牌
    if (brs.length > 0) {
      rec.brand_id = brs[randInt(0, brs.length - 1)].id
    }
    // 关联随机分类
    if (cats.length > 0) {
      rec.main_category_id = cats[randInt(0, cats.length - 1)].id
    }
    prods.push(rec)
  }
  dataset.set('products', prods)

  // 5. 单价（关联产品和渠道）
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

  // 6. 库存（关联产品和渠道）
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

  // 7. 客户
  const custs: Record<string, string | number | null>[] = []
  for (let i = 1; i <= counts.customers; i++) {
    custs.push(generateRecord('customers', i)!)
  }
  dataset.set('customers', custs)

  // 8. 供应商
  const supps: Record<string, string | number | null>[] = []
  for (let i = 1; i <= counts.suppliers; i++) {
    supps.push(generateRecord('suppliers', i)!)
  }
  dataset.set('suppliers', supps)

  // 9. 销售订单（关联客户和渠道）
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

  // 10. 订单明细（每个订单 1-3 条明细）
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

  // 11. 发票（每个订单一张）
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

  // 12. 支付（关联发票和客户）
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

  // 13. 采购订单（关联供应商）
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

  // 14. 采购发票（关联采购订单和供应商）
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
