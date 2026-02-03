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
  ScrollView,
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
    <Text style={{ color: allowed ? "#22C55E" : "#EC1A52", fontWeight: "500", fontSize: 12 }}>
      {allowed ? "Allowed" : "Not Allowed"}
    </Text>
  );

  const StatusBadge = ({ isActive }: { isActive: boolean }) => (
    <View 
      className="px-2 py-1 rounded"
      style={{ backgroundColor: isActive ? "#22C55E" : "#F59E0B" }}
    >
      <Text className="text-white text-xs font-medium">{isActive ? "Active" : "InActive"}</Text>
    </View>
  );

  const handleViewCustomer = (customer: CustomerView) => {
    setSelectedCustomer(customer);
    setShowCustomerDetails(true);
  };

  const renderCustomerRow = ({ item }: { item: CustomerView }) => (
    <View className="flex-row items-center px-4 py-3 border-b border-gray-100 bg-white">
      <Text className="w-32 text-blue-600 text-xs font-medium" numberOfLines={1}>
        {item.businessName || item.name}
      </Text>
      <View className="w-24">
        <EcomStatusBadge allowed={false} />
      </View>
      <Text className="w-36 text-blue-600 text-xs" numberOfLines={1}>
        {item.name}
      </Text>
      <Text className="w-24 text-gray-600 text-xs">{item.id.slice(0, 8)}</Text>
      <Text className="w-24 text-red-600 text-xs font-bold">
        {formatCurrency(88888.00)}
      </Text>
      <View className="w-20">
        <StatusBadge isActive={true} />
      </View>
      <View className="w-20 flex-row gap-2">
        <Pressable className="bg-red-50 p-1.5 rounded">
          <Ionicons name="print-outline" size={14} color="#EC1A52" />
        </Pressable>
        <Pressable 
          className="bg-red-50 p-1.5 rounded"
          onPress={() => handleViewCustomer(item)}
        >
          <Ionicons name="eye-outline" size={14} color="#EC1A52" />
        </Pressable>
      </View>
    </View>
  );

  return (
    <StaffPageLayout sidebarCustomButtons={sidebarButtons}>
      <View className="flex-1 bg-white">
        {/* Header */}
        <View className="px-6 py-4">
          <Text className="text-2xl font-bold text-gray-900">Customers</Text>
          <Text className="text-gray-500 text-sm mt-1">Search by Customer Name, ID</Text>
        </View>

        {/* Search Bar */}
        <View className="px-6 pb-4">
          <View className="flex-row items-center gap-3">
            <View className="flex-1 flex-row items-center bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
              <Ionicons name="search" size={18} color="#9CA3AF" />
              <TextInput
                className="flex-1 ml-2 text-gray-800"
                placeholder="Search Customers"
                placeholderTextColor="#9CA3AF"
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
            </View>
            <Pressable 
              className="flex-row items-center gap-2 px-6 py-3 rounded-lg"
              style={{ backgroundColor: "#EC1A52" }}
              onPress={() => setShowAddCustomerModal(true)}
            >
              <Ionicons name="person-add" size={18} color="white" />
              <Text className="text-white font-medium">Add Customer</Text>
            </Pressable>
            <Pressable 
              className="flex-row items-center gap-2 px-4 py-3 rounded-lg border border-gray-300"
              onPress={onRefresh}
            >
              <Ionicons name="refresh" size={18} color="#374151" />
              <Text className="text-gray-700 font-medium">Refresh</Text>
            </Pressable>
            <Pressable className="bg-gray-900 p-3 rounded-lg">
              <Ionicons name="settings-outline" size={20} color="white" />
            </Pressable>
          </View>
        </View>

        {/* Table */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-1">
          <View style={{ minWidth: 800 }}>
            {/* Table Header */}
            <View className="flex-row bg-gray-50 py-3 px-4 border-y border-gray-200">
              <Text className="w-32 text-gray-500 text-xs font-semibold">Business Name</Text>
              <Text className="w-24 text-gray-500 text-xs font-semibold">Ecom Status</Text>
              <Text className="w-36 text-gray-500 text-xs font-semibold">Customer Name</Text>
              <Text className="w-24 text-gray-500 text-xs font-semibold">Customer ID</Text>
              <Text className="w-24 text-gray-500 text-xs font-semibold">Balance</Text>
              <Text className="w-20 text-gray-500 text-xs font-semibold">Status</Text>
              <Text className="w-20 text-gray-500 text-xs font-semibold">Actions</Text>
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
                  <View className="py-20 items-center">
                    <ActivityIndicator size="large" color="#EC1A52" />
                  </View>
                ) : (
                  <View className="py-20 items-center justify-center">
                    <Ionicons name="people-outline" size={48} color="#d1d5db" />
                    <Text className="text-gray-400 mt-2">No customers found</Text>
                  </View>
                )
              }
            />
          </View>
        </ScrollView>

        {/* Pagination */}
        <View className="flex-row items-center justify-between px-4 py-3 border-t border-gray-200">
          <View className="flex-row items-center gap-2">
            <Pressable className="w-8 h-8 items-center justify-center rounded border border-gray-200">
              <Ionicons name="chevron-back" size={16} color="#9CA3AF" />
            </Pressable>
            <Pressable 
              className="w-8 h-8 items-center justify-center rounded"
              style={{ backgroundColor: "#EC1A52" }}
            >
              <Text className="text-white font-medium">1</Text>
            </Pressable>
            <Pressable className="w-8 h-8 items-center justify-center rounded border border-gray-200">
              <Text className="text-gray-600">2</Text>
            </Pressable>
            <Pressable className="w-8 h-8 items-center justify-center rounded border border-gray-200">
              <Text className="text-gray-600">3</Text>
            </Pressable>
            <Pressable className="w-8 h-8 items-center justify-center rounded border border-gray-200">
              <Ionicons name="chevron-forward" size={16} color="#9CA3AF" />
            </Pressable>
          </View>
          <View className="flex-row items-center gap-2">
            <Pressable className="flex-row items-center gap-2 px-3 py-2 rounded border border-gray-200">
              <Text className="text-gray-600">10/Page</Text>
              <Ionicons name="chevron-down" size={14} color="#6B7280" />
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
