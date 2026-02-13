/**
 * Stocks Screen
 *
 * Aligned with KHUB web Stocks columns configuration.
 */

import { Ionicons } from "@expo/vector-icons";
import { Pressable, Text, View } from "react-native";
import { ColumnDefinition, DataTable, FilterDefinition, PageHeader } from "../../components";
import { StockView, useStocks } from "../../utils/powersync/hooks";

// ============================================================================
// Helpers
// ============================================================================

const formatCurrency = (value: number) => (value > 0 ? `$${value.toFixed(2)}` : "-");
const formatQty = (value: number | null | undefined) => (value === null || value === undefined ? "-" : value.toLocaleString());

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
    <Pressable className={`${bgColor} p-1.5 rounded`} onPress={onPress}>
      <Ionicons name={icon} size={14} color={iconColor} />
    </Pressable>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export default function StocksScreen() {
  const { stocks, isLoading, isStreaming, refresh, count } = useStocks();

  const handleEdit = (id: string) => console.log("Edit", id);
  const handleView = (id: string) => console.log("View", id);
  const handleDelete = (id: string) => console.log("Delete", id);

  const columns: ColumnDefinition<StockView>[] = [
      {
        key: "image",
        title: "Image",
        width: 70,
        visible: true,
        render: () => (
          <View className="w-10 h-10 rounded bg-gray-100 items-center justify-center">
            <Ionicons name="cube-outline" size={18} color="#9ca3af" />
          </View>
        ),
      },
      {
        key: "productName",
        title: "Product Name",
        width: 220,
        visible: true,
        hideable: false,
        render: (item) => (
          <View>
            <Text className="text-blue-600 text-sm font-medium" numberOfLines={1}>
              {item.productName || "-"}
            </Text>
            <Text className="text-gray-500 text-xs" numberOfLines={1}>
              Bin: {item.bin || "-"}
            </Text>
          </View>
        ),
      },
      {
        key: "skuUpc",
        title: "SKU/UPC",
        width: 150,
        visible: true,
        render: (item) => (
          <View>
            <Text className="text-gray-700 text-sm">{item.sku || "-"}</Text>
            <Text className="text-gray-500 text-xs">{item.upc || "-"}</Text>
          </View>
        ),
      },
      {
        key: "channelName",
        title: "Channel Name",
        width: 140,
        visible: true,
        render: (item) => <Text className="text-gray-700 text-sm">{item.channelName || "-"}</Text>,
      },
      {
        key: "categoryName",
        title: "Category",
        width: 130,
        visible: true,
        render: (item) => <Text className="text-gray-700 text-sm">{item.categoryName || "-"}</Text>,
      },
      {
        key: "brandName",
        title: "Brand",
        width: 120,
        visible: true,
        render: (item) => <Text className="text-gray-700 text-sm">{item.brandName || "-"}</Text>,
      },
      {
        key: "baseCostPrice",
        title: "Base Cost Prices",
        width: 130,
        align: "center",
        visible: true,
        render: (item) => <Text className="text-gray-700 text-sm">{formatCurrency(item.baseCostPrice)}</Text>,
      },
      {
        key: "costPrice",
        title: "Net Cost Prices",
        width: 130,
        align: "center",
        visible: true,
        render: (item) => <Text className="text-gray-700 text-sm">{formatCurrency(item.costPrice)}</Text>,
      },
      {
        key: "salePrice",
        title: "Sale Price",
        width: 120,
        align: "center",
        visible: true,
        render: (item) => <Text className="text-green-600 font-medium text-sm">{formatCurrency(item.salePrice)}</Text>,
      },
      {
        key: "availableQty",
        title: "Available QTY",
        width: 120,
        align: "center",
        visible: true,
        render: (item) => (
          <Text className={`font-medium ${item.availableQty > 0 ? "text-green-600" : "text-red-500"}`}>
            {formatQty(item.availableQty)}
          </Text>
        ),
      },
      {
        key: "onHoldQty",
        title: "On Hold",
        width: 100,
        align: "center",
        visible: true,
        render: (item) => <Text className="text-gray-600 text-sm">{formatQty(item.onHoldQty)}</Text>,
      },
      {
        key: "backOrderQty",
        title: "Back Order QTY",
        width: 130,
        align: "center",
        visible: true,
        render: (item) => <Text className="text-gray-600 text-sm">{formatQty(item.backOrderQty)}</Text>,
      },
      {
        key: "comingSoonQty",
        title: "Coming Soon QTY",
        width: 140,
        align: "center",
        visible: true,
        render: (item) => <Text className="text-gray-600 text-sm">{formatQty(item.comingSoonQty)}</Text>,
      },
      {
        key: "deliveredWithoutStockQty",
        title: "Delivered Without Stock",
        width: 170,
        align: "center",
        visible: true,
        render: (item) => <Text className="text-gray-600 text-sm">{formatQty(item.deliveredWithoutStockQty)}</Text>,
      },
      {
        key: "damagedQty",
        title: "Damaged QTY",
        width: 120,
        align: "center",
        visible: true,
        render: (item) => <Text className="text-gray-600 text-sm">{formatQty(item.damagedQty)}</Text>,
      },
      {
        key: "totalQty",
        title: "Total Quantity",
        width: 120,
        align: "center",
        visible: true,
        render: (item) => <Text className="text-gray-700 text-sm">{formatQty(item.totalQty)}</Text>,
      },
      {
        key: "totalCost",
        title: "Total Cost",
        width: 120,
        align: "center",
        visible: true,
        render: (item) => <Text className="text-gray-700 text-sm">{formatCurrency(item.totalCost)}</Text>,
      },
      {
        key: "actions",
        title: "Actions",
        width: 120,
        align: "center",
        visible: true,
        hideable: false,
        render: (item) => (
          <View className="flex-row items-center justify-center gap-1">
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
        ),
      },
    ];

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

  const handleSearch = (item: StockView, query: string) => {
    const q = query.toLowerCase();
    return (
      item.productName.toLowerCase().includes(q) ||
      item.sku.toLowerCase().includes(q) ||
      item.upc.toLowerCase().includes(q)
    );
  };

  const handleFilter = (item: StockView, filtersMap: Record<string, string | null>) => {
    const stockLevel = filtersMap.stockLevel;
    if (!stockLevel || stockLevel === "all") return true;
    if (stockLevel === "in_stock") return item.availableQty > 0;
    if (stockLevel === "out_of_stock") return item.availableQty === 0;
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
        horizontalScroll
        minWidth={2400}
      />
    </View>
  );
}
