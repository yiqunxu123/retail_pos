# DataTable 组件使用指南

## 概述

`DataTable` 是一个通用的数据表格组件，用于统一项目中所有列表页面的实现。它提供了开箱即用的搜索、过滤、排序、列选择等功能。

## 特性

✅ **列定义与自定义渲染** - 灵活配置表格列  
✅ **搜索功能** - 支持自定义搜索逻辑  
✅ **多重过滤器** - 下拉过滤器支持  
✅ **排序功能** - 自定义排序规则  
✅ **列可见性切换** - 用户可以显示/隐藏列  
✅ **下拉刷新** - 支持 pull-to-refresh  
✅ **Loading 状态** - 优雅的加载状态  
✅ **空状态** - 自定义空数据展示  
✅ **实时同步标识** - 显示数据同步状态  
✅ **横向滚动** - 支持宽表格横向滚动  
✅ **批量操作** - 可选的批量操作功能  

## 基础用法

### 1. 导入组件

```typescript
import { DataTable, ColumnDefinition, FilterDefinition } from "../../components";
```

### 2. 定义列配置

```typescript
const columns: ColumnDefinition<YourDataType>[] = [
  {
    key: "id",                    // 唯一标识
    title: "ID",                  // 列标题
    width: 100,                   // 固定宽度 (可选)
    visible: true,                // 默认可见 (可选)
    hideable: false,              // 是否可隐藏 (可选)
    align: "left",                // 对齐方式 (可选)
    render: (item) => (           // 自定义渲染 (可选)
      <Text>{item.id}</Text>
    ),
  },
  {
    key: "name",
    title: "Name",
    width: "flex",                // 弹性宽度
    visible: true,
    render: (item) => (
      <Text className="font-medium">{item.name}</Text>
    ),
  },
];
```

### 3. 定义过滤器 (可选)

```typescript
const filters: FilterDefinition[] = [
  {
    key: "status",
    placeholder: "Status",
    width: 120,
    options: [
      { label: "Active", value: "active" },
      { label: "Inactive", value: "inactive" },
    ],
  },
];
```

### 4. 使用组件

```typescript
<DataTable
  data={yourData}
  columns={columns}
  keyExtractor={(item) => item.id}
  searchable
  searchPlaceholder="Search..."
  onSearch={(item, query) => item.name.includes(query)}
  filters={filters}
  onFilter={(item, filters) => {
    if (filters.status === "active") return item.isActive;
    return true;
  }}
  onRefresh={refresh}
  totalCount={totalCount}
/>
```

## 完整示例

### Products 页面示例

```typescript
import { DataTable, ColumnDefinition } from "../../components";
import { ProductView, useProducts } from "../../utils/powersync/hooks";

export default function ProductsScreen() {
  const { products, isLoading, refresh, count } = useProducts();

  const columns: ColumnDefinition<ProductView>[] = [
    {
      key: "image",
      title: "Image",
      width: 60,
      render: () => (
        <View className="w-12 h-12 bg-gray-100 rounded-lg">
          <Ionicons name="cube-outline" size={24} />
        </View>
      ),
    },
    {
      key: "name",
      title: "Product Name",
      width: "flex",
      hideable: false,
      render: (item) => (
        <View>
          <Text className="font-medium">{item.name}</Text>
          <Text className="text-gray-500 text-sm">SKU: {item.sku}</Text>
        </View>
      ),
    },
    {
      key: "price",
      title: "Price",
      width: 100,
      align: "center",
      render: (item) => (
        <Text className="text-green-600">
          ${item.salePrice.toFixed(2)}
        </Text>
      ),
    },
  ];

  return (
    <DataTable
      data={products}
      columns={columns}
      keyExtractor={(item) => item.id}
      searchable
      searchPlaceholder="Search products..."
      onSearch={(item, query) => 
        item.name.toLowerCase().includes(query.toLowerCase())
      }
      addButton
      addButtonText="Add Product"
      onAddPress={() => router.push("/catalog/add-product")}
      isLoading={isLoading}
      onRefresh={refresh}
      totalCount={count}
    />
  );
}
```

## API 参考

### DataTableProps

| 属性 | 类型 | 默认值 | 描述 |
|------|------|--------|------|
| `data` | `T[]` | - | **必需** - 数据源 |
| `columns` | `ColumnDefinition<T>[]` | - | **必需** - 列定义 |
| `keyExtractor` | `(item: T) => string` | - | **必需** - 获取唯一 key |
| `searchable` | `boolean` | `true` | 是否显示搜索框 |
| `searchPlaceholder` | `string` | `"Search..."` | 搜索框占位符 |
| `searchHint` | `string` | - | 搜索提示文本 |
| `onSearch` | `(item, query) => boolean` | - | 搜索过滤逻辑 |
| `filters` | `FilterDefinition[]` | `[]` | 过滤器定义 |
| `onFilter` | `(item, filters) => boolean` | - | 过滤逻辑 |
| `sortOptions` | `FilterOption[]` | `[]` | 排序选项 |
| `onSort` | `(data, sortBy) => T[]` | - | 排序逻辑 |
| `columnSelector` | `boolean` | `true` | 显示列选择器 |
| `bulkActions` | `boolean` | `false` | 显示批量操作 |
| `addButton` | `boolean` | `false` | 显示添加按钮 |
| `addButtonText` | `string` | `"Add New"` | 添加按钮文本 |
| `onAddPress` | `() => void` | - | 添加按钮点击 |
| `isLoading` | `boolean` | `false` | 加载状态 |
| `isStreaming` | `boolean` | `false` | 实时同步标识 |
| `refreshing` | `boolean` | `false` | 刷新状态 |
| `onRefresh` | `() => void \| Promise<void>` | - | 刷新回调 |
| `emptyIcon` | `string` | `"document-outline"` | 空状态图标 |
| `emptyText` | `string` | `"No data found"` | 空状态文本 |
| `totalCount` | `number` | - | 总数据量 |
| `horizontalScroll` | `boolean` | `false` | 横向滚动 |
| `minWidth` | `number` | `900` | 最小宽度 |
| `renderRow` | `(item, columns, visibleColumns) => ReactNode` | - | 自定义行渲染 |
| `onRowPress` | `(item) => void` | - | 行点击事件 |

