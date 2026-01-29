/**
 * Customers Screen
 * 
 * Displays customer list with real-time sync from PowerSync.
 * Data source: customers table
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
import { CustomerView, useCustomers } from "../../utils/powersync/hooks";

// ============================================================================
// Constants
// ============================================================================

const STATUS_OPTIONS = [
  { label: "Active", value: "active" },
  { label: "Inactive", value: "inactive" },
];

const BALANCE_OPTIONS = [
  { label: "All", value: "all" },
  { label: "With Balance", value: "with_balance" },
  { label: "No Balance", value: "no_balance" },
];

// ============================================================================
// Reusable Components
// ============================================================================

function BooleanIcon({ value, size = 20 }: { value: boolean; size?: number }) {
  return value ? (
    <Ionicons name="checkmark-circle" size={size} color="#22c55e" />
  ) : (
    <Ionicons name="close-circle" size={size} color="#ef4444" />
  );
}

// ============================================================================
// Main Component
// ============================================================================

export default function CustomersScreen() {
  // Data from PowerSync
  const { customers, isLoading, isStreaming, refresh, count } = useCustomers();
  const [refreshing, setRefreshing] = useState(false);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | null>("active");
  const [balanceFilter, setBalanceFilter] = useState<string | null>(null);

  // Pull to refresh
  const onRefresh = async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  };

  // Apply filters
  const filteredCustomers = useMemo(() => {
    let result = [...customers];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (c) =>
          c.businessName.toLowerCase().includes(query) ||
          c.name.toLowerCase().includes(query) ||
          c.email.toLowerCase().includes(query) ||
          c.phone.toLowerCase().includes(query) ||
          c.id.includes(query)
      );
    }

    // Status filter
    if (statusFilter) {
      result = result.filter((c) =>
        statusFilter === "active" ? c.isActive : !c.isActive
      );
    }

    // Balance filter
    if (balanceFilter && balanceFilter !== "all") {
      result = result.filter((c) =>
        balanceFilter === "with_balance" ? c.balance > 0 : c.balance === 0
      );
    }

    return result;
  }, [customers, searchQuery, statusFilter, balanceFilter]);

  const renderCustomerRow = ({ item }: { item: CustomerView }) => (
    <Pressable className="flex-row items-center py-3 px-5 border-b border-gray-100 bg-white">
      <View className="flex-1">
        <Text className="text-blue-600 font-medium">{item.businessName || "-"}</Text>
        {item.name ? <Text className="text-gray-500 text-sm">{item.name}</Text> : null}
      </View>
      <View className="w-32">
        <Text className="text-gray-600 text-sm" numberOfLines={1}>{item.email || "-"}</Text>
      </View>
      <View className="w-24">
        <Text className="text-gray-600 text-sm">{item.phone || "-"}</Text>
      </View>
      <View className="w-16 items-center">
        <BooleanIcon value={item.allowEcom} size={18} />
      </View>
      <View className="w-24 items-center">
        <View className={`rounded-full px-3 py-1 ${item.balance > 0 ? "bg-orange-500" : "bg-green-500"}`}>
          <Text className="text-white text-xs font-medium">${item.balance.toFixed(2)}</Text>
        </View>
      </View>
      <View className="w-14 items-center">
        <BooleanIcon value={item.isActive} size={18} />
      </View>
    </Pressable>
  );

  // Loading state
  if (isLoading && customers.length === 0) {
    return (
      <View className="flex-1 bg-gray-50">
        <PageHeader title="Customers" />
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text className="mt-4 text-gray-600">Loading customers...</Text>
        </View>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-50">
      <PageHeader title="Customers" />

      {/* Toolbar */}
      <View className="bg-white px-5 py-4 border-b border-gray-200">
        {/* Action Buttons */}
        <View className="flex-row items-center gap-3 mb-4">
          <Pressable className="bg-red-500 px-4 py-2 rounded-lg flex-row items-center gap-2">
            <Text className="text-white font-medium">Bulk Actions</Text>
            <Ionicons name="chevron-down" size={16} color="white" />
          </Pressable>
          <Pressable className="bg-red-500 px-4 py-2 rounded-lg">
            <Text className="text-white font-medium">Add Customer</Text>
          </Pressable>
          {isStreaming && (
            <View className="flex-row items-center gap-1 ml-2">
              <Text className="text-green-600 text-xs">● Live</Text>
            </View>
          )}
        </View>

        {/* Search & Filters */}
        <Text className="text-gray-500 text-sm mb-2">
          Search by Business Name, Email, Phone No. & Customer ID
        </Text>
        <View className="flex-row gap-4">
          <View className="flex-1">
            <TextInput
              className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5"
              placeholder="Search customers..."
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
            width={120}
          />
          <FilterDropdown
            label=""
            value={balanceFilter}
            options={BALANCE_OPTIONS}
            onChange={setBalanceFilter}
            placeholder="Balance"
            width={140}
          />
        </View>

        {/* Results count */}
        <Text className="text-gray-400 text-sm mt-2">
          Showing {filteredCustomers.length} of {count} customers
        </Text>
      </View>

      {/* Data Table */}
      <View className="flex-1">
        {/* Table Header */}
        <View className="flex-row bg-gray-50 py-3 px-5 border-b border-gray-200">
          <Text className="flex-1 text-gray-500 text-xs font-semibold uppercase">Business Name</Text>
          <Text className="w-32 text-gray-500 text-xs font-semibold uppercase">Email</Text>
          <Text className="w-24 text-gray-500 text-xs font-semibold uppercase">Phone</Text>
          <Text className="w-16 text-gray-500 text-xs font-semibold uppercase text-center">Ecom</Text>
          <Text className="w-24 text-gray-500 text-xs font-semibold uppercase text-center">Balance</Text>
          <Text className="w-14 text-gray-500 text-xs font-semibold uppercase text-center">Active</Text>
        </View>

        {/* Table Body */}
        <FlatList
          data={filteredCustomers}
          keyExtractor={(item) => item.id}
          renderItem={renderCustomerRow}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListEmptyComponent={
            <View className="py-16 items-center">
              <Ionicons name="people-outline" size={48} color="#d1d5db" />
              <Text className="text-gray-400 mt-2">No customers found</Text>
            </View>
          }
        />
      </View>
    </View>
  );
}
