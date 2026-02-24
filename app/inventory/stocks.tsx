/**
 * Stocks Screen
 *
 * Aligned with KHUB web Stocks columns configuration.
 */

import { buttonSize, colors, iconSize, modalContent, radius } from '@/utils/theme';
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    InteractionManager,
    Pressable,
    ScrollView,
    Text,
    TextInput,
    View,
} from "react-native";
import { useBulkEditContext } from "../../contexts/BulkEditContext";
import { useTableContentWidth } from "../../hooks/useTableContentWidth";
import {
    ACTION_COL_WIDTH,
    ColumnDefinition,
    DataTable,
    DataTableRenderPerfMetrics,
    FilterDefinition,
    FilterDropdown,
    PageHeader,
} from "../../components";
import { CenteredModal } from "../../components/CenteredModal";
import {
    BulkStockUpdateItem,
    bulkUpdateStocks,
    getStockByProductId,
    StockChannelInfo,
    updateStocks as updateStocksApi,
} from "../../utils/api";
import { StocksQueryFilters, StockView, useStocks } from "../../utils/powersync/hooks";
import type {
    StocksPerfCallbacks,
    StocksPerfSnapshotMeta,
} from "../../utils/powersync/hooks/useStocks";
import { useSyncStream } from "../../utils/powersync/useSyncStream";
import {
    AddProductPanelController,
    AddProductPanelControllerHandle,
} from "../../components/catalog/AddProductPanelController";

// ============================================================================
// Helpers
// ============================================================================

const formatCurrency = (value: number) => (value > 0 ? `$${value.toFixed(2)}` : "-");
const formatQty = (value: number | null | undefined) => (value === null || value === undefined ? "-" : String(value));
const qtyValueTextStyle = { fontSize: 14, lineHeight: 16, fontWeight: '400', color: colors.textMedium };
const qtyInputTextStyle = {
  fontSize: 14,
  lineHeight: 16,
  fontWeight: '400',
  color: colors.textMedium,
  paddingVertical: 0,
  textAlign: "center" as const,
  includeFontPadding: false,
};
const qtyUnitTextStyle = { fontSize: 14, lineHeight: 14, fontWeight: '400', color: colors.textSecondary };
const parseQtyInput = (value: string, fallback = 0) => {
  const parsed = parseInt(value, 10);
  if (Number.isNaN(parsed)) return fallback;
  return Math.max(0, parsed);
};
const toPieceQty = (value: number | null | undefined, lowestUnitDefinition: number) => {
  const qty = Number(value ?? 0);
  const unit = Math.max(1, Number(lowestUnitDefinition || 1));
  return Math.floor(qty / unit);
};

interface BulkEditValue {
  availableQty: string;
  damagedQty: string;
}

interface SingleEditValue {
  availableQty: string;
  damagedQty: string;
  minQty: string;
  maxQty: string;
}

interface StockEditRow {
  key: string;
  channelId: number;
  channelName: string;
  availableQty: number;
  onHoldQty: number;
  damagedQty: number;
  backOrderQty: number;
  comingSoonQty: number;
  deliveredWithoutStockQty: number;
  minQty: number;
  maxQty: number;
  lowestUnitDefinition: number;
  raw: StockChannelInfo;
}

const PRODUCT_STATUS_FILTER_OPTIONS = [
  { label: "Active", value: "1" },
  { label: "Inactive", value: "2" },
  { label: "Archived", value: "3" },
];

const STOCK_SEARCH_FILTER_STORAGE_KEY = "stock_search_filter";
const STOCK_TYPE_OPTIONS = [
  { label: "Damaged Stock", value: "damaged" },
  { label: "Out of Stock", value: "out_of_stock" },
];

interface StocksCompareCase {
  id: string;
  filters: StocksQueryFilters;
  expectedRemoteCount: number;
}

const STOCKS_COMPARE_CASES: StocksCompareCase[] = [
  // Remote baseline generated via `npm run stocks:compare:remote` on 2026-02-14.
  { id: "tc01_default_active", filters: { channelIds: [1], productStatus: [1] }, expectedRemoteCount: 42 },
  { id: "tc02_status_inactive", filters: { channelIds: [1], productStatus: [2] }, expectedRemoteCount: 0 },
  { id: "tc03_status_archived", filters: { channelIds: [1], productStatus: [3] }, expectedRemoteCount: 0 },
  { id: "tc04_status_active_archived", filters: { channelIds: [1], productStatus: [1, 3] }, expectedRemoteCount: 24 },
  { id: "tc05_out_of_stock", filters: { channelIds: [1], productStatus: [1], outOfStock: true }, expectedRemoteCount: 5 },
  { id: "tc06_has_damaged", filters: { channelIds: [1], productStatus: [1], hasDamaged: true }, expectedRemoteCount: 0 },
  { id: "tc07_brand_11", filters: { channelIds: [1], productStatus: [1], brandIds: [11] }, expectedRemoteCount: 6 },
  { id: "tc08_category_10", filters: { channelIds: [1], productStatus: [1], categoryIds: [10] }, expectedRemoteCount: 5 },
  {
    id: "tc09_brand11_category10",
    filters: { channelIds: [1], productStatus: [1], brandIds: [11], categoryIds: [10] },
    expectedRemoteCount: 0,
  },
  { id: "tc10_search_mock", filters: { channelIds: [1], productStatus: [1], searchKey: "mock" }, expectedRemoteCount: 18 },
  {
    id: "tc11_search_not_found",
    filters: { channelIds: [1], productStatus: [1], searchKey: "__no_such_product__" },
    expectedRemoteCount: 0,
  },
  {
    id: "tc12_brand11_out_of_stock",
    filters: { channelIds: [1], productStatus: [1], brandIds: [11], outOfStock: true },
    expectedRemoteCount: 0,
  },
];

interface ChannelOptionRow {
  id: number;
  name: string;
  is_primary: number | null;
}

interface NamedOptionRow {
  id: number;
  name: string;
}

interface StocksAdvancedFilters {
  channelIds: number[];
  brandIds: number[];
  supplierIds: number[];
  categoryIds: number[];
  searchZone: string;
  searchAisle: string;
  searchBin: string;
  stockType: "" | "damaged" | "out_of_stock";
}

interface StocksFilterStoragePayload {
  advance_filters: {
    channel_ids: number[];
    brand_ids: number[];
    supplier_ids: number[];
    category_id: number[];
    searchText: string;
    search_zone: string;
    search_aisle: string;
    search_Bin: string;
    damaged_product: string;
    out_of_stock: string;
    product_status: number[];
  };
  show_advance_filters: boolean;
  display_advance_filters: boolean;
  channelForBulkEdit: Array<{ id: number; name: string }>;
}

interface StocksPaginationPerfTrace {
  runId: number;
  fromPage: number;
  toPage: number;
  clickMs: number;
  dataQueryStartMs?: number;
  dataQueryEndMs?: number;
  dataQueryDurationMs?: number;
  countQueryStartMs?: number;
  countQueryEndMs?: number;
  countQueryDurationMs?: number;
  loadingStartMs?: number;
  screenDataBoundMs?: number;
  dataTableRenderSnapshot?: DataTableRenderPerfMetrics;
  dataReadyMs?: number;
  frameMs?: number;
  interactionsMs?: number;
  completed?: boolean;
}

const nowMs = () =>
  typeof globalThis !== "undefined" &&
  globalThis.performance &&
  typeof globalThis.performance.now === "function"
    ? globalThis.performance.now()
    : Date.now();

const formatPerfMs = (value: number) => Number(value.toFixed(3));

function createDefaultAdvancedFilters(defaultChannelId: number | null): StocksAdvancedFilters {
  return {
    channelIds: defaultChannelId ? [defaultChannelId] : [],
    brandIds: [],
    supplierIds: [],
    categoryIds: [],
    searchZone: "",
    searchAisle: "",
    searchBin: "",
    stockType: "",
  };
}

function toStringIds(ids: number[]) {
  return ids.map((id) => String(id));
}

function isPositiveInteger(value: number) {
  return Number.isInteger(value) && value > 0;
}

function fromStringIds(value: string | string[] | null): number[] {
  const raw = Array.isArray(value) ? value : (typeof value === "string" && value ? [value] : []);
  return raw
    .map((v) => Number(v))
    .filter((v) => isPositiveInteger(v));
}

function normalizeIdArray(value?: (number | string)[]): number[] {
  if (!value) return [];
  return Array.from(
    new Set(
      value
        .map((item) => Number(item))
        .filter((item) => isPositiveInteger(item))
    )
  ).sort((a, b) => a - b);
}

function normalizeQueryFilters(filters: StocksQueryFilters) {
  return {
    searchKey: (filters.searchKey || "").trim().toLowerCase(),
    channelIds: normalizeIdArray(filters.channelIds),
    brandIds: normalizeIdArray(filters.brandIds),
    supplierIds: normalizeIdArray(filters.supplierIds),
    categoryIds: normalizeIdArray(filters.categoryIds),
    productStatus: normalizeIdArray(filters.productStatus),
    searchZone: (filters.searchZone || "").trim().toLowerCase(),
    searchAisle: (filters.searchAisle || "").trim().toLowerCase(),
    searchBin: (filters.searchBin || "").trim().toLowerCase(),
    hasDamaged: Boolean(filters.hasDamaged),
    outOfStock: Boolean(filters.outOfStock),
  };
}

function isEqualNormalizedQueryFilters(left: StocksQueryFilters, right: StocksQueryFilters) {
  const a = normalizeQueryFilters(left);
  const b = normalizeQueryFilters(right);
  return (
    a.searchKey === b.searchKey &&
    equalNumberArrays(a.channelIds, b.channelIds) &&
    equalNumberArrays(a.brandIds, b.brandIds) &&
    equalNumberArrays(a.supplierIds, b.supplierIds) &&
    equalNumberArrays(a.categoryIds, b.categoryIds) &&
    equalNumberArrays(a.productStatus, b.productStatus) &&
    a.searchZone === b.searchZone &&
    a.searchAisle === b.searchAisle &&
    a.searchBin === b.searchBin &&
    a.hasDamaged === b.hasDamaged &&
    a.outOfStock === b.outOfStock
  );
}

function equalNumberArrays(a: number[], b: number[]) {
  if (a.length !== b.length) return false;
  const as = [...a].sort((x, y) => x - y);
  const bs = [...b].sort((x, y) => x - y);
  return as.every((value, index) => value === bs[index]);
}

function equalStringArrays(a: string[], b: string[]) {
  if (a.length !== b.length) return false;
  const as = [...a].sort();
  const bs = [...b].sort();
  return as.every((value, index) => value === bs[index]);
}

function equalAdvancedFilters(a: StocksAdvancedFilters, b: StocksAdvancedFilters) {
  return (
    equalNumberArrays(a.channelIds, b.channelIds) &&
    equalNumberArrays(a.brandIds, b.brandIds) &&
    equalNumberArrays(a.supplierIds, b.supplierIds) &&
    equalNumberArrays(a.categoryIds, b.categoryIds) &&
    a.searchZone.trim() === b.searchZone.trim() &&
    a.searchAisle.trim() === b.searchAisle.trim() &&
    a.searchBin.trim() === b.searchBin.trim() &&
    a.stockType === b.stockType
  );
}

