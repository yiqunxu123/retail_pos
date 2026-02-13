/**
 * Stocks Screen
 *
 * Aligned with KHUB web Stocks columns configuration.
 */

import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { ColumnDefinition, DataTable, FilterDefinition, PageHeader } from "../../components";
import { BulkStockUpdateItem, bulkUpdateStocks } from "../../utils/api";
import { StockView, useStocks } from "../../utils/powersync/hooks";

// ============================================================================
// Helpers
// ============================================================================

const formatCurrency = (value: number) => (value > 0 ? `$${value.toFixed(2)}` : "-");
const formatQty = (value: number | null | undefined) => (value === null || value === undefined ? "-" : value.toLocaleString());
const qtyValueTextStyle = { fontSize: 12, lineHeight: 16, fontWeight: "400" as const, color: "#374151" };
const qtyInputTextStyle = {
  fontSize: 12,
  lineHeight: 16,
  fontWeight: "400" as const,
  color: "#374151",
  paddingVertical: 0,
  textAlign: "center" as const,
  includeFontPadding: false,
};
const qtyUnitTextStyle = { fontSize: 11, lineHeight: 14, fontWeight: "400" as const, color: "#6b7280" };
const parseQtyInput = (value: string, fallback = 0) => {
  const parsed = parseInt(value, 10);
  if (Number.isNaN(parsed)) return fallback;
  return Math.max(0, parsed);
};

interface BulkEditValue {
  availableQty: string;
  damagedQty: string;
}

