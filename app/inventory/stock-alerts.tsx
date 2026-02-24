/**
 * Stock Alerts Screen
 * Uses the unified DataTable component with PowerSync data
 * Shows products with available_qty = 0 (critical stock)
 */

import { useCallback, useEffect } from "react";
import { Alert, Text, View } from "react-native";
import { useBulkEditContext } from "../../contexts/BulkEditContext";
import { ColumnDefinition, DataTable, FilterDefinition, PageHeader } from "../../components";
import { useTableContentWidth } from "../../hooks/useTableContentWidth";
import { useStockAlerts } from "../../utils/powersync/hooks";
import type { StockAlertView } from "../../utils/powersync/hooks";

// ============================================================================
// Main Component
// ============================================================================

export default function StockAlertsScreen() {
  const contentWidth = useTableContentWidth();
  const { alerts, isLoading, refresh, count } = useStockAlerts();

  const columns: ColumnDefinition<StockAlertView>[] = [
    {
      key: "productName",
      title: "Product Name",
      width: "25%",
      visible: true,
      hideable: false,
      render: (item) => <Text className="text-[#1A1A1A] text-lg">{item.productName}</Text>,
    },
    {
      key: "skuUpc",
      title: "SKU/UPC",
      width: "14%",
      visible: true,
      render: (item) => <Text className="text-gray-600 text-lg">{item.skuUpc}</Text>,
    },
    {
      key: "channelName",
      title: "Channel Name",
      width: "12%",
      visible: true,
      render: (item) => <Text className="text-gray-600 text-lg">{item.channelName}</Text>,
    },
    {
      key: "categoryName",
      title: "Category Name",
      width: "12%",
      visible: true,
      render: (item) => <Text className="text-gray-600 text-lg">{item.categoryName}</Text>,
    },
    {
      key: "availableQty",
      title: "Available Qty",
      width: "10%",
      align: "center",
      visible: true,
      render: (item) => {
        const isCritical = item.availableQty === 0;
        const isBelowMin = item.availableQty < item.minQty;
        const colorClass = isCritical ? "text-red-600" : isBelowMin ? "text-orange-600" : "text-[#1A1A1A]";
        return <Text className={`font-bold text-lg ${colorClass}`}>{item.availableQty}</Text>;
      },
    },
    {
      key: "backOrderQty",
      title: "Back Order Qty",
      width: "10%",
      align: "center",
      visible: true,
      render: (item) => <Text className="text-[#1A1A1A] text-lg">{item.backOrderQty}</Text>,
    },
    {
      key: "totalQty",
      title: "Total Qty",
      width: "9%",
      align: "center",
      visible: true,
      render: (item) => <Text className="text-[#1A1A1A] text-lg">{item.totalQty}</Text>,
    },
    {
      key: "minQty",
      title: "Min Qty",
      width: "8%",
      align: "center",
      visible: true,
      render: (item) => <Text className="text-blue-600 text-lg font-bold">{item.minQty}</Text>,
    },
    {
      key: "maxQty",
      title: "Max Qty",
      width: "8%",
      align: "center",
      visible: true,
      render: (item) => <Text className="text-blue-600 text-lg font-bold">{item.maxQty}</Text>,
    },
  ];

  // Filters
  const filters: FilterDefinition[] = [
    {
      key: "channel",
      placeholder: "Channel",
      width: 130,
      options: [
        { label: "All Channels", value: "all" },
        { label: "Primary", value: "Primary" },
        { label: "Secondary", value: "Secondary" },
      ],
    },
    {
      key: "category",
      placeholder: "Category",
      width: 140,
      options: [
        { label: "All Categories", value: "all" },
        { label: "Electronics", value: "Electronics" },
        { label: "Beverages", value: "Beverages" },
        { label: "Snacks", value: "Snacks" },
      ],
    },
    {
      key: "stockLevel",
      placeholder: "Stock Level",
      width: 130,
      options: [
        { label: "All", value: "all" },
        { label: "Below Min", value: "below_min" },
        { label: "Above Max", value: "above_max" },
        { label: "Critical (0)", value: "critical" },
      ],
    },
  ];

  const handleSearch = useCallback((item: StockAlertView, query: string) => {
    const q = query.toLowerCase();
    return (
      item.productName.toLowerCase().includes(q) ||
      item.skuUpc.toLowerCase().includes(q)
    );
  }, []);

  const { setConfig: setBulkEditConfig, setSelection: setBulkEditSelection } = useBulkEditContext();

  const handleBulkAction = useCallback((rows: StockAlertView[]) => {
    if (rows.length === 0) {
      Alert.alert("Bulk Create PO", "Please select product(s) first.");
      return;
    }
    Alert.alert("Bulk Create PO", `Create Purchase Order for ${rows.length} selected product(s)? This feature is coming soon.`);
  }, []);

  useEffect(() => {
    setBulkEditConfig({ label: "Bulk Create PO", onPress: handleBulkAction });
    return () => setBulkEditConfig(null);
  }, [handleBulkAction, setBulkEditConfig]);

  const handleFilter = useCallback((item: StockAlertView, filters: Record<string, string | null>) => {
    if (filters.channel && filters.channel !== "all") {
      if (item.channelName !== filters.channel) return false;
    }
    if (filters.category && filters.category !== "all") {
      if (item.categoryName !== filters.category) return false;
    }
    if (filters.stockLevel && filters.stockLevel !== "all") {
      switch (filters.stockLevel) {
        case "below_min":
          if (item.availableQty >= item.minQty) return false;
          break;
        case "above_max":
          if (item.availableQty <= item.maxQty) return false;
          break;
        case "critical":
          if (item.availableQty !== 0) return false;
          break;
      }
    }
    return true;
  }, []);

  return (
    <View className="flex-1 bg-[#F7F7F9]">
      <PageHeader title="Stock Alerts" showBack={false} />

      <DataTable<StockAlertView>
        data={alerts}
        columns={columns}
        keyExtractor={(item) => item.id}
        searchable
        searchPlaceholder="Search alerts..."
        searchHint="Search by Product Name, SKU/UPC"
        onSearch={handleSearch}
        filters={filters}
        onFilter={handleFilter}
        filtersInSettingsModal
        bulkActions
        bulkActionText="Bulk Create PO"
        bulkActionInActionRow
        bulkActionInSidebar
        onBulkActionPress={handleBulkAction}
        onSelectionChange={(_, rows) => setBulkEditSelection(rows)}
        columnSelector
        toolbarButtonStyle="shopping-cart"
        onRefresh={refresh}
        isLoading={isLoading}
        horizontalScroll
        minWidth={contentWidth}
        addButton
        addButtonText="Create Purchase Order"
        onAddPress={() => {}}
        emptyIcon="cloud-offline-outline"
        emptyText="No Stock Alerts Found"
        totalCount={count}
      />
    </View>
  );
}
