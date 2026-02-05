/**
 * Products Screen
 * 
 * Displays product catalog with real-time sync from PowerSync.
 * Data source: products + unit_prices (joined)
 */

import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import {
    ActivityIndicator,
    FlatList,
    Modal,
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
  const router = useRouter();
  
  // Data from PowerSync
  const { products, isLoading, isStreaming, refresh, count } = useProducts();
  const [refreshing, setRefreshing] = useState(false);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | null>("active");
  const [sortBy, setSortBy] = useState<string | null>(null);
  const [productTypeFilter, setProductTypeFilter] = useState<string | null>(null);
  
  // Columns visibility state
  const [showColumnsModal, setShowColumnsModal] = useState(false);
  const [visibleColumns, setVisibleColumns] = useState({
    image: true,
    name: true,
    sku: true,
    upc: true,
    category: false,
    brand: false,
    baseCost: true,
    unitPrice: false,
    salePrice: true,
    online: true,
    active: true,
  });
  
  const toggleColumn = (column: keyof typeof visibleColumns) => {
    setVisibleColumns(prev => ({ ...prev, [column]: !prev[column] }));
  };

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
      {visibleColumns.image && (
        <View className="w-12 h-12 bg-gray-100 rounded-lg items-center justify-center mr-3">
          <Ionicons name="cube-outline" size={24} color="#9ca3af" />
        </View>
      )}
      {visibleColumns.name && (
        <View className="flex-1">
          <Text className="text-gray-800 font-medium" numberOfLines={1}>
            {item.name || "-"}
          </Text>
          {visibleColumns.sku && <Text className="text-gray-500 text-sm">SKU: {item.sku || "-"}</Text>}
        </View>
      )}
      {visibleColumns.sku && !visibleColumns.name && (
        <View className="w-24">
          <Text className="text-gray-600 text-sm">{item.sku || "-"}</Text>
        </View>
      )}
      {visibleColumns.upc && (
        <View className="w-28">
          <Text className="text-gray-600 text-sm">{item.upc || "-"}</Text>
        </View>
      )}
      {visibleColumns.category && (
        <View className="w-28">
          <Text className="text-gray-600 text-sm">-</Text>
        </View>
      )}
      {visibleColumns.online && (
        <View className="w-16 items-center">
          <BooleanIcon value={item.onlineSale} />
        </View>
      )}
      {visibleColumns.baseCost && (
        <View className="w-20 items-center">
          <Text className="text-gray-700">{formatCurrency(item.costPrice)}</Text>
        </View>
      )}
      {visibleColumns.salePrice && (
        <View className="w-20 items-center">
          <Text className="text-green-600 font-medium">{formatCurrency(item.salePrice)}</Text>
        </View>
      )}
      {visibleColumns.active && (
        <View className="w-14 items-center">
          <BooleanIcon value={item.isActive} size={18} />
        </View>
      )}
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
          <Pressable 
            className="bg-gray-100 px-4 py-2 rounded-lg flex-row items-center gap-2"
            onPress={() => setShowColumnsModal(true)}
          >
            <Ionicons name="grid" size={16} color="#374151" />
            <Text className="text-gray-700">Columns</Text>
          </Pressable>
          {isStreaming && (
            <View className="flex-row items-center gap-1 ml-2">
              <Text className="text-green-600 text-xs">● Live</Text>
            </View>
          )}
          <View className="flex-1" />
          <Pressable 
            className="px-4 py-2 rounded-lg flex-row items-center gap-2"
            style={{ backgroundColor: "#3B82F6" }}
            onPress={() => router.push("/catalog/add-product")}
          >
            <Text className="text-white font-medium">Add Product</Text>
          </Pressable>
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
      <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-1" contentContainerStyle={{ flexGrow: 1 }}>
        <View style={{ flex: 1, minWidth: 900 }}>
          {/* Table Header */}
          <View className="flex-row bg-gray-50 py-3 px-5 border-b border-gray-200">
            <View className="w-8 mr-4">
              <TableCheckbox />
            </View>
            {visibleColumns.image && <View className="w-12 mr-3" />}
            {visibleColumns.name && <Text className="flex-1 text-gray-500 text-xs font-semibold uppercase">Product Name</Text>}
            {visibleColumns.sku && <Text className="w-24 text-gray-500 text-xs font-semibold uppercase">SKU</Text>}
            {visibleColumns.upc && <Text className="w-28 text-gray-500 text-xs font-semibold uppercase">UPC</Text>}
            {visibleColumns.category && <Text className="w-28 text-gray-500 text-xs font-semibold uppercase">Category</Text>}
            {visibleColumns.online && <Text className="w-16 text-gray-500 text-xs font-semibold uppercase text-center">Online</Text>}
            {visibleColumns.baseCost && <Text className="w-20 text-gray-500 text-xs font-semibold uppercase text-center">Cost</Text>}
            {visibleColumns.salePrice && <Text className="w-20 text-gray-500 text-xs font-semibold uppercase text-center">Sale</Text>}
            {visibleColumns.active && <Text className="w-14 text-gray-500 text-xs font-semibold uppercase text-center">Active</Text>}
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

      {/* Columns Selection Modal */}
      <Modal
        visible={showColumnsModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowColumnsModal(false)}
      >
        <View className="flex-1 bg-black/50 justify-center items-center">
          <View className="bg-white rounded-xl w-80 max-w-[90%] p-6">
            {/* Header */}
            <View className="flex-row items-center justify-between mb-6">
              <Text className="text-xl font-semibold text-gray-800">Select Columns</Text>
              <Pressable onPress={() => setShowColumnsModal(false)}>
                <Ionicons name="close" size={24} color="#9CA3AF" />
              </Pressable>
            </View>

            {/* Column Options */}
            <ScrollView className="max-h-96" showsVerticalScrollIndicator={false}>
              {/* Image */}
              <Pressable 
                className="flex-row items-center py-3"
                onPress={() => toggleColumn('image')}
              >
                <View className={`w-5 h-5 rounded border mr-3 items-center justify-center ${visibleColumns.image ? 'bg-red-500 border-red-500' : 'border-gray-300'}`}>
                  {visibleColumns.image && <Ionicons name="checkmark" size={14} color="white" />}
                </View>
                <Text className="text-gray-700 text-base">Image</Text>
              </Pressable>

              {/* Name */}
              <Pressable 
                className="flex-row items-center py-3"
                onPress={() => toggleColumn('name')}
              >
                <View className={`w-5 h-5 rounded border mr-3 items-center justify-center ${visibleColumns.name ? 'bg-red-500 border-red-500' : 'border-gray-300'}`}>
                  {visibleColumns.name && <Ionicons name="checkmark" size={14} color="white" />}
                </View>
                <Text className="text-gray-700 text-base">Name</Text>
              </Pressable>

              {/* Base Cost Price */}
              <Pressable 
                className="flex-row items-center py-3"
                onPress={() => toggleColumn('baseCost')}
              >
                <View className={`w-5 h-5 rounded border mr-3 items-center justify-center ${visibleColumns.baseCost ? 'bg-red-500 border-red-500' : 'border-gray-300'}`}>
                  {visibleColumns.baseCost && <Ionicons name="checkmark" size={14} color="white" />}
                </View>
                <Text className="text-gray-700 text-base">Base Cost Price</Text>
              </Pressable>

              {/* SKU */}
              <Pressable 
                className="flex-row items-center py-3"
                onPress={() => toggleColumn('sku')}
              >
                <View className={`w-5 h-5 rounded border mr-3 items-center justify-center ${visibleColumns.sku ? 'bg-red-500 border-red-500' : 'border-gray-300'}`}>
                  {visibleColumns.sku && <Ionicons name="checkmark" size={14} color="white" />}
                </View>
                <Text className="text-gray-700 text-base">SKU</Text>
              </Pressable>

              {/* UPC */}
              <Pressable 
                className="flex-row items-center py-3"
                onPress={() => toggleColumn('upc')}
              >
                <View className={`w-5 h-5 rounded border mr-3 items-center justify-center ${visibleColumns.upc ? 'bg-red-500 border-red-500' : 'border-gray-300'}`}>
                  {visibleColumns.upc && <Ionicons name="checkmark" size={14} color="white" />}
                </View>
                <Text className="text-gray-700 text-base">UPC</Text>
              </Pressable>

              {/* Category */}
              <Pressable 
                className="flex-row items-center py-3"
                onPress={() => toggleColumn('category')}
              >
                <View className={`w-5 h-5 rounded border mr-3 items-center justify-center ${visibleColumns.category ? 'bg-red-500 border-red-500' : 'border-gray-300'}`}>
                  {visibleColumns.category && <Ionicons name="checkmark" size={14} color="white" />}
                </View>
                <Text className="text-gray-700 text-base">Category</Text>
              </Pressable>

              {/* Sale Price */}
              <Pressable 
                className="flex-row items-center py-3"
                onPress={() => toggleColumn('salePrice')}
              >
                <View className={`w-5 h-5 rounded border mr-3 items-center justify-center ${visibleColumns.salePrice ? 'bg-red-500 border-red-500' : 'border-gray-300'}`}>
                  {visibleColumns.salePrice && <Ionicons name="checkmark" size={14} color="white" />}
                </View>
                <Text className="text-gray-700 text-base">Sale Price</Text>
              </Pressable>

              {/* Online */}
              <Pressable 
                className="flex-row items-center py-3"
                onPress={() => toggleColumn('online')}
              >
                <View className={`w-5 h-5 rounded border mr-3 items-center justify-center ${visibleColumns.online ? 'bg-red-500 border-red-500' : 'border-gray-300'}`}>
                  {visibleColumns.online && <Ionicons name="checkmark" size={14} color="white" />}
                </View>
                <Text className="text-gray-700 text-base">Online</Text>
              </Pressable>

              {/* Active */}
              <Pressable 
                className="flex-row items-center py-3"
                onPress={() => toggleColumn('active')}
              >
                <View className={`w-5 h-5 rounded border mr-3 items-center justify-center ${visibleColumns.active ? 'bg-red-500 border-red-500' : 'border-gray-300'}`}>
                  {visibleColumns.active && <Ionicons name="checkmark" size={14} color="white" />}
                </View>
                <Text className="text-gray-700 text-base">Active</Text>
              </Pressable>
            </ScrollView>

            {/* Footer Button */}
            <Pressable
              className="mt-6 py-3 rounded-lg items-center"
              style={{ backgroundColor: "#3B82F6" }}
              onPress={() => setShowColumnsModal(false)}
            >
              <Text className="text-white font-medium">Done</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}
