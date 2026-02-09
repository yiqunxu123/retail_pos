/**
 * Stock Alerts Screen
 * Uses the unified DataTable component
 */

import { Text, View } from "react-native";
import { ColumnDefinition, DataTable, FilterDefinition, PageHeader } from "../../components";
import { StockAlert } from "../../types";

// ============================================================================
// Sample Data
// ============================================================================

const SAMPLE_ALERTS: StockAlert[] = [
  { id: "1", productName: "Energy Drink XL", skuUpc: "QB-101 / 123456789", channelName: "Primary", categoryName: "Beverages", availableQty: 2, backOrderQty: 10, totalQty: 12, minQty: 20, maxQty: 100 },
  { id: "2", productName: "Wireless Mouse", skuUpc: "QB-102 / 987654321", channelName: "Primary", categoryName: "Electronics", availableQty: 0, backOrderQty: 5, totalQty: 5, minQty: 10, maxQty: 50 },
  { id: "3", productName: "Snack Pack Mix", skuUpc: "QB-103 / 456789123", channelName: "Secondary", categoryName: "Snacks", availableQty: 5, backOrderQty: 0, totalQty: 5, minQty: 15, maxQty: 75 },
];

// ============================================================================
// Main Component
// ============================================================================

export default function StockAlertsScreen() {
  // Column config
  const columns: ColumnDefinition<StockAlert>[] = [
    {
      key: "productName",
      title: "Product Name",
      width: "flex",
      visible: true,
      hideable: false,
      render: (item) => <Text className="text-gray-800">{item.productName}</Text>,
    },
    {
      key: "skuUpc",
      title: "SKU/UPC",
      width: 140,
      visible: true,
      render: (item) => <Text className="text-gray-600">{item.skuUpc}</Text>,
    },
    {
      key: "channelName",
      title: "Channel Name",
      width: 110,
      visible: true,
      render: (item) => <Text className="text-gray-600">{item.channelName}</Text>,
    },
    {
      key: "categoryName",
      title: "Category Name",
      width: 120,
      visible: true,
      render: (item) => <Text className="text-gray-600">{item.categoryName}</Text>,
    },
    {
      key: "availableQty",
      title: "Available Qty",
      width: 100,
      align: "center",
      visible: true,
      render: (item) => {
        const isCritical = item.availableQty === 0;
        const isBelowMin = item.availableQty < item.minQty;
        const colorClass = isCritical ? "text-red-600" : isBelowMin ? "text-orange-600" : "text-gray-800";
        return <Text className={`font-medium ${colorClass}`}>{item.availableQty}</Text>;
      },
    },
    {
      key: "backOrderQty",
      title: "Back Order Qty",
      width: 100,
      align: "center",
      visible: true,
      render: (item) => <Text className="text-gray-800">{item.backOrderQty}</Text>,
    },
    {
      key: "totalQty",
      title: "Total Qty",
      width: 80,
      align: "center",
      visible: true,
      render: (item) => <Text className="text-gray-800">{item.totalQty}</Text>,
    },
    {
      key: "minQty",
      title: "Min Qty",
      width: 80,
      align: "center",
      visible: true,
      render: (item) => <Text className="text-blue-600">{item.minQty}</Text>,
    },
    {
      key: "maxQty",
      title: "Max Qty",
      width: 80,
      align: "center",
      visible: true,
      render: (item) => <Text className="text-blue-600">{item.maxQty}</Text>,
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

  const handleSearch = (item: StockAlert, query: string) => {
    const q = query.toLowerCase();
    return (
      item.productName.toLowerCase().includes(q) ||
      item.skuUpc.toLowerCase().includes(q)
    );
  };

  const handleFilter = (item: StockAlert, filters: Record<string, string | null>) => {
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
  };

  return (
    <View className="flex-1 bg-gray-50">
      <PageHeader title="Stock Alerts" />

      <DataTable<StockAlert>
        data={SAMPLE_ALERTS}
        columns={columns}
        keyExtractor={(item) => item.id}
        searchable
        searchPlaceholder="Search alerts..."
        searchHint="Search by Product Name, SKU/UPC"
        onSearch={handleSearch}
        filters={filters}
        onFilter={handleFilter}
        columnSelector
        addButton
        addButtonText="Create Purchase Order"
        onAddPress={() => {}}
        emptyIcon="cloud-offline-outline"
        emptyText="No Stock Alerts Found"
        totalCount={SAMPLE_ALERTS.length}
      />
    </View>
  );
}
