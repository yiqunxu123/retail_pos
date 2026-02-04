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
  Alert,
  FlatList,
  Pressable,
  RefreshControl,
  Text,
  TextInput,
  View,
} from "react-native";
import { NewCustomerModal } from "../../components/NewCustomerModal";
import StaffPageLayout, { SidebarButton } from "../../components/StaffPageLayout";
import { CustomerView, useCustomers } from "../../utils/powersync/hooks";

// ============================================================================
// Helper Functions
// ============================================================================

function formatCurrency(value: number): string {
  return `$${value.toFixed(2)}`;
}

// ============================================================================
// Main Component
// ============================================================================

export default function CustomersScreen() {
  // Data from PowerSync
  const { customers, isLoading, refresh, count } = useCustomers();
  const [refreshing, setRefreshing] = useState(false);

  // Search State
  const [searchQuery, setSearchQuery] = useState("");

  // Add Customer Modal
  const [showAddCustomerModal, setShowAddCustomerModal] = useState(false);
  
  // View Customer Modal
  const [showCustomerDetails, setShowCustomerDetails] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerView | null>(null);

  // Pull to refresh
  const onRefresh = async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  };

  // Custom Sidebar Buttons
  const sidebarButtons = (
    <>
      <SidebarButton 
        title="Add New Customer"
        icon={<Ionicons name="add-outline" size={20} color="#EC1A52" />}
        onPress={() => setShowAddCustomerModal(true)}
      />
      <SidebarButton 
        title="Print Return Invoice"
        icon={<Ionicons name="print-outline" size={20} color="#EC1A52" />}
        onPress={() => Alert.alert("Print", "Printing return invoice list...")}
      />
      <SidebarButton 
        title="View Customer Details"
        icon={<Ionicons name="eye-outline" size={20} color="#EC1A52" />}
        onPress={() => Alert.alert("View Details", "Select a customer to view details")}
      />
      <SidebarButton 
        title="Add Customer Payment"
        icon={<Ionicons name="cash-outline" size={20} color="#EC1A52" />}
        onPress={() => Alert.alert("Add Payment", "Select a customer to add payment")}
      />
    </>
  );

  // Apply search filter
  const filteredCustomers = useMemo(() => {
    if (!searchQuery) return customers;

    const query = searchQuery.toLowerCase();
    return customers.filter(
      (c) =>
        c.businessName?.toLowerCase().includes(query) ||
        c.name?.toLowerCase().includes(query) ||
        c.id?.includes(query)
    );
  }, [customers, searchQuery]);

  // Status Badges
  const EcomStatusBadge = ({ allowed }: { allowed: boolean }) => (
    <Text style={{ color: allowed ? "#22C55E" : "#EC1A52", fontWeight: "600", fontSize: 14 }}>
      {allowed ? "Allowed" : "Not Allowed"}
    </Text>
  );

  const StatusBadge = ({ isActive }: { isActive: boolean }) => (
    <View 
      className="px-4 py-1.5 rounded-md"
      style={{ backgroundColor: isActive ? "#22C55E" : "#F59E0B" }}
    >
      <Text className="text-white text-sm font-semibold">{isActive ? "Active" : "InActive"}</Text>
    </View>
  );

  const handleViewCustomer = (customer: CustomerView) => {
    setSelectedCustomer(customer);
    setShowCustomerDetails(true);
  };

  const renderCustomerRow = ({ item }: { item: CustomerView }) => (
    <View className="flex-row items-center px-6 py-5 border-b border-gray-100 bg-white hover:bg-gray-50">
      <Text className="flex-[2] text-blue-600 text-sm font-medium pr-4" numberOfLines={1}>
        {item.businessName || item.name}
      </Text>
      <View className="flex-[1.2] pr-4">
        <EcomStatusBadge allowed={false} />
      </View>
      <Text className="flex-[2] text-blue-600 text-sm pr-4" numberOfLines={1}>
        {item.name}
      </Text>
      <Text className="flex-1 text-gray-600 text-sm pr-4">{item.id.slice(0, 8)}</Text>
      <Text className="flex-[1.2] text-red-600 text-sm font-bold pr-4">
        {formatCurrency(88888.00)}
      </Text>
      <View className="flex-1 pr-4">
        <StatusBadge isActive={true} />
      </View>
      <View className="flex-1 flex-row gap-3">
        <Pressable className="bg-red-50 p-2.5 rounded-lg">
          <Ionicons name="print-outline" size={18} color="#EC1A52" />
        </Pressable>
        <Pressable 
          className="bg-red-50 p-2.5 rounded-lg"
          onPress={() => handleViewCustomer(item)}
        >
          <Ionicons name="eye-outline" size={18} color="#EC1A52" />
        </Pressable>
      </View>
    </View>
  );

  return (
    <StaffPageLayout 
      sidebarCustomButtons={sidebarButtons}
      title="Customers"
      subTitle="Search by Customer Name, ID"
    >
      <View className="flex-1 bg-white">
        {/* Search Bar */}
        <View className="px-6 pb-6">
          <View className="flex-row items-center gap-4">
            <View className="flex-1 flex-row items-center bg-gray-50 border border-gray-200 rounded-xl px-4 py-3">
              <Ionicons name="search" size={20} color="#9CA3AF" />
              <TextInput
                className="flex-1 ml-3 text-gray-800 text-base"
                placeholder="Search Customers"
                placeholderTextColor="#9CA3AF"
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
            </View>
            <Pressable 
              className="flex-row items-center gap-3 px-8 py-3.5 rounded-xl"
              style={{ backgroundColor: "#EC1A52" }}
              onPress={() => setShowAddCustomerModal(true)}
            >
              <Ionicons name="person-add" size={20} color="white" />
              <Text className="text-white font-semibold text-base">Add Customer</Text>
            </Pressable>
            <Pressable 
              className="flex-row items-center gap-3 px-6 py-3.5 rounded-xl border border-gray-300"
              onPress={onRefresh}
            >
              <Ionicons name="refresh" size={20} color="#374151" />
              <Text className="text-gray-700 font-semibold text-base">Refresh</Text>
            </Pressable>
            <Pressable className="bg-gray-900 p-3.5 rounded-xl">
              <Ionicons name="settings-outline" size={22} color="white" />
            </Pressable>
          </View>
        </View>

        {/* Table */}
        <View className="flex-1">
          {/* Table Header */}
          <View className="flex-row bg-gray-50 py-4 px-6 border-y border-gray-200">
            <Text className="flex-[2] text-gray-500 text-sm font-semibold uppercase tracking-wide pr-4">Business Name</Text>
            <Text className="flex-[1.2] text-gray-500 text-sm font-semibold uppercase tracking-wide pr-4">Ecom Status</Text>
            <Text className="flex-[2] text-gray-500 text-sm font-semibold uppercase tracking-wide pr-4">Customer Name</Text>
            <Text className="flex-1 text-gray-500 text-sm font-semibold uppercase tracking-wide pr-4">Customer ID</Text>
            <Text className="flex-[1.2] text-gray-500 text-sm font-semibold uppercase tracking-wide pr-4">Balance</Text>
            <Text className="flex-1 text-gray-500 text-sm font-semibold uppercase tracking-wide pr-4">Status</Text>
            <Text className="flex-1 text-gray-500 text-sm font-semibold uppercase tracking-wide">Actions</Text>
          </View>

          <FlatList
            data={filteredCustomers}
            keyExtractor={(item) => item.id}
            renderItem={renderCustomerRow}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
            ListEmptyComponent={
              isLoading ? (
                <View className="py-24 items-center">
                  <ActivityIndicator size="large" color="#EC1A52" />
                </View>
              ) : (
                <View className="py-24 items-center justify-center">
                  <Ionicons name="people-outline" size={64} color="#d1d5db" />
                  <Text className="text-gray-400 mt-4 text-base">No customers found</Text>
                </View>
              )
            }
          />
        </View>

        {/* Pagination */}
        <View className="flex-row items-center justify-between px-6 py-4 border-t border-gray-200 bg-white">
          <View className="flex-row items-center gap-3">
            <Pressable className="w-10 h-10 items-center justify-center rounded-lg border border-gray-200">
              <Ionicons name="chevron-back" size={18} color="#9CA3AF" />
            </Pressable>
            <Pressable 
              className="w-10 h-10 items-center justify-center rounded-lg"
              style={{ backgroundColor: "#EC1A52" }}
            >
              <Text className="text-white font-semibold text-base">1</Text>
            </Pressable>
            <Pressable className="w-10 h-10 items-center justify-center rounded-lg border border-gray-200">
              <Text className="text-gray-600 text-base">2</Text>
            </Pressable>
            <Pressable className="w-10 h-10 items-center justify-center rounded-lg border border-gray-200">
              <Text className="text-gray-600 text-base">3</Text>
            </Pressable>
            <Pressable className="w-10 h-10 items-center justify-center rounded-lg border border-gray-200">
              <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
            </Pressable>
          </View>
          <View className="flex-row items-center gap-3">
            <Pressable className="flex-row items-center gap-2 px-4 py-2.5 rounded-lg border border-gray-200">
              <Text className="text-gray-600 text-base">10/Page</Text>
              <Ionicons name="chevron-down" size={16} color="#6B7280" />
            </Pressable>
          </View>
        </View>

        {/* Add Customer Modal */}
        <NewCustomerModal
          visible={showAddCustomerModal}
          onClose={() => setShowAddCustomerModal(false)}
          onSave={(customer) => {
            Alert.alert("Success", `Customer ${customer.businessName} added successfully`);
            setShowAddCustomerModal(false);
            refresh();
          }}
        />

        {/* Customer Details Modal (Placeholder if not implemented) */}
        {/* You can implement CustomerDetailsModal similar to OrderDetailsModal */}
      </View>
    </StaffPageLayout>
  );
}
