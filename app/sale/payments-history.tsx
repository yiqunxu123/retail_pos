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
import { Payment, PaymentCategory, PaymentStatus, ScheduleStatus } from "../../types";

// ============================================================================
// Constants
// ============================================================================

const PAYMENT_STATUS_OPTIONS = [
  { label: "All", value: "all" },
  { label: "Paid", value: "Paid" },
  { label: "Pending", value: "Pending" },
  { label: "Partial", value: "Partial" },
  { label: "Failed", value: "Failed" },
];

const PAYMENT_TYPE_OPTIONS = [
  { label: "All", value: "all" },
  { label: "Cash", value: "Cash" },
  { label: "Credit Card", value: "Credit Card" },
  { label: "Zelle", value: "Zelle" },
];

const CATEGORY_OPTIONS = [
  { label: "All", value: "all" },
  { label: "Sale", value: "Sale" },
  { label: "Return", value: "Return" },
  { label: "Refund", value: "Refund" },
];

// ============================================================================
// Sample Data
// ============================================================================

const SAMPLE_PAYMENTS: Payment[] = [
  { id: "1", orderNo: "SO-260122-05903", orderAmount: 421.99, businessName: "ALASKA TAX CUSTOMER", paymentType: "Cash", subType: "", scheduleStatus: "N/A", paidAmount: 421.99, collectedBy: "Admin", paymentStatus: "Paid", paymentDetails: "Full payment", paymentDate: "01/22/2026", paymentId: "PAY-001234", invoiceNo: "INV-260122-001", paymentCategory: "Sale" },
  { id: "2", orderNo: "SO-260122-05902", orderAmount: 8.99, businessName: "Geneshay Namh Inc", paymentType: "Cash", subType: "", scheduleStatus: "N/A", paidAmount: 4.49, collectedBy: "Cashier1", paymentStatus: "Partial", paymentDetails: "Partial payment", paymentDate: "01/22/2026", paymentId: "PAY-001235", invoiceNo: "INV-260122-002", paymentCategory: "Sale" },
  { id: "3", orderNo: "SO-260122-05902", orderAmount: 8.99, businessName: "Geneshay Namh Inc", paymentType: "Zelle", subType: "Wire Transfer", scheduleStatus: "Scheduled", paidAmount: 4.50, collectedBy: "Cashier1", paymentStatus: "Paid", paymentDetails: "Balance payment", paymentDate: "01/22/2026", paymentId: "PAY-001236", invoiceNo: "INV-260122-002", paymentCategory: "Sale" },
  { id: "4", orderNo: "SO-260122-05900", orderAmount: 39895.91, businessName: "ALASKA TAX CUSTOMER", paymentType: "Cash", subType: "", scheduleStatus: "N/A", paidAmount: 39895.91, collectedBy: "Admin", paymentStatus: "Paid", paymentDetails: "Full payment", paymentDate: "01/22/2026", paymentId: "PAY-001237", invoiceNo: "INV-260122-003", paymentCategory: "Sale" },
  { id: "5", orderNo: "SO-260121-05896", orderAmount: 623.22, businessName: "Sams Grocery Store", paymentType: "Credit Card", subType: "Visa", scheduleStatus: "Overdue", paidAmount: 0, collectedBy: "-", paymentStatus: "Pending", paymentDetails: "Awaiting payment", paymentDate: "-", paymentId: "-", invoiceNo: "INV-260121-004", paymentCategory: "Sale" },
  { id: "6", orderNo: "RE-260121-05890", orderAmount: 89.99, businessName: "Quick Mart LLC", paymentType: "Cash", subType: "", scheduleStatus: "N/A", paidAmount: 89.99, collectedBy: "Admin", paymentStatus: "Paid", paymentDetails: "Refund processed", paymentDate: "01/21/2026", paymentId: "PAY-001238", invoiceNo: "INV-260121-005", paymentCategory: "Refund" },
];

