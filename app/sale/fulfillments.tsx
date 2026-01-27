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
import { Fulfillment } from "../../types";

// ============================================================================
// Constants
// ============================================================================

const TABS = ["All", "Pending", "Picking", "Packing"] as const;

const SHIPPING_OPTIONS = [
  { label: "All", value: "all" },
  { label: "Pickup", value: "Pickup" },
  { label: "Dropoff", value: "Dropoff" },
  { label: "Delivery", value: "Delivery" },
];

const PICKER_OPTIONS = [
  { label: "All", value: "all" },
  { label: "Assigned", value: "assigned" },
  { label: "Not Assigned", value: "not_assigned" },
];

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

function TableCheckbox() {
  return <View className="w-5 h-5 border border-gray-300 rounded" />;
}

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
  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<typeof TABS[number]>("All");
  const [shippingFilter, setShippingFilter] = useState<string | null>(null);
  const [pickerFilter, setPickerFilter] = useState<string | null>(null);

  const [fulfillments] = useState<Fulfillment[]>(SAMPLE_FULFILLMENTS);

  // Apply filters
  const filteredFulfillments = useMemo(() => {
    let result = [...fulfillments];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (f) =>
          f.businessName.toLowerCase().includes(query) ||
          f.customerName.toLowerCase().includes(query) ||
          f.orderNo.toLowerCase().includes(query)
      );
    }

    // Shipping type filter
    if (shippingFilter && shippingFilter !== "all") {
      result = result.filter((f) => f.shippingType === shippingFilter);
    }

    // Picker filter
    if (pickerFilter && pickerFilter !== "all") {
      result = result.filter((f) =>
        pickerFilter === "assigned" ? f.pickerAssigned : !f.pickerAssigned
      );
    }

    return result;
  }, [fulfillments, searchQuery, activeTab, shippingFilter, pickerFilter]);

  const renderFulfillmentRow = ({ item }: { item: Fulfillment }) => (
    <Pressable className="flex-row items-center py-3 px-5 border-b border-gray-100 bg-white">
      <View className="w-8 mr-4">
        <TableCheckbox />
      </View>
      <View className="flex-1">
        <Text className="text-blue-600 font-medium">{item.businessName}</Text>
        {item.customerName && (
          <Text className="text-blue-500 text-sm">{item.customerName}</Text>
        )}
      </View>
      <Text className="w-40 text-blue-600 text-center">{item.orderNo}</Text>
      <Text className="w-28 text-gray-600 text-center">{item.shippingType}</Text>
      <View className="w-36">
        <PickerBadge isAssigned={item.pickerAssigned} details={item.pickerDetails} />
      </View>
    </Pressable>
  );

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

      {/* Toolbar */}
      <View className="bg-white px-5 py-4 border-b border-gray-200">
        {/* Search Section */}
        <Text className="text-gray-500 text-sm mb-2">
          Search by Customer (Name, Phone, Address), Business Name, Order no
        </Text>
        <View className="flex-row gap-4 mb-4">
          <View className="flex-1">
            <TextInput
              className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5"
              placeholder="Search fulfillments..."
              placeholderTextColor="#9ca3af"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
          <FilterDropdown
            label=""
            value={shippingFilter}
            options={SHIPPING_OPTIONS}
            onChange={setShippingFilter}
            placeholder="Shipping Type"
            width={140}
          />
          <FilterDropdown
            label=""
            value={pickerFilter}
            options={PICKER_OPTIONS}
            onChange={setPickerFilter}
            placeholder="Picker Status"
            width={140}
          />
        </View>

        {/* Action Buttons */}
        <View className="flex-row gap-3 items-center justify-between">
          <View className="flex-row gap-3">
            <Pressable className="bg-red-500 px-4 py-2 rounded-lg flex-row items-center gap-2">
              <Text className="text-white font-medium">Bulk Actions</Text>
              <Ionicons name="chevron-down" size={16} color="white" />
            </Pressable>
            <Pressable className="bg-gray-100 px-4 py-2 rounded-lg flex-row items-center gap-2">
              <Ionicons name="grid" size={16} color="#374151" />
              <Text className="text-gray-700">Freeze Columns</Text>
            </Pressable>
            <Pressable className="bg-gray-100 px-4 py-2 rounded-lg flex-row items-center gap-2">
              <Ionicons name="grid" size={16} color="#374151" />
              <Text className="text-gray-700">Columns</Text>
            </Pressable>
          </View>
          <Text className="text-gray-400 text-sm">
            {filteredFulfillments.length} fulfillments
          </Text>
        </View>
      </View>

      {/* Data Table */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-1">
        <View style={{ minWidth: 850 }}>
          {/* Table Header */}
          <View className="flex-row bg-gray-50 py-3 px-5 border-b border-gray-200">
            <View className="w-8 mr-4">
              <TableCheckbox />
            </View>
            <Text className="flex-1 text-gray-500 text-xs font-semibold uppercase">
              Business Name / Customer Name
            </Text>
            <Text className="w-40 text-gray-500 text-xs font-semibold uppercase text-center">
              Order No / Date
            </Text>
            <Text className="w-28 text-gray-500 text-xs font-semibold uppercase text-center">
              Shipping Type
            </Text>
            <Text className="w-36 text-gray-500 text-xs font-semibold uppercase text-center">
              Picker Details
            </Text>
          </View>

          {/* Table Body */}
          <FlatList
            data={filteredFulfillments}
            keyExtractor={(item) => item.id}
            renderItem={renderFulfillmentRow}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View className="py-16 items-center">
                <Ionicons name="cube-outline" size={48} color="#d1d5db" />
                <Text className="text-gray-400 mt-2">No fulfillments found</Text>
              </View>
            }
          />
        </View>
      </ScrollView>
    </View>
  );
}
