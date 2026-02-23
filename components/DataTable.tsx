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

import { buttonSize, colors, fontSize, fontWeight, iconSize } from '@/utils/theme';
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
  /** Whether to hide default footer buttons in settings/columns modal */
  hideSettingsModalFooter?: boolean;
  
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
  /** Pagination mode (client = local slice, server = parent query) */
  paginationMode?: "client" | "server";
  /** Controlled current page for server pagination */
  currentPage?: number;
  /** Page size used for pagination display/calculation */
  pageSize?: number;
  /** Page change callback for server pagination */
  onPageChange?: (page: number) => void;
  
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
  /** Optional per-render performance callback */
  onRenderPerf?: (metrics: DataTableRenderPerfMetrics) => void;
}

export interface DataTableRenderPerfMetrics {
  timestampMs: number;
  currentPage: number;
  pageSize: number;
  totalItems: number;
  rowCount: number;
  renderCount: number;
  processedDataMs: number;
  paginatedDataMs: number;
  rowsBuildMs: number;
  renderBuildMs: number;
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
const dataTableRowRenderCounts = new Map<string, number>();
const dataTableCellRenderCounts = new Map<string, number>();
// Throttle verbose cell/row logging to avoid flooding JS thread during pagination.
let _dtDebugLogEnabled = false;
const setDataTableDebugLog = (enabled: boolean) => { _dtDebugLogEnabled = enabled; };

function getNowMs() {
  if (
    typeof globalThis !== "undefined" &&
    typeof globalThis.performance !== "undefined" &&
    typeof globalThis.performance.now === "function"
  ) {
    return globalThis.performance.now();
  }
  return Date.now();
}

// Pre-computed static styles for DataTableRow (avoids NativeWind runtime processing)
const rowStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
    backgroundColor: colors.backgroundTertiary,
    minHeight: ROW_HEIGHT,
  },
  rowSelected: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
    backgroundColor: colors.primaryLight,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
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
    color: colors.text,
    fontSize: fontSize.xl,
    fontFamily: 'Montserrat',
  },
  loadingOverlay: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(247, 247, 249, 0.5)",
    zIndex: 20,
    elevation: 20,
  },
});

