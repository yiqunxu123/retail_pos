/**
 * Customer Groups Screen
 * 
 * Displays customer groups with real-time sync from PowerSync.
 * Data source: customer_groups table
 * 
 * Missing fields (showing "-"):
 * - tier: Not in DB
 * - noOfCustomers: Needs aggregate query
 * - noOfProducts: Needs aggregate query
 */

import { Ionicons } from "@expo/vector-icons";
import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  Text,
  TextInput,
  View,
} from "react-native";
import { FilterDropdown, PageHeader } from "../../components";
import { CustomerGroupView, useCustomerGroups } from "../../utils/powersync/hooks";

// ============================================================================
// Constants
// ============================================================================

const SORT_OPTIONS = [
  { label: "Name (A-Z)", value: "name_asc" },
  { label: "Name (Z-A)", value: "name_desc" },
];

// ============================================================================
// Main Component
// ============================================================================

export default function CustomerGroupsScreen() {
  // Data from PowerSync
  const { groups, isLoading, isStreaming, refresh, count } = useCustomerGroups();
  const [refreshing, setRefreshing] = useState(false);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<string | null>(null);

  // Pull to refresh
  const onRefresh = async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  };

  // Apply filters and sorting
  const filteredGroups = useMemo(() => {
    let result = [...groups];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (g) =>
          g.name.toLowerCase().includes(query) ||
          g.description.toLowerCase().includes(query)
      );
    }

    // Sort
    if (sortBy) {
      switch (sortBy) {
        case "name_asc":
          result.sort((a, b) => a.name.localeCompare(b.name));
          break;
        case "name_desc":
          result.sort((a, b) => b.name.localeCompare(a.name));
          break;
      }
    }

    return result;
  }, [groups, searchQuery, sortBy]);

  const renderGroup = ({ item }: { item: CustomerGroupView }) => (
    <Pressable className="flex-row items-center py-4 px-5 border-b border-gray-100 bg-white">
      <View className="w-8 mr-4">
        <View className="w-5 h-5 border border-gray-300 rounded" />
      </View>
      <View className="flex-1">
        <Text className="text-gray-800 font-medium">{item.name || "-"}</Text>
        {item.description && (
          <Text className="text-gray-500 text-sm" numberOfLines={1}>{item.description}</Text>
        )}
      </View>
      {/* tier: Not in DB */}
      <View className="w-20 items-center">
        <Text className="text-gray-400">-</Text>
      </View>
      {/* Customer count from customer_groups_customer relation */}
      <View className="w-28 items-center">
        <Text className="text-gray-700">{item.customerCount}</Text>
      </View>
      {/* noOfProducts: No relation table exists */}
      <View className="w-28 items-center">
        <Text className="text-gray-400">-</Text>
      </View>
      <View className="w-16 items-center">
        <Ionicons name="ellipsis-horizontal" size={20} color="#9ca3af" />
      </View>
    </Pressable>
  );

  // Loading state
  if (isLoading && groups.length === 0) {
    return (
      <View className="flex-1 bg-gray-50">
        <PageHeader title="Customer Groups" />
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text className="mt-4 text-gray-600">Loading customer groups...</Text>
        </View>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-50">
      <PageHeader title="Customer Groups" />

      {/* Search & Actions */}
      <View className="bg-white px-5 py-4 border-b border-gray-200">
        <View className="flex-row items-center justify-between mb-4">
          <View className="flex-row items-center gap-2">
            <Text className="text-lg font-semibold text-gray-800">Customer Groups ({count})</Text>
            {isStreaming && (
              <Text className="text-green-600 text-xs">● Live</Text>
            )}
          </View>
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
            value={sortBy}
            options={SORT_OPTIONS}
            onChange={setSortBy}
            placeholder="Sort By"
            width={160}
          />
        </View>

        {/* Results count */}
        <Text className="text-gray-400 text-sm mt-2">
          Showing {filteredGroups.length} of {count} groups
        </Text>
      </View>

      {/* Table */}
      <View className="flex-1">
        {/* Table Header */}
        <View className="flex-row bg-gray-50 py-3 px-5 border-b border-gray-200">
          <View className="w-8 mr-4">
            <View className="w-5 h-5 border border-gray-300 rounded" />
          </View>
          <Text className="flex-1 text-gray-500 text-xs font-semibold uppercase">Group Name</Text>
          <Text className="w-20 text-gray-500 text-xs font-semibold uppercase text-center">Tier</Text>
          <Text className="w-28 text-gray-500 text-xs font-semibold uppercase text-center">Customers</Text>
          <Text className="w-28 text-gray-500 text-xs font-semibold uppercase text-center">Products</Text>
          <Text className="w-16 text-gray-500 text-xs font-semibold uppercase text-center">Actions</Text>
        </View>

        {/* List */}
        <FlatList
          data={filteredGroups}
          keyExtractor={(item) => item.id}
          renderItem={renderGroup}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListEmptyComponent={
            <View className="py-16 items-center">
              <Ionicons name="people-circle-outline" size={48} color="#d1d5db" />
              <Text className="text-gray-400 mt-2">No groups found</Text>
            </View>
          }
        />
      </View>
    </View>
  );
}
