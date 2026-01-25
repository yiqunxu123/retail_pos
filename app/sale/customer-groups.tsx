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

interface CustomerGroup {
  id: string;
  groupName: string;
  tier: string;
  noOfCustomers: number;
  noOfProducts: number;
}

const SAMPLE_GROUPS: CustomerGroup[] = [
  { id: "1", groupName: "ATUL BHAI/ MUKESH BHAI", tier: "Tier 1", noOfCustomers: 6, noOfProducts: 0 },
  { id: "2", groupName: "AMIT BHAI/ ketan bhai", tier: "Tier 1", noOfCustomers: 33, noOfProducts: 207 },
  { id: "3", groupName: "SUNIL BHAI", tier: "-", noOfCustomers: 8, noOfProducts: 0 },
  { id: "4", groupName: "VIP Customers", tier: "Tier 2", noOfCustomers: 15, noOfProducts: 50 },
  { id: "5", groupName: "Wholesale Buyers", tier: "Tier 1", noOfCustomers: 22, noOfProducts: 120 },
];

export default function CustomerGroupsScreen() {
  const [searchQuery, setSearchQuery] = useState("");
  const [groups] = useState<CustomerGroup[]>(SAMPLE_GROUPS);

  const filteredGroups = groups.filter((g) =>
    g.groupName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderGroup = ({ item }: { item: CustomerGroup }) => (
    <Pressable className="flex-row items-center py-4 px-4 border-b border-gray-100 bg-white">
      <View className="w-6 mr-3">
        <View className="w-5 h-5 border border-gray-300 rounded" />
      </View>
      <Text className="flex-1 text-gray-800 font-medium">{item.groupName}</Text>
      <Text className="w-20 text-gray-600 text-center">{item.tier}</Text>
      <Text className="w-28 text-gray-600 text-center">{item.noOfCustomers}</Text>
      <Text className="w-28 text-gray-600 text-center">{item.noOfProducts}</Text>
      <View className="w-16 items-center">
        <Ionicons name="ellipsis-horizontal" size={20} color="#9ca3af" />
      </View>
    </Pressable>
  );

  return (
    <View className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-white px-4 py-4 border-b border-gray-200">
        <Text className="text-2xl font-bold text-gray-800">Customer Groups</Text>
      </View>

      {/* Search & Actions */}
      <View className="bg-white px-4 py-4 border-b border-gray-200">
        <View className="flex-row items-center justify-between mb-3">
          <Text className="text-lg font-semibold text-gray-800">Customer Groups</Text>
          <Pressable className="bg-red-500 px-4 py-2 rounded-lg">
            <Text className="text-white font-medium">Create Customer Group</Text>
          </Pressable>
        </View>
        <Text className="text-gray-500 text-sm mb-2">Search by Customer Group</Text>
        <TextInput
          className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-2"
          placeholder="Search"
          placeholderTextColor="#9ca3af"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Table */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={{ minWidth: 600 }}>
          {/* Table Header */}
          <View className="flex-row bg-gray-50 py-3 px-4 border-b border-gray-200">
            <View className="w-6 mr-3">
              <View className="w-5 h-5 border border-gray-300 rounded" />
            </View>
            <Text className="flex-1 text-gray-500 text-xs font-semibold uppercase">Group Name</Text>
            <Text className="w-20 text-gray-500 text-xs font-semibold uppercase text-center">Tier</Text>
            <Text className="w-28 text-gray-500 text-xs font-semibold uppercase text-center">No. of Customers</Text>
            <Text className="w-28 text-gray-500 text-xs font-semibold uppercase text-center">No. of Products</Text>
            <Text className="w-16 text-gray-500 text-xs font-semibold uppercase text-center">Actions</Text>
          </View>

          {/* List */}
          <FlatList
            data={filteredGroups}
            keyExtractor={(item) => item.id}
            renderItem={renderGroup}
            showsVerticalScrollIndicator={false}
          />
        </View>
      </ScrollView>
    </View>
  );
}
