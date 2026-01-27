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
import { Stock } from "../../types";

// ============================================================================
// Constants
// ============================================================================

const STATUS_OPTIONS = [
  { label: "Active", value: "active" },
  { label: "Inactive", value: "inactive" },
];

const STOCK_OPTIONS = [
  { label: "All Items", value: "all" },
  { label: "In Stock", value: "in_stock" },
  { label: "Out of Stock", value: "out_of_stock" },
  { label: "On Hold", value: "on_hold" },
  { label: "Low Stock (< 10)", value: "low_stock" },
];

const CHANNEL_OPTIONS = [
  { label: "Primary", value: "primary" },
  { label: "Secondary", value: "secondary" },
];

// ============================================================================
// Sample Data
// ============================================================================

const SAMPLE_STOCKS: Stock[] = [
  { id: "1", productName: "Wireless Bluetooth Headphones", netCostPrice: 45.00, onHold: 0, salePrice: 74.99, sku: "QB-3", upc: "097868128762", availableQty: 0 },
  { id: "2", productName: "USB-C Charging Cable 6ft", netCostPrice: 31.80, onHold: 0, salePrice: 39.80, sku: "QB-7", upc: "855765001362", availableQty: 0 },
  { id: "3", productName: "Portable Power Bank 10000mAh", netCostPrice: 40.00, onHold: 0, salePrice: 79.99, sku: "QB-2", upc: "097868125563", availableQty: 40 },
  { id: "4", productName: "Screen Protector iPhone 15", netCostPrice: 13.99, onHold: 1, salePrice: 23.00, sku: "QB-5", upc: "00076171939937", availableQty: 0 },
  { id: "5", productName: "Wireless Mouse Ergonomic", netCostPrice: 13.50, onHold: 1, salePrice: 25.00, sku: "QB-4", upc: "097868124467", availableQty: 99 },
  { id: "6", productName: "LED Desk Lamp Adjustable", netCostPrice: 13.99, onHold: 0, salePrice: 23.00, sku: "QB-6", upc: "00076171934635", availableQty: 12 },
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
  onPress: () => void;
}) {
  return (
    <Pressable className={`${bgColor} p-2 rounded-lg`} onPress={onPress}>
      <Ionicons name={icon} size={16} color={iconColor} />
    </Pressable>
  );
}

// ============================================================================
// Helper Functions
// ============================================================================

function formatCurrency(value: number): string {
  return `$${value.toFixed(2)}`;
}

// ============================================================================
// Main Component
// ============================================================================

