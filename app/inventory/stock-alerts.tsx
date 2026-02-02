import { Ionicons } from "@expo/vector-icons";
import { useMemo, useState } from "react";
import {
  FlatList,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { FilterDropdown, PageHeader } from "../../components";
import { StockAlert } from "../../types";

// ============================================================================
// Constants
// ============================================================================

const CHANNEL_OPTIONS = [
  { label: "All Channels", value: "all" },
  { label: "Primary", value: "Primary" },
  { label: "Secondary", value: "Secondary" },
];

const CATEGORY_OPTIONS = [
  { label: "All Categories", value: "all" },
  { label: "Electronics", value: "Electronics" },
  { label: "Beverages", value: "Beverages" },
  { label: "Snacks", value: "Snacks" },
];

const STOCK_LEVEL_OPTIONS = [
  { label: "All", value: "all" },
  { label: "Below Min", value: "below_min" },
  { label: "Above Max", value: "above_max" },
  { label: "Critical (0)", value: "critical" },
];

// ============================================================================
// Sample Data
// ============================================================================

const SAMPLE_ALERTS: StockAlert[] = [
  { id: "1", productName: "Energy Drink XL", skuUpc: "QB-101 / 123456789", channelName: "Primary", categoryName: "Beverages", availableQty: 2, backOrderQty: 10, totalQty: 12, minQty: 20, maxQty: 100 },
  { id: "2", productName: "Wireless Mouse", skuUpc: "QB-102 / 987654321", channelName: "Primary", categoryName: "Electronics", availableQty: 0, backOrderQty: 5, totalQty: 5, minQty: 10, maxQty: 50 },
  { id: "3", productName: "Snack Pack Mix", skuUpc: "QB-103 / 456789123", channelName: "Secondary", categoryName: "Snacks", availableQty: 5, backOrderQty: 0, totalQty: 5, minQty: 15, maxQty: 75 },
];

// ============================================================================
// Reusable Components
// ============================================================================

function TableCheckbox() {
  return <View className="w-5 h-5 border border-gray-300 rounded" />;
}

function EmptyState() {
  return (
    <View className="py-16 items-center">
      <View className="w-24 h-24 bg-gray-100 rounded-full items-center justify-center mb-4">
        <Ionicons name="cloud-offline-outline" size={48} color="#d1d5db" />
      </View>
      <Text className="text-gray-400 text-lg">No Stock Alerts Found</Text>
    </View>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export default function StockAlertsScreen() {
  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState("");
  const [channelFilter, setChannelFilter] = useState<string | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  const [stockLevelFilter, setStockLevelFilter] = useState<string | null>(null);

  const [alerts] = useState<StockAlert[]>(SAMPLE_ALERTS);

  // Apply filters
  const filteredAlerts = useMemo(() => {
    let result = [...alerts];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (a) =>
          a.productName.toLowerCase().includes(query) ||
          a.skuUpc.toLowerCase().includes(query)
      );
    }

    // Channel filter
    if (channelFilter && channelFilter !== "all") {
      result = result.filter((a) => a.channelName === channelFilter);
    }

    // Category filter
    if (categoryFilter && categoryFilter !== "all") {
      result = result.filter((a) => a.categoryName === categoryFilter);
    }

    // Stock level filter
    if (stockLevelFilter && stockLevelFilter !== "all") {
      switch (stockLevelFilter) {
        case "below_min":
          result = result.filter((a) => a.availableQty < a.minQty);
          break;
        case "above_max":
          result = result.filter((a) => a.availableQty > a.maxQty);
          break;
        case "critical":
          result = result.filter((a) => a.availableQty === 0);
          break;
      }
    }

    return result;
  }, [alerts, searchQuery, channelFilter, categoryFilter, stockLevelFilter]);

  const renderAlertRow = ({ item }: { item: StockAlert }) => {
    const isCritical = item.availableQty === 0;
    const isBelowMin = item.availableQty < item.minQty;

    return (
      <Pressable className="flex-row items-center py-3 px-5 border-b border-gray-100 bg-white">
        <View className="w-8 mr-4">
          <TableCheckbox />
        </View>
        <Text className="w-44 text-gray-800">{item.productName}</Text>
        <Text className="w-36 text-gray-600">{item.skuUpc}</Text>
        <Text className="w-28 text-gray-600">{item.channelName}</Text>
        <Text className="w-32 text-gray-600">{item.categoryName}</Text>
        <Text className={`w-24 text-center font-medium ${isCritical ? "text-red-600" : isBelowMin ? "text-orange-600" : "text-gray-800"}`}>
          {item.availableQty}
        </Text>
        <Text className="w-24 text-gray-800 text-center">{item.backOrderQty}</Text>
        <Text className="w-20 text-gray-800 text-center">{item.totalQty}</Text>
        <Text className="w-20 text-blue-600 text-center">{item.minQty}</Text>
        <Text className="w-20 text-blue-600 text-center">{item.maxQty}</Text>
      </Pressable>
    );
  };

  return (
    <View className="flex-1 bg-gray-50">
      <PageHeader title="Stock Alerts" />

      {/* Content Card */}
      <View className="bg-white m-5 rounded-lg shadow-sm flex-1">
        {/* Card Header */}
        <View className="flex-row items-center justify-between px-5 py-4 border-b border-gray-100">
          <View className="flex-row items-center gap-2">
            <Text className="text-lg font-semibold text-gray-800">Stock Alerts ({filteredAlerts.length})</Text>
            <Ionicons name="information-circle-outline" size={18} color="#9ca3af" />
          </View>
          <Pressable className="bg-red-500 px-4 py-2.5 rounded-lg">
            <Text className="text-white font-medium">Create Purchase Order</Text>
          </Pressable>
        </View>

        {/* Search Section */}
        <View className="px-5 py-4 border-b border-gray-100">
          <Text className="text-gray-500 text-sm mb-2">Search by Product Name, SKU/UPC</Text>
          <View className="flex-row gap-4">
            <View className="flex-1">
              <TextInput
                className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-2"
                placeholder="Search alerts..."
                placeholderTextColor="#9ca3af"
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
            </View>
            <FilterDropdown
              label=""
              value={channelFilter}
              options={CHANNEL_OPTIONS}
              onChange={setChannelFilter}
              placeholder="Channel"
              width={130}
            />
            <FilterDropdown
              label=""
              value={categoryFilter}
              options={CATEGORY_OPTIONS}
              onChange={setCategoryFilter}
              placeholder="Category"
              width={140}
            />
            <FilterDropdown
              label=""
              value={stockLevelFilter}
              options={STOCK_LEVEL_OPTIONS}
              onChange={setStockLevelFilter}
              placeholder="Stock Level"
              width={130}
            />
          </View>
        </View>

        {/* Data Table */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-1">
          <View style={{ minWidth: 1000 }}>
            {/* Table Header */}
            <View className="flex-row bg-gray-50 py-3 px-5 border-b border-gray-200">
              <View className="w-8 mr-4">
                <TableCheckbox />
              </View>
              <Text className="w-44 text-gray-500 text-xs font-semibold uppercase">Product Name</Text>
              <Text className="w-36 text-gray-500 text-xs font-semibold uppercase">SKU/UPC</Text>
              <Text className="w-28 text-gray-500 text-xs font-semibold uppercase">Channel Name</Text>
              <Text className="w-32 text-gray-500 text-xs font-semibold uppercase">Category Name</Text>
              <Text className="w-24 text-gray-500 text-xs font-semibold uppercase text-center">Available Qty</Text>
              <Text className="w-24 text-gray-500 text-xs font-semibold uppercase text-center">Back Order Qty</Text>
              <Text className="w-20 text-gray-500 text-xs font-semibold uppercase text-center">Total Qty</Text>
              <Text className="w-20 text-gray-500 text-xs font-semibold uppercase text-center">Min Qty</Text>
              <Text className="w-20 text-gray-500 text-xs font-semibold uppercase text-center">Max Qty</Text>
            </View>

            {/* Table Body or Empty State */}
            {filteredAlerts.length > 0 ? (
              <FlatList
                data={filteredAlerts}
                keyExtractor={(item) => item.id}
                renderItem={renderAlertRow}
                showsVerticalScrollIndicator={false}
              />
            ) : (
              <EmptyState />
            )}
          </View>
        </ScrollView>

        {/* Pagination Controls */}
        <View className="px-5 py-4 border-t border-gray-100">
          <View className="flex-row items-center gap-2">
            <Text className="text-gray-600">20</Text>
            <Ionicons name="chevron-down" size={16} color="#9ca3af" />
          </View>
        </View>
      </View>
    </View>
  );
}
