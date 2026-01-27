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

interface SalesReturn {
  id: string;
  returnNumber: string;
  dateTime: string;
  businessName: string;
  customerName: string;
  channelName: string;
  soldBy: string;
  invoiceTotal: number;
  returnedTotal: number;
  status: "Completed" | "Pending" | "Processing" | "Rejected";
}

const SAMPLE_RETURNS: SalesReturn[] = [
  { id: "1", returnNumber: "RE-260121-05890", dateTime: "01/21/2026, 07:45:09, CST", businessName: "RAJ PATEL/ OM JAY KALI INC", customerName: "Raj Patel", channelName: "Primary", soldBy: "Admin/Cashier", invoiceTotal: 245.50, returnedTotal: 89.99, status: "Completed" },
  { id: "2", returnNumber: "RE-260120-05868", dateTime: "01/20/2026, 12:42:34, CST", businessName: "A&J EXPRESS INC/ NEW HOPE WAVAHO", customerName: "NEHA SANKET PATEL", channelName: "Primary", soldBy: "Admin/Cashier", invoiceTotal: 532.00, returnedTotal: 150.00, status: "Pending" },
  { id: "3", returnNumber: "RE-260120-05865", dateTime: "01/20/2026, 12:01:15, CST", businessName: "A&J EXPRESS INC/ NEW HOPE WAVAHO", customerName: "NEHA SANKET PATEL", channelName: "Primary", soldBy: "Admin/Cashier", invoiceTotal: 178.25, returnedTotal: 178.25, status: "Processing" },
  { id: "4", returnNumber: "RE-260120-05859", dateTime: "01/20/2026, 10:32:04, CST", businessName: "JAY SHIV LLC", customerName: "AMITKUMAR PATEL/ BHAVESHBHAI PATEL", channelName: "Primary", soldBy: "Admin/Cashier", invoiceTotal: 890.00, returnedTotal: 45.00, status: "Rejected" },
];

// Status badge colors
const statusColors: Record<SalesReturn["status"], { bg: string; text: string }> = {
  Completed: { bg: "bg-green-100", text: "text-green-700" },
  Pending: { bg: "bg-yellow-100", text: "text-yellow-700" },
  Processing: { bg: "bg-blue-100", text: "text-blue-700" },
  Rejected: { bg: "bg-red-100", text: "text-red-700" },
};

export default function SalesReturnScreen() {
  const [searchQuery, setSearchQuery] = useState("");
  const [returns] = useState<SalesReturn[]>(SAMPLE_RETURNS);

  const filteredReturns = returns.filter(
    (r) =>
      r.businessName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.returnNumber.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderReturn = ({ item }: { item: SalesReturn }) => (
    <View className="flex-row items-center py-3 px-4 border-b border-gray-100 bg-white">
      <View className="w-6 mr-3">
        <View className="w-5 h-5 border border-gray-300 rounded" />
      </View>
      <Text className="w-32 text-blue-600 font-medium">{item.returnNumber}</Text>
      <Text className="w-44 text-gray-600 text-sm">{item.dateTime}</Text>
      <View className="w-56">
        <Text className="text-blue-600" numberOfLines={1}>{item.businessName}</Text>
        <Text className="text-blue-500 text-sm" numberOfLines={1}>{item.customerName}</Text>
      </View>
      <Text className="w-20 text-gray-600 text-center">{item.channelName}</Text>
      <Text className="w-24 text-gray-600 text-center">{item.soldBy}</Text>
      <Text className="w-24 text-gray-800 text-center font-medium">${item.invoiceTotal.toFixed(2)}</Text>
      <Text className="w-24 text-red-600 text-center font-medium">${item.returnedTotal.toFixed(2)}</Text>
      <View className="w-24 items-center">
        <View className={`px-2 py-1 rounded-full ${statusColors[item.status].bg}`}>
          <Text className={`text-xs font-medium ${statusColors[item.status].text}`}>{item.status}</Text>
        </View>
      </View>
      <View className="w-24 flex-row items-center justify-center gap-2">
        <Pressable 
          className="bg-blue-100 p-2 rounded-lg"
          onPress={() => console.log("View", item.id)}
        >
          <Ionicons name="eye" size={16} color="#3b82f6" />
        </Pressable>
        <Pressable 
          className="bg-green-100 p-2 rounded-lg"
          onPress={() => console.log("Edit", item.id)}
        >
          <Ionicons name="pencil" size={16} color="#22c55e" />
        </Pressable>
        <Pressable 
          className="bg-red-100 p-2 rounded-lg"
          onPress={() => console.log("Delete", item.id)}
        >
          <Ionicons name="trash" size={16} color="#ef4444" />
        </Pressable>
      </View>
    </View>
  );

  return (
    <View className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-white px-4 py-4 border-b border-gray-200">
        <Text className="text-2xl font-bold text-gray-800">Sales Return</Text>
      </View>

      {/* Search & Actions */}
      <View className="bg-white px-4 py-4 border-b border-gray-200">
        <View className="flex-row items-center justify-between mb-3">
          <Text className="text-lg font-semibold text-gray-800">Sales Return</Text>
          <Pressable className="bg-red-500 px-4 py-2 rounded-lg">
            <Text className="text-white font-medium">Create Sale Return</Text>
          </Pressable>
        </View>
        <View className="flex-row gap-3">
          <TextInput
            className="flex-1 bg-gray-50 border border-gray-200 rounded-lg px-4 py-2"
            placeholder="Search"
            placeholderTextColor="#9ca3af"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          <Pressable className="bg-gray-100 px-4 py-2 rounded-lg flex-row items-center gap-2">
            <Ionicons name="filter" size={16} color="#374151" />
            <Text className="text-gray-700">Advance Filters</Text>
          </Pressable>
        </View>
        <Text className="text-gray-400 text-sm mt-1">
          Search by Customer (Name, Phone, Address), Business Name, Order no
        </Text>
      </View>

      {/* Table */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={{ minWidth: 1100 }}>
          {/* Table Header */}
          <View className="flex-row bg-gray-50 py-3 px-4 border-b border-gray-200">
            <View className="w-6 mr-3">
              <View className="w-5 h-5 border border-gray-300 rounded" />
            </View>
            <Text className="w-32 text-gray-500 text-xs font-semibold uppercase">Return Number</Text>
            <Text className="w-44 text-gray-500 text-xs font-semibold uppercase">Date / Time</Text>
            <Text className="w-56 text-gray-500 text-xs font-semibold uppercase">Business / Customer</Text>
            <Text className="w-20 text-gray-500 text-xs font-semibold uppercase text-center">Channel</Text>
            <Text className="w-24 text-gray-500 text-xs font-semibold uppercase text-center">Sold By</Text>
            <Text className="w-24 text-gray-500 text-xs font-semibold uppercase text-center">Invoice Total</Text>
            <Text className="w-24 text-gray-500 text-xs font-semibold uppercase text-center">Returned Total</Text>
            <Text className="w-24 text-gray-500 text-xs font-semibold uppercase text-center">Status</Text>
            <Text className="w-24 text-gray-500 text-xs font-semibold uppercase text-center">Actions</Text>
          </View>

          {/* List */}
          <FlatList
            data={filteredReturns}
            keyExtractor={(item) => item.id}
            renderItem={renderReturn}
            showsVerticalScrollIndicator={false}
          />
        </View>
      </ScrollView>
    </View>
  );
}
