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

interface Stock {
  id: string;
  netCostPrice: number;
  onHold: number;
  salePrice: number;
  sku: string;
  upc: string;
  availableQty: number;
}

const SAMPLE_STOCKS: Stock[] = [
  { id: "1", netCostPrice: 45.00, onHold: 0, salePrice: 74.99, sku: "QB-3", upc: "097868128762", availableQty: 0 },
  { id: "2", netCostPrice: 31.80, onHold: 0, salePrice: 39.80, sku: "QB-7", upc: "855765001362", availableQty: 0 },
  { id: "3", netCostPrice: 40.00, onHold: 0, salePrice: 79.99, sku: "QB-2", upc: "097868125563", availableQty: 40 },
  { id: "4", netCostPrice: 13.99, onHold: 1, salePrice: 23.00, sku: "QB-5", upc: "00076171939937", availableQty: 0 },
  { id: "5", netCostPrice: 13.50, onHold: 1, salePrice: 25.00, sku: "QB-4", upc: "097868124467", availableQty: 99 },
  { id: "6", netCostPrice: 13.99, onHold: 0, salePrice: 23.00, sku: "QB-6", upc: "00076171934635", availableQty: 12 },
];

export default function StocksScreen() {
  const [searchQuery, setSearchQuery] = useState("");
  const [stocks] = useState<Stock[]>(SAMPLE_STOCKS);

  const filteredStocks = stocks.filter(
    (s) =>
      s.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.upc.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderStock = ({ item }: { item: Stock }) => (
    <Pressable className="flex-row items-center py-3 px-4 border-b border-gray-100 bg-white">
      <View className="w-6 mr-3">
        <View className="w-5 h-5 border border-gray-300 rounded" />
      </View>
      <Text className="w-24 text-gray-800 text-center">${item.netCostPrice.toFixed(2)}</Text>
      <Text className={`w-16 text-center ${item.onHold > 0 ? "text-blue-600" : "text-blue-600"}`}>
        {item.onHold}
      </Text>
      <Text className="w-20 text-gray-800 text-center">${item.salePrice.toFixed(2)}</Text>
      <View className="w-32">
        <Text className="text-gray-800">{item.sku} /</Text>
        <Text className="text-gray-600 text-sm">{item.upc}</Text>
      </View>
      <Text className={`flex-1 text-center font-medium ${item.availableQty > 0 ? "text-blue-600" : "text-blue-600"}`}>
        {item.availableQty}
      </Text>
    </Pressable>
  );

  return (
    <View className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-white px-4 py-4 border-b border-gray-200">
        <Text className="text-2xl font-bold text-gray-800">Stocks</Text>
      </View>

      {/* Search & Filters */}
      <View className="bg-white px-4 py-3 border-b border-gray-200">
        <View className="flex-row gap-3 mb-3">
          <View className="flex-1">
            <Text className="text-gray-500 text-sm mb-1">Search by Product Name, SKU/UPC</Text>
            <TextInput
              className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-2"
              placeholder="Search"
              placeholderTextColor="#9ca3af"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
          <View className="w-32">
            <Text className="text-gray-500 text-sm mb-1">Search by Product Status</Text>
            <View className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 flex-row items-center justify-between">
              <Text className="text-gray-800">Active</Text>
              <Ionicons name="close" size={16} color="#9ca3af" />
            </View>
          </View>
        </View>
        <View className="flex-row gap-3 items-center">
          <Pressable className="bg-yellow-500 px-4 py-2 rounded-lg flex-row items-center gap-2">
            <Ionicons name="filter" size={16} color="white" />
            <Text className="text-white font-medium">Advance Filters</Text>
          </Pressable>
          <Pressable className="bg-red-500 px-4 py-2 rounded-lg">
            <Text className="text-white font-medium">Bulk Edit Stock</Text>
          </Pressable>
          <Pressable className="bg-gray-100 px-4 py-2 rounded-lg flex-row items-center gap-2">
            <Ionicons name="grid" size={16} color="#374151" />
            <Text className="text-gray-700">Columns</Text>
          </Pressable>
        </View>
        <View className="mt-2">
          <Text className="text-gray-500 text-sm">Filters Applied: <Text className="text-blue-600">Channel:</Text> Primary</Text>
        </View>
      </View>

      {/* Table */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={{ minWidth: 550 }}>
          {/* Table Header */}
          <View className="flex-row bg-gray-50 py-3 px-4 border-b border-gray-200">
            <View className="w-6 mr-3">
              <View className="w-5 h-5 border border-gray-300 rounded" />
            </View>
            <Text className="w-24 text-gray-500 text-xs font-semibold uppercase text-center">Net Cost Prices</Text>
            <Text className="w-16 text-gray-500 text-xs font-semibold uppercase text-center">On Hold</Text>
            <Text className="w-20 text-gray-500 text-xs font-semibold uppercase text-center">Sale Price</Text>
            <Text className="w-32 text-gray-500 text-xs font-semibold uppercase">SKU/UPC</Text>
            <Text className="flex-1 text-gray-500 text-xs font-semibold uppercase text-center">Available Qty</Text>
          </View>

          {/* List */}
          <FlatList
            data={filteredStocks}
            keyExtractor={(item) => item.id}
            renderItem={renderStock}
            showsVerticalScrollIndicator={false}
          />
        </View>
      </ScrollView>
    </View>
  );
}
