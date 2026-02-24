/**
 * Parked Orders Screen
 *
 * Displays parked orders (status = 70) from PowerSync (synced from backend).
 * All data comes from the remote backend, read locally via PowerSync.
 *
 * - Park: POST API (from add-products page)
 * - View: PowerSync local SQLite query
 * - Delete: DELETE API
 * - Resume: navigate to order form with retrieveOrderId
 */

import { buttonSize, colors, iconSize } from "@/utils/theme";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Alert, Pressable, Text, View } from "react-native";
import { useBulkEditContext } from "../../contexts/BulkEditContext";
import { ACTION_COL_WIDTH, ColumnDefinition, DataTable, PageHeader } from "../../components";
import { useParkedOrders } from "../../contexts/ParkedOrderContext";
import { useTableContentWidth } from "../../hooks/useTableContentWidth";
import { getSaleOrderStatusLabel } from "../../utils/constants";
import { type ParkedOrderView } from "../../utils/powersync/hooks";

// ============================================================================
// Helper Functions
// ============================================================================

function formatCurrency(value: number): string {
  return `$${value.toFixed(2)}`;
}

function formatDate(dateStr: string): string {
  if (!dateStr) return "";
  try {
    const d = new Date(dateStr);
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    const yyyy = d.getFullYear();
    let hh = d.getHours();
    const min = String(d.getMinutes()).padStart(2, "0");
    const ampm = hh >= 12 ? "PM" : "AM";
    hh = hh % 12 || 12;
    return `${mm}/${dd}/${yyyy} ${hh}:${min} ${ampm}`;
  } catch {
    return dateStr;
  }
}

// ============================================================================
// Main Component
// ============================================================================

