/**
 * Customers Screen
 * 
 * Displays customer list with real-time sync from PowerSync.
 * Uses the unified DataTable component.
 */

import { Ionicons } from "@expo/vector-icons";
import React, { useCallback, useMemo, useState } from "react";
import { Alert, Pressable, Text, View } from "react-native";
import { ColumnDefinition, DataTable, PageHeader } from "../../components";
import { NewCustomerModal } from "../../components/NewCustomerModal";
import { CustomerView, useCustomers } from "../../utils/powersync/hooks";

// ============================================================================
// Helper Components
// ============================================================================

const formatCurrency = (value: number): string => {
  return `$${value.toFixed(2)}`;
};

const EcomStatusBadge = React.memo(({ allowed }: { allowed: boolean }) => {
  return (
    <Text style={{ color: allowed ? "#22C55E" : "#EC1A52", fontWeight: "600", fontSize: 18, fontFamily: "Montserrat" }}>
      {allowed ? "Allowed" : "Not Allowed"}
    </Text>
  );
});

const StatusBadge = React.memo(({ isActive }: { isActive: boolean }) => {
  return (
    <View 
      className="px-3 py-1 rounded-full self-start"
      style={{ backgroundColor: isActive ? "#22C55E" : "#F59E0B" }}
    >
      <Text className="text-white text-[14px] font-Montserrat font-semibold">
        {isActive ? "Active" : "InActive"}
      </Text>
    </View>
  );
});

const ActionButton = React.memo(({
  icon,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  onPress?: () => void;
}) => {
  return (
    <Pressable className="bg-red-50 p-2 rounded-lg" onPress={onPress}>
      <Ionicons name={icon} size={16} color="#EC1A52" />
    </Pressable>
  );
});

// ============================================================================
// Main Component
// ============================================================================

export default function CustomersScreen() {
  const { customers, isLoading, refresh, count } = useCustomers();
  
  // Modal States
  const [showAddCustomerModal, setShowAddCustomerModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerView | null>(null);

  const handleViewCustomer = useCallback((customer: CustomerView) => {
    setSelectedCustomer(customer);
    Alert.alert(
      "Customer Details",
      `Business: ${customer.businessName || "-"}\nName: ${customer.name || "-"}\nID: ${customer.id.slice(0, 8)}`
    );
  }, []);

  const handlePrintCustomer = useCallback((customer: CustomerView) => {
    Alert.alert("Print", `Printing invoice for ${customer.businessName || customer.name}...`);
  }, []);

  // Column config
  const columns = useMemo<ColumnDefinition<CustomerView>[]>(() => [
    {
      key: "businessName",
      title: "Business Name",
      width: "flex",
      visible: true,
      hideable: false,
      render: (item) => (
        <Text className="text-blue-600 text-[18px] font-Montserrat font-medium pr-4" numberOfLines={1}>
          {item.businessName || item.name || "-"}
        </Text>
      ),
    },
    {
      key: "ecomStatus",
      title: "Ecom Status",
      width: 150,
      visible: true,
      render: (item) => <EcomStatusBadge allowed={item.allowEcom} />,
    },
    {
      key: "customerName",
      title: "Customer Name",
      width: "flex",
      visible: true,
      render: (item) => (
        <Text className="text-blue-600 text-[18px] font-Montserrat pr-4" numberOfLines={1}>
          {item.name || "-"}
        </Text>
      ),
    },
    {
      key: "customerId",
      title: "Customer ID",
      width: 120,
      visible: true,
      render: (item) => (
        <Text className="text-gray-600 text-[18px] font-Montserrat">{item.id.slice(0, 8)}</Text>
      ),
    },
    {
      key: "balance",
      title: "Balance",
      width: 120,
      visible: true,
      render: (item) => (
        <Text className="text-red-600 text-[18px] font-Montserrat font-bold">
          {formatCurrency(item.balance)}
        </Text>
      ),
    },
    {
      key: "status",
      title: "Status",
      width: 120,
      align: "center",
      visible: true,
      render: (item) => <StatusBadge isActive={item.isActive} />,
    },
    {
      key: "actions",
      title: "Actions",
      width: 120,
      align: "center",
      visible: true,
      render: (item) => (
        <View className="flex-row items-center gap-2">
          <ActionButton
            icon="print-outline"
            onPress={() => handlePrintCustomer(item)}
          />
          <ActionButton
            icon="eye-outline"
            onPress={() => handleViewCustomer(item)}
          />
        </View>
      ),
    },
  ], [handlePrintCustomer, handleViewCustomer]);

  // Search logic
  const handleSearch = useCallback((item: CustomerView, query: string) => {
    const q = query.toLowerCase();
    return (
      (item.businessName?.toLowerCase().includes(q) || false) ||
      (item.name?.toLowerCase().includes(q) || false) ||
      item.id.includes(q)
    );
  }, []);

  return (
    <View className="flex-1 bg-[#F7F7F9]">
      <PageHeader title="Customers" showBack={false} />

      <DataTable<CustomerView>
        data={customers}
        columns={columns}
        keyExtractor={(item) => item.id}
        searchable
        searchPlaceholder="Search customers..."
        searchHint="Search by Business Name, Customer Name, ID"
        onSearch={handleSearch}
        columnSelector
        addButton
        addButtonText="Add Customer"
        onAddPress={() => setShowAddCustomerModal(true)}
        isLoading={isLoading}
        onRefresh={refresh}
        emptyIcon="people-outline"
        emptyText="No customers found"
        totalCount={count}
      />

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
    </View>
  );
}
