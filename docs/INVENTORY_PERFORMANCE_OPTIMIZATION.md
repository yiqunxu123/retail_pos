# 🚀 Inventory 页面性能优化方案

## 📊 当前性能问题

### 性能数据

| 操作 | 时间 | 说明 |
|------|------|------|
| SQL 查询 | **~1000ms** | ⚠️ 主要瓶颈 |
| 数据绑定 | ~550ms | 数据转换和状态更新 |
| UI 渲染 | ~2ms | 渲染本身很快 |
| **总计** | **~1600ms** | 用户感知的翻页延迟 |

### 问题根源

**复杂的 SQL 查询**：
```sql
WITH stock_by_status AS (
  SELECT
    s.product_id,
    s.channel_id,
    -- 7 个 SUM(CASE WHEN ...) 聚合
  FROM stocks s
  GROUP BY s.product_id, s.channel_id  -- ⚠️ 扫描整个表
)
SELECT * FROM stock_by_status
INNER JOIN products p ON ...
LEFT JOIN channels ch ON ...
LEFT JOIN categories c ON ...
LEFT JOIN brands b ON ...
WHERE ...
ORDER BY p.name ASC
LIMIT 10 OFFSET 10
```

**为什么慢？**
1. **CTE 聚合**：每次都要扫描整个 `stocks` 表（可能有几千行）
2. **多个 SUM(CASE WHEN ...)**：7 个条件聚合
3. **GROUP BY**：按 product_id 和 channel_id 分组
4. **多表 JOIN**：5 个表的连接
5. **每次翻页都重新执行**：没有缓存

---

## 🎯 优化方案

### 方案 1: 物化视图（最佳，需要后端支持）⭐⭐⭐⭐⭐

**原理**：在后端 PostgreSQL 创建物化视图，预先计算好聚合结果。

#### 后端实现

```sql
-- 1. 创建物化视图
CREATE MATERIALIZED VIEW stock_aggregates AS
SELECT
  s.product_id,
  s.channel_id,
  SUM(CASE WHEN s.status NOT IN (7,9,10,11) THEN s.qty ELSE 0 END) AS total_qty,
  SUM(CASE WHEN s.status = 6 THEN s.qty ELSE 0 END) AS available_qty,
  SUM(CASE WHEN s.status = 3 THEN s.qty ELSE 0 END) AS on_hold_qty,
  SUM(CASE WHEN s.status = 8 THEN s.qty ELSE 0 END) AS damage_qty,
  SUM(CASE WHEN s.status = 9 THEN s.qty ELSE 0 END) AS back_order_qty,
  SUM(CASE WHEN s.status = 11 THEN s.qty ELSE 0 END) AS coming_soon_qty,
  SUM(CASE WHEN s.status = 10 THEN s.qty ELSE 0 END) AS hold_free_shipment,
  NOW() AS updated_at
FROM stocks s
GROUP BY s.product_id, s.channel_id;

-- 2. 创建索引
CREATE INDEX idx_stock_aggregates_product_channel 
ON stock_aggregates(product_id, channel_id);

-- 3. 定时刷新（每分钟）
CREATE OR REPLACE FUNCTION refresh_stock_aggregates()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY stock_aggregates;
END;
$$ LANGUAGE plpgsql;

-- 4. 设置定时任务
SELECT cron.schedule('refresh-stock-aggregates', '* * * * *', 
  'SELECT refresh_stock_aggregates()');
```

#### PowerSync 配置

```yaml
# sync_rules.yaml
streams:
  stock_aggregates:
    auto_subscribe: true
    query: |
      SELECT 
        product_id,
        channel_id,
        total_qty,
        available_qty,
        on_hold_qty,
        damage_qty,
        back_order_qty,
        coming_soon_qty,
        hold_free_shipment
      FROM stock_aggregates
```

#### App 端修改

```typescript
// utils/powersync/schema.ts
const stock_aggregates = new Table({
  product_id: column.integer,
  channel_id: column.integer,
  total_qty: column.integer,
  available_qty: column.integer,
  on_hold_qty: column.integer,
  damage_qty: column.integer,
  back_order_qty: column.integer,
  coming_soon_qty: column.integer,
  hold_free_shipment: column.integer,
  updated_at: column.text,
}, {
  indexes: {
    idx_stock_agg_product_channel: ['product_id', 'channel_id'],
  },
});

// 添加到 Schema
export const AppSchema = new Schema({
  // ... 其他表
  stock_aggregates,
});
```

