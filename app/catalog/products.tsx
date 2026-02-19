/**
 * Products Screen
 * 
 * Displays product catalog with real-time sync from PowerSync.
 * Data source: products + unit_prices (joined)
 */

import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";
import { FilterDropdown, PageHeader, DataTable, ColumnDefinition } from "../../components";
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

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | null>("active");
  const [sortBy, setSortBy] = useState<string | null>(null);
  const [productTypeFilter, setProductTypeFilter] = useState<string | null>(null);

  // Search logic
  const handleSearch = useCallback((item: ProductView, query: string) => {
    const q = query.toLowerCase();
    return (
      (item.name?.toLowerCase().includes(q) || false) ||
      (item.sku?.toLowerCase().includes(q) || false) ||
      (item.upc?.toLowerCase().includes(q) || false)
    );
  }, []);

  // Filter logic
  const handleFilter = useCallback((item: ProductView, filters: Record<string, any>) => {
    if (filters.status && filters.status !== "all") {
      const isActive = filters.status === "active";
      if (item.isActive !== isActive) return false;
    }
    if (filters.type && filters.type !== "all") {
      if (filters.type === "online" && !item.onlineSale) return false;
      if (filters.type === "featured" && !item.isFeatured) return false;
    }
    return true;
  }, []);

  // Sort logic
  const handleSort = useCallback((data: ProductView[], sortBy: string | null) => {
    if (!sortBy) return data;
    const result = [...data];
    switch (sortBy) {
      case "name_asc":
        result.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
        break;
      case "name_desc":
        result.sort((a, b) => (b.name || "").localeCompare(a.name || ""));
        break;
      case "price_asc":
        result.sort((a, b) => (a.salePrice || 0) - (b.salePrice || 0));
        break;
      case "price_desc":
        result.sort((a, b) => (b.salePrice || 0) - (a.salePrice || 0));
        break;
    }
    return result;
  }, []);

  // Column definitions
  const columns = useMemo<ColumnDefinition<ProductView>[]>(() => [
    {
      key: "name",
      title: "Product Name",
      width: "flex",
      render: (item) => (
        <View className="flex-row items-center">
          <View className="w-10 h-10 bg-gray-100 rounded-lg items-center justify-center mr-3">
            <Ionicons name="cube-outline" size={20} color="#9ca3af" />
          </View>
          <View className="flex-1">
            <Text className="text-[#1A1A1A] text-[18px] font-Montserrat font-medium" numberOfLines={1}>
              {item.name || "-"}
            </Text>
            <Text className="text-gray-500 text-[14px] font-Montserrat">SKU: {item.sku || "-"}</Text>
          </View>
        </View>
      ),
    },
    {
      key: "upc",
      title: "UPC",
      width: 150,
      render: (item) => (
        <Text className="text-[#1A1A1A] text-[18px] font-Montserrat">{item.upc || "-"}</Text>
      ),
    },
    {
      key: "onlineSale",
      title: "Online",
      width: 100,
      align: "center",
      render: (item) => <BooleanIcon value={item.onlineSale} size={22} />,
    },
    {
      key: "costPrice",
      title: "Cost",
      width: 100,
      align: "right",
      render: (item) => (
        <Text className="text-[#1A1A1A] text-[18px] font-Montserrat">{formatCurrency(item.costPrice)}</Text>
      ),
    },
    {
      key: "unitPrice",
      title: "Unit",
      width: 100,
      align: "right",
      render: (item) => (
        <Text className="text-[#1A1A1A] text-[18px] font-Montserrat">{formatCurrency(item.unitPrice)}</Text>
      ),
    },
    {
      key: "salePrice",
      title: "Sale",
      width: 100,
      align: "right",
      render: (item) => (
        <Text className="text-green-600 text-[18px] font-Montserrat font-bold">{formatCurrency(item.salePrice)}</Text>
      ),
    },
    {
      key: "isActive",
      title: "Active",
      width: 80,
      align: "center",
      render: (item) => <BooleanIcon value={item.isActive} size={22} />,
    },
  ], []);

  const handleAddPress = useCallback(() => {
    router.push("/catalog/add-product");
  }, [router]);

  const handleFiltersChange = useCallback((f: Record<string, unknown>) => {
    setStatusFilter(f.status as string);
  }, []);

  return (
    <View className="flex-1 bg-[#F7F7F9]">
      <PageHeader title="Products" showBack={false} />

      <DataTable<ProductView>
        data={products}
        columns={columns}
        keyExtractor={(item) => item.id}
        searchable
        searchPlaceholder="Search products..."
        onSearch={handleSearch}
        onFilter={handleFilter}
        onSort={handleSort}
        filters={[
          { key: "status", placeholder: "Status", options: STATUS_OPTIONS, width: 120, defaultValue: "active" },
          { key: "type", placeholder: "Product Type", options: PRODUCT_TYPE_OPTIONS, width: 150 },
        ]}
        sortOptions={SORT_OPTIONS}
        onFiltersChange={handleFiltersChange}
        columnSelector
        addButton
        addButtonText="Add Product"
        onAddPress={handleAddPress}
        isLoading={isLoading}
        isStreaming={isStreaming}
        onRefresh={refresh}
        emptyIcon="cube-outline"
        emptyText="No products found"
        totalCount={count}
        horizontalScroll
        minWidth={1000}
      />
    </View>
  );
}
