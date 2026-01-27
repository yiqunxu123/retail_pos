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

// ============================================================================
// Types
// ============================================================================

interface CustomerBrandVelocity {
  id: string;
  customerNo: string;
  customerId: string;
  customerName: string;
  businessName: string;
  brand: string;
  qtySold: number;
  salesRevenue: number;
  cost: number;
  margin: number;
  marginPercentage: number;
}

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
  { label: "High (≥10%)", value: "high" },
  { label: "Medium (5-10%)", value: "medium" },
  { label: "Low (<5%)", value: "low" },
];

const DATE_RANGE_OPTIONS = [
  { label: "Last 7 Days", value: "7days" },
  { label: "Last 30 Days", value: "30days" },
  { label: "This Month", value: "month" },
  { label: "This Quarter", value: "quarter" },
  { label: "This Year", value: "year" },
];

// ============================================================================
// Sample Data
// ============================================================================

const SAMPLE_DATA: CustomerBrandVelocity[] = [
  { id: "1", customerNo: "CUS-001", customerId: "475", customerName: "Raj Patel", businessName: "RAJ PATEL/ OM JAY KALI INC", brand: "HAPPY HOUR 777 SHOT 12CT", qtySold: 37, salesRevenue: 4465.00, cost: 4255.00, margin: 210.00, marginPercentage: 4.7 },
  { id: "2", customerNo: "CUS-001", customerId: "475", customerName: "Raj Patel", businessName: "RAJ PATEL/ OM JAY KALI INC", brand: "FOGER POD 30K", qtySold: 25, salesRevenue: 1250.00, cost: 1050.00, margin: 200.00, marginPercentage: 16.0 },
  { id: "3", customerNo: "CUS-002", customerId: "474", customerName: "Neha Patel", businessName: "A&J EXPRESS INC", brand: "MONSTER E-DRINK 16OZ 24CT", qtySold: 49, salesRevenue: 1958.00, cost: 1690.76, margin: 267.24, marginPercentage: 13.6 },
  { id: "4", customerNo: "CUS-002", customerId: "474", customerName: "Neha Patel", businessName: "A&J EXPRESS INC", brand: "RED BULL 8.4OZ 24CT", qtySold: 35, salesRevenue: 875.00, cost: 735.00, margin: 140.00, marginPercentage: 16.0 },
  { id: "5", customerNo: "CUS-003", customerId: "473", customerName: "Jignesh Patel", businessName: "ARIYA529 LLC", brand: "GEEK BAR Pulse X 25K 18ml 5ct", qtySold: 34, salesRevenue: 1734.00, cost: 1536.25, margin: 197.75, marginPercentage: 11.4 },
  { id: "6", customerNo: "CUS-003", customerId: "473", customerName: "Jignesh Patel", businessName: "ARIYA529 LLC", brand: "ZYN NIC. POUCH. 6MG 5CT", qtySold: 80, salesRevenue: 1680.00, cost: 1560.00, margin: 120.00, marginPercentage: 7.1 },
  { id: "7", customerNo: "CUS-004", customerId: "472", customerName: "Viral Bhai", businessName: "1 VINAYAKK FUELS INC", brand: "FOGER KIT 30K 50ML 5CT", qtySold: 30, salesRevenue: 1575.91, cost: 1513.50, margin: 62.41, marginPercentage: 4.0 },
  { id: "8", customerNo: "CUS-005", customerId: "471", customerName: "C J Patel", businessName: "BALCH RD SHELL INC", brand: "WAVA KAVA SHOTS 12CT", qtySold: 17, salesRevenue: 1360.00, cost: 1190.00, margin: 170.00, marginPercentage: 12.5 },
  { id: "9", customerNo: "CUS-005", customerId: "471", customerName: "C J Patel", businessName: "BALCH RD SHELL INC", brand: "CELSIUS ENERGY 12OZ 12CT", qtySold: 42, salesRevenue: 980.50, cost: 820.00, margin: 160.50, marginPercentage: 16.4 },
  { id: "10", customerNo: "CUS-006", customerId: "470", customerName: "Mike Smith", businessName: "ABC RETAIL STORE", brand: "PRIME HYDRATION 16OZ 12CT", qtySold: 28, salesRevenue: 756.00, cost: 630.00, margin: 126.00, marginPercentage: 16.7 },
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

export default function CustomerBrandVelocityScreen() {
  const router = useRouter();

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<string | null>("revenue_desc");
  const [marginFilter, setMarginFilter] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<string | null>("30days");

  const [data] = useState<CustomerBrandVelocity[]>(SAMPLE_DATA);

  // Apply filters and sorting
  const filteredData = useMemo(() => {
    let result = [...data];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (r) =>
          r.customerName.toLowerCase().includes(query) ||
          r.businessName.toLowerCase().includes(query) ||
          r.brand.toLowerCase().includes(query) ||
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
  }, [data, searchQuery, sortBy, marginFilter, dateRange]);

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

  const handleGoBack = () => router.push("/");

  const renderRow = ({ item }: { item: CustomerBrandVelocity }) => (
    <View className="flex-row items-center py-3 px-5 border-b border-gray-100 bg-white">
      <Text className="w-24 text-gray-600 text-sm">{item.customerNo}</Text>
      <Text className="w-20 text-blue-600 text-sm font-medium">{item.customerId}</Text>
      <Text className="w-36 text-gray-800 text-sm" numberOfLines={1}>{item.customerName}</Text>
      <Text className="w-56 text-blue-600 text-sm" numberOfLines={1}>{item.businessName}</Text>
      <Text className="w-56 text-gray-800 text-sm font-medium" numberOfLines={1}>{item.brand}</Text>
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
      <Text className="w-56 text-gray-600"></Text>
      <Text className="w-56 text-gray-800 font-bold">{filteredData.length} records</Text>
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
            onPress={handleGoBack}
            className="mr-4 p-1"
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="arrow-back" size={24} color="#374151" />
          </TouchableOpacity>
          <Text className="text-2xl font-bold text-gray-800">Customer Brand Velocity Report</Text>
        </View>
        <View className="flex-row gap-3">
          <Pressable className="bg-red-500 px-4 py-2.5 rounded-lg flex-row items-center gap-2">
            <Ionicons name="document-text" size={18} color="white" />
            <Text className="text-white font-medium">PDF</Text>
          </Pressable>
          <Pressable className="bg-green-600 px-4 py-2.5 rounded-lg flex-row items-center gap-2">
            <Ionicons name="grid" size={18} color="white" />
            <Text className="text-white font-medium">Excel</Text>
          </Pressable>
        </View>
      </View>

      {/* Toolbar */}
      <View className="bg-white px-5 py-4 border-b border-gray-200">
        {/* Search & Filter Controls */}
        <View className="flex-row items-end gap-4 mb-4">
          <View className="flex-1 max-w-md">
            <Text className="text-gray-600 text-sm mb-1.5">Search by Customer, Business, or Brand</Text>
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
          <FilterDropdown
            label="Date Range"
            value={dateRange}
            options={DATE_RANGE_OPTIONS}
            onChange={setDateRange}
            placeholder="Select Range"
            width={150}
          />
        </View>

        {/* Applied Filters Display */}
        <View className="flex-row items-center">
          <Text className="text-gray-600 text-sm">
            Showing {filteredData.length} of {data.length} records
          </Text>
          {marginFilter && marginFilter !== "all" && (
            <Text className="text-gray-600 text-sm"> | Margin: {MARGIN_FILTER_OPTIONS.find(o => o.value === marginFilter)?.label}</Text>
          )}
        </View>
      </View>

      {/* Data Table */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-1">
        <View style={{ minWidth: 1400 }}>
          {/* Table Header */}
          <View className="flex-row bg-gray-50 py-3 px-5 border-b border-gray-200">
            <Text className="w-24 text-gray-700 text-xs font-semibold uppercase">Customer No</Text>
            <Text className="w-20 text-gray-700 text-xs font-semibold uppercase">Customer ID</Text>
            <Text className="w-36 text-gray-700 text-xs font-semibold uppercase">Customer Name</Text>
            <Text className="w-56 text-gray-700 text-xs font-semibold uppercase">Business Name</Text>
            <Text className="w-56 text-gray-700 text-xs font-semibold uppercase">Brand</Text>
            <Text className="w-24 text-gray-700 text-xs font-semibold uppercase text-center">QTY Sold</Text>
            <Text className="w-32 text-gray-700 text-xs font-semibold uppercase text-center">Sales Revenue</Text>
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
