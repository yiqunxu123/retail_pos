/**
 * Sales Return Screen
 * Uses the unified DataTable component with PowerSync data
 * Sale returns are sale_orders with sale_type = 2
 */

import { buttonSize, colors, iconSize } from "@/utils/theme";
import { Ionicons } from "@expo/vector-icons";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Alert, Pressable, Text, View } from "react-native";
import { useBulkEditContext } from "../../contexts/BulkEditContext";
import { ACTION_COL_WIDTH, ColumnDefinition, DataTable, FilterDefinition, PageHeader } from "../../components";
import { OrderDetailsModal } from "../../components/OrderDetailsModal";
import { useTableContentWidth } from "../../hooks/useTableContentWidth";
import { SaleReturnView, useSaleReturns } from "../../utils/powersync/hooks";

// ============================================================================
// Helper Functions
// ============================================================================

function formatCurrency(value: number): string {
  const isNegative = value < 0;
  return `${isNegative ? "-" : ""}$${Math.abs(value).toFixed(2)}`;
}

function getReturnStatusLabel(status: number): "Complete" | "Pending" {
  return status === 50 ? "Complete" : "Pending";
}

// ============================================================================
// Main Component
// ============================================================================

export default function SalesReturnScreen() {
  const contentWidth = useTableContentWidth();
  const { returns, isLoading, refresh, count } = useSaleReturns();

  const [showOrderDetails, setShowOrderDetails] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);

  const convertToOrderDetails = useCallback((item: SaleReturnView) => {
    const getDisplayStatus = (status: number) => {
      if (status === 50) return "completed";
      return "pending";
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
      id: item.id,
      orderNumber: item.orderNo || `RE-${item.id.slice(0, 8)}`,
      date: item.orderDate || new Date().toISOString(),
      status: getDisplayStatus(item.status),
      orderType: getOrderTypeLabel(item.orderType),
      shippingType: getShippingTypeLabel(item.shippingType),
      channelName: item.channelName || "Primary",
      invoiceStatus: getInvoiceStatus(item.fulfilmentStatus ?? 0),
      customer: {
        name: item.businessName || item.customerName || "Guest Customer",
      },
      cashier: "Cashier 1",
      items: [],
      payments: [],
      subTotal: item.totalPrice || 0,
      discount: item.discount || 0,
      tax: item.tax || 0,
      total: item.totalPrice || 0,
      amountPaid: item.totalPrice || 0,
      createdBy: item.createdByName || "Staff",
    };
  }, []);

  const handleViewOrder = useCallback((item: SaleReturnView) => {
    const converted = convertToOrderDetails(item);
    setSelectedOrder(converted);
    setShowOrderDetails(true);
  }, [convertToOrderDetails]);

  const handlePrintOrder = useCallback((item: SaleReturnView) => {
    Alert.alert("Print", `Print return invoice for ${item.orderNo || item.id.slice(0, 8)}...`);
  }, []);

  const columns = useMemo<ColumnDefinition<SaleReturnView>[]>(
    () => [
      {
        key: "returnNumber",
        title: "Return Number",
        width: "12%",
        visible: true,
        hideable: false,
        render: (item) => (
          <Text className="text-blue-600 text-lg font-medium" numberOfLines={1}>
            {item.orderNo}
          </Text>
        ),
      },
      {
        key: "dateTime",
        title: "Date / Time",
        width: "12%",
        visible: true,
        render: (item) => <Text className="text-[#1A1A1A] text-lg">{item.orderDateFormatted || "-"}</Text>,
      },
      {
        key: "customerName",
        title: "Customer Name",
        width: "15%",
        visible: true,
        render: (item) => (
          <Text className="text-blue-600 text-lg" numberOfLines={1}>
            {item.businessName || item.customerName || "Guest"}
          </Text>
        ),
      },
      {
        key: "createdBy",
        title: "Created By",
        width: "8%",
        visible: true,
        render: (item) => <Text className="text-[#1A1A1A] text-lg">{item.createdByName}</Text>,
      },
      {
        key: "channelName",
        title: "Channel Name",
        width: "8%",
        visible: true,
        render: (item) => (
          <View className="bg-pink-100 px-3 py-1 rounded self-start">
            <Text className="text-pink-600 text-sm font-medium">{item.channelName}</Text>
          </View>
        ),
      },
      {
        key: "invoiceTotal",
        title: "Invoice Total",
        width: "12%",
        visible: true,
        render: (item) => (
          <Text className="text-red-600 text-lg font-bold">{formatCurrency(item.totalPrice || 0)}</Text>
        ),
      },
      {
        key: "returnTotal",
        title: "Return Total",
        width: "12%",
        visible: true,
        render: (item) => (
          <Text className="text-red-600 text-lg font-bold">{formatCurrency(item.totalPrice || 0)}</Text>
        ),
      },
      {
        key: "status",
        title: "Status",
        width: "9%",
        visible: true,
        render: (item) => {
          const status = getReturnStatusLabel(item.status);
          return (
            <View
              className="px-3 py-1 rounded-full self-start"
              style={{ backgroundColor: status === "Complete" ? "#22C55E" : "#F59E0B" }}
            >
              <Text className="text-white text-sm font-medium">{status}</Text>
            </View>
          );
        },
      },
      {
        key: "actions",
        title: "Actions",
        width: ACTION_COL_WIDTH,
        align: "center",
        visible: true,
        hideable: false,
        render: (item) => (
          <View className="flex-row gap-4">
            <Pressable
              className="rounded-lg items-center justify-center"
              style={{
                width: buttonSize.md.height,
                height: buttonSize.md.height,
                backgroundColor: colors.primaryLight,
                borderRadius: buttonSize.md.borderRadius,
              }}
              onPress={() => handlePrintOrder(item)}
            >
              <Ionicons name="print-outline" size={iconSize.md} color={colors.primary} />
            </Pressable>
            <Pressable
              className="rounded-lg items-center justify-center"
              style={{
                width: buttonSize.md.height,
                height: buttonSize.md.height,
                backgroundColor: colors.primaryLight,
                borderRadius: buttonSize.md.borderRadius,
              }}
              onPress={() => handleViewOrder(item)}
            >
              <Ionicons name="eye-outline" size={iconSize.md} color={colors.primary} />
            </Pressable>
          </View>
        ),
      },
    ],
    [handlePrintOrder, handleViewOrder]
  );

  const filters: FilterDefinition[] = [
    {
      key: "status",
      placeholder: "Status",
      width: 130,
      options: [
        { label: "All", value: "all" },
        { label: "Complete", value: "Complete" },
        { label: "Pending", value: "Pending" },
      ],
    },
  ];

  const handleSearch = useCallback((item: SaleReturnView, query: string) => {
    const q = query.toLowerCase();
    return (
      (item.orderNo?.toLowerCase().includes(q) || false) ||
      (item.customerName?.toLowerCase().includes(q) || false) ||
      (item.businessName?.toLowerCase().includes(q) || false) ||
      item.id.toLowerCase().includes(q)
    );
  }, []);

  const { setConfig: setBulkEditConfig, setSelection: setBulkEditSelection } = useBulkEditContext();

  const handleEditReturn = useCallback((_rows: SaleReturnView[]) => {
    Alert.alert("Edit Return", "Feature coming soon");
  }, []);

  useEffect(() => {
    setBulkEditConfig({
      label: "Edit Return",
      onPress: handleEditReturn,
      viewSingleItem: handleViewOrder,
    });
    return () => setBulkEditConfig(null);
  }, [handleEditReturn, handleViewOrder, setBulkEditConfig]);

  const handleFilter = useCallback((item: SaleReturnView, filters: Record<string, string | null>) => {
    if (filters.status && filters.status !== "all") {
      return getReturnStatusLabel(item.status) === filters.status;
    }
    return true;
  }, []);

  return (
    <View className="flex-1 bg-[#F7F7F9]">
      <PageHeader title="Sales Return" showBack={false} />

      <DataTable<SaleReturnView>
        data={returns}
        columns={columns}
        keyExtractor={(item) => item.id}
        searchable
        searchPlaceholder="Search Returns"
        searchHint="Search by Return No, Customer Name"
        onSearch={handleSearch}
        filters={filters}
        onFilter={handleFilter}
        columnSelector
        toolbarButtonStyle="shopping-cart"
        filtersInSettingsModal
        bulkActions
        bulkActionText="Edit Return"
        bulkActionInActionRow
        bulkActionInSidebar
        onBulkActionPress={handleEditReturn}
        onSelectionChange={(_, rows) => setBulkEditSelection(rows)}
        onRefresh={refresh}
        isLoading={isLoading}
        horizontalScroll
        minWidth={contentWidth}
        emptyIcon="return-down-back-outline"
        emptyText="No returns found"
        totalCount={count}
      />

      <OrderDetailsModal
        visible={showOrderDetails}
        onClose={() => setShowOrderDetails(false)}
        order={selectedOrder}
        saleOrderId={selectedOrder?.id ?? null}
      />
    </View>
  );
}
