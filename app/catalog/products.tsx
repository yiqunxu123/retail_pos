/**
 * Products Screen
 * 
 * Displays product catalog with real-time sync from PowerSync.
 * Uses the unified DataTable component.
 */

import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Text, View } from "react-native";
import { ColumnDefinition, DataTable, FilterDefinition, PageHeader } from "../../components";
import { ProductView, useProducts } from "../../utils/powersync/hooks";

// ============================================================================
// Helper Components
// ============================================================================

function BooleanIcon({ value, size = 20 }: { value: boolean; size?: number }) {
  return value ? (
    <Ionicons name="checkmark-circle" size={size} color="#22c55e" />
  ) : (
    <Ionicons name="close-circle" size={size} color="#ef4444" />
  );
}

const formatCurrency = (value: number) =>
  value > 0 ? `$${value.toFixed(2)}` : "-";

// ============================================================================
// Main Component
// ============================================================================

export default function ProductsScreen() {
  const router = useRouter();
  const { products, isLoading, isStreaming, refresh, count } = useProducts();

  // 列配置
  const columns: ColumnDefinition<ProductView>[] = [
    {
      key: "image",
      title: "Image",
      width: 60,
      visible: true,
      render: () => (
        <View className="w-12 h-12 bg-gray-100 rounded-lg items-center justify-center">
          <Ionicons name="cube-outline" size={24} color="#9ca3af" />
        </View>
      ),
    },
    {
      key: "name",
      title: "Product Name",
      width: "flex",
      visible: true,
      hideable: false,
      render: (item) => (
        <View className="flex-1">
          <Text className="text-gray-800 font-medium" numberOfLines={1}>
            {item.name || "-"}
          </Text>
          <Text className="text-gray-500 text-sm">SKU: {item.sku || "-"}</Text>
        </View>
      ),
    },
    {
      key: "sku",
      title: "SKU",
      width: 100,
      visible: false,
      render: (item) => (
        <Text className="text-gray-600 text-sm">{item.sku || "-"}</Text>
      ),
    },
    {
      key: "upc",
      title: "UPC",
      width: 120,
      visible: true,
      render: (item) => (
        <Text className="text-gray-600 text-sm">{item.upc || "-"}</Text>
      ),
    },
    {
      key: "category",
      title: "Category",
      width: 120,
      visible: false,
      render: (item) => (
        <Text className="text-gray-600 text-sm">{item.categoryName || "-"}</Text>
      ),
    },
    {
      key: "brand",
      title: "Brand",
      width: 120,
      visible: false,
      render: (item) => (
        <Text className="text-gray-600 text-sm">{item.brandName || "-"}</Text>
      ),
    },
    {
      key: "costPrice",
      title: "Cost",
      width: 100,
      align: "center",
      visible: true,
      render: (item) => (
        <Text className="text-gray-700">{formatCurrency(item.costPrice)}</Text>
      ),
    },
    {
      key: "unitPrice",
      title: "Unit Price",
      width: 100,
      align: "center",
      visible: false,
      render: (item) => (
        <Text className="text-gray-700">{formatCurrency(item.costPrice)}</Text>
      ),
    },
    {
      key: "salePrice",
      title: "Sale Price",
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
      key: "online",
      title: "Online",
      width: 80,
      align: "center",
      visible: true,
      render: (item) => <BooleanIcon value={item.onlineSale} />,
    },
    {
      key: "active",
      title: "Active",
      width: 80,
      align: "center",
      visible: true,
      render: (item) => <BooleanIcon value={item.isActive} size={18} />,
    },
  ];

  // 过滤器
  const filters: FilterDefinition[] = [
    {
      key: "status",
      placeholder: "Status",
      width: 120,
      options: [
        { label: "Active", value: "active" },
        { label: "Inactive", value: "inactive" },
      ],
    },
    {
      key: "productType",
      placeholder: "Product Type",
      width: 150,
      options: [
        { label: "All Products", value: "all" },
        { label: "Online Sale", value: "online" },
        { label: "Featured", value: "featured" },
      ],
    },
  ];

  // 排序选项
  const sortOptions = [
    { label: "Name (A-Z)", value: "name_asc" },
    { label: "Name (Z-A)", value: "name_desc" },
    { label: "Price (Low-High)", value: "price_asc" },
    { label: "Price (High-Low)", value: "price_desc" },
  ];

  // 搜索逻辑
  const handleSearch = (item: ProductView, query: string) => {
    const q = query.toLowerCase();
    return (
      item.name.toLowerCase().includes(q) ||
      item.sku.toLowerCase().includes(q) ||
      item.upc.toLowerCase().includes(q)
    );
  };

  // 过滤逻辑
  const handleFilter = (
    item: ProductView,
    filters: Record<string, string | null>
  ) => {
    if (filters.status) {
      if (filters.status === "active" && !item.isActive) return false;
      if (filters.status === "inactive" && item.isActive) return false;
    }
    if (filters.productType && filters.productType !== "all") {
      if (filters.productType === "online" && !item.onlineSale) return false;
      if (filters.productType === "featured" && !item.isFeatured) return false;
    }
    return true;
  };

  // 排序逻辑
  const handleSort = (data: ProductView[], sortBy: string | null) => {
    if (!sortBy) return data;
    const sorted = [...data];
    switch (sortBy) {
      case "name_asc":
        return sorted.sort((a, b) => a.name.localeCompare(b.name));
      case "name_desc":
        return sorted.sort((a, b) => b.name.localeCompare(a.name));
      case "price_asc":
        return sorted.sort((a, b) => a.salePrice - b.salePrice);
      case "price_desc":
        return sorted.sort((a, b) => b.salePrice - a.salePrice);
      default:
        return sorted;
    }
  };

  return (
    <View className="flex-1 bg-gray-50">
      <PageHeader title="Products" />
      
      <DataTable<ProductView>
        data={products}
        columns={columns}
        keyExtractor={(item) => item.id}
        searchable
        searchPlaceholder="Search products..."
        searchHint="Search by Product Name, SKU, UPC"
        onSearch={handleSearch}
        filters={filters}
        onFilter={handleFilter}
        sortOptions={sortOptions}
        onSort={handleSort}
        columnSelector
        bulkActions
        addButton
        addButtonText="Add Product"
        onAddPress={() => router.push("/catalog/add-product")}
        isLoading={isLoading}
        isStreaming={isStreaming}
        onRefresh={refresh}
        emptyIcon="cube-outline"
        emptyText="No products found"
        totalCount={count}
      />
    </View>
  );
}
