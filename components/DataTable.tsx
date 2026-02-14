/**
 * DataTable - unified data table component
 * 
 * Supported features:
 * - Column definitions and custom rendering
 * - Search filtering
 * - Dropdown filters
 * - Column visibility toggle
 * - Refresh control
 * - Empty state display
 * - Loading state
 * - Real-time sync indicator
 */

import { Ionicons } from "@expo/vector-icons";
import { ReactElement, ReactNode, useCallback, useEffect, useMemo, useState } from "react";
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
  /** Column unique identifier */
  key: string;
  /** Column display title */
  title: string;
  /** Column width (flex or fixed) */
  width?: number | "flex";
  /** Whether visible by default */
  visible?: boolean;
  /** Whether hideable (false = always shown) */
  hideable?: boolean;
  /** Alignment */
  align?: "left" | "center" | "right";
  /** Custom render function */
  render?: (item: T) => ReactNode;
  /** Sort field (if sorting supported) */
  sortKey?: string;
}

export interface FilterOption {
  label: string;
  value: string;
}

export interface FilterDefinition {
  /** Filter unique identifier */
  key: string;
  /** Placeholder text */
  placeholder: string;
  /** Filter options */
  options: FilterOption[];
  /** Filter width */
  width?: number;
}

export interface DataTableProps<T = any> {
  /** Table title */
  title?: string;
  /** Data source */
  data: T[];
  /** Column definitions */
  columns: ColumnDefinition<T>[];
  /** Get unique key for data item */
  keyExtractor: (item: T) => string;
  
  // Search related
  /** Whether to show search box */
  searchable?: boolean;
  /** Search placeholder */
  searchPlaceholder?: string;
  /** Search hint text */
  searchHint?: string;
  /** Custom search filter logic */
  onSearch?: (item: T, query: string) => boolean;
  
  // Filter related
  /** Filter definitions */
  filters?: FilterDefinition[];
  /** Custom filter logic */
  onFilter?: (item: T, filters: Record<string, string | null>) => boolean;
  
  // Sort related
  /** Sort options */
  sortOptions?: FilterOption[];
  /** Custom sort logic */
  onSort?: (data: T[], sortBy: string | null) => T[];
  
  // Feature toggles
  /** Whether to show column selector */
  columnSelector?: boolean;
  /** Whether to show bulk action buttons */
  bulkActions?: boolean;
  /** Bulk action button text */
  bulkActionText?: string;
  /** Bulk action handler */
  onBulkActionPress?: (selectedRows: T[]) => void;
  /** Controlled selected row keys */
  selectedRowKeys?: string[];
  /** Selection change callback */
  onSelectionChange?: (selectedKeys: string[], selectedRows: T[]) => void;
  /** Whether to show add button */
  addButton?: boolean;
  /** Add button text */
  addButtonText?: string;
  /** Add button click handler */
  onAddPress?: () => void;
  
  // State
  /** Whether loading */
  isLoading?: boolean;
  /** Whether real-time synced */
  isStreaming?: boolean;
  /** Pull-to-refresh active */
  refreshing?: boolean;
  /** Refresh callback */
  onRefresh?: () => void | Promise<void>;
  
  // Empty state
  /** Empty state icon */
  emptyIcon?: keyof typeof Ionicons.glyphMap;
  /** Empty state text */
  emptyText?: string;
  
  // Stats
  /** Total displayed data count */
  totalCount?: number;
  
  // Styling
  /** Container style */
  containerStyle?: ViewStyle;
  /** Whether horizontal scroll is needed */
  horizontalScroll?: boolean;
  /** Min width (for horizontal scroll) */
  minWidth?: number;
  
  // Row rendering
  /** Custom row rendering */
  renderRow?: (item: T, columns: ColumnDefinition<T>[], visibleColumns: Record<string, boolean>) => ReactElement | null;
  /** Row click handler */
  onRowPress?: (item: T) => void;
}

// ============================================================================
// Helper Components
// ============================================================================

