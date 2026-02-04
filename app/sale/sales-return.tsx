import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import {
  Alert,
  FlatList,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import StaffPageLayout, { SidebarButton } from "../../components/StaffPageLayout";

// ============================================================================
// Types
// ============================================================================

interface SalesReturn {
  id: string;
  returnNumber: string;
  dateTime: string;
  customerName: string;
  createdBy: string;
  channelName: string;
  invoiceTotal: number;
  returnTotal: number;
  status: "Complete" | "Pending";
}

// ============================================================================
// Sample Data
// ============================================================================

const SAMPLE_RETURNS: SalesReturn[] = [
  { id: "1", returnNumber: "RE-260129-05970", dateTime: "01/28/2026, 09:49:11", customerName: "Test Customer Name", createdBy: "User 1", channelName: "Primary", invoiceTotal: -88888.00, returnTotal: -88888.00, status: "Complete" },
  { id: "2", returnNumber: "RE-260129-05970", dateTime: "01/28/2026, 09:49:11", customerName: "Test Customer Name", createdBy: "User 1", channelName: "Primary", invoiceTotal: -88888.00, returnTotal: -88888.00, status: "Pending" },
  { id: "3", returnNumber: "RE-260129-05970", dateTime: "01/28/2026, 09:49:11", customerName: "Test Customer Name", createdBy: "User 1", channelName: "Primary", invoiceTotal: -88888.00, returnTotal: -88888.00, status: "Pending" },
  { id: "4", returnNumber: "RE-260129-05970", dateTime: "01/28/2026, 09:49:11", customerName: "Test Customer Name", createdBy: "User 1", channelName: "Primary", invoiceTotal: -88888.00, returnTotal: -88888.00, status: "Complete" },
  { id: "5", returnNumber: "RE-260129-05970", dateTime: "01/28/2026, 09:49:11", customerName: "Test Customer Name", createdBy: "User 1", channelName: "Primary", invoiceTotal: -88888.00, returnTotal: -88888.00, status: "Pending" },
  { id: "6", returnNumber: "RE-260129-05970", dateTime: "01/28/2026, 09:49:11", customerName: "Test Customer Name", createdBy: "User 1", channelName: "Primary", invoiceTotal: -88888.00, returnTotal: -88888.00, status: "Complete" },
  { id: "7", returnNumber: "RE-260129-05970", dateTime: "01/28/2026, 09:49:11", customerName: "Test Customer Name", createdBy: "User 1", channelName: "Primary", invoiceTotal: -88888.00, returnTotal: -88888.00, status: "Pending" },
  { id: "8", returnNumber: "RE-260129-05970", dateTime: "01/28/2026, 09:49:11", customerName: "Test Customer Name", createdBy: "User 1", channelName: "Primary", invoiceTotal: -88888.00, returnTotal: -88888.00, status: "Complete" },
  { id: "9", returnNumber: "RE-260129-05970", dateTime: "01/28/2026, 09:49:11", customerName: "Test Customer Name", createdBy: "User 1", channelName: "Primary", invoiceTotal: -88888.00, returnTotal: -88888.00, status: "Pending" },
  { id: "10", returnNumber: "RE-260129-05970", dateTime: "01/28/2026, 09:49:11", customerName: "Test Customer Name", createdBy: "User 1", channelName: "Primary", invoiceTotal: -88888.00, returnTotal: -88888.00, status: "Pending" },
];

// ============================================================================
// Helper Functions
// ============================================================================

function formatCurrency(value: number): string {
  const isNegative = value < 0;
  return `${isNegative ? '-' : ''}$${Math.abs(value).toFixed(2)}`;
}

// ============================================================================
// Main Component
// ============================================================================

export default function SalesReturnScreen() {
  const [searchQuery, setSearchQuery] = useState("");

  // Custom Sidebar Buttons for Sales Return
  const sidebarButtons = (
    <>
      <SidebarButton 
        title="Create Sale Return"
        icon={<Ionicons name="add-circle-outline" size={20} color="#EC1A52" />}
        onPress={() => Alert.alert("Create Return", "Create new return function")}
      />
      <SidebarButton 
        title="Print Return Invoice"
        icon={<Ionicons name="print-outline" size={20} color="#EC1A52" />}
        onPress={() => Alert.alert("Print", "Printing return invoice list...")}
      />
      <SidebarButton 
        title="View Return Invoice"
        icon={<Ionicons name="document-text-outline" size={20} color="#EC1A52" />}
        onPress={() => Alert.alert("View Invoice", "Select a return to view invoice")}
      />
      <SidebarButton 
        title="Edit Return"
        icon={<Ionicons name="create-outline" size={20} color="#EC1A52" />}
        onPress={() => Alert.alert("Edit Return", "Select a return to edit")}
      />
    </>
  );

  const StatusBadge = ({ status }: { status: "Complete" | "Pending" }) => (
    <View 
      className="px-2 py-1 rounded"
      style={{ backgroundColor: status === "Complete" ? "#22C55E" : "#F59E0B" }}
    >
      <Text className="text-white text-xs font-medium">{status}</Text>
    </View>
  );

  const renderReturn = ({ item, index }: { item: SalesReturn; index: number }) => (
    <View 
      className={`flex-row items-center px-4 py-3 border-b border-gray-100 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}
    >
      <Text className="w-32 text-blue-600 text-xs font-medium" numberOfLines={1}>
        {item.returnNumber}
      </Text>
      <Text className="w-40 text-gray-600 text-xs">
        {item.dateTime}
      </Text>
      <Text className="w-40 text-blue-600 text-xs" numberOfLines={1}>
        {item.customerName}
      </Text>
      <Text className="w-24 text-gray-600 text-xs">{item.createdBy}</Text>
      <View className="w-24">
        <View className="bg-pink-100 px-2 py-1 rounded self-start">
          <Text className="text-pink-600 text-xs font-medium">{item.channelName}</Text>
        </View>
      </View>
      <Text className="w-28 text-red-600 text-xs font-bold">
        {formatCurrency(item.invoiceTotal)}
      </Text>
      <Text className="w-28 text-red-600 text-xs font-bold">
        {formatCurrency(item.returnTotal)}
      </Text>
      <View className="w-24">
        <StatusBadge status={item.status} />
      </View>
      <View className="w-20 flex-row gap-2">
        <Pressable className="bg-red-50 p-1.5 rounded">
          <Ionicons name="print-outline" size={14} color="#EC1A52" />
        </Pressable>
        <Pressable className="bg-red-50 p-1.5 rounded">
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
          <Text className="text-2xl font-bold text-gray-900">Sales Return</Text>
          <Text className="text-gray-500 text-sm mt-1">Search by Customer Name, SKU, UPC</Text>
        </View>

        {/* Search Bar */}
        <View className="px-6 pb-4">
          <View className="flex-row items-center gap-3">
            <View className="flex-1 flex-row items-center bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
              <Ionicons name="search" size={18} color="#9CA3AF" />
              <TextInput
                className="flex-1 ml-2 text-gray-800"
                placeholder="Search Returns"
                placeholderTextColor="#9CA3AF"
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
            </View>
            <Pressable 
              className="flex-row items-center gap-2 px-6 py-3 rounded-lg"
              style={{ backgroundColor: "#EC1A52" }}
            >
              <Ionicons name="refresh" size={18} color="white" />
              <Text className="text-white font-medium">Refresh</Text>
            </Pressable>
            <Pressable className="bg-gray-900 p-3 rounded-lg">
              <Ionicons name="settings-outline" size={20} color="white" />
            </Pressable>
          </View>
        </View>

        {/* Table */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-1">
          <View style={{ minWidth: 1000 }}>
            {/* Table Header */}
            <View className="flex-row bg-gray-50 py-3 px-4 border-y border-gray-200">
              <View className="w-32 flex-row items-center">
                <Text className="text-gray-500 text-xs font-semibold">Return Number</Text>
                <Ionicons name="chevron-expand" size={12} color="#9CA3AF" />
              </View>
              <View className="w-40 flex-row items-center">
                <Text className="text-gray-500 text-xs font-semibold">Date / Time</Text>
                <Ionicons name="chevron-expand" size={12} color="#9CA3AF" />
              </View>
              <View className="w-40 flex-row items-center">
                <Text className="text-gray-500 text-xs font-semibold">Customer Name</Text>
                <Ionicons name="chevron-expand" size={12} color="#9CA3AF" />
              </View>
              <Text className="w-24 text-gray-500 text-xs font-semibold">Created By</Text>
              <Text className="w-24 text-gray-500 text-xs font-semibold">Channel Name</Text>
              <Text className="w-28 text-gray-500 text-xs font-semibold">Invoice Total</Text>
              <Text className="w-28 text-gray-500 text-xs font-semibold">Return Total</Text>
              <Text className="w-24 text-gray-500 text-xs font-semibold">Status</Text>
              <Text className="w-20 text-gray-500 text-xs font-semibold">Actions</Text>
            </View>

            <FlatList
              data={SAMPLE_RETURNS}
              keyExtractor={(item) => item.id}
              renderItem={renderReturn}
              showsVerticalScrollIndicator={false}
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
      </View>
    </StaffPageLayout>
  );
}
