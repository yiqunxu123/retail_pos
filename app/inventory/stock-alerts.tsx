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

interface StockAlert {
  id: string;
  productName: string;
  skuUpc: string;
  channelName: string;
  categoryName: string;
  availableQty: number;
  backOrderQty: number;
  totalQty: number;
  minQty: number;
  maxQty: number;
}

const SAMPLE_ALERTS: StockAlert[] = [
  // Empty for now - matching the screenshot "No Data Found"
];

export default function StockAlertsScreen() {
  const [searchQuery, setSearchQuery] = useState("");
  const [alerts] = useState<StockAlert[]>(SAMPLE_ALERTS);

  const filteredAlerts = alerts.filter(
    (a) =>
      a.productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.skuUpc.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderAlert = ({ item }: { item: StockAlert }) => (
    <Pressable className="flex-row items-center py-3 px-4 border-b border-gray-100 bg-white">
      <View className="w-6 mr-3">
        <View className="w-5 h-5 border border-gray-300 rounded" />
      </View>
      <Text className="w-32 text-gray-800">{item.productName}</Text>
      <Text className="w-28 text-gray-600">{item.skuUpc}</Text>
      <Text className="w-24 text-gray-600">{item.channelName}</Text>
      <Text className="w-24 text-gray-600">{item.categoryName}</Text>
      <Text className="w-20 text-gray-800 text-center">{item.availableQty}</Text>
      <Text className="w-20 text-gray-800 text-center">{item.backOrderQty}</Text>
      <Text className="w-16 text-gray-800 text-center">{item.totalQty}</Text>
      <Text className="w-16 text-gray-800 text-center">{item.minQty}</Text>
      <Text className="w-16 text-gray-800 text-center">{item.maxQty}</Text>
    </Pressable>
  );

  return (
    <View className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-white px-4 py-4 border-b border-gray-200">
        <Text className="text-2xl font-bold text-gray-800">Stock Alerts</Text>
      </View>

      {/* Content Card */}
      <View className="bg-white m-4 rounded-lg shadow-sm">
        {/* Title & Action */}
        <View className="flex-row items-center justify-between px-4 py-3 border-b border-gray-100">
          <View className="flex-row items-center gap-2">
            <Text className="text-lg font-semibold text-gray-800">Stock Alerts</Text>
            <Ionicons name="information-circle-outline" size={18} color="#9ca3af" />
          </View>
          <Pressable className="bg-red-500 px-4 py-2 rounded-lg">
            <Text className="text-white font-medium">Create Purchase Order</Text>
          </Pressable>
        </View>

        {/* Search */}
        <View className="px-4 py-3 border-b border-gray-100">
          <Text className="text-gray-500 text-sm mb-2">Search by Product Name, SKU/UPC</Text>
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
        </View>

        {/* Table */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={{ minWidth: 800 }}>
            {/* Table Header */}
            <View className="flex-row bg-gray-50 py-3 px-4 border-b border-gray-200">
              <View className="w-6 mr-3">
                <View className="w-5 h-5 border border-gray-300 rounded" />
              </View>
              <Text className="w-32 text-gray-500 text-xs font-semibold uppercase">Product Name</Text>
              <Text className="w-28 text-gray-500 text-xs font-semibold uppercase">SKU/UPC</Text>
              <Text className="w-24 text-gray-500 text-xs font-semibold uppercase">Channel Name</Text>
              <Text className="w-24 text-gray-500 text-xs font-semibold uppercase">Category Name</Text>
              <Text className="w-20 text-gray-500 text-xs font-semibold uppercase text-center">Available Qty</Text>
              <Text className="w-20 text-gray-500 text-xs font-semibold uppercase text-center">Back Order Qty</Text>
              <Text className="w-16 text-gray-500 text-xs font-semibold uppercase text-center">Total Qty</Text>
              <Text className="w-16 text-gray-500 text-xs font-semibold uppercase text-center">Min Qty</Text>
              <Text className="w-16 text-gray-500 text-xs font-semibold uppercase text-center">Max Qty</Text>
            </View>

            {/* Empty State or List */}
            {filteredAlerts.length === 0 ? (
              <View className="py-16 items-center">
                <View className="w-24 h-24 bg-gray-100 rounded-full items-center justify-center mb-4">
                  <Ionicons name="cloud-offline-outline" size={48} color="#d1d5db" />
                </View>
                <Text className="text-gray-400 text-lg">No Data Found</Text>
              </View>
            ) : (
              <FlatList
                data={filteredAlerts}
                keyExtractor={(item) => item.id}
                renderItem={renderAlert}
                showsVerticalScrollIndicator={false}
              />
            )}
          </View>
        </ScrollView>

        {/* Pagination */}
        <View className="px-4 py-3 border-t border-gray-100">
          <View className="flex-row items-center gap-2">
            <Text className="text-gray-600">20</Text>
            <Ionicons name="chevron-down" size={16} color="#9ca3af" />
          </View>
        </View>
      </View>
    </View>
  );
}
