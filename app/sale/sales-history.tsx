/**
 * Sales History Screen
 * 
 * Displays order history with real-time sync from PowerSync.
 * Uses the unified DataTable component.
 */

import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useState } from "react";
import { Alert, Pressable, Text, View } from "react-native";
import { ColumnDefinition, DataTable, FilterDefinition, PageHeader } from "../../components";
import { OrderDetailsModal } from "../../components/OrderDetailsModal";
import { StatCardHorizontal } from "../../components/StatCardHorizontal";
import { SaleOrderView, useParkedOrders, useSaleOrders } from "../../utils/powersync/hooks";

// ============================================================================
// Constants
// ============================================================================

const STATUS_COLORS: Record<number, { bg: string; text: string }> = {
  1: { bg: "#FEF08A", text: "#92400E" },  // Pending - Yellow
  2: { bg: "#DBEAFE", text: "#1E40AF" },  // Confirmed - Blue
  3: { bg: "#FED7AA", text: "#9A3412" },  // Processing - Orange
  4: { bg: "#BBF7D0", text: "#166534" },  // Completed - Green
  5: { bg: "#FECACA", text: "#991B1B" },  // Cancelled - Red
  50: { bg: "#BBF7D0", text: "#166534" }, // Completed (legacy)
};

// ============================================================================
// Helper Components
// ============================================================================

function OrderStatusBadge({ status }: { status: number }) {
  const config = STATUS_COLORS[status] || STATUS_COLORS[1];
  
  const statusText = (() => {
    if (status === 50) return "Completed";
    switch (status) {
      case 1: return "Pending";
      case 2: return "Confirmed";
      case 3: return "Processing";
      case 4: return "Completed";
      case 5: return "Cancelled";
      default: return "Pending";
    }
  })();

  return (
    <View className="px-2 py-1 rounded" style={{ backgroundColor: config.bg }}>
      <Text style={{ color: config.text, fontSize: 12, fontWeight: "500" }}>
        {statusText}
      </Text>
    </View>
  );
}

function InvoiceStatusBadge({ status }: { status: number }) {
  let color = "#EC1A52";
  let text = "Unpaid";

  if (status === 2) {
    color = "#22C55E";
    text = "Paid";
  } else if (status === 1) {
    color = "#F59E0B";
    text = "Partial";
  }

  return (
    <View className="px-2 py-1 rounded" style={{ backgroundColor: color }}>
      <Text className="text-white text-xs font-medium">{text}</Text>
    </View>
  );
}