function distributeStock(
  receivedQty: number,
  backOrderStock: number,
  holdFreeShipmentStock: number,
  inHandStock: number,
  onHoldStock: number
) {
  const qty = Number(receivedQty) || 0;
  const prevBackOrderQty = backOrderStock || 0;
  const prevOnHoldQty = onHoldStock || 0;
  const prevHoldFreeShipmentQty = holdFreeShipmentStock || 0;
  const prevInHandStock = inHandStock || 0;

  let newBoQty: number;
  let newOnHoldQty: number;
  let newInHandQty: number;
  let newHoldFreeShipment: number;

  if (qty > prevBackOrderQty) {
    newBoQty = 0;
    newHoldFreeShipment = 0;
    newOnHoldQty = prevOnHoldQty + prevBackOrderQty - prevHoldFreeShipmentQty;
    newInHandQty = prevInHandStock + qty - newOnHoldQty + prevOnHoldQty - prevHoldFreeShipmentQty;
  } else {
    if (holdFreeShipmentStock >= qty) {
      newHoldFreeShipment = prevHoldFreeShipmentQty - qty;
      newOnHoldQty = prevOnHoldQty;
    } else {
      newHoldFreeShipment = 0;
      newOnHoldQty = prevOnHoldQty + qty - prevHoldFreeShipmentQty;
    }
    newBoQty = prevBackOrderQty - qty;
    newInHandQty = prevInHandStock;
  }

  return {
    new_hold_free_shipment: newHoldFreeShipment,
    new_bo_qty: newBoQty,
    new_onHold_qty: newOnHoldQty,
    new_inhand_qty: newInHandQty,
  };
}

