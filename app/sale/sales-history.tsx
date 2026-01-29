import { Ionicons } from "@expo/vector-icons";
import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { FilterDropdown, PageHeader } from "../../components";
import { ORDER_STATUS, SaleOrderView, useSaleOrders } from "../../utils/powersync/hooks";

// ============================================================================
// Constants
// ============================================================================

const STATUS_OPTIONS = [
  { label: "All", value: "all" },
  { label: "Pending", value: "1" },
  { label: "Confirmed", value: "2" },
  { label: "Processing", value: "3" },
  { label: "Completed", value: "4" },
  { label: "Cancelled", value: "5" },
];

const DATE_RANGE_OPTIONS = [
  { label: "All Time", value: "all" },
  { label: "Today", value: "today" },
  { label: "Last 7 Days", value: "7days" },
  { label: "Last 30 Days", value: "30days" },
];

const TABS = ["Orders", "Voided"] as const;

// ============================================================================
// Reusable Components
// ============================================================================

function TableCheckbox() {
  return <View className="w-5 h-5 border border-gray-300 rounded" />;
}

function StatusBadge({ status }: { status: number }) {
  const statusText = ORDER_STATUS[status as keyof typeof ORDER_STATUS] || 'Unknown';
  const colors: Record<number, { bg: string; text: string }> = {
    1: { bg: "bg-yellow-500", text: "text-white" },
    2: { bg: "bg-blue-500", text: "text-white" },
    3: { bg: "bg-orange-500", text: "text-white" },
    4: { bg: "bg-green-500", text: "text-white" },
    5: { bg: "bg-red-500", text: "text-white" },
  };
  const color = colors[status] || { bg: "bg-gray-400", text: "text-white" };
  
  return (
    <View className={`px-3 py-1 rounded ${color.bg}`}>
      <Text className={`font-medium text-sm ${color.text}`}>{statusText}</Text>
    </View>
  );
}

// ============================================================================
// Helper Functions
// ============================================================================

function formatCurrency(value: number): string {
  return `$${value.toFixed(2)}`;
}

