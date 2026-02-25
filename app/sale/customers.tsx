/**
 * Customers Screen
 *
 * Displays customer list with real-time sync from PowerSync.
 * Single selection only: View Customer Details / Edit when one customer selected.
 */

import { buttonSize, colors, iconSize } from '@/utils/theme';
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams } from "expo-router";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Alert, Pressable, Text, View } from "react-native";
import { useBulkEditContext } from "../../contexts/BulkEditContext";
import { ACTION_COL_WIDTH, ColumnDefinition, DataTable, PageHeader } from "../../components";
import { useTableContentWidth } from "../../hooks/useTableContentWidth";
import {
  AddCustomerPanelController,
  AddCustomerPanelControllerHandle,
} from "../../components/order/AddCustomerPanelController";
import { AddQuickCustomerModal } from "../../components/AddQuickCustomerModal";
import { CustomerDetailsModal } from "../../components/CustomerDetailsModal";
import { CustomerView, useCustomers } from "../../utils/powersync/hooks";

/** Map CustomerView to CustomerDetailsModal's expected shape */
function toCustomerDetails(v: CustomerView) {
  return {
    id: v.id,
    businessName: v.businessName || v.name || "-",
    contactName: v.name || undefined,
    email: v.email || undefined,
    phone: v.phone || v.businessPhone || undefined,
    address: v.address || undefined,
    city: v.city || undefined,
    state: v.state || undefined,
    zipCode: v.zipCode || undefined,
    customerType: "Retailer",
    classOfTrades: "Retailer",
    balance: v.balance ?? 0,
    totalOrders: 0,
    totalSpent: 0,
    createdAt: v.createdAt || "",
    recentOrders: undefined,
    notes: undefined,
  };
}

// ============================================================================
// Helper Components
// ============================================================================

