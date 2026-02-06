# Web to React Native APP 迁移指南

## 📚 目录

1. [项目架构概述](#项目架构概述)
2. [数据层架构](#数据层架构)
3. [技术栈对比](#技术栈对比)
4. [页面映射关系](#页面映射关系)
5. [迁移步骤详解](#迁移步骤详解)
6. [代码示例](#代码示例)
7. [常见问题](#常见问题)

---

## 项目架构概述

### 整体架构图

```
┌─────────────────────────────────────────────────────────────┐
│                      KHUB Backend API                        │
│                  (Flask + PostgreSQL)                        │
│              /tenant/api/v1/* (REST API)                     │
└──────────────────┬──────────────────────┬───────────────────┘
                   │                      │
                   │                      │
        ┌──────────▼──────────┐  ┌───────▼──────────┐
        │   Web Application   │  │  PowerSync Server │
        │   (React + Redux)   │  │  (Self-Hosted)    │
        │                     │  │                    │
        │ - REST API Calls    │  │ - WAL Stream      │
        │ - Redux Store       │  │ - Sync Buckets    │
        │ - No Local DB       │  │                    │
        └─────────────────────┘  └────────┬──────────┘
                                           │
                                           │ WebSocket
                                           │ (Real-time Sync)
                                           │
                                  ┌────────▼──────────┐
                                  │  React Native APP │
                                  │  (Expo + PowerSync)│
                                  │                    │
                                  │ - SQLite Local DB  │
                                  │ - Offline First    │
                                  │ - Auto Sync        │
                                  └────────────────────┘
```

### 数据流对比

#### Web Application (在线架构)
```
用户操作 → Redux Action → Saga → HTTP API → Backend → PostgreSQL
                         ↓
                    Redux Store → UI 更新
```

#### React Native APP (离线优先架构)
```
用户操作 → Local SQLite (即时响应) → UI 更新
            ↓ (后台自动)
     PowerSync Sync → Backend API → PostgreSQL
            ↑ (实时推送)
     PostgreSQL WAL Stream → PowerSync → Local SQLite
```

---

## 数据层架构

### 三层数据定义

#### Layer 1: PostgreSQL 数据库 (Source of Truth)

```sql
-- 实际的数据库表结构
CREATE TABLE customers (
    id SERIAL PRIMARY KEY,
    no VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100),
    email VARCHAR(50) UNIQUE,
    balance DECIMAL(15,2) DEFAULT 0,
    business_name VARCHAR(100) NOT NULL,
    business_city VARCHAR(50),
    business_state VARCHAR(50),
    status SMALLINT DEFAULT 1,
    allow_ecom VARCHAR(1) DEFAULT 'N',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

#### Layer 2: Backend SQLAlchemy Model

**位置**: `kapp/server/models/tenant/core_models/customer.py`

```python
@track_changes
class Customer(BaseMixin, UserMixin, db.Model):
    __tablename__ = 'customers'
    
    id = sa.Column(sa.Integer, primary_key=True)
    no = sa.Column(sa.String(50), unique=True, nullable=False)
    name = sa.Column(CITEXT(100), nullable=True)
    email = sa.Column(CITEXT(50), unique=True, nullable=True)
    balance = sa.Column(DecimalPriceSa(), nullable=False, default=0)
    business_name = sa.Column(CITEXT(100), nullable=False)
    business_city = sa.Column(sa.String(50), nullable=True)
    business_state = sa.Column(sa.String(50), nullable=True)
    status = sa.Column(sa.SmallInteger(), nullable=False)
    allow_ecom = sa.Column(sa.String(1), nullable=False)
    created_at = sa.Column(sa.DateTime, nullable=False)
    updated_at = sa.Column(sa.DateTime, nullable=False)
```

#### Layer 3: PowerSync Sync Rules

**位置**: `powersync/sync_rules.yaml`

```yaml
streams:
  customers:
    auto_subscribe: true
    query: "SELECT id, no, name, email, balance, balance_limit, 
            phone_no, business_name, business_city, business_state, 
            business_country, business_zip_code, business_phone_no, 
            address, status, allow_ecom, created_at, updated_at 
            FROM customers"
```

#### Layer 4: APP Local Schema

**位置**: `utils/powersync/schema.ts`

```typescript
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
  allow_ecom: column.text,  // 'Y' or 'N'
  created_at: column.text,
  updated_at: column.text,
})
```

#### Layer 5: TypeScript Type Definition

**位置**: `utils/powersync/hooks/useCustomers.ts`

```typescript
export interface CustomerView {
  id: string;
  no: string;
  businessName: string;
  name: string;
  email: string;
  phone: string;
  balance: number;
  balanceLimit: number;
  address: string;
  city: string;
  state: string;
  allowEcom: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}
```

---

## 技术栈对比

### 数据获取层

| 功能 | Web | React Native APP |
|------|-----|------------------|
| **HTTP 客户端** | Axios | Axios (仅写操作) |
| **本地数据库** | ❌ 无 | ✅ SQLite (PowerSync) |
| **数据查询** | REST API | SQL (本地) + REST API |
| **状态管理** | Redux + Redux Saga | React Hooks + PowerSync |
| **缓存策略** | 内存 (Redux Store) | 持久化 (SQLite) |
| **离线能力** | ❌ 不支持 | ✅ 完全支持 |
| **实时同步** | ❌ 手动刷新 | ✅ 自动后台同步 |

### UI 组件层

| 组件类型 | Web | React Native APP |
|---------|-----|------------------|
| **UI 库** | Bootstrap + Material-UI | React Native + NativeWind |
| **表格** | BootstrapTable / AG-Grid | 自定义 DataTable |
| **表单** | Formik + Ant Design | 自定义表单组件 |
| **模态框** | React Bootstrap Modal | React Native Modal |
| **导航** | React Router | Expo Router |
| **图标** | FontAwesome | Ionicons |
| **样式** | CSS + SCSS | Tailwind (NativeWind) |

### 代码位置映射

| 功能模块 | Web 位置 | APP 位置 |
|---------|---------|---------|
| **数据模型** | `kapp/server/models/tenant/` | `utils/powersync/schema.ts` |
| **API 调用** | `app/modules/*/\_redux/\*/\*Crud.js` | `utils/api/` |
| **数据 Hooks** | Redux Saga | `utils/powersync/hooks/` |
| **页面组件** | `app/modules/*/pages/` | `app/` |
| **通用组件** | `_metronic/_partials/` | `components/` |
| **路由配置** | `app/Routes.js` + `BasePage.js` | `app/_layout.tsx` |
| **认证逻辑** | `app/modules/Auth/` | `contexts/AuthContext.tsx` |

---

## 页面映射关系

### 完整页面对应表

#### 1. 认证模块

| 功能 | Web 路径 | APP 路径 | 状态 |
|------|---------|---------|------|
| 登录 | `/auth/login` | `/login` | ✅ 已实现 |
| 退出 | `/logout` | 退出逻辑在 Context | ✅ 已实现 |

#### 2. Dashboard 模块

| 功能 | Web 路径 | APP 路径 | 状态 |
|------|---------|---------|------|
| 主面板 | `/dashboard` | `/index` (Dashboard) | ✅ 已实现 |
| 通知 | `/dashboard/notifications` | 待实现 | ⚠️ 未实现 |

#### 3. Catalog 模块 (产品目录)

| 功能 | Web 路径 | APP 路径 | 状态 |
|------|---------|---------|------|
| 产品列表 | `/catalog/products` | `/catalog/products` | ✅ 已实现 |
| 添加产品 | `/catalog/products/new` | `/catalog/add-product` | ✅ 已实现 |
| 编辑产品 | `/catalog/products/:id/edit` | 待实现 | ⚠️ 未实现 |
| 产品详情 | `/catalog/products/:id/detail` | 待实现 | ⚠️ 未实现 |
| 品牌管理 | `/catalog/brands` | 待实现 | ⚠️ Web 独有 |
| 分类管理 | `/catalog/categories` | 待实现 | ⚠️ Web 独有 |
| 属性管理 | `/catalog/attributes` | 待实现 | ⚠️ Web 独有 |
| 产品组 | `/catalog/product-groups` | 待实现 | ⚠️ Web 独有 |

#### 4. Inventory 模块 (库存管理)

| 功能 | Web 路径 | APP 路径 | 状态 |
|------|---------|---------|------|
| 库存列表 | `/inventory/stocks` | `/inventory/stocks` | ✅ 已实现 |
| 库存警报 | `/inventory/stock-alert` | `/inventory/stock-alerts` | ✅ 已实现 |
| 采购订单 | `/inventory/purchase/orders/new` | 待实现 | ⚠️ Web 独有 |
| 采购入库 | `/inventory/purchase/receives` | 待实现 | ⚠️ Web 独有 |
| 采购退货 | `/inventory/purchase-returns` | 待实现 | ⚠️ Web 独有 |
| 供应商 | `/inventory/suppliers` | 待实现 | ⚠️ Web 独有 |
| 仓库管理 | `/inventory/warehouses` | 待实现 | ⚠️ Web 独有 |
| 库存转移 | `/inventory/stock-transfer` | 待实现 | ⚠️ Web 独有 |

#### 5. Sale 模块 (销售管理)

| 功能 | Web 路径 | APP 路径 | 状态 |
|------|---------|---------|------|
| 客户列表 | `/sale/customers` | `/sale/customers` | ✅ 已实现 |
| 添加客户 | `/sale/customers/new` | Modal 弹窗 | ✅ 已实现 |
| 编辑客户 | `/sale/customers/:id/edit` | 待实现 | ⚠️ 未实现 |
| 客户分组 | `/sale/customer-groups` | `/sale/customer-groups` | ✅ 已实现 |
| 销售历史 | `/sale/history` | `/sale/sales-history` | ✅ 已实现 |
| 快速下单 | `/sale/sale-q-order` | `/sale/add-quick-order` | ✅ 已实现 |
| 付款历史 | `/sale/payments` | `/sale/payments-history` | ✅ 已实现 |
| 销售退货 | `/sale/sale-return` | `/sale/sales-return` | ✅ 已实现 |
| 履约管理 | `/sale/fulfillment` | `/sale/fulfillments` | ✅ 已实现 |
| 暂存订单 | ❌ Web 无 | `/sale/parked-orders` | ✅ APP 独有 |
| 发票管理 | `/sale/invoices` | 待实现 | ⚠️ Web 独有 |

#### 6. Order 模块 (订单流程)

| 功能 | Web 路径 | APP 路径 | 状态 |
|------|---------|---------|------|
| 添加产品 | 订单流程的一部分 | `/order/add-products` | ✅ 已实现 |
| 选择客户 | 订单流程的一部分 | `/order/add-customer` | ✅ 已实现 |
| 结账 | 订单流程的一部分 | `/order/checkout` | ✅ 已实现 |

#### 7. POS 模块

| 功能 | Web 路径 | APP 路径 | 状态 |
|------|---------|---------|------|
| POS 收银 | ❌ Web 无 | `/pos-line` | ✅ APP 独有 |

#### 8. Report 模块 (报表)

| 功能 | Web 路径 | APP 路径 | 状态 |
|------|---------|---------|------|
| 报表入口 | `/reporting/purchasing-inventory` | `/sale/reports` | ✅ 已实现 |
| 销售报表 | 各子页面 | `/sale/reports-sales` | ✅ 已实现 |
| 财务报表 | `/reporting/financial-reporting` | `/sale/reports-financial` | ✅ 已实现 |
| 库存报表 | `/reporting/inventory-report` | `/sale/reports-inventory` | ✅ 已实现 |
| 法律报表 | `/reporting/legal-reports` | `/sale/reports-legal` | ✅ 已实现 |
| MAS 报表 | `/reporting/msa` | `/sale/reports-mas` | ✅ 已实现 |
| 采购报表 | - | `/sale/reports-purchase` | ✅ 已实现 |

> 📝 **注意**: APP 有 50+ 个具体报表页面 (在 `app/sale/reports/` 目录)

#### 9. Web 独有模块 (APP 未实现)

| 模块 | Web 路径 | 说明 |
|------|---------|------|
| 电商管理 | `/estore` | 电商网站配置 |
| 电商主题 | `/store` | 主题管理 |
| 营销 | `/marketing` | 促销、优惠券 |
| 消息 | `/messaging` | 消息管理 |
| 查询 | `/queries` | 客户查询 |
| 用户管理 | `/users` | 用户和角色 |
| 会计 | `/accounting` | 会计功能 |
| 应用商店 | `/apps` | 第三方应用 |
| 自定义页面 | `/custom-pages` | CMS |

---

## 迁移步骤详解

### 步骤 1: 确认数据表已同步

#### 1.1 查看目标功能的数据需求

**Web 代码位置**: `kapp/client/tenant/src/app/modules/[Module]/_redux/[Entity]/[Entity]Crud.js`

示例 - 查看客户列表 API:
```javascript
// kapp/client/tenant/src/app/modules/Sale/_redux/customers/customersCrud.js
export function findCustomers(queryParams) {
  return axios.get(
    `${CUSTOMERS_URL}/list2?search_key=${queryParams?.searchKey}`
  );
}
```

从 API 响应中找出需要的字段。

#### 1.2 检查 PowerSync 同步配置

**文件**: `powersync/sync_rules.yaml`

```yaml
streams:
  customers:  # 检查是否存在
    auto_subscribe: true
    query: "SELECT id, no, name, email, ... FROM customers"
```

#### 1.3 添加新表同步 (如果不存在)

```yaml
streams:
  new_table:
    auto_subscribe: true
    query: "SELECT id, field1, field2, field3 FROM new_table"
```

#### 1.4 更新 APP Schema

**文件**: `utils/powersync/schema.ts`

```typescript
const new_table = new Table({
  field1: column.text,
  field2: column.integer,
  field3: column.real,
  created_at: column.text,
  updated_at: column.text,
})

// 添加到 Schema
export const AppSchema = new Schema({
  // ... 其他表
  new_table,
})
```

#### 1.5 重启 PowerSync 服务

```bash
cd powersync
docker-compose restart powersync
```

---

### 步骤 2: 创建 PowerSync Hook

#### 2.1 创建 Hook 文件

**位置**: `utils/powersync/hooks/useNewEntity.ts`

```typescript
/**
 * New Entity Data Hook
 * 
 * Provides real-time synced data from PowerSync.
 */

import { useMemo } from 'react';
import { useSyncStream } from '../useSyncStream';

// ============================================================================
// Types
// ============================================================================

/** Raw data from database */
interface DBNewEntity {
  id: string;
  field1: string;
  field2: number;
  field3: number;
  created_at: string;
  updated_at: string;
}

/** UI view model */
export interface NewEntityView {
  id: string;
  field1: string;
  field2: number;
  field3: number;
  createdAt: string;
  updatedAt: string;
}

// ============================================================================
// Transformers
// ============================================================================

function toView(db: DBNewEntity): NewEntityView {
  return {
    id: db.id,
    field1: db.field1 || '',
    field2: db.field2 || 0,
    field3: db.field3 || 0,
    createdAt: db.created_at || '',
    updatedAt: db.updated_at || '',
  };
}

// ============================================================================
// Hooks
// ============================================================================

/** Get all entities */
export function useNewEntities() {
  const { data, isLoading, error, refresh } = useSyncStream<DBNewEntity>(
    `SELECT * FROM new_table ORDER BY created_at DESC`
  );

  const entities = useMemo(() => data.map(toView), [data]);

  return {
    entities,
    isLoading,
    error,
    refresh,
    count: entities.length,
  };
}

/** Get single entity by ID */
export function useNewEntityById(id: string | null) {
  const { data, isLoading, error } = useSyncStream<DBNewEntity>(
    `SELECT * FROM new_table WHERE id = ?`,
    id ? [id] : [],
    { enabled: !!id }
  );

  const entity = useMemo(() => (data[0] ? toView(data[0]) : null), [data]);

  return { entity, isLoading, error };
}

/** Search entities */
export function useNewEntitySearch(query: string) {
  const searchTerm = `%${query}%`;
  
  const { data, isLoading, error } = useSyncStream<DBNewEntity>(
    `SELECT * FROM new_table 
     WHERE field1 LIKE ? 
     ORDER BY created_at DESC
     LIMIT 50`,
    [searchTerm],
    { enabled: query.length >= 2 }
  );

  const entities = useMemo(() => data.map(toView), [data]);

  return { entities, isLoading, error };
}
```

#### 2.2 导出 Hook

**文件**: `utils/powersync/hooks/index.ts`

```typescript
export * from './useNewEntity';
```

---

### 步骤 3: 创建 UI 页面

#### 3.1 参考 Web 页面结构

**Web 页面**: `kapp/client/tenant/src/app/modules/[Module]/pages/[Entity]/list-page/`

查看:
- 显示的列 (columns)
- 搜索/筛选功能
- 操作按钮 (actions)
- 模态框 (modals)

#### 3.2 创建 APP 页面

**位置**: `app/[module]/[entity].tsx`

```typescript
/**
 * New Entity List Screen
 */

import { useState } from "react";
import { Alert, Text, View } from "react-native";
import { ColumnDefinition, DataTable, PageHeader } from "../../components";
import { NewEntityView, useNewEntities } from "../../utils/powersync/hooks";

export default function NewEntityScreen() {
  const { entities, isLoading, refresh, count } = useNewEntities();
  
  // 列配置 (参考 Web 的 columns)
  const columns: ColumnDefinition<NewEntityView>[] = [
    {
      key: "field1",
      title: "Field 1",
      width: "flex",
      visible: true,
      render: (item) => (
        <Text className="text-blue-600 text-sm font-medium">
          {item.field1}
        </Text>
      ),
    },
    {
      key: "field2",
      title: "Field 2",
      width: 100,
      visible: true,
      render: (item) => (
        <Text className="text-gray-600 text-sm">{item.field2}</Text>
      ),
    },
    // ... 更多列
  ];

  // 搜索逻辑 (参考 Web 的 filter)
  const handleSearch = (item: NewEntityView, query: string) => {
    const q = query.toLowerCase();
    return item.field1?.toLowerCase().includes(q) || false;
  };

  return (
    <View className="flex-1 bg-gray-50">
      <PageHeader title="New Entities" />

      <DataTable<NewEntityView>
        data={entities}
        columns={columns}
        keyExtractor={(item) => item.id}
        searchable
        searchPlaceholder="Search entities..."
        onSearch={handleSearch}
        columnSelector
        addButton
        addButtonText="Add Entity"
        onAddPress={() => Alert.alert("Add", "Add new entity")}
        isLoading={isLoading}
        onRefresh={refresh}
        emptyIcon="list-outline"
        emptyText="No entities found"
        totalCount={count}
      />
    </View>
  );
}
```

---

### 步骤 4: 对比测试

#### 4.1 功能对比清单

| 功能项 | Web | APP | 状态 |
|-------|-----|-----|------|
| 数据加载 | ✅ | ✅ | 测试通过 |
| 搜索功能 | ✅ | ✅ | 测试通过 |
| 排序功能 | ✅ | ⚠️ | 需要实现 |
| 分页功能 | ✅ | ❌ | APP 使用虚拟滚动 |
| 添加记录 | ✅ | ⚠️ | 需要实现 |
| 编辑记录 | ✅ | ⚠️ | 需要实现 |
| 删除记录 | ✅ | ⚠️ | 需要实现 |

#### 4.2 数据一致性检查

```typescript
// 在 APP 中验证数据
const { entities } = useNewEntities();
console.log('Total count:', entities.length);
console.log('Sample data:', entities[0]);
```

对比 Web 的数据:
```javascript
// 在 Web 中查看
console.log('Total count:', this.props.totalCount);
console.log('Sample data:', this.props.entities[0]);
```

---

## 代码示例

### 完整迁移示例: 客户列表

#### Web 版本

**Redux Saga** (`customersSaga.js`):
```javascript
function* fetchCustomers(action) {
  try {
    const response = yield call(
      customersCrud.findCustomers, 
      action.payload
    );
    
    yield put(
      actions.customersFetched({
        entities: response.data.entities,
        totalCount: response.data.total_count,
      })
    );
  } catch (error) {
    yield put(actions.catchError({ error, callType: callTypes.list }));
  }
}
```

**UI Component** (`ListCard.js`):
```javascript
export function ListCard() {
  const dispatch = useDispatch();
  const { entities, listLoading } = useSelector(state => state.customers);
  
  useEffect(() => {
    dispatch(actions.fetchCustomers({ pageNumber: 1, pageSize: 20 }));
  }, []);
  
  return (
    <BootstrapTable
      data={entities}
      columns={[
        { dataField: 'business_name', text: 'Business Name' },
        { dataField: 'name', text: 'Customer Name' },
        { dataField: 'balance', text: 'Balance' },
      ]}
      loading={listLoading}
    />
  );
}
```

#### APP 版本

**PowerSync Hook** (`useCustomers.ts`):
```typescript
export function useCustomers() {
  const { data, isLoading } = useSyncStream<DBCustomer>(
    `SELECT * FROM customers ORDER BY business_name ASC`
  );

  const customers = useMemo(() => data.map(toCustomerView), [data]);

  return { customers, isLoading, count: customers.length };
}
```

**UI Component** (`customers.tsx`):
```typescript
export default function CustomersScreen() {
  const { customers, isLoading, refresh } = useCustomers();
  
  const columns: ColumnDefinition<CustomerView>[] = [
    {
      key: "businessName",
      title: "Business Name",
      render: (item) => <Text>{item.businessName}</Text>
    },
    {
      key: "name",
      title: "Customer Name",
      render: (item) => <Text>{item.name}</Text>
    },
    {
      key: "balance",
      title: "Balance",
      render: (item) => <Text>${item.balance.toFixed(2)}</Text>
    },
  ];
  
  return (
    <DataTable
      data={customers}
      columns={columns}
      isLoading={isLoading}
      onRefresh={refresh}
    />
  );
}
```

### 筛选和搜索

#### Web 版本
```javascript
// 服务端筛选
dispatch(actions.fetchCustomers({
  searchKey: 'John',
  is_active: 1,
  customer_type: 2,
  pageNumber: 1,
  pageSize: 20
}));
```

#### APP 版本
```typescript
// 本地 SQL 筛选
export function useCustomerFilters(filters: {
  searchKey?: string;
  isActive?: boolean;
  customerType?: number;
}) {
  let query = `SELECT * FROM customers WHERE 1=1`;
  const params: any[] = [];
  
  if (filters.searchKey) {
    query += ` AND business_name LIKE ?`;
    params.push(`%${filters.searchKey}%`);
  }
  
  if (filters.isActive !== undefined) {
    query += ` AND status = ?`;
    params.push(filters.isActive ? 1 : 0);
  }
  
  if (filters.customerType) {
    query += ` AND customer_type = ?`;
    params.push(filters.customerType);
  }
  
  query += ` ORDER BY business_name ASC`;
  
  const { data, isLoading } = useSyncStream<DBCustomer>(query, params);
  
  return { customers: data.map(toCustomerView), isLoading };
}
```

---

## 常见问题

### Q1: 如何处理关联数据?

**问题**: 需要显示客户的订单数量

**Web 方式** (后端 JOIN):
```javascript
// 后端返回已经关联好的数据
{
  customer_id: 1,
  business_name: "ABC Store",
  order_count: 150  // 后端计算
}
```

**APP 方式** (本地 JOIN):
```typescript
export function useCustomersWithOrders() {
  const { data } = useSyncStream<any>(
    `SELECT 
      c.*,
      COUNT(o.id) as order_count
     FROM customers c
     LEFT JOIN sale_orders o ON c.id = o.customer_id
     GROUP BY c.id
     ORDER BY c.business_name ASC`
  );
  
  return { customers: data };
}
```

---

### Q2: 如何处理复杂的业务逻辑?

**原则**: 复杂计算仍然在后端完成

**示例**: 生成报表

```typescript
// APP: 调用后端 API
import khubApi from '../../utils/api/khub';

export async function generateSalesReport(params: {
  startDate: string;
  endDate: string;
  customerId?: string;
}) {
  const response = await khubApi.post(
    '/tenant/api/v1/report/sale/order/sales_summary',
    params
  );
  
  return response.data;
}
```

---

### Q3: 如何处理大数据量?

**Web**: 分页加载
```javascript
dispatch(fetchCustomers({ pageNumber: 1, pageSize: 20 }));
```

**APP**: 虚拟滚动 + 分批渲染
```typescript
<DataTable
  data={customers}  // 全部数据
  // DataTable 内部使用 FlatList 的虚拟化
  // 只渲染可见区域的数据
/>
```

---

### Q4: 新增字段如何同步?

**步骤**:

1. 后端添加字段到 Model
2. 运行数据库迁移
3. 更新 `sync_rules.yaml` 的 SELECT 语句
4. 更新 APP `schema.ts` 添加新列
5. 重启 PowerSync: `docker-compose restart powersync`
6. APP 会自动增量同步新字段

---

### Q5: 如何处理文件上传?

**原则**: 文件上传仍然通过 API

```typescript
import khubApi from '../../utils/api/khub';

export async function uploadCustomerImage(
  customerId: string,
  imageUri: string
) {
  const formData = new FormData();
  formData.append('image', {
    uri: imageUri,
    type: 'image/jpeg',
    name: 'customer.jpg',
  } as any);
  
  const response = await khubApi.post(
    `/tenant/api/v1/sale/customers/${customerId}/upload-image`,
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }
  );
  
  return response.data;
}
```

---

### Q6: 如何调试数据同步问题?

**检查 PowerSync 日志**:
```bash
cd powersync
docker-compose logs -f powersync
```

**检查本地数据库**:
```typescript
// 在 APP 中直接查询
import { usePowerSync } from '@powersync/react-native';

const powerSync = usePowerSync();
const result = await powerSync.execute(
  'SELECT COUNT(*) as count FROM customers'
);
console.log('Local customer count:', result.rows._array[0].count);
```

**检查同步状态**:
```typescript
const status = await powerSync.currentStatus();
console.log('Connected:', status?.connected);
console.log('Last synced:', status?.lastSyncedAt);
```

---

## 最佳实践

### ✅ DO (推荐做法)

1. **优先使用本地查询**
   ```typescript
   // ✅ 优先从本地读取
   const { customers } = useCustomers();
   ```

2. **写操作调用 API**
   ```typescript
   // ✅ 写操作通过 API
   await khubApi.post('/tenant/api/v1/sale/customers', customerData);
   ```

3. **复用 Web 的验证逻辑**
   ```typescript
   // ✅ 共享验证函数
   export const validateEmail = (email: string) => {
     return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
   };
   ```

4. **使用 TypeScript 类型**
   ```typescript
   // ✅ 定义清晰的类型
   export interface CustomerView {
     id: string;
     businessName: string;
     // ...
   }
   ```

### ❌ DON'T (避免的做法)

1. **不要在 APP 中直接调用列表 API**
   ```typescript
   // ❌ 避免
   const response = await khubApi.get('/tenant/api/v1/sale/customers/list2');
   ```

2. **不要跳过数据转换**
   ```typescript
   // ❌ 直接使用数据库数据
   <Text>{customer.business_name}</Text>
   
   // ✅ 使用转换后的数据
   <Text>{customer.businessName}</Text>
   ```

3. **不要在 UI 组件中写 SQL**
   ```typescript
   // ❌ 避免
   const { data } = useSyncStream('SELECT * FROM customers');
   
   // ✅ 使用封装的 Hook
   const { customers } = useCustomers();
   ```

---

## 附录: 快速参考

### 文件路径速查

| 用途 | 路径 |
|------|------|
| 后端数据模型 | `kapp/server/models/tenant/` |
| 同步配置 | `powersync/sync_rules.yaml` |
| APP Schema | `utils/powersync/schema.ts` |
| PowerSync Hooks | `utils/powersync/hooks/` |
| APP 页面 | `app/` |
| 通用组件 | `components/` |
| API 工具 | `utils/api/` |

### 常用命令

```bash
# 重启 PowerSync
cd powersync && docker-compose restart powersync

# 查看 PowerSync 日志
cd powersync && docker-compose logs -f powersync

# 运行 APP (Android)
npx expo run:android

# 运行 APP (iOS)
npx expo run:ios

# 启动开发服务器
npx expo start
```

---

## 更新日志

- **2024-02-05**: 创建初始文档
- 包含完整的架构说明、页面映射和迁移步骤

---

**文档维护者**: AI Assistant  
**最后更新**: 2024-02-05
