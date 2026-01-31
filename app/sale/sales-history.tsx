import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { OrderDetailsModal } from "../../components/OrderDetailsModal";
import StaffPageLayout, { SidebarButton } from "../../components/StaffPageLayout";
import { SaleOrderView, useSaleOrders } from "../../utils/powersync/hooks";

// ============================================================================
// Constants
// ============================================================================

const STATUS_COLORS: Record<number, { bg: string; text: string }> = {
  1: { bg: "#FEF08A", text: "#92400E" }, // Pending - Yellow
  2: { bg: "#DBEAFE", text: "#1E40AF" }, // Confirmed - Blue
  3: { bg: "#FED7AA", text: "#9A3412" }, // Processing - Orange
  4: { bg: "#BBF7D0", text: "#166534" }, // Completed - Green
  5: { bg: "#FECACA", text: "#991B1B" }, // Cancelled - Red
};

// ============================================================================
// Stat Card Component
// ============================================================================

interface StatCardProps {
  title: string;
  count: number;
  color: string;
}

function StatCard({ title, count, color }: StatCardProps) {
  return (
    <View 
      className="flex-1 rounded-lg px-3 py-3"
      style={{ backgroundColor: color }}
    >
      <View className="flex-row justify-between items-center">
        <Text className="text-white font-medium text-xs flex-1 mr-2" numberOfLines={1}>{title}</Text>
        <Text className="text-white font-bold text-lg">{count}</Text>
      </View>
    </View>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export default function SalesHistoryScreen() {
  const { orders, isLoading, refresh } = useSaleOrders();
  const [searchQuery, setSearchQuery] = useState("");
  const [showStats, setShowStats] = useState(true);

  // Custom Sidebar Buttons for Sales History
  const sidebarButtons = (
    <>
      <SidebarButton 
        title="Add Order"
        icon={<Ionicons name="add-circle-outline" size={20} color="#FFFFFF" />}
        onPress={() => router.push("/order/add-products" as any)}
        bgColor="#EC1A52"
        textColor="#FFFFFF"
        borderColor="#EC1A52"
      />
      <SidebarButton 
        title="Print Invoice"
        icon={<Ionicons name="print-outline" size={20} color="#1A1A1A" />}
        onPress={() => Alert.alert("Print", "Printing invoice...")}
        bgColor="#FCD34D" // Yellow-400
        borderColor="#FCD34D"
      />
      <SidebarButton 
        title="View Invoice"
        icon={<Ionicons name="document-text-outline" size={20} color="#EC1A52" />}
        onPress={() => Alert.alert("View Invoice", "Select an order to view invoice")}
        textColor="#EC1A52"
        borderColor="#EC1A52"
      />
      <SidebarButton 
        title="Edit Order"
        icon={<Ionicons name="create-outline" size={20} color="#EC1A52" />}
        onPress={() => Alert.alert("Edit Order", "Select an order to edit")}
        textColor="#EC1A52"
        borderColor="#EC1A52"
      />
    </>
  );

  // Filter orders based on search query
  const filteredOrders = useMemo(() => {
    if (!searchQuery) return orders;
    
    const query = searchQuery.toLowerCase();
    return orders.filter((order: SaleOrderView) => 
      (order.customerName && order.customerName.toLowerCase().includes(query)) ||
      (order.orderNo && order.orderNo.toLowerCase().includes(query)) ||
      (order.id && order.id.toLowerCase().includes(query))
    );
  }, [orders, searchQuery]);

  // Modal handlers
  const [showOrderDetails, setShowOrderDetails] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);

  const convertToOrderDetails = (order: SaleOrderView) => {
    // Helper function to map numeric statuses to text
    const getDisplayStatus = (status: number) => {
      if (status === 50) return "Completed";
      switch (status) {
        case 1: return "Pending";
        case 2: return "Confirmed";
        case 3: return "Processing";
        case 4: return "Completed";
        case 5: return "Cancelled";
        default: return "Pending";
      }
    };

    const getOrderTypeLabel = (type: number) => {
      switch (type) {
        case 0: return "Walk In";
        case 1: return "Online";
        default: return "Walk In";
      }
    };

    const getShippingTypeLabel = (type: number) => {
      switch (type) {
        case 1: return "Delivery";
        case 2: return "Shipping";
        default: return "Pickup";
      }
    };

    const getInvoiceStatus = (fulfilmentStatus: number): "Paid" | "Unpaid" | "Partial" => {
      if (fulfilmentStatus === 2) return "Paid";
      if (fulfilmentStatus === 1) return "Partial";
      return "Unpaid";
    };

    return {
      id: order.id,
      orderNumber: order.orderNo || `ORD-${order.id.slice(0, 8)}`,
      date: order.orderDate || new Date().toISOString(),
      status: getDisplayStatus(order.status),
      orderType: getOrderTypeLabel(order.orderType),
      shippingType: getShippingTypeLabel(order.shippingType),
      channelName: "Primary",
      invoiceStatus: getInvoiceStatus(order.fulfilmentStatus),
      customer: {
        name: order.businessName || order.customerName || "Guest Customer",
      },
      cashier: "Cashier 1",
      items: [], // Would need to fetch from order_items table
      payments: [], // Would need to fetch from payments table
      subTotal: order.totalPrice || 0,
      discount: order.discount || 0,
      tax: order.tax || 0,
      total: order.totalPrice || 0,
      amountPaid: order.totalPrice || 0,
      createdBy: "Staff",
    };
  };

  const handleViewOrder = (order: SaleOrderView) => {
    const converted = convertToOrderDetails(order);
    setSelectedOrder(converted);
    setShowOrderDetails(true);
  };

  // Status Badge Component
  const OrderStatusBadge = ({ status }: { status: number }) => {
    const config = STATUS_COLORS[status] || STATUS_COLORS[1];
    
    // Map status number to text
    let statusText = "Pending";
    if (status === 50) statusText = "Completed"; // Handle mapped legacy status
    else if (status === 1) statusText = "Pending";
    else if (status === 2) statusText = "Confirmed";
    else if (status === 3) statusText = "Processing";
    else if (status === 4) statusText = "Completed";
    else if (status === 5) statusText = "Cancelled";

    return (
      <View 
        className="px-2 py-1 rounded"
        style={{ backgroundColor: config.bg }}
      >
        <Text style={{ color: config.text, fontSize: 12, fontWeight: "500" }}>
          {statusText}
        </Text>
      </View>
    );
  };

  const InvoiceStatusBadge = ({ status }: { status: number }) => {
    // status: 0=Unfulfilled, 1=Partially Fulfilled, 2=Fulfilled
    let color = "#EC1A52"; // Unpaid/Unfulfilled
    let text = "Unpaid";

    if (status === 2) {
      color = "#22C55E"; // Paid/Fulfilled
      text = "Paid";
    } else if (status === 1) {
      color = "#F59E0B"; // Partial
      text = "Partial";
    }

    return (
      <View 
        className="px-2 py-1 rounded"
        style={{ backgroundColor: color }}
      >
        <Text className="text-white text-xs font-medium">{text}</Text>
      </View>
    );
  };

  const renderOrderRow = ({ item, index }: { item: SaleOrderView, index: number }) => (
    <View 
      className={`flex-row items-center px-4 py-3 border-b border-gray-100 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}
    >
      <Text className="w-32 text-blue-600 text-xs font-medium" numberOfLines={1}>
        {item.orderNo || item.id.slice(0, 8)}
      </Text>
      <Text className="w-40 text-gray-600 text-xs">
        {item.orderDate ? new Date(item.orderDate).toLocaleString() : '-'}
      </Text>
      <Text className="w-40 text-blue-600 text-xs" numberOfLines={1}>
        {item.businessName || item.customerName || "Guest"}
      </Text>
      <Text className="w-24 text-gray-600 text-xs">User 1</Text>
      <Text className="w-28 text-red-600 text-xs font-bold">
        ${(item.totalPrice || 0).toFixed(2)}
      </Text>
      <View className="w-20">
        <InvoiceStatusBadge status={item.fulfilmentStatus} />
      </View>
      <View className="w-24">
        <OrderStatusBadge status={item.status} />
      </View>
      <View className="w-20 flex-row gap-2">
        <Pressable className="bg-red-50 p-1.5 rounded">
          <Ionicons name="print-outline" size={14} color="#EC1A52" />
        </Pressable>
        <Pressable 
          className="bg-red-50 p-1.5 rounded"
          onPress={() => handleViewOrder(item)}
        >
          <Ionicons name="eye-outline" size={14} color="#EC1A52" />
        </Pressable>
      </View>
    </View>
  );

  return (
    <StaffPageLayout sidebarCustomButtons={sidebarButtons}>
      <View className="flex-1 bg-white">
        {/* Title and Search Section */}
        <View className="px-4 py-4">
          <Text className="text-xl font-bold text-gray-900 mb-1">Sales History</Text>
          <Text className="text-gray-500 text-sm mb-4">Search by Customer Name, SKU, UPC</Text>

          {/* Search Bar */}
          <View className="flex-row items-center gap-3">
            <View className="flex-1 flex-row items-center bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
              <Ionicons name="search" size={18} color="#9CA3AF" />
              <TextInput
                className="flex-1 ml-2 text-gray-800"
                placeholder="Search Products"
                placeholderTextColor="#9CA3AF"
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
            </View>
            <Pressable 
              className="flex-row items-center gap-2 px-6 py-3 rounded-lg"
              style={{ backgroundColor: "#EC1A52" }}
              onPress={refresh}
            >
              <Ionicons name="refresh" size={18} color="white" />
              <Text className="text-white font-medium">Refresh</Text>
            </Pressable>
            <Pressable className="bg-gray-900 p-3 rounded-lg">
              <Ionicons name="settings-outline" size={20} color="white" />
            </Pressable>
          </View>
        </View>

        {/* Stats Section */}
        {showStats && (
          <View className="px-4 mb-4">
            {/* Row 1 */}
            <View className="flex-row gap-3 mb-3">
              <StatCard title="Completed" count={450} color="#3B82F6" />
              <StatCard title="Delivery" count={321} color="#14B8A6" />
              <StatCard title="Parked" count={23} color="#8B5CF6" />
            </View>
            {/* Row 2 */}
            <View className="flex-row gap-3">
              <StatCard title="Unpaid" count={450} color="#EC1A52" />
              <StatCard title="Returned" count={321} color="#22C55E" />
              <StatCard title="In Progress" count={23} color="#F59E0B" />
            </View>
          </View>
        )}

        {/* Table Section */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-1">
          <View style={{ minWidth: 900 }}>
            {/* Table Header */}
            <View className="flex-row bg-gray-50 py-3 px-4 border-y border-gray-200">
              <View className="w-32 flex-row items-center">
                <Text className="text-gray-500 text-xs font-semibold">Order Number</Text>
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
              <View className="w-28 flex-row items-center">
                <Text className="text-gray-500 text-xs font-semibold">Total</Text>
                <Ionicons name="chevron-expand" size={12} color="#9CA3AF" />
              </View>
              <Text className="w-20 text-gray-500 text-xs font-semibold">Invoice Status</Text>
              <Text className="w-24 text-gray-500 text-xs font-semibold">Status</Text>
              <Text className="w-20 text-gray-500 text-xs font-semibold">Actions</Text>
            </View>

            {/* Table Body */}
            <FlatList
              data={filteredOrders}
              keyExtractor={(item) => item.id}
              renderItem={renderOrderRow}
              showsVerticalScrollIndicator={false}
              ListEmptyComponent={
                <View className="py-20 items-center justify-center">
                  <ActivityIndicator size="large" color="#EC1A52" />
                  <Text className="text-gray-400 mt-4">Loading orders...</Text>
                </View>
              }
            />
          </View>
        </ScrollView>
        
        {/* Order Details Modal */}
        <OrderDetailsModal
          visible={showOrderDetails}
          onClose={() => setShowOrderDetails(false)}
          order={selectedOrder}
        />
      </View>
    </StaffPageLayout>
  );
}