export default function StocksScreen() {
  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | null>("active");
  const [stockFilter, setStockFilter] = useState<string | null>(null);
  const [channelFilter, setChannelFilter] = useState<string | null>("primary");

  const [stocks] = useState<Stock[]>(SAMPLE_STOCKS);

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

    // Stock filter
    if (stockFilter) {
      switch (stockFilter) {
        case "in_stock":
          result = result.filter((s) => s.availableQty > 0);
          break;
        case "out_of_stock":
          result = result.filter((s) => s.availableQty === 0);
          break;
        case "on_hold":
          result = result.filter((s) => s.onHold > 0);
          break;
        case "low_stock":
          result = result.filter((s) => s.availableQty > 0 && s.availableQty < 10);
          break;
      }
    }

    return result;
  }, [stocks, searchQuery, statusFilter, stockFilter, channelFilter]);

  // Build active filters display
  const activeFilters = useMemo(() => {
    const filters: string[] = [];
    if (channelFilter) filters.push(`Channel: ${CHANNEL_OPTIONS.find(o => o.value === channelFilter)?.label}`);
    if (statusFilter) filters.push(`Status: ${STATUS_OPTIONS.find(o => o.value === statusFilter)?.label}`);
    if (stockFilter) filters.push(`Stock: ${STOCK_OPTIONS.find(o => o.value === stockFilter)?.label}`);
    return filters;
  }, [channelFilter, statusFilter, stockFilter]);

  const handleEdit = (id: string) => console.log("Edit", id);
  const handleView = (id: string) => console.log("View", id);
  const handleDelete = (id: string) => console.log("Delete", id);

  const renderStockRow = ({ item }: { item: Stock }) => {
    const hasItemsOnHold = item.onHold > 0;
    const isInStock = item.availableQty > 0;

    return (
      <View className="flex-row items-center py-3 px-5 border-b border-gray-100 bg-white">
        <View className="w-8 mr-4">
          <TableCheckbox />
        </View>
        <View className="w-56 pr-2">
          <Text className="text-gray-800 font-medium" numberOfLines={2}>
            {item.productName}
          </Text>
        </View>
        <Text className="w-28 text-gray-800 text-center">
          {formatCurrency(item.netCostPrice)}
        </Text>
        <Text className={`w-20 text-center ${hasItemsOnHold ? "text-orange-600" : "text-gray-600"}`}>
          {item.onHold}
        </Text>
        <Text className="w-24 text-gray-800 text-center">
          {formatCurrency(item.salePrice)}
        </Text>
        <View className="w-40">
          <Text className="text-gray-800">{item.sku} /</Text>
          <Text className="text-gray-600 text-sm">{item.upc}</Text>
        </View>
        <Text className={`w-24 text-center font-medium ${isInStock ? "text-green-600" : "text-red-500"}`}>
          {item.availableQty}
        </Text>
        <View className="w-28 flex-row items-center justify-center gap-2">
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

  return (
    <View className="flex-1 bg-gray-50">
      <PageHeader title="Stocks" />

      {/* Toolbar */}
      <View className="bg-white px-5 py-4 border-b border-gray-200">
        {/* Search Row */}
        <View className="flex-row gap-4 mb-4">
          <View className="flex-1">
            <Text className="text-gray-500 text-sm mb-1">Search by Product Name, SKU/UPC</Text>
            <TextInput
              className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-2"
              placeholder="Search"
              placeholderTextColor="#9ca3af"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
          <FilterDropdown
            label="Product Status"
            value={statusFilter}
            options={STATUS_OPTIONS}
            onChange={setStatusFilter}
            placeholder="All Status"
            width={140}
          />
          <FilterDropdown
            label="Stock Level"
            value={stockFilter}
            options={STOCK_OPTIONS}
            onChange={setStockFilter}
            placeholder="All Items"
            width={160}
          />
        </View>

        {/* Action Buttons */}
        <View className="flex-row gap-3 items-center">
          <Pressable className="bg-yellow-500 px-4 py-2.5 rounded-lg flex-row items-center gap-2">
            <Ionicons name="filter" size={16} color="white" />
            <Text className="text-white font-medium">Advance Filters</Text>
          </Pressable>
          <Pressable className="bg-red-500 px-4 py-2.5 rounded-lg">
            <Text className="text-white font-medium">Bulk Edit Stock</Text>
          </Pressable>
          <Pressable className="bg-gray-100 px-4 py-2.5 rounded-lg flex-row items-center gap-2">
            <Ionicons name="grid" size={16} color="#374151" />
            <Text className="text-gray-700">Columns</Text>
          </Pressable>
        </View>

        {/* Applied Filters */}
        <View className="mt-3">
          <Text className="text-gray-500 text-sm">
            Filters Applied: {activeFilters.join(" | ") || "None"} 
            <Text className="text-gray-400"> ({filteredStocks.length} items)</Text>
          </Text>
        </View>
      </View>

      {/* Data Table */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-1">
        <View style={{ minWidth: 900 }}>
          {/* Table Header */}
          <View className="flex-row bg-gray-50 py-3 px-5 border-b border-gray-200">
            <View className="w-8 mr-4">
              <TableCheckbox />
            </View>
            <Text className="w-56 text-gray-500 text-xs font-semibold uppercase">Product Name</Text>
            <Text className="w-28 text-gray-500 text-xs font-semibold uppercase text-center">Net Cost</Text>
            <Text className="w-20 text-gray-500 text-xs font-semibold uppercase text-center">On Hold</Text>
            <Text className="w-24 text-gray-500 text-xs font-semibold uppercase text-center">Sale Price</Text>
            <Text className="w-40 text-gray-500 text-xs font-semibold uppercase">SKU/UPC</Text>
            <Text className="w-24 text-gray-500 text-xs font-semibold uppercase text-center">Qty</Text>
            <Text className="w-28 text-gray-500 text-xs font-semibold uppercase text-center">Actions</Text>
          </View>

          {/* Table Body */}
          <FlatList
            data={filteredStocks}
            keyExtractor={(item) => item.id}
            renderItem={renderStockRow}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View className="py-16 items-center">
                <Ionicons name="cube-outline" size={48} color="#d1d5db" />
                <Text className="text-gray-400 mt-2">No stock items found</Text>
              </View>
            }
          />
        </View>
      </ScrollView>
    </View>
  );
}
