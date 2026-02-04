import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useState } from "react";
import {
  Alert,
  FlatList,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { useParkedOrders } from "../../contexts/ParkedOrderContext";
import StaffPageLayout, { SidebarButton } from "../../components/StaffPageLayout";

// Mock data for demonstration
const MOCK_PARKED_ORDERS = [
  { id: "1", orderNo: "SO-260128-05944", date: "01/28/2026, 09:49:11", customer: "Test Customer Name", createdBy: "User 1", channel: "Primary", items: 32, total: 88888.00, status: "Parked" },
  { id: "2", orderNo: "SO-260128-05944", date: "01/28/2026, 09:49:11", customer: "Test Customer Name", createdBy: "User 1", channel: "Primary", items: 32, total: 88888.00, status: "Parked" },
  { id: "3", orderNo: "SO-260128-05944", date: "01/28/2026, 09:49:11", customer: "Test Customer Name", createdBy: "User 1", channel: "Primary", items: 32, total: 88888.00, status: "Parked" },
  { id: "4", orderNo: "SO-260128-05944", date: "01/28/2026, 09:49:11", customer: "Test Customer Name", createdBy: "User 1", channel: "Primary", items: 32, total: 88888.00, status: "Parked" },
  { id: "5", orderNo: "SO-260128-05944", date: "01/28/2026, 09:49:11", customer: "Test Customer Name", createdBy: "User 1", channel: "Primary", items: 32, total: 88888.00, status: "Parked" },
  { id: "6", orderNo: "SO-260128-05944", date: "01/28/2026, 09:49:11", customer: "Test Customer Name", createdBy: "User 1", channel: "Primary", items: 32, total: 88888.00, status: "Parked" },
  { id: "7", orderNo: "SO-260128-05944", date: "01/28/2026, 09:49:11", customer: "Test Customer Name", createdBy: "User 1", channel: "Primary", items: 32, total: 88888.00, status: "Parked" },
  { id: "8", orderNo: "SO-260128-05944", date: "01/28/2026, 09:49:11", customer: "Test Customer Name", createdBy: "User 1", channel: "Primary", items: 32, total: 88888.00, status: "Parked" },
  { id: "9", orderNo: "SO-260128-05944", date: "01/28/2026, 09:49:11", customer: "Test Customer Name", createdBy: "User 1", channel: "Primary", items: 32, total: 88888.00, status: "Parked" },
  { id: "10", orderNo: "SO-260128-05944", date: "01/28/2026, 09:49:11", customer: "Test Customer Name", createdBy: "User 1", channel: "Primary", items: 32, total: 88888.00, status: "Parked" },
];

function formatCurrency(value: number): string {
  return `$${value.toFixed(2)}`;
}

export default function ParkedOrdersScreen() {
  const { parkedOrders, resumeOrder } = useParkedOrders();
  const [searchQuery, setSearchQuery] = useState("");

  // Combine mock data with actual parked orders
  // In a real app, you would fetch from API
  const allOrders = [
    ...parkedOrders.map(p => ({
      id: p.id,
      orderNo: `PO-${p.id.slice(0, 6)}`,
      date: new Date(p.parkedAt).toLocaleString(),
      customer: p.customerName || "Guest Customer",
      createdBy: "Staff",
      channel: "POS",
      items: p.products.reduce((sum, item) => sum + item.quantity, 0),
      total: p.total,
      status: "Parked"
    })),
    ...MOCK_PARKED_ORDERS
  ];

  const handleResumeOrder = (orderId: string) => {
    // Check if it's a real parked order
    const realOrder = parkedOrders.find(p => p.id === orderId);
    if (realOrder) {
      resumeOrder(orderId);
      router.push("/order/add-products");
    } else {
      Alert.alert("Resume Order", "This is a mock order. In a real app, this would resume the selected order.");
    }
  };

  // Custom Sidebar Buttons
  const sidebarButtons = (
    <>
      <SidebarButton 
        title="Resume Order"
        icon={<Ionicons name="play-outline" size={20} color="#EC1A52" />}
        onPress={() => Alert.alert("Resume", "Select an order to resume")}
      />
      <SidebarButton 
        title="Print Invoice"
        icon={<Ionicons name="print-outline" size={20} color="#EC1A52" />}
        onPress={() => Alert.alert("Print", "Printing invoice...")}
      />
      <SidebarButton 
        title="View Invoice"
        icon={<Ionicons name="document-text-outline" size={20} color="#EC1A52" />}
        onPress={() => Alert.alert("View Invoice", "Select an order to view invoice")}
      />
      <SidebarButton 
        title="Edit Order"
        icon={<Ionicons name="create-outline" size={20} color="#EC1A52" />}
        onPress={() => Alert.alert("Edit Order", "Select an order to edit")}
      />
    </>
  );

  const renderOrderRow = ({ item, index }: { item: any; index: number }) => (
    <View 
      className={`flex-row items-center px-4 py-3 border-b border-gray-100 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}
    >
      <Text className="w-32 text-blue-600 text-xs font-medium" numberOfLines={1}>
        {item.orderNo}
      </Text>
      <Text className="w-40 text-gray-600 text-xs">
        {item.date}
      </Text>
      <Text className="w-40 text-blue-600 text-xs" numberOfLines={1}>
        {item.customer}
      </Text>
      <Text className="w-24 text-gray-600 text-xs">{item.createdBy}</Text>
      <View className="w-24">
        <View className="bg-pink-100 px-2 py-1 rounded self-start">
          <Text className="text-pink-600 text-xs font-medium">{item.channel}</Text>
        </View>
      </View>
      <Text className="w-24 text-gray-600 text-xs text-center">{item.items}</Text>
      <Text className="w-28 text-red-600 text-xs font-bold">
        {formatCurrency(item.total)}
      </Text>
      <View className="w-24">
        <View className="bg-purple-100 px-2 py-1 rounded self-start">
          <Text className="text-purple-700 text-xs font-medium">{item.status}</Text>
        </View>
      </View>
      <View className="w-20 flex-row gap-2">
        <Pressable 
          className="bg-red-50 p-1.5 rounded"
          onPress={() => handleResumeOrder(item.id)}
        >
          <Ionicons name="play-outline" size={14} color="#EC1A52" />
        </Pressable>
        <Pressable className="bg-red-50 p-1.5 rounded">
          <Ionicons name="eye-outline" size={14} color="#EC1A52" />
        </Pressable>
      </View>
    </View>
  );

  return (
    <StaffPageLayout sidebarCustomButtons={sidebarButtons}>
      <View className="flex-1 bg-white">
        {/* Header */}
        <View className="px-6 py-4">
          <Text className="text-2xl font-bold text-gray-900">Parked Orders</Text>
          <Text className="text-gray-500 text-sm mt-1">Search by Customer Name, SKU, UPC</Text>
        </View>

        {/* Search Bar */}
        <View className="px-6 pb-4">
          <View className="flex-row items-center gap-3">
            <View className="flex-1 flex-row items-center bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
              <Ionicons name="search" size={18} color="#9CA3AF" />
              <TextInput
                className="flex-1 ml-2 text-gray-800"
                placeholder="Search Products"
                placeholderTextColor="#9CA3AF"
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
            </View>
            <Pressable 
              className="flex-row items-center gap-2 px-6 py-3 rounded-lg"
              style={{ backgroundColor: "#EC1A52" }}
            >
              <Ionicons name="refresh" size={18} color="white" />
              <Text className="text-white font-medium">Refresh</Text>
            </Pressable>
            <Pressable className="bg-gray-900 p-3 rounded-lg">
              <Ionicons name="settings-outline" size={20} color="white" />
            </Pressable>
          </View>
        </View>

        {/* Table */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-1">
          <View style={{ minWidth: 1000 }}>
            {/* Table Header */}
            <View className="flex-row bg-gray-50 py-3 px-4 border-y border-gray-200">
              <Text className="w-32 text-gray-500 text-xs font-semibold">Order Number</Text>
              <Text className="w-40 text-gray-500 text-xs font-semibold">Date / Time</Text>
              <Text className="w-40 text-gray-500 text-xs font-semibold">Customer Name</Text>
              <Text className="w-24 text-gray-500 text-xs font-semibold">Created By</Text>
              <Text className="w-24 text-gray-500 text-xs font-semibold">Chanel Name</Text>
              <Text className="w-24 text-gray-500 text-xs font-semibold text-center">No. of Items</Text>
              <Text className="w-28 text-gray-500 text-xs font-semibold">Total</Text>
              <Text className="w-24 text-gray-500 text-xs font-semibold">Status</Text>
              <Text className="w-20 text-gray-500 text-xs font-semibold">Actions</Text>
            </View>

            <FlatList
              data={allOrders}
              keyExtractor={(item) => item.id}
              renderItem={renderOrderRow}
              showsVerticalScrollIndicator={false}
            />
          </View>
        </ScrollView>

        {/* Pagination */}
        <View className="flex-row items-center justify-between px-4 py-3 border-t border-gray-200">
          <View className="flex-row items-center gap-2">
            <Pressable className="w-8 h-8 items-center justify-center rounded border border-gray-200">
              <Ionicons name="chevron-back" size={16} color="#9CA3AF" />
            </Pressable>
            <Pressable 
              className="w-8 h-8 items-center justify-center rounded"
              style={{ backgroundColor: "#EC1A52" }}
            >
              <Text className="text-white font-medium">1</Text>
            </Pressable>
            <Pressable className="w-8 h-8 items-center justify-center rounded border border-gray-200">
              <Text className="text-gray-600">2</Text>
            </Pressable>
            <Pressable className="w-8 h-8 items-center justify-center rounded border border-gray-200">
              <Text className="text-gray-600">3</Text>
            </Pressable>
            <Pressable className="w-8 h-8 items-center justify-center rounded border border-gray-200">
              <Ionicons name="chevron-forward" size={16} color="#9CA3AF" />
            </Pressable>
          </View>
          <View className="flex-row items-center gap-2">
            <Pressable className="flex-row items-center gap-2 px-3 py-2 rounded border border-gray-200">
              <Text className="text-gray-600">10/Page</Text>
              <Ionicons name="chevron-down" size={14} color="#6B7280" />
            </Pressable>
          </View>
        </View>
      </View>
    </StaffPageLayout>
  );
}
