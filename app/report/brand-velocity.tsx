import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import {
  FlatList,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { FilterDropdown } from "../../components";
import { BrandReport } from "../../types";

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
];

const MARGIN_FILTER_OPTIONS = [
  { label: "All", value: "all" },
  { label: "High (≥10%)", value: "high" },
  { label: "Medium (5-10%)", value: "medium" },
  { label: "Low (<5%)", value: "low" },
];

const DATE_RANGE_OPTIONS = [
  { label: "Last 7 Days", value: "7days" },
  { label: "Last 30 Days", value: "30days" },
  { label: "This Month", value: "month" },
  { label: "This Quarter", value: "quarter" },
  { label: "Custom", value: "custom" },
];

// ============================================================================
// Sample Data
// ============================================================================

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
    <View className={`px-3 py-1 rounded ${colors.bg}`}>
      <Text className={`font-medium ${colors.text}`}>
        {percentage.toFixed(1)}%
      </Text>
    </View>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export default function BrandVelocityReportScreen() {
  const router = useRouter();

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<string | null>("revenue_desc");
  const [marginFilter, setMarginFilter] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<string | null>("7days");

  const [reports] = useState<BrandReport[]>(SAMPLE_REPORTS);
  const [startDate] = useState("2026-01-20");
  const [endDate] = useState("2026-01-26");

  // Apply filters and sorting
  const filteredReports = useMemo(() => {
    let result = [...reports];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter((r) => r.brandName.toLowerCase().includes(query));
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
      }
    }

    return result;
  }, [reports, searchQuery, sortBy, marginFilter, dateRange]);

  // Calculate summary totals
  const totals = filteredReports.reduce(
    (acc, report) => ({
      qtySold: acc.qtySold + report.qtySold,
      revenue: acc.revenue + report.salesRevenue,
      cost: acc.cost + report.cost,
      margin: acc.margin + report.margin,
    }),
    { qtySold: 0, revenue: 0, cost: 0, margin: 0 }
  );

  const avgMarginPercentage = totals.revenue > 0
    ? (totals.margin / totals.revenue) * 100
    : 0;

  const handleGoBack = () => router.push("/");

  const renderReportRow = ({ item }: { item: BrandReport }) => (
    <View className="flex-row items-center py-4 px-5 border-b border-gray-100 bg-white">
      <Text className="w-64 text-gray-800 font-medium pr-2" numberOfLines={2}>
        {item.brandName}
      </Text>
      <Text className="w-28 text-gray-800 text-center">{item.qtySold}</Text>
      <Text className="w-40 text-gray-800 text-center">{formatCurrency(item.salesRevenue)}</Text>
      <Text className="w-40 text-gray-800 text-center">{formatCurrency(item.cost)}</Text>
      <Text className="w-36 text-green-600 text-center font-medium">{formatCurrency(item.margin)}</Text>
      <View className="w-32 items-center">
        <MarginBadge percentage={item.marginPercentage} />
      </View>
    </View>
  );

  const renderTableFooter = () => (
    <View className="flex-row items-center py-4 px-5 bg-gray-100 border-t-2 border-gray-300">
      <Text className="w-64 text-gray-800 font-bold">TOTAL ({filteredReports.length} brands)</Text>
      <Text className="w-28 text-gray-800 text-center font-bold">{totals.qtySold}</Text>
      <Text className="w-40 text-gray-800 text-center font-bold">{formatCurrency(totals.revenue)}</Text>
      <Text className="w-40 text-gray-800 text-center font-bold">{formatCurrency(totals.cost)}</Text>
      <Text className="w-36 text-green-600 text-center font-bold">{formatCurrency(totals.margin)}</Text>
      <Text className="w-32 text-blue-600 text-center font-bold">{avgMarginPercentage.toFixed(1)}%</Text>
    </View>
  );

  return (
    <View className="flex-1 bg-gray-50">
      {/* Page Header */}
      <View className="bg-white px-5 py-4 border-b border-gray-200 flex-row items-center justify-between">
        <View className="flex-row items-center">
          <TouchableOpacity
            onPress={handleGoBack}
            className="mr-4 p-1"
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="arrow-back" size={24} color="#374151" />
          </TouchableOpacity>
          <Text className="text-2xl font-bold text-gray-800">Brand Velocity Report</Text>
        </View>
        <View className="flex-row gap-3">
          <Pressable className="bg-emerald-500 px-5 py-2.5 rounded-lg flex-row items-center gap-2">
            <Text className="text-white font-medium">Export</Text>
            <Ionicons name="cloud-download" size={18} color="white" />
          </Pressable>
        </View>
      </View>

      {/* Toolbar */}
      <View className="bg-white px-5 py-4 border-b border-gray-200">
        {/* Search & Filter Controls */}
        <View className="flex-row items-end gap-4 mb-4">
          <View className="flex-1 max-w-md">
            <Text className="text-gray-600 text-sm mb-1.5">Search by Brand Name</Text>
            <TextInput
              className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-3"
              placeholder="Brand name..."
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
          <FilterDropdown
            label="Margin Level"
            value={marginFilter}
            options={MARGIN_FILTER_OPTIONS}
            onChange={setMarginFilter}
            placeholder="All Margins"
            width={140}
          />
          <FilterDropdown
            label="Date Range"
            value={dateRange}
            options={DATE_RANGE_OPTIONS}
            onChange={setDateRange}
            placeholder="Select Range"
            width={150}
          />
        </View>

        {/* Active Filters Display */}
        <View className="flex-row items-center">
          <Text className="text-gray-600 text-sm">Applied Filters: </Text>
          <Text className="text-red-500 font-medium text-sm">Date Range </Text>
          <Text className="text-gray-600 text-sm">{startDate} to {endDate}</Text>
          {marginFilter && marginFilter !== "all" && (
            <Text className="text-gray-600 text-sm"> | Margin: {MARGIN_FILTER_OPTIONS.find(o => o.value === marginFilter)?.label}</Text>
          )}
        </View>
      </View>

      {/* Data Table */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-1">
        <View style={{ minWidth: 1050 }}>
          {/* Table Header */}
          <View className="flex-row bg-gray-50 py-3 px-5 border-b border-gray-200">
            <Text className="w-64 text-gray-700 text-sm font-semibold">Brand Name</Text>
            <Text className="w-28 text-gray-700 text-sm font-semibold text-center">Qty Sold</Text>
            <Text className="w-40 text-gray-700 text-sm font-semibold text-center">Sales Revenue ($)</Text>
            <Text className="w-40 text-gray-700 text-sm font-semibold text-center">Cost ($)</Text>
            <Text className="w-36 text-gray-700 text-sm font-semibold text-center">Margin ($)</Text>
            <Text className="w-32 text-gray-700 text-sm font-semibold text-center">Margin (%)</Text>
          </View>

          {/* Table Body */}
          <FlatList
            data={filteredReports}
            keyExtractor={(item) => item.id}
            renderItem={renderReportRow}
            showsVerticalScrollIndicator={false}
            ListFooterComponent={filteredReports.length > 0 ? renderTableFooter : null}
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