```typescript
// utils/powersync/hooks/useStocks.ts
// 修改查询，使用 stock_aggregates 替代 CTE
const dataQuery = `
  SELECT
    CAST(sa.product_id AS TEXT) || '-' || CAST(sa.channel_id AS TEXT) AS id,
    sa.channel_id,
    sa.product_id,
    sa.available_qty,
    sa.on_hold_qty,
    sa.damage_qty,
    sa.back_order_qty,
    sa.coming_soon_qty,
    sa.hold_free_shipment,
    sa.total_qty,
    p.status,
    p.deleted_at,
    p.name AS product_name,
    p.sku,
    p.upc,
    p.bin,
    p.zone,
    p.aisle,
    ch.name AS channel_name,
    c.name AS category_name,
    b.name AS brand_name
  FROM stock_aggregates sa
  INNER JOIN products p ON sa.product_id = p.id
  LEFT JOIN channels ch ON sa.channel_id = ch.id
  LEFT JOIN categories c ON p.main_category_id = c.id
  LEFT JOIN brands b ON p.brand_id = b.id
  ${whereClause}
  ORDER BY p.name ASC
  ${paginationClause}
`;
```

**性能提升**：
- 查询时间：~1000ms → **~50ms** ✅
- 翻页延迟：~1600ms → **~600ms** ✅
- **提升 20 倍**

---

### 方案 2: 客户端缓存（立即可实施，无需后端）⭐⭐⭐

**原理**：首次加载时查询所有数据，缓存在内存中，翻页时直接从缓存读取。

#### 实现代码

```typescript
// utils/powersync/hooks/useStocks.ts

// 添加缓存
const stocksCacheRef = useRef<{
  filters: string;
  data: StockJoinRow[];
  count: number;
  timestamp: number;
}>({ filters: '', data: [], count: 0, timestamp: 0 });

export function useStocks(
  filters: StocksQueryFilters = {},
  pagination?: StocksPaginationOptions,
  perfCallbacks?: StocksPerfCallbacks,
  streamOptions?: { deferInteractions?: boolean }
) {
  const pageSize = pagination?.pageSize || 10;
  const page = pagination?.page || 1;
  
  // 生成筛选条件的唯一 key
  const filtersKey = useMemo(() => JSON.stringify(filters), [filters]);
  
  // 检查缓存
  const cache = stocksCacheRef.current;
  const isCacheValid = cache.filters === filtersKey && 
                       Date.now() - cache.timestamp < 60000; // 1分钟有效期
  
  // 如果缓存有效，直接使用缓存数据
  if (isCacheValid && cache.data.length > 0) {
    const startIdx = (page - 1) * pageSize;
    const endIdx = startIdx + pageSize;
    const paginatedData = cache.data.slice(startIdx, endIdx);
    
    return {
      stocks: paginatedData.map(toStockView),
      isLoading: false,
      error: null,
      isStreaming: false,
      refresh: () => {
        // 清空缓存，强制重新查询
        stocksCacheRef.current = { filters: '', data: [], count: 0, timestamp: 0 };
      },
      count: cache.count,
    };
  }
  
  // 缓存无效，查询所有数据（不分页）
  const queryConfig = useMemo(
    () => buildStocksQuery(filters, { limit: undefined, offset: undefined }), // ⚠️ 不分页
    [filters]
  );
  
  const { data, isLoading, error, isStreaming, refresh } = useSyncStream<StockJoinRow>(
    queryConfig.dataQuery.query,
    queryConfig.dataQuery.params,
    { /* ... */ }
  );
  
  // 更新缓存
  useEffect(() => {
    if (data.length > 0 && !isLoading) {
      stocksCacheRef.current = {
        filters: filtersKey,
        data: data,
        count: data.length,
        timestamp: Date.now(),
      };
    }
  }, [data, isLoading, filtersKey]);
  
  // 客户端分页
  const startIdx = (page - 1) * pageSize;
  const endIdx = startIdx + pageSize;
  const paginatedData = data.slice(startIdx, endIdx);
  
  return {
    stocks: paginatedData.map(toStockView),
    isLoading,
    error,
    isStreaming,
    refresh: () => {
      stocksCacheRef.current = { filters: '', data: [], count: 0, timestamp: 0 };
      refresh();
    },
    count: data.length,
  };
}
```