### ColumnDefinition

| 属性 | 类型 | 默认值 | 描述 |
|------|------|--------|------|
| `key` | `string` | - | **必需** - 列唯一标识 |
| `title` | `string` | - | **必需** - 列标题 |
| `width` | `number \| "flex"` | `"flex"` | 列宽度 |
| `visible` | `boolean` | `true` | 默认是否可见 |
| `hideable` | `boolean` | `true` | 是否可隐藏 |
| `align` | `"left" \| "center" \| "right"` | `"left"` | 对齐方式 |
| `render` | `(item: T) => ReactNode` | - | 自定义渲染 |
| `sortKey` | `string` | - | 排序字段 |

### FilterDefinition

| 属性 | 类型 | 默认值 | 描述 |
|------|------|--------|------|
| `key` | `string` | - | **必需** - 过滤器标识 |
| `placeholder` | `string` | - | **必需** - 占位符 |
| `options` | `FilterOption[]` | - | **必需** - 过滤选项 |
| `width` | `number` | - | 过滤器宽度 |

## 最佳实践

### 1. 使用 TypeScript 类型

```typescript
// 定义数据类型
interface Product {
  id: string;
  name: string;
  price: number;
}

// 使用泛型
const columns: ColumnDefinition<Product>[] = [...];
<DataTable<Product> ... />
```

### 2. 提取可复用的渲染函数

```typescript
// 货币格式化
const formatCurrency = (value: number) => `$${value.toFixed(2)}`;

// 布尔图标
const BooleanIcon = ({ value }: { value: boolean }) => (
  <Ionicons 
    name={value ? "checkmark-circle" : "close-circle"} 
    color={value ? "#22c55e" : "#ef4444"} 
  />
);
```

### 3. 性能优化

```typescript
// 使用 useMemo 缓存列定义
const columns = useMemo<ColumnDefinition<Product>[]>(() => [
  // ... 列定义
], []);

// 使用 useCallback 缓存回调函数
const handleSearch = useCallback((item: Product, query: string) => {
  return item.name.toLowerCase().includes(query.toLowerCase());
}, []);
```

### 4. 复杂过滤逻辑

```typescript
const handleFilter = (item: Product, filters: Record<string, string | null>) => {
  // 多条件过滤
  if (filters.status && item.status !== filters.status) return false;
  if (filters.category && item.category !== filters.category) return false;
  if (filters.priceRange) {
    // 自定义价格范围逻辑
    if (filters.priceRange === "low" && item.price > 100) return false;
    if (filters.priceRange === "high" && item.price <= 100) return false;
  }
  return true;
};
```

## 迁移指南

### 从旧 Products 页面迁移

**旧代码 (约 500 行)**:
```typescript
// 需要手动管理状态
const [searchQuery, setSearchQuery] = useState("");
const [statusFilter, setStatusFilter] = useState<string | null>(null);
const [sortBy, setSortBy] = useState<string | null>(null);
const [visibleColumns, setVisibleColumns] = useState({...});

// 手动实现过滤逻辑
const filteredProducts = useMemo(() => {
  let result = [...products];
  if (searchQuery) {
    result = result.filter(p => p.name.includes(searchQuery));
  }
  // ... 更多过滤逻辑
  return result;
}, [products, searchQuery, ...]);

// 手动渲染表格头、行、Modal 等
```

**新代码 (约 200 行)**:
```typescript
// 只需定义列和过滤器
const columns: ColumnDefinition<Product>[] = [...];
const filters: FilterDefinition[] = [...];

// 使用 DataTable
<DataTable
  data={products}
  columns={columns}
  onSearch={handleSearch}
  onFilter={handleFilter}
  // ... 其他配置
/>
```

**代码减少 60%，更易维护！**

## 常见问题

### Q: 如何禁用某列的隐藏功能？
A: 设置 `hideable: false`

### Q: 如何实现自定义行点击？
A: 使用 `onRowPress` 属性

### Q: 如何支持横向滚动？
A: 设置 `horizontalScroll={true}` 和 `minWidth`

### Q: 如何自定义空状态？
A: 使用 `emptyIcon` 和 `emptyText` 属性

## 相关文件

- 组件实现: `components/DataTable.tsx`
- 示例页面: 
  - `app/catalog/products-new.tsx`
  - `app/inventory/stocks-new.tsx`
- 导出: `components/index.ts`
