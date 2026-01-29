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

// ============================================================================
// Types
// ============================================================================

interface SalesReturn {
  id: string;
  returnNumber: string;
  dateTime: string;
  businessName: string;
  customerName: string;
  channelName: string;
  soldBy: string;
  invoiceTotal: number;
  returnedTotal: number;
  status: "Completed" | "Pending" | "Processing" | "Rejected";
}

// ============================================================================
// Constants
// ============================================================================

const STATUS_OPTIONS = [
  { label: "All", value: "all" },
  { label: "Completed", value: "Completed" },
  { label: "Pending", value: "Pending" },
  { label: "Processing", value: "Processing" },
  { label: "Rejected", value: "Rejected" },
];

const CHANNEL_OPTIONS = [
  { label: "All", value: "all" },
  { label: "Primary", value: "Primary" },
  { label: "Secondary", value: "Secondary" },
];

const SOLD_BY_OPTIONS = [
  { label: "All", value: "all" },
  { label: "Admin/Cashier", value: "Admin/Cashier" },
];

// ============================================================================
// Sample Data
// ============================================================================

const SAMPLE_RETURNS: SalesReturn[] = [
  { id: "1", returnNumber: "RE-260121-05890", dateTime: "01/21/2026 07:45 AM", businessName: "RAJ PATEL/ OM JAY KALI INC", customerName: "Raj Patel", channelName: "Primary", soldBy: "Admin/Cashier", invoiceTotal: 245.50, returnedTotal: 89.99, status: "Completed" },
  { id: "2", returnNumber: "RE-260120-05868", dateTime: "01/20/2026 12:42 PM", businessName: "A&J EXPRESS INC/ NEW HOPE WAVAHO", customerName: "NEHA SANKET PATEL", channelName: "Primary", soldBy: "Admin/Cashier", invoiceTotal: 532.00, returnedTotal: 150.00, status: "Pending" },
  { id: "3", returnNumber: "RE-260120-05865", dateTime: "01/20/2026 12:01 PM", businessName: "A&J EXPRESS INC/ NEW HOPE WAVAHO", customerName: "NEHA SANKET PATEL", channelName: "Primary", soldBy: "Admin/Cashier", invoiceTotal: 178.25, returnedTotal: 178.25, status: "Processing" },
  { id: "4", returnNumber: "RE-260120-05859", dateTime: "01/20/2026 10:32 AM", businessName: "JAY SHIV LLC", customerName: "AMITKUMAR PATEL/ BHAVESHBHAI PATEL", channelName: "Primary", soldBy: "Admin/Cashier", invoiceTotal: 890.00, returnedTotal: 45.00, status: "Rejected" },
];

const STATUS_COLORS: Record<SalesReturn["status"], { bg: string; text: string }> = {
  Completed: { bg: "bg-green-100", text: "text-green-700" },
  Pending: { bg: "bg-yellow-100", text: "text-yellow-700" },
  Processing: { bg: "bg-blue-100", text: "text-blue-700" },
  Rejected: { bg: "bg-red-100", text: "text-red-700" },
};

// ============================================================================
// Main Component
// ============================================================================

