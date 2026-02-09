/**
 * Stocks Screen
 * 
 * Displays inventory stock levels with real-time sync from PowerSync.
 * Uses the unified DataTable component.
 */

import { Ionicons } from "@expo/vector-icons";
import { Pressable, Text, View } from "react-native";
import { ColumnDefinition, DataTable, FilterDefinition, PageHeader } from "../../components";
import { StockView, useStocks } from "../../utils/powersync/hooks";

// ============================================================================
// Helper Components
// ============================================================================

function ActionButton({
  icon,
  iconColor,
  bgColor,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  bgColor: string;
  onPress?: () => void;
}) {
  return (
    <Pressable className={`${bgColor} p-2 rounded-lg`} onPress={onPress}>
      <Ionicons name={icon} size={14} color={iconColor} />
    </Pressable>
  );
}

const formatCurrency = (value: number) =>
  value > 0 ? `$${value.toFixed(2)}` : "-";

// ============================================================================
// Main Component
// ============================================================================

export default function StocksScreen() {
  const { stocks, isLoading, isStreaming, refresh, count } = useStocks();

  // Column config
  const columns: ColumnDefinition<StockView>[] = [
    {
      key: "productName",
      title: "Product Name",
      width: "flex",
      visible: true,
      hideable: false,
      render: (item) => (
        <View className="flex-1 pr-2">
          <Text className="text-gray-800 font-medium" numberOfLines={2}>
            {item.productName || "-"}
          </Text>
          {item.bin && (
            <Text className="text-gray-500 text-xs">Bin: {item.bin}</Text>
          )}
        </View>
      ),
    },
    {
      key: "sku",
      title: "SKU/UPC",
      width: 120,
      visible: true,
      render: (item) => (
        <View>
          <Text className="text-gray-800 text-sm">{item.sku || "-"}</Text>
          <Text className="text-gray-500 text-xs">{item.upc || "-"}</Text>
        </View>
      ),
    },
    {
      key: "cost",
      title: "Cost",
      width: 100,
      align: "center",
      visible: true,
      render: (item) => (
        <Text className="text-gray-700">{formatCurrency(item.costPrice)}</Text>
      ),
    },
    {
      key: "price",
      title: "Price",
      width: 100,
      align: "center",
      visible: true,
      render: (item) => (
        <Text className="text-green-600 font-medium">
          {formatCurrency(item.salePrice)}
        </Text>
      ),
    },
    {
      key: "qty",
      title: "Qty",
      width: 80,
      align: "center",
      visible: true,
      render: (item) => {
        const isInStock = item.availableQty > 0;
        return (
          <Text
            className={`font-medium ${
              !isInStock ? "text-red-500" : "text-green-600"
            }`}
          >
            {item.availableQty}
          </Text>
        );
      },
    },
    {
      key: "alert",
      title: "Alert",
      width: 80,
      align: "center",
      visible: true,
      render: (item) => {
        if (item.availableQty <= 0) {
          return <Text className="text-red-500 font-medium text-xs">Out of Stock</Text>;
        }
        if (item.availableQty <= 5) {
          return <Text className="text-orange-500 font-medium text-xs">Low</Text>;
        }
        return <Text className="text-green-500 text-xs">OK</Text>;
      },
    },
    {
      key: "actions",
      title: "Actions",
      width: 120,
      align: "center",
      visible: true,
      render: (item) => (
        <View className="flex-row items-center justify-center gap-1">
          <ActionButton
            icon="pencil"
            iconColor="#3b82f6"
            bgColor="bg-blue-100"
            onPress={() => console.log("Edit", item.id)}
          />
          <ActionButton
            icon="eye"
            iconColor="#22c55e"
            bgColor="bg-green-100"
            onPress={() => console.log("View", item.id)}
          />
          <ActionButton
            icon="trash"
            iconColor="#ef4444"
            bgColor="bg-red-100"
            onPress={() => console.log("Delete", item.id)}
          />
        </View>
      ),
    },
  ];

  // Filters
  const filters: FilterDefinition[] = [
    {
      key: "stockLevel",
      placeholder: "Stock Level",
      width: 150,
      options: [
        { label: "All", value: "all" },
        { label: "In Stock", value: "in_stock" },
        { label: "Out of Stock", value: "out_of_stock" },
      ],
    },
  ];

  // Search logic
  const handleSearch = (item: StockView, query: string) => {
    const q = query.toLowerCase();
    return (
      item.productName.toLowerCase().includes(q) ||
      item.sku.toLowerCase().includes(q) ||
      item.upc.toLowerCase().includes(q)
    );
  };

  // Filter logic
  const handleFilter = (
    item: StockView,
    filters: Record<string, string | null>
  ) => {
    if (filters.stockLevel && filters.stockLevel !== "all") {
      if (filters.stockLevel === "in_stock" && item.availableQty <= 0)
        return false;
      if (filters.stockLevel === "out_of_stock" && item.availableQty > 0)
        return false;
    }
    return true;
  };

  return (
    <View className="flex-1 bg-gray-50">
      <PageHeader title="Stocks" />

      <DataTable<StockView>
        data={stocks}
        columns={columns}
        keyExtractor={(item) => item.id}
        searchable
        searchPlaceholder="Search stocks..."
        searchHint="Search by Product Name, SKU/UPC"
        onSearch={handleSearch}
        filters={filters}
        onFilter={handleFilter}
        columnSelector
        bulkActions
        isLoading={isLoading}
        isStreaming={isStreaming}
        onRefresh={refresh}
        emptyIcon="cube-outline"
        emptyText="No stock items found"
        totalCount={count}
      />
    </View>
  );
}
