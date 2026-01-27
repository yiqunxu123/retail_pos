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
import { CategoryReport } from "../../types";

// ============================================================================
// Constants
// ============================================================================

const SORT_OPTIONS = [
  { label: "Revenue (High-Low)", value: "revenue_desc" },
  { label: "Revenue (Low-High)", value: "revenue_asc" },
  { label: "Qty Sold (High-Low)", value: "qty_desc" },
  { label: "Qty Sold (Low-High)", value: "qty_asc" },
  { label: "Margin % (High-Low)", value: "margin_desc" },
  { label: "Margin % (Low-High)", value: "margin_asc" },
  { label: "Category (A-Z)", value: "category_asc" },
];

const MARGIN_FILTER_OPTIONS = [
  { label: "All Margins", value: "all" },
  { label: "High (≥15%)", value: "high" },
  { label: "Medium (8-15%)", value: "medium" },
  { label: "Low (<8%)", value: "low" },
];

const DATE_RANGE_OPTIONS = [
  { label: "Last 7 Days", value: "7days" },
  { label: "Last 30 Days", value: "30days" },
  { label: "This Month", value: "month" },
  { label: "This Quarter", value: "quarter" },
];

// ============================================================================
// Sample Data
// ============================================================================

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
  if (percentage >= 15) return { bg: "bg-green-100", text: "text-green-700" };
  if (percentage >= 8) return { bg: "bg-yellow-100", text: "text-yellow-700" };
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

export default function CategoryVelocityReportScreen() {
  const router = useRouter();

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<string | null>("revenue_desc");
  const [marginFilter, setMarginFilter] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<string | null>("7days");

  const [reports] = useState<CategoryReport[]>(SAMPLE_DATA);
  const [startDate] = useState("2026-01-20");
  const [endDate] = useState("2026-01-26");

  // Apply filters and sorting
  const filteredReports = useMemo(() => {
    let result = [...reports];

    // Search filter
    if (searchQuery) {
      result = result.filter((r) =>
        r.categoryName.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Margin filter
    if (marginFilter && marginFilter !== "all") {
      switch (marginFilter) {
        case "high":
          result = result.filter((r) => r.marginPercentage >= 15);
          break;
        case "medium":
          result = result.filter((r) => r.marginPercentage >= 8 && r.marginPercentage < 15);
          break;
        case "low":
          result = result.filter((r) => r.marginPercentage < 8);
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
        case "category_asc":
          result.sort((a, b) => a.categoryName.localeCompare(b.categoryName));
          break;
      }
    }

    return result;
  }, [reports, searchQuery, sortBy, marginFilter, dateRange]);

  // Calculate totals
  const totals = filteredReports.reduce(
    (acc, r) => ({
      qtySold: acc.qtySold + r.qtySold,
      revenue: acc.revenue + r.salesRevenue,
      cost: acc.cost + r.cost,
      margin: acc.margin + r.margin,
    }),
    { qtySold: 0, revenue: 0, cost: 0, margin: 0 }
  );

  const avgMarginPercentage = totals.revenue > 0 ? (totals.margin / totals.revenue) * 100 : 0;

  const renderReport = ({ item }: { item: CategoryReport }) => (
    <View className="flex-row items-center py-4 px-5 border-b border-gray-100 bg-white">
      <Text className="w-64 text-gray-800 font-medium pr-2">{item.categoryName}</Text>
      <Text className="w-28 text-gray-800 text-center">{item.qtySold.toLocaleString()}</Text>
      <Text className="w-40 text-gray-800 text-center">{formatCurrency(item.salesRevenue)}</Text>
      <Text className="w-36 text-gray-800 text-center">{formatCurrency(item.cost)}</Text>
      <Text className="w-32 text-green-600 text-center font-medium">{formatCurrency(item.margin)}</Text>
      <View className="w-32 items-center">
        <MarginBadge percentage={item.marginPercentage} />
      </View>
    </View>
  );

  const renderTableFooter = () => (
    <View className="flex-row items-center py-4 px-5 bg-gray-100 border-t-2 border-gray-300">
      <Text className="w-64 text-gray-800 font-bold">TOTAL ({filteredReports.length} categories)</Text>
      <Text className="w-28 text-gray-800 text-center font-bold">{totals.qtySold.toLocaleString()}</Text>
      <Text className="w-40 text-gray-800 text-center font-bold">{formatCurrency(totals.revenue)}</Text>
      <Text className="w-36 text-gray-800 text-center font-bold">{formatCurrency(totals.cost)}</Text>
      <Text className="w-32 text-green-600 text-center font-bold">{formatCurrency(totals.margin)}</Text>
      <Text className="w-32 text-blue-600 text-center font-bold">{avgMarginPercentage.toFixed(1)}%</Text>
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
          <Text className="text-2xl font-bold text-gray-800">Category Velocity Report</Text>
        </View>
        <View className="flex-row gap-3">
          <Pressable className="bg-emerald-500 px-5 py-2.5 rounded-lg flex-row items-center gap-2">
            <Text className="text-white font-medium">Export</Text>
            <Ionicons name="cloud-download" size={18} color="white" />
          </Pressable>
        </View>
      </View>

      {/* Search & Filters */}
      <View className="bg-white px-5 py-4 border-b border-gray-200">
        <View className="flex-row items-end gap-4 mb-4">
          <View className="flex-1 max-w-md">
            <Text className="text-gray-600 text-sm mb-1.5">Search by Category name</Text>
            <TextInput
              className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-3"
              placeholder="Search categories..."
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

        {/* Applied Filters */}
        <View className="flex-row items-center">
          <Text className="text-gray-600 text-sm">Applied Filters: </Text>
          <Text className="text-red-500 font-medium text-sm">Date Range </Text>
          <Text className="text-gray-600 text-sm">{startDate} to {endDate}</Text>
          {marginFilter && marginFilter !== "all" && (
            <Text className="text-gray-600 text-sm"> | Margin: {MARGIN_FILTER_OPTIONS.find(o => o.value === marginFilter)?.label}</Text>
          )}
        </View>
      </View>

      {/* Table */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-1">
        <View style={{ minWidth: 1050 }}>
          {/* Table Header */}
          <View className="flex-row bg-gray-50 py-3 px-5 border-b border-gray-200">
            <Text className="w-64 text-gray-700 text-sm font-semibold">Category Name</Text>
            <Text className="w-28 text-gray-700 text-sm font-semibold text-center">Qty Sold</Text>
            <Text className="w-40 text-gray-700 text-sm font-semibold text-center">Sales Revenue ($)</Text>
            <Text className="w-36 text-gray-700 text-sm font-semibold text-center">Cost ($)</Text>
            <Text className="w-32 text-gray-700 text-sm font-semibold text-center">Margin ($)</Text>
            <Text className="w-32 text-gray-700 text-sm font-semibold text-center">Margin (%)</Text>
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
                <Ionicons name="pie-chart-outline" size={48} color="#d1d5db" />
                <Text className="text-gray-400 mt-2">No categories found</Text>
              </View>
            }
          />
        </View>
      </ScrollView>
    </View>
  );
}