function TableCheckbox({
  checked = false,
  indeterminate = false,
  onPress,
  disabled = false,
}: {
  checked?: boolean;
  indeterminate?: boolean;
  onPress?: () => void;
  disabled?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      className={`w-5 h-5 border rounded items-center justify-center ${
        checked || indeterminate ? "bg-red-500 border-red-500" : "border-gray-300"
      } ${disabled ? "opacity-50" : ""}`}
    >
      {checked && <Ionicons name="checkmark" size={14} color="white" />}
      {!checked && indeterminate && <Ionicons name="remove" size={14} color="white" />}
    </Pressable>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export function DataTable<T = any>(props: DataTableProps<T>) {
  const {
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
    bulkActionText = "Bulk Actions",
    onBulkActionPress,
    selectedRowKeys: controlledSelectedRowKeys,
    onSelectionChange,
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
  const [internalSelectedRowKeys, setInternalSelectedRowKeys] = useState<string[]>([]);
  
  // Internal refresh state, supports external or auto-managed
  const isRefreshing = refreshing || internalRefreshing;
  
  // Wrap onRefresh, auto-manage refreshing state
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
  const hideableColumnKeys = useMemo(
    () => columns.filter((col) => col.hideable !== false).map((col) => col.key),
    [columns]
  );
  const allHideableColumnsSelected =
    hideableColumnKeys.length > 0 && hideableColumnKeys.every((key) => visibleColumns[key]);
  const noneHideableColumnsSelected =
    hideableColumnKeys.length > 0 && hideableColumnKeys.every((key) => !visibleColumns[key]);
  const setHideableColumnsVisibility = useCallback(
    (isVisible: boolean) => {
      setVisibleColumns((prev) => {
        const next = { ...prev };
        hideableColumnKeys.forEach((key) => {
          next[key] = isVisible;
        });
        return next;
      });
    },
    [hideableColumnKeys]
  );

  const keyToRow = useMemo(() => {
    const map = new Map<string, T>();
    data.forEach((row) => {
      map.set(keyExtractor(row), row);
    });
    return map;
  }, [data, keyExtractor]);

  const selectedRowKeys = controlledSelectedRowKeys ?? internalSelectedRowKeys;
  const selectedRowKeySet = useMemo(() => new Set(selectedRowKeys), [selectedRowKeys]);
  const selectedRows = useMemo(
    () => selectedRowKeys.map((k) => keyToRow.get(k)).filter(Boolean) as T[],
    [selectedRowKeys, keyToRow]
  );

  const setSelectedKeys = useCallback(
    (keys: string[]) => {
      const deduped = Array.from(new Set(keys));
      if (controlledSelectedRowKeys === undefined) {
        setInternalSelectedRowKeys(deduped);
      }
      onSelectionChange?.(
        deduped,
        deduped.map((k) => keyToRow.get(k)).filter(Boolean) as T[]
      );
    },
    [controlledSelectedRowKeys, keyToRow, onSelectionChange]
  );

  // Keep selection valid when data source changes
  useEffect(() => {
    if (!bulkActions || selectedRowKeys.length === 0) return;
    const validKeys = selectedRowKeys.filter((k) => keyToRow.has(k));
    if (validKeys.length !== selectedRowKeys.length) {
      setSelectedKeys(validKeys);
    }
  }, [bulkActions, selectedRowKeys, keyToRow, setSelectedKeys]);

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

  const filteredKeys = useMemo(
    () => filteredData.map((item) => keyExtractor(item)),
    [filteredData, keyExtractor]
  );
  const allFilteredSelected =
    filteredKeys.length > 0 && filteredKeys.every((k) => selectedRowKeySet.has(k));
  const someFilteredSelected =
    filteredKeys.length > 0 && filteredKeys.some((k) => selectedRowKeySet.has(k));

  const toggleRowSelection = useCallback(
    (key: string) => {
      if (selectedRowKeySet.has(key)) {
        setSelectedKeys(selectedRowKeys.filter((k) => k !== key));
      } else {
        setSelectedKeys([...selectedRowKeys, key]);
      }
    },
    [selectedRowKeySet, selectedRowKeys, setSelectedKeys]
  );

  const toggleSelectAllFiltered = useCallback(() => {
    if (allFilteredSelected) {
      const filteredSet = new Set(filteredKeys);
      setSelectedKeys(selectedRowKeys.filter((k) => !filteredSet.has(k)));
      return;
    }
    setSelectedKeys([...selectedRowKeys, ...filteredKeys]);
  }, [allFilteredSelected, filteredKeys, selectedRowKeys, setSelectedKeys]);

  // Render default row
  const renderDefaultRow = (item: T) => (
    <Pressable 
      className="flex-row items-center py-3 px-5 border-b border-gray-100 bg-white"
      onPress={() => {
        if (bulkActions && !onRowPress) {
          toggleRowSelection(keyExtractor(item));
          return;
        }
        onRowPress?.(item);
      }}
    >
      {bulkActions && (
        <View className="w-8 mr-4">
          <TableCheckbox
            checked={selectedRowKeySet.has(keyExtractor(item))}
            onPress={() => toggleRowSelection(keyExtractor(item))}
          />
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
          <TableCheckbox
            checked={allFilteredSelected}
            indeterminate={!allFilteredSelected && someFilteredSelected}
            onPress={toggleSelectAllFiltered}
          />
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
            <Pressable
              className={`px-4 py-2 rounded-lg flex-row items-center gap-2 ${
                onBulkActionPress && selectedRows.length === 0 ? "bg-red-300" : "bg-red-500"
              }`}
              onPress={() => onBulkActionPress?.(selectedRows)}
              disabled={!!onBulkActionPress && selectedRows.length === 0}
            >
              <Text className="text-white font-medium">
                {bulkActionText}
                {selectedRows.length > 0 ? ` (${selectedRows.length})` : ""}
              </Text>
              {!onBulkActionPress && <Ionicons name="chevron-down" size={16} color="white" />}
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
              <View className="flex-row items-center justify-between mb-2">
                <Text className="text-xl font-semibold text-gray-800">Select Columns</Text>
                <Pressable onPress={() => setShowColumnsModal(false)}>
                  <Ionicons name="close" size={24} color="#9CA3AF" />
                </Pressable>
              </View>

              <View className="flex-row items-center justify-end mb-4">
                <Pressable
                  className="py-1"
                  onPress={() => setHideableColumnsVisibility(true)}
                  disabled={hideableColumnKeys.length === 0 || allHideableColumnsSelected}
                >
                  <Text className={`${allHideableColumnsSelected ? "text-gray-300" : "text-gray-500"} text-xs font-medium`}>
                    Select all
                  </Text>
                </Pressable>
                <Text className="text-gray-300 text-xs px-2">|</Text>
                <Pressable
                  className="py-1"
                  onPress={() => setHideableColumnsVisibility(false)}
                  disabled={hideableColumnKeys.length === 0 || noneHideableColumnsSelected}
                >
                  <Text className={`${noneHideableColumnsSelected ? "text-gray-300" : "text-gray-500"} text-xs font-medium`}>
                    Clear
                  </Text>
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
