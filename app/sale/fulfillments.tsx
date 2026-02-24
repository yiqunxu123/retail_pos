/**
 * Fulfillments Screen
 * Uses the unified DataTable component with PowerSync data
 * Shows sale orders in progress (pending, picking, packing, etc.)
 */

import { colors } from "@/utils/theme";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Alert, Pressable, Text, View } from "react-native";
import { useBulkEditContext } from "../../contexts/BulkEditContext";
import { ColumnDefinition, DataTable, FilterDefinition, PageHeader } from "../../components";
import { useTableContentWidth } from "../../hooks/useTableContentWidth";
import { useFulfillments } from "../../utils/powersync/hooks";
import type { FulfillmentView } from "../../utils/powersync/hooks";

// ============================================================================
// Constants
// ============================================================================

const TABS = ["All", "Pending", "Picking", "Packing"] as const;

// ============================================================================
// Reusable Components
// ============================================================================

function PickerBadge({ isAssigned, details }: { isAssigned: boolean; details: string }) {
  return (
    <View className="flex-row items-center justify-center gap-2">
      <View
        className="w-7 h-7 rounded-full items-center justify-center"
        style={{ backgroundColor: isAssigned ? colors.primary : colors.borderMedium }}
      >
        <Text className="text-white text-sm font-bold">
          {isAssigned ? "D" : "?"}
        </Text>
      </View>
      <Text className="text-gray-600 text-lg" numberOfLines={1}>
        {details}
      </Text>
    </View>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export default function FulfillmentsScreen() {
  const contentWidth = useTableContentWidth();
  const [activeTab, setActiveTab] = useState<typeof TABS[number]>("All");
  const { fulfillments, isLoading, refresh, count } = useFulfillments();

  const columns = useMemo<ColumnDefinition<FulfillmentView>[]>(
    () => [
    {
      key: "businessName",
      title: "Business Name / Customer Name",
      width: "46%",
      visible: true,
      hideable: false,
      render: (item) => (
        <View>
          <Text className="text-blue-600 font-bold text-lg">{item.businessName}</Text>
          {item.customerName && (
            <Text className="text-blue-600 text-base">{item.customerName}</Text>
          )}
        </View>
      ),
    },
    {
      key: "orderNo",
      title: "Order No",
      width: "15%",
      align: "center",
      visible: true,
      render: (item) => <Text className="text-blue-600 text-lg">{item.orderNo}</Text>,
    },
    {
      key: "shippingType",
      title: "Shipping",
      width: "12%",
      align: "center",
      visible: true,
      render: (item) => <Text className="text-gray-600 text-lg">{item.shippingType}</Text>,
    },
    {
      key: "pickerDetails",
      title: "Picker",
      width: "15%",
      align: "center",
      visible: true,
      render: (item) => (
        <PickerBadge isAssigned={item.pickerAssigned} details={item.pickerDetails} />
      ),
    },
  ],
    []
  );

  // Filters
  const filters: FilterDefinition[] = [
    {
      key: "shippingType",
      placeholder: "Shipping Type",
      width: 140,
      options: [
        { label: "All", value: "all" },
        { label: "Pickup", value: "Pickup" },
        { label: "Dropoff", value: "Dropoff" },
        { label: "Delivery", value: "Delivery" },
      ],
    },
    {
      key: "picker",
      placeholder: "Picker Status",
      width: 140,
      options: [
        { label: "All", value: "all" },
        { label: "Assigned", value: "assigned" },
        { label: "Not Assigned", value: "not_assigned" },
      ],
    },
  ];

  const handleSearch = useCallback((item: FulfillmentView, query: string) => {
    const q = query.toLowerCase();
    return (
      item.businessName.toLowerCase().includes(q) ||
      item.customerName.toLowerCase().includes(q) ||
      item.orderNo.toLowerCase().includes(q)
    );
  }, []);

  const { setConfig: setBulkEditConfig, setSelection: setBulkEditSelection } = useBulkEditContext();

  const handleBulkAction = useCallback((rows: FulfillmentView[]) => {
    if (rows.length === 0) {
      Alert.alert("Bulk Assign", "Please select order(s) first.");
      return;
    }
    Alert.alert("Bulk Assign Picker", `${rows.length} order(s) selected. Bulk assign picker is coming soon.`);
  }, []);

  useEffect(() => {
    setBulkEditConfig({ label: "Bulk Assign", onPress: handleBulkAction });
    return () => setBulkEditConfig(null);
  }, [handleBulkAction, setBulkEditConfig]);

  const handleFilter = useCallback((item: FulfillmentView, filters: Record<string, string | null>) => {
    if (filters.shippingType && filters.shippingType !== "all") {
      if (item.shippingType !== filters.shippingType) return false;
    }
    if (filters.picker && filters.picker !== "all") {
      if (filters.picker === "assigned" && !item.pickerAssigned) return false;
      if (filters.picker === "not_assigned" && item.pickerAssigned) return false;
    }
    return true;
  }, []);

  return (
    <View className="flex-1 bg-[#F7F7F9]">
      <PageHeader title="Fulfillments" showBack={false} />

      {/* Tab Navigation */}
      <View className="bg-[#F7F7F9] flex-row border-b border-gray-200">
        {TABS.map((tab) => {
          const isActive = activeTab === tab;
          return (
            <Pressable
              key={tab}
              onPress={() => setActiveTab(tab)}
              className={`px-6 py-3 ${isActive ? "border-b-2 border-red-500" : ""}`}
            >
              <Text className={`font-medium ${isActive ? "text-red-500" : "text-gray-600"}`}>
                {tab}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <DataTable<FulfillmentView>
        data={fulfillments}
        columns={columns}
        keyExtractor={(item) => item.id}
        searchable
        searchPlaceholder="Search fulfillments..."
        searchHint="Search by Customer (Name, Phone, Address), Business Name, Order no"
        onSearch={handleSearch}
        filters={filters}
        onFilter={handleFilter}
        filtersInSettingsModal
        columnSelector
        toolbarButtonStyle="shopping-cart"
        onRefresh={refresh}
        isLoading={isLoading}
        bulkActions
        bulkActionText="Bulk Assign"
        bulkActionInActionRow
        bulkActionInSidebar
        onBulkActionPress={handleBulkAction}
        onSelectionChange={(_, rows) => setBulkEditSelection(rows)}
        emptyIcon="cube-outline"
        emptyText="No fulfillments found"
        totalCount={count}
        horizontalScroll
        minWidth={contentWidth}
      />
    </View>
  );
}
