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
import React, { ReactElement, ReactNode, useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
  ViewStyle,
} from "react-native";
import { FilterDropdown } from "./FilterDropdown";
import { TableToolbarButton } from "./TableToolbarButton";

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
  /** Whether this filter supports multiple selected values */
  multiple?: boolean;
  /** Default selected value */
  defaultValue?: string | string[] | null;
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
  /** Called when search query text changes */
  onSearchQueryChange?: (query: string) => void;
  /** Default search query text */
  defaultSearchQuery?: string;
  /** Controlled search query text */
  searchQueryValue?: string;
  
  // Filter related
  /** Filter definitions */
  filters?: FilterDefinition[];
  /** Custom filter logic */
  onFilter?: (item: T, filters: Record<string, any>) => boolean;
  /** Called when active filters change */
  onFiltersChange?: (filters: Record<string, string | string[] | null>) => void;
  /** Controlled filter values */
  filterValues?: Record<string, string | string[] | null>;
  /** Whether to render filters in the top action row */
  filtersInActionRow?: boolean;
  /** Custom content rendered in the action row */
  actionRowExtras?: ReactNode;
  /** Extra content rendered inside the Settings/Columns modal (e.g. advance filters) */
  settingsModalExtras?: ReactNode;
  /** Called when the settings/columns modal opens */
  onSettingsModalOpen?: () => void;
  
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
  /** Whether to render bulk action button in toolbar row */
  bulkActionInActionRow?: boolean;
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
  
  // Footer
  /** Custom list footer */
  ListFooterComponent?: React.ComponentType<any> | React.ReactElement | null;
  
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

function isFilterValueEqual(
  left: string | string[] | null | undefined,
  right: string | string[] | null | undefined
) {
  const a = left ?? null;
  const b = right ?? null;
  if (Array.isArray(a) || Array.isArray(b)) {
    const av = Array.isArray(a) ? [...a].sort() : [];
    const bv = Array.isArray(b) ? [...b].sort() : [];
    if (av.length !== bv.length) return false;
    return av.every((value, index) => value === bv[index]);
  }
  return a === b;
}

function areFilterMapsEqual(
  left: Record<string, string | string[] | null> | undefined,
  right: Record<string, string | string[] | null> | undefined
) {
  const a = left ?? {};
  const b = right ?? {};
  const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
  for (const key of keys) {
    if (!isFilterValueEqual(a[key], b[key])) {
      return false;
    }
  }
  return true;
}

// ============================================================================
// Helper Components
// ============================================================================

const ROW_HEIGHT = 52;

// Pre-computed static styles for DataTableRow (avoids NativeWind runtime processing)
const rowStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F1F4',
    backgroundColor: '#F7F7F9',
    minHeight: ROW_HEIGHT,
  },
  rowSelected: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F1F4',
    backgroundColor: '#FFF0F3',
    borderLeftWidth: 4,
    borderLeftColor: '#EC1A52',
    minHeight: ROW_HEIGHT,
  },
  checkboxContainer: {
    width: 32,
    marginRight: 16,
  },
  flexCol: {
    flex: 1,
  },
  alignCenter: {
    alignItems: 'center',
  },
  alignRight: {
    alignItems: 'flex-end',
  },
  defaultCellText: {
    color: '#1A1A1A',
    fontSize: 18,
    fontFamily: 'Montserrat',
  },
});

const ROW_STYLE = rowStyles.row;
const ROW_STYLE_SELECTED = rowStyles.rowSelected;
const CHECKBOX_CONTAINER_STYLE = rowStyles.checkboxContainer;
const FLEX_COL_STYLE = rowStyles.flexCol;
const ALIGN_CENTER_STYLE = rowStyles.alignCenter;
const ALIGN_RIGHT_STYLE = rowStyles.alignRight;
const DEFAULT_CELL_TEXT_STYLE = rowStyles.defaultCellText;

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

/**
 * DataTableRow - Optimized memoized row component to prevent unnecessary re-renders
 */
