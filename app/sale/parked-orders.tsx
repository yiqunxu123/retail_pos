/**
 * Parked Orders Screen
 * Uses the unified DataTable component
 */

import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Alert, Pressable, Text, View } from "react-native";
import { ColumnDefinition, DataTable, PageHeader } from "../../components";
import { useParkedOrders } from "../../contexts/ParkedOrderContext";

// ============================================================================
// Types
// ============================================================================

interface ParkedOrder {
  id: string;
  orderNo: string;
  date: string;
  customer: string;
  createdBy: string;
  channel: string;
  items: number;
  total: number;
  status: string;
  isReal?: boolean;
}

// ============================================================================
// Mock Data
// ============================================================================

const MOCK_PARKED_ORDERS: ParkedOrder[] = [
  { id: "mock-1", orderNo: "SO-260128-05944", date: "01/28/2026, 09:49:11", customer: "Test Customer Name", createdBy: "User 1", channel: "Primary", items: 32, total: 88888.00, status: "Parked" },
  { id: "mock-2", orderNo: "SO-260128-05945", date: "01/28/2026, 09:49:11", customer: "Test Customer Name", createdBy: "User 1", channel: "Primary", items: 32, total: 88888.00, status: "Parked" },
  { id: "mock-3", orderNo: "SO-260128-05946", date: "01/28/2026, 09:49:11", customer: "Test Customer Name", createdBy: "User 1", channel: "Primary", items: 32, total: 88888.00, status: "Parked" },
  { id: "mock-4", orderNo: "SO-260128-05947", date: "01/28/2026, 09:49:11", customer: "Test Customer Name", createdBy: "User 1", channel: "Primary", items: 32, total: 88888.00, status: "Parked" },
  { id: "mock-5", orderNo: "SO-260128-05948", date: "01/28/2026, 09:49:11", customer: "Test Customer Name", createdBy: "User 1", channel: "Primary", items: 32, total: 88888.00, status: "Parked" },
];

// ============================================================================
// Helper Functions
// ============================================================================

function formatCurrency(value: number): string {
  return `$${value.toFixed(2)}`;
}

// ============================================================================
// Main Component
// ============================================================================

export default function ParkedOrdersScreen() {
  const { parkedOrders, resumeOrder } = useParkedOrders();

  // Combine mock data with actual parked orders
  const allOrders: ParkedOrder[] = [
    ...parkedOrders.map(p => ({
      id: p.id,
      orderNo: `PO-${p.id.slice(0, 6)}`,
      date: new Date(p.parkedAt).toLocaleString(),
      customer: p.customerName || "Guest Customer",
      createdBy: "Staff",
      channel: "POS",
      items: p.products.reduce((sum, item) => sum + item.quantity, 0),
      total: p.total,
      status: "Parked",
      isReal: true,
    })),
    ...MOCK_PARKED_ORDERS
  ];

  const handleResumeOrder = (orderId: string, isReal?: boolean) => {
    if (isReal) {
      resumeOrder(orderId);
      router.push("/order/add-products");
    } else {
      Alert.alert("Resume Order", "This is a mock order. In a real app, this would resume the selected order.");
    }
  };

  // 列配置
  const columns: ColumnDefinition<ParkedOrder>[] = [
    {
      key: "orderNo",
      title: "Order Number",
      width: 130,
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
      width: 150,
      visible: true,
      render: (item) => <Text className="text-gray-600 text-xs">{item.date}</Text>,
    },
    {
      key: "customer",
      title: "Customer Name",
      width: "flex",
      visible: true,
      render: (item) => (
        <Text className="text-blue-600 text-xs" numberOfLines={1}>{item.customer}</Text>
      ),
    },
    {
      key: "createdBy",
      title: "Created By",
      width: 100,
      visible: true,
      render: (item) => <Text className="text-gray-600 text-xs">{item.createdBy}</Text>,
    },
    {
      key: "channel",
      title: "Channel Name",
      width: 100,
      visible: true,
      render: (item) => (
        <View className="bg-pink-100 px-2 py-1 rounded self-start">
          <Text className="text-pink-600 text-xs font-medium">{item.channel}</Text>
        </View>
      ),
    },
    {
      key: "items",
      title: "No. of Items",
      width: 90,
      align: "center",
      visible: true,
      render: (item) => <Text className="text-gray-600 text-xs">{item.items}</Text>,
    },
    {
      key: "total",
      title: "Total",
      width: 110,
      visible: true,
      render: (item) => (
        <Text className="text-red-600 text-xs font-bold">{formatCurrency(item.total)}</Text>
      ),
    },
    {
      key: "status",
      title: "Status",
      width: 90,
      visible: true,
      render: (item) => (
        <View className="bg-purple-100 px-2 py-1 rounded self-start">
          <Text className="text-purple-700 text-xs font-medium">{item.status}</Text>
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
            onPress={() => handleResumeOrder(item.id, item.isReal)}
          >
            <Ionicons name="play-outline" size={14} color="#EC1A52" />
          </Pressable>
          <Pressable className="bg-red-50 p-1.5 rounded">
            <Ionicons name="eye-outline" size={14} color="#EC1A52" />
          </Pressable>
        </View>
      ),
    },
  ];

  const handleSearch = (item: ParkedOrder, query: string) => {
    const q = query.toLowerCase();
    return (
      item.orderNo.toLowerCase().includes(q) ||
      item.customer.toLowerCase().includes(q)
    );
  };

  return (
    <View className="flex-1 bg-gray-50">
      <PageHeader title="Parked Orders" />

      <DataTable<ParkedOrder>
        data={allOrders}
        columns={columns}
        keyExtractor={(item) => item.id}
        searchable
        searchPlaceholder="Search Products"
        searchHint="Search by Customer Name, SKU, UPC"
        onSearch={handleSearch}
        columnSelector
        emptyIcon="cart-outline"
        emptyText="No parked orders found"
        totalCount={allOrders.length}
      />
    </View>
  );
}
