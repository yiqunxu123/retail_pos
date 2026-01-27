import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import {
  FlatList,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";

interface Order {
  id: string;
  orderNumber: string;
  dateTime: string;
  businessName: string;
  customerName: string;
  createdBy: string;
  saleTotal: number;
  invoiceStatus: "Paid" | "Un Paid" | "Partially";
}

const SAMPLE_ORDERS: Order[] = [
  { id: "1", orderNumber: "SO-260126-05915", dateTime: "01/26/2026, 07:00:21, CST", businessName: "TEST CUSTOMER", customerName: "Test Customer", createdBy: "discountws", saleTotal: 45.00, invoiceStatus: "Un Paid" },
  { id: "2", orderNumber: "SO-260126-05914", dateTime: "01/26/2026, 06:59:08, CST", businessName: "Test customer 22", customerName: "John Doe", createdBy: "umar123", saleTotal: 45.00, invoiceStatus: "Partially" },
  { id: "3", orderNumber: "SO-260126-05913", dateTime: "01/26/2026, 06:57:52, CST", businessName: "TEST CUSTOMER", customerName: "Test Customer", createdBy: "discountws", saleTotal: 90.00, invoiceStatus: "Paid" },
  { id: "4", orderNumber: "SO-260126-05912", dateTime: "01/26/2026, 06:41:16, CST", businessName: "Spirit Wholesale", customerName: "Spirit Inc", createdBy: "umar123", saleTotal: 146.93, invoiceStatus: "Un Paid" },
  { id: "5", orderNumber: "SO-260126-05911", dateTime: "01/26/2026, 06:35:22, CST", businessName: "ABC Retail Store", customerName: "Mike Smith", createdBy: "admin", saleTotal: 289.50, invoiceStatus: "Paid" },
  { id: "6", orderNumber: "SO-260126-05910", dateTime: "01/26/2026, 06:20:15, CST", businessName: "Quick Mart LLC", customerName: "Sarah Johnson", createdBy: "discountws", saleTotal: 567.25, invoiceStatus: "Partially" },
];

// Order statistics
const ORDER_STATS = [
  { label: "Pending", value: 18, color: "text-gray-700" },
  { label: "Picker Assigned", value: 0, color: "text-gray-700" },
  { label: "Partially Executed", value: 0, color: "text-gray-700" },
  { label: "Picking in progress", value: 1, color: "text-green-600" },
  { label: "Picking Paused", value: 0, color: "text-red-500" },
  { label: "Picking Completed", value: 0, color: "text-green-600" },
  { label: "Packing in progress", value: 0, color: "text-blue-600" },
  { label: "Packed", value: 36, color: "text-blue-600" },
  { label: "Executed", value: 294, color: "text-gray-700" },
  { label: "Completed", value: 4746, color: "text-green-600" },
  { label: "Partially Returned", value: 0, color: "text-gray-700" },
  { label: "Parked", value: 3, color: "text-red-500" },
];

// Invoice status colors
const statusColors: Record<Order["invoiceStatus"], { bg: string; text: string }> = {
  "Paid": { bg: "bg-green-500", text: "text-white" },
  "Un Paid": { bg: "bg-red-500", text: "text-white" },
  "Partially": { bg: "bg-yellow-500", text: "text-white" },
};

const TABS = ["Orders", "Voided"];

export default function SalesHistoryScreen() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("Orders");
  const [orders] = useState<Order[]>(SAMPLE_ORDERS);

  const filteredOrders = orders.filter(
    (o) =>
      o.businessName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.orderNumber.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderOrder = ({ item }: { item: Order }) => (
    <View className="flex-row items-center py-3 px-4 border-b border-gray-100 bg-white">
      <View className="w-6 mr-3">
        <View className="w-5 h-5 border border-gray-300 rounded" />
      </View>
      <Text className="w-36 text-blue-600 font-medium">{item.orderNumber}</Text>
      <Text className="w-44 text-gray-600 text-sm">{item.dateTime}</Text>
      <View className="w-48">
        <Text className="text-blue-600 font-medium" numberOfLines={1}>{item.businessName}</Text>
        <Text className="text-gray-500 text-sm" numberOfLines={1}>{item.customerName}</Text>
      </View>
      <Text className="w-28 text-gray-600 text-center">{item.createdBy}</Text>
      <View className="w-24 items-center">
        <View className="bg-yellow-400 px-3 py-1 rounded">
          <Text className="text-gray-800 font-bold">${item.saleTotal.toFixed(2)}</Text>
        </View>
      </View>
      <View className="w-24 items-center">
        <View className={`px-3 py-1 rounded ${statusColors[item.invoiceStatus].bg}`}>
          <Text className={`font-medium text-sm ${statusColors[item.invoiceStatus].text}`}>
            {item.invoiceStatus}
          </Text>
        </View>
      </View>
      <View className="w-20 flex-row items-center justify-center gap-1">
        <Pressable className="bg-blue-100 p-1.5 rounded">
          <Ionicons name="eye" size={14} color="#3b82f6" />
        </Pressable>
        <Pressable className="bg-gray-100 p-1.5 rounded">
          <Ionicons name="ellipsis-horizontal" size={14} color="#6b7280" />
        </Pressable>
      </View>
    </View>
  );

  return (
    <View className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-white px-4 py-4 border-b border-gray-200">
        <Text className="text-2xl font-bold text-gray-800">Sales History</Text>
      </View>

      {/* Tabs */}
      <View className="bg-white flex-row border-b border-gray-200">
        {TABS.map((tab) => (
          <Pressable
            key={tab}
            onPress={() => setActiveTab(tab)}
            className={`px-6 py-3 ${
              activeTab === tab ? "border-b-2 border-blue-500" : ""
            }`}
          >
            <Text
              className={`font-medium ${
                activeTab === tab ? "text-blue-500" : "text-gray-600"
              }`}
            >
              {tab}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Order Statistics */}
      <View className="bg-white px-4 py-3 border-b border-gray-200">
        <Text className="text-lg font-semibold text-gray-800 mb-3">Orders</Text>
        <View className="flex-row flex-wrap gap-x-6 gap-y-2">
          {ORDER_STATS.map((stat, index) => (
            <View key={index} className="flex-row items-center">
              <Text className="text-gray-600 text-sm">{stat.label} : </Text>
              <Text className={`font-semibold ${stat.color}`}>{stat.value}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Search & Actions */}
      <View className="bg-white px-4 py-3 border-b border-gray-200">
        <Text className="text-gray-500 text-sm mb-2">
          Search by Customer (Name, Phone, Address), Business Name, Order no
        </Text>
        <View className="flex-row items-center gap-3 mb-3">
          <TextInput
            className="flex-1 bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5"
            placeholder="Search"
            placeholderTextColor="#9ca3af"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          <Pressable className="bg-gray-100 px-4 py-2.5 rounded-lg flex-row items-center gap-2">
            <Ionicons name="filter" size={16} color="#374151" />
            <Text className="text-gray-700 font-medium">Advance Filters</Text>
          </Pressable>
        </View>
        <View className="flex-row items-center justify-between">
          <View className="flex-row gap-2">
            <Pressable className="bg-blue-500 px-4 py-2.5 rounded-lg flex-row items-center gap-2">
              <Ionicons name="print" size={16} color="white" />
              <Text className="text-white font-medium">Print Invoice</Text>
            </Pressable>
            <Pressable className="bg-gray-100 px-4 py-2.5 rounded-lg flex-row items-center gap-2">
              <Ionicons name="lock-closed" size={16} color="#374151" />
              <Text className="text-gray-700 font-medium">Freeze Columns</Text>
            </Pressable>
            <Pressable className="bg-gray-100 px-4 py-2.5 rounded-lg flex-row items-center gap-2">
              <Ionicons name="grid" size={16} color="#374151" />
              <Text className="text-gray-700">Columns</Text>
            </Pressable>
          </View>
          <Pressable className="bg-green-500 px-4 py-2.5 rounded-lg">
            <Text className="text-white font-medium">Add Order</Text>
          </Pressable>
        </View>
      </View>

      {/* Table */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={{ minWidth: 950 }}>
          {/* Table Header */}
          <View className="flex-row bg-gray-50 py-3 px-4 border-b border-gray-200">
            <View className="w-6 mr-3">
              <View className="w-5 h-5 border border-gray-300 rounded" />
            </View>
            <Text className="w-36 text-gray-500 text-xs font-semibold uppercase">Order Number</Text>
            <Text className="w-44 text-gray-500 text-xs font-semibold uppercase">Date / Time</Text>
            <Text className="w-48 text-gray-500 text-xs font-semibold uppercase">Business Name / Customer Name</Text>
            <Text className="w-28 text-gray-500 text-xs font-semibold uppercase text-center">Created By</Text>
            <Text className="w-24 text-gray-500 text-xs font-semibold uppercase text-center">Sale Total</Text>
            <Text className="w-24 text-gray-500 text-xs font-semibold uppercase text-center">Invoice Status</Text>
            <Text className="w-20 text-gray-500 text-xs font-semibold uppercase text-center">Actions</Text>
          </View>

          {/* List */}
          <FlatList
            data={filteredOrders}
            keyExtractor={(item) => item.id}
            renderItem={renderOrder}
            showsVerticalScrollIndicator={false}
          />
        </View>
      </ScrollView>
    </View>
  );
}
