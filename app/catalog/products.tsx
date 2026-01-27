import { Ionicons } from "@expo/vector-icons";
import { useMemo, useState } from "react";
import {
  FlatList,
  Image,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { FilterDropdown, PageHeader } from "../../components";
import { Product } from "../../types";

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
  { label: "With Variants", value: "variants" },
  { label: "MSA Products", value: "msa" },
  { label: "Online Sale", value: "online" },
];

const CHANNEL_OPTIONS = [
  { label: "Primary", value: "primary" },
  { label: "Secondary", value: "secondary" },
  { label: "Online", value: "online" },
];

// ============================================================================
// Sample Data
// ============================================================================

const SAMPLE_PRODUCTS: Product[] = [
  { id: "1", variant: false, name: "Pillow", onlineSale: false, netCostPrice: 12, baseCostPrice: 10, salePrice: 20, isMSA: false },
  { id: "2", variant: false, name: "Desi drink 420", onlineSale: true, netCostPrice: 20, baseCostPrice: 20, salePrice: 25, isMSA: false },
  { id: "3", variant: true, name: "MEXICAN CHIPS 1CT 100g-tazm", onlineSale: false, netCostPrice: 420, baseCostPrice: 420, salePrice: 500, isMSA: false },
  { id: "4", variant: false, name: "Energy Drink XL", onlineSale: true, netCostPrice: 5, baseCostPrice: 4.50, salePrice: 8, isMSA: true },
  { id: "5", variant: false, name: "Snack Pack Mix", onlineSale: true, netCostPrice: 15, baseCostPrice: 12, salePrice: 22, isMSA: false },
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
// Main Component
// ============================================================================

export default function ProductsScreen() {
  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | null>("active");
  const [sortBy, setSortBy] = useState<string | null>(null);
  const [productTypeFilter, setProductTypeFilter] = useState<string | null>(null);
  const [channelFilter, setChannelFilter] = useState<string | null>("primary");

  const [products] = useState<Product[]>(SAMPLE_PRODUCTS);

  // Apply filters and sorting
  const filteredProducts = useMemo(() => {
    let result = [...products];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter((p) => p.name.toLowerCase().includes(query));
    }

    // Product type filter
    if (productTypeFilter) {
      switch (productTypeFilter) {
        case "variants":
          result = result.filter((p) => p.variant);
          break;
        case "msa":
          result = result.filter((p) => p.isMSA);
          break;
        case "online":
          result = result.filter((p) => p.onlineSale);
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
  }, [products, searchQuery, statusFilter, sortBy, productTypeFilter, channelFilter]);

  // Build active filters display
  const activeFilters = useMemo(() => {
    const filters: string[] = [];
    if (statusFilter) filters.push(`Status: ${STATUS_OPTIONS.find(o => o.value === statusFilter)?.label}`);
    if (channelFilter) filters.push(`Channel: ${CHANNEL_OPTIONS.find(o => o.value === channelFilter)?.label}`);
    if (productTypeFilter) filters.push(`Type: ${PRODUCT_TYPE_OPTIONS.find(o => o.value === productTypeFilter)?.label}`);
    if (sortBy) filters.push(`Sort: ${SORT_OPTIONS.find(o => o.value === sortBy)?.label}`);
    return filters;
  }, [statusFilter, channelFilter, productTypeFilter, sortBy]);

  const renderProductRow = ({ item }: { item: Product }) => (
    <Pressable className="flex-row items-center py-3 px-5 border-b border-gray-100 bg-white">
      <View className="w-8 mr-4">
        <TableCheckbox />
      </View>
      <Text className="w-16 text-gray-600 text-center">
        {item.variant ? "Yes" : "No"}
      </Text>
      <Text className="w-52 text-blue-600 font-medium">{item.name}</Text>
      <View className="w-24 items-center">
        <BooleanIcon value={item.onlineSale} />
      </View>
      <Text className="w-28 text-gray-800 text-center">${item.netCostPrice}</Text>
      <Text className="w-28 text-gray-800 text-center">${item.baseCostPrice}</Text>
      <Text className="w-24 text-blue-600 text-center">${item.salePrice}</Text>
      <View className="w-20 items-center">
        <BooleanIcon value={item.isMSA} />
      </View>
      <View className="w-20 h-12 bg-gray-100 rounded items-center justify-center">
        {item.imageUrl ? (
          <Image source={{ uri: item.imageUrl }} className="w-full h-full rounded" />
        ) : (
          <Ionicons name="image-outline" size={24} color="#d1d5db" />
        )}
      </View>
    </Pressable>
  );

  return (
    <View className="flex-1 bg-gray-50">
      <PageHeader title="Products" />

      {/* Toolbar */}
      <View className="bg-white px-5 py-4 border-b border-gray-200">
        {/* Title & Action Buttons */}
        <View className="flex-row items-center justify-between mb-4">
          <Text className="text-lg font-semibold text-gray-800">
            Products list ({filteredProducts.length})
          </Text>
          <View className="flex-row gap-2">
            <Pressable className="bg-blue-500 px-4 py-2 rounded-lg flex-row items-center gap-2">
              <Text className="text-white font-medium">Bulk Actions</Text>
              <Ionicons name="chevron-down" size={16} color="white" />
            </Pressable>
            <Pressable className="bg-cyan-500 px-4 py-2 rounded-lg flex-row items-center gap-2">
              <Text className="text-white font-medium">Import</Text>
              <Ionicons name="cloud-upload" size={16} color="white" />
            </Pressable>
            <Pressable className="bg-green-500 px-4 py-2 rounded-lg flex-row items-center gap-2">
              <Text className="text-white font-medium">Export</Text>
              <Ionicons name="cloud-upload" size={16} color="white" />
            </Pressable>
            <Pressable className="bg-red-500 px-4 py-2 rounded-lg">
              <Text className="text-white font-medium">Add Product</Text>
            </Pressable>
          </View>
        </View>

        {/* Filter Controls */}
        <View className="flex-row gap-4 mb-4">
          {/* Search Input */}
          <View className="flex-1">
            <Text className="text-gray-500 text-xs mb-1">Search by Name, SKU/UPC</Text>
            <TextInput
              className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2"
              placeholder="Search products..."
              placeholderTextColor="#9ca3af"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>

          {/* Status Filter */}
          <FilterDropdown
            label="Select by Status"
            value={statusFilter}
            options={STATUS_OPTIONS}
            onChange={setStatusFilter}
            placeholder="All Status"
            width={120}
          />

          {/* Sort Filter */}
          <FilterDropdown
            label="Sort By"
            value={sortBy}
            options={SORT_OPTIONS}
            onChange={setSortBy}
            placeholder="Sort By..."
            width={140}
          />

          {/* Products Filter */}
          <FilterDropdown
            label="Select by Products"
            value={productTypeFilter}
            options={PRODUCT_TYPE_OPTIONS}
            onChange={setProductTypeFilter}
            placeholder="All Products"
            width={140}
          />

          {/* Channel Selector */}
          <FilterDropdown
            label="Channel Name"
            value={channelFilter}
            options={CHANNEL_OPTIONS}
            onChange={setChannelFilter}
            placeholder="Select Channel"
            width={120}
            variant="danger"
            allowClear={false}
          />
        </View>

        {/* Active Filters & Print Labels */}
        <View className="flex-row items-center justify-between">
          <Pressable className="bg-gray-100 px-4 py-2 rounded-lg flex-row items-center gap-2">
            <Ionicons name="print-outline" size={16} color="#374151" />
            <Text className="text-gray-700">Print Labels</Text>
          </Pressable>
          {activeFilters.length > 0 && (
            <Text className="text-gray-500 text-sm">
              Filters: {activeFilters.join(" | ")}
            </Text>
          )}
        </View>
      </View>

      {/* Data Table */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-1">
        <View style={{ minWidth: 850 }}>
          {/* Table Header */}
          <View className="flex-row bg-gray-50 py-3 px-5 border-b border-gray-200">
            <View className="w-8 mr-4">
              <TableCheckbox />
            </View>
            <Text className="w-16 text-gray-500 text-xs font-semibold uppercase text-center">Variant</Text>
            <Text className="w-52 text-gray-500 text-xs font-semibold uppercase">Name</Text>
            <Text className="w-24 text-gray-500 text-xs font-semibold uppercase text-center">Online Sale</Text>
            <Text className="w-28 text-gray-500 text-xs font-semibold uppercase text-center">Net Cost Price</Text>
            <Text className="w-28 text-gray-500 text-xs font-semibold uppercase text-center">Base Cost Price</Text>
            <Text className="w-24 text-gray-500 text-xs font-semibold uppercase text-center">Sale Price</Text>
            <Text className="w-20 text-gray-500 text-xs font-semibold uppercase text-center">Is MSA</Text>
            <Text className="w-20 text-gray-500 text-xs font-semibold uppercase text-center">Image</Text>
          </View>

          {/* Table Body */}
          <FlatList
            data={filteredProducts}
            keyExtractor={(item) => item.id}
            renderItem={renderProductRow}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View className="py-16 items-center">
                <Ionicons name="search-outline" size={48} color="#d1d5db" />
                <Text className="text-gray-400 mt-2">No products found</Text>
              </View>
            }
          />
        </View>
      </ScrollView>
    </View>
  );
}
