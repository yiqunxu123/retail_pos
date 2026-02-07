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

import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { ActivityIndicator, Alert, Pressable, Text, View } from "react-native";
import { ColumnDefinition, DataTable, PageHeader } from "../../components";
import { useParkedOrders } from "../../contexts/ParkedOrderContext";
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
    return d.toLocaleString("en-US", {
      month: "2-digit",
      day: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  } catch {
    return dateStr;
  }
}

// ============================================================================
// Main Component
// ============================================================================

export default function ParkedOrdersScreen() {
  const { remoteOrders, deleteParkedOrder, isLoading, count } =
    useParkedOrders();

  const handleResumeOrder = (order: ParkedOrderView) => {
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
  };

  const handleDeleteOrder = (order: ParkedOrderView) => {
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
  };

  // Column configuration
  const columns: ColumnDefinition<ParkedOrderView>[] = [
    {
      key: "orderNo",
      title: "Order Number",
      width: 150,
      visible: true,
      hideable: false,
      render: (item) => (
        <Text className="text-blue-600 text-xs font-medium" numberOfLines={1}>
          {item.orderNo}
        </Text>
      ),
    },
    {
      key: "date",
      title: "Date / Time",
      width: 160,
      visible: true,
      render: (item) => (
        <Text className="text-gray-600 text-xs">
          {formatDate(item.orderDate)}
        </Text>
      ),
    },
    {
      key: "customer",
      title: "Customer Name",
      width: "flex",
      visible: true,
      render: (item) => (
        <Text className="text-blue-600 text-xs" numberOfLines={1}>
          {item.customerName || "Guest Customer"}
        </Text>
      ),
    },
    {
      key: "createdBy",
      title: "Created By",
      width: 120,
      visible: true,
      render: (item) => (
        <Text className="text-gray-600 text-xs">{item.createdByName}</Text>
      ),
    },
    {
      key: "channel",
      title: "Channel Name",
      width: 110,
      visible: true,
      render: (item) => (
        <View className="bg-pink-100 px-2 py-1 rounded self-start">
          <Text className="text-pink-600 text-xs font-medium">
            {item.channelName}
          </Text>
        </View>
      ),
    },
    {
      key: "items",
      title: "No. of Items",
      width: 90,
      align: "center",
      visible: true,
      render: (item) => (
        <Text className="text-gray-600 text-xs">{item.itemCount}</Text>
      ),
    },
    {
      key: "total",
      title: "Total",
      width: 110,
      visible: true,
      render: (item) => (
        <Text className="text-red-600 text-xs font-bold">
          {formatCurrency(item.totalPrice)}
        </Text>
      ),
    },
    {
      key: "status",
      title: "Status",
      width: 90,
      visible: true,
      render: (item) => (
        <View className="bg-purple-100 px-2 py-1 rounded self-start">
          <Text className="text-purple-700 text-xs font-medium">
            {getSaleOrderStatusLabel(item.status)}
          </Text>
        </View>
      ),
    },
    {
      key: "actions",
      title: "Actions",
      width: 80,
      align: "center",
      visible: true,
      hideable: false,
      render: (item) => (
        <View className="flex-row gap-2">
          <Pressable
            className="bg-red-50 p-1.5 rounded"
            onPress={() => handleResumeOrder(item)}
          >
            <Ionicons name="play-outline" size={14} color="#EC1A52" />
          </Pressable>
          <Pressable
            className="bg-red-50 p-1.5 rounded"
            onPress={() => handleDeleteOrder(item)}
          >
            <Ionicons name="trash-outline" size={14} color="#EC1A52" />
          </Pressable>
        </View>
      ),
    },
  ];

  const handleSearch = (item: ParkedOrderView, query: string) => {
    const q = query.toLowerCase();
    return (
      item.orderNo.toLowerCase().includes(q) ||
      item.customerName.toLowerCase().includes(q) ||
      item.businessName.toLowerCase().includes(q) ||
      item.createdByName.toLowerCase().includes(q)
    );
  };

  if (isLoading && remoteOrders.length === 0) {
    return (
      <View className="flex-1 bg-gray-50">
        <PageHeader title="Parked Orders" />
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#EC1A52" />
          <Text className="text-gray-500 mt-3">Loading parked orders...</Text>
        </View>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-50">
      <PageHeader title="Parked Orders" />

      <DataTable<ParkedOrderView>
        data={remoteOrders}
        columns={columns}
        keyExtractor={(item) => item.id}
        searchable
        searchPlaceholder="Search Parked Orders"
        searchHint="Search by Order No, Customer Name"
        onSearch={handleSearch}
        columnSelector
        emptyIcon="cart-outline"
        emptyText="No parked orders found"
        totalCount={count}
      />
    </View>
  );
}
