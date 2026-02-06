# 快速参考卡片 - Web to APP 迁移

## 🎯 5分钟速查表

---

## 数据表三层对应关系

```
Backend Model (Python)          PowerSync Rules (YAML)         APP Schema (TypeScript)
┌─────────────────────┐        ┌────────────────────┐        ┌──────────────────────┐
│ # customer.py       │        │ streams:            │        │ # schema.ts          │
│ class Customer:     │   →    │   customers:        │   →    │ const customers =    │
│   id = Column(Int)  │        │     query: "SELECT  │        │   new Table({        │
│   name = Column(Str)│        │       id, name FROM │        │     name: column.text│
│   email = Column(   │        │       customers"    │        │     email: column.   │
│   balance = Column( │        │                     │        │     balance: column. │
└─────────────────────┘        └────────────────────┘        └──────────────────────┘
```

---

## 迁移 4 步法

### 步骤 1: 确认数据表
```bash
# 1. 检查 sync_rules.yaml
grep "customers" powersync/sync_rules.yaml

# 2. 如果不存在，添加
streams:
  customers:
    auto_subscribe: true
    query: "SELECT id, name, email FROM customers"

# 3. 重启 PowerSync
cd powersync && docker-compose restart
```

### 步骤 2: 创建 Hook
```typescript
// utils/powersync/hooks/useCustomers.ts
export function useCustomers() {
  const { data, isLoading } = useSyncStream<DBCustomer>(
    `SELECT * FROM customers ORDER BY name`
  );
  return { customers: data.map(toView), isLoading };
}
```

### 步骤 3: 创建页面
```typescript
// app/sale/customers.tsx
export default function CustomersScreen() {
  const { customers, isLoading } = useCustomers();
  return <DataTable data={customers} columns={columns} />;
}
```

### 步骤 4: 测试
- ✅ 数据加载
- ✅ 搜索功能
- ✅ 离线可用
- ✅ 实时同步

---

## 常用代码片段

### 1. 创建 PowerSync Hook

```typescript
// utils/powersync/hooks/useEntity.ts
import { useMemo } from 'react';
import { useSyncStream } from '../useSyncStream';

interface DBEntity {
  id: string;
  field1: string;
  created_at: string;
}

export function useEntities() {
  const { data, isLoading } = useSyncStream<DBEntity>(
    `SELECT * FROM entities ORDER BY created_at DESC`
  );
  
  return { entities: data, isLoading };
}
```

### 2. 带筛选的 Hook

```typescript
export function useEntitySearch(query: string) {
  const { data } = useSyncStream<DBEntity>(
    `SELECT * FROM entities 
     WHERE field1 LIKE ? 
     LIMIT 50`,
    [`%${query}%`],
    { enabled: query.length >= 2 }
  );
  
  return { entities: data };
}
```

### 3. 创建列表页面

```typescript
export default function EntityListScreen() {
  const { entities, isLoading } = useEntities();
  
  const columns: ColumnDefinition<Entity>[] = [
    {
      key: "name",
      title: "Name",
      width: "flex",
      render: (item) => <Text>{item.name}</Text>
    },
  ];
  
  return (
    <View className="flex-1">
      <PageHeader title="Entities" />
      <DataTable
        data={entities}
        columns={columns}
        isLoading={isLoading}
        searchable
      />
    </View>
  );
}
```

### 4. API 写操作

```typescript
import khubApi from '../../utils/api/khub';

export async function createEntity(data: EntityData) {
  const response = await khubApi.post(
    '/tenant/api/v1/module/entities',
    data
  );
  return response.data;
}

export async function updateEntity(id: string, data: Partial<EntityData>) {
  const response = await khubApi.patch(
    `/tenant/api/v1/module/entities/${id}`,
    data
  );
  return response.data;
}
```

---

## 文件路径速查

### 找 Web 的数据结构
```
kapp/server/models/tenant/[module]_models/[entity].py
```
**示例**: `kapp/server/models/tenant/core_models/customer.py`

### 找 Web 的 API 调用
```
kapp/client/tenant/src/app/modules/[Module]/_redux/[entity]/[entity]Crud.js
```
**示例**: `kapp/client/tenant/src/app/modules/Sale/_redux/customers/customersCrud.js`

### 找 Web 的页面代码
```
kapp/client/tenant/src/app/modules/[Module]/pages/[entity]/
```
**示例**: `kapp/client/tenant/src/app/modules/Sale/pages/customer/list-page/`

### APP 对应位置
```
app/[module]/[entity].tsx
```
**示例**: `app/sale/customers.tsx`

### PowerSync Hook
```
utils/powersync/hooks/use[Entity].ts
```
**示例**: `utils/powersync/hooks/useCustomers.ts`

---

## 常用命令

### PowerSync 管理
```bash
# 启动 PowerSync
cd powersync && docker-compose up -d

# 重启 PowerSync (修改配置后)
cd powersync && docker-compose restart powersync

# 查看日志
cd powersync && docker-compose logs -f powersync

# 停止
cd powersync && docker-compose down
```

### APP 开发
```bash
# 运行 Android
npx expo run:android

# 运行 iOS
npx expo run:ios

# 启动开发服务器
npx expo start

# 清除缓存
npx expo start -c
```

