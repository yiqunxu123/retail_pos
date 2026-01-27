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
import { Customer } from "../../types";

// ============================================================================
// Constants
// ============================================================================

const STATUS_OPTIONS = [
  { label: "Active", value: "active" },
  { label: "Inactive", value: "inactive" },
];

const ECOM_OPTIONS = [
  { label: "All", value: "all" },
  { label: "E-commerce Enabled", value: "enabled" },
  { label: "E-commerce Disabled", value: "disabled" },
];

const BALANCE_OPTIONS = [
  { label: "All", value: "all" },
  { label: "With Balance", value: "with_balance" },
  { label: "No Balance", value: "no_balance" },
];

// ============================================================================
// Sample Data
// ============================================================================

const SAMPLE_CUSTOMERS: Customer[] = [
  { id: "475", businessName: "ALASKA TAX CUSTOMER", name: "", allowEcom: false, onAccountBalance: 0, isActive: true },
  { id: "474", businessName: "fatima", name: "fatima", allowEcom: true, onAccountBalance: 150, isActive: true },
  { id: "473", businessName: "KHUB Test Ecom", name: "", allowEcom: true, onAccountBalance: 0, isActive: true },
  { id: "472", businessName: "ARIYA529 LLC", name: "JIGNESH PATEL", allowEcom: false, onAccountBalance: 500, isActive: true },
  { id: "471", businessName: "1 VINAYAKK FUELS INC / CHEVRON WOODMONT", name: "VIRAL BHAI", allowEcom: false, onAccountBalance: 0, isActive: false },
  { id: "470", businessName: "BALCH RD SHELL INC/JAY PATEL", name: "C J PATEL", allowEcom: false, onAccountBalance: 0, isActive: true },
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
  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | null>("active");
  const [ecomFilter, setEcomFilter] = useState<string | null>(null);
  const [balanceFilter, setBalanceFilter] = useState<string | null>(null);

  const [customers] = useState<Customer[]>(SAMPLE_CUSTOMERS);

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
          c.id.includes(query)
      );
    }

    // Status filter
    if (statusFilter) {
      result = result.filter((c) =>
        statusFilter === "active" ? c.isActive : !c.isActive
      );
    }

    // E-commerce filter
    if (ecomFilter && ecomFilter !== "all") {
      result = result.filter((c) =>
        ecomFilter === "enabled" ? c.allowEcom : !c.allowEcom
      );
    }

    // Balance filter
    if (balanceFilter && balanceFilter !== "all") {
      result = result.filter((c) =>
        balanceFilter === "with_balance" ? c.onAccountBalance > 0 : c.onAccountBalance === 0
      );
    }

    return result;
  }, [customers, searchQuery, statusFilter, ecomFilter, balanceFilter]);

  const renderCustomerRow = ({ item }: { item: Customer }) => (
    <Pressable className="flex-row items-center py-3 px-5 border-b border-gray-100 bg-white">
      <View className="flex-1">
        <Text className="text-blue-600 font-medium">{item.businessName}</Text>
        {item.name && <Text className="text-gray-500 text-sm">{item.name}</Text>}
      </View>
      <View className="w-24 items-center">
        <BooleanIcon value={item.allowEcom} />
      </View>
      <View className="w-28 items-center">
        <View className={`rounded-full px-3 py-1 ${item.onAccountBalance > 0 ? "bg-orange-500" : "bg-green-500"}`}>
          <Text className="text-white text-xs font-medium">${item.onAccountBalance}</Text>
        </View>
      </View>
      <View className="w-16 items-center">
        <Text className="text-gray-600 text-sm">{item.id}</Text>
      </View>
      <View className="w-16 items-center">
        <BooleanIcon value={item.isActive} size={18} />
      </View>
    </Pressable>
  );

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
          <Pressable className="bg-green-500 px-4 py-2 rounded-lg">
            <Text className="text-white font-medium">Export</Text>
          </Pressable>
          <Pressable className="bg-red-500 px-4 py-2 rounded-lg">
            <Text className="text-white font-medium">Add Customer</Text>
          </Pressable>
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
            value={ecomFilter}
            options={ECOM_OPTIONS}
            onChange={setEcomFilter}
            placeholder="E-commerce"
            width={160}
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
          Showing {filteredCustomers.length} of {customers.length} customers
        </Text>
      </View>

      {/* Data Table */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-1">
        <View style={{ minWidth: 700 }}>
          {/* Table Header */}
          <View className="flex-row bg-gray-50 py-3 px-5 border-b border-gray-200">
            <Text className="flex-1 text-gray-500 text-xs font-semibold uppercase">Business Name</Text>
            <Text className="w-24 text-gray-500 text-xs font-semibold uppercase text-center">Allow Ecom</Text>
            <Text className="w-28 text-gray-500 text-xs font-semibold uppercase text-center">Balance</Text>
            <Text className="w-16 text-gray-500 text-xs font-semibold uppercase text-center">ID</Text>
            <Text className="w-16 text-gray-500 text-xs font-semibold uppercase text-center">Active</Text>
          </View>

          {/* Table Body */}
          <FlatList
            data={filteredCustomers}
            keyExtractor={(item) => item.id}
            renderItem={renderCustomerRow}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View className="py-16 items-center">
                <Ionicons name="people-outline" size={48} color="#d1d5db" />
                <Text className="text-gray-400 mt-2">No customers found</Text>
              </View>
            }
          />
        </View>
      </ScrollView>
    </View>
  );
}
