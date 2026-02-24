/**
 * Sales History Screen
 * 
 * Displays order history with real-time sync from PowerSync.
 * Uses the unified DataTable component.
 */

import { buttonSize, colors, iconSize } from '@/utils/theme';
import { Ionicons } from "@expo/vector-icons";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Alert, Pressable, Text, View } from "react-native";
import { useBulkEditContext } from "../../contexts/BulkEditContext";
import { ACTION_COL_WIDTH, ColumnDefinition, DataTable, FilterDefinition, PageHeader } from "../../components";
import { OrderDetailsModal } from "../../components/OrderDetailsModal";
import { useTableContentWidth } from "../../hooks/useTableContentWidth";
import { SaleOrderView, useParkedOrders, useSaleOrders } from "../../utils/powersync/hooks";

// ============================================================================
// Constants
// ============================================================================

const STATUS_COLORS: Record<number, { bg: string; text: string }> = {
  1: { bg: "#FF9F43", text: "#FFFFFF" },  // Pending - Orange (matched from image)
  2: { bg: "#DBEAFE", text: "#1E40AF" },  // Confirmed - Blue
  3: { bg: "#FED7AA", text: "#9A3412" },  // Processing - Orange
  4: { bg: "#22C55E", text: "#FFFFFF" },  // Completed - Green
  5: { bg: "#FECACA", text: "#991B1B" },  // Cancelled - Red
  50: { bg: "#22C55E", text: "#FFFFFF" }, // Completed (legacy)
};

// ============================================================================
// Helper Components
// ============================================================================

const CompactStatCard = React.memo(({ title, count, color }: { title: string; count: number | string; color: string }) => {
  return (
    <View 
      className="flex-1 rounded-lg flex-row items-center justify-between px-4"
      style={{ 
        backgroundColor: color, 
        height: 60,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 2
      }}
    >
      <Text className="text-white font-semibold text-base">{title}</Text>
      <Text className="text-white font-bold text-xl">{count}</Text>
    </View>
  );
});

const OrderStatusBadge = React.memo(({ status }: { status: number }) => {
  const config = STATUS_COLORS[status] || STATUS_COLORS[1];
  
  const statusText = useMemo(() => {
    if (status === 50) return "Completed";
    switch (status) {
      case 1: return "Pending";
      case 2: return "Confirmed";
      case 3: return "Processing";
      case 4: return "Completed";
      case 5: return "Cancelled";
      default: return "Pending";
    }
  }, [status]);

  return (
    <View className="px-3 py-1 rounded-full self-start" style={{ backgroundColor: config.bg }}>
      <Text className="text-sm font-semibold" style={{ color: config.text }}>
        {statusText}
      </Text>
    </View>
  );
});

