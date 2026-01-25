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

interface Customer {
  id: string;
  businessName: string;
  name: string;
  allowEcom: boolean;
  onAccountBalance: number;
  isActive: boolean;
}

const SAMPLE_CUSTOMERS: Customer[] = [
  { id: "475", businessName: "ALASKA TAX CUSTOMER", name: "", allowEcom: false, onAccountBalance: 0, isActive: true },
  { id: "474", businessName: "fatima", name: "fatima", allowEcom: true, onAccountBalance: 0, isActive: true },
  { id: "473", businessName: "KHUB Test Ecom", name: "", allowEcom: true, onAccountBalance: 0, isActive: true },
  { id: "472", businessName: "ARIYA529 LLC", name: "JIGNESH PATEL", allowEcom: false, onAccountBalance: 0, isActive: true },
  { id: "471", businessName: "1 VINAYAKK FUELS INC / CHEVRON WOODMONT", name: "VIRAL BHAI", allowEcom: false, onAccountBalance: 0, isActive: true },
  { id: "470", businessName: "BALCH RD SHELL INC/JAY PATEL", name: "C J PATEL", allowEcom: false, onAccountBalance: 0, isActive: true },
];

export default function CustomersScreen() {
  const [searchQuery, setSearchQuery] = useState("");
  const [customers] = useState<Customer[]>(SAMPLE_CUSTOMERS);

  const filteredCustomers = customers.filter(
    (c) =>
      c.businessName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderCustomer = ({ item }: { item: Customer }) => (
    <Pressable className="flex-row items-center py-3 px-4 border-b border-gray-100 bg-white">
      <View className="flex-1">
        <Text className="text-blue-600 font-medium">{item.businessName}</Text>
        {item.name && <Text className="text-gray-500 text-sm">{item.name}</Text>}
      </View>
      <View className="w-16 items-center">
        {item.allowEcom ? (
          <Ionicons name="checkmark-circle" size={20} color="#22c55e" />
        ) : (
          <Ionicons name="close-circle" size={20} color="#ef4444" />
        )}
      </View>
      <View className="w-20 items-center">
        <View className="bg-green-500 rounded-full px-2 py-1">
          <Text className="text-white text-xs font-medium">${item.onAccountBalance}</Text>
        </View>
      </View>
      <View className="w-12 items-center">
        <Text className="text-gray-600 text-sm">{item.id}</Text>
      </View>
      <View className="w-10 items-center">
        {item.isActive ? (
          <Ionicons name="checkmark-circle" size={18} color="#22c55e" />
        ) : (
          <Ionicons name="close-circle" size={18} color="#ef4444" />
        )}
      </View>
    </Pressable>
  );

  return (
    <View className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-white px-4 py-4 border-b border-gray-200">
        <Text className="text-2xl font-bold text-gray-800">Customers</Text>
      </View>

      {/* Search & Actions */}
      <View className="bg-white px-4 py-3 border-b border-gray-200">
        <View className="flex-row items-center gap-3 mb-3">
          <Pressable className="bg-red-500 px-4 py-2 rounded-lg flex-row items-center gap-2">
            <Text className="text-white font-medium">Bulk Actions</Text>
            <Ionicons name="chevron-down" size={16} color="white" />
          </Pressable>
          <Pressable className="bg-green-500 px-4 py-2 rounded-lg">
            <Text className="text-white font-medium">Export</Text>
          </Pressable>
          <Pressable className="bg-red-500 px-4 py-2 rounded-lg">
            <Text className="text-white font-medium">Add Customer</Text>
          </Pressable>
        </View>
        <Text className="text-gray-500 text-sm mb-2">
          Search by Business Name, Email, Phone No. & Customer ID
        </Text>
        <View className="flex-row gap-3">
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
      </View>

      {/* Table Header */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={{ minWidth: 600 }}>
          <View className="flex-row bg-gray-50 py-3 px-4 border-b border-gray-200">
            <Text className="flex-1 text-gray-500 text-xs font-semibold uppercase">Business Name</Text>
            <Text className="w-16 text-gray-500 text-xs font-semibold uppercase text-center">Allow Ecom</Text>
            <Text className="w-20 text-gray-500 text-xs font-semibold uppercase text-center">Balance</Text>
            <Text className="w-12 text-gray-500 text-xs font-semibold uppercase text-center">ID</Text>
            <Text className="w-10 text-gray-500 text-xs font-semibold uppercase text-center">Active</Text>
          </View>

          {/* Customer List */}
          <FlatList
            data={filteredCustomers}
            keyExtractor={(item) => item.id}
            renderItem={renderCustomer}
            showsVerticalScrollIndicator={false}
          />
        </View>
      </ScrollView>
    </View>
  );
}
