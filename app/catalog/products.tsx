/**
 * Products Screen
 * 
 * Displays product catalog with real-time sync from PowerSync.
 * Data source: products + unit_prices (joined)
 */

import { Ionicons } from "@expo/vector-icons";
import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { FilterDropdown, PageHeader } from "../../components";
import { ProductView, useProducts } from "../../utils/powersync/hooks";

// ============================================================================
// Constants
// ============================================================================

const STATUS_OPTIONS = [
  { label: "Active", value: "active" },
  { label: "Inactive", value: "inactive" },
];

const SORT_OPTIONS = [
  { label: "Name (A-Z)", value: "name_asc" },
  { label: "Name (Z-A)", value: "name_desc" },
  { label: "Price (Low-High)", value: "price_asc" },
  { label: "Price (High-Low)", value: "price_desc" },
];

const PRODUCT_TYPE_OPTIONS = [
  { label: "All Products", value: "all" },
  { label: "Online Sale", value: "online" },
  { label: "Featured", value: "featured" },
];

// ============================================================================
// Reusable Components
// ============================================================================

function BooleanIcon({ value, size = 20 }: { value: boolean; size?: number }) {
  return value ? (
    <Ionicons name="checkmark-circle" size={size} color="#22c55e" />
  ) : (
    <Ionicons name="close-circle" size={size} color="#ef4444" />
  );
}

function TableCheckbox() {
  return <View className="w-5 h-5 border border-gray-300 rounded" />;
}

// ============================================================================
// Helpers
// ============================================================================

const formatCurrency = (value: number) =>
  value > 0 ? `$${value.toFixed(2)}` : "-";

// ============================================================================
// Main Component
// ============================================================================

export default function ProductsScreen() {
  // Data from PowerSync
  const { products, isLoading, isStreaming, refresh, count } = useProducts();
  const [refreshing, setRefreshing] = useState(false);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | null>("active");
  const [sortBy, setSortBy] = useState<string | null>(null);
  const [productTypeFilter, setProductTypeFilter] = useState<string | null>(null);

  // Pull to refresh
  const onRefresh = async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  };

  // Apply filters and sorting
  const filteredProducts = useMemo(() => {
    let result = [...products];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(query) ||
          p.sku.toLowerCase().includes(query) ||
          p.upc.toLowerCase().includes(query)
      );
    }

    // Status filter
    if (statusFilter) {
      result = result.filter((p) =>
        statusFilter === "active" ? p.isActive : !p.isActive
      );
    }

    // Product type filter
    if (productTypeFilter && productTypeFilter !== "all") {
      switch (productTypeFilter) {
        case "online":
          result = result.filter((p) => p.onlineSale);
          break;
        case "featured":
          result = result.filter((p) => p.isFeatured);
          break;
      }
    }

    // Sort
    if (sortBy) {
      switch (sortBy) {
        case "name_asc":
          result.sort((a, b) => a.name.localeCompare(b.name));
          break;
        case "name_desc":
          result.sort((a, b) => b.name.localeCompare(a.name));
          break;
        case "price_asc":
          result.sort((a, b) => a.salePrice - b.salePrice);
          break;
        case "price_desc":
          result.sort((a, b) => b.salePrice - a.salePrice);
          break;
      }
    }

    return result;
  }, [products, searchQuery, statusFilter, productTypeFilter, sortBy]);

  const renderProductRow = ({ item }: { item: ProductView }) => (
    <Pressable className="flex-row items-center py-3 px-5 border-b border-gray-100 bg-white">
      <View className="w-8 mr-4">
        <TableCheckbox />
      </View>
      <View className="w-12 h-12 bg-gray-100 rounded-lg items-center justify-center mr-3">
        <Ionicons name="cube-outline" size={24} color="#9ca3af" />
      </View>
      <View className="flex-1">
        <Text className="text-gray-800 font-medium" numberOfLines={1}>
          {item.name || "-"}
        </Text>
        <Text className="text-gray-500 text-sm">SKU: {item.sku || "-"}</Text>
      </View>
      <View className="w-28">
        <Text className="text-gray-600 text-sm">{item.upc || "-"}</Text>
      </View>
      <View className="w-16 items-center">
        <BooleanIcon value={item.onlineSale} />
      </View>
      <View className="w-20 items-center">
        <Text className="text-gray-700">{formatCurrency(item.costPrice)}</Text>
      </View>
      <View className="w-20 items-center">
        <Text className="text-gray-700">{formatCurrency(item.unitPrice)}</Text>
      </View>
      <View className="w-20 items-center">
        <Text className="text-green-600 font-medium">{formatCurrency(item.salePrice)}</Text>
      </View>
      <View className="w-14 items-center">
        <BooleanIcon value={item.isActive} size={18} />
      </View>
    </Pressable>
  );

  // Loading state
  if (isLoading && products.length === 0) {
    return (
      <View className="flex-1 bg-gray-50">
        <PageHeader title="Products" />
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text className="mt-4 text-gray-600">Loading products...</Text>
        </View>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-50">
      <PageHeader title="Products" />

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
          Search by Product Name, SKU, UPC
        </Text>
        <View className="flex-row gap-4">
          <View className="flex-1">
            <TextInput
              className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5"
              placeholder="Search products..."
              placeholderTextColor="#9ca3af"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
          <FilterDropdown
            label=""
            value={statusFilter}
            options={STATUS_OPTIONS}
            onChange={setStatusFilter}
            placeholder="Status"
            width={120}
          />
          <FilterDropdown
            label=""
            value={sortBy}
            options={SORT_OPTIONS}
            onChange={setSortBy}
            placeholder="Sort By"
            width={150}
          />
          <FilterDropdown
            label=""
            value={productTypeFilter}
            options={PRODUCT_TYPE_OPTIONS}
            onChange={setProductTypeFilter}
            placeholder="Product Type"
            width={150}
          />
        </View>

        {/* Results count */}
        <Text className="text-gray-400 text-sm mt-2">
          Showing {filteredProducts.length} of {count} products
        </Text>
      </View>

      {/* Data Table */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-1">
        <View style={{ minWidth: 900 }}>
          {/* Table Header */}
          <View className="flex-row bg-gray-50 py-3 px-5 border-b border-gray-200">
            <View className="w-8 mr-4">
              <TableCheckbox />
            </View>
            <View className="w-12 mr-3" />
            <Text className="flex-1 text-gray-500 text-xs font-semibold uppercase">Product Name</Text>
            <Text className="w-28 text-gray-500 text-xs font-semibold uppercase">UPC</Text>
            <Text className="w-16 text-gray-500 text-xs font-semibold uppercase text-center">Online</Text>
            <Text className="w-20 text-gray-500 text-xs font-semibold uppercase text-center">Cost</Text>
            <Text className="w-20 text-gray-500 text-xs font-semibold uppercase text-center">Unit</Text>
            <Text className="w-20 text-gray-500 text-xs font-semibold uppercase text-center">Sale</Text>
            <Text className="w-14 text-gray-500 text-xs font-semibold uppercase text-center">Active</Text>
          </View>

          {/* Table Body */}
          <FlatList
            data={filteredProducts}
            keyExtractor={(item) => item.id}
            renderItem={renderProductRow}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
            ListEmptyComponent={
              <View className="py-16 items-center">
                <Ionicons name="cube-outline" size={48} color="#d1d5db" />
                <Text className="text-gray-400 mt-2">No products found</Text>
              </View>
            }
          />
        </View>
      </ScrollView>
    </View>
  );
}
