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
  Alert,
} from "react-native";

interface CustomerVelocityData {
  id: string;
  month: string;
  year1Qty: number;
  year1Revenue: number;
  year2Qty: number;
  year2Revenue: number;
  qtyChange: number;
  revenueChange: number;
}

const SAMPLE_DATA: CustomerVelocityData[] = [
  { id: "1", month: "January", year1Qty: 145, year1Revenue: 12500.00, year2Qty: 168, year2Revenue: 14200.00, qtyChange: 15.9, revenueChange: 13.6 },
  { id: "2", month: "February", year1Qty: 132, year1Revenue: 11200.00, year2Qty: 155, year2Revenue: 13100.00, qtyChange: 17.4, revenueChange: 17.0 },
  { id: "3", month: "March", year1Qty: 158, year1Revenue: 13800.00, year2Qty: 142, year2Revenue: 12400.00, qtyChange: -10.1, revenueChange: -10.1 },
  { id: "4", month: "April", year1Qty: 167, year1Revenue: 14500.00, year2Qty: 189, year2Revenue: 16200.00, qtyChange: 13.2, revenueChange: 11.7 },
  { id: "5", month: "May", year1Qty: 178, year1Revenue: 15200.00, year2Qty: 201, year2Revenue: 17500.00, qtyChange: 12.9, revenueChange: 15.1 },
  { id: "6", month: "June", year1Qty: 189, year1Revenue: 16100.00, year2Qty: 175, year2Revenue: 15000.00, qtyChange: -7.4, revenueChange: -6.8 },
  { id: "7", month: "July", year1Qty: 195, year1Revenue: 16800.00, year2Qty: 220, year2Revenue: 18900.00, qtyChange: 12.8, revenueChange: 12.5 },
  { id: "8", month: "August", year1Qty: 182, year1Revenue: 15600.00, year2Qty: 198, year2Revenue: 17100.00, qtyChange: 8.8, revenueChange: 9.6 },
  { id: "9", month: "September", year1Qty: 168, year1Revenue: 14400.00, year2Qty: 185, year2Revenue: 15800.00, qtyChange: 10.1, revenueChange: 9.7 },
  { id: "10", month: "October", year1Qty: 175, year1Revenue: 15000.00, year2Qty: 192, year2Revenue: 16500.00, qtyChange: 9.7, revenueChange: 10.0 },
  { id: "11", month: "November", year1Qty: 188, year1Revenue: 16200.00, year2Qty: 210, year2Revenue: 18000.00, qtyChange: 11.7, revenueChange: 11.1 },
  { id: "12", month: "December", year1Qty: 210, year1Revenue: 18500.00, year2Qty: 245, year2Revenue: 21200.00, qtyChange: 16.7, revenueChange: 14.6 },
];

