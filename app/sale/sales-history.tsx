import { Ionicons } from "@expo/vector-icons";
import { useMemo, useState } from "react";
import {
  FlatList,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { FilterDropdown, PageHeader } from "../../components";
import { Order, OrderStat, InvoiceStatus } from "../../types";

// ============================================================================
// Constants
// ============================================================================

const INVOICE_STATUS_OPTIONS = [
  { label: "All", value: "all" },
  { label: "Paid", value: "Paid" },
  { label: "Un Paid", value: "Un Paid" },
  { label: "Partially", value: "Partially" },
];

const CREATED_BY_OPTIONS = [
  { label: "All Users", value: "all" },
  { label: "discountws", value: "discountws" },
  { label: "umar123", value: "umar123" },
  { label: "admin", value: "admin" },
];

const DATE_RANGE_OPTIONS = [
  { label: "All Time", value: "all" },
  { label: "Today", value: "today" },
  { label: "Last 7 Days", value: "7days" },
  { label: "Last 30 Days", value: "30days" },
];

// ============================================================================
// Sample Data
// ============================================================================

const SAMPLE_ORDERS: Order[] = [
  { id: "1", orderNumber: "SO-260126-05915", dateTime: "01/26/2026, 07:00:21, CST", businessName: "TEST CUSTOMER", customerName: "Test Customer", createdBy: "discountws", saleTotal: 45.00, invoiceStatus: "Un Paid" },
  { id: "2", orderNumber: "SO-260126-05914", dateTime: "01/26/2026, 06:59:08, CST", businessName: "Test customer 22", customerName: "John Doe", createdBy: "umar123", saleTotal: 45.00, invoiceStatus: "Partially" },
  { id: "3", orderNumber: "SO-260126-05913", dateTime: "01/26/2026, 06:57:52, CST", businessName: "TEST CUSTOMER", customerName: "Test Customer", createdBy: "discountws", saleTotal: 90.00, invoiceStatus: "Paid" },
  { id: "4", orderNumber: "SO-260126-05912", dateTime: "01/26/2026, 06:41:16, CST", businessName: "Spirit Wholesale", customerName: "Spirit Inc", createdBy: "umar123", saleTotal: 146.93, invoiceStatus: "Un Paid" },
  { id: "5", orderNumber: "SO-260126-05911", dateTime: "01/26/2026, 06:35:22, CST", businessName: "ABC Retail Store", customerName: "Mike Smith", createdBy: "admin", saleTotal: 289.50, invoiceStatus: "Paid" },
  { id: "6", orderNumber: "SO-260126-05910", dateTime: "01/26/2026, 06:20:15, CST", businessName: "Quick Mart LLC", customerName: "Sarah Johnson", createdBy: "discountws", saleTotal: 567.25, invoiceStatus: "Partially" },
];

const ORDER_STATS: OrderStat[] = [
  { label: "Pending", value: 18, color: "text-gray-700" },
  { label: "Picker Assigned", value: 0, color: "text-gray-700" },
  { label: "Partially Executed", value: 0, color: "text-gray-700" },
  { label: "Picking in progress", value: 1, color: "text-green-600" },
  { label: "Picking Paused", value: 0, color: "text-red-500" },
  { label: "Picking Completed", value: 0, color: "text-green-600" },
  { label: "Packing in progress", value: 0, color: "text-blue-600" },
  { label: "Packed", value: 36, color: "text-blue-600" },
  { label: "Executed", value: 294, color: "text-gray-700" },
  { label: "Completed", value: 4746, color: "text-green-600" },
  { label: "Partially Returned", value: 0, color: "text-gray-700" },
  { label: "Parked", value: 3, color: "text-red-500" },
];

const INVOICE_STATUS_COLORS: Record<InvoiceStatus, { bg: string; text: string }> = {
  Paid: { bg: "bg-green-500", text: "text-white" },
  "Un Paid": { bg: "bg-red-500", text: "text-white" },
  Partially: { bg: "bg-yellow-500", text: "text-white" },
};

const TABS = ["Orders", "Voided"] as const;

// ============================================================================
// Reusable Components
// ============================================================================

function TableCheckbox() {
  return <View className="w-5 h-5 border border-gray-300 rounded" />;
}

function InvoiceStatusBadge({ status }: { status: InvoiceStatus }) {
  const colors = INVOICE_STATUS_COLORS[status];
  return (
    <View className={`px-3 py-1 rounded ${colors.bg}`}>
      <Text className={`font-medium text-sm ${colors.text}`}>{status}</Text>
    </View>
  );
}

function StatItem({ stat }: { stat: OrderStat }) {
  return (
    <View className="flex-row items-center">
      <Text className="text-gray-600 text-sm">{stat.label} : </Text>
      <Text className={`font-semibold ${stat.color}`}>{stat.value}</Text>
    </View>
  );
}

// ============================================================================
// Helper Functions
// ============================================================================

function formatCurrency(value: number): string {
  return `$${value.toFixed(2)}`;
}

// ============================================================================
// Main Component
// ============================================================================

export default function SalesHistoryScreen() {
  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<typeof TABS[number]>("Orders");
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [createdByFilter, setCreatedByFilter] = useState<string | null>(null);
  const [dateRangeFilter, setDateRangeFilter] = useState<string | null>(null);

  const [orders] = useState<Order[]>(SAMPLE_ORDERS);

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
          o.orderNumber.toLowerCase().includes(query)
      );
    }

    // Invoice status filter
    if (statusFilter && statusFilter !== "all") {
      result = result.filter((o) => o.invoiceStatus === statusFilter);
    }

    // Created by filter
    if (createdByFilter && createdByFilter !== "all") {
      result = result.filter((o) => o.createdBy === createdByFilter);
    }

    return result;
  }, [orders, searchQuery, statusFilter, createdByFilter, dateRangeFilter]);

  const renderOrderRow = ({ item }: { item: Order }) => (
    <View className="flex-row items-center py-3 px-5 border-b border-gray-100 bg-white">
      <View className="w-8 mr-4">
        <TableCheckbox />
      </View>
      <Text className="w-40 text-blue-600 font-medium">{item.orderNumber}</Text>
      <Text className="w-48 text-gray-600 text-sm">{item.dateTime}</Text>
      <View className="w-56">
        <Text className="text-blue-600 font-medium" numberOfLines={1}>{item.businessName}</Text>
        <Text className="text-gray-500 text-sm" numberOfLines={1}>{item.customerName}</Text>
      </View>
      <Text className="w-32 text-gray-600 text-center">{item.createdBy}</Text>
      <View className="w-28 items-center">
        <View className="bg-yellow-400 px-3 py-1 rounded">
          <Text className="text-gray-800 font-bold">{formatCurrency(item.saleTotal)}</Text>
        </View>
      </View>
      <View className="w-28 items-center">
        <InvoiceStatusBadge status={item.invoiceStatus} />
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
        <Text className="text-lg font-semibold text-gray-800 mb-3">Orders ({filteredOrders.length})</Text>
        <View className="flex-row flex-wrap gap-x-6 gap-y-2">
          {ORDER_STATS.map((stat, index) => (
            <StatItem key={index} stat={stat} />
          ))}
        </View>
      </View>

      {/* Toolbar */}
      <View className="bg-white px-5 py-4 border-b border-gray-200">
        {/* Search Input */}
        <Text className="text-gray-500 text-sm mb-2">
          Search by Customer (Name, Phone, Address), Business Name, Order no
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
            options={INVOICE_STATUS_OPTIONS}
            onChange={setStatusFilter}
            placeholder="Invoice Status"
            width={140}
          />
          <FilterDropdown
            label=""
            value={createdByFilter}
            options={CREATED_BY_OPTIONS}
            onChange={setCreatedByFilter}
            placeholder="Created By"
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
              <Ionicons name="lock-closed" size={16} color="#374151" />
              <Text className="text-gray-700 font-medium">Freeze Columns</Text>
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
        <View style={{ minWidth: 1100 }}>
          {/* Table Header */}
          <View className="flex-row bg-gray-50 py-3 px-5 border-b border-gray-200">
            <View className="w-8 mr-4">
              <TableCheckbox />
            </View>
            <Text className="w-40 text-gray-500 text-xs font-semibold uppercase">Order Number</Text>
            <Text className="w-48 text-gray-500 text-xs font-semibold uppercase">Date / Time</Text>
            <Text className="w-56 text-gray-500 text-xs font-semibold uppercase">Business Name / Customer Name</Text>
            <Text className="w-32 text-gray-500 text-xs font-semibold uppercase text-center">Created By</Text>
            <Text className="w-28 text-gray-500 text-xs font-semibold uppercase text-center">Sale Total</Text>
            <Text className="w-28 text-gray-500 text-xs font-semibold uppercase text-center">Invoice Status</Text>
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
