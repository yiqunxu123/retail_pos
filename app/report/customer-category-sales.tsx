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
import { CustomerCategorySale } from "../../types";

// ============================================================================
// Constants
// ============================================================================

const SORT_OPTIONS = [
  { label: "Date (Newest)", value: "date_desc" },
  { label: "Date (Oldest)", value: "date_asc" },
  { label: "Customer (A-Z)", value: "customer_asc" },
  { label: "City (A-Z)", value: "city_asc" },
];

const CITY_OPTIONS = [
  { label: "All Cities", value: "all" },
  { label: "Nashville", value: "Nashville" },
  { label: "Memphis", value: "Memphis" },
  { label: "Knoxville", value: "Knoxville" },
  { label: "Chattanooga", value: "Chattanooga" },
  { label: "Franklin", value: "Franklin" },
  { label: "Murfreesboro", value: "Murfreesboro" },
  { label: "Clarksville", value: "Clarksville" },
  { label: "Jackson", value: "Jackson" },
  { label: "Anchorage", value: "Anchorage" },
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

const SAMPLE_DATA: CustomerCategorySale[] = [
  { id: "1", invoiceDate: "01/26/2026", saleOrderNumber: "SO-260126-05915", dateShipped: "01/26/2026", customerName: "ALASKA TAX CUSTOMER", address: "123 Main St", city: "Anchorage", county: "Anchorage", tea: 125.50, milk: 45.00, scale: 0, alaska: 89.99, butane: 0, etc: 34.50 },
  { id: "2", invoiceDate: "01/26/2026", saleOrderNumber: "SO-260126-05914", dateShipped: "01/26/2026", customerName: "Quick Mart LLC", address: "456 Oak Ave", city: "Nashville", county: "Davidson", tea: 0, milk: 78.25, scale: 150.00, alaska: 0, butane: 45.00, etc: 22.00 },
  { id: "3", invoiceDate: "01/25/2026", saleOrderNumber: "SO-260125-05910", dateShipped: "01/25/2026", customerName: "Spirit Wholesale", address: "789 Pine Rd", city: "Memphis", county: "Shelby", tea: 234.00, milk: 0, scale: 0, alaska: 0, butane: 89.50, etc: 156.75 },
  { id: "4", invoiceDate: "01/25/2026", saleOrderNumber: "SO-260125-05908", dateShipped: "01/25/2026", customerName: "Geneshay Namh Inc", address: "321 Elm Blvd", city: "Knoxville", county: "Knox", tea: 67.00, milk: 125.50, scale: 78.00, alaska: 45.00, butane: 0, etc: 89.00 },
  { id: "5", invoiceDate: "01/24/2026", saleOrderNumber: "SO-260124-05900", dateShipped: "01/24/2026", customerName: "Sams Grocery Store", address: "654 Maple Dr", city: "Chattanooga", county: "Hamilton", tea: 0, milk: 0, scale: 245.00, alaska: 0, butane: 167.50, etc: 45.25 },
  { id: "6", invoiceDate: "01/24/2026", saleOrderNumber: "SO-260124-05898", dateShipped: "01/24/2026", customerName: "ABC Retail Store", address: "987 Cedar Ln", city: "Nashville", county: "Davidson", tea: 189.00, milk: 56.75, scale: 0, alaska: 234.00, butane: 0, etc: 78.50 },
  { id: "7", invoiceDate: "01/23/2026", saleOrderNumber: "SO-260123-05890", dateShipped: "01/23/2026", customerName: "Downtown Convenience", address: "147 Oak St", city: "Franklin", county: "Williamson", tea: 45.00, milk: 89.00, scale: 123.00, alaska: 0, butane: 56.00, etc: 0 },
  { id: "8", invoiceDate: "01/23/2026", saleOrderNumber: "SO-260123-05885", dateShipped: "01/23/2026", customerName: "Highway Stop Shop", address: "258 Highway 65", city: "Murfreesboro", county: "Rutherford", tea: 0, milk: 167.00, scale: 0, alaska: 89.00, butane: 234.00, etc: 45.00 },
  { id: "9", invoiceDate: "01/22/2026", saleOrderNumber: "SO-260122-05880", dateShipped: "01/22/2026", customerName: "Corner Market", address: "369 Center Ave", city: "Clarksville", county: "Montgomery", tea: 278.50, milk: 0, scale: 56.00, alaska: 0, butane: 0, etc: 123.75 },
  { id: "10", invoiceDate: "01/22/2026", saleOrderNumber: "SO-260122-05875", dateShipped: "01/22/2026", customerName: "Valley Foods", address: "741 Valley Rd", city: "Jackson", county: "Madison", tea: 0, milk: 234.50, scale: 178.00, alaska: 156.00, butane: 89.00, etc: 0 },
];

// ============================================================================
// Helper Functions
// ============================================================================

function formatCurrency(value: number): string {
  if (value === 0) return "-";
  return "$" + value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// ============================================================================
// Main Component
// ============================================================================

export default function CustomerCategorySalesReportScreen() {
  const router = useRouter();

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<string | null>("date_desc");
  const [cityFilter, setCityFilter] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<string | null>("7days");

  const [reports] = useState<CustomerCategorySale[]>(SAMPLE_DATA);
  const [startDate] = useState("2026-01-20");
  const [endDate] = useState("2026-01-26");

  // Apply filters and sorting
  const filteredReports = useMemo(() => {
    let result = [...reports];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (r) =>
          r.customerName.toLowerCase().includes(query) ||
          r.saleOrderNumber.toLowerCase().includes(query) ||
          r.city.toLowerCase().includes(query)
      );
    }

    // City filter
    if (cityFilter && cityFilter !== "all") {
      result = result.filter((r) => r.city === cityFilter);
    }

    // Sort
    if (sortBy) {
      switch (sortBy) {
        case "date_desc":
          result.sort((a, b) => new Date(b.invoiceDate).getTime() - new Date(a.invoiceDate).getTime());
          break;
        case "date_asc":
          result.sort((a, b) => new Date(a.invoiceDate).getTime() - new Date(b.invoiceDate).getTime());
          break;
        case "customer_asc":
          result.sort((a, b) => a.customerName.localeCompare(b.customerName));
          break;
        case "city_asc":
          result.sort((a, b) => a.city.localeCompare(b.city));
          break;
      }
    }

    return result;
  }, [reports, searchQuery, sortBy, cityFilter, dateRange]);

  // Calculate totals
  const totals = filteredReports.reduce(
    (acc, r) => ({
      tea: acc.tea + r.tea,
      milk: acc.milk + r.milk,
      scale: acc.scale + r.scale,
      alaska: acc.alaska + r.alaska,
      butane: acc.butane + r.butane,
      etc: acc.etc + r.etc,
    }),
    { tea: 0, milk: 0, scale: 0, alaska: 0, butane: 0, etc: 0 }
  );

  const renderReport = ({ item }: { item: CustomerCategorySale }) => (
    <View className="flex-row items-center py-3 px-5 border-b border-gray-100 bg-white">
      <Text className="w-28 text-gray-600 text-sm">{item.invoiceDate}</Text>
      <Text className="w-40 text-blue-600 text-sm font-medium">{item.saleOrderNumber}</Text>
      <Text className="w-28 text-gray-600 text-sm">{item.dateShipped}</Text>
      <Text className="w-52 text-gray-800 text-sm font-medium" numberOfLines={1}>{item.customerName}</Text>
      <Text className="w-36 text-gray-600 text-sm" numberOfLines={1}>{item.address}</Text>
      <Text className="w-32 text-gray-600 text-sm">{item.city}</Text>
      <Text className="w-32 text-gray-600 text-sm">{item.county}</Text>
      <Text className="w-24 text-gray-800 text-sm text-right">{formatCurrency(item.tea)}</Text>
      <Text className="w-24 text-gray-800 text-sm text-right">{formatCurrency(item.milk)}</Text>
      <Text className="w-24 text-gray-800 text-sm text-right">{formatCurrency(item.scale)}</Text>
      <Text className="w-24 text-gray-800 text-sm text-right">{formatCurrency(item.alaska)}</Text>
      <Text className="w-24 text-gray-800 text-sm text-right">{formatCurrency(item.butane)}</Text>
      <Text className="w-24 text-gray-800 text-sm text-right">{formatCurrency(item.etc)}</Text>
    </View>
  );

  const renderTableFooter = () => (
    <View className="flex-row items-center py-3 px-5 bg-gray-100 border-t-2 border-gray-300">
      <Text className="w-28 text-gray-800 font-bold">TOTAL</Text>
      <Text className="w-40 text-gray-800 font-bold">{filteredReports.length} records</Text>
      <Text className="w-28 text-gray-800 font-bold"></Text>
      <Text className="w-52 text-gray-800 font-bold"></Text>
      <Text className="w-36 text-gray-800 font-bold"></Text>
      <Text className="w-32 text-gray-800 font-bold"></Text>
      <Text className="w-32 text-gray-800 font-bold"></Text>
      <Text className="w-24 text-green-600 text-sm font-bold text-right">{formatCurrency(totals.tea)}</Text>
      <Text className="w-24 text-green-600 text-sm font-bold text-right">{formatCurrency(totals.milk)}</Text>
      <Text className="w-24 text-green-600 text-sm font-bold text-right">{formatCurrency(totals.scale)}</Text>
      <Text className="w-24 text-green-600 text-sm font-bold text-right">{formatCurrency(totals.alaska)}</Text>
      <Text className="w-24 text-green-600 text-sm font-bold text-right">{formatCurrency(totals.butane)}</Text>
      <Text className="w-24 text-green-600 text-sm font-bold text-right">{formatCurrency(totals.etc)}</Text>
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
          <Text className="text-2xl font-bold text-gray-800">Customer Category Sales Report</Text>
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
            width={150}
          />
          <FilterDropdown
            label="City"
            value={cityFilter}
            options={CITY_OPTIONS}
            onChange={setCityFilter}
            placeholder="All Cities"
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
          {cityFilter && cityFilter !== "all" && (
            <Text className="text-gray-600 text-sm"> | City: {cityFilter}</Text>
          )}
        </View>
      </View>

      {/* Table */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-1">
        <View style={{ minWidth: 1600 }}>
          {/* Table Header */}
          <View className="flex-row bg-gray-50 py-3 px-5 border-b border-gray-200">
            <Text className="w-28 text-gray-700 text-sm font-semibold">Invoice Date</Text>
            <Text className="w-40 text-gray-700 text-sm font-semibold">Sale Order No</Text>
            <Text className="w-28 text-gray-700 text-sm font-semibold">Date Shipped</Text>
            <Text className="w-52 text-gray-700 text-sm font-semibold">Customer Name</Text>
            <Text className="w-36 text-gray-700 text-sm font-semibold">Address</Text>
            <Text className="w-32 text-gray-700 text-sm font-semibold">City</Text>
            <Text className="w-32 text-gray-700 text-sm font-semibold">County</Text>
            <Text className="w-24 text-gray-700 text-sm font-semibold text-right">TEA</Text>
            <Text className="w-24 text-gray-700 text-sm font-semibold text-right">Milk</Text>
            <Text className="w-24 text-gray-700 text-sm font-semibold text-right">Scale</Text>
            <Text className="w-24 text-gray-700 text-sm font-semibold text-right">Alaska</Text>
            <Text className="w-24 text-gray-700 text-sm font-semibold text-right">Butane</Text>
            <Text className="w-24 text-gray-700 text-sm font-semibold text-right">ETC</Text>
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