function distributeStock(
  receivedQty: number,
  backOrderStock: number,
  holdFreeShipmentStock: number,
  inHandStock: number,
  onHoldStock: number
) {
  const qty = Number(receivedQty) || 0;
  const prevBackOrderQty = backOrderStock || 0;
  const prevOnHoldQty = onHoldStock || 0;
  const prevHoldFreeShipmentQty = holdFreeShipmentStock || 0;
  const prevInHandStock = inHandStock || 0;

  let newBoQty: number;
  let newOnHoldQty: number;
  let newInHandQty: number;
  let newHoldFreeShipment: number;

  if (qty > prevBackOrderQty) {
    newBoQty = 0;
    newHoldFreeShipment = 0;
    newOnHoldQty = prevOnHoldQty + prevBackOrderQty - prevHoldFreeShipmentQty;
    newInHandQty = prevInHandStock + qty - newOnHoldQty + prevOnHoldQty - prevHoldFreeShipmentQty;
  } else {
    if (holdFreeShipmentStock >= qty) {
      newHoldFreeShipment = prevHoldFreeShipmentQty - qty;
      newOnHoldQty = prevOnHoldQty;
    } else {
      newHoldFreeShipment = 0;
      newOnHoldQty = prevOnHoldQty + qty - prevHoldFreeShipmentQty;
    }
    newBoQty = prevBackOrderQty - qty;
    newInHandQty = prevInHandStock;
  }

  return {
    new_hold_free_shipment: newHoldFreeShipment,
    new_bo_qty: newBoQty,
    new_onHold_qty: newOnHoldQty,
    new_inhand_qty: newInHandQty,
  };
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
  const [selectedRowKeys, setSelectedRowKeys] = useState<string[]>([]);
  const [bulkModalVisible, setBulkModalVisible] = useState(false);
  const [bulkRows, setBulkRows] = useState<StockView[]>([]);
  const [bulkEditMap, setBulkEditMap] = useState<Record<string, BulkEditValue>>({});
  const [bulkSubmitting, setBulkSubmitting] = useState(false);

  const handleEdit = (id: string) => console.log("Edit", id);
  const handleView = (id: string) => console.log("View", id);
  const handleDelete = (id: string) => console.log("Delete", id);

  const handleBulkEditOpen = (rows: StockView[]) => {
    if (!rows.length) {
      Alert.alert("Bulk Edit Stock", "Please select product(s) for bulk editing.");
      return;
    }

    const uniqueChannelIds = Array.from(new Set(rows.map((row) => row.channelId)));
    if (uniqueChannelIds.length > 1) {
      Alert.alert("Bulk Edit Stock", "Please select only one channel for bulk editing.");
      return;
    }

    const nextEditMap: Record<string, BulkEditValue> = {};
    rows.forEach((row) => {
      nextEditMap[row.id] = {
        availableQty: String(row.availableQty ?? 0),
        damagedQty: String(row.damagedQty ?? 0),
      };
    });

    setBulkRows(rows);
    setBulkEditMap(nextEditMap);
    setBulkModalVisible(true);
  };

  const updateBulkValue = (rowId: string, key: keyof BulkEditValue, value: string) => {
    const cleaned = value.replace(/[^0-9]/g, "");
    setBulkEditMap((prev) => ({
      ...prev,
      [rowId]: {
        availableQty: prev[rowId]?.availableQty ?? "0",
        damagedQty: prev[rowId]?.damagedQty ?? "0",
        [key]: cleaned,
      },
    }));
  };

  const handleBulkEditSubmit = async () => {
    if (!bulkRows.length || bulkSubmitting) return;

    const channelId = bulkRows[0].channelId;
    const payload: BulkStockUpdateItem[] = bulkRows.map((row) => {
      const availableQty = parseQtyInput(
        bulkEditMap[row.id]?.availableQty ?? "",
        row.availableQty ?? 0
      );
      const damagedQty = parseQtyInput(
        bulkEditMap[row.id]?.damagedQty ?? "",
        row.damagedQty ?? 0
      );
      return {
        product_id: row.productId,
        channel_id: channelId,
        // Keep this field aligned with web payload shape.
        available_qty: row.availableQty ?? 0,
        on_hold_qty: row.onHoldQty ?? 0,
        back_order_qty: row.backOrderQty ?? 0,
        hold_free_shipment: row.deliveredWithoutStockQty ?? 0,
        stock_qty_data: {
          6: availableQty,
          8: damagedQty,
        },
      };
    });

    try {
      setBulkSubmitting(true);
      await bulkUpdateStocks(payload);
      await refresh();
      setSelectedRowKeys([]);
      setBulkModalVisible(false);
      setBulkRows([]);
      setBulkEditMap({});
      Alert.alert("Success", "Stock has been updated successfully.");
    } catch (error: any) {
      const message = error?.response?.data?.message || error?.message || "Bulk update failed.";
      Alert.alert("Bulk Edit Stock", message);
    } finally {
      setBulkSubmitting(false);
    }
  };

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
        bulkActionText="Bulk Edit Stock"
        onBulkActionPress={handleBulkEditOpen}
        selectedRowKeys={selectedRowKeys}
        onSelectionChange={(keys) => setSelectedRowKeys(keys)}
        isLoading={isLoading}
        isStreaming={isStreaming}
        onRefresh={refresh}
        emptyIcon="cube-outline"
        emptyText="No stock items found"
        totalCount={count}
        horizontalScroll
        minWidth={2400}
      />

      <Modal
        visible={bulkModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setBulkModalVisible(false)}
      >
        <View className="flex-1 bg-black/50 justify-center items-center px-4">
          <View className="bg-white rounded-xl p-5" style={{ width: "96%", maxHeight: "85%" }}>
            <View className="flex-row items-start justify-between mb-3">
              <View className="flex-1 pr-4">
                <Text className="text-lg font-semibold text-gray-800">Bulk Edit Stock</Text>
                <Text className="text-xs text-gray-500 mt-1">
                  Please note that stock changes on this screen apply to unit: PIECE.
                </Text>
                <Text className="text-xs text-gray-500 mt-1">
                  Channel: {bulkRows[0]?.channelName || "-"} | Selected: {bulkRows.length}
                </Text>
              </View>
              <Pressable onPress={() => setBulkModalVisible(false)}>
                <Ionicons name="close" size={24} color="#9ca3af" />
              </Pressable>
            </View>

            <ScrollView style={{ maxHeight: "65%" }} showsVerticalScrollIndicator={false}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={{ minWidth: 1240 }}>
                  <View className="flex-row pb-2 border-b border-gray-200">
                    <View style={{ width: 260, paddingRight: 8 }}>
                      <Text className="text-xs text-gray-500">Products</Text>
                    </View>
                    <View style={{ width: 170, paddingRight: 8 }}>
                      <Text className="text-xs text-gray-500">Available Qty</Text>
                    </View>
                    <View style={{ width: 170, paddingRight: 8 }}>
                      <Text className="text-xs text-gray-500">Damaged Qty</Text>
                    </View>
                    <View style={{ width: 170, paddingRight: 8 }}>
                      <Text className="text-xs text-gray-500">On Hold Qty</Text>
                    </View>
                    <View style={{ width: 170, paddingRight: 8 }}>
                      <Text className="text-xs text-gray-500">Back Order Qty</Text>
                    </View>
                    <View style={{ width: 190, paddingRight: 8 }}>
                      <Text className="text-xs text-gray-500">Delivered Without Stock</Text>
                    </View>
                    <View style={{ width: 110 }}>
                      <Text className="text-xs text-gray-500">Channel Name</Text>
                    </View>
                  </View>

                  {bulkRows.map((row, index) => {
                    const preview = distributeStock(
                      parseQtyInput(bulkEditMap[row.id]?.availableQty ?? "", row.availableQty ?? 0),
                      row.backOrderQty ?? 0,
                      row.deliveredWithoutStockQty ?? 0,
                      row.availableQty ?? 0,
                      row.onHoldQty ?? 0
                    );
                    const showPreview = (row.backOrderQty ?? 0) > 0 || (row.deliveredWithoutStockQty ?? 0) > 0;

                    return (
                      <View
                        key={row.id}
                        className="py-2"
                        style={index < bulkRows.length - 1 ? { borderBottomWidth: 1, borderBottomColor: "#f3f4f6" } : undefined}
                      >
                        <View className="flex-row items-start">
                          <View style={{ width: 260, paddingRight: 8 }}>
                            <Text className="text-sm font-medium text-gray-800" numberOfLines={2}>
                              {row.productName || "-"}
                            </Text>
                            <Text className="text-xs text-gray-500 mt-0.5" numberOfLines={1}>
                              {row.sku || "-"}/{row.upc || "-"}
                            </Text>
                          </View>

                          <View style={{ width: 170, paddingRight: 8 }}>
                            <View className="h-10 rounded border border-gray-200 flex-row items-center bg-white overflow-hidden">
                              <TextInput
                                className="flex-1 px-2"
                                keyboardType="number-pad"
                                value={bulkEditMap[row.id]?.availableQty ?? String(row.availableQty ?? 0)}
                                onChangeText={(value) => updateBulkValue(row.id, "availableQty", value)}
                                placeholder="Enter Qty"
                                placeholderTextColor="#9ca3af"
                                selectTextOnFocus
                                style={qtyInputTextStyle}
                              />
                              <View className="h-full px-2 border-l border-gray-200 bg-gray-50 justify-center">
                                <Text style={qtyUnitTextStyle}>Piece</Text>
                              </View>
                            </View>
                            {showPreview ? (
                              <Text className="text-[11px] text-gray-500 italic mt-1">
                                New Value: <Text style={qtyValueTextStyle}>{preview.new_inhand_qty}</Text>
                              </Text>
                            ) : null}
                          </View>

                          <View style={{ width: 170, paddingRight: 8 }}>
                            <View className="h-10 rounded border border-gray-200 flex-row items-center bg-white overflow-hidden">
                              <TextInput
                                className="flex-1 px-2"
                                keyboardType="number-pad"
                                value={bulkEditMap[row.id]?.damagedQty ?? String(row.damagedQty ?? 0)}
                                onChangeText={(value) => updateBulkValue(row.id, "damagedQty", value)}
                                placeholder="Enter Qty"
                                placeholderTextColor="#9ca3af"
                                selectTextOnFocus
                                style={qtyInputTextStyle}
                              />
                              <View className="h-full px-2 border-l border-gray-200 bg-gray-50 justify-center">
                                <Text style={qtyUnitTextStyle}>Piece</Text>
                              </View>
                            </View>
                          </View>

                          <View style={{ width: 170, paddingRight: 8 }}>
                            <View className="h-10 rounded border border-gray-200 bg-gray-50 flex-row items-center justify-between px-2">
                              <Text style={qtyValueTextStyle}>{formatQty(row.onHoldQty ?? 0)}</Text>
                              <Text style={qtyUnitTextStyle}>Piece</Text>
                            </View>
                            {showPreview ? (
                              <Text className="text-[11px] text-gray-500 italic mt-1">
                                New Value: <Text style={qtyValueTextStyle}>{preview.new_onHold_qty}</Text>
                              </Text>
                            ) : null}
                          </View>

                          <View style={{ width: 170, paddingRight: 8 }}>
                            <View className="h-10 rounded border border-gray-200 bg-gray-50 flex-row items-center justify-between px-2">
                              <Text style={qtyValueTextStyle}>{formatQty(row.backOrderQty ?? 0)}</Text>
                              <Text style={qtyUnitTextStyle}>Piece</Text>
                            </View>
                            {showPreview ? (
                              <Text className="text-[11px] text-gray-500 italic mt-1">
                                New Value: <Text style={qtyValueTextStyle}>{preview.new_bo_qty}</Text>
                              </Text>
                            ) : null}
                          </View>

                          <View style={{ width: 190, paddingRight: 8 }}>
                            <View className="h-10 rounded border border-gray-200 bg-gray-50 flex-row items-center justify-between px-2">
                              <Text style={qtyValueTextStyle}>{formatQty(row.deliveredWithoutStockQty ?? 0)}</Text>
                              <Text style={qtyUnitTextStyle}>Piece</Text>
                            </View>
                            {showPreview ? (
                              <Text className="text-[11px] text-gray-500 italic mt-1">
                                New Value: <Text style={qtyValueTextStyle}>{preview.new_hold_free_shipment}</Text>
                              </Text>
                            ) : null}
                          </View>

                          <View style={{ width: 110 }}>
                            <Text className="text-sm text-gray-600 pt-2">{row.channelName || "-"}</Text>
                          </View>
                        </View>
                      </View>
                    );
                  })}
                </View>
              </ScrollView>
            </ScrollView>

            <View className="flex-row justify-end mt-4 gap-2">
              <Pressable
                className="px-4 py-2 rounded-lg bg-gray-100"
                onPress={() => setBulkModalVisible(false)}
                disabled={bulkSubmitting}
              >
                <Text className="text-gray-700 font-medium">Cancel</Text>
              </Pressable>
              <Pressable
                className="px-4 py-2 rounded-lg bg-red-500 min-w-24 items-center"
                onPress={handleBulkEditSubmit}
                disabled={bulkSubmitting}
              >
                {bulkSubmitting ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <Text className="text-white font-medium">Update</Text>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
