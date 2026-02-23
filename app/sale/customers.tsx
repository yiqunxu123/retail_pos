/**
 * Customers Screen
 * 
 * Displays customer list with real-time sync from PowerSync.
 * Uses the unified DataTable component.
 */

import { buttonSize, colors, iconSize } from '@/utils/theme';
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams } from "expo-router";
import React, { useCallback, useEffect, useMemo, useState } from "react";
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
    <Text className="text-lg font-semibold" style={{ color: allowed ? colors.success : colors.primary }}>
      {allowed ? "Allowed" : "Not Allowed"}
    </Text>
  );
});

const StatusBadge = React.memo(({ isActive }: { isActive: boolean }) => {
  return (
    <View 
      className="px-3 py-1 rounded-full self-start"
      style={{ backgroundColor: isActive ? colors.success : colors.warning }}
    >
      <Text className="text-white text-sm font-semibold">
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
    <Pressable 
      className="rounded-lg items-center justify-center"
      style={{ width: buttonSize.md.height, height: buttonSize.md.height, backgroundColor: colors.primaryLight, borderRadius: buttonSize.md.borderRadius }}
      onPress={onPress}
    >
      <Ionicons name={icon} size={iconSize.md} color={colors.primary} />
    </Pressable>
  );
});

// ============================================================================
// Main Component
// ============================================================================

export default function CustomersScreen() {
  const _mountMs = __DEV__ ? performance.now() : 0;
  const { customers, isLoading, refresh, count } = useCustomers();
  const params = useLocalSearchParams<{ openAddCustomer?: string }>();
  if (__DEV__) console.log(`[CustPerf] hook: ${(performance.now() - _mountMs).toFixed(1)}ms, rows=${count}`);

  // Modal States — open when sidebar "Add Customer" triggers via URL param
  const [showAddCustomerModal, setShowAddCustomerModal] = useState(false);
  useEffect(() => {
    if (params.openAddCustomer) {
      setShowAddCustomerModal(true);
    }
  }, [params.openAddCustomer]);
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
        <Text className="text-blue-600 text-lg font-medium pr-4" numberOfLines={1}>
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
        <Text className="text-blue-600 text-lg pr-4" numberOfLines={1}>
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
        <Text className="text-gray-600 text-lg">{item.id.slice(0, 8)}</Text>
      ),
    },
    {
      key: "balance",
      title: "Balance",
      width: 120,
      visible: true,
      render: (item) => (
        <Text className="text-red-600 text-lg font-bold">
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
        horizontalScroll
        minWidth={1050}
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