### 数据库调试
```typescript
// 在 APP 中执行 SQL
import { usePowerSync } from '@powersync/react-native';

const powerSync = usePowerSync();
const result = await powerSync.execute(
  'SELECT COUNT(*) FROM customers'
);
console.log(result.rows._array);
```

---

## 数据类型映射

| PostgreSQL | Python SQLAlchemy | PowerSync Schema | TypeScript |
|-----------|------------------|------------------|------------|
| SERIAL/INTEGER | sa.Integer | column.integer | number |
| VARCHAR/TEXT | sa.String | column.text | string |
| DECIMAL | DecimalPriceSa() | column.real | number |
| BOOLEAN | sa.Boolean | column.integer | boolean |
| TIMESTAMP | sa.DateTime | column.text | string |
| JSON | sa.JSON | column.text | string (需解析) |

---

## 常见错误及解决

### ❌ 数据不同步
```bash
# 1. 检查 PowerSync 日志
cd powersync && docker-compose logs powersync | tail -50

# 2. 检查表是否在 sync_rules.yaml
grep "table_name" powersync/sync_rules.yaml

# 3. 检查 PostgreSQL 连接
docker exec powersync-db-1 psql -U dev -d dev_tenant -c "SELECT COUNT(*) FROM customers;"
```

### ❌ Hook 返回空数据
```typescript
// 检查 1: 表名是否正确
const { data } = useSyncStream('SELECT * FROM customer'); // ❌ 错误
const { data } = useSyncStream('SELECT * FROM customers'); // ✅ 正确

// 检查 2: Schema 是否定义
// utils/powersync/schema.ts
export const AppSchema = new Schema({
  customers, // ✅ 必须导出
});
```

### ❌ 列不存在错误
```typescript
// SQL: no such column: business_name
// 原因: sync_rules.yaml 没有包含该列

// 解决: 更新 sync_rules.yaml
streams:
  customers:
    query: "SELECT id, name, business_name FROM customers"
    # 添加缺失的列 ↑
```

---

## 性能优化技巧

### ✅ 使用索引查询
```typescript
// ❌ 全表扫描
SELECT * FROM customers WHERE name LIKE '%John%'

// ✅ 使用索引
SELECT * FROM customers WHERE id = ?
```

### ✅ 限制结果数量
```typescript
// ❌ 返回所有数据
SELECT * FROM customers

// ✅ 限制数量
SELECT * FROM customers LIMIT 50
```

### ✅ 使用 memo 优化渲染
```typescript
const customers = useMemo(
  () => data.map(toCustomerView),
  [data]
);
```

### ✅ 启用虚拟滚动
```typescript
// DataTable 自动启用虚拟滚动
<DataTable data={customers} /> // ✅ 自动优化
```

---

## 调试清单

### 功能不工作？按顺序检查：

- [ ] 1. PowerSync 是否运行？
  ```bash
  docker ps | grep powersync
  ```

- [ ] 2. 表是否在 sync_rules.yaml？
  ```bash
  grep "table_name" powersync/sync_rules.yaml
  ```

- [ ] 3. Schema 是否定义？
  ```typescript
  // utils/powersync/schema.ts
  export const AppSchema = new Schema({ table_name })
  ```

- [ ] 4. Hook 是否正确？
  ```typescript
  const { data } = useSyncStream(`SELECT * FROM table_name`)
  ```

- [ ] 5. JWT Token 是否有效？
  ```typescript
  const token = await getAccessToken();
  console.log('Token:', token);
  ```

- [ ] 6. 网络连接正常？
  ```typescript
  const status = await powerSync.currentStatus();
  console.log('Connected:', status?.connected);
  ```

---

## 字段命名约定

### 数据库 (snake_case)
```python
business_name
phone_no
created_at
```

### TypeScript (camelCase)
```typescript
businessName
phoneNo
createdAt
```

### 转换函数
```typescript
function toView(db: DBCustomer): CustomerView {
  return {
    businessName: db.business_name,
    phoneNo: db.phone_no,
    createdAt: db.created_at,
  };
}
```

---

## 环境变量

### APP (.env.local)
```bash
EXPO_PUBLIC_KHUB_API_URL=http://192.168.1.100:5002
EXPO_PUBLIC_POWERSYNC_URL=http://192.168.1.100:8080
```

### PowerSync (powersync/.env)
```bash
PS_KHUB_DB_HOST=host.docker.internal
PS_KHUB_DB_PORT=5434
PS_KHUB_DB_NAME=dev_tenant
PS_KHUB_DB_USER=dev
PS_KHUB_DB_PASSWORD=dev
PS_JWT_SECRET_BASE64=<base64-encoded-secret>
```

---

## 测试清单

迁移完成后，测试以下功能：

- [ ] 页面正常显示
- [ ] 数据正确加载
- [ ] 搜索功能工作
- [ ] 筛选功能工作
- [ ] 离线可用（关闭网络测试）
- [ ] 写入操作成功
- [ ] 实时同步（多设备测试）
- [ ] 性能可接受（< 1秒加载）

---

## 📚 完整文档

- [迁移指南](./MIGRATION_GUIDE.md) - 详细步骤
- [架构文档](./ARCHITECTURE.md) - 系统架构
- [文档索引](./README.md) - 所有文档

---

**打印此页**: 方便随时查阅  
**最后更新**: 2024-02-05