**优点**:
- ✅ 无需后端修改
- ✅ 立即可实施
- ✅ 翻页时间：~1000ms → **~10ms**
- ✅ 首次加载稍慢，但后续翻页极快

**缺点**:
- ⚠️ 首次加载需要查询所有数据（可能需要 2-3 秒）
- ⚠️ 内存占用增加（但通常不超过 1MB）

---

### 方案 3: 优化 SQL 查询（中等效果）⭐⭐⭐

**原理**：简化 CTE，减少不必要的计算。

#### 优化前

```sql
WITH stock_by_status AS (
  SELECT
    s.product_id,
    s.channel_id,
    SUM(CASE WHEN s.status NOT IN (7,9,10,11) THEN s.qty ELSE 0 END) AS total_qty,
    SUM(CASE WHEN s.status = 6 THEN s.qty ELSE 0 END) AS available_qty,
    -- ... 7 个聚合
  FROM stocks s
  GROUP BY s.product_id, s.channel_id
)
```

#### 优化后

```sql
-- 使用子查询替代 CTE（某些数据库引擎更快）
SELECT
  CAST(agg.product_id AS TEXT) || '-' || CAST(agg.channel_id AS TEXT) AS id,
  agg.*,
  p.name AS product_name,
  -- ...
FROM (
  SELECT
    s.product_id,
    s.channel_id,
    SUM(CASE WHEN s.status = 6 THEN s.qty ELSE 0 END) AS available_qty,
    SUM(CASE WHEN s.status = 3 THEN s.qty ELSE 0 END) AS on_hold_qty,
    -- ... 只计算必要的字段
  FROM stocks s
  WHERE s.status IN (3, 6, 8, 9, 10, 11)  -- ⚠️ 添加 WHERE 减少扫描
  GROUP BY s.product_id, s.channel_id
) agg
INNER JOIN products p ON agg.product_id = p.id
-- ...
```

**优点**:
- ✅ 无需后端修改
- ✅ 添加 WHERE 条件减少扫描行数

**缺点**:
- ⚠️ 效果有限（可能只提升 20-30%）

---

### 方案 4: 分批加载（用户体验优化）⭐⭐⭐⭐

**原理**：先显示骨架屏，后台异步加载数据。

#### 实现代码

```typescript
// app/inventory/stocks.tsx

export default function StocksScreen() {
  const [showSkeleton, setShowSkeleton] = useState(true);
  
  const { stocks, isLoading, count } = useStocks(
    queryFilters,
    { page: tablePage, pageSize: tablePageSize },
    perfCallbacks,
    { deferInteractions: true }  // ⚠️ 延迟到 InteractionManager 完成
  );
  
  useEffect(() => {
    if (!isLoading) {
      // 数据加载完成后隐藏骨架屏
      setShowSkeleton(false);
    }
  }, [isLoading]);
  
  if (showSkeleton && isLoading) {
    return (
      <>
        <PageHeader title="Stocks" showBack={false} />
        <DataTableSkeleton />  {/* 骨架屏 */}
      </>
    );
  }
  
  return (
    <>
      <PageHeader title="Stocks" showBack={false} />
      <DataTable data={stocks} loading={isLoading} />
    </>
  );
}
```

**优点**:
- ✅ 用户立即看到界面
- ✅ 感知延迟减少
- ✅ 无需修改查询

**缺点**:
- ⚠️ 实际查询时间没有减少

---

## 🏆 推荐方案

### 短期方案（立即实施）：方案 2 + 方案 4

**组合优化**：
1. **客户端缓存**：首次加载所有数据，翻页时使用缓存
2. **骨架屏**：首次加载时显示骨架屏，提升用户体验

**预期效果**：
- 首次加载：~2000ms（显示骨架屏，用户感知良好）
- 后续翻页：**~10ms** ✅（从缓存读取）
- 筛选/搜索：~2000ms（重新查询）

---

### 长期方案（需要后端）：方案 1

**物化视图**：
- 后端预先计算聚合结果
- PowerSync 同步到本地
- 查询时间：~1000ms → **~50ms**
- 翻页延迟：~1600ms → **~600ms**

---

## 📝 实施步骤

### 步骤 1: 实施客户端缓存（立即）

