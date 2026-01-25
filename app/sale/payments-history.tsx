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
  amount: string;
  businessName: string;
  paymentType: string;
  subType: string;
  scheduled: string;
}

const SAMPLE_PAYMENTS: Payment[] = [
  { id: "1", orderNo: "SO-260122-05903", amount: "$421.99", businessName: "ALASKA TAX CUSTOMER", paymentType: "Cash", subType: "", scheduled: "N/A" },
  { id: "2", orderNo: "SO-260122-05902", amount: "$4.49", businessName: "Geneshay Namh Inc/ Shan Convenience Store", paymentType: "Cash", subType: "", scheduled: "N/A" },
  { id: "3", orderNo: "SO-260122-05902", amount: "$4.50", businessName: "Geneshay Namh Inc/ Shan Convenience Store", paymentType: "Zelle Wire Transfer", subType: "", scheduled: "N/A" },
  { id: "4", orderNo: "SO-260122-05900", amount: "$39895.91", businessName: "ALASKA TAX CUSTOMER", paymentType: "Cash", subType: "", scheduled: "N/A" },
  { id: "5", orderNo: "SO-260121-05896", amount: "$623.22", businessName: "Sams Grocery Store", paymentType: "Cash", subType: "", scheduled: "N/A" },
];

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
    <Pressable className="flex-row items-center py-3 px-4 border-b border-gray-100 bg-white">
      <View className="w-6 mr-3">
        <View className="w-5 h-5 border border-gray-300 rounded" />
      </View>
      <View className="w-40">
        <Text className="text-blue-600 font-medium">{item.orderNo}</Text>
        <Text className="text-gray-600 text-sm">{item.amount}</Text>
      </View>
      <Text className="flex-1 text-blue-600">{item.businessName}</Text>
      <Text className="w-32 text-gray-600 text-center">{item.paymentType}</Text>
      <Text className="w-20 text-gray-600 text-center">{item.scheduled}</Text>
    </Pressable>
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
        <View style={{ minWidth: 650 }}>
          {/* Table Header */}
          <View className="flex-row bg-gray-50 py-3 px-4 border-b border-gray-200">
            <View className="w-6 mr-3">
              <View className="w-5 h-5 border border-gray-300 rounded" />
            </View>
            <Text className="w-40 text-gray-500 text-xs font-semibold uppercase">Sale Order Details</Text>
            <Text className="flex-1 text-gray-500 text-xs font-semibold uppercase">Business Name</Text>
            <Text className="w-32 text-gray-500 text-xs font-semibold uppercase text-center">Payment Type</Text>
            <Text className="w-20 text-gray-500 text-xs font-semibold uppercase text-center">Sched</Text>
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
