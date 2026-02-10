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
import { useCustomerVelocityReport, CustomerVelocityView } from "../../utils/powersync/hooks";

// ============================================================================
// Constants
// ============================================================================

const MARGIN_THRESHOLDS = {
  HIGH: 10,
  MEDIUM: 5,
};

const SORT_OPTIONS = [
  { label: "Revenue (High-Low)", value: "revenue_desc" },
  { label: "Revenue (Low-High)", value: "revenue_asc" },
  { label: "Qty Sold (High-Low)", value: "qty_desc" },
  { label: "Qty Sold (Low-High)", value: "qty_asc" },
  { label: "Margin % (High-Low)", value: "margin_desc" },
  { label: "Margin % (Low-High)", value: "margin_asc" },
  { label: "Customer Name (A-Z)", value: "customer_asc" },
  { label: "Business Name (A-Z)", value: "business_asc" },
];

const MARGIN_FILTER_OPTIONS = [
  { label: "All Margins", value: "all" },
  { label: "High (>=10%)", value: "high" },
  { label: "Medium (5-10%)", value: "medium" },
  { label: "Low (<5%)", value: "low" },
];

// ============================================================================
// Helper Functions
// ============================================================================

function formatCurrency(value: number): string {
  return "$" + value.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function getMarginColorClasses(percentage: number): { bg: string; text: string } {
  if (percentage >= MARGIN_THRESHOLDS.HIGH) {
    return { bg: "bg-green-100", text: "text-green-700" };
  }
  if (percentage >= MARGIN_THRESHOLDS.MEDIUM) {
    return { bg: "bg-yellow-100", text: "text-yellow-700" };
  }
  return { bg: "bg-red-100", text: "text-red-700" };
}

// ============================================================================
// Reusable Components
// ============================================================================

function MarginBadge({ percentage }: { percentage: number }) {
  const colors = getMarginColorClasses(percentage);
  return (
    <View className={`px-2 py-1 rounded ${colors.bg}`}>
      <Text className={`text-sm font-medium ${colors.text}`}>
        {percentage.toFixed(1)}%
      </Text>
    </View>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export default function CustomerVelocityScreen() {
  const router = useRouter();
  
  // Data from PowerSync
  const { reports, isLoading, isStreaming } = useCustomerVelocityReport();

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<string | null>("revenue_desc");
  const [marginFilter, setMarginFilter] = useState<string | null>(null);

  // Apply filters and sorting
  const filteredData = useMemo(() => {
    let result = [...reports];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (r) =>
          r.customerName.toLowerCase().includes(query) ||
          r.businessName.toLowerCase().includes(query) ||
          r.customerId.includes(query) ||
          r.customerNo.toLowerCase().includes(query)
      );
    }

    // Margin filter
    if (marginFilter && marginFilter !== "all") {
      switch (marginFilter) {
        case "high":
          result = result.filter((r) => r.marginPercentage >= 10);
          break;
        case "medium":
          result = result.filter((r) => r.marginPercentage >= 5 && r.marginPercentage < 10);
          break;
        case "low":
          result = result.filter((r) => r.marginPercentage < 5);
          break;
      }
    }

    // Sort
    if (sortBy) {
      switch (sortBy) {
        case "revenue_desc":
          result.sort((a, b) => b.salesRevenue - a.salesRevenue);
          break;
        case "revenue_asc":
          result.sort((a, b) => a.salesRevenue - b.salesRevenue);
          break;
        case "qty_desc":
          result.sort((a, b) => b.qtySold - a.qtySold);
          break;
        case "qty_asc":
          result.sort((a, b) => a.qtySold - b.qtySold);
          break;
        case "margin_desc":
          result.sort((a, b) => b.marginPercentage - a.marginPercentage);
          break;
        case "margin_asc":
          result.sort((a, b) => a.marginPercentage - b.marginPercentage);
          break;
        case "customer_asc":
          result.sort((a, b) => a.customerName.localeCompare(b.customerName));
          break;
        case "business_asc":
          result.sort((a, b) => a.businessName.localeCompare(b.businessName));
          break;
      }
    }

    return result;
  }, [reports, searchQuery, sortBy, marginFilter]);

  // Calculate summary totals
  const totals = filteredData.reduce(
    (acc, item) => ({
      qtySold: acc.qtySold + item.qtySold,
      revenue: acc.revenue + item.salesRevenue,
      cost: acc.cost + item.cost,
      margin: acc.margin + item.margin,
    }),
    { qtySold: 0, revenue: 0, cost: 0, margin: 0 }
  );

  const avgMarginPercentage = totals.revenue > 0
    ? (totals.margin / totals.revenue) * 100
    : 0;

  // Loading state
  if (isLoading && reports.length === 0) {
    return (
      <View className="flex-1 bg-gray-50">
        <View className="bg-white px-5 py-4 border-b border-gray-200 flex-row items-center">
          <TouchableOpacity onPress={() => router.push("/")} className="mr-4 p-1">
            <Ionicons name="arrow-back" size={24} color="#374151" />
          </TouchableOpacity>
          <Text className="text-2xl font-bold text-gray-800">Customer Velocity Report</Text>
        </View>
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text className="mt-4 text-gray-600">Loading report...</Text>
        </View>
      </View>
    );
  }

  const renderRow = ({ item }: { item: CustomerVelocityView }) => (
    <View className="flex-row items-center py-3 px-5 border-b border-gray-100 bg-white">
      <Text className="w-24 text-gray-600 text-sm">{item.customerNo || '-'}</Text>
      <Text className="w-20 text-blue-600 text-sm font-medium">{item.customerId}</Text>
      <Text className="w-36 text-gray-800 text-sm" numberOfLines={1}>{item.customerName || '-'}</Text>
      <Text className="w-56 text-blue-600 text-sm" numberOfLines={1}>{item.businessName || '-'}</Text>
      <Text className="w-24 text-gray-800 text-sm text-center">{item.qtySold}</Text>
      <Text className="w-32 text-gray-800 text-sm text-center">{formatCurrency(item.salesRevenue)}</Text>
      <Text className="w-32 text-gray-800 text-sm text-center">{formatCurrency(item.cost)}</Text>
      <Text className="w-28 text-green-600 text-sm text-center font-medium">{formatCurrency(item.margin)}</Text>
      <View className="w-24 items-center">
        <MarginBadge percentage={item.marginPercentage} />
      </View>
    </View>
  );

  const renderTableFooter = () => (
    <View className="flex-row items-center py-3 px-5 bg-gray-100 border-t-2 border-gray-300">
      <Text className="w-24 text-gray-800 font-bold">TOTAL</Text>
      <Text className="w-20 text-gray-600"></Text>
      <Text className="w-36 text-gray-600"></Text>
      <Text className="w-56 text-gray-800 font-bold">{filteredData.length} customers</Text>
      <Text className="w-24 text-gray-800 text-center font-bold">{totals.qtySold}</Text>
      <Text className="w-32 text-gray-800 text-center font-bold">{formatCurrency(totals.revenue)}</Text>
      <Text className="w-32 text-gray-800 text-center font-bold">{formatCurrency(totals.cost)}</Text>
      <Text className="w-28 text-green-600 text-center font-bold">{formatCurrency(totals.margin)}</Text>
      <Text className="w-24 text-blue-600 text-center font-bold">{avgMarginPercentage.toFixed(1)}%</Text>
    </View>
  );

  return (
    <View className="flex-1 bg-gray-50">
      {/* Page Header */}
      <View className="bg-white px-5 py-4 border-b border-gray-200 flex-row items-center justify-between">
        <View className="flex-row items-center">
          <TouchableOpacity
            onPress={() => router.push("/")}
            className="mr-4 p-1"
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="arrow-back" size={24} color="#374151" />
          </TouchableOpacity>
          <Text className="text-2xl font-bold text-gray-800">Customer Velocity Report</Text>
          {isStreaming && (
            <Text className="text-green-600 text-xs ml-3">● Live</Text>
          )}
        </View>
      </View>

      {/* Toolbar */}
      <View className="bg-white px-5 py-4 border-b border-gray-200">
        {/* Search & Filter Controls */}
        <View className="flex-row items-end gap-4 mb-4">
          <View className="flex-1 max-w-md">
            <Text className="text-gray-600 text-sm mb-1.5">Search by Customer or Business</Text>
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
            width={180}
          />
          <FilterDropdown
            label="Margin Level"
            value={marginFilter}
            options={MARGIN_FILTER_OPTIONS}
            onChange={setMarginFilter}
            placeholder="All Margins"
            width={140}
          />
        </View>

        {/* Applied Filters Display */}
        <View className="flex-row items-center">
          <Text className="text-gray-600 text-sm">
            Showing {filteredData.length} of {reports.length} customers
          </Text>
        </View>
      </View>

      {/* Data Table */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-1">
        <View style={{ minWidth: 1200 }}>
          {/* Table Header */}
          <View className="flex-row bg-gray-50 py-3 px-5 border-b border-gray-200">
            <Text className="w-24 text-gray-700 text-xs font-semibold uppercase">Customer No</Text>
            <Text className="w-20 text-gray-700 text-xs font-semibold uppercase">ID</Text>
            <Text className="w-36 text-gray-700 text-xs font-semibold uppercase">Customer Name</Text>
            <Text className="w-56 text-gray-700 text-xs font-semibold uppercase">Business Name</Text>
            <Text className="w-24 text-gray-700 text-xs font-semibold uppercase text-center">QTY Sold</Text>
            <Text className="w-32 text-gray-700 text-xs font-semibold uppercase text-center">Revenue</Text>
            <Text className="w-32 text-gray-700 text-xs font-semibold uppercase text-center">Cost</Text>
            <Text className="w-28 text-gray-700 text-xs font-semibold uppercase text-center">Margin</Text>
            <Text className="w-24 text-gray-700 text-xs font-semibold uppercase text-center">Margin %</Text>
          </View>

          {/* Table Body */}
          <FlatList
            data={filteredData}
            keyExtractor={(item) => item.id}
            renderItem={renderRow}
            showsVerticalScrollIndicator={false}
            ListFooterComponent={filteredData.length > 0 ? renderTableFooter : null}
            ListEmptyComponent={
              <View className="py-16 items-center">
                <Ionicons name="analytics-outline" size={48} color="#d1d5db" />
                <Text className="text-gray-400 mt-2">No data found</Text>
              </View>
            }
          />
        </View>
      </ScrollView>
    </View>
  );
}
