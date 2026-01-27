import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  FlatList,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";

interface CategoryReport {
  id: string;
  categoryName: string;
  qtySold: number;
  salesRevenue: number;
  cost: number;
  margin: number;
  marginPercentage: number;
}

const SAMPLE_DATA: CategoryReport[] = [
  { id: "1", categoryName: "DRINKS", qtySold: 1028, salesRevenue: 25710.92, cost: 20581.37, margin: 5129.55, marginPercentage: 19.9 },
  { id: "2", categoryName: "E-CIG", qtySold: 283, salesRevenue: 12524.13, cost: 11349.13, margin: 1175.00, marginPercentage: 9.4 },
  { id: "3", categoryName: "KAVA SHOTS", qtySold: 61, salesRevenue: 6175.00, cost: 5777.50, margin: 397.50, marginPercentage: 6.4 },
  { id: "4", categoryName: "CIGARS", qtySold: 147, salesRevenue: 3163.69, cost: 2943.97, margin: 219.72, marginPercentage: 6.9 },
  { id: "5", categoryName: "ENERGY DRINKS", qtySold: 77, salesRevenue: 3029.36, cost: 2614.61, margin: 414.75, marginPercentage: 13.7 },
  { id: "6", categoryName: "NICOTINE POUCHES", qtySold: 115, salesRevenue: 2414.00, cost: 2240.50, margin: 173.50, marginPercentage: 7.2 },
  { id: "7", categoryName: "Cigarette", qtySold: 58, salesRevenue: 1443.72, cost: 1407.32, margin: 36.40, marginPercentage: 2.5 },
  { id: "8", categoryName: "MUSHROOM PRE-ROLLS", qtySold: 8, salesRevenue: 1000.00, cost: 760.00, margin: 240.00, marginPercentage: 24.0 },
  { id: "9", categoryName: "GENERAL MERCHANDISE", qtySold: 4, salesRevenue: 857.83, cost: 697.76, margin: 160.07, marginPercentage: 18.7 },
  { id: "10", categoryName: "SNACKS", qtySold: 156, salesRevenue: 780.50, cost: 624.40, margin: 156.10, marginPercentage: 20.0 },
  { id: "11", categoryName: "CANDY", qtySold: 89, salesRevenue: 445.00, cost: 356.00, margin: 89.00, marginPercentage: 20.0 },
];