export default function ParkedOrdersScreen() {
  const contentWidth = useTableContentWidth();
  const { remoteOrders, deleteParkedOrder, isLoading, count, refresh } =
    useParkedOrders();
  const [selectedRowKeys, setSelectedRowKeys] = useState<string[]>([]);

  const handleResumeOrder = useCallback((order: ParkedOrderView) => {
    Alert.alert("Resume Order", `Resume order ${order.orderNo}?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Resume",
        onPress: () => {
          router.push({
            pathname: "/order/add-products",
            params: { retrieveOrderId: order.id },
          });
        },
      },
    ]);
  }, []);

  const handleDeleteOrder = useCallback(
    (order: ParkedOrderView) => {
      Alert.alert(
        "Delete Parked Order",
        `Are you sure you want to delete order ${order.orderNo}? This action cannot be undone.`,
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Delete",
            style: "destructive",
            onPress: async () => {
              try {
                await deleteParkedOrder(order.id);
              } catch {
                // Error alert already shown in context
              }
            },
          },
        ]
      );
    },
    [deleteParkedOrder]
  );

  const handleBulkDelete = useCallback(
    async (rows: ParkedOrderView[]) => {
      if (rows.length === 0) {
        Alert.alert("Bulk Delete", "Please select order(s) first.");
        return;
      }
      Alert.alert(
        "Bulk Delete Parked Orders",
        `Delete ${rows.length} parked order(s)? This action cannot be undone.`,
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Delete",
            style: "destructive",
            onPress: async () => {
              try {
                for (const row of rows) {
                  await deleteParkedOrder(row.id);
                }
                setSelectedRowKeys([]);
                refresh();
                Alert.alert("Success", `${rows.length} order(s) deleted.`);
              } catch {
                // Error alert already shown in context
              }
            },
          },
        ]
      );
    },
    [deleteParkedOrder, refresh]
  );

  const { setConfig: setBulkEditConfig, setSelection: setBulkEditSelection } = useBulkEditContext();

  useEffect(() => {
    setBulkEditConfig({ label: "Bulk Delete", onPress: handleBulkDelete });
    return () => setBulkEditConfig(null);
  }, [handleBulkDelete, setBulkEditConfig]);

  const handleSelectionChange = useCallback(
    (keys: string[], rows: ParkedOrderView[]) => {
      setSelectedRowKeys(keys);
      setBulkEditSelection(rows);
    },
    [setBulkEditSelection]
  );

  const handleSearch = useCallback((item: ParkedOrderView, query: string) => {
    const q = query.toLowerCase();
    return (
      item.orderNo.toLowerCase().includes(q) ||
      item.customerName.toLowerCase().includes(q) ||
      item.businessName.toLowerCase().includes(q) ||
      item.createdByName.toLowerCase().includes(q)
    );
  }, []);

  const columns = useMemo<ColumnDefinition<ParkedOrderView>[]>(
    () => [
    {
      key: "orderNo",
      title: "Order Number",
      width: "14%",
      visible: true,
      hideable: false,
      render: (item) => (
        <Text className="text-blue-600 text-lg font-medium" numberOfLines={1}>
          {item.orderNo}
        </Text>
      ),
    },
    {
      key: "date",
      title: "Date / Time",
      width: "14%",
      visible: true,
      render: (item) => (
        <Text className="text-gray-600 text-lg">
          {formatDate(item.orderDate)}
        </Text>
      ),
    },
    {
      key: "customer",
      title: "Customer Name",
      width: "20%",
      visible: true,
      render: (item) => (
        <Text className="text-blue-600 text-base" numberOfLines={1}>
          {item.businessName || item.customerName || "Guest Customer"}
        </Text>
      ),
    },
    {
      key: "createdBy",
      title: "Created By",
      width: "12%",
      visible: true,
      render: (item) => (
        <Text className="text-gray-600 text-lg">{item.createdByName}</Text>
      ),
    },
    {
      key: "channel",
      title: "Channel Name",
      width: "12%",
      visible: true,
      render: (item) => (
        <View className="bg-pink-100 px-3 py-1 rounded self-start">
          <Text className="text-pink-600 text-sm font-medium">
            {item.channelName}
          </Text>
        </View>
      ),
    },
    {
      key: "items",
      title: "No. of Items",
      width: "8%",
      align: "center",
      visible: true,
      render: (item) => (
        <Text className="text-gray-600 text-lg">{item.itemCount}</Text>
      ),
    },
    {
      key: "total",
      title: "Total",
      width: "10%",
      visible: true,
      render: (item) => (
        <Text className="text-red-600 text-lg font-bold">
          {formatCurrency(item.totalPrice)}
        </Text>
      ),
    },
    {
      key: "status",
      title: "Status",
      width: "8%",
      visible: true,
      render: (item) => (
        <View className="bg-purple-100 px-3 py-1 rounded self-start">
          <Text className="text-purple-700 text-sm font-medium">
            {getSaleOrderStatusLabel(item.status)}
          </Text>
        </View>
      ),
    },
    {
      key: "actions",
      title: "Actions",
      width: ACTION_COL_WIDTH,
      align: "center",
      visible: true,
      render: (item) => (
        <View className="flex-row gap-4">
          <Pressable
            className="rounded-lg items-center justify-center"
            style={{ width: buttonSize.md.height, height: buttonSize.md.height, backgroundColor: colors.primaryLight, borderRadius: buttonSize.md.borderRadius }}
            onPress={() => handleResumeOrder(item)}
          >
            <Ionicons name="play-outline" size={iconSize.md} color={colors.primary} />
          </Pressable>
          <Pressable
            className="rounded-lg items-center justify-center"
            style={{ width: buttonSize.md.height, height: buttonSize.md.height, backgroundColor: colors.primaryLight, borderRadius: buttonSize.md.borderRadius }}
            onPress={() => handleDeleteOrder(item)}
          >
            <Ionicons name="trash-outline" size={iconSize.md} color={colors.primary} />
          </Pressable>
        </View>
      ),
    },
  ],
    [handleResumeOrder, handleDeleteOrder]
  );

  if (isLoading && remoteOrders.length === 0) {
    return (
      <View className="flex-1 bg-[#F7F7F9]">
        <PageHeader title="Parked Orders" showBack={false} />
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#EC1A52" />
          <Text className="text-gray-500 mt-3">Loading parked orders...</Text>
        </View>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-[#F7F7F9]">
      <PageHeader title="Parked Orders" showBack={false} />

      <DataTable<ParkedOrderView>
        data={remoteOrders}
        columns={columns}
        keyExtractor={(item) => item.id}
        searchable
        searchPlaceholder="Search Parked Orders"
        searchHint="Search by Order No, Customer Name"
        onSearch={handleSearch}
        bulkActions
        bulkActionText="Bulk Delete"
        bulkActionInActionRow
        bulkActionInSidebar
        onBulkActionPress={handleBulkDelete}
        selectedRowKeys={selectedRowKeys}
        onSelectionChange={handleSelectionChange}
        columnSelector
        toolbarButtonStyle="shopping-cart"
        onRefresh={refresh}
        horizontalScroll
        minWidth={contentWidth}
        emptyIcon="cart-outline"
        emptyText="No parked orders found"
        totalCount={count}
      />
    </View>
  );
}