function ActionButton({
  icon,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  onPress?: () => void;
}) {
  return (
    <Pressable className="bg-red-50 p-1.5 rounded" onPress={onPress}>
      <Ionicons name={icon} size={14} color="#EC1A52" />
    </Pressable>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export default function SalesHistoryScreen() {
  const { orders, isLoading, refresh, count } = useSaleOrders();
  const { count: parkedCount } = useParkedOrders();
  
  // Modal States
  const [showOrderDetails, setShowOrderDetails] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [showStats, setShowStats] = useState(true);

  // Transform order details
  const convertToOrderDetails = (order: SaleOrderView) => {
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
      items: [],
      payments: [],
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

  const handlePrintOrder = (order: SaleOrderView) => {
    Alert.alert("Print", `Printing invoice for order ${order.orderNo || order.id.slice(0, 8)}...`);
  };

  // Column config
  const columns: ColumnDefinition<SaleOrderView>[] = [
    {
      key: "orderNo",
      title: "Order Number",
      width: "flex",
      visible: true,
      hideable: false,
      render: (item) => (
        <Text className="text-blue-600 text-xs font-medium" numberOfLines={1}>
          {item.orderNo || item.id.slice(0, 8)}
        </Text>
      ),
    },
    {
      key: "orderDate",
      title: "Date / Time",
      width: "flex",
      visible: true,
      render: (item) => (
        <Text className="text-gray-600 text-xs">
          {item.orderDate ? new Date(item.orderDate).toLocaleString() : "-"}
        </Text>
      ),
    },
    {
      key: "customerName",
      title: "Customer Name",
      width: "flex",
      visible: true,
      render: (item) => (
        <Text className="text-blue-600 text-xs" numberOfLines={1}>
          {item.businessName || item.customerName || "Guest"}
        </Text>
      ),
    },
    {
      key: "createdBy",
      title: "Created By",
      width: 100,
      visible: true,
      render: (item) => (
        <Text className="text-gray-600 text-xs">
          {item.createdByName || 'Unknown'}
        </Text>
      ),
    },
    {
      key: "total",
      title: "Total",
      width: 100,
      visible: true,
      render: (item) => (
        <Text className="text-red-600 text-xs font-bold">
          ${(item.totalPrice || 0).toFixed(2)}
        </Text>
      ),
    },
    {
      key: "invoiceStatus",
      title: "Invoice Status",
      width: 100,
      visible: true,
      render: (item) => <InvoiceStatusBadge status={item.fulfilmentStatus} />,
    },
    {
      key: "status",
      title: "Status",
      width: 100,
      visible: true,
      render: (item) => <OrderStatusBadge status={item.status} />,
    },
    {
      key: "actions",
      title: "Actions",
      width: 80,
      align: "center",
      visible: true,
      render: (item) => (
        <View className="flex-row items-center gap-2">
          <ActionButton
            icon="print-outline"
            onPress={() => handlePrintOrder(item)}
          />
          <ActionButton
            icon="eye-outline"
            onPress={() => handleViewOrder(item)}
          />
        </View>
      ),
    },
  ];

  // Filters
  const filters: FilterDefinition[] = [
    {
      key: "status",
      placeholder: "Order Status",
      width: 140,
      options: [
        { label: "All", value: "all" },
        { label: "Pending", value: "1" },
        { label: "Confirmed", value: "2" },
        { label: "Processing", value: "3" },
        { label: "Completed", value: "4" },
        { label: "Cancelled", value: "5" },
      ],
    },
    {
      key: "invoiceStatus",
      placeholder: "Invoice Status",
      width: 140,
      options: [
        { label: "All", value: "all" },
        { label: "Paid", value: "2" },
        { label: "Partial", value: "1" },
        { label: "Unpaid", value: "0" },
      ],
    },
  ];

  // Sort options
  const sortOptions = [
    { label: "Date (Newest)", value: "date_desc" },
    { label: "Date (Oldest)", value: "date_asc" },
    { label: "Total (High-Low)", value: "total_desc" },
    { label: "Total (Low-High)", value: "total_asc" },
  ];

  // Search logic
  const handleSearch = (item: SaleOrderView, query: string) => {
    const q = query.toLowerCase();
    return (
      (item.customerName?.toLowerCase().includes(q) || false) ||
      (item.businessName?.toLowerCase().includes(q) || false) ||
      (item.orderNo?.toLowerCase().includes(q) || false) ||
      item.id.toLowerCase().includes(q)
    );
  };

  // Filter logic
  const handleFilter = (
    item: SaleOrderView,
    filters: Record<string, string | null>
  ) => {
    if (filters.status && filters.status !== "all") {
      if (String(item.status) !== filters.status) return false;
    }
    if (filters.invoiceStatus && filters.invoiceStatus !== "all") {
      if (String(item.fulfilmentStatus) !== filters.invoiceStatus) return false;
    }
    return true;
  };

  // Sort logic
  const handleSort = (data: SaleOrderView[], sortBy: string | null) => {
    if (!sortBy) return data;
    const sorted = [...data];
    switch (sortBy) {
      case "date_desc":
        return sorted.sort((a, b) => 
          new Date(b.orderDate || 0).getTime() - new Date(a.orderDate || 0).getTime()
        );
      case "date_asc":
        return sorted.sort((a, b) => 
          new Date(a.orderDate || 0).getTime() - new Date(b.orderDate || 0).getTime()
        );
      case "total_desc":
        return sorted.sort((a, b) => (b.totalPrice || 0) - (a.totalPrice || 0));
      case "total_asc":
        return sorted.sort((a, b) => (a.totalPrice || 0) - (b.totalPrice || 0));
      default:
        return sorted;
    }
  };

  return (
    <View className="flex-1 bg-gray-50">
      <PageHeader title="Sales History" />

      {/* Stats Section */}
      {showStats && (
        <View className="px-4 py-3 bg-white border-b border-gray-200">
          <View className="flex-row gap-3 mb-3">
            <StatCardHorizontal title="Completed" count={450} color="#3B82F6" />
            <StatCardHorizontal title="Delivery" count={321} color="#14B8A6" />
            <StatCardHorizontal title="Parked" count={parkedCount} color="#8B5CF6" />
          </View>
          <View className="flex-row gap-3">
            <StatCardHorizontal title="Unpaid" count={450} color="#EC1A52" />
            <StatCardHorizontal title="Returned" count={321} color="#22C55E" />
            <StatCardHorizontal title="In Progress" count={23} color="#F59E0B" />
          </View>
        </View>
      )}

      <DataTable<SaleOrderView>
        data={orders}
        columns={columns}
        keyExtractor={(item) => item.id}
        searchable
        searchPlaceholder="Search orders..."
        searchHint="Search by Order Number, Customer Name"
        onSearch={handleSearch}
        filters={filters}
        onFilter={handleFilter}
        sortOptions={sortOptions}
        onSort={handleSort}
        columnSelector
        addButton
        addButtonText="Add Order"
        onAddPress={() => router.push("/order/add-products" as any)}
        isLoading={isLoading}
        onRefresh={refresh}
        emptyIcon="receipt-outline"
        emptyText="No orders found"
        totalCount={count}
      />

      {/* Order Details Modal */}
      <OrderDetailsModal
        visible={showOrderDetails}
        onClose={() => setShowOrderDetails(false)}
        order={selectedOrder}
      />
    </View>
  );
}