export default function CustomerVelocityYoYScreen() {
  const router = useRouter();
  const [customerName, setCustomerName] = useState("");
  const [startYear, setStartYear] = useState("2025");
  const [endYear, setEndYear] = useState("2026");
  const [showReport, setShowReport] = useState(false);
  const [reportData] = useState<CustomerVelocityData[]>(SAMPLE_DATA);

  const handleGenerateReport = () => {
    if (!customerName.trim()) {
      Alert.alert("Required", "Please enter a customer name");
      return;
    }
    if (!startYear || !endYear) {
      Alert.alert("Required", "Please select start and end years");
      return;
    }
    if (parseInt(startYear) >= parseInt(endYear)) {
      Alert.alert("Invalid", "End year must be greater than start year");
      return;
    }
    setShowReport(true);
  };

  const handleExportPDF = () => {
    Alert.alert("Export PDF", "PDF export functionality will be implemented");
  };

  const handleExportExcel = () => {
    Alert.alert("Export Excel", "Excel export functionality will be implemented");
  };

  // Calculate totals
  const totalYear1Qty = reportData.reduce((sum, r) => sum + r.year1Qty, 0);
  const totalYear1Revenue = reportData.reduce((sum, r) => sum + r.year1Revenue, 0);
  const totalYear2Qty = reportData.reduce((sum, r) => sum + r.year2Qty, 0);
  const totalYear2Revenue = reportData.reduce((sum, r) => sum + r.year2Revenue, 0);
  const totalQtyChange = totalYear1Qty > 0 ? ((totalYear2Qty - totalYear1Qty) / totalYear1Qty) * 100 : 0;
  const totalRevenueChange = totalYear1Revenue > 0 ? ((totalYear2Revenue - totalYear1Revenue) / totalYear1Revenue) * 100 : 0;

  const renderRow = ({ item }: { item: CustomerVelocityData }) => (
    <View className="flex-row items-center py-3 px-4 border-b border-gray-100 bg-white">
      <Text className="w-28 text-gray-800 font-medium">{item.month}</Text>
      <Text className="w-20 text-gray-800 text-center">{item.year1Qty}</Text>
      <Text className="w-28 text-gray-800 text-center">${item.year1Revenue.toLocaleString('en-US', { minimumFractionDigits: 2 })}</Text>
      <Text className="w-20 text-gray-800 text-center">{item.year2Qty}</Text>
      <Text className="w-28 text-gray-800 text-center">${item.year2Revenue.toLocaleString('en-US', { minimumFractionDigits: 2 })}</Text>
      <View className="w-24 items-center">
        <View className={`px-2 py-1 rounded ${item.qtyChange >= 0 ? 'bg-green-100' : 'bg-red-100'}`}>
          <Text className={`text-sm font-medium ${item.qtyChange >= 0 ? 'text-green-700' : 'text-red-700'}`}>
            {item.qtyChange >= 0 ? '+' : ''}{item.qtyChange.toFixed(1)}%
          </Text>
        </View>
      </View>
      <View className="w-24 items-center">
        <View className={`px-2 py-1 rounded ${item.revenueChange >= 0 ? 'bg-green-100' : 'bg-red-100'}`}>
          <Text className={`text-sm font-medium ${item.revenueChange >= 0 ? 'text-green-700' : 'text-red-700'}`}>
            {item.revenueChange >= 0 ? '+' : ''}{item.revenueChange.toFixed(1)}%
          </Text>
        </View>
      </View>
    </View>
  );

  return (
    <View className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-white px-4 py-4 border-b border-gray-200 flex-row items-center justify-between">
        <Text className="text-2xl font-bold text-gray-800">Customer Velocity Report (Year on Year)</Text>
        <View className="flex-row gap-3">
          {showReport && (
            <>
              <Pressable 
                onPress={handleExportPDF}
                className="bg-red-500 px-4 py-2.5 rounded-lg flex-row items-center gap-2"
              >
                <Ionicons name="document-text" size={18} color="white" />
                <Text className="text-white font-medium">PDF</Text>
              </Pressable>
              <Pressable 
                onPress={handleExportExcel}
                className="bg-green-600 px-4 py-2.5 rounded-lg flex-row items-center gap-2"
              >
                <Ionicons name="grid" size={18} color="white" />
                <Text className="text-white font-medium">Excel</Text>
              </Pressable>
            </>
          )}
          <Pressable 
            onPress={() => router.back()}
            className="border border-gray-300 px-4 py-2.5 rounded-lg"
          >
            <Text className="text-gray-700 font-medium">Back</Text>
          </Pressable>
        </View>
      </View>

      {/* Filter Form */}
      <View className="bg-white mx-4 mt-4 rounded-xl p-6 shadow-sm">
        <Text className="text-lg font-semibold text-gray-800 mb-4">Report Parameters</Text>
        
        <View className="flex-row gap-4 mb-4">
          {/* Customer Name */}
          <View className="flex-1">
            <Text className="text-gray-600 text-sm mb-1.5">Customer Name *</Text>
            <TextInput
              className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-3"
              placeholder="Enter customer name or business"
              placeholderTextColor="#9ca3af"
              value={customerName}
              onChangeText={setCustomerName}
            />
          </View>
        </View>

        <View className="flex-row gap-4 mb-6">
          {/* Start Year */}
          <View className="flex-1">
            <Text className="text-gray-600 text-sm mb-1.5">Start Year *</Text>
            <Pressable className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 flex-row items-center justify-between">
              <TextInput
                className="flex-1 text-gray-800"
                placeholder="2025"
                placeholderTextColor="#9ca3af"
                value={startYear}
                onChangeText={setStartYear}
                keyboardType="numeric"
                maxLength={4}
              />
              <Ionicons name="calendar-outline" size={20} color="#9ca3af" />
            </Pressable>
          </View>

          {/* End Year */}
          <View className="flex-1">
            <Text className="text-gray-600 text-sm mb-1.5">End Year *</Text>
            <Pressable className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 flex-row items-center justify-between">
              <TextInput
                className="flex-1 text-gray-800"
                placeholder="2026"
                placeholderTextColor="#9ca3af"
                value={endYear}
                onChangeText={setEndYear}
                keyboardType="numeric"
                maxLength={4}
              />
              <Ionicons name="calendar-outline" size={20} color="#9ca3af" />
            </Pressable>
          </View>

          {/* Generate Button */}
          <View className="justify-end">
            <Pressable 
              onPress={handleGenerateReport}
              className="bg-blue-500 px-8 py-3 rounded-lg flex-row items-center gap-2"
            >
              <Ionicons name="search" size={18} color="white" />
              <Text className="text-white font-medium">Generate Report</Text>
            </Pressable>
          </View>
        </View>
      </View>

      {/* Report Table */}
      {showReport && (
        <View className="flex-1 mx-4 mt-4 mb-4">
          {/* Customer Info */}
          <View className="bg-blue-50 rounded-lg p-4 mb-4">
            <Text className="text-blue-800 font-semibold">Customer: {customerName}</Text>
            <Text className="text-blue-600">Comparing {startYear} vs {endYear}</Text>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={{ minWidth: 750 }}>
              {/* Table Header */}
              <View className="flex-row bg-gray-100 py-3 px-4 rounded-t-lg">
                <Text className="w-28 text-gray-700 text-sm font-semibold">Month</Text>
                <Text className="w-20 text-gray-700 text-sm font-semibold text-center">{startYear} Qty</Text>
                <Text className="w-28 text-gray-700 text-sm font-semibold text-center">{startYear} Revenue</Text>
                <Text className="w-20 text-gray-700 text-sm font-semibold text-center">{endYear} Qty</Text>
                <Text className="w-28 text-gray-700 text-sm font-semibold text-center">{endYear} Revenue</Text>
                <Text className="w-24 text-gray-700 text-sm font-semibold text-center">Qty Change</Text>
                <Text className="w-24 text-gray-700 text-sm font-semibold text-center">Rev Change</Text>
              </View>

              {/* Data Rows */}
              <FlatList
                data={reportData}
                keyExtractor={(item) => item.id}
                renderItem={renderRow}
                showsVerticalScrollIndicator={false}
                ListFooterComponent={() => (
                  <View className="flex-row items-center py-3 px-4 bg-gray-200 rounded-b-lg">
                    <Text className="w-28 text-gray-800 font-bold">TOTAL</Text>
                    <Text className="w-20 text-gray-800 text-center font-bold">{totalYear1Qty}</Text>
                    <Text className="w-28 text-gray-800 text-center font-bold">${totalYear1Revenue.toLocaleString('en-US', { minimumFractionDigits: 2 })}</Text>
                    <Text className="w-20 text-gray-800 text-center font-bold">{totalYear2Qty}</Text>
                    <Text className="w-28 text-gray-800 text-center font-bold">${totalYear2Revenue.toLocaleString('en-US', { minimumFractionDigits: 2 })}</Text>
                    <View className="w-24 items-center">
                      <View className={`px-2 py-1 rounded ${totalQtyChange >= 0 ? 'bg-green-500' : 'bg-red-500'}`}>
                        <Text className="text-white font-bold text-sm">
                          {totalQtyChange >= 0 ? '+' : ''}{totalQtyChange.toFixed(1)}%
                        </Text>
                      </View>
                    </View>
                    <View className="w-24 items-center">
                      <View className={`px-2 py-1 rounded ${totalRevenueChange >= 0 ? 'bg-green-500' : 'bg-red-500'}`}>
                        <Text className="text-white font-bold text-sm">
                          {totalRevenueChange >= 0 ? '+' : ''}{totalRevenueChange.toFixed(1)}%
                        </Text>
                      </View>
                    </View>
                  </View>
                )}
              />
            </View>
          </ScrollView>
        </View>
      )}

      {/* Empty State */}
      {!showReport && (
        <View className="flex-1 items-center justify-center">
          <Ionicons name="analytics-outline" size={80} color="#d1d5db" />
          <Text className="text-gray-400 text-lg mt-4">Enter parameters and generate report</Text>
        </View>
      )}
    </View>
  );
}
