import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import {
  FlatList,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";

interface Payment {
  id: string;
  orderNo: string;
  orderAmount: number;
  businessName: string;
  paymentType: string;
  subType: string;
  scheduleStatus: "N/A" | "Scheduled" | "Overdue";
  paidAmount: number;
  collectedBy: string;
  paymentStatus: "Paid" | "Pending" | "Partial" | "Failed";
  paymentDetails: string;
  paymentDate: string;
  paymentId: string;
  invoiceNo: string;
  paymentCategory: "Sale" | "Return" | "Refund";
}

const SAMPLE_PAYMENTS: Payment[] = [
  { id: "1", orderNo: "SO-260122-05903", orderAmount: 421.99, businessName: "ALASKA TAX CUSTOMER", paymentType: "Cash", subType: "", scheduleStatus: "N/A", paidAmount: 421.99, collectedBy: "Admin", paymentStatus: "Paid", paymentDetails: "Full payment", paymentDate: "01/22/2026", paymentId: "PAY-001234", invoiceNo: "INV-260122-001", paymentCategory: "Sale" },
  { id: "2", orderNo: "SO-260122-05902", orderAmount: 8.99, businessName: "Geneshay Namh Inc", paymentType: "Cash", subType: "", scheduleStatus: "N/A", paidAmount: 4.49, collectedBy: "Cashier1", paymentStatus: "Partial", paymentDetails: "Partial payment", paymentDate: "01/22/2026", paymentId: "PAY-001235", invoiceNo: "INV-260122-002", paymentCategory: "Sale" },
  { id: "3", orderNo: "SO-260122-05902", orderAmount: 8.99, businessName: "Geneshay Namh Inc", paymentType: "Zelle", subType: "Wire Transfer", scheduleStatus: "Scheduled", paidAmount: 4.50, collectedBy: "Cashier1", paymentStatus: "Paid", paymentDetails: "Balance payment", paymentDate: "01/22/2026", paymentId: "PAY-001236", invoiceNo: "INV-260122-002", paymentCategory: "Sale" },
  { id: "4", orderNo: "SO-260122-05900", orderAmount: 39895.91, businessName: "ALASKA TAX CUSTOMER", paymentType: "Cash", subType: "", scheduleStatus: "N/A", paidAmount: 39895.91, collectedBy: "Admin", paymentStatus: "Paid", paymentDetails: "Full payment", paymentDate: "01/22/2026", paymentId: "PAY-001237", invoiceNo: "INV-260122-003", paymentCategory: "Sale" },
  { id: "5", orderNo: "SO-260121-05896", orderAmount: 623.22, businessName: "Sams Grocery Store", paymentType: "Credit Card", subType: "Visa", scheduleStatus: "Overdue", paidAmount: 0, collectedBy: "-", paymentStatus: "Pending", paymentDetails: "Awaiting payment", paymentDate: "-", paymentId: "-", invoiceNo: "INV-260121-004", paymentCategory: "Sale" },
  { id: "6", orderNo: "RE-260121-05890", orderAmount: 89.99, businessName: "Quick Mart LLC", paymentType: "Cash", subType: "", scheduleStatus: "N/A", paidAmount: 89.99, collectedBy: "Admin", paymentStatus: "Paid", paymentDetails: "Refund processed", paymentDate: "01/21/2026", paymentId: "PAY-001238", invoiceNo: "INV-260121-005", paymentCategory: "Refund" },
];

// Status colors
const paymentStatusColors: Record<Payment["paymentStatus"], { bg: string; text: string }> = {
  "Paid": { bg: "bg-green-100", text: "text-green-700" },
  "Pending": { bg: "bg-yellow-100", text: "text-yellow-700" },
  "Partial": { bg: "bg-blue-100", text: "text-blue-700" },
  "Failed": { bg: "bg-red-100", text: "text-red-700" },
};

const scheduleStatusColors: Record<Payment["scheduleStatus"], { bg: string; text: string }> = {
  "N/A": { bg: "bg-gray-100", text: "text-gray-600" },
  "Scheduled": { bg: "bg-blue-100", text: "text-blue-700" },
  "Overdue": { bg: "bg-red-100", text: "text-red-700" },
};

const categoryColors: Record<Payment["paymentCategory"], { bg: string; text: string }> = {
  "Sale": { bg: "bg-green-100", text: "text-green-700" },
  "Return": { bg: "bg-orange-100", text: "text-orange-700" },
  "Refund": { bg: "bg-purple-100", text: "text-purple-700" },
};

const TABS = ["Payments Logs", "Payment by Invoice"];

export default function PaymentsHistoryScreen() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("Payments Logs");
  const [payments] = useState<Payment[]>(SAMPLE_PAYMENTS);

  const filteredPayments = payments.filter(
    (p) =>
      p.businessName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.orderNo.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderPayment = ({ item }: { item: Payment }) => (
    <View className="flex-row items-center py-3 px-4 border-b border-gray-100 bg-white">
      <View className="w-6 mr-3">
        <View className="w-5 h-5 border border-gray-300 rounded" />
      </View>
      {/* Sale Order Details */}
      <View className="w-36">
        <Text className="text-blue-600 font-medium text-sm">{item.orderNo}</Text>
        <Text className="text-gray-500 text-xs">${item.orderAmount.toFixed(2)}</Text>
      </View>
      {/* Business Name */}
      <Text className="w-40 text-blue-600 text-sm" numberOfLines={1}>{item.businessName}</Text>
      {/* Payment Type / Sub Type */}
      <View className="w-32">
        <Text className="text-gray-800 text-sm">{item.paymentType}</Text>
        {item.subType && <Text className="text-gray-500 text-xs">{item.subType}</Text>}
      </View>
      {/* Schedule Status */}
      <View className="w-24 items-center">
        <View className={`px-2 py-0.5 rounded ${scheduleStatusColors[item.scheduleStatus].bg}`}>
          <Text className={`text-xs font-medium ${scheduleStatusColors[item.scheduleStatus].text}`}>
            {item.scheduleStatus}
          </Text>
        </View>
      </View>
      {/* Paid Amount */}
      <Text className="w-24 text-gray-800 text-sm text-center font-medium">
        ${item.paidAmount.toFixed(2)}
      </Text>
      {/* Collected By */}
      <Text className="w-24 text-gray-600 text-sm text-center">{item.collectedBy}</Text>
      {/* Payment Status */}
      <View className="w-24 items-center">
        <View className={`px-2 py-0.5 rounded ${paymentStatusColors[item.paymentStatus].bg}`}>
          <Text className={`text-xs font-medium ${paymentStatusColors[item.paymentStatus].text}`}>
            {item.paymentStatus}
          </Text>
        </View>
      </View>
      {/* Payment Details */}
      <Text className="w-28 text-gray-600 text-xs text-center" numberOfLines={1}>{item.paymentDetails}</Text>
      {/* Payment Date */}
      <Text className="w-24 text-gray-600 text-sm text-center">{item.paymentDate}</Text>
      {/* Payment ID */}
      <Text className="w-28 text-blue-600 text-xs text-center">{item.paymentId}</Text>
      {/* Invoice No */}
      <Text className="w-32 text-blue-600 text-xs text-center">{item.invoiceNo}</Text>
      {/* Payment Category */}
      <View className="w-24 items-center">
        <View className={`px-2 py-0.5 rounded ${categoryColors[item.paymentCategory].bg}`}>
          <Text className={`text-xs font-medium ${categoryColors[item.paymentCategory].text}`}>
            {item.paymentCategory}
          </Text>
        </View>
      </View>
    </View>
  );

  return (
    <View className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-white px-4 py-4 border-b border-gray-200">
        <Text className="text-2xl font-bold text-gray-800">Payments History</Text>
      </View>

      {/* Tabs */}
      <View className="bg-white flex-row border-b border-gray-200">
        {TABS.map((tab) => (
          <Pressable
            key={tab}
            onPress={() => setActiveTab(tab)}
            className={`px-6 py-3 ${
              activeTab === tab ? "border-b-2 border-red-500" : ""
            }`}
          >
            <Text
              className={`font-medium ${
                activeTab === tab ? "text-red-500" : "text-gray-600"
              }`}
            >
              {tab}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Search & Actions */}
      <View className="bg-white px-4 py-3 border-b border-gray-200">
        <Text className="text-gray-500 text-sm mb-2">
          Search by Order no, Payment no, Business name
        </Text>
        <View className="flex-row gap-3 mb-3">
          <TextInput
            className="flex-1 bg-gray-50 border border-gray-200 rounded-lg px-4 py-2"
            placeholder="Search"
            placeholderTextColor="#9ca3af"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          <Pressable className="bg-gray-100 px-4 py-2 rounded-lg flex-row items-center gap-2">
            <Ionicons name="filter" size={16} color="#374151" />
            <Text className="text-gray-700">Advance Filters</Text>
          </Pressable>
        </View>
        <View className="flex-row gap-3">
          <Pressable className="bg-green-500 px-4 py-2 rounded-lg flex-row items-center gap-2">
            <Text className="text-white font-medium">Export</Text>
            <Ionicons name="cloud-upload" size={16} color="white" />
          </Pressable>
          <Pressable className="bg-gray-100 px-4 py-2 rounded-lg flex-row items-center gap-2">
            <Ionicons name="grid" size={16} color="#374151" />
            <Text className="text-gray-700">Columns</Text>
          </Pressable>
        </View>
      </View>

      {/* Table */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={{ minWidth: 1400 }}>
          {/* Table Header */}
          <View className="flex-row bg-gray-50 py-3 px-4 border-b border-gray-200">
            <View className="w-6 mr-3">
              <View className="w-5 h-5 border border-gray-300 rounded" />
            </View>
            <Text className="w-36 text-gray-500 text-xs font-semibold uppercase">Sale Order Details</Text>
            <Text className="w-40 text-gray-500 text-xs font-semibold uppercase">Business Name</Text>
            <Text className="w-32 text-gray-500 text-xs font-semibold uppercase">Payment Type/Sub</Text>
            <Text className="w-24 text-gray-500 text-xs font-semibold uppercase text-center">Schedule Status</Text>
            <Text className="w-24 text-gray-500 text-xs font-semibold uppercase text-center">Paid Amount</Text>
            <Text className="w-24 text-gray-500 text-xs font-semibold uppercase text-center">Collected By</Text>
            <Text className="w-24 text-gray-500 text-xs font-semibold uppercase text-center">Payment Status</Text>
            <Text className="w-28 text-gray-500 text-xs font-semibold uppercase text-center">Payment Details</Text>
            <Text className="w-24 text-gray-500 text-xs font-semibold uppercase text-center">Payment Date</Text>
            <Text className="w-28 text-gray-500 text-xs font-semibold uppercase text-center">Payment ID</Text>
            <Text className="w-32 text-gray-500 text-xs font-semibold uppercase text-center">Invoice No</Text>
            <Text className="w-24 text-gray-500 text-xs font-semibold uppercase text-center">Category</Text>
          </View>

          {/* List */}
          <FlatList
            data={filteredPayments}
            keyExtractor={(item) => item.id}
            renderItem={renderPayment}
            showsVerticalScrollIndicator={false}
          />
        </View>
      </ScrollView>
    </View>
  );
}
