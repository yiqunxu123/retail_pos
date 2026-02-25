/**
 * Sales & Payments History Screen (Unified)
 *
 * Tabs: Sales History | Payments Logs | Payment by Invoice
 * Merges order history and payment history with a tab navbar.
 */

import { buttonSize, colors, iconSize } from "@/utils/theme";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams } from "expo-router";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Alert, Modal, Pressable, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { useBulkEditContext } from "../../contexts/BulkEditContext";
import {
  ACTION_COL_WIDTH,
  ColumnDefinition,
  DataTable,
  FilterDefinition,
  PageHeader,
} from "../../components";
import { OrderDetailsModal } from "../../components/OrderDetailsModal";
import { SaleInvoiceModal } from "../../components/SaleInvoiceModal";
import { getSaleOrderById } from "../../utils/api/orders";
import type { SaleOrderEntity } from "../../utils/api/orders";
import { useTableContentWidth } from "../../hooks/useTableContentWidth";
import {
  PAYMENT_STATUS,
  PAYMENT_TYPE,
  PaymentView,
  SaleOrderView,
  useParkedOrders,
  usePayments,
  usePaymentsWithInvoice,
  useSaleOrders,
} from "../../utils/powersync/hooks";

// ============================================================================
// Constants
// ============================================================================

const TABS = ["Sales History", "Payments Logs", "Payment by Invoice"] as const;
type TabKey = (typeof TABS)[number];

const ORDER_STATUS_COLORS: Record<number, { bg: string; text: string }> = {
  1: { bg: "#FF9F43", text: "#FFFFFF" },
  2: { bg: "#DBEAFE", text: "#1E40AF" },
  3: { bg: "#FED7AA", text: "#9A3412" },
  4: { bg: "#22C55E", text: "#FFFFFF" },
  5: { bg: "#FECACA", text: "#991B1B" },
  50: { bg: "#22C55E", text: "#FFFFFF" },
};

function formatCurrency(value: number): string {
  return `$${value.toFixed(2)}`;
}

