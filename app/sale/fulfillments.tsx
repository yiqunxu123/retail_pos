/**
 * Fulfillments Screen
 * Uses the unified DataTable component
 */

import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { ColumnDefinition, DataTable, FilterDefinition, PageHeader } from "../../components";
import { Fulfillment } from "../../types";

// ============================================================================
// Constants
// ============================================================================

const TABS = ["All", "Pending", "Picking", "Packing"] as const;

// ============================================================================
// Sample Data
// ============================================================================

const SAMPLE_FULFILLMENTS: Fulfillment[] = [
  { id: "1", businessName: "Geneshay Namh Inc/ Shan Convenience Store", customerName: "GENESHAY NAMH INC", orderNo: "SO-260122-05902", shippingType: "Pickup", pickerDetails: "Not assigned", pickerAssigned: false },
  { id: "2", businessName: "ALASKA TAX CUSTOMER", customerName: "", orderNo: "SO-260122-05900", shippingType: "Pickup", pickerDetails: "Not assigned", pickerAssigned: false },
  { id: "3", businessName: "Exxon Racers Edge", customerName: "Krishna", orderNo: "SO-260121-05899", shippingType: "Pickup", pickerDetails: "discountws", pickerAssigned: true },
  { id: "4", businessName: "Jay Raghu Inc/ ATHENS FOOD MART", customerName: "PATEL ATULKUMAR/ MADHAVI SONI", orderNo: "SO-260121-05898", shippingType: "Pickup", pickerDetails: "Not assigned", pickerAssigned: false },
  { id: "5", businessName: "Sams Grocery Store", customerName: "VIKAS BHAI", orderNo: "SO-260121-05896", shippingType: "Pickup", pickerDetails: "Not assigned", pickerAssigned: false },
  { id: "6", businessName: "Jay Ramnam Inc", customerName: "Amitkumar Patel / ANKITA PATEL", orderNo: "SO-260121-05895", shippingType: "Dropoff", pickerDetails: "Not assigned", pickerAssigned: false },
];

// ============================================================================
// Reusable Components
// ============================================================================

function PickerBadge({ isAssigned, details }: { isAssigned: boolean; details: string }) {
  return (
    <View className="flex-row items-center justify-center gap-2">
      <View
        className={`w-6 h-6 rounded-full items-center justify-center ${
          isAssigned ? "bg-red-500" : "bg-gray-300"
        }`}
      >
        <Text className="text-white text-xs font-bold">
          {isAssigned ? "D" : "?"}
        </Text>
      </View>
      <Text className="text-gray-600 text-sm" numberOfLines={1}>
        {details}
      </Text>
    </View>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export default function FulfillmentsScreen() {
  const [activeTab, setActiveTab] = useState<typeof TABS[number]>("All");
  const [fulfillments] = useState<Fulfillment[]>(SAMPLE_FULFILLMENTS);

  // Column config
  const columns: ColumnDefinition<Fulfillment>[] = [
    {
      key: "businessName",
      title: "Business Name / Customer Name",
      width: "flex",
      visible: true,
      hideable: false,
      render: (item) => (
        <View>
          <Text className="text-blue-600 font-medium">{item.businessName}</Text>
          {item.customerName && (
            <Text className="text-blue-500 text-sm">{item.customerName}</Text>
          )}
        </View>
      ),
    },
    {
      key: "orderNo",
      title: "Order No",
      width: 140,
      align: "center",
      visible: true,
      render: (item) => <Text className="text-blue-600">{item.orderNo}</Text>,
    },
    {
      key: "shippingType",
      title: "Shipping",
      width: 100,
      align: "center",
      visible: true,
      render: (item) => <Text className="text-gray-600">{item.shippingType}</Text>,
    },
    {
      key: "pickerDetails",
      title: "Picker",
      width: 140,
      align: "center",
      visible: true,
      render: (item) => (
        <PickerBadge isAssigned={item.pickerAssigned} details={item.pickerDetails} />
      ),
    },
  ];

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

  const handleSearch = (item: Fulfillment, query: string) => {
    const q = query.toLowerCase();
    return (
      item.businessName.toLowerCase().includes(q) ||
      item.customerName.toLowerCase().includes(q) ||
      item.orderNo.toLowerCase().includes(q)
    );
  };

  const handleFilter = (item: Fulfillment, filters: Record<string, string | null>) => {
    if (filters.shippingType && filters.shippingType !== "all") {
      if (item.shippingType !== filters.shippingType) return false;
    }
    if (filters.picker && filters.picker !== "all") {
      if (filters.picker === "assigned" && !item.pickerAssigned) return false;
      if (filters.picker === "not_assigned" && item.pickerAssigned) return false;
    }
    return true;
  };

  return (
    <View className="flex-1 bg-gray-50">
      <PageHeader title="Fulfillments" />

      {/* Tab Navigation */}
      <View className="bg-white flex-row border-b border-gray-200">
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

      <DataTable<Fulfillment>
        data={fulfillments}
        columns={columns}
        keyExtractor={(item) => item.id}
        searchable
        searchPlaceholder="Search fulfillments..."
        searchHint="Search by Customer (Name, Phone, Address), Business Name, Order no"
        onSearch={handleSearch}
        filters={filters}
        onFilter={handleFilter}
        columnSelector
        bulkActions
        emptyIcon="cube-outline"
        emptyText="No fulfillments found"
        totalCount={fulfillments.length}
      />
    </View>
  );
}