const InvoiceStatusBadge = React.memo(({ status }: { status: number }) => {
  let color: string = colors.primary;
  let text = "Unpaid";

  if (status === 2) {
    color = colors.success;
    text = "Paid";
  } else if (status === 1) {
    color = colors.warning;
    text = "Partial";
  }

  return (
    <View className="px-3 py-1 rounded-full self-start" style={{ backgroundColor: color }}>
      <Text className="text-white text-sm font-semibold">{text}</Text>
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

export default function SalesHistoryScreen() {
  const { orders, isLoading, refresh, count } = useSaleOrders();
  const { count: parkedCount } = useParkedOrders();
  
  // Modal States
  const [showOrderDetails, setShowOrderDetails] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [showStats, setShowStats] = useState(true);

  // Transform order details
  const convertToOrderDetails = useCallback((order: SaleOrderView) => {
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
  }, []);

  const handleViewOrder = useCallback((order: SaleOrderView) => {
    const converted = convertToOrderDetails(order);
    setSelectedOrder(converted);
    setShowOrderDetails(true);
  }, [convertToOrderDetails]);

  const handlePrintOrder = useCallback((order: SaleOrderView) => {
    Alert.alert("Print", `Printing invoice for order ${order.orderNo || order.id.slice(0, 8)}...`);
  }, []);

  const contentWidth = useTableContentWidth();

  // Column config
  const columns = useMemo<ColumnDefinition<SaleOrderView>[]>(() => [
    {
      key: "orderNo",
      title: "Order Number",
      sortKey: "orderNo",
      width: "12%",
      visible: true,
      hideable: false,
      render: (item) => (
        <Pressable onPress={() => handleViewOrder(item)}>
          <Text className="text-[#2196F3] text-lg font-semibold" numberOfLines={1}>
            {item.orderNo || item.id.slice(0, 8)}
          </Text>
        </Pressable>
      ),
    },
    {
      key: "orderDate",
      title: "Date / Time",
      sortKey: "orderDate",
      width: 250,
      visible: true,
      render: (item) => (
        <Text className="text-[#1A1A1A] text-base" numberOfLines={1}>
          {(item.orderDateFormatted || "-").replace(/\s+/g, " ").trim()}
        </Text>
      ),
    },
    {
      key: "customerName",
      title: "Customer Name",
      sortKey: "customerName",
      width: "25%",
      visible: true,
      render: (item) => (
        <Text className="text-blue-600 text-base" numberOfLines={1}>
          {item.businessName || item.customerName || "Guest Customer"}
        </Text>
      ),
    },
    {
      key: "createdBy",
      title: "Created By",
      width: "10%",
      visible: true,
      render: (item) => (
        <Text className="text-[#1A1A1A] text-base">
          {item.createdByName || 'User 1'}
        </Text>
      ),
    },
    {
      key: "total",
      title: "Total",
      sortKey: "total",
      width: "10%",
      visible: true,
      render: (item) => (
        <Text className="text-[#EC1A52] text-lg font-bold">
          ${(item.totalPrice || 0).toFixed(2)}
        </Text>
      ),
    },
    {
      key: "invoiceStatus",
      title: "Invoice Status",
      width: "10%",
      visible: true,
      render: (item) => <InvoiceStatusBadge status={item.fulfilmentStatus || 0} />,
    },
    {
      key: "status",
      title: "Status",
      width: "10%",
      visible: true,
      render: (item) => <OrderStatusBadge status={item.status || 1} />,
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
            onPress={() => handlePrintOrder(item)}
          />
          <ActionButton
            icon="eye-outline"
            onPress={() => handleViewOrder(item)}
          />
        </View>
      ),
    },
  ], [handlePrintOrder, handleViewOrder]);

  // Filters
  const filters = useMemo<FilterDefinition[]>(() => [
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
        { label: "Completed (legacy)", value: "50" },
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
  ], []);

  // Sort options
  const sortOptions = useMemo(() => [
    { label: "Date (Newest)", value: "date_desc" },
    { label: "Date (Oldest)", value: "date_asc" },
    { label: "Total (High-Low)", value: "total_desc" },
    { label: "Total (Low-High)", value: "total_asc" },
  ], []);

  const { setConfig: setBulkEditConfig, setSelection: setBulkEditSelection } = useBulkEditContext();

  const handleBulkAction = useCallback((rows: SaleOrderView[]) => {
    if (rows.length === 0) {
      Alert.alert("Edit Order", "Please select order(s) first.");
      return;
    }
    Alert.alert("Edit Order", `${rows.length} order(s) selected. Edit order is coming soon.`);
  }, []);

  useEffect(() => {
    setBulkEditConfig({ label: "Edit Order", onPress: handleBulkAction });
    return () => setBulkEditConfig(null);
  }, [handleBulkAction, setBulkEditConfig]);

  // Search logic
  const handleSearch = useCallback((item: SaleOrderView, query: string) => {
    const q = query.toLowerCase();
    return (
      (item.customerName?.toLowerCase().includes(q) || false) ||
      (item.businessName?.toLowerCase().includes(q) || false) ||
      (item.orderNo?.toLowerCase().includes(q) || false) ||
      item.id.toLowerCase().includes(q)
    );
  }, []);

  // Filter logic
  const handleFilter = useCallback((
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
  }, []);

  // Sort logic
  const handleSort = useCallback((data: SaleOrderView[], sortBy: string | null, sortOrder?: "asc" | "desc") => {
    if (!sortBy) return data;
    const sorted = [...data];
    const asc = sortOrder === "asc";
    
    // Cache dates to avoid repeated new Date() calls during sort
    const dateCache = new Map<string, number>();
    const getCachedTime = (orderDate: string | null, createdAt?: string | null) => {
      const dateValue = createdAt || orderDate;
      if (!dateValue) return 0;
      if (dateCache.has(dateValue)) return dateCache.get(dateValue)!;
      const time = new Date(dateValue).getTime();
      dateCache.set(dateValue, time);
      return time;
    };

    switch (sortBy) {
      case "date_desc":
        return sorted.sort((a, b) => getCachedTime(b.orderDate, b.createdAt) - getCachedTime(a.orderDate, a.createdAt));
      case "date_asc":
        return sorted.sort((a, b) => getCachedTime(a.orderDate, a.createdAt) - getCachedTime(b.orderDate, b.createdAt));
      case "total_desc":
        return sorted.sort((a, b) => (b.totalPrice || 0) - (a.totalPrice || 0));
      case "total_asc":
        return sorted.sort((a, b) => (a.totalPrice || 0) - (b.totalPrice || 0));
      case "orderDate":
        return sorted.sort((a, b) => asc
          ? getCachedTime(a.orderDate, a.createdAt) - getCachedTime(b.orderDate, b.createdAt)
          : getCachedTime(b.orderDate, b.createdAt) - getCachedTime(a.orderDate, a.createdAt));
      case "orderNo":
        return sorted.sort((a, b) => {
          const na = a.orderNo || a.id;
          const nb = b.orderNo || b.id;
          return asc ? na.localeCompare(nb) : nb.localeCompare(na);
        });
      case "customerName":
        return sorted.sort((a, b) => {
          const na = (a.businessName || a.customerName || "").toLowerCase();
          const nb = (b.businessName || b.customerName || "").toLowerCase();
          return asc ? na.localeCompare(nb) : nb.localeCompare(na);
        });
      case "total":
        return sorted.sort((a, b) => {
          const ta = a.totalPrice || 0;
          const tb = b.totalPrice || 0;
          return asc ? ta - tb : tb - ta;
        });
      default:
        return sorted;
    }
  }, []);

  return (
    <View className="flex-1 bg-[#F7F7F9]">
      <PageHeader title="Sales History" showBack={false} />

      {/* Stats Section Replica */}
      {showStats && (
        <View className="px-5 py-4 bg-[#F7F7F9] border-b border-gray-200">
          <View className="flex-row gap-4 mb-4">
            <CompactStatCard title="Completed Orders" count={450} color="#2196F3" />
            <CompactStatCard title="Delivery Orders" count={321} color="#00BCD4" />
            <CompactStatCard title="Parked Orders" count={parkedCount} color="#673AB7" />
          </View>
          <View className="flex-row gap-4">
            <CompactStatCard title="Unpaid Orders" count={450} color="#FF5252" />
            <CompactStatCard title="Returned Orders" count={321} color="#4CAF50" />
            <CompactStatCard title="Orders In Progress" count={23} color="#FF9800" />
          </View>
        </View>
      )}

      <DataTable<SaleOrderView>
        data={orders}
        columns={columns}
        keyExtractor={(item) => item.id}
        searchable
        searchPlaceholder="Search Sales History"
        searchHint="Search by Customer Name, Order No"
        searchBoxFlex={0.3}
        onSearch={handleSearch}
        filters={filters}
        onFilter={handleFilter}
        sortOptions={sortOptions}
        onSort={handleSort}
        filtersInSettingsModal
        bulkActions
        bulkActionText="Edit Order"
        bulkActionInActionRow
        bulkActionInSidebar
        onBulkActionPress={handleBulkAction}
        onSelectionChange={(_, rows) => setBulkEditSelection(rows)}
        isLoading={isLoading}
        onRefresh={refresh}
        toolbarButtonStyle="shopping-cart"
        columnSelector
        horizontalScroll
        minWidth={contentWidth}
        emptyIcon="receipt-outline"
        emptyText="No orders found"
        totalCount={count}
      />

      {/* Order Details Modal - opened when clicking Order Number or eye icon */}
      <OrderDetailsModal
        visible={showOrderDetails}
        onClose={() => {
          setShowOrderDetails(false);
          setSelectedOrder(null);
        }}
        order={selectedOrder}
      />
    </View>
  );
}
