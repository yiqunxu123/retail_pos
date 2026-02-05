/**
 * DataTable - 统一的数据表格组件
 * 
 * 支持功能:
 * - 列定义和自定义渲染
 * - 搜索过滤
 * - 下拉过滤器
 * - 列可见性切换
 * - 刷新控制
 * - 空状态显示
 * - Loading 状态
 * - 实时同步标识
 */

import { Ionicons } from "@expo/vector-icons";
import { ReactNode, useCallback, useMemo, useState } from "react";
import {
    ActivityIndicator,
    FlatList,
    Modal,
    Pressable,
    RefreshControl,
    ScrollView,
    Text,
    TextInput,
    View,
    ViewStyle,
} from "react-native";
import { FilterDropdown } from "./FilterDropdown";

// ============================================================================
// Types
// ============================================================================

export interface ColumnDefinition<T = any> {
  /** 列唯一标识 */
  key: string;
  /** 列显示标题 */
  title: string;
  /** 列宽度 (flex 或固定宽度) */
  width?: number | "flex";
  /** 是否默认可见 */
  visible?: boolean;
  /** 是否可以隐藏 (false 表示强制显示) */
  hideable?: boolean;
  /** 对齐方式 */
  align?: "left" | "center" | "right";
  /** 自定义渲染函数 */
  render?: (item: T) => ReactNode;
  /** 排序字段 (如果支持排序) */
  sortKey?: string;
}

export interface FilterOption {
  label: string;
  value: string;
}

export interface FilterDefinition {
  /** 过滤器唯一标识 */
  key: string;
  /** 占位符文本 */
  placeholder: string;
  /** 过滤选项 */
  options: FilterOption[];
  /** 过滤器宽度 */
  width?: number;
}

export interface DataTableProps<T = any> {
  /** 表格标题 */
  title?: string;
  /** 数据源 */
  data: T[];
  /** 列定义 */
  columns: ColumnDefinition<T>[];
  /** 获取数据项的唯一 key */
  keyExtractor: (item: T) => string;
  
  // 搜索相关
  /** 是否显示搜索框 */
  searchable?: boolean;
  /** 搜索占位符 */
  searchPlaceholder?: string;
  /** 搜索提示文本 */
  searchHint?: string;
  /** 自定义搜索过滤逻辑 */
  onSearch?: (item: T, query: string) => boolean;
  
  // 过滤器相关
  /** 过滤器定义 */
  filters?: FilterDefinition[];
  /** 自定义过滤逻辑 */
  onFilter?: (item: T, filters: Record<string, string | null>) => boolean;
  
  // 排序相关
  /** 排序选项 */
  sortOptions?: FilterOption[];
  /** 自定义排序逻辑 */
  onSort?: (data: T[], sortBy: string | null) => T[];
  
  // 功能开关
  /** 是否显示列选择器 */
  columnSelector?: boolean;
  /** 是否显示批量操作按钮 */
  bulkActions?: boolean;
  /** 是否显示添加按钮 */
  addButton?: boolean;
  /** 添加按钮文本 */
  addButtonText?: string;
  /** 添加按钮点击事件 */
  onAddPress?: () => void;
  
  // 状态
  /** 是否加载中 */
  isLoading?: boolean;
  /** 是否实时同步 */
  isStreaming?: boolean;
  /** 下拉刷新中 */
  refreshing?: boolean;
  /** 刷新回调 */
  onRefresh?: () => void | Promise<void>;
  
  // 空状态
  /** 空状态图标 */
  emptyIcon?: keyof typeof Ionicons.glyphMap;
  /** 空状态文本 */
  emptyText?: string;
  
  // 统计信息
  /** 显示的数据总数 */
  totalCount?: number;
  
  // 样式
  /** 容器样式 */
  containerStyle?: ViewStyle;
  /** 是否需要横向滚动 */
  horizontalScroll?: boolean;
  /** 最小宽度 (横向滚动时) */
  minWidth?: number;
  
  // 行渲染
  /** 自定义行渲染 */
  renderRow?: (item: T, columns: ColumnDefinition<T>[], visibleColumns: Record<string, boolean>) => ReactNode;
  /** 行点击事件 */
  onRowPress?: (item: T) => void;
}

// ============================================================================
// Helper Components
// ============================================================================

function TableCheckbox() {
  return <View className="w-5 h-5 border border-gray-300 rounded" />;
}

// ============================================================================
// Main Component
// ============================================================================