const ROW_STYLE = rowStyles.row;
const ROW_STYLE_SELECTED = rowStyles.rowSelected;
const CHECKBOX_CONTAINER_STYLE = rowStyles.checkboxContainer;
const FLEX_COL_STYLE = rowStyles.flexCol;
const ALIGN_CENTER_STYLE = rowStyles.alignCenter;
const ALIGN_RIGHT_STYLE = rowStyles.alignRight;
const DEFAULT_CELL_TEXT_STYLE = rowStyles.defaultCellText;
const LOADING_OVERLAY_STYLE = rowStyles.loadingOverlay;

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
      style={{
        width: buttonSize.md.height,
        height: buttonSize.md.height,
        borderRadius: buttonSize.md.borderRadius,
      }}
      className={`border items-center justify-center ${
        checked || indeterminate ? "bg-red-500 border-red-500" : "border-gray-300"
      } ${disabled ? "opacity-50" : ""}`}
    >
      {checked && <Ionicons name="checkmark" size={iconSize.md} color="white" />}
      {!checked && indeterminate && <Ionicons name="remove" size={iconSize.md} color="white" />}
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
  debugPage,
}: {
  item: any;
  columns: ColumnDefinition<any>[];
  visibleColumns: Record<string, boolean>;
  keyExtractor: (item: any) => string;
  isSelected: boolean;
  bulkActions: boolean;
  onRowPress?: (item: any) => void;
  toggleRowSelection: (key: string) => void;
  debugPage?: number;
}) {
  const rowRenderStartMs = __DEV__ ? getNowMs() : 0;
  const key = keyExtractor(item);
  const componentRenderCountRef = useRef(0);
  componentRenderCountRef.current += 1;

  const rowElement = (
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
        const cellRenderStartMs = __DEV__ ? getNowMs() : 0;
        const cellContent = col.render ? (
          col.render(item)
        ) : (
          <Text style={DEFAULT_CELL_TEXT_STYLE}>
            {/* @ts-ignore */}
            {item[col.key] ?? "-"}
          </Text>
        );

        if (__DEV__ && _dtDebugLogEnabled) {
          const cellCountKey = `${key}::${col.key}`;
          const cellRenderCount = (dataTableCellRenderCounts.get(cellCountKey) ?? 0) + 1;
          dataTableCellRenderCounts.set(cellCountKey, cellRenderCount);
          const cellRenderBuildMs = Number((getNowMs() - cellRenderStartMs).toFixed(3));
          console.log("[DataTableCell][render]", {
            rowKey: key,
            columnKey: col.key,
            page: debugPage ?? null,
            customRenderer: Boolean(col.render),
            cellRenderCount,
            renderBuildMs: cellRenderBuildMs,
          });
        }
        
        return (
          <View key={col.key} style={alignStyle ? [colStyle, alignStyle] : colStyle}>
            {cellContent}
          </View>
        );
      })}
    </Pressable>
  );

  if (__DEV__ && _dtDebugLogEnabled) {
    const keyRenderCount = (dataTableRowRenderCounts.get(key) ?? 0) + 1;
    dataTableRowRenderCounts.set(key, keyRenderCount);
    const rowRenderBuildMs = Number((getNowMs() - rowRenderStartMs).toFixed(3));
    console.log("[DataTableRow][render]", {
      rowKey: key,
      page: debugPage ?? null,
      isSelected,
      componentRenderCount: componentRenderCountRef.current,
      keyRenderCount,
      renderBuildMs: rowRenderBuildMs,
    });
  }

  return rowElement;
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
    hideSettingsModalFooter = false,
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
    paginationMode = "client",
    currentPage: controlledCurrentPage,
    pageSize: controlledPageSize,
    onPageChange,
    containerStyle,
    horizontalScroll = false,
    minWidth = 900,
    renderRow,
    onRowPress,
    ListFooterComponent,
    onRenderPerf,
  } = props;
  const tableRenderStartMs = __DEV__ ? getNowMs() : 0;
  const processedDataMsRef = useRef(0);
  const paginatedDataMsRef = useRef(0);
  const rowsBuildMsRef = useRef(0);

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
  const [isColumnSelectionExpanded, setIsColumnSelectionExpanded] = useState(true);
  const [internalRefreshing, setInternalRefreshing] = useState(false);
  const [internalSelectedRowKeys, setInternalSelectedRowKeys] = useState<string[]>([]);
  
  // Pagination State
  const [internalCurrentPage, setInternalCurrentPage] = useState(1);
  const isServerPagination = paginationMode === "server";
  const effectivePageSize = controlledPageSize ?? 10;
  const effectiveCurrentPage = isServerPagination ? (controlledCurrentPage ?? 1) : internalCurrentPage;
  const latestEffectiveCurrentPageRef = useRef(effectiveCurrentPage);
  
  const syncingFiltersFromPropsRef = useRef(false);
  const lastEmittedFiltersRef = useRef<Record<string, string | string[] | null> | null>(null);

  useEffect(() => {
    latestEffectiveCurrentPageRef.current = effectiveCurrentPage;
  }, [effectiveCurrentPage]);
  
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
  const hasSettingsModalExtras = Boolean(settingsModalExtras);
  const settingsModalWidth = hasSettingsModalExtras ? 1080 : 600;

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
    const perfStart = __DEV__ ? getNowMs() : 0;
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

    if (__DEV__) {
      processedDataMsRef.current = Number((getNowMs() - perfStart).toFixed(3));
    }
    return result;
  }, [data, searchQuery, activeFilters, sortBy, onSearch, onFilter, onSort]);

  // Pagination logic
  const totalItems = isServerPagination ? (totalCount ?? processedData.length) : processedData.length;
  const totalPages = Math.ceil(totalItems / effectivePageSize) || 1;
  const paginatedData = useMemo(() => {
    const perfStart = __DEV__ ? getNowMs() : 0;
    if (isServerPagination) {
      if (__DEV__) {
        paginatedDataMsRef.current = Number((getNowMs() - perfStart).toFixed(3));
      }
      return processedData;
    }
    const start = (effectiveCurrentPage - 1) * effectivePageSize;
    const result = processedData.slice(start, start + effectivePageSize);
    if (__DEV__) {
      paginatedDataMsRef.current = Number((getNowMs() - perfStart).toFixed(3));
    }
    return result;
  }, [isServerPagination, processedData, effectiveCurrentPage, effectivePageSize]);

  const changePage = useCallback(
    (nextPage: number) => {
      const boundedPage = Math.max(1, Math.min(totalPages, nextPage));
      if (isServerPagination) {
        if (boundedPage !== effectiveCurrentPage) {
          onPageChange?.(boundedPage);
        }
        return;
      }
      setInternalCurrentPage((prev) => {
        if (prev === boundedPage) return prev;
        return boundedPage;
      });
      // Notify external listener after state update (e.g. perf tracing)
      onPageChange?.(boundedPage);
    },
    [totalPages, isServerPagination, effectiveCurrentPage, onPageChange]
  );

  // Reset to first page when search, filters, or sort changes
  useEffect(() => {
    if (isServerPagination) {
      if (latestEffectiveCurrentPageRef.current !== 1) {
        onPageChange?.(1);
      }
      return;
    }
    setInternalCurrentPage(1);
  }, [searchQuery, activeFilters, sortBy, isServerPagination, onPageChange]);

  useEffect(() => {
    if (!isServerPagination) return;
    if (effectiveCurrentPage > totalPages) {
      onPageChange?.(totalPages);
    }
  }, [isServerPagination, effectiveCurrentPage, totalPages, onPageChange]);

  const filteredData = paginatedData;
  const tableRenderCountRef = useRef(0);
  tableRenderCountRef.current += 1;

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
    <View className="flex-row border-b border-gray-200 py-4 px-5" style={{ backgroundColor: colors.backgroundTertiary }}>
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
              <Text style={{ color: colors.textSecondary }} className="font-Montserrat font-medium text-[16px] uppercase mr-1">
                {col.title}
              </Text>
              {isSortable && (
                <Ionicons 
                  name={sortBy === col.key ? (sortOrder === "asc" ? "caret-up" : "caret-down") : "caret-down"} 
                  size={iconSize.md} 
                  color={sortBy === col.key ? colors.primary : colors.borderMedium} 
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
    const perfStart = __DEV__ ? getNowMs() : 0;
    const result = filteredData.map((item, index) => {
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
          debugPage={effectiveCurrentPage}
        />
      );
    });
    if (__DEV__) {
      rowsBuildMsRef.current = Number((getNowMs() - perfStart).toFixed(3));
    }
    return result;
  }, [filteredData, keyExtractor, selectedRowKeySet, columns, visibleColumns, bulkActions, onRowPress, toggleRowSelection]);
  const tableRenderBuildMs = __DEV__
    ? Number((getNowMs() - tableRenderStartMs).toFixed(3))
    : 0;

  useEffect(() => {
    if (!onRenderPerf) return;
    onRenderPerf({
      timestampMs: getNowMs(),
      currentPage: effectiveCurrentPage,
      pageSize: effectivePageSize,
      totalItems,
      rowCount: paginatedData.length,
      renderCount: tableRenderCountRef.current,
      processedDataMs: processedDataMsRef.current,
      paginatedDataMs: paginatedDataMsRef.current,
      rowsBuildMs: rowsBuildMsRef.current,
      renderBuildMs: tableRenderBuildMs,
    });
  }, [
    effectiveCurrentPage,
    effectivePageSize,
    onRenderPerf,
    paginatedData.length,
    tableRenderBuildMs,
    totalItems,
  ]);

  // Loading state
  if (isLoading && data.length === 0) {
    return (
      <View className="flex-1" style={{ backgroundColor: colors.backgroundTertiary, ...containerStyle }}>
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={{ fontFamily: 'Montserrat' }} className="mt-4 text-gray-600">Loading...</Text>
        </View>
      </View>
    );
  }

  // Main render
  const tableContent = (
      <View className="flex-1" style={{ backgroundColor: colors.backgroundTertiary, ...containerStyle }}>
      {/* Toolbar */}
      <View style={{ backgroundColor: colors.backgroundTertiary }} className="px-5 py-4 border-b border-gray-200">
        {/* Search & Actions Replica Row */}
        <View className="flex-row items-center gap-4">
          {searchable && (
            <View className="relative" style={{ flex: 1, maxWidth: 800 }}>
              <Ionicons 
                name="search-outline" 
                size={iconSize.base} 
                color={colors.textTertiary} 
                style={{ position: "absolute", left: 16, top: 12, zIndex: 10 }} 
              />
              <TextInput
                className="bg-white border border-gray-200 rounded-xl pl-12 pr-4 py-3 text-[18px] shadow-sm"
                style={{ fontFamily: 'Montserrat' }}
                placeholder={searchPlaceholder}
                placeholderTextColor={colors.textTertiary}
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
              className={`px-4 rounded-lg flex-row items-center justify-center gap-4 ${
                onBulkActionPress && selectedRows.length === 0 ? "bg-red-300" : "bg-red-500"
              }`}
              style={{ height: buttonSize.md.height }}
              onPress={() => onBulkActionPress?.(selectedRows)}
              disabled={!!onBulkActionPress && selectedRows.length === 0}
            >
              <Text style={{ fontFamily: 'Montserrat' }} className="text-white font-medium">
                {bulkActionText}
                {selectedRows.length > 0 ? ` (${selectedRows.length})` : ""}
              </Text>
              {!onBulkActionPress && <Ionicons name="chevron-down" size={iconSize.md} color="white" />}
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
                setIsColumnSelectionExpanded(true);
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
          <View className="flex-row flex-wrap items-center gap-4 mt-4">
            {showLegacyBulkActionRow && (
              <Pressable
                className={`px-4 rounded-lg flex-row items-center justify-center gap-4 ${
                  onBulkActionPress && selectedRows.length === 0 ? "bg-red-300" : "bg-red-500"
                }`}
                style={{ height: buttonSize.md.height }}
                onPress={() => onBulkActionPress?.(selectedRows)}
                disabled={!!onBulkActionPress && selectedRows.length === 0}
              >
                <Text style={{ fontFamily: 'Montserrat' }} className="text-white font-medium">
                  {bulkActionText}
                  {selectedRows.length > 0 ? ` (${selectedRows.length})` : ""}
                </Text>
                {!onBulkActionPress && <Ionicons name="chevron-down" size={iconSize.md} color="white" />}
              </Pressable>
            )}
            {addButton && onAddPress && (
              <Pressable 
                className="px-4 rounded-lg flex-row items-center gap-4"
                style={{ height: buttonSize.md.height, backgroundColor: colors.info }}
                onPress={onAddPress}
              >
                <Text style={{ fontFamily: 'Montserrat' }} className="text-white font-medium">{addButtonText}</Text>
              </Pressable>
            )}
          </View>
        )}

        {/* Filters if any */}
        {!filtersInActionRow && filters.length > 0 && (
          <View className="flex-row flex-wrap gap-4 mt-4">
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
        <View className="flex-1">
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
                <Ionicons name={emptyIcon} size={iconSize['4xl']} color={colors.borderMedium} />
                <Text style={{ fontFamily: 'Montserrat' }} className="text-gray-400 mt-2">{emptyText}</Text>
              </View>
            ) : (
              renderedRows
            )}
            {ListFooterComponent ? (
              React.isValidElement(ListFooterComponent) ? ListFooterComponent : null
            ) : null}
          </ScrollView>
          {!horizontalScroll && isLoading && data.length > 0 && (
            <View pointerEvents="none" style={LOADING_OVERLAY_STYLE}>
              <ActivityIndicator size="large" color={colors.primary} />
            </View>
          )}
        </View>
      </View>

      {/* Pagination Footer Replica */}
      <View className="flex-row items-center justify-between px-5 py-4 border-t border-gray-200" style={{ backgroundColor: colors.backgroundTertiary }}>
        <View className="flex-row items-center gap-4">
          <Pressable 
            accessibilityLabel="datatable-prev-page"
            className="items-center justify-center border border-gray-200 rounded bg-white shadow-sm"
            style={{ width: buttonSize.md.height, height: buttonSize.md.height }}
            onPress={() => changePage(effectiveCurrentPage - 1)}
            disabled={effectiveCurrentPage === 1}
          >
            <Ionicons name="chevron-back" size={iconSize.md} color={effectiveCurrentPage === 1 ? colors.borderMedium : colors.textSecondary} />
          </Pressable>
          
          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
            // Basic logic to show pages around current page if many pages exist
            let pageNum = i + 1;
            if (totalPages > 5 && effectiveCurrentPage > 3) {
              pageNum = effectiveCurrentPage - 3 + i;
              if (pageNum + (5 - i - 1) > totalPages) {
                pageNum = totalPages - 5 + i + 1;
              }
            }
            
            if (pageNum <= 0 || pageNum > totalPages) return null;

            return (
              <Pressable 
                key={pageNum}
                accessibilityLabel={`datatable-page-${pageNum}`}
                className={`items-center justify-center rounded shadow-sm ${pageNum === effectiveCurrentPage ? "" : "border border-gray-200 bg-white"}`}
                style={{ 
                  width: buttonSize.md.height, 
                  height: buttonSize.md.height,
                  ...(pageNum === effectiveCurrentPage ? { backgroundColor: colors.primary } : {}),
                }}
                onPress={() => changePage(pageNum)}
              >
                <Text className={`font-Montserrat font-medium ${pageNum === effectiveCurrentPage ? "text-white" : ""}`} style={pageNum !== effectiveCurrentPage ? { color: colors.textSecondary } : undefined}>
                  {pageNum}
                </Text>
              </Pressable>
            );
          })}

          <Pressable 
            accessibilityLabel="datatable-next-page"
            className="items-center justify-center border border-gray-200 rounded bg-white shadow-sm"
            style={{ width: buttonSize.md.height, height: buttonSize.md.height }}
            onPress={() => changePage(effectiveCurrentPage + 1)}
            disabled={effectiveCurrentPage === totalPages}
          >
            <Ionicons name="chevron-forward" size={iconSize.md} color={effectiveCurrentPage === totalPages ? colors.borderMedium : colors.textSecondary} />
          </Pressable>
          
          <Text className="ml-2 text-gray-400 font-Montserrat text-[12px]">
            Page {effectiveCurrentPage} of {totalPages} ({totalItems} total)
          </Text>
        </View>

        <View className="flex-row items-center gap-4 border border-gray-200 rounded px-3 py-1.5 bg-white shadow-sm">
          <Text className="font-Montserrat text-[14px]" style={{ color: colors.text }}>{effectivePageSize}/Page</Text>
          <Ionicons name="chevron-down" size={iconSize.md} color={colors.textSecondary} />
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
            <View
              className="bg-white rounded-xl max-w-[95%] max-h-[85%] overflow-hidden shadow-lg"
              style={{ width: settingsModalWidth }}
            >
              {/* Header */}
              <View className="flex-row items-center justify-between px-6 py-6 border-b border-gray-200">
                <Text 
                  style={{ 
                    fontSize: fontSize['3xl'], 
                    fontWeight: fontWeight.semibold, 
                    fontFamily: "Montserrat", 
                    color: colors.text,
                    letterSpacing: -0.64
                  }}
                >
                  Select Columns
                </Text>
                <Pressable onPress={() => setShowColumnsModal(false)} className="p-1">
                  <Ionicons name="close" size={iconSize['2xl']} color={colors.textTertiary} />
                </Pressable>
              </View>

              <ScrollView className="px-6 pt-6" showsVerticalScrollIndicator={false} style={{ flexShrink: 1 }} contentContainerStyle={{ paddingBottom: 24 }}>
                <View className={hasSettingsModalExtras ? "flex-row gap-16" : undefined}>
                  <View className={hasSettingsModalExtras ? "flex-1" : undefined}>
                    <Pressable
                      onPress={() => setIsColumnSelectionExpanded((prev) => !prev)}
                      className="flex-row items-center justify-between py-2 mb-2"
                    >
                      <Text
                        style={{
                          fontSize: fontSize['2xl'],
                          fontWeight: fontWeight.semibold,
                          fontFamily: "Montserrat",
                          color: colors.text,
                        }}
                      >
                        Column Selection
                      </Text>
                      <Ionicons
                        name={isColumnSelectionExpanded ? "chevron-up" : "chevron-down"}
                        size={iconSize.md}
                        color={colors.textSecondary}
                      />
                    </Pressable>

                    {isColumnSelectionExpanded && (
                      <>
                        <View className="flex-row justify-end items-center py-3 mb-3">
                          <View className="flex-row items-center gap-4">
                            <Text 
                              style={{ 
                                fontSize: fontSize.base, 
                                color: colors.textSecondary, 
                                fontFamily: "Montserrat",
                                fontStyle: "italic" 
                              }}
                            >
                              Select all
                            </Text>
                            <Switch
                              trackColor={{ false: colors.borderMedium, true: "#FBCFE8" }}
                              thumbColor={allHideableColumnsSelected ? colors.primary : colors.textWhite}
                              ios_backgroundColor={colors.borderMedium}
                              onValueChange={toggleSelectAllHideable}
                              value={allHideableColumnsSelected}
                              disabled={hideableColumnKeys.length === 0}
                            />
                          </View>
                        </View>

                        <View className="flex-row gap-8">
                          <View className="flex-1">
                            {columns.filter((_, i) => i % 2 === 0).map((col) => {
                              const isHideable = col.hideable !== false;
                              const isVisible = visibleColumns[col.key];
                              return (
                                <View key={col.key} className="flex-row justify-between items-center py-4" style={{ borderBottomWidth: 1, borderBottomColor: colors.border }}>
                                  <Text 
                                    style={{ fontFamily: 'Montserrat', fontSize: fontSize.lg, color: colors.text }}
                                    className={`flex-1 mr-4 ${!isHideable ? 'text-gray-400 font-medium italic' : ''}`}
                                    numberOfLines={1}
                                  >
                                    {col.title} {!isHideable && '(Fixed)'}
                                  </Text>
                                  <Switch
                                    trackColor={{ false: colors.borderMedium, true: "#FBCFE8" }}
                                    thumbColor={isVisible ? colors.primary : colors.textWhite}
                                    ios_backgroundColor={colors.borderMedium}
                                    onValueChange={() => { if (isHideable) toggleColumn(col.key); }}
                                    value={isVisible}
                                    disabled={!isHideable}
                                  />
                                </View>
                              );
                            })}
                          </View>

                          <View className="flex-1">
                            {columns.filter((_, i) => i % 2 !== 0).map((col) => {
                              const isHideable = col.hideable !== false;
                              const isVisible = visibleColumns[col.key];
                              return (
                                <View key={col.key} className="flex-row justify-between items-center py-4" style={{ borderBottomWidth: 1, borderBottomColor: colors.border }}>
                                  <Text 
                                    style={{ fontFamily: 'Montserrat', fontSize: fontSize.lg, color: colors.text }}
                                    className={`flex-1 mr-4 ${!isHideable ? 'text-gray-400 font-medium italic' : ''}`}
                                    numberOfLines={1}
                                  >
                                    {col.title} {!isHideable && '(Fixed)'}
                                  </Text>
                                  <Switch
                                    trackColor={{ false: colors.borderMedium, true: "#FBCFE8" }}
                                    thumbColor={isVisible ? colors.primary : colors.textWhite}
                                    ios_backgroundColor={colors.borderMedium}
                                    onValueChange={() => { if (isHideable) toggleColumn(col.key); }}
                                    value={isVisible}
                                    disabled={!isHideable}
                                  />
                                </View>
                              );
                            })}
                          </View>
                        </View>
                      </>
                    )}
                  </View>

                  {settingsModalExtras && (
                    <View className="flex-1 border-l border-gray-200 pl-12 ml-4">
                      {settingsModalExtras}
                    </View>
                  )}
                </View>
              </ScrollView>

              {!hideSettingsModalFooter && (
                <View className="flex-row justify-center gap-4 p-6 border-t border-gray-200">
                  <Pressable
                    onPress={() => setShowColumnsModal(false)}
                    className="flex-1 rounded-lg items-center justify-center border border-red-100"
                    style={{ height: buttonSize.md.height, backgroundColor: colors.primaryLight }}
                  >
                    <Text style={{ fontFamily: 'Montserrat' }} className="text-red-500 font-semibold">Cancel</Text>
                  </Pressable>
                  <Pressable
                    onPress={() => setShowColumnsModal(false)}
                    className="flex-1 rounded-lg items-center justify-center shadow-sm"
                    style={{ height: buttonSize.md.height, backgroundColor: colors.primary }}
                  >
                    <Text style={{ fontFamily: 'Montserrat' }} className="text-white font-semibold">Apply</Text>
                  </Pressable>
                </View>
              )}
            </View>
          </View>
        </Modal>
      )}
    </View>
  );

  // For horizontal scroll mode
  // The table should fill available space but allow scrolling if content exceeds viewport
  const finalContent = horizontalScroll ? (
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
      {isLoading && data.length > 0 && (
        <View pointerEvents="none" style={LOADING_OVERLAY_STYLE}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      )}
    </View>
  ) : (
    tableContent
  );

  if (__DEV__ && _dtDebugLogEnabled) {
    console.log("[DataTable][render]", {
      renderCount: tableRenderCountRef.current,
      currentPage: effectiveCurrentPage,
      pageSize: effectivePageSize,
      processedDataLength: totalItems,
      paginatedDataLength: paginatedData.length,
      selectedRowCount: selectedRowKeys.length,
      processedDataMs: processedDataMsRef.current,
      paginatedDataMs: paginatedDataMsRef.current,
      rowsBuildMs: rowsBuildMsRef.current,
      renderBuildMs: tableRenderBuildMs,
    });
  }

  return finalContent;
}