export default function CategoryVelocityReportScreen() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [reports] = useState<CategoryReport[]>(SAMPLE_DATA);
  const [startDate] = useState("2026-01-20");
  const [endDate] = useState("2026-01-26");

  const filteredReports = reports.filter(
    (r) => r.categoryName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Calculate totals
  const totalQtySold = filteredReports.reduce((sum, r) => sum + r.qtySold, 0);
  const totalRevenue = filteredReports.reduce((sum, r) => sum + r.salesRevenue, 0);
  const totalCost = filteredReports.reduce((sum, r) => sum + r.cost, 0);
  const totalMargin = filteredReports.reduce((sum, r) => sum + r.margin, 0);
  const avgMarginPercentage = totalRevenue > 0 ? ((totalMargin / totalRevenue) * 100) : 0;

  const renderReport = ({ item }: { item: CategoryReport }) => (
    <View className="flex-row items-center py-4 px-4 border-b border-gray-100 bg-white">
      <Text className="w-56 text-gray-800 font-medium pr-2">{item.categoryName}</Text>
      <Text className="w-24 text-gray-800 text-center">{item.qtySold.toLocaleString()}</Text>
      <Text className="w-36 text-gray-800 text-center">${item.salesRevenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Text>
      <Text className="w-32 text-gray-800 text-center">${item.cost.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Text>
      <Text className="w-28 text-green-600 text-center font-medium">${item.margin.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Text>
      <View className="w-28 items-center">
        <View className={`px-3 py-1 rounded ${item.marginPercentage >= 15 ? 'bg-green-100' : item.marginPercentage >= 8 ? 'bg-yellow-100' : 'bg-red-100'}`}>
          <Text className={`font-medium ${item.marginPercentage >= 15 ? 'text-green-700' : item.marginPercentage >= 8 ? 'text-yellow-700' : 'text-red-700'}`}>
            {item.marginPercentage.toFixed(1)}%
          </Text>
        </View>
      </View>
    </View>
  );

  return (
    <View className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-white px-4 py-4 border-b border-gray-200 flex-row items-center justify-between">
        <Text className="text-2xl font-bold text-gray-800">Category Velocity Report</Text>
        <View className="flex-row gap-3">
          <Pressable className="bg-emerald-500 px-5 py-2.5 rounded-lg flex-row items-center gap-2">
            <Text className="text-white font-medium">Export</Text>
            <Ionicons name="cloud-download" size={18} color="white" />
          </Pressable>
          <Pressable 
            onPress={() => router.back()}
            className="border border-red-400 px-5 py-2.5 rounded-lg"
          >
            <Text className="text-red-500 font-medium">Back</Text>
          </Pressable>
        </View>
      </View>

      {/* Search & Filters */}
      <View className="bg-white px-4 py-4 border-b border-gray-200">
        <View className="flex-row items-end gap-4 mb-4">
          <View className="flex-1 max-w-md">
            <Text className="text-gray-600 text-sm mb-1.5">Search by Category name</Text>
            <TextInput
              className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-3"
              placeholder="Search"
              placeholderTextColor="#9ca3af"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
          <Pressable className="bg-white border border-gray-300 px-4 py-3 rounded-lg flex-row items-center gap-2">
            <Ionicons name="filter" size={16} color="#374151" />
            <Text className="text-gray-700 font-medium">Advance Filters</Text>
          </Pressable>
          <View className="flex-1" />
          <Pressable className="bg-white border border-gray-300 px-4 py-3 rounded-lg flex-row items-center gap-2">
            <Ionicons name="lock-closed" size={16} color="#374151" />
            <Text className="text-gray-700 font-medium">Freeze Columns</Text>
          </Pressable>
          <Pressable className="bg-white border border-gray-300 px-4 py-3 rounded-lg flex-row items-center gap-2">
            <Ionicons name="grid" size={16} color="#374151" />
            <Text className="text-gray-700">Columns</Text>
          </Pressable>
        </View>

        {/* Applied Filters */}
        <View className="flex-row items-center">
          <Text className="text-gray-600 text-sm">Applied Filters: </Text>
          <Text className="text-red-500 font-medium text-sm">Start Date </Text>
          <Text className="text-gray-600 text-sm">{startDate} to {endDate}</Text>
        </View>
      </View>

      {/* Table */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={{ minWidth: 950 }}>
          {/* Table Header */}
          <View className="flex-row bg-gray-50 py-3 px-4 border-b border-gray-200">
            <Text className="w-56 text-gray-700 text-sm font-semibold">Category Name</Text>
            <Text className="w-24 text-gray-700 text-sm font-semibold text-center">Qty Sold</Text>
            <Text className="w-36 text-gray-700 text-sm font-semibold text-center">Sales Revenue ($)</Text>
            <Text className="w-32 text-gray-700 text-sm font-semibold text-center">Cost ($)</Text>
            <Text className="w-28 text-gray-700 text-sm font-semibold text-center">Margin ($)</Text>
            <Text className="w-28 text-gray-700 text-sm font-semibold text-center">Margin (%)</Text>
          </View>

          {/* List */}
          <FlatList
            data={filteredReports}
            keyExtractor={(item) => item.id}
            renderItem={renderReport}
            showsVerticalScrollIndicator={false}
            ListFooterComponent={() => (
              <View className="flex-row items-center py-4 px-4 bg-gray-100 border-t-2 border-gray-300">
                <Text className="w-56 text-gray-800 font-bold">TOTAL</Text>
                <Text className="w-24 text-gray-800 text-center font-bold">{totalQtySold.toLocaleString()}</Text>
                <Text className="w-36 text-gray-800 text-center font-bold">${totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Text>
                <Text className="w-32 text-gray-800 text-center font-bold">${totalCost.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Text>
                <Text className="w-28 text-green-600 text-center font-bold">${totalMargin.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Text>
                <Text className="w-28 text-blue-600 text-center font-bold">{avgMarginPercentage.toFixed(1)}%</Text>
              </View>
            )}
          />
        </View>
      </ScrollView>
    </View>
  );
}
