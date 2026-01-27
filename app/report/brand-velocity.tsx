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

interface BrandReport {
  id: string;
  brandName: string;
  qtySold: number;
  salesRevenue: number;
  cost: number;
  margin: number;
  marginPercentage: number;
}

const SAMPLE_REPORTS: BrandReport[] = [
  { id: "1", brandName: "HAPPY HOUR 777 SHOT 12CT", qtySold: 37, salesRevenue: 4465.00, cost: 4255.00, margin: 210.00, marginPercentage: 4.7 },
  { id: "2", brandName: "FOGER POD 30K", qtySold: 97, salesRevenue: 3898.00, cost: 3667.00, margin: 231.00, marginPercentage: 5.9 },
  { id: "3", brandName: "MONSTER E-DRINK 16OZ 24CT", qtySold: 49, salesRevenue: 1958.00, cost: 1690.76, margin: 267.24, marginPercentage: 13.6 },
  { id: "4", brandName: "GEEK BAR Pulse X 25K 18ml 5ct", qtySold: 34, salesRevenue: 1734.00, cost: 1536.25, margin: 197.75, marginPercentage: 11.4 },
  { id: "5", brandName: "ZYN NIC. POUCH. 6MG 5CT", qtySold: 80, salesRevenue: 1680.00, cost: 1560.00, margin: 120.00, marginPercentage: 7.1 },
  { id: "6", brandName: "FOGER KIT 30K 50ML 5CT", qtySold: 30, salesRevenue: 1575.91, cost: 1513.50, margin: 62.41, marginPercentage: 4.0 },
  { id: "7", brandName: "WAVA KAVA SHOTS 12CT", qtySold: 17, salesRevenue: 1360.00, cost: 1190.00, margin: 170.00, marginPercentage: 12.5 },
  { id: "8", brandName: "RED BULL 8.4OZ 24CT", qtySold: 65, salesRevenue: 1245.00, cost: 1050.00, margin: 195.00, marginPercentage: 15.7 },
  { id: "9", brandName: "CELSIUS ENERGY 12OZ 12CT", qtySold: 42, salesRevenue: 980.50, cost: 820.00, margin: 160.50, marginPercentage: 16.4 },
  { id: "10", brandName: "PRIME HYDRATION 16OZ 12CT", qtySold: 28, salesRevenue: 756.00, cost: 630.00, margin: 126.00, marginPercentage: 16.7 },
];

export default function BrandVelocityReportScreen() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [reports] = useState<BrandReport[]>(SAMPLE_REPORTS);
  const [startDate] = useState("2026-01-20");
  const [endDate] = useState("2026-01-26");

  const filteredReports = reports.filter(
    (r) => r.brandName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Calculate totals
  const totalQtySold = filteredReports.reduce((sum, r) => sum + r.qtySold, 0);
  const totalRevenue = filteredReports.reduce((sum, r) => sum + r.salesRevenue, 0);
  const totalCost = filteredReports.reduce((sum, r) => sum + r.cost, 0);
  const totalMargin = filteredReports.reduce((sum, r) => sum + r.margin, 0);
  const avgMarginPercentage = totalRevenue > 0 ? ((totalMargin / totalRevenue) * 100) : 0;

  const renderReport = ({ item }: { item: BrandReport }) => (
    <View className="flex-row items-center py-4 px-4 border-b border-gray-100 bg-white">
      <Text className="w-56 text-gray-800 font-medium pr-2" numberOfLines={2}>{item.brandName}</Text>
      <Text className="w-24 text-gray-800 text-center">{item.qtySold}</Text>
      <Text className="w-36 text-gray-800 text-center">${item.salesRevenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Text>
      <Text className="w-36 text-gray-800 text-center">${item.cost.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Text>
      <Text className="w-32 text-green-600 text-center font-medium">${item.margin.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Text>
      <View className="w-28 items-center">
        <View className={`px-3 py-1 rounded ${item.marginPercentage >= 10 ? 'bg-green-100' : item.marginPercentage >= 5 ? 'bg-yellow-100' : 'bg-red-100'}`}>
          <Text className={`font-medium ${item.marginPercentage >= 10 ? 'text-green-700' : item.marginPercentage >= 5 ? 'text-yellow-700' : 'text-red-700'}`}>
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
        <Text className="text-2xl font-bold text-gray-800">Brand Velocity Report</Text>
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
            <Text className="text-gray-600 text-sm mb-1.5">Search by Brand and Category Name</Text>
            <TextInput
              className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-3"
              placeholder="Brand name"
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
        <View style={{ minWidth: 900 }}>
          {/* Table Header */}
          <View className="flex-row bg-gray-50 py-3 px-4 border-b border-gray-200">
            <Text className="w-56 text-gray-700 text-sm font-semibold">Brand Name</Text>
            <Text className="w-24 text-gray-700 text-sm font-semibold text-center">Qty Sold</Text>
            <Text className="w-36 text-gray-700 text-sm font-semibold text-center">Sales Revenue ($)</Text>
            <Text className="w-36 text-gray-700 text-sm font-semibold text-center">Cost ($)</Text>
            <Text className="w-32 text-gray-700 text-sm font-semibold text-center">Margin ($)</Text>
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
                <Text className="w-24 text-gray-800 text-center font-bold">{totalQtySold}</Text>
                <Text className="w-36 text-gray-800 text-center font-bold">${totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Text>
                <Text className="w-36 text-gray-800 text-center font-bold">${totalCost.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Text>
                <Text className="w-32 text-green-600 text-center font-bold">${totalMargin.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Text>
                <Text className="w-28 text-blue-600 text-center font-bold">{avgMarginPercentage.toFixed(1)}%</Text>
              </View>
            )}
          />
        </View>
      </ScrollView>
    </View>
  );
}