export default function SalesReturnScreen() {
  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [channelFilter, setChannelFilter] = useState<string | null>(null);
  const [soldByFilter, setSoldByFilter] = useState<string | null>(null);

  const [returns] = useState<SalesReturn[]>(SAMPLE_RETURNS);

  // Apply filters
  const filteredReturns = useMemo(() => {
    let result = [...returns];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (r) =>
          r.businessName.toLowerCase().includes(query) ||
          r.customerName.toLowerCase().includes(query) ||
          r.returnNumber.toLowerCase().includes(query)
      );
    }

    // Status filter
    if (statusFilter && statusFilter !== "all") {
      result = result.filter((r) => r.status === statusFilter);
    }

    // Channel filter
    if (channelFilter && channelFilter !== "all") {
      result = result.filter((r) => r.channelName === channelFilter);
    }

    // Sold by filter
    if (soldByFilter && soldByFilter !== "all") {
      result = result.filter((r) => r.soldBy === soldByFilter);
    }

    return result;
  }, [returns, searchQuery, statusFilter, channelFilter, soldByFilter]);

  const renderReturn = ({ item }: { item: SalesReturn }) => (
    <View className="flex-row items-center py-3 px-5 border-b border-gray-100 bg-white">
      <View className="w-8 mr-4">
        <View className="w-5 h-5 border border-gray-300 rounded" />
      </View>
      <Text className="w-36 text-blue-600 font-medium">{item.returnNumber}</Text>
      <Text className="w-40 text-gray-600 text-sm">{item.dateTime}</Text>
      <View className="w-64">
        <Text className="text-blue-600" numberOfLines={1}>{item.businessName}</Text>
        <Text className="text-blue-500 text-sm" numberOfLines={1}>{item.customerName}</Text>
      </View>
      <Text className="w-24 text-gray-600 text-center">{item.channelName}</Text>
      <Text className="w-28 text-gray-600 text-center">{item.soldBy}</Text>
      <Text className="w-28 text-gray-800 text-center font-medium">${item.invoiceTotal.toFixed(2)}</Text>
      <Text className="w-28 text-red-600 text-center font-medium">${item.returnedTotal.toFixed(2)}</Text>
      <View className="w-28 items-center">
        <View className={`px-2 py-1 rounded-full ${STATUS_COLORS[item.status].bg}`}>
          <Text className={`text-xs font-medium ${STATUS_COLORS[item.status].text}`}>{item.status}</Text>
        </View>
      </View>
      <View className="w-28 flex-row items-center justify-center gap-2">
        <Pressable className="bg-blue-100 p-2 rounded-lg">
          <Ionicons name="eye" size={16} color="#3b82f6" />
        </Pressable>
        <Pressable className="bg-green-100 p-2 rounded-lg">
          <Ionicons name="pencil" size={16} color="#22c55e" />
        </Pressable>
        <Pressable className="bg-red-100 p-2 rounded-lg">
          <Ionicons name="trash" size={16} color="#ef4444" />
        </Pressable>
      </View>
    </View>
  );

  return (
    <View className="flex-1 bg-gray-50">
      <PageHeader title="Sales Return" />

      {/* Search & Actions */}
      <View className="bg-white px-5 py-4 border-b border-gray-200">
        <View className="flex-row items-center justify-between mb-4">
          <Text className="text-lg font-semibold text-gray-800">Sales Return ({filteredReturns.length})</Text>
          <Pressable className="bg-red-500 px-4 py-2.5 rounded-lg">
            <Text className="text-white font-medium">Create Sale Return</Text>
          </Pressable>
        </View>
        <View className="flex-row gap-4">
          <View className="flex-1">
            <TextInput
              className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5"
              placeholder="Search returns..."
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
            value={channelFilter}
            options={CHANNEL_OPTIONS}
            onChange={setChannelFilter}
            placeholder="Channel"
            width={130}
          />
          <FilterDropdown
            label=""
            value={soldByFilter}
            options={SOLD_BY_OPTIONS}
            onChange={setSoldByFilter}
            placeholder="Sold By"
            width={140}
          />
        </View>
        <Text className="text-gray-400 text-sm mt-2">
          Search by Customer (Name, Phone, Address), Business Name, Order no
        </Text>
      </View>

      {/* Table */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-1">
        <View style={{ minWidth: 1300 }}>
          {/* Table Header */}
          <View className="flex-row bg-gray-50 py-3 px-5 border-b border-gray-200">
            <View className="w-8 mr-4">
              <View className="w-5 h-5 border border-gray-300 rounded" />
            </View>
            <Text className="w-36 text-gray-500 text-xs font-semibold uppercase">Return Number</Text>
            <Text className="w-40 text-gray-500 text-xs font-semibold uppercase">Date / Time</Text>
            <Text className="w-64 text-gray-500 text-xs font-semibold uppercase">Business / Customer</Text>
            <Text className="w-24 text-gray-500 text-xs font-semibold uppercase text-center">Channel</Text>
            <Text className="w-28 text-gray-500 text-xs font-semibold uppercase text-center">Sold By</Text>
            <Text className="w-28 text-gray-500 text-xs font-semibold uppercase text-center">Invoice Total</Text>
            <Text className="w-28 text-gray-500 text-xs font-semibold uppercase text-center">Returned Total</Text>
            <Text className="w-28 text-gray-500 text-xs font-semibold uppercase text-center">Status</Text>
            <Text className="w-28 text-gray-500 text-xs font-semibold uppercase text-center">Actions</Text>
          </View>

          {/* List */}
          <FlatList
            data={filteredReturns}
            keyExtractor={(item) => item.id}
            renderItem={renderReturn}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View className="py-16 items-center">
                <Ionicons name="return-down-back-outline" size={48} color="#d1d5db" />
                <Text className="text-gray-400 mt-2">No returns found</Text>
              </View>
            }
          />
        </View>
      </ScrollView>
    </View>
  );
}