const formatCurrency = (value: number): string => {
  return `$${value.toFixed(2)}`;
};

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
  const contentWidth = useTableContentWidth();
  const { customers, isLoading, refresh, count } = useCustomers();
  const params = useLocalSearchParams<{ openAddCustomer?: string; openCustomerDetails?: string }>();
  const { setConfig: setBulkEditConfig, setSelection: setBulkEditSelection, selectedRows } = useBulkEditContext();
  if (__DEV__) console.log(`[CustPerf] hook: ${(performance.now() - _mountMs).toFixed(1)}ms, rows=${count}`);

  // Panel state — open when sidebar "Add Customer" triggers via URL param
  const [showAddCustomerPanel, setShowAddCustomerPanel] = useState(false);
  const addCustomerPanelRef = useRef<AddCustomerPanelControllerHandle>(null);
  useEffect(() => {
    if (params.openAddCustomer) {
      setShowAddCustomerPanel(true);
    }
  }, [params.openAddCustomer]);
  useEffect(() => {
    if (showAddCustomerPanel && addCustomerPanelRef.current) {
      addCustomerPanelRef.current.open();
    }
  }, [showAddCustomerPanel]);

  // Customer details modal
  const [showCustomerDetails, setShowCustomerDetails] = useState(false);
  const [detailsCustomer, setDetailsCustomer] = useState<ReturnType<typeof toCustomerDetails> | null>(null);
  // Edit customer modal (AddQuickCustomerModal in edit mode)
  const [showEditModal, setShowEditModal] = useState(false);
  const [editCustomerId, setEditCustomerId] = useState<number | null>(null);

  useEffect(() => {
    if (!params.openCustomerDetails) return;
    const first = selectedRows[0] as CustomerView | undefined;
    if (!first) {
      Alert.alert("View Customer Details", "Please select a customer from the list first.");
      return;
    }
    setDetailsCustomer(toCustomerDetails(first));
    setShowCustomerDetails(true);
  }, [params.openCustomerDetails, selectedRows]);

  const handleViewCustomer = useCallback((customer: CustomerView) => {
    setDetailsCustomer(toCustomerDetails(customer));
    setShowCustomerDetails(true);
  }, []);

  const handleEditCustomer = useCallback((customer: CustomerView) => {
    const id = Number(customer.id);
    if (Number.isNaN(id)) return;
    setEditCustomerId(id);
    setShowCustomerDetails(false);
    setShowEditModal(true);
  }, []);

  const handlePrintCustomer = useCallback((customer: CustomerView) => {
    Alert.alert("Print", `Printing invoice for ${customer.businessName || customer.name}...`);
  }, []);

  // Column config
  const columns = useMemo<ColumnDefinition<CustomerView>[]>(() => [
    {
      key: "businessName",
      title: "Business Name",
      width: "24%",
      visible: true,
      hideable: false,
      render: (item) => (
        <Text className="text-blue-600 text-lg font-bold pr-4" numberOfLines={1}>
          {item.businessName || item.name || "-"}
        </Text>
      ),
    },
    {
      key: "customerId",
      title: "Customer ID",
      width: "11%",
      visible: true,
      render: (item) => (
        <Text className="text-gray-600 text-base">{item.id.slice(0, 8)}</Text>
      ),
    },
    {
      key: "ecomStatus",
      title: "Ecom Status",
      width: "11%",
      visible: true,
      render: (item) =>
        item.allowEcom ? (
          <Text className="text-base text-green-600">Allowed</Text>
        ) : (
          <Text className="text-base text-red-600">Not Allowed</Text>
        ),
    },
    {
      key: "customerName",
      title: "Customer Name",
      width: "18%",
      visible: true,
      render: (item) => (
        <Text className="text-base text-blue-600" numberOfLines={1}>
          {item.name || "-"}
        </Text>
      ),
    },
    {
      key: "balance",
      title: "Balance",
      width: "11%",
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
      width: "11%",
      align: "center",
      visible: true,
      render: (item) => <StatusBadge isActive={item.isActive} />,
    },
    {
      key: "actions",
      title: "Actions",
      width: ACTION_COL_WIDTH,
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
          <ActionButton
            icon="pencil-outline"
            onPress={() => handleEditCustomer(item)}
          />
        </View>
      ),
    },
  ], [handlePrintCustomer, handleViewCustomer, handleEditCustomer]);

  // Single selection only: View Customer Details + Edit Customer when 1 selected
  const [selectedKeys, setSelectedKeysState] = useState<string[]>([]);

  const handleEditFromSidebar = useCallback((rows: CustomerView[]) => {
    const customer = rows[0];
    if (!customer) return;
    handleEditCustomer(customer);
  }, [handleEditCustomer]);

  const handleSelectionChange = useCallback(
    (keys: string[], rows: CustomerView[]) => {
      const single = rows.length <= 1 ? rows : [rows[rows.length - 1]];
      const singleKeys = single.map((r) => r.id);
      setSelectedKeysState(singleKeys);
      setBulkEditSelection(single);
    },
    [setBulkEditSelection]
  );

  useEffect(() => {
    setBulkEditConfig({
      label: "Edit Customer",
      onPress: handleEditFromSidebar,
      viewSingleItem: handleViewCustomer,
    });
    return () => setBulkEditConfig(null);
  }, [handleEditFromSidebar, handleViewCustomer, setBulkEditConfig]);

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
        bulkActions
        bulkActionText="Edit Customer"
        bulkActionInSidebar
        onBulkActionPress={handleEditFromSidebar}
        selectedRowKeys={selectedKeys}
        onSelectionChange={handleSelectionChange}
        columnSelector
        toolbarButtonStyle="shopping-cart"
        horizontalScroll
        minWidth={contentWidth}
        isLoading={isLoading}
        onRefresh={refresh}
        emptyIcon="people-outline"
        emptyText="No customers found"
        totalCount={count}
      />

      {/* Add Customer 左滑弹窗（与 Add Note、Search Product 同模板） */}
      <AddCustomerPanelController
        ref={addCustomerPanelRef}
        onVisibleStateChange={(visible) => {
          if (!visible) setShowAddCustomerPanel(false);
        }}
        onSave={(customer) => {
          Alert.alert("Success", `Customer ${customer.businessName} added successfully`);
          refresh();
        }}
      />

      {/* View Customer Details modal — from sidebar or row Actions */}
      <CustomerDetailsModal
        visible={showCustomerDetails}
        onClose={() => {
          setShowCustomerDetails(false);
          setDetailsCustomer(null);
        }}
        customer={detailsCustomer}
        onEdit={
          detailsCustomer
            ? () => {
                const id = Number(detailsCustomer.id);
                if (!Number.isNaN(id)) {
                  setShowCustomerDetails(false);
                  setEditCustomerId(id);
                  setShowEditModal(true);
                }
              }
            : undefined
        }
        onAddOrder={() => {
          setShowCustomerDetails(false);
          setDetailsCustomer(null);
          Alert.alert("New Order", "Redirecting to new order...");
        }}
      />

      <AddQuickCustomerModal
        visible={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setEditCustomerId(null);
        }}
        customerId={editCustomerId}
        onSave={() => {
          setShowEditModal(false);
          setEditCustomerId(null);
          Alert.alert("Success", "Customer updated successfully.");
          refresh();
        }}
      />
    </View>
  );
}