const DataTableRow = React.memo(function DataTableRow({
  item,
  columns,
  visibleColumns,
  keyExtractor,
  isSelected,
  bulkActions,
  onRowPress,
  toggleRowSelection,
}: {
  item: any;
  columns: ColumnDefinition<any>[];
  visibleColumns: Record<string, boolean>;
  keyExtractor: (item: any) => string;
  isSelected: boolean;
  bulkActions: boolean;
  onRowPress?: (item: any) => void;
  toggleRowSelection: (key: string) => void;
}) {
  const key = keyExtractor(item);
  
  return (
    <Pressable 
      style={isSelected ? ROW_STYLE_SELECTED : ROW_STYLE}
      onPress={() => {
        if (bulkActions && !onRowPress) {
          toggleRowSelection(key);
          return;
        }
        onRowPress?.(item);
      }}
    >
      {bulkActions && (
        <View style={CHECKBOX_CONTAINER_STYLE}>
          <TableCheckbox
            checked={isSelected}
            onPress={() => toggleRowSelection(key)}
          />
        </View>
      )}
      {columns.map((col) => {
        if (!visibleColumns[col.key]) return null;
        
        const colStyle = col.width === "flex" 
          ? FLEX_COL_STYLE 
          : col.width 
            ? { width: col.width as number } 
            : FLEX_COL_STYLE;
        
        const alignStyle = col.align === "center" 
          ? ALIGN_CENTER_STYLE 
          : col.align === "right" 
            ? ALIGN_RIGHT_STYLE 
            : undefined;
        
        return (
          <View key={col.key} style={alignStyle ? [colStyle, alignStyle] : colStyle}>
            {col.render ? (
              col.render(item)
            ) : (
              <Text style={DEFAULT_CELL_TEXT_STYLE}>
                {/* @ts-ignore */}
                {item[col.key] ?? "-"}
              </Text>
            )}
          </View>
        );
      })}
    </Pressable>
  );
});

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
    onSearchQueryChange,
    defaultSearchQuery = "",
    searchQueryValue,
    filters = [],
    onFilter,
    onFiltersChange,
    filterValues,
    filtersInActionRow = false,
    actionRowExtras,
    settingsModalExtras,
    onSettingsModalOpen,
    sortOptions = [],
    onSort,
    columnSelector = true,
    bulkActions = false,
    bulkActionText = "Bulk Actions",
    bulkActionInActionRow = false,
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
    ListFooterComponent,
  } = props;

  // State
  const [searchQuery, setSearchQuery] = useState(searchQueryValue ?? defaultSearchQuery);
  const [activeFilters, setActiveFilters] = useState<Record<string, string | string[] | null>>(
    () => (filterValues ?? (
      filters.reduce((acc, filter) => {
        if (filter.defaultValue !== undefined) {
          acc[filter.key] = filter.defaultValue;
        }
        return acc;
      }, {} as Record<string, string | string[] | null>)
    ))
  );
  const [sortBy, setSortBy] = useState<string | null>(null);
  const [sortOrder, setSortByOrder] = useState<"asc" | "desc">("desc");
  const [showColumnsModal, setShowColumnsModal] = useState(false);
  const [internalRefreshing, setInternalRefreshing] = useState(false);
  const [internalSelectedRowKeys, setInternalSelectedRowKeys] = useState<string[]>([]);
  
  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  
  const syncingFiltersFromPropsRef = useRef(false);
  const lastEmittedFiltersRef = useRef<Record<string, string | string[] | null> | null>(null);
  
  // Internal refresh state, supports external or auto-managed
  const isRefreshing = refreshing || internalRefreshing;
  
  // Handle Sort
  const handleSortPress = (key: string) => {
    if (sortBy === key) {
      setSortByOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(key);
      setSortByOrder("desc");
    }
  };
  
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
  const someHideableColumnsSelected =
    hideableColumnKeys.length > 0 && hideableColumnKeys.some((key) => visibleColumns[key]);
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
  const toggleSelectAllHideable = useCallback(() => {
    setHideableColumnsVisibility(!allHideableColumnsSelected);
  }, [allHideableColumnsSelected, setHideableColumnsVisibility]);

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
  const showBulkActionInToolbar = bulkActions && bulkActionInActionRow;
  const showLegacyBulkActionRow = bulkActions && !bulkActionInActionRow;

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
  const handleFilterChange = useCallback((filterKey: string, value: string | string[] | null) => {
    setActiveFilters((prev) => {
      if (isFilterValueEqual(prev[filterKey], value)) {
        return prev;
      }
      return { ...prev, [filterKey]: value };
    });
  }, []);

  const renderFilterDropdown = (filter: FilterDefinition) => {
    const rawValue = activeFilters[filter.key] ?? null;

    if (filter.multiple) {
      const value =
        Array.isArray(rawValue)
          ? rawValue
          : (typeof rawValue === "string" && rawValue ? [rawValue] : null);
      return (
        <FilterDropdown
          key={filter.key}
          label=""
          value={value}
          options={filter.options}
          onChange={(nextValue: string[] | null) => handleFilterChange(filter.key, nextValue)}
          placeholder={filter.placeholder}
          width={filter.width}
          multiple
        />
      );
    }

    const value = typeof rawValue === "string" ? rawValue : null;
    return (
      <FilterDropdown
        key={filter.key}
        label=""
        value={value}
        options={filter.options}
        onChange={(nextValue: string | null) => handleFilterChange(filter.key, nextValue)}
        placeholder={filter.placeholder}
        width={filter.width}
      />
    );
  };

  useEffect(() => {
    if (searchQueryValue !== undefined) {
      setSearchQuery(searchQueryValue);
    }
  }, [searchQueryValue]);

  useEffect(() => {
    if (filterValues !== undefined) {
      setActiveFilters((prev) => {
        if (areFilterMapsEqual(prev, filterValues)) {
          return prev;
        }
        syncingFiltersFromPropsRef.current = true;
        return filterValues;
      });
    }
  }, [filterValues]);

  useEffect(() => {
    if (syncingFiltersFromPropsRef.current) {
      syncingFiltersFromPropsRef.current = false;
      return;
    }
    if (lastEmittedFiltersRef.current && areFilterMapsEqual(lastEmittedFiltersRef.current, activeFilters)) {
      return;
    }
    lastEmittedFiltersRef.current = activeFilters;
    onFiltersChange?.(activeFilters);
  }, [activeFilters, onFiltersChange]);

  // Filter and sort data
  const processedData = useMemo(() => {
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

  // Frontend Pagination Logic
  const totalPages = Math.ceil(processedData.length / pageSize) || 1;
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return processedData.slice(start, start + pageSize);
  }, [processedData, currentPage, pageSize]);

  // Reset to first page when search or filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, activeFilters, sortBy]);

  const filteredData = paginatedData;

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

  const renderHeader = useCallback(() => (
    <View className="flex-row bg-[#F7F7F9] border-b border-gray-200 py-4 px-5">
      {bulkActions && (
        <View className="w-8 mr-4">
          <TableCheckbox
            checked={allFilteredSelected}
            indeterminate={someFilteredSelected && !allFilteredSelected}
            onPress={toggleSelectAllFiltered}
          />
        </View>
      )}
      {columns.map((col) => {
        if (!visibleColumns[col.key]) return null;
        
        const colWidth = col.width === "flex" ? { flex: 1 } : col.width ? { width: col.width } : { flex: 1 };
        const align = col.align || "left";
        const isSortable = !!onSort && !!col.sortKey;
        
        return (
          <View 
            key={col.key} 
            style={colWidth}
            className={`flex-row items-center ${
              align === "center" ? "justify-center" : align === "right" ? "justify-end" : ""
            }`}
          >
            <Pressable 
              onPress={() => isSortable && handleSortPress(col.key)}
              className="flex-row items-center"
            >
              <Text className="text-[#6B7280] font-Montserrat font-medium text-[16px] uppercase mr-1">
                {col.title}
              </Text>
              {isSortable && (
                <Ionicons 
                  name={sortBy === col.key ? (sortOrder === "asc" ? "caret-up" : "caret-down") : "caret-down"} 
                  size={12} 
                  color={sortBy === col.key ? "#EC1A52" : "#D1D5DB"} 
                />
              )}
            </Pressable>
          </View>
        );
      })}
    </View>
  ), [bulkActions, allFilteredSelected, someFilteredSelected, toggleSelectAllFiltered, columns, visibleColumns, onSort, sortBy, sortOrder, handleSortPress]);

  // Memoized row list - uses index keys so React REUSES native views on page change
  // (like RecyclerView ViewHolder pattern) instead of destroying + recreating them
  const renderedRows = useMemo(() => {
    return filteredData.map((item, index) => {
      const key = keyExtractor(item);
      const isSelected = selectedRowKeySet.has(key);
      return (
        <DataTableRow
          key={`row-${index}`}
          item={item}
          columns={columns}
          visibleColumns={visibleColumns}
          keyExtractor={keyExtractor}
          isSelected={isSelected}
          bulkActions={bulkActions}
          onRowPress={onRowPress}
          toggleRowSelection={toggleRowSelection}
        />
      );
    });
  }, [filteredData, keyExtractor, selectedRowKeySet, columns, visibleColumns, bulkActions, onRowPress, toggleRowSelection]);

  // Loading state
  if (isLoading && data.length === 0) {
    return (
      <View className="flex-1 bg-[#F7F7F9]" style={containerStyle}>
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#EC1A52" />
          <Text style={{ fontFamily: 'Montserrat' }} className="mt-4 text-gray-600">Loading...</Text>
        </View>
      </View>
    );
  }

  // Main render
  const tableContent = (
    <View className="flex-1 bg-[#F7F7F9]" style={containerStyle}>
      {/* Toolbar */}
      <View className="bg-[#F7F7F9] px-5 py-4 border-b border-gray-200">
        {/* Search & Actions Replica Row */}
        <View className="flex-row items-center gap-3">
          {searchable && (
            <View className="relative" style={{ flex: 1, maxWidth: 800 }}>
              <Ionicons 
                name="search-outline" 
                size={20} 
                color="#9CA3AF" 
                style={{ position: "absolute", left: 16, top: 12, zIndex: 10 }} 
              />
              <TextInput
                className="bg-white border border-gray-200 rounded-xl pl-12 pr-4 py-3 text-[18px] shadow-sm"
                style={{ fontFamily: 'Montserrat' }}
                placeholder={searchPlaceholder}
                placeholderTextColor="#9CA3AF"
                value={searchQuery}
                onChangeText={(value) => {
                  setSearchQuery(value);
                  onSearchQueryChange?.(value);
                }}
              />
            </View>
          )}

          {showBulkActionInToolbar && (
            <Pressable
              className={`h-9 px-4 rounded-md flex-row items-center justify-center gap-2 ${
                onBulkActionPress && selectedRows.length === 0 ? "bg-red-300" : "bg-red-500"
              }`}
              onPress={() => onBulkActionPress?.(selectedRows)}
              disabled={!!onBulkActionPress && selectedRows.length === 0}
            >
              <Text style={{ fontFamily: 'Montserrat' }} className="text-white font-medium">
                {bulkActionText}
                {selectedRows.length > 0 ? ` (${selectedRows.length})` : ""}
              </Text>
              {!onBulkActionPress && <Ionicons name="chevron-down" size={16} color="white" />}
            </Pressable>
          )}
          
          {onRefresh && (
            <TableToolbarButton
              title="Refresh"
              icon="refresh"
              onPress={handleRefresh}
              isLoading={isRefreshing}
              variant="primary"
            />
          )}

          {columnSelector && (
            <TableToolbarButton
              icon="settings-sharp"
              onPress={() => {
                onSettingsModalOpen?.();
                setShowColumnsModal(true);
              }}
              variant="dark"
            />
          )}

          {filtersInActionRow && filters.length > 0 && filters.map(renderFilterDropdown)}
          {filtersInActionRow && actionRowExtras}
        </View>

        {/* Legacy Bulk Actions & Add Button if needed */}
        {(showLegacyBulkActionRow || (addButton && onAddPress)) && (
          <View className="flex-row flex-wrap items-center gap-3 mt-4">
            {showLegacyBulkActionRow && (
              <Pressable
                className={`h-9 px-4 rounded-md flex-row items-center justify-center gap-2 ${
                  onBulkActionPress && selectedRows.length === 0 ? "bg-red-300" : "bg-red-500"
                }`}
                onPress={() => onBulkActionPress?.(selectedRows)}
                disabled={!!onBulkActionPress && selectedRows.length === 0}
              >
                <Text style={{ fontFamily: 'Montserrat' }} className="text-white font-medium">
                  {bulkActionText}
                  {selectedRows.length > 0 ? ` (${selectedRows.length})` : ""}
                </Text>
                {!onBulkActionPress && <Ionicons name="chevron-down" size={16} color="white" />}
              </Pressable>
            )}
            {addButton && onAddPress && (
              <Pressable 
                className="px-4 py-2 rounded-lg flex-row items-center gap-2"
                style={{ backgroundColor: "#3B82F6" }}
                onPress={onAddPress}
              >
                <Text style={{ fontFamily: 'Montserrat' }} className="text-white font-medium">{addButtonText}</Text>
              </Pressable>
            )}
          </View>
        )}

        {/* Filters if any */}
        {!filtersInActionRow && filters.length > 0 && (
          <View className="flex-row flex-wrap gap-3 mt-4">
            {filters.map(renderFilterDropdown)}
            {sortOptions.length > 0 && (
              <FilterDropdown
                label=""
                value={sortBy}
                options={sortOptions}
                onChange={(value) => setSortBy(typeof value === "string" ? value : null)}
                placeholder="Sort By"
                width={150}
              />
            )}
          </View>
        )}
      </View>

      {/* Data Table */}
      <View className="flex-1">
        {renderHeader()}
        <ScrollView
          showsVerticalScrollIndicator={false}
          refreshControl={
            onRefresh ? (
              <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
            ) : undefined
          }
        >
          {filteredData.length === 0 ? (
            <View className="py-16 items-center">
              <Ionicons name={emptyIcon} size={48} color="#d1d5db" />
              <Text style={{ fontFamily: 'Montserrat' }} className="text-gray-400 mt-2">{emptyText}</Text>
            </View>
          ) : (
            renderedRows
          )}
          {ListFooterComponent ? (
            React.isValidElement(ListFooterComponent) ? ListFooterComponent : null
          ) : null}
        </ScrollView>
      </View>

      {/* Pagination Footer Replica */}
      <View className="flex-row items-center justify-between px-5 py-4 bg-[#F7F7F9] border-t border-gray-200">
        <View className="flex-row items-center gap-2">
          <Pressable 
            className="w-8 h-8 items-center justify-center border border-gray-200 rounded bg-white shadow-sm"
            onPress={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
          >
            <Ionicons name="chevron-back" size={16} color={currentPage === 1 ? "#D1D5DB" : "#6B7280"} />
          </Pressable>
          
          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
            // Basic logic to show pages around current page if many pages exist
            let pageNum = i + 1;
            if (totalPages > 5 && currentPage > 3) {
              pageNum = currentPage - 3 + i;
              if (pageNum + (5 - i - 1) > totalPages) {
                pageNum = totalPages - 5 + i + 1;
              }
            }
            
            if (pageNum <= 0 || pageNum > totalPages) return null;

            return (
              <Pressable 
                key={pageNum}
                className={`w-8 h-8 items-center justify-center rounded shadow-sm ${pageNum === currentPage ? "bg-[#EC1A52]" : "border border-gray-200 bg-white"}`}
                onPress={() => setCurrentPage(pageNum)}
              >
                <Text className={`font-Montserrat font-medium ${pageNum === currentPage ? "text-white" : "text-[#6B7280]"}`}>
                  {pageNum}
                </Text>
              </Pressable>
            );
          })}

          <Pressable 
            className="w-8 h-8 items-center justify-center border border-gray-200 rounded bg-white shadow-sm"
            onPress={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages}
          >
            <Ionicons name="chevron-forward" size={16} color={currentPage === totalPages ? "#D1D5DB" : "#6B7280"} />
          </Pressable>
          
          <Text className="ml-2 text-gray-400 font-Montserrat text-[12px]">
            Page {currentPage} of {totalPages} ({processedData.length} total)
          </Text>
        </View>

        <View className="flex-row items-center gap-2 border border-gray-200 rounded px-3 py-1.5 bg-white shadow-sm">
          <Text className="font-Montserrat text-[#1A1A1A] text-[14px]">{pageSize}/Page</Text>
          <Ionicons name="chevron-down" size={14} color="#6B7280" />
        </View>
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
            <View className="bg-white rounded-xl w-[600px] max-w-[95%] max-h-[85%] overflow-hidden shadow-lg">
              {/* Header */}
              <View className="flex-row items-center justify-between px-6 py-6 border-b border-gray-200">
                <Text 
                  style={{ 
                    fontSize: 32, 
                    fontWeight: "600", 
                    fontFamily: "Montserrat", 
                    color: "#1A1A1A",
                    letterSpacing: -0.64
                  }}
                >
                  Select Columns
                </Text>
                <Pressable onPress={() => setShowColumnsModal(false)} className="p-1">
                  <Ionicons name="close" size={28} color="#9CA3AF" />
                </Pressable>
              </View>

              <ScrollView className="px-6 pt-6" showsVerticalScrollIndicator={false} style={{ flexShrink: 1 }} contentContainerStyle={{ paddingBottom: 24 }}>
                {/* Select All Toggle */}
                <View className="flex-row justify-between items-center py-4 mb-4">
                  <Text 
                    style={{ 
                      fontSize: 24, 
                      fontWeight: "600", 
                      fontFamily: "Montserrat", 
                      color: "#1A1A1A" 
                    }}
                  >
                    General Settings
                  </Text>
                  <View className="flex-row items-center gap-3">
                    <Text 
                      style={{ 
                        fontSize: 14, 
                        color: "#6B7280", 
                        fontFamily: "Montserrat",
                        fontStyle: "italic" 
                      }}
                    >
                      Select all
                    </Text>
                    <Switch
                      trackColor={{ false: "#D1D5DB", true: "#FBCFE8" }}
                      thumbColor={allHideableColumnsSelected ? "#EC1A52" : "#FFFFFF"}
                      ios_backgroundColor="#D1D5DB"
                      onValueChange={toggleSelectAllHideable}
                      value={allHideableColumnsSelected}
                      disabled={hideableColumnKeys.length === 0}
                    />
                  </View>
                </View>

                {/* Two-Column Column Options */}
                <View className="flex-row gap-8">
                  {/* Left Column */}
                  <View className="flex-1">
                    {columns.filter((_, i) => i % 2 === 0).map((col) => {
                      const isHideable = col.hideable !== false;
                      const isVisible = visibleColumns[col.key];
                      return (
                        <View key={col.key} className="flex-row justify-between items-center py-4 border-b border-[#E5E7EB]">
                          <Text 
                            style={{ fontFamily: 'Montserrat', fontSize: 16, color: "#1A1A1A" }}
                            className={`flex-1 mr-4 ${!isHideable ? 'text-gray-400 font-medium italic' : ''}`}
                            numberOfLines={1}
                          >
                            {col.title} {!isHideable && '(Fixed)'}
                          </Text>
                          <Switch
                            trackColor={{ false: "#D1D5DB", true: "#FBCFE8" }}
                            thumbColor={isVisible ? "#EC1A52" : "#FFFFFF"}
                            ios_backgroundColor="#D1D5DB"
                            onValueChange={() => { if (isHideable) toggleColumn(col.key); }}
                            value={isVisible}
                            disabled={!isHideable}
                          />
                        </View>
                      );
                    })}
                  </View>

                  {/* Right Column */}
                  <View className="flex-1">
                    {columns.filter((_, i) => i % 2 !== 0).map((col) => {
                      const isHideable = col.hideable !== false;
                      const isVisible = visibleColumns[col.key];
                      return (
                        <View key={col.key} className="flex-row justify-between items-center py-4 border-b border-[#E5E7EB]">
                          <Text 
                            style={{ fontFamily: 'Montserrat', fontSize: 16, color: "#1A1A1A" }}
                            className={`flex-1 mr-4 ${!isHideable ? 'text-gray-400 font-medium italic' : ''}`}
                            numberOfLines={1}
                          >
                            {col.title} {!isHideable && '(Fixed)'}
                          </Text>
                          <Switch
                            trackColor={{ false: "#D1D5DB", true: "#FBCFE8" }}
                            thumbColor={isVisible ? "#EC1A52" : "#FFFFFF"}
                            ios_backgroundColor="#D1D5DB"
                            onValueChange={() => { if (isHideable) toggleColumn(col.key); }}
                            value={isVisible}
                            disabled={!isHideable}
                          />
                        </View>
                      );
                    })}
                  </View>
                </View>

                {/* Extra settings content (e.g. Advance Filters) */}
                {settingsModalExtras && (
                  <View className="mt-6 pt-6 border-t border-gray-200">
                    {settingsModalExtras}
                  </View>
                )}
              </ScrollView>

              {/* Footer Buttons */}
              <View className="flex-row justify-center gap-4 p-6 border-t border-gray-200">
                <Pressable
                  onPress={() => setShowColumnsModal(false)}
                  className="flex-1 py-3 bg-red-50 rounded-lg items-center border border-red-100"
                >
                  <Text style={{ fontFamily: 'Montserrat' }} className="text-red-500 font-semibold">Cancel</Text>
                </Pressable>
                <Pressable
                  onPress={() => setShowColumnsModal(false)}
                  className="flex-1 py-3 rounded-lg items-center shadow-sm"
                  style={{ backgroundColor: "#EC1A52" }}
                >
                  <Text style={{ fontFamily: 'Montserrat' }} className="text-white font-semibold">Apply</Text>
                </Pressable>
              </View>
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