function formatDateTime(dateStr: string): string {
  if (!dateStr) return '-';
  try {
    const date = new Date(dateStr);
    return date.toLocaleString('en-US', {
      month: '2-digit',
      day: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return dateStr;
  }
}

// ============================================================================
// Main Component
// ============================================================================

export default function SalesHistoryScreen() {
  // Data from PowerSync
  const { orders, isLoading, isStreaming, count } = useSaleOrders();

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<typeof TABS[number]>("Orders");
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [dateRangeFilter, setDateRangeFilter] = useState<string | null>(null);

  // Apply filters
  const filteredOrders = useMemo(() => {
    let result = [...orders];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (o) =>
          o.businessName.toLowerCase().includes(query) ||
          o.customerName.toLowerCase().includes(query) ||
          o.orderNo.toLowerCase().includes(query)
      );
    }

    // Status filter
    if (statusFilter && statusFilter !== "all") {
      result = result.filter((o) => o.status === parseInt(statusFilter));
    }

    return result;
  }, [orders, searchQuery, statusFilter, dateRangeFilter]);

  // Loading state
  if (isLoading && orders.length === 0) {
    return (
      <View className="flex-1 bg-gray-50">
        <PageHeader title="Sales History" />
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text className="mt-4 text-gray-600">Loading orders...</Text>
        </View>
      </View>
    );
  }

  const renderOrderRow = ({ item }: { item: SaleOrderView }) => (
    <View className="flex-row items-center py-3 px-5 border-b border-gray-100 bg-white">
      <View className="w-8 mr-4">
        <TableCheckbox />
      </View>
      <Text className="w-40 text-blue-600 font-medium">{item.orderNo || '-'}</Text>
      <Text className="w-48 text-gray-600 text-sm">{formatDateTime(item.orderDate)}</Text>
      <View className="w-56">
        <Text className="text-blue-600 font-medium" numberOfLines={1}>{item.businessName || '-'}</Text>
        <Text className="text-gray-500 text-sm" numberOfLines={1}>{item.customerName || '-'}</Text>
      </View>
      <View className="w-28 items-center">
        <View className="bg-yellow-400 px-3 py-1 rounded">
          <Text className="text-gray-800 font-bold">{formatCurrency(item.totalPrice)}</Text>
        </View>
      </View>
      <View className="w-28 items-center">
        <StatusBadge status={item.status} />
      </View>
      <View className="w-24 flex-row items-center justify-center gap-2">
        <Pressable className="bg-blue-100 p-1.5 rounded">
          <Ionicons name="eye" size={14} color="#3b82f6" />
        </Pressable>
        <Pressable className="bg-gray-100 p-1.5 rounded">
          <Ionicons name="ellipsis-horizontal" size={14} color="#6b7280" />
        </Pressable>
      </View>
    </View>
  );

  return (
    <View className="flex-1 bg-gray-50">
      <PageHeader title="Sales History" />

      {/* Tab Navigation */}
      <View className="bg-white flex-row border-b border-gray-200">
        {TABS.map((tab) => {
          const isActive = activeTab === tab;
          return (
            <Pressable
              key={tab}
              onPress={() => setActiveTab(tab)}
              className={`px-6 py-3 ${isActive ? "border-b-2 border-blue-500" : ""}`}
            >
              <Text className={`font-medium ${isActive ? "text-blue-500" : "text-gray-600"}`}>
                {tab}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* Order Statistics Summary */}
      <View className="bg-white px-5 py-4 border-b border-gray-200">
        <View className="flex-row items-center gap-2">
          <Text className="text-lg font-semibold text-gray-800">Orders ({filteredOrders.length})</Text>
          {isStreaming && (
            <Text className="text-green-600 text-xs">● Live</Text>
          )}
        </View>
      </View>

      {/* Toolbar */}
      <View className="bg-white px-5 py-4 border-b border-gray-200">
        {/* Search Input */}
        <Text className="text-gray-500 text-sm mb-2">
          Search by Customer Name, Business Name, Order No
        </Text>
        <View className="flex-row items-center gap-4 mb-4">
          <View className="flex-1">
            <TextInput
              className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5"
              placeholder="Search orders..."
              placeholderTextColor="#9ca3af"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
          <FilterDropdown
            label=""
            value={statusFilter}
            options={STATUS_OPTIONS}
            onChange={setStatusFilter}
            placeholder="Status"
            width={140}
          />
          <FilterDropdown
            label=""
            value={dateRangeFilter}
            options={DATE_RANGE_OPTIONS}
            onChange={setDateRangeFilter}
            placeholder="Date Range"
            width={140}
          />
        </View>

        {/* Action Buttons */}
        <View className="flex-row items-center justify-between">
          <View className="flex-row gap-2">
            <Pressable className="bg-blue-500 px-4 py-2.5 rounded-lg flex-row items-center gap-2">
              <Ionicons name="print" size={16} color="white" />
              <Text className="text-white font-medium">Print Invoice</Text>
            </Pressable>
            <Pressable className="bg-gray-100 px-4 py-2.5 rounded-lg flex-row items-center gap-2">
              <Ionicons name="grid" size={16} color="#374151" />
              <Text className="text-gray-700">Columns</Text>
            </Pressable>
          </View>
          <Pressable className="bg-green-500 px-4 py-2.5 rounded-lg">
            <Text className="text-white font-medium">Add Order</Text>
          </Pressable>
        </View>
      </View>

      {/* Data Table */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-1">
        <View style={{ minWidth: 900 }}>
          {/* Table Header */}
          <View className="flex-row bg-gray-50 py-3 px-5 border-b border-gray-200">
            <View className="w-8 mr-4">
              <TableCheckbox />
            </View>
            <Text className="w-40 text-gray-500 text-xs font-semibold uppercase">Order Number</Text>
            <Text className="w-48 text-gray-500 text-xs font-semibold uppercase">Date / Time</Text>
            <Text className="w-56 text-gray-500 text-xs font-semibold uppercase">Business / Customer</Text>
            <Text className="w-28 text-gray-500 text-xs font-semibold uppercase text-center">Total</Text>
            <Text className="w-28 text-gray-500 text-xs font-semibold uppercase text-center">Status</Text>
            <Text className="w-24 text-gray-500 text-xs font-semibold uppercase text-center">Actions</Text>
          </View>

          {/* Table Body */}
          <FlatList
            data={filteredOrders}
            keyExtractor={(item) => item.id}
            renderItem={renderOrderRow}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View className="py-16 items-center">
                <Ionicons name="receipt-outline" size={48} color="#d1d5db" />
                <Text className="text-gray-400 mt-2">No orders found</Text>
              </View>
            }
          />
        </View>
      </ScrollView>
    </View>
  );
}