export function DataTable<T = any>(props: DataTableProps<T>) {
  const {
    title,
    data,
    columns,
    keyExtractor,
    searchable = true,
    searchPlaceholder = "Search...",
    searchHint,
    onSearch,
    filters = [],
    onFilter,
    sortOptions = [],
    onSort,
    columnSelector = true,
    bulkActions = false,
    addButton = false,
    addButtonText = "Add New",
    onAddPress,
    isLoading = false,
    isStreaming = false,
    refreshing = false,
    onRefresh,
    emptyIcon = "document-outline",
    emptyText = "No data found",
    totalCount,
    containerStyle,
    horizontalScroll = false,
    minWidth = 900,
    renderRow,
    onRowPress,
  } = props;

  // State
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilters, setActiveFilters] = useState<Record<string, string | null>>({});
  const [sortBy, setSortBy] = useState<string | null>(null);
  const [showColumnsModal, setShowColumnsModal] = useState(false);
  const [internalRefreshing, setInternalRefreshing] = useState(false);
  
  // 内部管理的刷新状态，支持外部传入或内部自动管理
  const isRefreshing = refreshing || internalRefreshing;
  
  // 包装 onRefresh，自动管理 refreshing 状态
  const handleRefresh = useCallback(async () => {
    if (!onRefresh || isRefreshing) return;
    
    setInternalRefreshing(true);
    try {
      await onRefresh();
    } finally {
      setInternalRefreshing(false);
    }
  }, [onRefresh, isRefreshing]);
  
  // Column visibility state
  const [visibleColumns, setVisibleColumns] = useState<Record<string, boolean>>(
    columns.reduce((acc, col) => {
      acc[col.key] = col.visible !== false;
      return acc;
    }, {} as Record<string, boolean>)
  );

  const toggleColumn = (key: string) => {
    setVisibleColumns(prev => ({ ...prev, [key]: !prev[key] }));
  };

  // Filter handler
  const handleFilterChange = (filterKey: string, value: string | null) => {
    setActiveFilters(prev => ({ ...prev, [filterKey]: value }));
  };

  // Filter and sort data
  const filteredData = useMemo(() => {
    let result = [...data];

    // Apply search
    if (searchQuery && onSearch) {
      result = result.filter(item => onSearch(item, searchQuery));
    }

    // Apply filters
    if (Object.keys(activeFilters).length > 0 && onFilter) {
      result = result.filter(item => onFilter(item, activeFilters));
    }

    // Apply sorting
    if (sortBy && onSort) {
      result = onSort(result, sortBy);
    }

    return result;
  }, [data, searchQuery, activeFilters, sortBy, onSearch, onFilter, onSort]);

  // Render default row
  const renderDefaultRow = (item: T) => (
    <Pressable 
      className="flex-row items-center py-3 px-5 border-b border-gray-100 bg-white"
      onPress={() => onRowPress?.(item)}
    >
      {bulkActions && (
        <View className="w-8 mr-4">
          <TableCheckbox />
        </View>
      )}
      {columns.map((col) => {
        if (!visibleColumns[col.key]) return null;
        
        const width = col.width === "flex" ? { flex: 1 } : col.width ? { width: col.width } : { flex: 1 };
        const align = col.align || "left";
        
        return (
          <View 
            key={col.key} 
            style={width}
            className={`${align === "center" ? "items-center" : align === "right" ? "items-end" : ""}`}
          >
            {col.render ? col.render(item) : <Text className="text-gray-800">-</Text>}
          </View>
        );
      })}
    </Pressable>
  );

  // Render table header
  const renderHeader = () => (
    <View className="flex-row bg-gray-50 py-3 px-5 border-b border-gray-200">
      {bulkActions && (
        <View className="w-8 mr-4">
          <TableCheckbox />
        </View>
      )}
      {columns.map((col) => {
        if (!visibleColumns[col.key]) return null;
        
        const width = col.width === "flex" ? { flex: 1 } : col.width ? { width: col.width } : { flex: 1 };
        const align = col.align || "left";
        
        return (
          <Text 
            key={col.key}
            style={width}
            className={`text-gray-500 text-xs font-semibold uppercase ${
              align === "center" ? "text-center" : align === "right" ? "text-right" : ""
            }`}
          >
            {col.title}
          </Text>
        );
      })}
    </View>
  );

  // Loading state
  if (isLoading && data.length === 0) {
    return (
      <View className="flex-1 bg-gray-50" style={containerStyle}>
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text className="mt-4 text-gray-600">Loading...</Text>
        </View>
      </View>
    );
  }

  // Main render
  const tableContent = (
    <View className="flex-1 bg-gray-50" style={containerStyle}>
      {/* Toolbar */}
      <View className="bg-white px-5 py-4 border-b border-gray-200">
        {/* Action Buttons */}
        <View className="flex-row items-center gap-3 mb-4">
          {bulkActions && (
            <Pressable className="bg-red-500 px-4 py-2 rounded-lg flex-row items-center gap-2">
              <Text className="text-white font-medium">Bulk Actions</Text>
              <Ionicons name="chevron-down" size={16} color="white" />
            </Pressable>
          )}
          {columnSelector && (
            <Pressable 
              className="bg-gray-100 px-4 py-2 rounded-lg flex-row items-center gap-2"
              onPress={() => setShowColumnsModal(true)}
            >
              <Ionicons name="grid" size={16} color="#374151" />
              <Text className="text-gray-700">Columns</Text>
            </Pressable>
          )}
          {isStreaming && (
            <View className="flex-row items-center gap-1 ml-2">
              <Text className="text-green-600 text-xs">● Live</Text>
            </View>
          )}
          <View className="flex-1" />
          {addButton && onAddPress && (
            <Pressable 
              className="px-4 py-2 rounded-lg flex-row items-center gap-2"
              style={{ backgroundColor: "#3B82F6" }}
              onPress={onAddPress}
            >
              <Text className="text-white font-medium">{addButtonText}</Text>
            </Pressable>
          )}
        </View>

        {/* Search & Filters */}
        {(searchable || filters.length > 0 || sortOptions.length > 0) && (
          <>
            {searchHint && (
              <Text className="text-gray-500 text-sm mb-2">{searchHint}</Text>
            )}
            <View className="flex-row gap-4">
              {searchable && (
                <View className="flex-1">
                  <TextInput
                    className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5"
                    placeholder={searchPlaceholder}
                    placeholderTextColor="#9ca3af"
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                  />
                </View>
              )}
              {filters.map((filter) => (
                <FilterDropdown
                  key={filter.key}
                  label=""
                  value={activeFilters[filter.key] || null}
                  options={filter.options}
                  onChange={(value) => handleFilterChange(filter.key, value)}
                  placeholder={filter.placeholder}
                  width={filter.width}
                />
              ))}
              {sortOptions.length > 0 && (
                <FilterDropdown
                  label=""
                  value={sortBy}
                  options={sortOptions}
                  onChange={setSortBy}
                  placeholder="Sort By"
                  width={150}
                />
              )}
            </View>
          </>
        )}

        {/* Results count */}
        <Text className="text-gray-400 text-sm mt-2">
          Showing {filteredData.length}{totalCount ? ` of ${totalCount}` : ""} items
        </Text>
      </View>

      {/* Data Table */}
      <View className="flex-1">
        {renderHeader()}
        <FlatList
          data={filteredData}
          keyExtractor={keyExtractor}
          renderItem={({ item }) => renderRow ? renderRow(item, columns, visibleColumns) : renderDefaultRow(item)}
          showsVerticalScrollIndicator={false}
          refreshControl={
            onRefresh ? (
              <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
            ) : undefined
          }
          ListEmptyComponent={
            <View className="py-16 items-center">
              <Ionicons name={emptyIcon} size={48} color="#d1d5db" />
              <Text className="text-gray-400 mt-2">{emptyText}</Text>
            </View>
          }
        />
      </View>

      {/* Columns Selection Modal */}
      {columnSelector && (
        <Modal
          visible={showColumnsModal}
          transparent
          animationType="fade"
          onRequestClose={() => setShowColumnsModal(false)}
        >
          <View className="flex-1 bg-black/50 justify-center items-center">
            <View className="bg-white rounded-xl w-80 max-w-[90%] p-6">
              {/* Header */}
              <View className="flex-row items-center justify-between mb-6">
                <Text className="text-xl font-semibold text-gray-800">Select Columns</Text>
                <Pressable onPress={() => setShowColumnsModal(false)}>
                  <Ionicons name="close" size={24} color="#9CA3AF" />
                </Pressable>
              </View>

              {/* Column Options */}
              <ScrollView className="max-h-96" showsVerticalScrollIndicator={false}>
                {columns.map((col) => {
                  const isHideable = col.hideable !== false;
                  const isVisible = visibleColumns[col.key];
                  
                  return (
                    <Pressable 
                      key={col.key}
                      className="flex-row items-center py-3"
                      onPress={() => isHideable && toggleColumn(col.key)}
                      disabled={!isHideable}
                    >
                      <View 
                        className={`w-5 h-5 rounded border mr-3 items-center justify-center ${
                          isVisible ? 'bg-red-500 border-red-500' : 'border-gray-300'
                        } ${!isHideable ? 'opacity-50' : ''}`}
                      >
                        {isVisible && <Ionicons name="checkmark" size={14} color="white" />}
                      </View>
                      <Text className={`text-base ${!isHideable ? 'text-gray-400' : 'text-gray-700'}`}>
                        {col.title}
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>

              {/* Footer Button */}
              <Pressable
                className="mt-6 py-3 rounded-lg items-center"
                style={{ backgroundColor: "#3B82F6" }}
                onPress={() => setShowColumnsModal(false)}
              >
                <Text className="text-white font-medium">Done</Text>
              </Pressable>
            </View>
          </View>
        </Modal>
      )}
    </View>
  );

  // For horizontal scroll mode
  // The table should fill available space but allow scrolling if content exceeds viewport
  if (horizontalScroll) {
    return (
      <View className="flex-1">
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ flexGrow: 1, minWidth }}
        >
          <View className="flex-1" style={{ minWidth }}>
            {tableContent}
          </View>
        </ScrollView>
      </View>
    );
  }

  return tableContent;
}
