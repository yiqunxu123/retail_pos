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
import { CustomerGroup } from "../../types";

// ============================================================================
// Constants
// ============================================================================

const TIER_OPTIONS = [
  { label: "All Tiers", value: "all" },
  { label: "Tier 1", value: "Tier 1" },
  { label: "Tier 2", value: "Tier 2" },
  { label: "No Tier", value: "-" },
];

const SORT_OPTIONS = [
  { label: "Name (A-Z)", value: "name_asc" },
  { label: "Name (Z-A)", value: "name_desc" },
  { label: "Customers (High-Low)", value: "customers_desc" },
  { label: "Customers (Low-High)", value: "customers_asc" },
];

// ============================================================================
// Sample Data
// ============================================================================

const SAMPLE_GROUPS: CustomerGroup[] = [
  { id: "1", groupName: "ATUL BHAI/ MUKESH BHAI", tier: "Tier 1", noOfCustomers: 6, noOfProducts: 0 },
  { id: "2", groupName: "AMIT BHAI/ ketan bhai", tier: "Tier 1", noOfCustomers: 33, noOfProducts: 207 },
  { id: "3", groupName: "SUNIL BHAI", tier: "-", noOfCustomers: 8, noOfProducts: 0 },
  { id: "4", groupName: "VIP Customers", tier: "Tier 2", noOfCustomers: 15, noOfProducts: 50 },
  { id: "5", groupName: "Wholesale Buyers", tier: "Tier 1", noOfCustomers: 22, noOfProducts: 120 },
];

// ============================================================================
// Main Component
// ============================================================================

export default function CustomerGroupsScreen() {
  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState("");
  const [tierFilter, setTierFilter] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<string | null>(null);

  const [groups] = useState<CustomerGroup[]>(SAMPLE_GROUPS);

  // Apply filters and sorting
  const filteredGroups = useMemo(() => {
    let result = [...groups];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter((g) => g.groupName.toLowerCase().includes(query));
    }

    // Tier filter
    if (tierFilter && tierFilter !== "all") {
      result = result.filter((g) => g.tier === tierFilter);
    }

    // Sort
    if (sortBy) {
      switch (sortBy) {
        case "name_asc":
          result.sort((a, b) => a.groupName.localeCompare(b.groupName));
          break;
        case "name_desc":
          result.sort((a, b) => b.groupName.localeCompare(a.groupName));
          break;
        case "customers_desc":
          result.sort((a, b) => b.noOfCustomers - a.noOfCustomers);
          break;
        case "customers_asc":
          result.sort((a, b) => a.noOfCustomers - b.noOfCustomers);
          break;
      }
    }

    return result;
  }, [groups, searchQuery, tierFilter, sortBy]);

  const renderGroup = ({ item }: { item: CustomerGroup }) => (
    <Pressable className="flex-row items-center py-4 px-5 border-b border-gray-100 bg-white">
      <View className="w-8 mr-4">
        <View className="w-5 h-5 border border-gray-300 rounded" />
      </View>
      <Text className="flex-1 text-gray-800 font-medium">{item.groupName}</Text>
      <View className="w-24 items-center">
        <View className={`px-2 py-1 rounded ${item.tier === "-" ? "bg-gray-100" : "bg-blue-100"}`}>
          <Text className={`text-xs font-medium ${item.tier === "-" ? "text-gray-600" : "text-blue-700"}`}>
            {item.tier}
          </Text>
        </View>
      </View>
      <Text className="w-32 text-gray-600 text-center">{item.noOfCustomers}</Text>
      <Text className="w-32 text-gray-600 text-center">{item.noOfProducts}</Text>
      <View className="w-20 items-center">
        <Ionicons name="ellipsis-horizontal" size={20} color="#9ca3af" />
      </View>
    </Pressable>
  );

  return (
    <View className="flex-1 bg-gray-50">
      <PageHeader title="Customer Groups" />

      {/* Search & Actions */}
      <View className="bg-white px-5 py-4 border-b border-gray-200">
        <View className="flex-row items-center justify-between mb-4">
          <Text className="text-lg font-semibold text-gray-800">Customer Groups ({filteredGroups.length})</Text>
          <Pressable className="bg-red-500 px-4 py-2.5 rounded-lg">
            <Text className="text-white font-medium">Create Customer Group</Text>
          </Pressable>
        </View>
        <Text className="text-gray-500 text-sm mb-2">Search by Customer Group</Text>
        <View className="flex-row gap-4">
          <View className="flex-1">
            <TextInput
              className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5"
              placeholder="Search groups..."
              placeholderTextColor="#9ca3af"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
          <FilterDropdown
            label=""
            value={tierFilter}
            options={TIER_OPTIONS}
            onChange={setTierFilter}
            placeholder="Filter by Tier"
            width={140}
          />
          <FilterDropdown
            label=""
            value={sortBy}
            options={SORT_OPTIONS}
            onChange={setSortBy}
            placeholder="Sort By"
            width={160}
          />
        </View>
      </View>

      {/* Table */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-1">
        <View style={{ minWidth: 750 }}>
          {/* Table Header */}
          <View className="flex-row bg-gray-50 py-3 px-5 border-b border-gray-200">
            <View className="w-8 mr-4">
              <View className="w-5 h-5 border border-gray-300 rounded" />
            </View>
            <Text className="flex-1 text-gray-500 text-xs font-semibold uppercase">Group Name</Text>
            <Text className="w-24 text-gray-500 text-xs font-semibold uppercase text-center">Tier</Text>
            <Text className="w-32 text-gray-500 text-xs font-semibold uppercase text-center">No. of Customers</Text>
            <Text className="w-32 text-gray-500 text-xs font-semibold uppercase text-center">No. of Products</Text>
            <Text className="w-20 text-gray-500 text-xs font-semibold uppercase text-center">Actions</Text>
          </View>

          {/* List */}
          <FlatList
            data={filteredGroups}
            keyExtractor={(item) => item.id}
            renderItem={renderGroup}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View className="py-16 items-center">
                <Ionicons name="people-circle-outline" size={48} color="#d1d5db" />
                <Text className="text-gray-400 mt-2">No groups found</Text>
              </View>
            }
          />
        </View>
      </ScrollView>
    </View>
  );
}
