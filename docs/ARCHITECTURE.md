# 🏗️ App 架构文档

## 📋 目录
- [整体架构](#整体架构)
- [数据流](#数据流)
- [后端 API](#后端-api)
- [PowerSync 同步](#powersync-同步)
- [页面架构](#页面架构)
- [组件层级](#组件层级)

---

## 🎯 整体架构

```
┌─────────────────────────────────────────────────────────────────┐
│                         React Native App                         │
│                                                                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │   UI Layer   │  │  Business    │  │    Data      │          │
│  │  (Screens)   │←→│   Logic      │←→│   Layer      │          │
│  │              │  │  (Contexts)  │  │  (Hooks)     │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
│         ↑                                    ↓                   │
│         │                          ┌─────────────────┐          │
│         │                          │  PowerSync DB   │          │
│         │                          │  (SQLite Local) │          │
│         │                          └─────────────────┘          │
└─────────────────────────────────────────────────────────────────┘
                                             ↕
                                    ┌────────────────┐
                                    │  PowerSync     │
                                    │  Server        │
                                    │  (Sync Layer)  │
                                    └────────────────┘
                                             ↕
                                    ┌────────────────┐
                                    │  KHUB Backend  │
                                    │  (Python API)  │
                                    │  PostgreSQL    │
                                    └────────────────┘
```

---

## 🔄 数据流

### 1. **读取数据流** (实时同步)

```
PostgreSQL (Backend)
    ↓
PowerSync Server (监听数据库变化)
    ↓
PowerSync Rules (sync_rules.yaml - 定义同步规则)
    ↓
React Native App (PowerSync Client)
    ↓
SQLite Local DB (本地缓存)
    ↓
useSyncStream Hook (实时查询)
    ↓
React Component (UI 自动更新)
```

**示例代码**：
```typescript
// 1. PowerSync Hook 查询本地 SQLite
const { data, isLoading } = useSyncStream<ProductJoinRow>(
  `SELECT p.*, up.price FROM products p 
   LEFT JOIN unit_prices up ON p.id = up.product_id`,
  []
);

// 2. 数据自动转换为 UI 格式
const products = useMemo(() => data.map(toProductView), [data]);

// 3. UI 自动更新（无需手动刷新）
return <DataTable data={products} />;
```

### 2. **写入数据流** (API 调用)

```
React Component (用户操作)
    ↓
khubApi.post/put/delete (HTTP 请求)
    ↓
KHUB Backend API (处理业务逻辑)
    ↓
PostgreSQL (写入数据库)
    ↓
PowerSync Server (检测到变化)
    ↓
自动同步到所有客户端
    ↓
本地 SQLite 更新
    ↓
UI 自动刷新
```

**示例代码**：
```typescript
// 1. 调用后端 API 创建订单
await khubApi.post('/tenant/api/v1/sale/order', payload);

// 2. 后端写入 PostgreSQL

// 3. PowerSync 自动同步到本地 SQLite

// 4. useSaleOrders() hook 自动返回新数据

// 5. UI 自动更新（无需手动刷新）
```

---

## 🔌 后端 API

### API 配置
```typescript
// utils/api/khub.ts
const KHUB_API_URL = process.env.EXPO_PUBLIC_KHUB_API_URL;
// 默认: http://192.168.1.174:5002

const khubApi = axios.create({
  baseURL: KHUB_API_URL,
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' }
});
```

### 认证流程
```
1. Login (POST /tenant/api/v1/core/user/authenticate)
   ↓
2. 获取 access_token + refresh_token
   ↓
3. 存储到 AsyncStorage
   ↓
4. 每次请求自动附加 Bearer Token
   ↓
5. Token 过期时自动刷新
```

### 主要 API 端点

| 功能 | 端点 | 方法 | 用途 |
|------|------|------|------|
| **认证** | `/core/user/authenticate` | POST | 登录 |
| **订单** | `/sale/order` | POST | 创建订单 |
| **订单** | `/sale/order/{id}` | GET | 获取订单详情 |
| **订单** | `/sale/order/{id}` | DELETE | 删除订单 |
| **产品** | `/product` | GET | 获取产品列表 |
| **客户** | `/customer` | POST | 创建客户 |

---

## 🔄 PowerSync 同步

### PowerSync 架构

```
┌─────────────────────────────────────────────────────────────┐
│                    PowerSync 工作流程                        │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  1. 初始化 (App 启动时)                                      │
│     ↓                                                         │
│     PowerSyncDatabase.connect(KhubConnector)                 │
│     ↓                                                         │
│     创建本地 SQLite: ititans-powersync.db                    │
│                                                               │
│  2. 首次同步 (Full Sync)                                     │
│     ↓                                                         │
│     下载所有表数据到本地                                      │
│     ↓                                                         │
│     products, customers, orders, stocks, etc.                │
│                                                               │
│  3. 实时同步 (Incremental Sync)                              │
│     ↓                                                         │
│     监听 PostgreSQL 变化 (通过 sync_rules.yaml)             │
│     ↓                                                         │
│     自动下载增量更新                                          │
│     ↓                                                         │
│     更新本地 SQLite                                           │
│     ↓                                                         │
│     触发 useSyncStream 重新查询                              │
│     ↓                                                         │
│     UI 自动更新                                               │
│                                                               │
│  4. 离线支持                                                  │
│     ↓                                                         │
│     断网时继续使用本地数据                                    │
│     ↓                                                         │
│     联网后自动同步                                            │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

### PowerSync 配置

**Schema 定义** (`utils/powersync/schema.ts`):
```typescript
const products = new Table({
  name: column.text,
  sku: column.text,
  upc: column.text,
  price: column.real,
  // ...
});

export const AppSchema = new Schema({
  products,
  customers,
  orders,
  stocks,
  // ... 20+ 表
});
```

**Sync Rules** (后端 `sync_rules.yaml`):
```yaml
streams:
  products:
    auto_subscribe: true
    query: "SELECT * FROM products WHERE deleted_at IS NULL"
  
  customers:
    auto_subscribe: true
    query: "SELECT * FROM customers"
  
  # ... 其他表
```

### PowerSync Hooks

**基础 Hook** (`useSyncStream`):
```typescript
// 实时查询本地 SQLite
const { data, isLoading, isStreaming } = useSyncStream<T>(
  sql,      // SQL 查询
  params,   // 参数
  options   // 配置
);
```

**业务 Hooks** (封装 useSyncStream):
```typescript
// utils/powersync/hooks/useProducts.ts
export function useProducts() {
  const { data, isLoading } = useSyncStream<ProductJoinRow>(
    `SELECT p.*, up.price, c.name AS category_name
     FROM products p
     LEFT JOIN unit_prices up ON p.id = up.product_id
     LEFT JOIN categories c ON p.main_category_id = c.id
     ORDER BY p.name ASC`,
    []
  );
  
  return {
    products: data.map(toProductView),
    isLoading
  };
}
```

---

## 📱 页面架构

### 页面分类

#### 1. **POS 页面** (实时交易)
- `/order/add-products` - Sales 页面
  - **数据源**: OrderContext (内存状态)
  - **同步**: 提交订单时调用 API
  - **特点**: 不依赖 PowerSync，纯内存操作

- `/pos-line` - POS Line 页面
  - **数据源**: 本地 state
  - **同步**: 提交订单时调用 API

#### 2. **数据管理页面** (PowerSync 实时同步)

**库存管理**:
- `/inventory/stocks` - 库存列表
  - **Hook**: `useStocks()`
  - **表**: `stocks` + `products`
  - **特点**: 支持分页、筛选、实时同步

- `/inventory/stock-alerts` - 库存警报
  - **数据**: 示例数据 (待实现)

**销售管理**:
- `/sale/sales-history` - 销售历史
  - **Hook**: `useSaleOrders()`
  - **表**: `sale_orders` + `sale_order_details`
  - **特点**: 实时订单列表

- `/sale/parked-orders` - 暂存订单
  - **Hook**: `useParkedOrders()`
  - **表**: `sale_orders` (is_parked = true)

- `/sale/customers` - 客户列表
  - **Hook**: `useCustomers()`
  - **表**: `customers`

- `/sale/payments-history` - 支付历史
  - **Hook**: `usePayments()`
  - **表**: `payments`

**产品管理**:
- `/catalog/products` - 产品列表
  - **Hook**: `useProducts()`
  - **表**: `products` + `unit_prices` + `categories`

**报表**:
- `/report/customer-velocity-yoy` - 客户速度报表
  - **Hook**: `useCustomerVelocityReport()`
  - **表**: `customer_velocity_report`

- `/report/brand-velocity` - 品牌速度报表
  - **Hook**: `useBrandVelocityReport()`
  - **表**: `brand_velocity_report`

---

## 🧩 组件层级

### 全局 Context

```
App (_layout.tsx)
├── AuthProvider (认证状态)
├── PowerSyncProvider (数据同步)
├── OrderProvider (订单状态)
├── ParkedOrderProvider (暂存订单)
└── ClockContext (时钟/打卡)
```

### 页面组件结构

**示例: Sales 页面** (`/order/add-products`):
```
AddProductsScreen
├── AddProductsContent (骨架屏)
│   └── AddProductsHeavy (主组件)
│       ├── AddProductsTopBar (顶部栏)
│       ├── ProductTable (购物车表格)
│       │   └── ProductRow (产品行)
│       ├── AddProductsCustomerCard (客户卡片)
│       ├── AddProductsOrderSummary (订单摘要)
│       ├── POSSidebar (操作按钮)
│       ├── HiddenScannerInput (扫码输入)
│       └── Modals (各种弹窗)
│           ├── SearchProductModalController
│           ├── SearchCustomerModalController
│           ├── CashPaymentModal
│           ├── AddDiscountModal
│           ├── AddTaxModal
│           └── ParkOrderModal
```

**示例: 数据列表页面** (`/sale/customers`):
```
CustomersScreen
├── PageHeader (页面标题)
├── DataTable<CustomerView> (通用表格组件)
│   ├── SearchBar (搜索栏)
│   ├── FilterBar (筛选栏)
│   ├── FlatList (列表)
│   │   └── DataRow (数据行)
│   └── Pagination (分页)
└── NewCustomerModal (新建客户弹窗)
```

---

## 🔑 关键技术点

### 1. **性能优化**

**ProductTable 优化**:
- ✅ `React.memo` + 自定义比较函数
- ✅ `FlatList` 虚拟化
- ✅ `getItemLayout` 固定高度
- ✅ `StyleSheet` 预编译样式
- ✅ `useCallback` 稳定回调
- ✅ `useRef` 避免重渲染

**DataTable 优化**:
- ✅ 客户端分页
- ✅ 虚拟滚动
- ✅ 性能监控 (`onRenderPerf`)

### 2. **扫码优化**

**队列系统**:
```typescript
// 1. 扫码输入 → 队列
scanQueueRef.current.push(barcode);

// 2. 队列处理器
const processQueue = () => {
  const code = scanQueueRef.current.shift();
  handleScanComplete(code);
  setTimeout(processQueue, 50); // 下一个
};

// 3. Offset 跟踪（避免清空输入）
const newPart = fullText.slice(lastSubmitOffsetRef.current);
lastSubmitOffsetRef.current = fullText.length;
```

### 3. **状态管理**

**OrderContext** (订单状态):
```typescript
const { order, addProduct, removeProduct, clearOrder } = useOrder();
```

**PowerSync Hooks** (数据查询):
```typescript
const { products, isLoading } = useProducts();
```

**本地 State** (UI 状态):
```typescript
const [showModal, setShowModal] = useState(false);
```

---

## 📊 数据表映射

| 功能 | PowerSync 表 | 后端表 | Hook |
|------|-------------|--------|------|
| 产品 | `products` | `products` | `useProducts()` |
| 库存 | `stocks` | `stocks` | `useStocks()` |
| 客户 | `customers` | `customers` | `useCustomers()` |
| 订单 | `sale_orders` | `sale_orders` | `useSaleOrders()` |
| 支付 | `payments` | `payments` | `usePayments()` |
| 分类 | `categories` | `categories` | `useCategories()` |
| 品牌 | `brands` | `brands` | - |
| 价格 | `unit_prices` | `unit_prices` | - |

---

## 🚀 启动流程

```
1. App 启动
   ↓
2. AuthProvider 检查登录状态
   ↓
3. PowerSyncProvider 初始化
   ↓
4. 连接 PowerSync Server
   ↓
5. 首次同步 (下载所有数据)
   ↓
6. 显示 Dashboard
   ↓
7. 用户导航到页面
   ↓
8. useSyncStream 查询本地数据
   ↓
9. 渲染 UI
   ↓
10. 实时监听数据变化
    ↓
11. 自动更新 UI
```

---

## 🔍 调试技巧

### 查看 PowerSync 数据
```typescript
// 1. 直接查询 SQLite
const result = await powerSyncDb.execute(
  'SELECT * FROM products LIMIT 10'
);

// 2. 查看同步状态
const status = powerSyncDb.currentStatus;
console.log('Connected:', status.connected);
console.log('Last sync:', status.lastSyncedAt);
```

### 性能监控
```typescript
// ProductTable COMMIT 时间
console.log(`[Perf] ProductTable COMMIT: ${commitTime - renderTime}ms`);

// DataTable 渲染性能
onRenderPerf={(metrics) => {
  console.log('Render time:', metrics.processedDataMs);
}}
```

---

## 📝 总结

**数据流向**:
1. **读取**: PostgreSQL → PowerSync → SQLite → Hook → UI
2. **写入**: UI → API → PostgreSQL → PowerSync → SQLite → UI

**优势**:
- ✅ 离线优先
- ✅ 实时同步
- ✅ 自动更新 UI
- ✅ 减少 API 调用
- ✅ 更快的响应速度

**注意事项**:
- ⚠️ 写入操作必须通过 API
- ⚠️ PowerSync 只用于读取
- ⚠️ 大数据量需要分页
- ⚠️ 复杂查询在本地 SQLite 执行
