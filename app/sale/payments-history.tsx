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
import { PAYMENT_STATUS, PAYMENT_TYPE, PaymentView, usePayments } from "../../utils/powersync/hooks";

// ============================================================================
// Constants
// ============================================================================

const STATUS_OPTIONS = [
  { label: "All", value: "all" },
  { label: "Pending", value: "0" },
  { label: "Completed", value: "1" },
  { label: "Failed", value: "2" },
  { label: "Refunded", value: "3" },
];

const TYPE_OPTIONS = [
  { label: "All", value: "all" },
  { label: "Cash", value: "0" },
  { label: "Check", value: "1" },
  { label: "Credit Card", value: "2" },
  { label: "Bank Transfer", value: "3" },
];

const TABS = ["Payments Logs", "Payment by Invoice"];

// ============================================================================
// Helper Functions
// ============================================================================

function formatCurrency(value: number): string {
  return `$${value.toFixed(2)}`;
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

function getStatusColor(status: number): { bg: string; text: string } {
  const colors: Record<number, { bg: string; text: string }> = {
    0: { bg: "bg-yellow-100", text: "text-yellow-700" },
    1: { bg: "bg-green-100", text: "text-green-700" },
    2: { bg: "bg-red-100", text: "text-red-700" },
    3: { bg: "bg-purple-100", text: "text-purple-700" },
  };
  return colors[status] || { bg: "bg-gray-100", text: "text-gray-600" };
}

// ============================================================================
// Main Component
// ============================================================================

export default function PaymentsHistoryScreen() {
  // Data from PowerSync
  const { payments, isLoading, isStreaming } = usePayments();

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("Payments Logs");
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [typeFilter, setTypeFilter] = useState<string | null>(null);

  // Apply filters
  const filteredPayments = useMemo(() => {
    let result = [...payments];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (p) =>
          p.businessName.toLowerCase().includes(query) ||
          p.customerName.toLowerCase().includes(query) ||
          p.paymentNo.toLowerCase().includes(query)
      );
    }

    // Status filter
    if (statusFilter && statusFilter !== "all") {
      result = result.filter((p) => p.status === parseInt(statusFilter));
    }

    // Type filter
    if (typeFilter && typeFilter !== "all") {
      result = result.filter((p) => p.paymentType === parseInt(typeFilter));
    }

    return result;
  }, [payments, searchQuery, statusFilter, typeFilter]);

  // Loading state
  if (isLoading && payments.length === 0) {
    return (
      <View className="flex-1 bg-gray-50">
        <PageHeader title="Payments History" />
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text className="mt-4 text-gray-600">Loading payments...</Text>
        </View>
      </View>
    );
  }

  const renderPayment = ({ item }: { item: PaymentView }) => {
    const statusColor = getStatusColor(item.status);
    const statusText = PAYMENT_STATUS[item.status as keyof typeof PAYMENT_STATUS] || 'Unknown';
    const typeText = PAYMENT_TYPE[item.paymentType as keyof typeof PAYMENT_TYPE] || 'Unknown';

    return (
      <View className="flex-row items-center py-3 px-5 border-b border-gray-100 bg-white">
        <View className="w-8 mr-4">
          <View className="w-5 h-5 border border-gray-300 rounded" />
        </View>
        <Text className="w-32 text-blue-600 font-medium text-sm">{item.paymentNo || '-'}</Text>
        <View className="w-48">
          <Text className="text-blue-600 text-sm" numberOfLines={1}>{item.businessName || '-'}</Text>
          <Text className="text-gray-500 text-xs" numberOfLines={1}>{item.customerName || '-'}</Text>
        </View>
        <Text className="w-28 text-gray-800 text-sm">{typeText}</Text>
        <Text className="w-28 text-gray-800 text-sm text-center font-medium">
          {formatCurrency(item.amount)}
        </Text>
        <View className="w-28 items-center">
          <View className={`px-2 py-0.5 rounded ${statusColor.bg}`}>
            <Text className={`text-xs font-medium ${statusColor.text}`}>
              {statusText}
            </Text>
          </View>
        </View>
        <Text className="w-28 text-gray-600 text-sm text-center">{formatDate(item.paymentDate)}</Text>
        <Text className="w-48 text-gray-500 text-xs" numberOfLines={1}>{item.memo || '-'}</Text>
        <View className="w-20 flex-row items-center justify-center gap-2">
          <Pressable className="bg-blue-100 p-1.5 rounded">
            <Ionicons name="eye" size={14} color="#3b82f6" />
          </Pressable>
        </View>
      </View>
    );
  };

  return (
    <View className="flex-1 bg-gray-50">
      <PageHeader title="Payments History" />

      {/* Tabs */}
      <View className="bg-white flex-row border-b border-gray-200">
        {TABS.map((tab) => (
          <Pressable
            key={tab}
            onPress={() => setActiveTab(tab)}
            className={`px-6 py-3 ${activeTab === tab ? "border-b-2 border-red-500" : ""}`}
          >
            <Text className={`font-medium ${activeTab === tab ? "text-red-500" : "text-gray-600"}`}>
              {tab}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Search & Actions */}
      <View className="bg-white px-5 py-4 border-b border-gray-200">
        <View className="flex-row items-center gap-2 mb-3">
          <Text className="text-lg font-semibold text-gray-800">Payments ({filteredPayments.length})</Text>
          {isStreaming && (
            <Text className="text-green-600 text-xs">● Live</Text>
          )}
        </View>
        <Text className="text-gray-500 text-sm mb-2">
          Search by Payment No, Business Name, Customer Name
        </Text>
        <View className="flex-row gap-4 mb-4">
          <View className="flex-1">
            <TextInput
              className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5"
              placeholder="Search payments..."
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
            width={130}
          />
          <FilterDropdown
            label=""
            value={typeFilter}
            options={TYPE_OPTIONS}
            onChange={setTypeFilter}
            placeholder="Type"
            width={140}
          />
        </View>
        <Pressable className="bg-gray-100 px-4 py-2.5 rounded-lg flex-row items-center gap-2 self-start">
          <Ionicons name="grid" size={16} color="#374151" />
          <Text className="text-gray-700">Columns</Text>
        </Pressable>
      </View>

      {/* Table */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-1">
        <View style={{ minWidth: 900 }}>
          {/* Table Header */}
          <View className="flex-row bg-gray-50 py-3 px-5 border-b border-gray-200">
            <View className="w-8 mr-4">
              <View className="w-5 h-5 border border-gray-300 rounded" />
            </View>
            <Text className="w-32 text-gray-500 text-xs font-semibold uppercase">Payment No</Text>
            <Text className="w-48 text-gray-500 text-xs font-semibold uppercase">Business / Customer</Text>
            <Text className="w-28 text-gray-500 text-xs font-semibold uppercase">Type</Text>
            <Text className="w-28 text-gray-500 text-xs font-semibold uppercase text-center">Amount</Text>
            <Text className="w-28 text-gray-500 text-xs font-semibold uppercase text-center">Status</Text>
            <Text className="w-28 text-gray-500 text-xs font-semibold uppercase text-center">Date</Text>
            <Text className="w-48 text-gray-500 text-xs font-semibold uppercase">Memo</Text>
            <Text className="w-20 text-gray-500 text-xs font-semibold uppercase text-center">Actions</Text>
          </View>

          {/* List */}
          <FlatList
            data={filteredPayments}
            keyExtractor={(item) => item.id}
            renderItem={renderPayment}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View className="py-16 items-center">
                <Ionicons name="card-outline" size={48} color="#d1d5db" />
                <Text className="text-gray-400 mt-2">No payments found</Text>
              </View>
            }
          />
        </View>
      </ScrollView>
    </View>
  );
}
