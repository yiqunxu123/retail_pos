/**
 * Stocks Screen
 * 
 * Displays inventory stock levels with real-time sync from PowerSync.
 * Data source: stocks + products + unit_prices (joined)
 */

import { Ionicons } from "@expo/vector-icons";
import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  Text,
  TextInput,
  View,
} from "react-native";
import { FilterDropdown, PageHeader } from "../../components";
import { StockView, useStocks } from "../../utils/powersync/hooks";

// ============================================================================
// Constants
// ============================================================================

const STOCK_OPTIONS = [
  { label: "All", value: "all" },
  { label: "In Stock", value: "in_stock" },
  { label: "Out of Stock", value: "out_of_stock" },
  // Low Stock filter unavailable - DB does not have qty_alert field
];

// ============================================================================
// Reusable Components
// ============================================================================

function TableCheckbox() {
  return <View className="w-5 h-5 border border-gray-300 rounded" />;
}

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

// ============================================================================
// Helpers
// ============================================================================

const formatCurrency = (value: number) =>
  value > 0 ? `$${value.toFixed(2)}` : "-";

// ============================================================================
// Main Component
// ============================================================================

export default function StocksScreen() {
  // Data from PowerSync
  const { stocks, isLoading, isStreaming, refresh, count } = useStocks();
  const [refreshing, setRefreshing] = useState(false);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState("");
  const [stockFilter, setStockFilter] = useState<string | null>(null);

  // Pull to refresh
  const onRefresh = async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  };

  // Action handlers
  const handleEdit = (id: string) => console.log("Edit", id);
  const handleView = (id: string) => console.log("View", id);
  const handleDelete = (id: string) => console.log("Delete", id);

  // Apply filters
  const filteredStocks = useMemo(() => {
    let result = [...stocks];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (s) =>
          s.productName.toLowerCase().includes(query) ||
          s.sku.toLowerCase().includes(query) ||
          s.upc.toLowerCase().includes(query)
      );
    }

    // Stock level filter
    if (stockFilter && stockFilter !== "all") {
      switch (stockFilter) {
        case "in_stock":
          result = result.filter((s) => s.availableQty > 0);
          break;
        case "out_of_stock":
          result = result.filter((s) => s.availableQty === 0);
          break;
        // low_stock: DB does not have qty_alert field, cannot filter
      }
    }

    return result;
  }, [stocks, searchQuery, stockFilter]);

  // Build active filters display
  const activeFilters = [
    stockFilter && stockFilter !== "all" ? `Stock: ${stockFilter.replace("_", " ")}` : null,
  ].filter(Boolean) as string[];

  const renderStockRow = ({ item }: { item: StockView }) => {
    const isInStock = item.availableQty > 0;

    return (
      <View className="flex-row items-center py-3 px-5 border-b border-gray-100 bg-white">
        <View className="w-8 mr-4">
          <TableCheckbox />
        </View>
        <View className="flex-1 pr-2">
          <Text className="text-gray-800 font-medium" numberOfLines={2}>
            {item.productName || "-"}
          </Text>
          {item.bin && <Text className="text-gray-500 text-xs">Bin: {item.bin}</Text>}
        </View>
        <View className="w-28">
          <Text className="text-gray-800 text-sm">{item.sku || "-"}</Text>
          <Text className="text-gray-500 text-xs">{item.upc || "-"}</Text>
        </View>
        <View className="w-20 items-center">
          <Text className="text-gray-700">{formatCurrency(item.costPrice)}</Text>
        </View>
        <View className="w-20 items-center">
          <Text className="text-green-600 font-medium">{formatCurrency(item.salePrice)}</Text>
        </View>
        <Text
          className={`w-16 text-center font-medium ${
            !isInStock ? "text-red-500" : "text-green-600"
          }`}
        >
          {item.availableQty}
        </Text>
        <View className="w-16 items-center">
          {/* minQty: DB does not have qty_alert field */}
          <Text className="text-gray-400">-</Text>
        </View>
        <View className="w-24 flex-row items-center justify-center gap-1">
          <ActionButton
            icon="pencil"
            iconColor="#3b82f6"
            bgColor="bg-blue-100"
            onPress={() => handleEdit(item.id)}
          />
          <ActionButton
            icon="eye"
            iconColor="#22c55e"
            bgColor="bg-green-100"
            onPress={() => handleView(item.id)}
          />
          <ActionButton
            icon="trash"
            iconColor="#ef4444"
            bgColor="bg-red-100"
            onPress={() => handleDelete(item.id)}
          />
        </View>
      </View>
    );
  };

  // Loading state
  if (isLoading && stocks.length === 0) {
    return (
      <View className="flex-1 bg-gray-50">
        <PageHeader title="Stocks" />
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text className="mt-4 text-gray-600">Loading stocks...</Text>
        </View>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-50">
      <PageHeader title="Stocks" />

      {/* Toolbar */}
      <View className="bg-white px-5 py-4 border-b border-gray-200">
        {/* Action Buttons */}
        <View className="flex-row items-center gap-3 mb-4">
          <Pressable className="bg-red-500 px-4 py-2 rounded-lg flex-row items-center gap-2">
            <Text className="text-white font-medium">Bulk Actions</Text>
            <Ionicons name="chevron-down" size={16} color="white" />
          </Pressable>
          <Pressable className="bg-gray-100 px-4 py-2 rounded-lg flex-row items-center gap-2">
            <Ionicons name="grid" size={16} color="#374151" />
            <Text className="text-gray-700">Columns</Text>
          </Pressable>
          {isStreaming && (
            <View className="flex-row items-center gap-1 ml-2">
              <Text className="text-green-600 text-xs">● Live</Text>
            </View>
          )}
        </View>

        {/* Search & Filters */}
        <Text className="text-gray-500 text-sm mb-2">
          Search by Product Name, SKU/UPC
        </Text>
        <View className="flex-row gap-4">
          <View className="flex-1">
            <TextInput
              className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5"
              placeholder="Search stocks..."
              placeholderTextColor="#9ca3af"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
          <FilterDropdown
            label=""
            value={stockFilter}
            options={STOCK_OPTIONS}
            onChange={setStockFilter}
            placeholder="Stock Level"
            width={150}
          />
        </View>

        {/* Results count & active filters */}
        <View className="flex-row items-center mt-2">
          <Text className="text-gray-400 text-sm">
            {activeFilters.length > 0 ? `Filters: ${activeFilters.join(" | ")}` : "No filters"} 
            <Text className="text-gray-400"> ({filteredStocks.length} of {count} items)</Text>
          </Text>
        </View>
      </View>

      {/* Data Table */}
      <View className="flex-1">
        {/* Table Header */}
        <View className="flex-row bg-gray-50 py-3 px-5 border-b border-gray-200">
          <View className="w-8 mr-4">
            <TableCheckbox />
          </View>
          <Text className="flex-1 text-gray-500 text-xs font-semibold uppercase">Product Name</Text>
          <Text className="w-28 text-gray-500 text-xs font-semibold uppercase">SKU/UPC</Text>
          <Text className="w-20 text-gray-500 text-xs font-semibold uppercase text-center">Cost</Text>
          <Text className="w-20 text-gray-500 text-xs font-semibold uppercase text-center">Price</Text>
          <Text className="w-16 text-gray-500 text-xs font-semibold uppercase text-center">Qty</Text>
          <Text className="w-16 text-gray-500 text-xs font-semibold uppercase text-center">Alert</Text>
          <Text className="w-24 text-gray-500 text-xs font-semibold uppercase text-center">Actions</Text>
        </View>

        {/* Table Body */}
        <FlatList
          data={filteredStocks}
          keyExtractor={(item) => item.id}
          renderItem={renderStockRow}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListEmptyComponent={
            <View className="py-16 items-center">
              <Ionicons name="cube-outline" size={48} color="#d1d5db" />
              <Text className="text-gray-400 mt-2">No stock items found</Text>
            </View>
          }
        />
      </View>
    </View>
  );
}