function ActionButton({
  icon,
  iconColor,
  backgroundColor,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  backgroundColor: string;
  onPress?: () => void;
}) {
  return (
    <Pressable 
      className="rounded-lg items-center justify-center"
      style={{ width: buttonSize.md.height, height: buttonSize.md.height, backgroundColor, borderRadius: buttonSize.md.borderRadius }}
      onPress={onPress}
    >
      <Ionicons name={icon} size={iconSize.md} color={iconColor} />
    </Pressable>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export default function StocksScreen() {
  const contentWidth = useTableContentWidth();
  const params = useLocalSearchParams<{ openAddProduct?: string }>();
  const [showAddProductPanel, setShowAddProductPanel] = useState(false);
  const addProductPanelRef = useRef<AddProductPanelControllerHandle>(null);

  useEffect(() => {
    if (params.openAddProduct) {
      setShowAddProductPanel(true);
    }
  }, [params.openAddProduct]);
  useEffect(() => {
    if (showAddProductPanel && addProductPanelRef.current) {
      addProductPanelRef.current.open();
    }
  }, [showAddProductPanel]);

  const { data: channelRows } = useSyncStream<ChannelOptionRow>(
    "SELECT id, name, is_primary FROM channels ORDER BY name ASC",
    [],
    { deferInteractions: true }
  );
  const { data: brandRows } = useSyncStream<NamedOptionRow>(
    "SELECT id, name FROM brands ORDER BY name ASC",
    [],
    { deferInteractions: true }
  );
  const { data: supplierRows } = useSyncStream<NamedOptionRow>(
    "SELECT id, name FROM suppliers ORDER BY name ASC",
    [],
    { deferInteractions: true }
  );
  const { data: categoryRows } = useSyncStream<NamedOptionRow>(
    "SELECT id, name FROM categories ORDER BY name ASC",
    [],
    { deferInteractions: true }
  );

  const defaultChannelId = useMemo(() => {
    if (channelRows.length === 0) return null;
    const primaryChannel = channelRows.find((channel) => Number(channel.is_primary || 0) === 1);
    return Number((primaryChannel || channelRows[0]).id);
  }, [channelRows]);

  const defaultAdvancedFilters = useMemo(
    () => createDefaultAdvancedFilters(defaultChannelId),
    [defaultChannelId]
  );

  const [filtersReady, setFiltersReady] = useState(false);
  const [storageHydrated, setStorageHydrated] = useState(false);
  const [initialChannelApplied, setInitialChannelApplied] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [productStatusValues, setProductStatusValues] = useState<string[]>(["1"]);
  const [tablePage, setTablePage] = useState(1);
  const tablePageSize = 10;
  const paginationPerfRunIdRef = useRef(0);
  const paginationPerfRef = useRef<StocksPaginationPerfTrace | null>(null);
  const [advancedFilters, setAdvancedFilters] = useState<StocksAdvancedFilters>(
    () => createDefaultAdvancedFilters(null)
  );
  const [advancedFiltersDraft, setAdvancedFiltersDraft] = useState<StocksAdvancedFilters>(
    () => createDefaultAdvancedFilters(null)
  );

  const handleStockQuerySnapshotEnd = useCallback((meta: StocksPerfSnapshotMeta) => {
    if (!__DEV__) return;
    const trace = paginationPerfRef.current;
    if (!trace || trace.completed) return;
    if (meta.page !== trace.toPage) return;
    if (!meta.success) return;

    if (meta.phase === "data") {
      if (trace.dataQueryEndMs != null) return;
      trace.dataQueryStartMs = meta.startedAtMs;
      trace.dataQueryEndMs = meta.endedAtMs;
      trace.dataQueryDurationMs = meta.durationMs;
      console.log(
        "[StocksPagePerf]",
        JSON.stringify({
          stage: "data_query_end",
          runId: trace.runId,
          fromPage: trace.fromPage,
          toPage: trace.toPage,
          queryDurationMs: formatPerfMs(meta.durationMs),
          clickToQueryStartMs: formatPerfMs(meta.startedAtMs - trace.clickMs),
          clickToQueryEndMs: formatPerfMs(meta.endedAtMs - trace.clickMs),
          rowCount: meta.rowCount,
        })
      );
      return;
    }

    if (trace.countQueryEndMs != null) return;
    trace.countQueryStartMs = meta.startedAtMs;
    trace.countQueryEndMs = meta.endedAtMs;
    trace.countQueryDurationMs = meta.durationMs;
    console.log(
      "[StocksPagePerf]",
      JSON.stringify({
        stage: "count_query_end",
        runId: trace.runId,
        fromPage: trace.fromPage,
        toPage: trace.toPage,
        queryDurationMs: formatPerfMs(meta.durationMs),
        clickToQueryStartMs: formatPerfMs(meta.startedAtMs - trace.clickMs),
        clickToQueryEndMs: formatPerfMs(meta.endedAtMs - trace.clickMs),
        rowCount: meta.rowCount,
      })
    );
  }, []);

  const handleDataTableRenderPerf = useCallback((metrics: DataTableRenderPerfMetrics) => {
    if (!__DEV__) return;
    const trace = paginationPerfRef.current;
    if (!trace || trace.completed) return;
    if (metrics.currentPage !== trace.toPage) return;
    trace.dataTableRenderSnapshot = metrics;
    console.log(
      "[StocksPagePerf]",
      JSON.stringify({
        stage: "datatable_render",
        runId: trace.runId,
        fromPage: trace.fromPage,
        toPage: trace.toPage,
        clickToDataTableRenderMs: formatPerfMs(metrics.timestampMs - trace.clickMs),
        processedDataMs: metrics.processedDataMs,
        paginatedDataMs: metrics.paginatedDataMs,
        rowsBuildMs: metrics.rowsBuildMs,
        renderBuildMs: metrics.renderBuildMs,
      })
    );
  }, []);

  const queryFilters = useMemo<StocksQueryFilters>(
    () => ({
      searchKey: searchText,
      productStatus: productStatusValues,
      channelIds: advancedFilters.channelIds,
      brandIds: advancedFilters.brandIds,
      supplierIds: advancedFilters.supplierIds,
      categoryIds: advancedFilters.categoryIds,
      searchZone: advancedFilters.searchZone,
      searchAisle: advancedFilters.searchAisle,
      searchBin: advancedFilters.searchBin,
      hasDamaged: advancedFilters.stockType === "damaged",
      outOfStock: advancedFilters.stockType === "out_of_stock",
    }),
    [advancedFilters, productStatusValues, searchText]
  );
  const stockPerfCallbacks = useMemo<StocksPerfCallbacks>(
    () => ({
      onQuerySnapshotEnd: handleStockQuerySnapshotEnd,
    }),
    [handleStockQuerySnapshotEnd]
  );

  const { stocks, isLoading, isStreaming, refresh, count } = useStocks(
    queryFilters,
    undefined,
    stockPerfCallbacks,
    { deferInteractions: true }
  );

  useEffect(() => {
    setTablePage(1);
  }, [queryFilters]);

  useEffect(() => {
    if (!__DEV__) return;
    const trace = paginationPerfRef.current;
    if (!trace || trace.completed) return;
    if (trace.toPage !== tablePage) return;
    if (isLoading) return;
    if (trace.screenDataBoundMs != null) return;

    trace.screenDataBoundMs = nowMs();
    const dataQueryToScreenMs =
      trace.dataQueryEndMs == null ? null : trace.screenDataBoundMs - trace.dataQueryEndMs;
    console.log(
      "[StocksPagePerf]",
      JSON.stringify({
        stage: "screen_data_bound",
        runId: trace.runId,
        fromPage: trace.fromPage,
        toPage: trace.toPage,
        clickToScreenDataBoundMs: formatPerfMs(trace.screenDataBoundMs - trace.clickMs),
        dataQueryToScreenMs:
          dataQueryToScreenMs == null ? null : formatPerfMs(dataQueryToScreenMs),
        rows: stocks.length,
      })
    );
  }, [isLoading, stocks, tablePage]);

  useEffect(() => {
    if (!__DEV__) return;
    const trace = paginationPerfRef.current;
    if (!trace || trace.completed) return;
    if (trace.loadingStartMs != null) return;
    if (!isLoading) return;
    trace.loadingStartMs = nowMs();
    console.log(
      "[StocksPagePerf]",
      JSON.stringify({
        stage: "loading_start",
        runId: trace.runId,
        fromPage: trace.fromPage,
        toPage: trace.toPage,
        clickToLoadingMs: formatPerfMs(trace.loadingStartMs - trace.clickMs),
      })
    );
  }, [isLoading]);

  useEffect(() => {
    if (!__DEV__) return;
    const trace = paginationPerfRef.current;
    if (!trace || trace.completed) return;
    if (trace.toPage !== tablePage) return;
    if (isLoading) return;
    if (trace.dataReadyMs != null) return;

    trace.dataReadyMs = nowMs();
    const clickToDataReadyMs = trace.dataReadyMs - trace.clickMs;
    const loadingToDataReadyMs =
      trace.loadingStartMs != null ? trace.dataReadyMs - trace.loadingStartMs : null;
    const firstRow = stocks[0];

    console.log(
      "[StocksPagePerf]",
      JSON.stringify({
        stage: "data_ready",
        runId: trace.runId,
        fromPage: trace.fromPage,
        toPage: trace.toPage,
        rows: stocks.length,
        totalCount: count,
        firstRowId: firstRow?.id ?? null,
        firstRowSku: firstRow?.sku ?? null,
        clickToDataReadyMs: formatPerfMs(clickToDataReadyMs),
        loadingToDataReadyMs:
          loadingToDataReadyMs == null ? null : formatPerfMs(loadingToDataReadyMs),
      })
    );

    requestAnimationFrame(() => {
      const activeTrace = paginationPerfRef.current;
      if (!activeTrace || activeTrace.runId !== trace.runId || activeTrace.completed) return;
      activeTrace.frameMs = nowMs();
      const clickToFrameMs = activeTrace.frameMs - activeTrace.clickMs;
      const dataReadyToFrameMs = activeTrace.frameMs - (activeTrace.dataReadyMs ?? activeTrace.clickMs);

      InteractionManager.runAfterInteractions(() => {
        const finalTrace = paginationPerfRef.current;
        if (!finalTrace || finalTrace.runId !== trace.runId || finalTrace.completed) return;
        finalTrace.interactionsMs = nowMs();
        finalTrace.completed = true;

        const clickToInteractionsMs = finalTrace.interactionsMs - finalTrace.clickMs;
        const frameToInteractionsMs =
          finalTrace.frameMs == null ? null : finalTrace.interactionsMs - finalTrace.frameMs;
        const loadingToDataReadyFinalMs =
          finalTrace.loadingStartMs == null || finalTrace.dataReadyMs == null
            ? null
            : finalTrace.dataReadyMs - finalTrace.loadingStartMs;
        const screenToDataTableRenderMs =
          finalTrace.screenDataBoundMs == null || !finalTrace.dataTableRenderSnapshot
            ? null
            : finalTrace.dataTableRenderSnapshot.timestampMs - finalTrace.screenDataBoundMs;
        const dataQueryToScreenMs =
          finalTrace.dataQueryEndMs == null || finalTrace.screenDataBoundMs == null
            ? null
            : finalTrace.screenDataBoundMs - finalTrace.dataQueryEndMs;
        const clickToDataQueryEndMs =
          finalTrace.dataQueryEndMs == null
            ? null
            : finalTrace.dataQueryEndMs - finalTrace.clickMs;
        const clickToCountQueryEndMs =
          finalTrace.countQueryEndMs == null
            ? null
            : finalTrace.countQueryEndMs - finalTrace.clickMs;

        console.log(
          "[StocksPagePerf][final]",
          JSON.stringify({
            runId: finalTrace.runId,
            fromPage: finalTrace.fromPage,
            toPage: finalTrace.toPage,
            rows: stocks.length,
            totalCount: count,
            clickToDataReadyMs: formatPerfMs(
              (finalTrace.dataReadyMs ?? finalTrace.clickMs) - finalTrace.clickMs
            ),
            loadingToDataReadyMs:
              loadingToDataReadyFinalMs == null
                ? null
                : formatPerfMs(loadingToDataReadyFinalMs),
            dataQueryDurationMs:
              finalTrace.dataQueryDurationMs == null
                ? null
                : formatPerfMs(finalTrace.dataQueryDurationMs),
            clickToDataQueryEndMs:
              clickToDataQueryEndMs == null ? null : formatPerfMs(clickToDataQueryEndMs),
            countQueryDurationMs:
              finalTrace.countQueryDurationMs == null
                ? null
                : formatPerfMs(finalTrace.countQueryDurationMs),
            clickToCountQueryEndMs:
              clickToCountQueryEndMs == null ? null : formatPerfMs(clickToCountQueryEndMs),
            clickToScreenDataBoundMs:
              finalTrace.screenDataBoundMs == null
                ? null
                : formatPerfMs(finalTrace.screenDataBoundMs - finalTrace.clickMs),
            dataQueryToScreenMs:
              dataQueryToScreenMs == null ? null : formatPerfMs(dataQueryToScreenMs),
            screenToDataTableRenderMs:
              screenToDataTableRenderMs == null ? null : formatPerfMs(screenToDataTableRenderMs),
            clickToFrameMs: formatPerfMs(clickToFrameMs),
            dataReadyToFrameMs: formatPerfMs(dataReadyToFrameMs),
            clickToInteractionsMs: formatPerfMs(clickToInteractionsMs),
            frameToInteractionsMs:
              frameToInteractionsMs == null ? null : formatPerfMs(frameToInteractionsMs),
            dataTableProcessedDataMs:
              finalTrace.dataTableRenderSnapshot?.processedDataMs ?? null,
            dataTablePaginatedDataMs:
              finalTrace.dataTableRenderSnapshot?.paginatedDataMs ?? null,
            dataTableRowsBuildMs:
              finalTrace.dataTableRenderSnapshot?.rowsBuildMs ?? null,
            dataTableRenderBuildMs:
              finalTrace.dataTableRenderSnapshot?.renderBuildMs ?? null,
          })
        );

        paginationPerfRef.current = null;
      });
    });
  }, [count, isLoading, stocks, tablePage]);

  const lastCompareLogRef = useRef<string>("");
  const activeCompareCase = useMemo(
    () => STOCKS_COMPARE_CASES.find((testCase) => isEqualNormalizedQueryFilters(queryFilters, testCase.filters)),
    [queryFilters]
  );

  const [selectedRowKeys, setSelectedRowKeys] = useState<string[]>([]);
  const [bulkModalVisible, setBulkModalVisible] = useState(false);
  const [bulkRows, setBulkRows] = useState<StockView[]>([]);
  const [bulkEditMap, setBulkEditMap] = useState<Record<string, BulkEditValue>>({});
  const [bulkSubmitting, setBulkSubmitting] = useState(false);
  const [singleEditModalVisible, setSingleEditModalVisible] = useState(false);
  const [singleEditSubmitting, setSingleEditSubmitting] = useState(false);
  const [singleEditLoading, setSingleEditLoading] = useState(false);
  const [singleEditProductId, setSingleEditProductId] = useState<number | null>(null);
  const [singleEditProductName, setSingleEditProductName] = useState("");
  const [singleEditRows, setSingleEditRows] = useState<StockEditRow[]>([]);
  const [singleEditMap, setSingleEditMap] = useState<Record<string, SingleEditValue>>({});

  const channelNameMap = useMemo(
    () =>
      new Map<number, string>(
        channelRows.map((channel) => [Number(channel.id), String(channel.name || `#${channel.id}`)])
      ),
    [channelRows]
  );
  const brandNameMap = useMemo(
    () =>
      new Map<number, string>(
        brandRows.map((brand) => [Number(brand.id), String(brand.name || `#${brand.id}`)])
      ),
    [brandRows]
  );
  const supplierNameMap = useMemo(
    () =>
      new Map<number, string>(
        supplierRows.map((supplier) => [Number(supplier.id), String(supplier.name || `#${supplier.id}`)])
      ),
    [supplierRows]
  );
  const categoryNameMap = useMemo(
    () =>
      new Map<number, string>(
        categoryRows.map((category) => [Number(category.id), String(category.name || `#${category.id}`)])
      ),
    [categoryRows]
  );

  const persistStockFilters = useCallback(
    async (nextSearchText: string, nextProductStatusValues: string[], nextAdvancedFilters: StocksAdvancedFilters) => {
      const payload: StocksFilterStoragePayload = {
        advance_filters: {
          channel_ids: nextAdvancedFilters.channelIds,
          brand_ids: nextAdvancedFilters.brandIds,
          supplier_ids: nextAdvancedFilters.supplierIds,
          category_id: nextAdvancedFilters.categoryIds,
          searchText: nextSearchText,
          search_zone: nextAdvancedFilters.searchZone,
          search_aisle: nextAdvancedFilters.searchAisle,
          search_Bin: nextAdvancedFilters.searchBin,
          damaged_product: nextAdvancedFilters.stockType === "damaged" ? "1" : "",
          out_of_stock: nextAdvancedFilters.stockType === "out_of_stock" ? "1" : "",
          product_status: nextProductStatusValues
            .map((value) => Number(value))
            .filter((value) => isPositiveInteger(value)),
        },
        show_advance_filters: true,
        display_advance_filters: true,
        channelForBulkEdit: nextAdvancedFilters.channelIds.map((channelId) => ({
          id: channelId,
          name: channelNameMap.get(channelId) || String(channelId),
        })),
      };
      await AsyncStorage.setItem(STOCK_SEARCH_FILTER_STORAGE_KEY, JSON.stringify(payload));
    },
    [channelNameMap]
  );

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STOCK_SEARCH_FILTER_STORAGE_KEY);
        if (!raw) return;
        const parsed = JSON.parse(raw) as Partial<StocksFilterStoragePayload>;
        const storedFilters = parsed.advance_filters;
        if (!storedFilters) return;

        const storedStatusRaw = storedFilters.product_status;
        const storedStatusValues = (Array.isArray(storedStatusRaw) ? storedStatusRaw : [storedStatusRaw])
          .map((value) => Number(value))
          .filter((value) => isPositiveInteger(value))
          .map((value) => String(value));

        const nextAdvancedFilters: StocksAdvancedFilters = {
          channelIds: Array.isArray(storedFilters.channel_ids)
            ? storedFilters.channel_ids.map((value) => Number(value)).filter((value) => isPositiveInteger(value))
            : [],
          brandIds: Array.isArray(storedFilters.brand_ids)
            ? storedFilters.brand_ids.map((value) => Number(value)).filter((value) => isPositiveInteger(value))
            : [],
          supplierIds: Array.isArray(storedFilters.supplier_ids)
            ? storedFilters.supplier_ids.map((value) => Number(value)).filter((value) => isPositiveInteger(value))
            : [],
          categoryIds: Array.isArray(storedFilters.category_id)
            ? storedFilters.category_id.map((value) => Number(value)).filter((value) => isPositiveInteger(value))
            : [],
          searchZone: typeof storedFilters.search_zone === "string" ? storedFilters.search_zone : "",
          searchAisle: typeof storedFilters.search_aisle === "string" ? storedFilters.search_aisle : "",
          searchBin: typeof storedFilters.search_Bin === "string" ? storedFilters.search_Bin : "",
          stockType:
            storedFilters.damaged_product === "1"
              ? "damaged"
              : storedFilters.out_of_stock === "1"
                ? "out_of_stock"
                : "",
        };

        if (cancelled) return;
        setSearchText(typeof storedFilters.searchText === "string" ? storedFilters.searchText : "");
        setProductStatusValues(storedStatusValues.length > 0 ? storedStatusValues : ["1"]);
        setAdvancedFilters(nextAdvancedFilters);
        setAdvancedFiltersDraft(nextAdvancedFilters);
        if (nextAdvancedFilters.channelIds.length > 0) {
          setInitialChannelApplied(true);
        }
      } catch (error) {
        console.warn("[Stocks] Failed to hydrate stock_search_filter", error);
      } finally {
        if (!cancelled) {
          setStorageHydrated(true);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!storageHydrated || filtersReady) return;

    const nextAdvancedFilters: StocksAdvancedFilters = {
      ...defaultAdvancedFilters,
      ...advancedFilters,
      channelIds:
        advancedFilters.channelIds.length > 0
          ? advancedFilters.channelIds
          : defaultAdvancedFilters.channelIds,
    };

    setAdvancedFilters(nextAdvancedFilters);
    setAdvancedFiltersDraft(nextAdvancedFilters);
    if (nextAdvancedFilters.channelIds.length > 0) {
      setInitialChannelApplied(true);
    }
    if (productStatusValues.length === 0) {
      setProductStatusValues(["1"]);
    }
    setFiltersReady(true);
  }, [
    advancedFilters,
    defaultAdvancedFilters,
    filtersReady,
    productStatusValues.length,
    storageHydrated,
  ]);

  useEffect(() => {
    if (!filtersReady || initialChannelApplied || !defaultChannelId) return;

    setAdvancedFilters((prev) => {
      if (prev.channelIds.length > 0) return prev;
      const next = { ...prev, channelIds: [defaultChannelId] };
      setAdvancedFiltersDraft(next);
      return next;
    });
    setInitialChannelApplied(true);
  }, [defaultChannelId, filtersReady, initialChannelApplied]);

  useEffect(() => {
    if (!filtersReady) return;
    void persistStockFilters(searchText, productStatusValues, advancedFilters);
  }, [advancedFilters, filtersReady, persistStockFilters, productStatusValues, searchText]);

  useEffect(() => {
    if (!activeCompareCase) return;
    const logKey = `${activeCompareCase.id}:${count}`;
    if (lastCompareLogRef.current === logKey) return;
    lastCompareLogRef.current = logKey;
    const isMatch = count === activeCompareCase.expectedRemoteCount;
    console.log(
      `[StocksCompare][LOCAL] case=${activeCompareCase.id} local_count=${count} remote_expected=${activeCompareCase.expectedRemoteCount} result=${isMatch ? "PASS" : "FAIL"} filters=${JSON.stringify(
        normalizeQueryFilters(queryFilters)
      )}`
    );
  }, [activeCompareCase, count, queryFilters]);

  const updateSingleEditValue = (rowKey: string, key: keyof SingleEditValue, value: string) => {
    const cleaned = value.replace(/[^0-9]/g, "");
    setSingleEditMap((prev) => ({
      ...prev,
      [rowKey]: {
        availableQty: prev[rowKey]?.availableQty ?? "0",
        damagedQty: prev[rowKey]?.damagedQty ?? "0",
        minQty: prev[rowKey]?.minQty ?? "0",
        maxQty: prev[rowKey]?.maxQty ?? "0",
        [key]: cleaned,
      },
    }));
  };

  const closeSingleEditModal = () => {
    setSingleEditModalVisible(false);
    setSingleEditRows([]);
    setSingleEditMap({});
    setSingleEditProductId(null);
    setSingleEditProductName("");
  };

  const handleEdit = useCallback(async (row: StockView) => {
    try {
      setSingleEditLoading(true);
      setSingleEditProductName(row.productName || "-");
      setSingleEditRows([]);
      setSingleEditMap({});
      setSingleEditModalVisible(true);
      const productId = row.productId;
      const detail = await getStockByProductId(productId);
      if (!detail || !Array.isArray(detail.channel_info)) {
        Alert.alert("Stock Edit", "Unable to load product stock details.");
        closeSingleEditModal();
        return;
      }

      const mappedRows: StockEditRow[] = detail.channel_info.map((channel) => {
        const channelId = Number(channel.channel_id || 0);
        const rowKey = String(channelId);
        const lowestUnitDefinition = Math.max(1, Number(channel.lowest_unit_definition || 1));
        return {
          key: rowKey,
          channelId,
          channelName: String(channel.channel_name || "-"),
          availableQty: toPieceQty(channel.in_hand as number | null | undefined, lowestUnitDefinition),
          onHoldQty: toPieceQty(channel.on_hold as number | null | undefined, lowestUnitDefinition),
          damagedQty: toPieceQty(channel.damaged as number | null | undefined, lowestUnitDefinition),
          backOrderQty: toPieceQty(channel.back_order as number | null | undefined, lowestUnitDefinition),
          comingSoonQty: toPieceQty(channel.coming_soon as number | null | undefined, lowestUnitDefinition),
          deliveredWithoutStockQty: toPieceQty(channel.hold_free_shipment as number | null | undefined, lowestUnitDefinition),
          minQty: toPieceQty(channel.min_qty as number | null | undefined, lowestUnitDefinition),
          maxQty: toPieceQty(channel.max_qty as number | null | undefined, lowestUnitDefinition),
          lowestUnitDefinition,
          raw: channel,
        };
      });

      const nextEditMap: Record<string, SingleEditValue> = {};
      mappedRows.forEach((editRow) => {
        nextEditMap[editRow.key] = {
          availableQty: String(editRow.availableQty),
          damagedQty: String(editRow.damagedQty),
          minQty: String(editRow.minQty),
          maxQty: String(editRow.maxQty),
        };
      });

      setSingleEditRows(mappedRows);
      setSingleEditMap(nextEditMap);
      setSingleEditProductId(productId);
      setSingleEditProductName(String(detail.product_name || row.productName || "-"));
      setSingleEditModalVisible(true);
    } catch (error: any) {
      const message = error?.response?.data?.message || error?.message || "Unable to open stock editor.";
      Alert.alert("Stock Edit", message);
      closeSingleEditModal();
    } finally {
      setSingleEditLoading(false);
    }
  }, []);

  const handleSingleEditSubmit = async () => {
    if (!singleEditProductId || !singleEditRows.length || singleEditSubmitting) return;
    try {
      setSingleEditSubmitting(true);

      const channelInfoPayload: StockChannelInfo[] = singleEditRows.map((row) => {
        const nextAvailable = parseQtyInput(singleEditMap[row.key]?.availableQty ?? "", row.availableQty);
        const nextDamaged = parseQtyInput(singleEditMap[row.key]?.damagedQty ?? "", row.damagedQty);
        const nextMin = parseQtyInput(singleEditMap[row.key]?.minQty ?? "", row.minQty);
        const nextMax = parseQtyInput(singleEditMap[row.key]?.maxQty ?? "", row.maxQty);
        const factor = row.lowestUnitDefinition;
        return {
          ...row.raw,
          channel_id: Number(row.channelId),
          in_hand: nextAvailable * factor,
          damaged: nextDamaged * factor,
          min_qty: nextMin * factor,
          max_qty: nextMax * factor,
        };
      });

      await updateStocksApi({
        product_id: Number(singleEditProductId),
        channel_info: channelInfoPayload,
      });

      await refresh();
      closeSingleEditModal();
      Alert.alert("Success", "Stock has been updated successfully.");
    } catch (error: any) {
      const message = error?.response?.data?.message || error?.message || "Stock update failed.";
      Alert.alert("Stock Edit", message);
    } finally {
      setSingleEditSubmitting(false);
    }
  };

  const handleBulkEditOpen = useCallback((rows: StockView[]) => {
    if (!rows.length) {
      Alert.alert("Bulk Edit Stock", "Please select product(s) for bulk editing.");
      return;
    }

    const uniqueChannelIds = Array.from(new Set(rows.map((row) => row.channelId)));
    if (uniqueChannelIds.length > 1) {
      Alert.alert("Bulk Edit Stock", "Please select only one channel for bulk editing.");
      return;
    }

    const nextEditMap: Record<string, BulkEditValue> = {};
    rows.forEach((row) => {
      nextEditMap[row.id] = {
        availableQty: String(row.availableQty ?? 0),
        damagedQty: String(row.damagedQty ?? 0),
      };
    });

    setBulkRows(rows);
    setBulkEditMap(nextEditMap);
    setBulkModalVisible(true);
  }, []);

  const updateBulkValue = (rowId: string, key: keyof BulkEditValue, value: string) => {
    const cleaned = value.replace(/[^0-9]/g, "");
    setBulkEditMap((prev) => ({
      ...prev,
      [rowId]: {
        availableQty: prev[rowId]?.availableQty ?? "0",
        damagedQty: prev[rowId]?.damagedQty ?? "0",
        [key]: cleaned,
      },
    }));
  };

  const handleBulkEditSubmit = async () => {
    if (!bulkRows.length || bulkSubmitting) return;

    const channelId = bulkRows[0].channelId;
    const payload: BulkStockUpdateItem[] = bulkRows.map((row) => {
      const availableQty = parseQtyInput(
        bulkEditMap[row.id]?.availableQty ?? "",
        row.availableQty ?? 0
      );
      const damagedQty = parseQtyInput(
        bulkEditMap[row.id]?.damagedQty ?? "",
        row.damagedQty ?? 0
      );
      return {
        product_id: row.productId,
        channel_id: channelId,
        // Keep this field aligned with web payload shape.
        available_qty: row.availableQty ?? 0,
        on_hold_qty: row.onHoldQty ?? 0,
        back_order_qty: row.backOrderQty ?? 0,
        hold_free_shipment: row.deliveredWithoutStockQty ?? 0,
        stock_qty_data: {
          6: availableQty,
          8: damagedQty,
        },
      };
    });

    try {
      setBulkSubmitting(true);
      await bulkUpdateStocks(payload);
      await refresh();
      setSelectedRowKeys([]);
      setBulkModalVisible(false);
      setBulkRows([]);
      setBulkEditMap({});
      Alert.alert("Success", "Stock has been updated successfully.");
    } catch (error: any) {
      const message = error?.response?.data?.message || error?.message || "Bulk update failed.";
      Alert.alert("Bulk Edit Stock", message);
    } finally {
      setBulkSubmitting(false);
    }
  };

  const columns = useMemo<ColumnDefinition<StockView>[]>(() => [
      {
        key: "image",
        title: "Image",
        width: "5%",
        visible: true,
        render: () => (
          <View className="w-12 h-12 rounded bg-gray-100 items-center justify-center">
            <Ionicons name="cube-outline" size={iconSize.base} color={colors.textTertiary} />
          </View>
        ),
      },
      {
        key: "productName",
        title: "Product Name",
        width: "18%",
        visible: true,
        hideable: false,
        render: (item) => (
          <View>
            <Text className="text-blue-600 text-lg  font-medium" numberOfLines={1}>
              {item.productName || "-"}
            </Text>
            <Text className="text-gray-500 text-sm " numberOfLines={1}>
              Bin: {item.bin || "-"}
            </Text>
          </View>
        ),
      },
      {
        key: "skuUpc",
        title: "SKU/UPC",
        width: "12%",
        visible: true,
        render: (item) => (
          <View>
            <Text className="text-[#1A1A1A] text-lg ">{item.sku || "-"}</Text>
            <Text className="text-gray-500 text-sm ">{item.upc || "-"}</Text>
          </View>
        ),
      },
      {
        key: "channelName",
        title: "Channel Name",
        width: "10%",
        visible: false,
        render: (item) => <Text className="text-[#1A1A1A] text-lg ">{item.channelName || "-"}</Text>,
      },
      {
        key: "categoryName",
        title: "Category",
        width: "10%",
        visible: true,
        render: (item) => <Text className="text-[#1A1A1A] text-lg ">{item.categoryName || "-"}</Text>,
      },
      {
        key: "brandName",
        title: "Brand",
        width: "10%",
        visible: true,
        render: (item) => <Text className="text-[#1A1A1A] text-lg ">{item.brandName || "-"}</Text>,
      },
      {
        key: "status",
        title: "Active",
        width: "7%",
        align: "center",
        visible: true,
        render: (item) => (
          item.status === 1 && !item.deletedAt ? (
            <Ionicons name="checkmark-circle" size={iconSize.lg} color={colors.success} />
          ) : (
            <Ionicons name="close-circle" size={iconSize.lg} color={colors.error} />
          )
        ),
      },
      {
        key: "baseCostPrice",
        title: "Base Cost Prices",
        width: "9%",
        align: "center",
        visible: false,
        render: (item) => <Text className="text-[#1A1A1A] text-lg ">{formatCurrency(item.baseCostPrice)}</Text>,
      },
      {
        key: "costPrice",
        title: "Net Cost Prices",
        width: "9%",
        align: "center",
        visible: false,
        render: (item) => <Text className="text-[#1A1A1A] text-lg ">{formatCurrency(item.costPrice)}</Text>,
      },
      {
        key: "salePrice",
        title: "Sale Price",
        width: "9%",
        align: "center",
        visible: false,
        render: (item) => <Text className="text-green-600 font-bold text-lg ">{formatCurrency(item.salePrice)}</Text>,
      },
      {
        key: "availableQty",
        title: "Available QTY",
        width: "9%",
        align: "center",
        visible: true,
        render: (item) => (
          <Text className={`font-bold text-lg  ${item.availableQty > 0 ? "text-green-600" : "text-red-500"}`}>
            {formatQty(item.availableQty)}
          </Text>
        ),
      },
      {
        key: "onHoldQty",
        title: "On Hold",
        width: "8%",
        align: "center",
        visible: false,
        render: (item) => <Text className="text-[#1A1A1A] text-lg ">{formatQty(item.onHoldQty)}</Text>,
      },
      {
        key: "backOrderQty",
        title: "Back Order QTY",
        width: "9%",
        align: "center",
        visible: false,
        render: (item) => <Text className="text-[#1A1A1A] text-lg ">{formatQty(item.backOrderQty)}</Text>,
      },
      {
        key: "comingSoonQty",
        title: "Coming Soon QTY",
        width: "10%",
        align: "center",
        visible: false,
        render: (item) => <Text className="text-[#1A1A1A] text-lg ">{formatQty(item.comingSoonQty)}</Text>,
      },
      {
        key: "deliveredWithoutStockQty",
        title: "Delivered Without Stock",
        width: "12%",
        align: "center",
        visible: false,
        render: (item) => <Text className="text-[#1A1A1A] text-lg ">{formatQty(item.deliveredWithoutStockQty)}</Text>,
      },
      {
        key: "damagedQty",
        title: "Damaged QTY",
        width: "9%",
        align: "center",
        visible: false,
        render: (item) => <Text className="text-[#1A1A1A] text-lg ">{formatQty(item.damagedQty)}</Text>,
      },
      {
        key: "totalQty",
        title: "Total Quantity",
        width: "9%",
        align: "center",
        visible: true,
        render: (item) => <Text className="text-[#1A1A1A] text-lg ">{formatQty(item.totalQty)}</Text>,
      },
      {
        key: "totalCost",
        title: "Total Cost",
        width: "9%",
        align: "center",
        visible: true,
        render: (item) => <Text className="text-[#1A1A1A] text-lg ">{formatCurrency(item.totalCost)}</Text>,
      },
      {
        key: "actions",
        title: "Actions",
        width: ACTION_COL_WIDTH,
        align: "center",
        visible: true,
        hideable: false,
        render: (item) => (
          <View className="flex-row items-center justify-center gap-1">
            <ActionButton
              icon="pencil"
              iconColor={colors.primary}
              backgroundColor={colors.primaryLight}
              onPress={() => handleEdit(item)}
            />
          </View>
        ),
      },
    ], [handleEdit]);

  const filters: FilterDefinition[] = [
    {
      key: "productStatus",
      placeholder: "Search by Product Status",
      width: 170,
      options: PRODUCT_STATUS_FILTER_OPTIONS,
      multiple: true,
      defaultValue: productStatusValues,
    },
  ];

  const channelFilterOptions = useMemo(
    () =>
      channelRows.map((channel) => ({
        label: String(channel.name || `#${channel.id}`),
        value: String(channel.id),
      })),
    [channelRows]
  );
  const brandFilterOptions = useMemo(
    () =>
      brandRows.map((brand) => ({
        label: String(brand.name || `#${brand.id}`),
        value: String(brand.id),
      })),
    [brandRows]
  );
  const supplierFilterOptions = useMemo(
    () =>
      supplierRows.map((supplier) => ({
        label: String(supplier.name || `#${supplier.id}`),
        value: String(supplier.id),
      })),
    [supplierRows]
  );
  const categoryFilterOptions = useMemo(
    () =>
      categoryRows.map((category) => ({
        label: String(category.name || `#${category.id}`),
        value: String(category.id),
      })),
    [categoryRows]
  );

  const defaultStatusValues = useMemo(() => ["1"], []);
  const isAdvancedFilterDirty = useMemo(
    () => !equalAdvancedFilters(advancedFilters, defaultAdvancedFilters),
    [advancedFilters, defaultAdvancedFilters]
  );

  const appliedFilters = useMemo(() => {
    const statusLabel = productStatusValues
      .map((value) => PRODUCT_STATUS_FILTER_OPTIONS.find((option) => option.value === value)?.label)
      .filter(Boolean)
      .join(", ");
    const stockTypeLabel = STOCK_TYPE_OPTIONS.find((option) => option.value === advancedFilters.stockType)?.label || "";

    const resolveNames = (ids: number[], nameMap: Map<number, string>) =>
      ids.map((id) => nameMap.get(id) || String(id)).join(", ");

    return [
      { label: "Search", value: searchText.trim() },
      { label: "Product Status", value: statusLabel },
      { label: "Channel", value: resolveNames(advancedFilters.channelIds, channelNameMap) },
      { label: "Brand", value: resolveNames(advancedFilters.brandIds, brandNameMap) },
      { label: "Supplier", value: resolveNames(advancedFilters.supplierIds, supplierNameMap) },
      { label: "Category", value: resolveNames(advancedFilters.categoryIds, categoryNameMap) },
      { label: "Zone", value: advancedFilters.searchZone.trim() },
      { label: "Aisle", value: advancedFilters.searchAisle.trim() },
      { label: "Bin", value: advancedFilters.searchBin.trim() },
      { label: "Stock Type", value: stockTypeLabel },
    ].filter((item) => item.value);
  }, [
    advancedFilters,
    brandNameMap,
    categoryNameMap,
    channelNameMap,
    productStatusValues,
    searchText,
    supplierNameMap,
  ]);

  const handleSearchQueryChange = useCallback((value: string) => {
    setSearchText(value.replace(/^\s+/, ""));
  }, []);

  const handleTablePageChange = useCallback((nextPage: number) => {
    const normalizedPage = Math.max(1, Math.floor(nextPage || 1));
    if (__DEV__) {
      const prevPage = paginationPerfRef.current?.toPage ?? tablePage;
      const runId = paginationPerfRunIdRef.current + 1;
      paginationPerfRunIdRef.current = runId;
      const clickMs = nowMs();
      paginationPerfRef.current = {
        runId,
        fromPage: prevPage,
        toPage: normalizedPage,
        clickMs,
      };
      console.log(
        "[StocksPagePerf]",
        JSON.stringify({
          stage: "click",
          runId,
          fromPage: prevPage,
          toPage: normalizedPage,
          clickMs: formatPerfMs(clickMs),
        })
      );
    }
    // Don't call setTablePage — pagination is handled inside DataTable (client mode)
  }, [tablePage]);

  const handleTableFiltersChange = useCallback(
    (filtersMap: Record<string, string | string[] | null>) => {
      const nextValuesRaw = filtersMap.productStatus;
      const nextValues = Array.isArray(nextValuesRaw)
        ? nextValuesRaw
        : (typeof nextValuesRaw === "string" && nextValuesRaw ? [nextValuesRaw] : []);
      if (!equalStringArrays(nextValues, productStatusValues)) {
        setProductStatusValues(nextValues);
      }
    },
    [productStatusValues]
  );

  const handleSettingsModalOpen = useCallback(() => {
    setAdvancedFiltersDraft(advancedFilters);
  }, [advancedFilters]);

  const applyAdvancedFilters = useCallback(() => {
    const normalizedNextFilters: StocksAdvancedFilters = {
      ...advancedFiltersDraft,
      channelIds: advancedFiltersDraft.channelIds.filter((value) => isPositiveInteger(value)),
      brandIds: advancedFiltersDraft.brandIds.filter((value) => isPositiveInteger(value)),
      supplierIds: advancedFiltersDraft.supplierIds.filter((value) => isPositiveInteger(value)),
      categoryIds: advancedFiltersDraft.categoryIds.filter((value) => isPositiveInteger(value)),
      searchZone: advancedFiltersDraft.searchZone.trim(),
      searchAisle: advancedFiltersDraft.searchAisle.trim(),
      searchBin: advancedFiltersDraft.searchBin.trim(),
    };
    setAdvancedFilters(normalizedNextFilters);
  }, [advancedFiltersDraft]);

  const clearAdvancedFilters = useCallback(() => {
    const nextAdvancedFilters = createDefaultAdvancedFilters(defaultChannelId);
    setSearchText("");
    setProductStatusValues(defaultStatusValues);
    setAdvancedFilters(nextAdvancedFilters);
    setAdvancedFiltersDraft(nextAdvancedFilters);
  }, [defaultChannelId, defaultStatusValues]);

  const updateDraftMultiSelect = useCallback(
    (key: "channelIds" | "brandIds" | "supplierIds" | "categoryIds", value: string | string[] | null) => {
      const ids = fromStringIds(value);
      setAdvancedFiltersDraft((prev) => ({ ...prev, [key]: ids }));
    },
    []
  );

  const advanceFiltersContent = (
    <View>
      <Text 
        className="text-2xl font-semibold"
        style={{ 
          color: colors.text,
          marginBottom: 16, 
        }}
      >
        Advance Filters
      </Text>

      <View className="gap-3">
        <View className="flex-row gap-4">
          <View className="flex-1">
            <Text className="text-[#5A5F66] text-lg mb-1.5">Channel Name</Text>
            <FilterDropdown
              label=""
              value={toStringIds(advancedFiltersDraft.channelIds)}
              options={channelFilterOptions}
              onChange={(value) => updateDraftMultiSelect("channelIds", value)}
              placeholder="Select Channel"
              multiple
            />
          </View>
          <View className="flex-1">
            <Text className="text-[#5A5F66] text-lg mb-1.5">Brand</Text>
            <FilterDropdown
              label=""
              value={toStringIds(advancedFiltersDraft.brandIds)}
              options={brandFilterOptions}
              onChange={(value) => updateDraftMultiSelect("brandIds", value)}
              placeholder="Select Brand"
              multiple
            />
          </View>
        </View>

        <View className="flex-row gap-4">
          <View className="flex-1">
            <Text className="text-[#5A5F66] text-lg mb-1.5">Supplier</Text>
            <FilterDropdown
              label=""
              value={toStringIds(advancedFiltersDraft.supplierIds)}
              options={supplierFilterOptions}
              onChange={(value) => updateDraftMultiSelect("supplierIds", value)}
              placeholder="Select Supplier"
              multiple
            />
          </View>
          <View className="flex-1">
            <Text className="text-[#5A5F66] text-lg mb-1.5">Category</Text>
            <FilterDropdown
              label=""
              value={toStringIds(advancedFiltersDraft.categoryIds)}
              options={categoryFilterOptions}
              onChange={(value) => updateDraftMultiSelect("categoryIds", value)}
              placeholder="Select Category"
              multiple
            />
          </View>
        </View>

        <View className="flex-row gap-4">
          <View className="flex-1">
            <Text className="text-[#5A5F66] text-lg mb-1.5">Zone</Text>
            <TextInput
              className="bg-white border border-gray-200 rounded-xl px-3 py-3 text-lg shadow-sm"
              placeholder="Search Zone"
              placeholderTextColor={colors.textTertiary}
              value={advancedFiltersDraft.searchZone}
              onChangeText={(value) =>
                setAdvancedFiltersDraft((prev) => ({ ...prev, searchZone: value }))
              }
            />
          </View>
          <View className="flex-1">
            <Text className="text-[#5A5F66] text-lg mb-1.5">Aisle</Text>
            <TextInput
              className="bg-white border border-gray-200 rounded-xl px-3 py-3 text-lg shadow-sm"
              placeholder="Search Aisle"
              placeholderTextColor={colors.textTertiary}
              value={advancedFiltersDraft.searchAisle}
              onChangeText={(value) =>
                setAdvancedFiltersDraft((prev) => ({ ...prev, searchAisle: value }))
              }
            />
          </View>
        </View>

        <View>
          <Text className="text-[#5A5F66] text-lg mb-1.5">Bin</Text>
          <TextInput
            className="bg-white border border-gray-200 rounded-xl px-3 py-3 text-lg shadow-sm"
            placeholder="Search by Bin"
            placeholderTextColor={colors.textTertiary}
            value={advancedFiltersDraft.searchBin}
            onChangeText={(value) =>
              setAdvancedFiltersDraft((prev) => ({ ...prev, searchBin: value }))
            }
          />
        </View>

        <View>
          <Text className="text-[#5A5F66] text-lg mb-1.5">Stock Type</Text>
          <FilterDropdown
            label=""
            value={advancedFiltersDraft.stockType || null}
            options={STOCK_TYPE_OPTIONS}
            onChange={(value) =>
              setAdvancedFiltersDraft((prev) => ({
                ...prev,
                stockType:
                  typeof value === "string" &&
                  (value === "damaged" || value === "out_of_stock")
                    ? value
                    : "",
              }))
            }
            placeholder="Select Stock Type"
          />
        </View>
      </View>

      <View className="flex-row justify-end mt-4 mb-2 gap-2">
        <Pressable
          className="rounded-lg items-center justify-center"
          style={{ width: "49%", height: buttonSize.md.height, backgroundColor: colors.backgroundSecondary, borderRadius: buttonSize.md.borderRadius }}
          onPress={clearAdvancedFilters}
        >
          <Text className="font-medium" style={{ color: colors.textMedium }}>Clear Filter</Text>
        </Pressable>
        <Pressable
          className="rounded-lg items-center justify-center"
          style={{ width: "49%", height: buttonSize.md.height, backgroundColor: colors.primary, borderRadius: buttonSize.md.borderRadius }}
          onPress={applyAdvancedFilters}
        >
          <Text className="text-white font-medium">Apply</Text>
        </Pressable>
      </View>
    </View>
  );

  const { setConfig: setBulkEditConfig, setSelection: setBulkEditSelection } = useBulkEditContext();

  useEffect(() => {
    setBulkEditConfig({
      label: "Bulk Edit Stock",
      onPress: handleBulkEditOpen,
    });
    return () => setBulkEditConfig(null);
  }, [handleBulkEditOpen, setBulkEditConfig]);

  const handleSelectionChange = useCallback(
    (keys: string[], rows: StockView[]) => {
      setSelectedRowKeys(keys);
      setBulkEditSelection(rows);
    },
    [setBulkEditSelection]
  );

  const dataTableFilterValues = useMemo<Record<string, string | string[] | null>>(
    () => ({
      productStatus: productStatusValues.length > 0 ? productStatusValues : null,
    }),
    [productStatusValues]
  );

  return (
    <View className="flex-1 bg-[#F7F7F9]">
      <PageHeader title="Inventory & Stock" showBack={false} />

      {!filtersReady ? (
        <View style={{ flex: 1, padding: 16 }}>
          {/* Skeleton search bar */}
          <View style={{ flexDirection: "row", gap: 8, marginBottom: 12 }}>
            <View style={{ flex: 1, height: buttonSize.lg.height, backgroundColor: colors.background, borderRadius: buttonSize.md.borderRadius, borderWidth: 1, borderColor: colors.border }} />
            <View style={{ width: 100, height: buttonSize.lg.height, backgroundColor: colors.background, borderRadius: buttonSize.md.borderRadius, borderWidth: 1, borderColor: colors.border }} />
          </View>
          {/* Skeleton table */}
          <View style={{ flex: 1, backgroundColor: colors.background, borderRadius: 12, borderWidth: 1, borderColor: colors.border, overflow: "hidden" }}>
            {/* Header row */}
            <View style={{ flexDirection: "row", borderBottomWidth: 1, borderBottomColor: colors.border, paddingVertical: 14, paddingHorizontal: 12 }}>
              {[120, 80, 60, 100, 60, 60, 60].map((w, i) => (
                <View key={i} style={{ width: w, height: 14, backgroundColor: colors.backgroundSecondary, borderRadius: radius.sm, marginHorizontal: 8 }} />
              ))}
            </View>
            {/* Data rows */}
            {Array.from({ length: 10 }).map((_, i) => (
              <View key={i} style={{ flexDirection: "row", borderBottomWidth: 1, borderBottomColor: colors.backgroundLight, paddingVertical: 18, paddingHorizontal: 12 }}>
                {[120, 80, 60, 100, 60, 60, 60].map((w, j) => (
                  <View key={j} style={{ width: w, height: 12, backgroundColor: i % 2 === 0 ? colors.backgroundLight : colors.backgroundSecondary, borderRadius: radius.sm, marginHorizontal: 8 }} />
                ))}
              </View>
            ))}
          </View>
          {/* Skeleton pagination */}
          <View style={{ flexDirection: "row", justifyContent: "center", alignItems: "center", marginTop: 12, gap: 8 }}>
            <View style={{ width: 80, height: buttonSize.md.height, backgroundColor: colors.backgroundSecondary, borderRadius: radius.md }} />
            <View style={{ width: buttonSize.md.height, height: buttonSize.md.height, backgroundColor: colors.border, borderRadius: radius.md }} />
            <View style={{ width: 80, height: buttonSize.md.height, backgroundColor: colors.backgroundSecondary, borderRadius: radius.md }} />
          </View>
        </View>
      ) : (
        <>
          {appliedFilters.length > 0 && (
            <View className="px-5 pt-3 pb-2 bg-[#F7F7F9] border-b border-gray-100">
              <Text className="text-base font-semibold text-gray-500 mb-2 uppercase">Filters Applied</Text>
              <View className="flex-row flex-wrap gap-2">
                {appliedFilters.map((item) => (
                  <View key={`${item.label}-${item.value}`} className="px-3 py-1.5 rounded bg-gray-100">
                    <Text className="text-base text-gray-700">
                      <Text className="font-semibold">{item.label}:</Text> {item.value}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          <DataTable<StockView>
            data={stocks}
            columns={columns}
            keyExtractor={(item) => item.id}
            searchable
            searchPlaceholder="Search stocks..."
            searchHint="Search by Product Name, SKU/UPC"
            defaultSearchQuery={searchText}
            searchQueryValue={searchText}
            onSearchQueryChange={handleSearchQueryChange}
            filters={filters}
            filterValues={dataTableFilterValues}
            onFiltersChange={handleTableFiltersChange}
            filtersInSettingsModal
            columnSelector
            toolbarButtonStyle="shopping-cart"
            settingsModalExtras={advanceFiltersContent}
            hideSettingsModalFooter
            onSettingsModalOpen={handleSettingsModalOpen}
            bulkActions
            bulkActionText="Bulk Edit Stock"
            bulkActionInActionRow
            bulkActionInSidebar
            onBulkActionPress={handleBulkEditOpen}
            selectedRowKeys={selectedRowKeys}
            onSelectionChange={handleSelectionChange}
            isLoading={isLoading}
            isStreaming={isStreaming}
            onRefresh={refresh}
            emptyIcon="cube-outline"
            emptyText="No stock items found"
            totalCount={count}
            paginationMode="client"
            pageSize={tablePageSize}
            onPageChange={handleTablePageChange}
            onRenderPerf={handleDataTableRenderPerf}
            horizontalScroll
            minWidth={contentWidth}
          />
        </>
      )}

      <CenteredModal
        visible={singleEditModalVisible}
        onClose={closeSingleEditModal}
        size="md"
        showCloseButton={false}
        scrollable={false}
        contentPadding={false}
        header={
          <View className="flex-row items-start justify-between flex-1">
            <View className="flex-1">
              <Text style={{ fontSize: modalContent.titleFontSize + 4, fontWeight: modalContent.titleFontWeight, color: modalContent.titleColor, marginBottom: 6 }}>
                Stock Edit
              </Text>
              <Text style={{ fontSize: modalContent.labelFontSize, color: modalContent.labelColor, marginTop: 4 }} numberOfLines={1}>
                {singleEditProductName || "-"}
              </Text>
            </View>
            <Pressable
              onPress={closeSingleEditModal}
              disabled={singleEditSubmitting}
              className="p-1"
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="close" size={iconSize.lg} color={colors.textTertiary} />
            </Pressable>
          </View>
        }
        footer={
          <View className="flex-row justify-end gap-3">
            <Pressable
              className="px-6 rounded-lg items-center justify-center"
              onPress={closeSingleEditModal}
              disabled={singleEditSubmitting}
              style={{ height: buttonSize.md.height, minWidth: 90, backgroundColor: colors.background, borderWidth: 1, borderColor: colors.borderMedium, borderRadius: buttonSize.md.borderRadius }}
            >
              <Text className="text-base font-medium" style={{ color: colors.textMedium, textAlign: 'center' }}>Cancel</Text>
            </Pressable>
            <Pressable
              className="px-6 rounded-lg items-center justify-center"
              onPress={handleSingleEditSubmit}
              disabled={singleEditSubmitting || singleEditLoading}
              style={{ height: buttonSize.md.height, minWidth: 90, backgroundColor: colors.primary, borderRadius: buttonSize.md.borderRadius }}
            >
              {singleEditSubmitting ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <Text className="text-base font-medium" style={{ color: colors.textWhite, textAlign: 'center' }}>Save</Text>
              )}
            </Pressable>
          </View>
        }
      >
        {singleEditLoading ? (
              <View className="py-8 items-center justify-center">
                <ActivityIndicator size="large" color={colors.info} />
              </View>
            ) : (
              <ScrollView style={{ maxHeight: "68%" }} showsVerticalScrollIndicator={false}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View style={{ minWidth: 1500 }}>
                    <View className="flex-row items-center bg-gray-50 border-b border-gray-200 px-4 py-3" style={{ backgroundColor: modalContent.boxBackground, borderBottomColor: modalContent.boxBorderColor }}>
                      <View style={{ width: 220, paddingRight: 8 }}>
                        <Text style={{ fontSize: modalContent.labelFontSize, fontWeight: modalContent.valueFontWeight, color: modalContent.labelColor }}>Store Channels</Text>
                      </View>
                      <View style={{ width: 150, paddingRight: 8 }}>
                        <Text style={{ fontSize: modalContent.labelFontSize, fontWeight: modalContent.valueFontWeight, color: modalContent.labelColor }}>Available QTY</Text>
                      </View>
                      <View style={{ width: 145, paddingRight: 8 }}>
                        <Text style={{ fontSize: modalContent.labelFontSize, fontWeight: modalContent.valueFontWeight, color: modalContent.labelColor }}>On Hold Qty</Text>
                      </View>
                      <View style={{ width: 145, paddingRight: 8 }}>
                        <Text style={{ fontSize: modalContent.labelFontSize, fontWeight: modalContent.valueFontWeight, color: modalContent.labelColor }}>Damaged Qty</Text>
                      </View>
                      <View style={{ width: 145, paddingRight: 8 }}>
                        <Text style={{ fontSize: modalContent.labelFontSize, fontWeight: modalContent.valueFontWeight, color: modalContent.labelColor }}>Back Order Qty</Text>
                      </View>
                      <View style={{ width: 150, paddingRight: 8 }}>
                        <Text style={{ fontSize: modalContent.labelFontSize, fontWeight: modalContent.valueFontWeight, color: modalContent.labelColor }}>Coming Soon Qty</Text>
                      </View>
                      <View style={{ width: 195, paddingRight: 8 }}>
                        <Text style={{ fontSize: modalContent.labelFontSize, fontWeight: modalContent.valueFontWeight, color: modalContent.labelColor }}>Delivered Without Stock</Text>
                      </View>
                      <View style={{ width: 145, paddingRight: 8 }}>
                        <Text style={{ fontSize: modalContent.labelFontSize, fontWeight: modalContent.valueFontWeight, color: modalContent.labelColor }}>Minimum Qty</Text>
                      </View>
                      <View style={{ width: 145 }}>
                        <Text style={{ fontSize: modalContent.labelFontSize, fontWeight: modalContent.valueFontWeight, color: modalContent.labelColor }}>Maximum Qty</Text>
                      </View>
                    </View>

                    {singleEditRows.map((row, index) => {
                      const nextAvailable = parseQtyInput(singleEditMap[row.key]?.availableQty ?? "", row.availableQty);
                      const preview = distributeStock(
                        nextAvailable,
                        row.backOrderQty,
                        row.deliveredWithoutStockQty,
                        row.availableQty,
                        row.onHoldQty
                      );
                      const showPreview = row.backOrderQty > 0 || row.deliveredWithoutStockQty > 0;

                      return (
                        <View
                          key={row.key}
                          className="flex-row items-start px-4 py-3"
                          style={{
                            borderBottomWidth: index < singleEditRows.length - 1 ? 1 : 0,
                            borderBottomColor: colors.backgroundSecondary,
                            backgroundColor: index % 2 === 1 ? colors.backgroundLight : colors.background,
                          }}
                        >
                            <View style={{ width: 220, paddingRight: 8 }}>
                              <Text className="text-sm font-medium text-gray-800" numberOfLines={2}>
                                {row.channelName || "-"}
                              </Text>
                            </View>

                            <View style={{ width: 150, paddingRight: 8 }}>
                              <View
                                className="h-10 rounded border border-gray-200 flex-row items-center overflow-hidden"
                                style={singleEditSubmitting ? { backgroundColor: colors.backgroundSecondary, borderColor: colors.borderMedium } : { backgroundColor: colors.background }}
                              >
                                <TextInput
                                  className="flex-1 px-2"
                                  keyboardType="number-pad"
                                  value={singleEditMap[row.key]?.availableQty ?? String(row.availableQty)}
                                  onChangeText={(value) => updateSingleEditValue(row.key, "availableQty", value)}
                                  placeholder="Available QTY"
                                  placeholderTextColor={singleEditSubmitting ? "#B8BEC8" : colors.textTertiary}
                                  selectTextOnFocus
                                  style={[
                                    qtyInputTextStyle,
                                    singleEditSubmitting ? { color: colors.textTertiary } : null,
                                  ]}
                                  editable={!singleEditSubmitting}
                                />
                                <View className="h-full px-2 border-l border-gray-200 bg-gray-50 justify-center">
                                  <Text style={qtyUnitTextStyle}>Piece</Text>
                                </View>
                              </View>
                              {showPreview ? (
                                <Text className="text-sm text-gray-500 italic mt-1">
                                  New Value: <Text style={qtyValueTextStyle}>{preview.new_inhand_qty}</Text>
                                </Text>
                              ) : null}
                            </View>

                            <View style={{ width: 145, paddingRight: 8 }}>
                              <View className="h-10 rounded border border-gray-200 bg-gray-50 flex-row items-center justify-between px-2">
                                <Text style={qtyValueTextStyle}>{formatQty(row.onHoldQty)}</Text>
                                <Text style={qtyUnitTextStyle}>Piece</Text>
                              </View>
                              {showPreview ? (
                                <Text className="text-sm text-gray-500 italic mt-1">
                                  New Value: <Text style={qtyValueTextStyle}>{preview.new_onHold_qty}</Text>
                                </Text>
                              ) : null}
                            </View>

                            <View style={{ width: 145, paddingRight: 8 }}>
                              <View
                                className="h-10 rounded border border-gray-200 flex-row items-center overflow-hidden"
                                style={singleEditSubmitting ? { backgroundColor: colors.backgroundSecondary, borderColor: colors.borderMedium } : { backgroundColor: colors.background }}
                              >
                                <TextInput
                                  className="flex-1 px-2"
                                  keyboardType="number-pad"
                                  value={singleEditMap[row.key]?.damagedQty ?? String(row.damagedQty)}
                                  onChangeText={(value) => updateSingleEditValue(row.key, "damagedQty", value)}
                                  placeholder="Damaged"
                                  placeholderTextColor={singleEditSubmitting ? "#B8BEC8" : colors.textTertiary}
                                  selectTextOnFocus
                                  style={[
                                    qtyInputTextStyle,
                                    singleEditSubmitting ? { color: colors.textTertiary } : null,
                                  ]}
                                  editable={!singleEditSubmitting}
                                />
                                <View className="h-full px-2 border-l border-gray-200 bg-gray-50 justify-center">
                                  <Text style={qtyUnitTextStyle}>Piece</Text>
                                </View>
                              </View>
                            </View>

                            <View style={{ width: 145, paddingRight: 8 }}>
                              <View className="h-10 rounded border border-gray-200 bg-gray-50 flex-row items-center justify-between px-2">
                                <Text style={qtyValueTextStyle}>{formatQty(row.backOrderQty)}</Text>
                                <Text style={qtyUnitTextStyle}>Piece</Text>
                              </View>
                              {showPreview ? (
                                <Text className="text-sm text-gray-500 italic mt-1">
                                  New Value: <Text style={qtyValueTextStyle}>{preview.new_bo_qty}</Text>
                                </Text>
                              ) : null}
                            </View>

                            <View style={{ width: 150, paddingRight: 8 }}>
                              <View className="h-10 rounded border border-gray-200 bg-gray-50 flex-row items-center justify-between px-2">
                                <Text style={qtyValueTextStyle}>{formatQty(row.comingSoonQty)}</Text>
                                <Text style={qtyUnitTextStyle}>Piece</Text>
                              </View>
                            </View>

                            <View style={{ width: 195, paddingRight: 8 }}>
                              <View className="h-10 rounded border border-gray-200 bg-gray-50 flex-row items-center justify-between px-2">
                                <Text style={qtyValueTextStyle}>{formatQty(row.deliveredWithoutStockQty)}</Text>
                                <Text style={qtyUnitTextStyle}>Piece</Text>
                              </View>
                              {showPreview ? (
                                <Text className="text-sm text-gray-500 italic mt-1">
                                  New Value: <Text style={qtyValueTextStyle}>{preview.new_hold_free_shipment}</Text>
                                </Text>
                              ) : null}
                            </View>

                            <View style={{ width: 145, paddingRight: 8 }}>
                              <View
                                className="h-10 rounded border border-gray-200 flex-row items-center overflow-hidden"
                                style={singleEditSubmitting ? { backgroundColor: colors.backgroundSecondary, borderColor: colors.borderMedium } : { backgroundColor: colors.background }}
                              >
                                <TextInput
                                  className="flex-1 px-2"
                                  keyboardType="number-pad"
                                  value={singleEditMap[row.key]?.minQty ?? String(row.minQty)}
                                  onChangeText={(value) => updateSingleEditValue(row.key, "minQty", value)}
                                  placeholder="Minimum"
                                  placeholderTextColor={singleEditSubmitting ? "#B8BEC8" : colors.textTertiary}
                                  selectTextOnFocus
                                  style={[
                                    qtyInputTextStyle,
                                    singleEditSubmitting ? { color: colors.textTertiary } : null,
                                  ]}
                                  editable={!singleEditSubmitting}
                                />
                                <View className="h-full px-2 border-l border-gray-200 bg-gray-50 justify-center">
                                  <Text style={qtyUnitTextStyle}>Piece</Text>
                                </View>
                              </View>
                            </View>

                            <View style={{ width: 145 }}>
                              <View
                                className="h-10 rounded border border-gray-200 flex-row items-center overflow-hidden"
                                style={singleEditSubmitting ? { backgroundColor: colors.backgroundSecondary, borderColor: colors.borderMedium } : { backgroundColor: colors.background }}
                              >
                                <TextInput
                                  className="flex-1 px-2"
                                  keyboardType="number-pad"
                                  value={singleEditMap[row.key]?.maxQty ?? String(row.maxQty)}
                                  onChangeText={(value) => updateSingleEditValue(row.key, "maxQty", value)}
                                  placeholder="Maximum"
                                  placeholderTextColor={singleEditSubmitting ? "#B8BEC8" : colors.textTertiary}
                                  selectTextOnFocus
                                  style={[
                                    qtyInputTextStyle,
                                    singleEditSubmitting ? { color: colors.textTertiary } : null,
                                  ]}
                                  editable={!singleEditSubmitting}
                                />
                                <View className="h-full px-2 border-l border-gray-200 bg-gray-50 justify-center">
                                  <Text style={qtyUnitTextStyle}>Piece</Text>
                                </View>
                              </View>
                            </View>
                        </View>
                      );
                    })}
                  </View>
                </ScrollView>
              </ScrollView>
            )}
      </CenteredModal>

      <CenteredModal
        visible={bulkModalVisible}
        onClose={() => setBulkModalVisible(false)}
        size="md"
        showCloseButton={false}
        scrollable={false}
        contentPadding={false}
        header={
          <View className="flex-row items-start justify-between flex-1">
            <View className="flex-1">
              <Text style={{ fontSize: modalContent.titleFontSize + 4, fontWeight: modalContent.titleFontWeight, color: modalContent.titleColor, marginBottom: 6 }}>
                    Bulk Edit Stock
                  </Text>
                  <Text style={{ fontSize: modalContent.labelFontSize, color: modalContent.labelColor, marginTop: 4 }}>
                    Please note that stock changes on this screen apply to unit: PIECE.
                  </Text>
                  <Text style={{ fontSize: modalContent.labelFontSize, color: modalContent.labelColor, marginTop: 2 }}>
                Channel: {bulkRows[0]?.channelName || "-"} | Selected: {bulkRows.length}
              </Text>
            </View>
            <Pressable 
              onPress={() => setBulkModalVisible(false)}
              className="p-1"
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="close" size={iconSize.lg} color={colors.textTertiary} />
            </Pressable>
          </View>
        }
        footer={
          <View className="flex-row justify-end gap-3">
            <Pressable
              className="px-6 rounded-lg items-center justify-center"
              onPress={() => setBulkModalVisible(false)}
              disabled={bulkSubmitting}
              style={{ height: buttonSize.md.height, minWidth: 90, backgroundColor: colors.background, borderWidth: 1, borderColor: colors.borderMedium, borderRadius: buttonSize.md.borderRadius }}
            >
              <Text className="text-base font-medium" style={{ color: colors.textMedium, textAlign: 'center' }}>Cancel</Text>
            </Pressable>
            <Pressable
              className="px-6 rounded-lg items-center justify-center"
              onPress={handleBulkEditSubmit}
              disabled={bulkSubmitting}
              style={{ height: buttonSize.md.height, minWidth: 90, backgroundColor: colors.primary, borderRadius: buttonSize.md.borderRadius }}
            >
              {bulkSubmitting ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <Text className="text-base font-medium" style={{ color: colors.textWhite, textAlign: 'center' }}>Update</Text>
              )}
            </Pressable>
          </View>
        }
      >
        {/* Table Content */}
            <ScrollView style={{ maxHeight: 400 }} showsVerticalScrollIndicator={false}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={{ minWidth: 1050 }}>
                  {/* Table Header */}
                  <View className="flex-row items-center border-b px-4 py-3" style={{ backgroundColor: modalContent.boxBackground, borderBottomColor: modalContent.boxBorderColor }}>
                    <View style={{ width: 180 }}>
                      <Text style={{ fontSize: modalContent.labelFontSize, fontWeight: modalContent.valueFontWeight, color: modalContent.labelColor }}>Products</Text>
                    </View>
                    <View style={{ width: 140 }}>
                      <Text style={{ fontSize: modalContent.labelFontSize, fontWeight: modalContent.valueFontWeight, color: modalContent.labelColor }}>Available Qty</Text>
                    </View>
                    <View style={{ width: 140 }}>
                      <Text style={{ fontSize: modalContent.labelFontSize, fontWeight: modalContent.valueFontWeight, color: modalContent.labelColor }}>Damaged Qty</Text>
                    </View>
                    <View style={{ width: 130 }}>
                      <Text style={{ fontSize: modalContent.labelFontSize, fontWeight: modalContent.valueFontWeight, color: modalContent.labelColor }}>On Hold Qty</Text>
                    </View>
                    <View style={{ width: 140 }}>
                      <Text style={{ fontSize: modalContent.labelFontSize, fontWeight: modalContent.valueFontWeight, color: modalContent.labelColor }}>Back Order Qty</Text>
                    </View>
                    <View style={{ width: 180 }}>
                      <Text style={{ fontSize: modalContent.labelFontSize, fontWeight: modalContent.valueFontWeight, color: modalContent.labelColor }}>Delivered Without Stock</Text>
                    </View>
                    <View style={{ width: 120 }}>
                      <Text style={{ fontSize: modalContent.labelFontSize, fontWeight: modalContent.valueFontWeight, color: modalContent.labelColor }}>Channel Name</Text>
                    </View>
                  </View>

                  {/* Table Rows */}
                  {bulkRows.map((row, index) => {
                    const preview = distributeStock(
                      parseQtyInput(bulkEditMap[row.id]?.availableQty ?? "", row.availableQty ?? 0),
                      row.backOrderQty ?? 0,
                      row.deliveredWithoutStockQty ?? 0,
                      row.availableQty ?? 0,
                      row.onHoldQty ?? 0
                    );
                    const showPreview = (row.backOrderQty ?? 0) > 0 || (row.deliveredWithoutStockQty ?? 0) > 0;

                    return (
                      <View
                        key={row.id}
                        className="flex-row items-center px-4 py-3"
                        style={{ 
                          borderBottomWidth: index < bulkRows.length - 1 ? 1 : 0, 
                          borderBottomColor: colors.backgroundSecondary,
                          backgroundColor: index % 2 === 1 ? colors.backgroundLight : colors.background
                        }}
                      >
                        {/* Product Name */}
                        <View style={{ width: 180 }}>
                          <Text className="text-base font-medium" style={{ color: colors.textDark }} numberOfLines={1}>
                            {row.productName || "-"}
                          </Text>
                          <Text className="text-sm" style={{ color: colors.textTertiary, marginTop: 2 }} numberOfLines={1}>
                            {row.sku || "-"}/{row.upc || "-"}
                          </Text>
                        </View>

                        {/* Available Qty - Editable */}
                        <View style={{ width: 140 }}>
                          <View className="flex-row items-center">
                            <View style={{ 
                              height: buttonSize.md.height, 
                              width: 70, 
                              borderWidth: 1, 
                              borderColor: colors.border, 
                              borderRadius: radius.sm,
                              backgroundColor: colors.background,
                              justifyContent: 'center',
                            }}>
                              <TextInput
                                keyboardType="number-pad"
                                value={bulkEditMap[row.id]?.availableQty ?? String(row.availableQty ?? 0)}
                                onChangeText={(value) => updateBulkValue(row.id, "availableQty", value)}
                                placeholder="0"
                                placeholderTextColor={colors.borderMedium}
                                selectTextOnFocus
                                style={{ 
                                  fontSize: 16, 
                                  color: colors.textDark, 
                                  textAlign: 'center',
                                  paddingHorizontal: 8,
                                }}
                              />
                            </View>
                            <Text className="text-sm" style={{ color: colors.textTertiary, marginLeft: 8 }}>Piece</Text>
                          </View>
                          {showPreview && (
                            <Text className="text-sm" style={{ color: colors.textSecondary, fontStyle: 'italic', marginTop: 4 }}>
                              New: {preview.new_inhand_qty}
                            </Text>
                          )}
                        </View>

                        {/* Damaged Qty - Editable */}
                        <View style={{ width: 140 }}>
                          <View className="flex-row items-center">
                            <View style={{ 
                              height: buttonSize.md.height, 
                              width: 70, 
                              borderWidth: 1, 
                              borderColor: colors.border, 
                              borderRadius: radius.sm,
                              backgroundColor: colors.background,
                              justifyContent: 'center',
                            }}>
                              <TextInput
                                keyboardType="number-pad"
                                value={bulkEditMap[row.id]?.damagedQty ?? String(row.damagedQty ?? 0)}
                                onChangeText={(value) => updateBulkValue(row.id, "damagedQty", value)}
                                placeholder="0"
                                placeholderTextColor={colors.borderMedium}
                                selectTextOnFocus
                                style={{ 
                                  fontSize: 16, 
                                  color: colors.textDark, 
                                  textAlign: 'center',
                                  paddingHorizontal: 8,
                                }}
                              />
                            </View>
                            <Text className="text-sm" style={{ color: colors.textTertiary, marginLeft: 8 }}>Piece</Text>
                          </View>
                        </View>

                        {/* On Hold Qty - Read Only */}
                        <View style={{ width: 130 }}>
                          <View className="flex-row items-center">
                            <View style={{ 
                              height: buttonSize.md.height, 
                              width: 70, 
                              borderWidth: 1, 
                              borderColor: colors.border, 
                              borderRadius: radius.sm,
                              backgroundColor: colors.backgroundLight,
                              justifyContent: 'center',
                              alignItems: 'center',
                            }}>
                              <Text className="text-base" style={{ color: colors.textSecondary }}>
                                {row.onHoldQty ?? 0}
                              </Text>
                            </View>
                            <Text className="text-sm" style={{ color: colors.textTertiary, marginLeft: 8 }}>Piece</Text>
                          </View>
                          {showPreview && (
                            <Text className="text-sm" style={{ color: colors.textSecondary, fontStyle: 'italic', marginTop: 4 }}>
                              New: {preview.new_onHold_qty}
                            </Text>
                          )}
                        </View>

                        {/* Back Order Qty - Read Only */}
                        <View style={{ width: 140 }}>
                          <View className="flex-row items-center">
                            <View style={{ 
                              height: buttonSize.md.height, 
                              width: 70, 
                              borderWidth: 1, 
                              borderColor: colors.border, 
                              borderRadius: radius.sm,
                              backgroundColor: colors.backgroundLight,
                              justifyContent: 'center',
                              alignItems: 'center',
                            }}>
                              <Text className="text-base" style={{ color: colors.textSecondary }}>
                                {row.backOrderQty ?? 0}
                              </Text>
                            </View>
                            <Text className="text-sm" style={{ color: colors.textTertiary, marginLeft: 8 }}>Piece</Text>
                          </View>
                          {showPreview && (
                            <Text className="text-sm" style={{ color: colors.textSecondary, fontStyle: 'italic', marginTop: 4 }}>
                              New: {preview.new_bo_qty}
                            </Text>
                          )}
                        </View>

                        {/* Delivered Without Stock - Read Only */}
                        <View style={{ width: 180 }}>
                          <View className="flex-row items-center">
                            <View style={{ 
                              height: buttonSize.md.height, 
                              width: 70, 
                              borderWidth: 1, 
                              borderColor: colors.border, 
                              borderRadius: radius.sm,
                              backgroundColor: colors.backgroundLight,
                              justifyContent: 'center',
                              alignItems: 'center',
                            }}>
                              <Text className="text-base" style={{ color: colors.textSecondary }}>
                                {row.deliveredWithoutStockQty ?? 0}
                              </Text>
                            </View>
                            <Text className="text-sm" style={{ color: colors.textTertiary, marginLeft: 8 }}>Piece</Text>
                          </View>
                          {showPreview && (
                            <Text className="text-sm" style={{ color: colors.textSecondary, fontStyle: 'italic', marginTop: 4 }}>
                              New: {preview.new_hold_free_shipment}
                            </Text>
                          )}
                        </View>

                        {/* Channel Name */}
                        <View style={{ width: 120 }}>
                          <Text className="text-base" style={{ color: colors.textDark }} numberOfLines={1}>
                            {row.channelName || "-"}
                          </Text>
                        </View>
                      </View>
                    );
                  })}
                </View>
              </ScrollView>
            </ScrollView>
      </CenteredModal>

      <AddProductPanelController
        ref={addProductPanelRef}
        onVisibleStateChange={(visible) => {
          if (!visible) setShowAddProductPanel(false);
        }}
        onSaveSuccess={refresh}
      />
    </View>
  );
}
