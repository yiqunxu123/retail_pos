import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import {
  FlatList,
  Image,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";

interface Product {
  id: string;
  variant: boolean;
  name: string;
  onlineSale: boolean;
  netCostPrice: number;
  baseCostPrice: number;
  salePrice: number;
  isMSA: boolean;
  imageUrl?: string;
}

const SAMPLE_PRODUCTS: Product[] = [
  { id: "1", variant: false, name: "Pillow", onlineSale: false, netCostPrice: 12, baseCostPrice: 10, salePrice: 20, isMSA: false },
  { id: "2", variant: false, name: "Desi drink 420", onlineSale: true, netCostPrice: 20, baseCostPrice: 20, salePrice: 25, isMSA: false },
  { id: "3", variant: true, name: "MEXICAN CHIPS 1CT 100g-tazm", onlineSale: false, netCostPrice: 420, baseCostPrice: 420, salePrice: 500, isMSA: false },
  { id: "4", variant: false, name: "Energy Drink XL", onlineSale: true, netCostPrice: 5, baseCostPrice: 4.50, salePrice: 8, isMSA: true },
  { id: "5", variant: false, name: "Snack Pack Mix", onlineSale: true, netCostPrice: 15, baseCostPrice: 12, salePrice: 22, isMSA: false },
];

export default function ProductsScreen() {
  const [searchQuery, setSearchQuery] = useState("");
  const [products] = useState<Product[]>(SAMPLE_PRODUCTS);

  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderProduct = ({ item }: { item: Product }) => (
    <Pressable className="flex-row items-center py-3 px-4 border-b border-gray-100 bg-white">
      <View className="w-6 mr-3">
        <View className="w-5 h-5 border border-gray-300 rounded" />
      </View>
      <Text className="w-12 text-gray-600 text-center">{item.variant ? "Yes" : "No"}</Text>
      <Text className="w-40 text-blue-600 font-medium">{item.name}</Text>
      <View className="w-20 items-center">
        {item.onlineSale ? (
          <Ionicons name="checkmark-circle" size={20} color="#22c55e" />
        ) : (
          <Ionicons name="close-circle" size={20} color="#ef4444" />
        )}
      </View>
      <Text className="w-24 text-gray-800 text-center">${item.netCostPrice}</Text>
      <Text className="w-24 text-gray-800 text-center">${item.baseCostPrice}</Text>
      <Text className="w-20 text-blue-600 text-center">${item.salePrice}</Text>
      <View className="w-16 items-center">
        {item.isMSA ? (
          <Ionicons name="checkmark-circle" size={20} color="#22c55e" />
        ) : (
          <Ionicons name="close-circle" size={20} color="#ef4444" />
        )}
      </View>
      <View className="w-16 h-12 bg-gray-100 rounded items-center justify-center">
        {item.imageUrl ? (
          <Image source={{ uri: item.imageUrl }} className="w-full h-full rounded" />
        ) : (
          <Ionicons name="image-outline" size={24} color="#d1d5db" />
        )}
      </View>
    </Pressable>
  );

  return (
    <View className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-white px-4 py-4 border-b border-gray-200">
        <Text className="text-2xl font-bold text-gray-800">Products</Text>
      </View>

      {/* Actions & Search */}
      <View className="bg-white px-4 py-3 border-b border-gray-200">
        {/* Title & Actions */}
        <View className="flex-row items-center justify-between mb-3">
          <Text className="text-lg font-semibold text-gray-800">Products list</Text>
          <View className="flex-row gap-2">
            <Pressable className="bg-blue-500 px-4 py-2 rounded-lg flex-row items-center gap-2">
              <Text className="text-white font-medium">Bulk Actions</Text>
              <Ionicons name="chevron-down" size={16} color="white" />
            </Pressable>
            <Pressable className="bg-cyan-500 px-4 py-2 rounded-lg flex-row items-center gap-2">
              <Text className="text-white font-medium">Import</Text>
              <Ionicons name="cloud-upload" size={16} color="white" />
            </Pressable>
            <Pressable className="bg-green-500 px-4 py-2 rounded-lg flex-row items-center gap-2">
              <Text className="text-white font-medium">Export</Text>
              <Ionicons name="cloud-upload" size={16} color="white" />
            </Pressable>
            <Pressable className="bg-red-500 px-4 py-2 rounded-lg">
              <Text className="text-white font-medium">Add Product</Text>
            </Pressable>
          </View>
        </View>

        {/* Filters */}
        <View className="flex-row gap-3 mb-3">
          <View className="flex-1">
            <Text className="text-gray-500 text-xs mb-1">Search by Name, SKU/UPC</Text>
            <TextInput
              className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2"
              placeholder="Search by Name, S"
              placeholderTextColor="#9ca3af"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
          <View className="w-28">
            <Text className="text-gray-500 text-xs mb-1">Select by Status</Text>
            <View className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 flex-row items-center justify-between">
              <Text className="text-gray-800">Active</Text>
              <Ionicons name="close" size={14} color="#9ca3af" />
            </View>
          </View>
          <View className="w-24">
            <Text className="text-gray-500 text-xs mb-1">Sort By</Text>
            <View className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 flex-row items-center justify-between">
              <Text className="text-gray-400">Sort B...</Text>
              <Ionicons name="chevron-down" size={14} color="#9ca3af" />
            </View>
          </View>
          <View className="w-28">
            <Text className="text-gray-500 text-xs mb-1">Select by Products</Text>
            <View className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 flex-row items-center justify-between">
              <Text className="text-gray-400">Select By Prod...</Text>
              <Ionicons name="chevron-down" size={14} color="#9ca3af" />
            </View>
          </View>
          <View className="justify-end">
            <Pressable className="bg-gray-100 px-3 py-2 rounded-lg flex-row items-center gap-1">
              <Ionicons name="filter" size={14} color="#374151" />
              <Text className="text-gray-700 text-sm">Advance Filters</Text>
            </Pressable>
          </View>
          <View className="w-28">
            <Text className="text-gray-500 text-xs mb-1">Channel Name</Text>
            <View className="bg-red-500 rounded-lg px-3 py-2 flex-row items-center justify-between">
              <Text className="text-white">Primary</Text>
              <Ionicons name="chevron-down" size={14} color="white" />
            </View>
          </View>
        </View>

        {/* Print Labels */}
        <Pressable className="bg-gray-100 px-4 py-2 rounded-lg flex-row items-center gap-2 self-start">
          <Ionicons name="print-outline" size={16} color="#374151" />
          <Text className="text-gray-700">Print Labels</Text>
        </Pressable>
      </View>

      {/* Table */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={{ minWidth: 700 }}>
          {/* Table Header */}
          <View className="flex-row bg-gray-50 py-3 px-4 border-b border-gray-200">
            <View className="w-6 mr-3">
              <View className="w-5 h-5 border border-gray-300 rounded" />
            </View>
            <Text className="w-12 text-gray-500 text-xs font-semibold uppercase text-center">Variant</Text>
            <Text className="w-40 text-gray-500 text-xs font-semibold uppercase">Name</Text>
            <Text className="w-20 text-gray-500 text-xs font-semibold uppercase text-center">Online Sale</Text>
            <Text className="w-24 text-gray-500 text-xs font-semibold uppercase text-center">Net Cost Price</Text>
            <Text className="w-24 text-gray-500 text-xs font-semibold uppercase text-center">Base Cost Price</Text>
            <Text className="w-20 text-gray-500 text-xs font-semibold uppercase text-center">Sale Price</Text>
            <Text className="w-16 text-gray-500 text-xs font-semibold uppercase text-center">Is MSA</Text>
            <Text className="w-16 text-gray-500 text-xs font-semibold uppercase text-center">Image</Text>
          </View>

          {/* List */}
          <FlatList
            data={filteredProducts}
            keyExtractor={(item) => item.id}
            renderItem={renderProduct}
            showsVerticalScrollIndicator={false}
          />
        </View>
      </ScrollView>
    </View>
  );
}
