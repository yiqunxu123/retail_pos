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
  Modal,
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
  
  // Columns visibility state
  const [showColumnsModal, setShowColumnsModal] = useState(false);
  const [visibleColumns, setVisibleColumns] = useState({
    productName: true,
    bin: true,
    sku: true,
    upc: true,
    cost: true,
    price: true,
    qty: true,
    alert: true,
    actions: true,
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
        {visibleColumns.productName && (
          <View className="flex-1 pr-2">
            <Text className="text-gray-800 font-medium" numberOfLines={2}>
              {item.productName || "-"}
            </Text>
            {visibleColumns.bin && item.bin && <Text className="text-gray-500 text-xs">Bin: {item.bin}</Text>}
          </View>
        )}
        {(visibleColumns.sku || visibleColumns.upc) && (
          <View className="w-28">
            {visibleColumns.sku && <Text className="text-gray-800 text-sm">{item.sku || "-"}</Text>}
            {visibleColumns.upc && <Text className="text-gray-500 text-xs">{item.upc || "-"}</Text>}
          </View>
        )}
        {visibleColumns.cost && (
          <View className="w-20 items-center">
            <Text className="text-gray-700">{formatCurrency(item.costPrice)}</Text>
          </View>
        )}
        {visibleColumns.price && (
          <View className="w-20 items-center">
            <Text className="text-green-600 font-medium">{formatCurrency(item.salePrice)}</Text>
          </View>
        )}
        {visibleColumns.qty && (
          <Text
            className={`w-16 text-center font-medium ${
              !isInStock ? "text-red-500" : "text-green-600"
            }`}
          >
            {item.availableQty}
          </Text>
        )}
        {visibleColumns.alert && (
          <View className="w-16 items-center">
            {/* minQty: DB does not have qty_alert field */}
            <Text className="text-gray-400">-</Text>
          </View>
        )}
        {visibleColumns.actions && (
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
        )}
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
          {visibleColumns.productName && <Text className="flex-1 text-gray-500 text-xs font-semibold uppercase">Product Name</Text>}
          {(visibleColumns.sku || visibleColumns.upc) && <Text className="w-28 text-gray-500 text-xs font-semibold uppercase">SKU/UPC</Text>}
          {visibleColumns.cost && <Text className="w-20 text-gray-500 text-xs font-semibold uppercase text-center">Cost</Text>}
          {visibleColumns.price && <Text className="w-20 text-gray-500 text-xs font-semibold uppercase text-center">Price</Text>}
          {visibleColumns.qty && <Text className="w-16 text-gray-500 text-xs font-semibold uppercase text-center">Qty</Text>}
          {visibleColumns.alert && <Text className="w-16 text-gray-500 text-xs font-semibold uppercase text-center">Alert</Text>}
          {visibleColumns.actions && <Text className="w-24 text-gray-500 text-xs font-semibold uppercase text-center">Actions</Text>}
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
            <View className="max-h-96">
              {/* Product Name */}
              <Pressable 
                className="flex-row items-center py-3"
                onPress={() => toggleColumn('productName')}
              >
                <View className={`w-5 h-5 rounded border mr-3 items-center justify-center ${visibleColumns.productName ? 'bg-red-500 border-red-500' : 'border-gray-300'}`}>
                  {visibleColumns.productName && <Ionicons name="checkmark" size={14} color="white" />}
                </View>
                <Text className="text-gray-700 text-base">Product Name</Text>
              </Pressable>

              {/* Bin */}
              <Pressable 
                className="flex-row items-center py-3"
                onPress={() => toggleColumn('bin')}
              >
                <View className={`w-5 h-5 rounded border mr-3 items-center justify-center ${visibleColumns.bin ? 'bg-red-500 border-red-500' : 'border-gray-300'}`}>
                  {visibleColumns.bin && <Ionicons name="checkmark" size={14} color="white" />}
                </View>
                <Text className="text-gray-700 text-base">Bin</Text>
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

              {/* Cost */}
              <Pressable 
                className="flex-row items-center py-3"
                onPress={() => toggleColumn('cost')}
              >
                <View className={`w-5 h-5 rounded border mr-3 items-center justify-center ${visibleColumns.cost ? 'bg-red-500 border-red-500' : 'border-gray-300'}`}>
                  {visibleColumns.cost && <Ionicons name="checkmark" size={14} color="white" />}
                </View>
                <Text className="text-gray-700 text-base">Cost</Text>
              </Pressable>

              {/* Price */}
              <Pressable 
                className="flex-row items-center py-3"
                onPress={() => toggleColumn('price')}
              >
                <View className={`w-5 h-5 rounded border mr-3 items-center justify-center ${visibleColumns.price ? 'bg-red-500 border-red-500' : 'border-gray-300'}`}>
                  {visibleColumns.price && <Ionicons name="checkmark" size={14} color="white" />}
                </View>
                <Text className="text-gray-700 text-base">Price</Text>
              </Pressable>

              {/* Qty */}
              <Pressable 
                className="flex-row items-center py-3"
                onPress={() => toggleColumn('qty')}
              >
                <View className={`w-5 h-5 rounded border mr-3 items-center justify-center ${visibleColumns.qty ? 'bg-red-500 border-red-500' : 'border-gray-300'}`}>
                  {visibleColumns.qty && <Ionicons name="checkmark" size={14} color="white" />}
                </View>
                <Text className="text-gray-700 text-base">Qty</Text>
              </Pressable>

              {/* Alert */}
              <Pressable 
                className="flex-row items-center py-3"
                onPress={() => toggleColumn('alert')}
              >
                <View className={`w-5 h-5 rounded border mr-3 items-center justify-center ${visibleColumns.alert ? 'bg-red-500 border-red-500' : 'border-gray-300'}`}>
                  {visibleColumns.alert && <Ionicons name="checkmark" size={14} color="white" />}
                </View>
                <Text className="text-gray-700 text-base">Alert</Text>
              </Pressable>

              {/* Actions */}
              <Pressable 
                className="flex-row items-center py-3"
                onPress={() => toggleColumn('actions')}
              >
                <View className={`w-5 h-5 rounded border mr-3 items-center justify-center ${visibleColumns.actions ? 'bg-red-500 border-red-500' : 'border-gray-300'}`}>
                  {visibleColumns.actions && <Ionicons name="checkmark" size={14} color="white" />}
                </View>
                <Text className="text-gray-700 text-base">Actions</Text>
              </Pressable>
            </View>

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
