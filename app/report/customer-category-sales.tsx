import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { FilterDropdown } from "../../components";
import { CustomerSalesReportView, useCustomerSalesReport } from "../../utils/powersync/hooks";

// ============================================================================
// Constants
// ============================================================================

const SORT_OPTIONS = [
  { label: "Date (Newest)", value: "date_desc" },
  { label: "Date (Oldest)", value: "date_asc" },
  { label: "Customer (A-Z)", value: "customer_asc" },
  { label: "Amount (High-Low)", value: "amount_desc" },
  { label: "Amount (Low-High)", value: "amount_asc" },
];

// ============================================================================
// Helper Functions
// ============================================================================

function formatCurrency(value: number): string {
  if (value === 0) return "-";
  return "$" + value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatDate(dateStr: string): string {
  if (!dateStr) return '-';
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      month: '2-digit',
      day: '2-digit',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

// ============================================================================
// Main Component
// ============================================================================

export default function CustomerCategorySalesReportScreen() {
  const router = useRouter();
  
  // Data from PowerSync
  const { reports, isLoading, isStreaming } = useCustomerSalesReport();

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<string | null>("date_desc");

  // Apply filters and sorting
  const filteredReports = useMemo(() => {
    let result = [...reports];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (r) =>
          r.customerName.toLowerCase().includes(query) ||
          r.businessName.toLowerCase().includes(query) ||
          r.orderNo.toLowerCase().includes(query) ||
          r.city.toLowerCase().includes(query)
      );
    }

    // Sort
    if (sortBy) {
      switch (sortBy) {
        case "date_desc":
          result.sort((a, b) => new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime());
          break;
        case "date_asc":
          result.sort((a, b) => new Date(a.orderDate).getTime() - new Date(b.orderDate).getTime());
          break;
        case "customer_asc":
          result.sort((a, b) => a.customerName.localeCompare(b.customerName));
          break;
        case "amount_desc":
          result.sort((a, b) => b.totalAmount - a.totalAmount);
          break;
        case "amount_asc":
          result.sort((a, b) => a.totalAmount - b.totalAmount);
          break;
      }
    }

    return result;
  }, [reports, searchQuery, sortBy]);

  // Calculate totals
  const totalAmount = filteredReports.reduce((acc, r) => acc + r.totalAmount, 0);

  // Loading state
  if (isLoading && reports.length === 0) {
    return (
      <View className="flex-1 bg-gray-50">
        <View className="bg-white px-5 py-4 border-b border-gray-200 flex-row items-center">
          <TouchableOpacity onPress={() => router.push("/")} className="mr-3 p-1">
            <Ionicons name="arrow-back" size={24} color="#374151" />
          </TouchableOpacity>
          <Text className="text-2xl font-bold text-gray-800">Customer Sales Report</Text>
        </View>
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text className="mt-4 text-gray-600">Loading report...</Text>
        </View>
      </View>
    );
  }

  const renderReport = ({ item }: { item: CustomerSalesReportView }) => (
    <View className="flex-row items-center py-3 px-5 border-b border-gray-100 bg-white">
      <Text className="w-28 text-gray-600 text-sm">{formatDate(item.orderDate)}</Text>
      <Text className="w-40 text-blue-600 text-sm font-medium">{item.orderNo || '-'}</Text>
      <Text className="w-48 text-gray-800 text-sm font-medium" numberOfLines={1}>{item.customerName || '-'}</Text>
      <Text className="w-56 text-blue-600 text-sm" numberOfLines={1}>{item.businessName || '-'}</Text>
      <Text className="w-32 text-gray-600 text-sm">{item.city || '-'}</Text>
      <Text className="w-32 text-green-600 text-sm font-medium text-right">{formatCurrency(item.totalAmount)}</Text>
    </View>
  );

  const renderTableFooter = () => (
    <View className="flex-row items-center py-3 px-5 bg-gray-100 border-t-2 border-gray-300">
      <Text className="w-28 text-gray-800 font-bold">TOTAL</Text>
      <Text className="w-40 text-gray-800 font-bold">{filteredReports.length} orders</Text>
      <Text className="w-48 text-gray-800 font-bold"></Text>
      <Text className="w-56 text-gray-800 font-bold"></Text>
      <Text className="w-32 text-gray-800 font-bold"></Text>
      <Text className="w-32 text-green-600 text-sm font-bold text-right">{formatCurrency(totalAmount)}</Text>
    </View>
  );

  return (
    <View className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-white px-5 py-4 border-b border-gray-200 flex-row items-center justify-between">
        <View className="flex-row items-center">
          <TouchableOpacity
            onPress={() => router.push("/")}
            className="mr-3 p-1"
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="arrow-back" size={24} color="#374151" />
          </TouchableOpacity>
          <Text className="text-2xl font-bold text-gray-800">Customer Sales Report</Text>
          {isStreaming && (
            <Text className="text-green-600 text-xs ml-3">● Live</Text>
          )}
        </View>
      </View>

      {/* Search & Filters */}
      <View className="bg-white px-5 py-4 border-b border-gray-200">
        <View className="flex-row items-end gap-4 mb-4">
          <View className="flex-1 max-w-md">
            <Text className="text-gray-600 text-sm mb-1.5">Search by Customer, Order No, City</Text>
            <TextInput
              className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-3"
              placeholder="Search..."
              placeholderTextColor="#9ca3af"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
          <FilterDropdown
            label="Sort By"
            value={sortBy}
            options={SORT_OPTIONS}
            onChange={setSortBy}
            placeholder="Sort..."
            width={170}
          />
        </View>

        {/* Applied Filters */}
        <View className="flex-row items-center">
          <Text className="text-gray-600 text-sm">
            Showing {filteredReports.length} of {reports.length} orders
          </Text>
        </View>
      </View>

      {/* Table */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-1">
        <View style={{ minWidth: 900 }}>
          {/* Table Header */}
          <View className="flex-row bg-gray-50 py-3 px-5 border-b border-gray-200">
            <Text className="w-28 text-gray-700 text-sm font-semibold">Date</Text>
            <Text className="w-40 text-gray-700 text-sm font-semibold">Order No</Text>
            <Text className="w-48 text-gray-700 text-sm font-semibold">Customer Name</Text>
            <Text className="w-56 text-gray-700 text-sm font-semibold">Business Name</Text>
            <Text className="w-32 text-gray-700 text-sm font-semibold">City</Text>
            <Text className="w-32 text-gray-700 text-sm font-semibold text-right">Total</Text>
          </View>

          {/* List */}
          <FlatList
            data={filteredReports}
            keyExtractor={(item) => item.id}
            renderItem={renderReport}
            showsVerticalScrollIndicator={false}
            ListFooterComponent={filteredReports.length > 0 ? renderTableFooter : null}
            ListEmptyComponent={
              <View className="py-16 items-center">
                <Ionicons name="document-text-outline" size={48} color="#d1d5db" />
                <Text className="text-gray-400 mt-2">No records found</Text>
              </View>
            }
          />
        </View>
      </ScrollView>
    </View>
  );
}