function formatDate(dateStr: string): string {
  if (!dateStr) return "-";
  try {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "2-digit",
      day: "2-digit",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
}

function getPaymentStatusColor(status: number): { bg: string; text: string } {
  const map: Record<number, { bg: string; text: string }> = {
    0: { bg: "bg-yellow-100", text: "text-yellow-700" },
    1: { bg: "bg-green-100", text: "text-green-700" },
    2: { bg: "bg-red-100", text: "text-red-700" },
    3: { bg: "bg-purple-100", text: "text-purple-700" },
  };
  return map[status] || { bg: "bg-gray-100", text: "text-gray-600" };
}

// ============================================================================
// Helper Components
// ============================================================================

const OrderStatusBadge = React.memo(({ status }: { status: number }) => {
  const config = ORDER_STATUS_COLORS[status] || ORDER_STATUS_COLORS[1];
  const statusText =
    status === 50
      ? "Completed"
      : { 1: "Pending", 2: "Confirmed", 3: "Processing", 4: "Completed", 5: "Cancelled" }[status] || "Pending";
  return (
    <View className="px-3 py-1 rounded-full self-start" style={{ backgroundColor: config.bg }}>
      <Text className="text-sm font-semibold" style={{ color: config.text }}>
        {statusText}
      </Text>
    </View>
  );
});

const InvoiceStatusBadge = React.memo(({ status }: { status: number }) => {
  const color = status === 2 ? colors.success : status === 1 ? colors.warning : colors.primary;
  const text = status === 2 ? "Paid" : status === 1 ? "Partial" : "Unpaid";
  return (
    <View className="px-3 py-1 rounded-full self-start" style={{ backgroundColor: color }}>
      <Text className="text-white text-sm font-semibold">{text}</Text>
    </View>
  );
});

const ActionButton = React.memo(
  ({ icon, onPress }: { icon: keyof typeof Ionicons.glyphMap; onPress?: () => void }) => (
    <Pressable
      className="rounded-lg items-center justify-center"
      style={{
        width: buttonSize.md.height,
        height: buttonSize.md.height,
        backgroundColor: colors.primaryLight,
        borderRadius: buttonSize.md.borderRadius,
      }}
      onPress={onPress}
    >
      <Ionicons name={icon} size={iconSize.md} color={colors.primary} />
    </Pressable>
  )
);

/** Grouped view for Payment by Invoice tab */
type InvoicePaymentGroup = {
  invoiceId: number | null;
  invoiceNo: string;
  orderNo: string;
  saleOrderId: number | null;
  customerName: string;
  totalAmount: number;
  payments: PaymentView[];
  paymentCount: number;
};

// ============================================================================
// Main Component
// ============================================================================

export default function SalesAndPaymentsHistoryScreen() {
  const params = useLocalSearchParams<{ tab?: string }>();
  const contentWidth = useTableContentWidth();
  const [activeTab, setActiveTab] = useState<TabKey>("Sales History");

  useEffect(() => {
    const t = params.tab;
    if (t === "payments" || t === "Payments Logs") setActiveTab("Payments Logs");
    else if (t === "invoice" || t === "Payment by Invoice") setActiveTab("Payment by Invoice");
  }, [params.tab]);

  // Sales History
  const { orders, isLoading: ordersLoading, refresh: refreshOrders, count } = useSaleOrders();
  const { count: parkedCount } = useParkedOrders();
  const [showOrderDetails, setShowOrderDetails] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [invoiceOrder, setInvoiceOrder] = useState<SaleOrderEntity | null>(null);
  const [invoiceLoading, setInvoiceLoading] = useState(false);

  const router = useRouter();

  // Payments
  const { payments, isLoading: paymentsLoading, isStreaming: paymentsStreaming, refresh: refreshPayments } = usePayments();
  const { paymentsByInvoice, refresh: refreshByInvoice } = usePaymentsWithInvoice();

  const convertToOrderDetails = useCallback((order: SaleOrderView) => {
    const getDisplayStatus = (s: number) =>
      s === 50 ? "Completed" : { 1: "Pending", 2: "Confirmed", 3: "Processing", 4: "Completed", 5: "Cancelled" }[s] || "Pending";
    const getOrderTypeLabel = (t: number) => (t === 1 ? "Online" : "Walk In");
    const getShippingTypeLabel = (t: number) => (t === 1 ? "Delivery" : t === 2 ? "Shipping" : "Pickup");
    const getInvoiceStatus = (f: number): "Paid" | "Unpaid" | "Partial" =>
      f === 2 ? "Paid" : f === 1 ? "Partial" : "Unpaid";
    return {
      id: order.id,
      orderNumber: order.orderNo || `ORD-${order.id.slice(0, 8)}`,
      date: order.orderDate || new Date().toISOString(),
      status: getDisplayStatus(order.status),
      orderType: getOrderTypeLabel(order.orderType),
      shippingType: getShippingTypeLabel(order.shippingType),
      channelName: "Primary",
      invoiceStatus: getInvoiceStatus(order.fulfilmentStatus),
      customer: { name: order.businessName || order.customerName || "Guest Customer" },
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

  const handleViewOrder = useCallback(
    (order: SaleOrderView) => {
      setSelectedOrder(convertToOrderDetails(order));
      setShowOrderDetails(true);
    },
    [convertToOrderDetails]
  );

  const handlePrintOrder = useCallback((order: SaleOrderView) => {
    Alert.alert("Print", `Printing invoice for order ${order.orderNo || order.id.slice(0, 8)}...`);
  }, []);

  const handleViewInvoice = useCallback(async (row: SaleOrderView) => {
    const orderId = typeof row.id === "string" ? parseInt(row.id, 10) : row.id;
    if (Number.isNaN(orderId)) {
      Alert.alert("Error", "Invalid order ID");
      return;
    }
    setInvoiceLoading(true);
    setShowInvoiceModal(true);
    setInvoiceOrder(null);
    try {
      const res = await getSaleOrderById(orderId);
      setInvoiceOrder(res.data.entity);
    } catch (e: any) {
      Alert.alert("Error", e?.message || "Failed to load invoice");
      setShowInvoiceModal(false);
    } finally {
      setInvoiceLoading(false);
    }
  }, []);

  const handleViewInvoiceByOrderId = useCallback(
    async (saleOrderId: number | null) => {
      if (saleOrderId == null) {
        Alert.alert("Info", "No order linked to this invoice");
        return;
      }
      setInvoiceLoading(true);
      setShowInvoiceModal(true);
      setInvoiceOrder(null);
      try {
        const res = await getSaleOrderById(saleOrderId);
        setInvoiceOrder(res.data.entity);
      } catch (e: any) {
        Alert.alert("Error", e?.message || "Failed to load invoice");
        setShowInvoiceModal(false);
      } finally {
        setInvoiceLoading(false);
      }
    },
    []
  );

  // Order columns
  const orderColumns = useMemo<ColumnDefinition<SaleOrderView>[]>(
    () => [
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
        render: (item) => <Text className="text-[#1A1A1A] text-base">{item.createdByName || "User 1"}</Text>,
      },
      {
        key: "total",
        title: "Total",
        sortKey: "total",
        width: "10%",
        visible: true,
        render: (item) => (
          <Text className="text-[#EC1A52] text-lg font-bold">${(item.totalPrice || 0).toFixed(2)}</Text>
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
            <ActionButton icon="print-outline" onPress={() => handlePrintOrder(item)} />
            <ActionButton icon="eye-outline" onPress={() => handleViewOrder(item)} />
          </View>
        ),
      },
    ],
    [handleViewOrder, handlePrintOrder]
  );

  const orderFilters = useMemo<FilterDefinition[]>(
    () => [
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
    ],
    []
  );

  // Payment columns
  const paymentColumns = useMemo<ColumnDefinition<PaymentView>[]>(
    () => [
      {
        key: "paymentNo",
        title: "Payment No",
        width: "14%",
        visible: true,
        hideable: false,
        render: (item) => <Text className="text-blue-600 font-medium text-lg">{item.paymentNo || "-"}</Text>,
      },
      {
        key: "businessName",
        title: "Business / Customer",
        width: "22%",
        visible: true,
        render: (item) => (
          <View>
            <Text className="text-blue-600 text-lg font-bold" numberOfLines={1}>
              {item.businessName || "-"}
            </Text>
            <Text className="text-blue-600 text-base" numberOfLines={1}>
              {item.customerName || "-"}
            </Text>
          </View>
        ),
      },
      {
        key: "paymentType",
        title: "Type",
        width: "11%",
        visible: true,
        render: (item) => (
          <Text className="text-[#1A1A1A] text-lg">
            {PAYMENT_TYPE[item.paymentType as keyof typeof PAYMENT_TYPE] || "Unknown"}
          </Text>
        ),
      },
      {
        key: "amount",
        title: "Amount",
        width: "10%",
        align: "center",
        visible: true,
        render: (item) => <Text className="text-[#1A1A1A] text-lg font-bold">{formatCurrency(item.amount)}</Text>,
      },
      {
        key: "status",
        title: "Status",
        width: "11%",
        align: "center",
        visible: true,
        render: (item) => {
          const sc = getPaymentStatusColor(item.status);
          const st = PAYMENT_STATUS[item.status as keyof typeof PAYMENT_STATUS] || "Unknown";
          return (
            <View className={`px-3 py-1 rounded ${sc.bg}`}>
              <Text className={`text-sm font-bold ${sc.text}`}>{st}</Text>
            </View>
          );
        },
      },
      {
        key: "paymentDate",
        title: "Date",
        width: "11%",
        align: "center",
        visible: true,
        render: (item) => <Text className="text-gray-600 text-lg">{formatDate(item.paymentDate)}</Text>,
      },
      {
        key: "memo",
        title: "Memo",
        width: "15%",
        visible: true,
        render: (item) => <Text className="text-gray-500 text-sm" numberOfLines={1}>{item.memo || "-"}</Text>,
      },
      {
        key: "actions",
        title: "Actions",
        width: ACTION_COL_WIDTH,
        align: "center",
        visible: true,
        render: (item) => (
          <Pressable
            onPress={() =>
              Alert.alert(
                "Payment Details",
                `Payment No: ${item.paymentNo || "-"}\nAmount: ${formatCurrency(item.amount)}\nDate: ${formatDate(item.paymentDate)}\nStatus: ${PAYMENT_STATUS[item.status as keyof typeof PAYMENT_STATUS] || "Unknown"}`
              )
            }
            className="rounded-lg items-center justify-center"
            style={{
              width: buttonSize.md.height,
              height: buttonSize.md.height,
              backgroundColor: colors.primaryLight,
              borderRadius: buttonSize.md.borderRadius,
            }}
          >
            <Ionicons name="eye" size={iconSize.md} color={colors.primary} />
          </Pressable>
        ),
      },
    ],
    []
  );

  const paymentFilters: FilterDefinition[] = [
    {
      key: "status",
      placeholder: "Status",
      width: 130,
      options: [
        { label: "All", value: "all" },
        { label: "Pending", value: "0" },
        { label: "Completed", value: "1" },
        { label: "Failed", value: "2" },
        { label: "Refunded", value: "3" },
      ],
    },
    {
      key: "type",
      placeholder: "Type",
      width: 140,
      options: [
        { label: "All", value: "all" },
        { label: "Cash", value: "0" },
        { label: "Check", value: "1" },
        { label: "Credit Card", value: "2" },
        { label: "Bank Transfer", value: "3" },
      ],
    },
  ];

  const invoiceGroupColumns = useMemo<ColumnDefinition<InvoicePaymentGroup>[]>(
    () => [
      {
        key: "invoiceNo",
        title: "Invoice No",
        width: "14%",
        visible: true,
        hideable: false,
        render: (item) => <Text className="text-blue-600 font-medium text-lg">{item.invoiceNo || "-"}</Text>,
      },
      {
        key: "orderNo",
        title: "Order No",
        width: "14%",
        visible: true,
        render: (item) => <Text className="text-blue-600 font-medium text-lg">{item.orderNo || "-"}</Text>,
      },
      {
        key: "customerName",
        title: "Customer",
        width: "22%",
        visible: true,
        render: (item) => (
          <Text className="text-[#1A1A1A] text-lg" numberOfLines={1}>
            {item.customerName || "-"}
          </Text>
        ),
      },
      {
        key: "totalAmount",
        title: "Total Amount",
        width: "12%",
        align: "center",
        visible: true,
        render: (item) => (
          <Text className="text-[#1A1A1A] text-lg font-bold">{formatCurrency(item.totalAmount)}</Text>
        ),
      },
      {
        key: "paymentCount",
        title: "# Payments",
        width: "10%",
        align: "center",
        visible: true,
        render: (item) => <Text className="text-gray-600 text-lg">{item.paymentCount}</Text>,
      },
      {
        key: "actions",
        title: "Actions",
        width: ACTION_COL_WIDTH,
        align: "center",
        visible: true,
        render: (item) => (
          <Pressable
            onPress={() => handleViewInvoiceByOrderId(item.saleOrderId)}
            className="rounded-lg items-center justify-center"
            style={{
              width: buttonSize.md.height,
              height: buttonSize.md.height,
              backgroundColor: colors.primaryLight,
              borderRadius: buttonSize.md.borderRadius,
            }}
          >
            <Ionicons name="eye" size={iconSize.md} color={colors.primary} />
          </Pressable>
        ),
      },
    ],
    [handleViewInvoiceByOrderId]
  );

  const handleOrderSearch = useCallback((item: SaleOrderView, query: string) => {
    const q = query.toLowerCase();
    return (
      (item.customerName?.toLowerCase().includes(q) || false) ||
      (item.businessName?.toLowerCase().includes(q) || false) ||
      (item.orderNo?.toLowerCase().includes(q) || false) ||
      item.id.toLowerCase().includes(q)
    );
  }, []);

  const handleOrderFilter = useCallback((item: SaleOrderView, f: Record<string, string | null>) => {
    if (f.status && f.status !== "all" && String(item.status) !== f.status) return false;
    if (f.invoiceStatus && f.invoiceStatus !== "all" && String(item.fulfilmentStatus) !== f.invoiceStatus)
      return false;
    return true;
  }, []);

  const handlePaymentSearch = useCallback((item: PaymentView, query: string) => {
    const q = query.toLowerCase();
    return (
      item.businessName.toLowerCase().includes(q) ||
      item.customerName.toLowerCase().includes(q) ||
      item.paymentNo.toLowerCase().includes(q)
    );
  }, []);

  const handlePaymentFilter = useCallback((item: PaymentView, f: Record<string, string | null>) => {
    if (f.status && f.status !== "all" && item.status !== parseInt(f.status)) return false;
    if (f.type && f.type !== "all" && item.paymentType !== parseInt(f.type)) return false;
    return true;
  }, []);

  const handleInvoiceGroupSearch = useCallback((item: InvoicePaymentGroup, query: string) => {
    const q = query.toLowerCase();
    return (
      (item.invoiceNo?.toLowerCase().includes(q) ?? false) ||
      (item.orderNo?.toLowerCase().includes(q) ?? false) ||
      (item.customerName?.toLowerCase().includes(q) ?? false)
    );
  }, []);

  const sortOptions = useMemo(
    () => [
      { label: "Date (Newest)", value: "date_desc" },
      { label: "Date (Oldest)", value: "date_asc" },
      { label: "Total (High-Low)", value: "total_desc" },
      { label: "Total (Low-High)", value: "total_asc" },
    ],
    []
  );

  const handleSort = useCallback((data: SaleOrderView[], sortBy: string | null, sortOrder?: "asc" | "desc") => {
    if (!sortBy) return data;
    const sorted = [...data];
    const asc = sortOrder === "asc";
    const getTime = (o: SaleOrderView) =>
      new Date(o.createdAt || o.orderDate || "").getTime();
    switch (sortBy) {
      case "date_desc":
        return sorted.sort((a, b) => getTime(b) - getTime(a));
      case "date_asc":
        return sorted.sort((a, b) => getTime(a) - getTime(b));
      case "total_desc":
        return sorted.sort((a, b) => (b.totalPrice || 0) - (a.totalPrice || 0));
      case "total_asc":
        return sorted.sort((a, b) => (a.totalPrice || 0) - (b.totalPrice || 0));
      default:
        return sorted;
    }
  }, []);

  const { setConfig: setBulkEditConfig, setSelection: setBulkEditSelection } = useBulkEditContext();

  const handleOrderBulkAction = useCallback((rows: SaleOrderView[]) => {
    if (rows.length === 0) {
      Alert.alert("Edit Order", "Please select order(s) first.");
      return;
    }
    Alert.alert("Edit Order", `${rows.length} order(s) selected. Edit order is coming soon.`);
  }, []);

  const handlePaymentBulkAction = useCallback((rows: PaymentView[]) => {
    if (rows.length === 0) {
      Alert.alert("Bulk Export", "Please select payment(s) first.");
      return;
    }
    Alert.alert("Bulk Export", `${rows.length} payment(s) selected. Export is coming soon.`);
  }, []);

  useEffect(() => {
    if (activeTab === "Sales History") {
      setBulkEditConfig({
        label: "Edit Order",
        onPress: handleOrderBulkAction,
        viewSingleItem: handleViewInvoice,
      });
    } else {
      setBulkEditConfig({ label: "Bulk Export", onPress: handlePaymentBulkAction });
    }
    return () => setBulkEditConfig(null);
  }, [activeTab, handleOrderBulkAction, handlePaymentBulkAction, handleViewInvoice, setBulkEditConfig]);

  const effectiveRefresh =
    activeTab === "Payment by Invoice" ? refreshByInvoice : activeTab === "Payments Logs" ? refreshPayments : refreshOrders;

  const isLoading = activeTab === "Sales History" ? ordersLoading : paymentsLoading;
  const isStreaming = activeTab === "Payments Logs" ? paymentsStreaming : false;

  return (
    <View className="flex-1 bg-[#F7F7F9]">
      <PageHeader title="Sales & Payments History" showBack={false} />

      {/* Tab Navbar */}
      <View className="bg-[#F7F7F9] flex-row border-b border-gray-200">
        {TABS.map((tab) => (
          <Pressable
            key={tab}
            onPress={() => setActiveTab(tab)}
            className={`px-6 py-3 ${activeTab === tab ? "border-b-2 border-[#EC1A52]" : ""}`}
          >
            <Text
              className={`font-medium ${activeTab === tab ? "text-[#EC1A52]" : "text-gray-600"}`}
            >
              {tab}
            </Text>
          </Pressable>
        ))}
      </View>

      {activeTab === "Sales History" && (
        <DataTable<SaleOrderView>
          data={orders}
          columns={orderColumns}
          keyExtractor={(item) => item.id}
          searchable
          searchPlaceholder="Search Sales History"
          searchHint="Search by Customer Name, Order No"
          searchBoxFlex={0.3}
          onSearch={handleOrderSearch}
          filters={orderFilters}
          onFilter={handleOrderFilter}
          sortOptions={sortOptions}
          onSort={handleSort}
          filtersInSettingsModal
          bulkActions
          bulkActionText="Edit Order"
          bulkActionInActionRow
          bulkActionInSidebar
          onBulkActionPress={handleOrderBulkAction}
          onSelectionChange={(_, rows) => setBulkEditSelection(rows)}
          isLoading={isLoading}
          onRefresh={effectiveRefresh}
          toolbarButtonStyle="shopping-cart"
          columnSelector
          horizontalScroll
          minWidth={contentWidth}
          emptyIcon="receipt-outline"
          emptyText="No orders found"
          totalCount={count}
        />
      )}

      {activeTab === "Payments Logs" && (
        <DataTable<PaymentView>
          data={payments}
          columns={paymentColumns}
          keyExtractor={(item) => item.id}
          searchable
          searchPlaceholder="Search payments..."
          searchHint="Search by Payment No, Business Name, Customer Name"
          onSearch={handlePaymentSearch}
          filters={paymentFilters}
          onFilter={handlePaymentFilter}
          filtersInSettingsModal
          bulkActions
          bulkActionText="Bulk Export"
          bulkActionInActionRow
          bulkActionInSidebar
          onBulkActionPress={handlePaymentBulkAction}
          onSelectionChange={(_, rows) => setBulkEditSelection(rows)}
          columnSelector
          toolbarButtonStyle="shopping-cart"
          onRefresh={effectiveRefresh}
          isLoading={isLoading}
          isStreaming={isStreaming}
          emptyIcon="card-outline"
          emptyText="No payments found"
          totalCount={payments.length}
          horizontalScroll
          minWidth={contentWidth}
        />
      )}

      {activeTab === "Payment by Invoice" && (
        <DataTable<InvoicePaymentGroup>
          data={paymentsByInvoice}
          columns={invoiceGroupColumns}
          keyExtractor={(item) => `${item.invoiceId ?? item.invoiceNo}-${item.orderNo}`}
          searchable
          searchPlaceholder="Search by Invoice No, Order No, Customer..."
          searchHint="Search invoices"
          onSearch={handleInvoiceGroupSearch}
          toolbarButtonStyle="shopping-cart"
          onRefresh={effectiveRefresh}
          isLoading={isLoading}
          emptyIcon="document-text-outline"
          emptyText="No invoices with payments found"
          totalCount={paymentsByInvoice.length}
          horizontalScroll
          minWidth={contentWidth}
        />
      )}

      <OrderDetailsModal
        visible={showOrderDetails}
        onClose={() => {
          setShowOrderDetails(false);
          setSelectedOrder(null);
        }}
        order={selectedOrder}
        saleOrderId={selectedOrder?.id ?? null}
      />

      {/* Invoice loading overlay */}
      <Modal visible={showInvoiceModal && invoiceLoading} transparent>
        <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "center", alignItems: "center" }}>
          <View style={{ backgroundColor: "#fff", padding: 24, borderRadius: 12, alignItems: "center" }}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={{ marginTop: 12, fontSize: 16, color: colors.text }}>Loading invoice...</Text>
          </View>
        </View>
      </Modal>

      <SaleInvoiceModal
        visible={showInvoiceModal && !invoiceLoading && !!invoiceOrder}
        onClose={() => {
          setShowInvoiceModal(false);
          setInvoiceOrder(null);
        }}
        onNewOrder={() => {
          setShowInvoiceModal(false);
          setInvoiceOrder(null);
          router.push("/order/add-products");
        }}
        order={invoiceOrder}
      />
    </View>
  );
}
