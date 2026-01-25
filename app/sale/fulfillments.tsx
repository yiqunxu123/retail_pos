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

interface Fulfillment {
  id: string;
  businessName: string;
  customerName: string;
  orderNo: string;
  shippingType: string;
  pickerDetails: string;
  pickerAssigned: boolean;
}

const SAMPLE_FULFILLMENTS: Fulfillment[] = [
  { id: "1", businessName: "Geneshay Namh Inc/ Shan Convenience Store", customerName: "GENESHAY NAMH INC", orderNo: "SO-260122-05902", shippingType: "Pickup", pickerDetails: "Not assigned", pickerAssigned: false },
  { id: "2", businessName: "ALASKA TAX CUSTOMER", customerName: "", orderNo: "SO-260122-05900", shippingType: "Pickup", pickerDetails: "Not assigned", pickerAssigned: false },
  { id: "3", businessName: "Exxon Racers Edge", customerName: "Krishna", orderNo: "SO-260121-05899", shippingType: "Pickup", pickerDetails: "discountws", pickerAssigned: true },
  { id: "4", businessName: "Jay Raghu Inc/ ATHENS FOOD MART", customerName: "PATEL ATULKUMAR/ MADHAVI SONI", orderNo: "SO-260121-05898", shippingType: "Pickup", pickerDetails: "Not assigned", pickerAssigned: false },
  { id: "5", businessName: "Sams Grocery Store", customerName: "VIKAS BHAI", orderNo: "SO-260121-05896", shippingType: "Pickup", pickerDetails: "Not assigned", pickerAssigned: false },
  { id: "6", businessName: "Jay Ramnam Inc", customerName: "Amitkumar Patel / ANKITA PATEL", orderNo: "SO-260121-05895", shippingType: "Dropoff", pickerDetails: "Not assigned", pickerAssigned: false },
];

const TABS = ["All", "Pending", "Picking", "Packing"];

export default function FulfillmentsScreen() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("All");
  const [fulfillments] = useState<Fulfillment[]>(SAMPLE_FULFILLMENTS);

  const filteredFulfillments = fulfillments.filter(
    (f) =>
      f.businessName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.orderNo.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderFulfillment = ({ item }: { item: Fulfillment }) => (
    <Pressable className="flex-row items-center py-3 px-4 border-b border-gray-100 bg-white">
      <View className="w-6 mr-3">
        <View className="w-5 h-5 border border-gray-300 rounded" />
      </View>
      <View className="flex-1">
        <Text className="text-blue-600 font-medium">{item.businessName}</Text>
        {item.customerName && (
          <Text className="text-blue-500 text-sm">{item.customerName}</Text>
        )}
      </View>
      <Text className="w-32 text-blue-600 text-center">{item.orderNo}</Text>
      <Text className="w-20 text-gray-600 text-center">{item.shippingType}</Text>
      <View className="w-28 flex-row items-center justify-center gap-1">
        <View
          className={`w-6 h-6 rounded-full items-center justify-center ${
            item.pickerAssigned ? "bg-red-500" : "bg-gray-300"
          }`}
        >
          <Text className="text-white text-xs font-bold">
            {item.pickerAssigned ? "D" : "?"}
          </Text>
        </View>
        <Text className="text-gray-600 text-sm" numberOfLines={1}>
          {item.pickerDetails}
        </Text>
      </View>
    </Pressable>
  );

  return (
    <View className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-white px-4 py-4 border-b border-gray-200">
        <Text className="text-2xl font-bold text-gray-800">Fulfillments</Text>
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
          Search by Customer (Name, Phone, Address), Business Name, Order no
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
          <Pressable className="bg-red-500 px-4 py-2 rounded-lg flex-row items-center gap-2">
            <Text className="text-white font-medium">Bulk Actions</Text>
            <Ionicons name="chevron-down" size={16} color="white" />
          </Pressable>
          <Pressable className="bg-gray-100 px-4 py-2 rounded-lg flex-row items-center gap-2">
            <Ionicons name="grid" size={16} color="#374151" />
            <Text className="text-gray-700">Freeze Columns</Text>
          </Pressable>
          <Pressable className="bg-gray-100 px-4 py-2 rounded-lg flex-row items-center gap-2">
            <Ionicons name="grid" size={16} color="#374151" />
            <Text className="text-gray-700">Columns</Text>
          </Pressable>
        </View>
      </View>

      {/* Table */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={{ minWidth: 700 }}>
          {/* Table Header */}
          <View className="flex-row bg-gray-50 py-3 px-4 border-b border-gray-200">
            <View className="w-6 mr-3">
              <View className="w-5 h-5 border border-gray-300 rounded" />
            </View>
            <Text className="flex-1 text-gray-500 text-xs font-semibold uppercase">
              Business Name / Customer Name
            </Text>
            <Text className="w-32 text-gray-500 text-xs font-semibold uppercase text-center">
              Order No / Date
            </Text>
            <Text className="w-20 text-gray-500 text-xs font-semibold uppercase text-center">
              Shipping Type
            </Text>
            <Text className="w-28 text-gray-500 text-xs font-semibold uppercase text-center">
              Picker Details
            </Text>
          </View>

          {/* List */}
          <FlatList
            data={filteredFulfillments}
            keyExtractor={(item) => item.id}
            renderItem={renderFulfillment}
            showsVerticalScrollIndicator={false}
          />
        </View>
      </ScrollView>
    </View>
  );
}
