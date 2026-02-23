# 🔌 后端 API 调用场景详解

## 📋 目录
- [总览](#总览)
- [认证场景](#认证场景)
- [订单场景](#订单场景)
- [客户场景](#客户场景)
- [产品场景](#产品场景)
- [库存场景](#库存场景)
- [报表场景](#报表场景)
- [API 端点汇总](#api-端点汇总)

---

## 🎯 总览

### 数据读取 vs 数据写入

```
┌─────────────────────────────────────────────────────────────┐
│                      数据操作分类                            │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  📖 读取操作（查询、列表、搜索）                             │
│     ✅ 直接查询本地 SQLite（PowerSync）                      │
│     ✅ 无需调用后端 API                                       │
│     ✅ 离线可用                                               │
│     ✅ 极快（5-20ms）                                         │
│                                                               │
│  ✏️ 写入操作（创建、修改、删除）                             │
│     ❌ 必须调用后端 API                                       │
│     ❌ 需要网络连接                                           │
│     ⏱️ 较慢（200-500ms）                                      │
│     ✅ 写入后自动同步到本地                                   │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔐 认证场景

### 1. 登录
**文件**: `app/login.tsx`
**API**: `POST /tenant/api/v1/core/user/authenticate`

```typescript
// utils/api/auth.ts
export async function login(credentials: LoginCredentials) {
  const response = await khubApi.post(
    '/tenant/api/v1/core/user/authenticate',
    {
      username: credentials.username,
      password: credentials.password,
      login_pin: credentials.login_pin
    }
  );
  
  const { access_token, refresh_token, user } = response.data.entity;
  
  // 存储 token 到本地
  await AsyncStorage.setItem('khub_access_token', access_token);
  await AsyncStorage.setItem('khub_refresh_token', refresh_token);
  
  return { user };
}
```

**调用时机**:
- 用户在登录页面输入用户名和密码/PIN
- 点击 "Login" 按钮

**返回数据**:
- `access_token` - 访问令牌
- `refresh_token` - 刷新令牌
- `user` - 用户信息（id, username, permissions, roles）

---

### 2. Token 刷新
**自动触发**: 当 API 返回 401 时
**API**: `POST /tenant/api/v1/core/user/authenticate/refresh`

```typescript
// utils/api/khub.ts (自动拦截器)
khubApi.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // 自动刷新 token
      const refreshToken = await AsyncStorage.getItem('khub_refresh_token');
      const response = await axios.post(
        '/tenant/api/v1/core/user/authenticate/refresh',
        {},
        { headers: { Authorization: `Bearer ${refreshToken}` } }
      );
      
      // 更新 token 并重试原请求
      const { access_token } = response.data.entity;
      await AsyncStorage.setItem('khub_access_token', access_token);
      
      // 重试原请求
      return khubApi(originalRequest);
    }
  }
);
```

---

### 3. 获取当前用户信息
**API**: `GET /tenant/api/v1/core/user/me`

```typescript
export async function getCurrentUser() {
  const response = await khubApi.get('/tenant/api/v1/core/user/me');
  return response.data.entity;
}
```

---

## 🛒 订单场景

### 1. 创建订单（完成支付）
**文件**: `app/order/add-products.tsx`
**API**: `POST /tenant/api/v1/sale/order`

```typescript
// 场景：用户扫码添加产品后，点击 "Cash Payment" 完成支付
const handleCashPaymentConfirm = async (amountReceived: number) => {
  const payload = {
    sale_order_details: products.map(p => ({
      product_id: parseInt(p.productId, 10),
      qty: p.quantity,
      unit: 1,
      unit_price: p.salePrice,
      discount: 0,
      discount_type: 1
    })),
    customer_id: order.customerId ? parseInt(order.customerId, 10) : null,
    order_type: 1,        // 1=Walk-in
    sale_type: 1,         // 1=Order
    shipping_type: 1,     // 1=Pickup
    channel_id: 1,
    order_date: new Date().toISOString(),
    dispatch_date: new Date().toISOString(),
    due_date: new Date().toISOString(),
    discount: order.additionalDiscount,
    discount_type: 1,
    delivery_charges: 0,
    payment_detail: {
      payments: [{
        payment_type: 1,  // 1=Cash
        amount: amountReceived,
        category: 1       // 1=SALE_RECEIPT
      }],
      collected_by_id: user.id,
      payment_date: new Date().toISOString()
    }
  };
  
  // ❌ 调用后端 API
  const response = await createSaleOrder(payload);
  
  // ✅ 后端写入 PostgreSQL
  // ✅ PowerSync 自动同步到本地
  // ✅ useSaleOrders() 自动更新
};
```

**调用时机**:
- 用户点击 "Cash Payment" 按钮
- 输入收款金额
- 点击 "Confirm" 确认支付

**返回数据**:
- 完整的订单信息（order_id, order_no, invoice, etc.）

---

### 2. 暂存订单（Park Order）
**文件**: `app/order/add-products.tsx`
**API**: `POST /tenant/api/v1/sale/order` (with `is_parked: true`)

```typescript
// contexts/ParkedOrderContext.tsx
const parkOrder = async (order: OrderState, parkedBy: string, note?: string) => {
  const payload = {
    is_parked: true,              // ⚠️ 关键标志
    is_zero_tax_allowed: true,
    sale_order_details: order.products.map(p => ({
      product_id: parseInt(p.productId, 10),
      qty: p.quantity,
      unit: 1,
      unit_price: p.salePrice,
      discount: 0,
      discount_type: 1,
      sale_type: 1
    })),
    customer_id: order.customerId ? parseInt(order.customerId, 10) : null,
    order_type: 1,
    sale_type: 1,
    shipping_type: 1,
    channel_id: 1,
    order_date: new Date().toISOString(),
    dispatch_date: new Date().toISOString(),
    due_date: new Date().toISOString(),
    discount: order.additionalDiscount || 0,
    discount_type: 1,
    delivery_charges: 0
  };
  
  // ❌ 调用后端 API
  await khubApi.post('/tenant/api/v1/sale/order', payload);
  
  // ✅ 订单保存为 "暂存" 状态
  // ✅ PowerSync 同步到本地
  // ✅ useParkedOrders() 自动显示
};
```

**调用时机**:
- 用户点击 "Park Order" 按钮
- 输入备注（可选）
- 点击 "Confirm" 确认暂存

**特点**:
- 订单保存但未支付
- 可以稍后恢复继续处理

---

### 3. 删除暂存订单
**文件**: `app/sale/parked-orders.tsx`
**API**: `DELETE /tenant/api/v1/sale/order/{id}`

```typescript
// contexts/ParkedOrderContext.tsx
const deleteParkedOrder = async (id: string) => {
  // ❌ 调用后端 API
  await khubApi.delete(`/tenant/api/v1/sale/order/${id}`);
  
  // ✅ PowerSync 自动同步删除
  // ✅ useParkedOrders() 自动更新列表
};
```

**调用时机**:
- 用户在 "Parked Orders" 页面点击删除按钮

---

### 4. 获取订单详情
**文件**: `app/order/add-products.tsx`
**API**: `GET /tenant/api/v1/sale/order/{id}`

```typescript
// utils/api/orders.ts
export async function getSaleOrderById(saleOrderId: number) {
  // ❌ 调用后端 API（获取完整订单详情，包括产品、支付、发票）
  return khubApi.get(`/tenant/api/v1/sale/order/${saleOrderId}`, {
    params: {
      edit: 1,
      include_main_category: 1,
      include_transferable_qty: 1
    }
  });
}
```

**调用时机**:
- 恢复暂存订单时
- 查看订单详情时

**为什么需要调用 API？**
- PowerSync 只同步基础订单信息
- 完整的订单详情（产品列表、支付记录、发票）需要从后端获取

---

## 👥 客户场景

### 1. 创建快速客户
**文件**: `components/AddQuickCustomerModal.tsx`
**API**: `POST /tenant/api/v1/sale/customers`

```typescript
// utils/api/customers.ts
export async function createQuickCustomer(customer: QuickCustomerPayload) {
  // ❌ 调用后端 API
  return khubApi.post('/tenant/api/v1/sale/customers', {
    business_name: customer.business_name,
    email: customer.email,
    business_phone_no: customer.business_phone_no,
    class_of_trades: customer.class_of_trades,
    customer_type: customer.customer_type,
    sale_agent_obj: customer.sale_agent_obj,
    is_active: true,
    balance_limit_check: false,
    invoice_aging: 0,
    allow_ecom: 'N'
  });
}
```

**调用时机**:
- 用户在 Sales 页面点击 "Add Customer"
- 填写客户信息
- 点击 "Save" 保存

**数据流**:
```
UI → API → PostgreSQL → PowerSync → 本地 SQLite → useCustomers() → UI 自动更新
```

---

### 2. 更新客户
**文件**: `app/sale/customers.tsx`
**API**: `PUT /tenant/api/v1/sale/customers/{id}`

```typescript
export async function updateCustomer(customer: Partial<QuickCustomerPayload>, customerId: number) {
  // ❌ 调用后端 API
  return khubApi.put(`/tenant/api/v1/sale/customers/${customerId}`, customer);
}
```

**调用时机**:
- 用户在客户列表页面编辑客户信息

---

### 3. 获取销售代表列表
**文件**: `components/AddQuickCustomerModal.tsx`
**API**: `GET /tenant/api/v1/core/user/list?assign_customer=1`

```typescript
export async function fetchSalesReps() {
  // ❌ 调用后端 API（这个数据不在 PowerSync 中）
  return khubApi.get('/tenant/api/v1/core/user/list', {
    params: { assign_customer: 1 }
  });
}
```

**调用时机**:
- 打开 "Add Customer" 弹窗时
- 加载销售代表下拉列表

**为什么需要调用 API？**
- 销售代表列表不在 PowerSync 同步范围内
- 需要实时获取最新的用户列表

---

## 📦 产品场景

### 1. 创建产品
**文件**: `app/catalog/add-product.tsx`
**API**: `POST /tenant/api/v1/catalog/products`

```typescript
// utils/api/products.ts
export async function createProduct(product: ProductPayload) {
  // ❌ 调用后端 API
  return khubApi.post('/tenant/api/v1/catalog/products', {
    name: product.name,
    sku: product.sku,
    upc: product.upc,
    brand_id: product.brand_id,
    main_category_id: product.main_category_id,
    channel_info: product.channel_info,  // 包含价格、库存等
    images: product.images,
    // ... 其他字段
  });
}
```

**调用时机**:
- 用户在 "Add Product" 页面填写产品信息
- 点击 "Save" 保存

**Payload 包含**:
- 基础信息（name, sku, upc, description）
- 分类和品牌
- 多渠道价格和库存（channel_info）
- 图片和 SEO 信息

---

### 2. 更新产品
**文件**: `app/catalog/add-product.tsx`
**API**: `PUT /tenant/api/v1/catalog/products/{id}`

```typescript
export async function updateProduct(product: ProductPayload) {
  // ❌ 调用后端 API
  return khubApi.put(`/tenant/api/v1/catalog/products/${product.id}`, product);
}
```

**调用时机**:
- 用户在产品列表页面编辑产品
- 修改价格、库存、描述等

---

### 3. 删除产品
**API**: `DELETE /tenant/api/v1/catalog/products/{id}`

```typescript
export async function deleteProduct(productId: number) {
  // ❌ 调用后端 API
  return khubApi.delete(`/tenant/api/v1/catalog/products/${productId}`);
}
```

---

### 4. 生成 SKU
**文件**: `app/catalog/add-product.tsx`
**API**: `GET /tenant/api/v1/catalog/products/generate-sku`

```typescript
export async function generateSku() {
  // ❌ 调用后端 API（需要后端生成唯一 SKU）
  const response = await khubApi.get('/tenant/api/v1/catalog/products/generate-sku');
  return response.data.sku;
}
```

**调用时机**:
- 用户在 "Add Product" 页面勾选 "Auto Generate SKU"

---

### 5. 检查 UPC 是否存在
**文件**: `app/catalog/add-product.tsx`
**API**: `POST /tenant/api/v1/catalog/products/upc-exists`

```typescript
export async function checkUpcExists(upc: string) {
  // ❌ 调用后端 API（需要后端验证唯一性）
  const response = await khubApi.post('/tenant/api/v1/catalog/products/upc-exists', {
    product_upc: upc
  });
  return response.data.exists;
}
```

**调用时机**:
- 用户输入 UPC 后失去焦点时
- 验证 UPC 是否重复

---

### 6. 通过 UPC 获取产品图片
**文件**: `app/catalog/add-product.tsx`
**API**: `POST /tenant/api/v1/catalog/products/upc-image`

```typescript
export async function getImageByUpc(upc: string) {
  // ❌ 调用后端 API（后端调用第三方 API 获取图片）
  const response = await khubApi.post('/tenant/api/v1/catalog/products/upc-image', {
    upc
  });
  return response.data.image_url;
}
```

**调用时机**:
- 用户勾选 "Auto Fetch Image"
- 输入 UPC 后自动获取产品图片

---

### 7. AI 生成产品描述
**API**: `POST /tenant/api/v1/catalog/products/product-description`

```typescript
export async function generateProductDescription(params: {
  product_name: string;
  brand_name?: string;
  main_category_id?: number;
}) {
  // ❌ 调用后端 API（后端调用 AI 服务）
  const response = await khubApi.post(
    '/tenant/api/v1/catalog/products/product-description',
    params
  );
  return response.data.description;
}
```

**调用时机**:
- 用户点击 "Generate Description" 按钮

---

### 8. 创建分类
**API**: `POST /tenant/api/v1/catalog/categories`

```typescript
export async function createCategory(payload: {
  name: string;
  parent_id?: number;
  code?: string;
  is_msa_compliant: boolean;
  visible_on_ecom: boolean;
}) {
  // ❌ 调用后端 API
  return khubApi.post('/tenant/api/v1/catalog/categories', payload);
}
```

---

## 📊 库存场景

### 1. 批量更新库存
**文件**: `app/inventory/stocks.tsx`
**API**: `POST /tenant/api/v1/catalog/products/bulk_update_stock`

```typescript
// utils/api/stocks.ts
export async function bulkUpdateStocks(payload: BulkStockUpdateItem[]) {
  // ❌ 调用后端 API
  return khubApi.post('/tenant/api/v1/catalog/products/bulk_update_stock', payload);
}

// 使用场景
const handleBulkUpdate = async () => {
  const updates = selectedRows.map(row => ({
    product_id: row.productId,
    channel_id: 1,
    available_qty: row.inHand,
    on_hold_qty: row.onHold,
    back_order_qty: row.backOrder,
    hold_free_shipment: 0,
    stock_qty_data: {}
  }));
  
  // ❌ 调用后端 API
  await bulkUpdateStocks(updates);
  
  // ✅ PowerSync 自动同步
  // ✅ useStocks() 自动更新
};
```

**调用时机**:
- 用户在库存页面选择多个产品
- 点击 "Bulk Update" 按钮
- 修改库存数量

---

### 2. 获取单个产品库存详情
**API**: `GET /tenant/api/v1/inventory/stocks/get?product_id={id}`

```typescript
export async function getStockByProductId(productId: number) {
  // ❌ 调用后端 API（获取多渠道库存详情）
  const response = await khubApi.get('/tenant/api/v1/inventory/stocks/get', {
    params: { product_id: productId }
  });
  return response.data.entity[0];
}
```

**调用时机**:
- 编辑产品时需要查看多渠道库存详情

---

### 3. 更新库存
**API**: `POST /tenant/api/v1/inventory/stocks/update`

```typescript
export async function updateStocks(payload: UpdateStockPayload) {
  // ❌ 调用后端 API
  return khubApi.post('/tenant/api/v1/inventory/stocks/update', {
    product_id: payload.product_id,
    channel_info: payload.channel_info
  });
}
```

---

## 📈 报表场景

### ⚠️ 特殊说明：报表数据的两种方式

```
┌─────────────────────────────────────────────────────────────┐
│  方式 1: PowerSync 同步（已实现）                            │
│  ✅ 优点：离线可用，极快                                      │
│  ❌ 缺点：数据可能不是最新的（取决于同步频率）                │
│                                                               │
│  使用场景：                                                   │
│  - Customer Velocity Report (useCustomerVelocityReport)     │
│  - Brand Velocity Report (useBrandVelocityReport)           │
│  - Category Velocity Report (useCategoryVelocityReport)     │
│  - Customer Sales Report (useCustomerSalesReport)           │
│                                                               │
│  数据流：                                                     │
│  本地 SQLite → useSyncStream() → UI                          │
│                                                               │
├─────────────────────────────────────────────────────────────┤
│  方式 2: 实时 API 调用（可选）                               │
│  ✅ 优点：数据绝对最新                                        │
│  ❌ 缺点：需要网络，较慢，离线不可用                          │
│                                                               │
│  使用场景：                                                   │
│  - 导出报表（CSV/PDF）                                       │
│  - 实时聚合报表（需要最新数据）                               │
│                                                               │
│  数据流：                                                     │
│  UI → API → PostgreSQL 实时查询 → 返回结果                   │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

### 报表 API 端点（30+ 个）

**销售报表** (`/tenant/api/v1/report/sale/order`):
```typescript
// 1. Sales Summary / Sale Commission
fetchSalesSummary(params)           // GET /product_sales
exportSalesSummary(body, params)    // POST /product_sales/export

// 2. Item Velocity
fetchItemVelocity(params)           // GET /product_velocity
exportItemVelocity(body, params)    // POST /product_velocity/export

// 3. Customer Velocity
fetchCustomerVelocity(params)       // GET /velocity/price-cost
exportCustomerVelocity(body, params)// POST /velocity/price-cost/export

// 4. Detail Sale / Items Detail
fetchDetailSale(params)             // GET /products_sale_detail
exportDetailSale(body, params)      // POST /products_sale_detail/export

// 5. Brand Velocity
fetchBrandVelocity(params)          // GET /brand_velocity
exportBrandVelocity(body, params)   // POST /brand_velocity/export

// 6. Category Velocity
fetchCategoryVelocity(params)       // GET /category_price
exportCategoryVelocity(body, params)// POST /category_price/export

// 7. Customer Brand Velocity
fetchCustomerBrandVelocity(params)
exportCustomerBrandVelocity(body, params)

// 8. Customer Category Velocity
fetchCustomerCategoryVelocity(params)
exportCustomerCategoryVelocity(body, params)

// 9. Customer Product Velocity
fetchCustomerProductVelocity(params)
exportCustomerProductVelocity(body, params)

// 10. Customer Category Sales
fetchCustomerCategorySales(params)
exportCustomerCategorySales(body, params)

// 11. Sales Rep Category
fetchSalesRepCategory(params)
exportSalesRepCategory(body, params)

// 12. Sales Rep Product
fetchSalesRepProduct(params)
exportSalesRepProduct(body, params)

// 13. Sales Rep Brand
fetchSalesRepBrand(params)
exportSalesRepBrand(body, params)

// 14. Lost Sale
fetchLostSale(params)
exportLostSale(body, params)

// 15. Invoice History
fetchInvoiceHistory(params)
exportInvoiceHistory(body, params)

// 16. Customer Invoice Aging
fetchAgingReport(params)
exportAgingReport(body, params)
```

**财务报表** (`/tenant/api/v1/report/sale/finance`):
```typescript
fetchPaymentReceived(params)        // 收款报表
fetchAccountReceivable(params)      // 应收账款
fetchPaymentLog(params)             // 支付日志
fetchAccountPayable(params)         // 应付账款
fetchDaySummary(params)             // 日汇总
fetchProfitMarginAccrual(params)    // 利润率（权责发生制）
fetchProfitMarginCash(params)       // 利润率（现金制）
```

**库存报表** (`/tenant/api/v1/report/inv/stock`):
```typescript
fetchInventoryValuation(params)     // 库存估值
fetchBackOrder(params)              // 缺货订单
fetchInventoryAdjustment(params)    // 库存调整
fetchInventorySpotCheck(params)     // 库存抽查
fetchOnHold(params)                 // 冻结库存
fetchPartiallyFulfilled(params)     // 部分履行
```

**采购报表** (`/tenant/api/v1/report/inv/purchase-order`):
```typescript
fetchSupplierPOReport(params)       // 供应商采购订单
fetchPurchaseReceivedHistory(params)// 采购收货历史
fetchSupplierPaymentLog(params)     // 供应商付款日志
```

**合规报表**:
```typescript
fetchCaliforniaCigarette()          // 加州香烟报表
fetchKentuckyTobaccoTax()           // 肯塔基烟草税
fetchKentuckyCigaretteTax()         // 肯塔基香烟税
```

**调用时机**:
- 用户点击报表页面的 "Export" 按钮
- 需要导出 CSV 或 PDF 文件

**为什么需要调用 API？**
- 报表需要实时聚合计算
- 数据量大，不适合在客户端计算
- 导出功能需要后端生成文件

---

## 🔍 其他场景

### 1. 获取促销活动
**API**: `GET /tenant/api/v1/marketing/promotions/list?product_ids={id}`

```typescript
export async function fetchPromotionsByProductId(productId: number) {
  // ❌ 调用后端 API（促销数据复杂，需要实时计算）
  return khubApi.get('/tenant/api/v1/marketing/promotions/list', {
    params: { product_ids: String(productId) }
  });
}
```

**调用时机**:
- 查看产品详情时
- 显示当前促销活动

---

### 2. 获取渠道列表
**API**: `GET /tenant/api/v1/inventory/channel/list`

```typescript
export async function fetchChannels() {
  // ❌ 调用后端 API（渠道列表不在 PowerSync 中）
  return khubApi.get('/tenant/api/v1/inventory/channel/list');
}
```

**调用时机**:
- 添加/编辑产品时
- 需要选择销售渠道

---

### 3. 获取品牌/供应商/制造商/标签列表
**API**: 
- `GET /tenant/api/v1/catalog/brands/list`
- `GET /tenant/api/v1/inventory/suppliers/list`
- `GET /tenant/api/v1/catalog/manufacturers/list`
- `GET /tenant/api/v1/catalog/tags/list`

```typescript
export async function fetchBrands() {
  // ❌ 调用后端 API（这些列表不在 PowerSync 中）
  return khubApi.get('/tenant/api/v1/catalog/brands/list');
}
```

**调用时机**:
- 添加/编辑产品时
- 需要选择品牌、供应商等

**为什么需要调用 API？**
- 这些列表数据不在 PowerSync 同步范围内
- 或者需要特定的筛选条件

---

## 📊 API 端点汇总

### 按功能分类

| 功能模块 | API 数量 | 主要端点 |
|---------|---------|---------|
| **认证** | 3 | `/core/user/authenticate`, `/authenticate/refresh`, `/user/me` |
| **订单** | 3 | `/sale/order` (POST/GET/DELETE) |
| **客户** | 4 | `/sale/customers` (POST/PUT/GET), `/core/user/list` |
| **产品** | 8 | `/catalog/products` (CRUD), `/generate-sku`, `/upc-exists`, `/upc-image`, `/product-description` |
| **库存** | 3 | `/products/bulk_update_stock`, `/stocks/get`, `/stocks/update` |
| **分类/品牌** | 5 | `/categories`, `/brands/list`, `/suppliers/list`, `/manufacturers/list`, `/tags/list` |
| **促销** | 1 | `/marketing/promotions/list` |
| **报表** | 30+ | `/report/sale/*`, `/report/inv/*`, `/report/msa/*` |
| **渠道** | 1 | `/inventory/channel/list` |

### 按调用频率分类

| 频率 | 场景 | 端点 |
|------|------|------|
| **极高** | 每次订单 | `/sale/order` (POST) |
| **高** | 添加客户 | `/sale/customers` (POST) |
| **中** | 编辑产品 | `/catalog/products` (PUT) |
| **低** | 导出报表 | `/report/*/export` |
| **极低** | 生成 SKU | `/products/generate-sku` |

---

## 🎯 实际使用场景

### 场景 1: 完成一笔销售

```
1. 用户扫码添加产品
   ✅ 查询本地 SQLite（useProducts）
   ❌ 不调用后端

2. 用户点击 "Cash Payment"
   ❌ 调用 POST /sale/order
   ✅ 创建订单

3. 订单列表自动更新
   ✅ PowerSync 自动同步
   ✅ useSaleOrders() 自动更新
   ❌ 不需要手动刷新
```

---

### 场景 2: 添加新产品

```
1. 用户打开 "Add Product" 页面
   ❌ 调用 GET /catalog/brands/list
   ❌ 调用 GET /catalog/categories/list
   ❌ 调用 GET /inventory/suppliers/list
   ✅ 加载下拉列表选项

2. 用户勾选 "Auto Generate SKU"
   ❌ 调用 GET /products/generate-sku
   ✅ 获取唯一 SKU

3. 用户输入 UPC
   ❌ 调用 POST /products/upc-exists
   ✅ 验证 UPC 唯一性

4. 用户勾选 "Auto Fetch Image"
   ❌ 调用 POST /products/upc-image
   ✅ 获取产品图片

5. 用户点击 "Save"
   ❌ 调用 POST /catalog/products
   ✅ 创建产品

6. 产品列表自动更新
   ✅ PowerSync 自动同步
   ✅ useProducts() 自动更新
```

---

### 场景 3: 查看库存列表

```
1. 用户打开 "Stocks" 页面
   ✅ 查询本地 SQLite（useStocks）
   ❌ 不调用后端
   ✅ 立即显示数据（5-20ms）

2. 用户搜索产品
   ✅ 本地 SQL 查询（WHERE name LIKE '%query%'）
   ❌ 不调用后端

3. 用户筛选分类
   ✅ 本地 SQL 查询（WHERE category_id = ?）
   ❌ 不调用后端

4. 用户翻页
   ✅ 本地 SQL 查询（LIMIT/OFFSET）
   ❌ 不调用后端
```

---

### 场景 4: 暂存订单

```
1. 用户扫码添加产品
   ✅ 查询本地 SQLite
   ❌ 不调用后端

2. 用户点击 "Park Order"
   ❌ 调用 POST /sale/order (is_parked: true)
   ✅ 保存暂存订单

3. 用户打开 "Parked Orders" 页面
   ✅ 查询本地 SQLite（useParkedOrders）
   ❌ 不调用后端

4. 用户恢复暂存订单
   ✅ 从本地 SQLite 读取
   ❌ 不调用后端

5. 用户删除暂存订单
   ❌ 调用 DELETE /sale/order/{id}
   ✅ 删除订单
```

---

## 📊 统计数据

### API 调用频率（估算）

**每天调用次数**（假设 100 笔订单/天）:

| 场景 | 每天调用次数 | 占比 |
|------|-------------|------|
| 创建订单 | ~100 | 40% |
| 暂存订单 | ~20 | 8% |
| 添加客户 | ~10 | 4% |
| 编辑产品 | ~5 | 2% |
| 更新库存 | ~10 | 4% |
| 导出报表 | ~5 | 2% |
| 其他 | ~100 | 40% |
| **总计** | **~250** | **100%** |

**对比传统方式**（每个页面都调用 API）:

| 操作 | 传统方式 | PowerSync 方式 |
|------|---------|---------------|
| 查看客户列表 | ~500 次/天 | 0 次/天 |
| 搜索产品 | ~1000 次/天 | 0 次/天 |
| 查看订单历史 | ~200 次/天 | 0 次/天 |
| 查看库存 | ~300 次/天 | 0 次/天 |
| **总计** | **~2000 次/天** | **~250 次/天** |

**节省**: **87.5%** 的 API 调用

---

## 🚀 性能对比

### 读取操作

| 场景 | 传统 API | PowerSync |
|------|---------|-----------|
| 查看客户列表 | 200-500ms | 5-20ms |
| 搜索产品 | 300-800ms | 10-30ms |
| 查看订单历史 | 400-1000ms | 15-40ms |
| 筛选库存 | 500-1500ms | 20-50ms |

**速度提升**: **10-50 倍**

### 写入操作

| 场景 | 时间 | 说明 |
|------|------|------|
| 创建订单 | 200-500ms | 需要后端验证和处理 |
| 添加客户 | 150-300ms | 需要后端验证唯一性 |
| 更新产品 | 200-400ms | 需要后端处理多渠道数据 |

---

## 💡 最佳实践

### 1. 优先使用 PowerSync

```typescript
// ✅ 好的做法：直接查询本地数据
const { customers } = useCustomers();

// ❌ 不好的做法：调用 API 获取列表
const customers = await khubApi.get('/sale/customers/list');
```

---

### 2. 写入后自动同步

```typescript
// ✅ 好的做法：写入后等待 PowerSync 同步
await khubApi.post('/sale/order', orderData);
// PowerSync 自动同步，UI 自动更新

// ❌ 不好的做法：手动刷新
await khubApi.post('/sale/order', orderData);
await fetchOrders(); // 不需要手动刷新
```

---

### 3. 离线处理

```typescript
// ✅ 好的做法：检查网络状态
const handleCreateOrder = async () => {
  if (!isConnected) {
    Alert.alert('Offline', 'Cannot create order while offline');
    return;
  }
  
  await khubApi.post('/sale/order', orderData);
};

// ✅ 离线时仍可查看数据
const { customers } = useCustomers(); // 即使离线也能工作
```

---

## 📝 总结

### 需要调用后端 API 的场景（~10%）

1. **认证**: 登录、刷新 token
2. **创建**: 订单、客户、产品
3. **修改**: 更新产品、库存、客户
4. **删除**: 删除订单、产品
5. **特殊功能**: 生成 SKU、获取图片、AI 描述
6. **导出**: 导出报表（CSV/PDF）
7. **实时聚合**: 某些需要最新数据的报表

### 不需要调用后端的场景（~90%）

1. **查看列表**: 客户、产品、订单、库存
2. **搜索**: 任何表格的搜索功能
3. **筛选**: 任何表格的筛选功能
4. **分页**: 任何表格的翻页功能
5. **排序**: 任何表格的排序功能
6. **查看详情**: 大部分详情页面
7. **报表查看**: 大部分报表（使用 PowerSync 同步的数据）

---

## 🎯 关键优势

1. **速度**: 读取操作快 10-50 倍
2. **离线**: 90% 的功能离线可用
3. **服务器负载**: 减少 87.5% 的 API 调用
4. **用户体验**: 即时响应，无等待
5. **成本**: 减少服务器带宽和计算成本