// Status colors
const PAYMENT_STATUS_COLORS: Record<PaymentStatus, { bg: string; text: string }> = {
  Paid: { bg: "bg-green-100", text: "text-green-700" },
  Pending: { bg: "bg-yellow-100", text: "text-yellow-700" },
  Partial: { bg: "bg-blue-100", text: "text-blue-700" },
  Failed: { bg: "bg-red-100", text: "text-red-700" },
};

const SCHEDULE_STATUS_COLORS: Record<ScheduleStatus, { bg: string; text: string }> = {
  "N/A": { bg: "bg-gray-100", text: "text-gray-600" },
  Scheduled: { bg: "bg-blue-100", text: "text-blue-700" },
  Overdue: { bg: "bg-red-100", text: "text-red-700" },
};

const CATEGORY_COLORS: Record<PaymentCategory, { bg: string; text: string }> = {
  Sale: { bg: "bg-green-100", text: "text-green-700" },
  Return: { bg: "bg-orange-100", text: "text-orange-700" },
  Refund: { bg: "bg-purple-100", text: "text-purple-700" },
};

const TABS = ["Payments Logs", "Payment by Invoice"];

// ============================================================================
// Main Component
// ============================================================================

export default function PaymentsHistoryScreen() {
  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("Payments Logs");
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [typeFilter, setTypeFilter] = useState<string | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);

  const [payments] = useState<Payment[]>(SAMPLE_PAYMENTS);

  // Apply filters
  const filteredPayments = useMemo(() => {
    let result = [...payments];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (p) =>
          p.businessName.toLowerCase().includes(query) ||
          p.orderNo.toLowerCase().includes(query) ||
          p.paymentId.toLowerCase().includes(query)
      );
    }

    // Status filter
    if (statusFilter && statusFilter !== "all") {
      result = result.filter((p) => p.paymentStatus === statusFilter);
    }

    // Type filter
    if (typeFilter && typeFilter !== "all") {
      result = result.filter((p) => p.paymentType === typeFilter);
    }

    // Category filter
    if (categoryFilter && categoryFilter !== "all") {
      result = result.filter((p) => p.paymentCategory === categoryFilter);
    }

    return result;
  }, [payments, searchQuery, statusFilter, typeFilter, categoryFilter]);

  const renderPayment = ({ item }: { item: Payment }) => (
    <View className="flex-row items-center py-3 px-5 border-b border-gray-100 bg-white">
      <View className="w-8 mr-4">
        <View className="w-5 h-5 border border-gray-300 rounded" />
      </View>
      <View className="w-40">
        <Text className="text-blue-600 font-medium text-sm">{item.orderNo}</Text>
        <Text className="text-gray-500 text-xs">${item.orderAmount.toFixed(2)}</Text>
      </View>
      <Text className="w-48 text-blue-600 text-sm" numberOfLines={1}>{item.businessName}</Text>
      <View className="w-36">
        <Text className="text-gray-800 text-sm">{item.paymentType}</Text>
        {item.subType && <Text className="text-gray-500 text-xs">{item.subType}</Text>}
      </View>
      <View className="w-28 items-center">
        <View className={`px-2 py-0.5 rounded ${SCHEDULE_STATUS_COLORS[item.scheduleStatus].bg}`}>
          <Text className={`text-xs font-medium ${SCHEDULE_STATUS_COLORS[item.scheduleStatus].text}`}>
            {item.scheduleStatus}
          </Text>
        </View>
      </View>
      <Text className="w-28 text-gray-800 text-sm text-center font-medium">
        ${item.paidAmount.toFixed(2)}
      </Text>
      <Text className="w-28 text-gray-600 text-sm text-center">{item.collectedBy}</Text>
      <View className="w-28 items-center">
        <View className={`px-2 py-0.5 rounded ${PAYMENT_STATUS_COLORS[item.paymentStatus].bg}`}>
          <Text className={`text-xs font-medium ${PAYMENT_STATUS_COLORS[item.paymentStatus].text}`}>
            {item.paymentStatus}
          </Text>
        </View>
      </View>
      <Text className="w-32 text-gray-600 text-xs text-center" numberOfLines={1}>{item.paymentDetails}</Text>
      <Text className="w-28 text-gray-600 text-sm text-center">{item.paymentDate}</Text>
      <Text className="w-32 text-blue-600 text-xs text-center">{item.paymentId}</Text>
      <Text className="w-36 text-blue-600 text-xs text-center">{item.invoiceNo}</Text>
      <View className="w-28 items-center">
        <View className={`px-2 py-0.5 rounded ${CATEGORY_COLORS[item.paymentCategory].bg}`}>
          <Text className={`text-xs font-medium ${CATEGORY_COLORS[item.paymentCategory].text}`}>
            {item.paymentCategory}
          </Text>
        </View>
      </View>
    </View>
  );

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
        <Text className="text-gray-500 text-sm mb-2">
          Search by Order no, Payment no, Business name
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
            options={PAYMENT_STATUS_OPTIONS}
            onChange={setStatusFilter}
            placeholder="Status"
            width={120}
          />
          <FilterDropdown
            label=""
            value={typeFilter}
            options={PAYMENT_TYPE_OPTIONS}
            onChange={setTypeFilter}
            placeholder="Type"
            width={130}
          />
          <FilterDropdown
            label=""
            value={categoryFilter}
            options={CATEGORY_OPTIONS}
            onChange={setCategoryFilter}
            placeholder="Category"
            width={120}
          />
        </View>
        <View className="flex-row gap-3 items-center justify-between">
          <View className="flex-row gap-3">
            <Pressable className="bg-green-500 px-4 py-2.5 rounded-lg flex-row items-center gap-2">
              <Text className="text-white font-medium">Export</Text>
              <Ionicons name="cloud-upload" size={16} color="white" />
            </Pressable>
            <Pressable className="bg-gray-100 px-4 py-2.5 rounded-lg flex-row items-center gap-2">
              <Ionicons name="grid" size={16} color="#374151" />
              <Text className="text-gray-700">Columns</Text>
            </Pressable>
          </View>
          <Text className="text-gray-400 text-sm">
            {filteredPayments.length} payments
          </Text>
        </View>
      </View>

      {/* Table */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-1">
        <View style={{ minWidth: 1600 }}>
          {/* Table Header */}
          <View className="flex-row bg-gray-50 py-3 px-5 border-b border-gray-200">
            <View className="w-8 mr-4">
              <View className="w-5 h-5 border border-gray-300 rounded" />
            </View>
            <Text className="w-40 text-gray-500 text-xs font-semibold uppercase">Sale Order Details</Text>
            <Text className="w-48 text-gray-500 text-xs font-semibold uppercase">Business Name</Text>
            <Text className="w-36 text-gray-500 text-xs font-semibold uppercase">Payment Type/Sub</Text>
            <Text className="w-28 text-gray-500 text-xs font-semibold uppercase text-center">Schedule Status</Text>
            <Text className="w-28 text-gray-500 text-xs font-semibold uppercase text-center">Paid Amount</Text>
            <Text className="w-28 text-gray-500 text-xs font-semibold uppercase text-center">Collected By</Text>
            <Text className="w-28 text-gray-500 text-xs font-semibold uppercase text-center">Payment Status</Text>
            <Text className="w-32 text-gray-500 text-xs font-semibold uppercase text-center">Payment Details</Text>
            <Text className="w-28 text-gray-500 text-xs font-semibold uppercase text-center">Payment Date</Text>
            <Text className="w-32 text-gray-500 text-xs font-semibold uppercase text-center">Payment ID</Text>
            <Text className="w-36 text-gray-500 text-xs font-semibold uppercase text-center">Invoice No</Text>
            <Text className="w-28 text-gray-500 text-xs font-semibold uppercase text-center">Category</Text>
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