修改 `utils/powersync/hooks/useStocks.ts`，添加缓存逻辑。

### 步骤 2: 添加骨架屏（立即）

修改 `app/inventory/stocks.tsx`，添加 loading 骨架屏。

### 步骤 3: 后端物化视图（长期）

1. 在后端 PostgreSQL 创建物化视图
2. 配置定时刷新
3. 添加到 PowerSync sync_rules.yaml
4. 修改 App 端查询逻辑

---

## 🔍 其他优化点

### 1. 减少不必要的字段

**当前**：查询 20+ 个字段
**优化**：只查询显示在表格中的字段

### 2. 延迟加载价格信息

**当前**：每次都查询 unit_prices
**优化**：只在需要时查询（如编辑时）

### 3. 虚拟滚动

**当前**：使用 FlatList 虚拟滚动（已实施）
**优化**：已经是最优

---

## 📊 性能对比

| 方案 | 首次加载 | 翻页时间 | 实施难度 | 推荐度 |
|------|---------|---------|---------|--------|
| 当前 | ~1600ms | ~1600ms | - | ⭐ |
| 客户端缓存 | ~2000ms | **~10ms** | 低 | ⭐⭐⭐⭐ |
| 物化视图 | **~600ms** | **~600ms** | 高 | ⭐⭐⭐⭐⭐ |
| SQL 优化 | ~1200ms | ~1200ms | 低 | ⭐⭐ |
| 骨架屏 | ~1600ms* | ~1600ms* | 低 | ⭐⭐⭐ |

*感知延迟减少

---

## 🎯 建议

**立即实施**：
1. ✅ 客户端缓存（翻页时间 ~10ms）
2. ✅ 骨架屏（提升用户体验）

**长期规划**：
1. ✅ 后端物化视图（所有查询都快）

---

## 💡 代码示例

### 完整的客户端缓存实现

见附件：`useStocks_cached.ts`（待实施）

### 骨架屏组件

```typescript
function DataTableSkeleton() {
  return (
    <View style={{ flex: 1, padding: 16 }}>
      <View style={{ backgroundColor: '#fff', borderRadius: 12, padding: 16 }}>
        {/* 表头 */}
        <View style={{ flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#E5E7EB', paddingBottom: 12 }}>
          {[1,2,3,4,5].map(i => (
            <View key={i} style={{ flex: 1, height: 20, backgroundColor: '#F3F4F6', borderRadius: 4, marginHorizontal: 4 }} />
          ))}
        </View>
        
        {/* 数据行 */}
        {[1,2,3,4,5,6,7,8,9,10].map(i => (
          <View key={i} style={{ flexDirection: 'row', paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' }}>
            {[1,2,3,4,5].map(j => (
              <View key={j} style={{ flex: 1, height: 16, backgroundColor: '#F9FAFB', borderRadius: 4, marginHorizontal: 4 }} />
            ))}
          </View>
        ))}
      </View>
      
      <View style={{ alignItems: 'center', marginTop: 16 }}>
        <ActivityIndicator size="large" color="#EC1A52" />
        <Text style={{ marginTop: 8, color: '#6B7280' }}>Loading stocks...</Text>
      </View>
    </View>
  );
}
```

---

## 🚀 预期效果

### 实施客户端缓存后

**首次加载**（用户打开页面）:
```
点击 → 显示骨架屏 (100ms) → 查询数据 (2000ms) → 显示数据
用户感知：立即看到界面，2秒后看到数据
```

**翻页**（用户点击 Page 2）:
```
点击 → 从缓存读取 (10ms) → 显示数据
用户感知：几乎瞬间完成
```

**筛选/搜索**（用户修改筛选条件）:
```
点击 → 清空缓存 → 显示骨架屏 → 查询数据 (2000ms) → 显示数据
用户感知：与首次加载相同
```

---

## 📝 总结

**核心问题**：复杂的 SQL 聚合查询导致每次翻页都需要 ~1000ms

**最佳解决方案**：
1. **短期**：客户端缓存 + 骨架屏（翻页 ~10ms）
2. **长期**：后端物化视图（所有查询 ~50ms）

**实施优先级**：
1. 🔥 立即：添加骨架屏（提升用户体验）
2. 🔥 本周：实施客户端缓存（翻页极快）
3. 📅 长期：后端物化视图（根本解决）
