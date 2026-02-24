/**
 * Payments History Screen
 * Uses the unified DataTable component
 */

import { buttonSize, colors, iconSize } from "@/utils/theme";
import { Ionicons } from "@expo/vector-icons";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Alert, Pressable, Text, View } from "react-native";
import { useBulkEditContext } from "../../contexts/BulkEditContext";
import { ACTION_COL_WIDTH, ColumnDefinition, DataTable, FilterDefinition, PageHeader } from "../../components";
import { useTableContentWidth } from "../../hooks/useTableContentWidth";
import { PAYMENT_STATUS, PAYMENT_TYPE, PaymentView, usePayments } from "../../utils/powersync/hooks";

// ============================================================================
// Constants
// ============================================================================

const TABS = ["Payments Logs", "Payment by Invoice"];

// ============================================================================
// Helper Functions
// ============================================================================

function formatCurrency(value: number): string {
  return `$${value.toFixed(2)}`;
}

function formatDate(dateStr: string): string {
  if (!dateStr) return '-';
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      month: '2-digit',
      day: '2-digit',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

function getStatusColor(status: number): { bg: string; text: string } {
  const colors: Record<number, { bg: string; text: string }> = {
    0: { bg: "bg-yellow-100", text: "text-yellow-700" },
    1: { bg: "bg-green-100", text: "text-green-700" },
    2: { bg: "bg-red-100", text: "text-red-700" },
    3: { bg: "bg-purple-100", text: "text-purple-700" },
  };
  return colors[status] || { bg: "bg-gray-100", text: "text-gray-600" };
}

// ============================================================================
// Main Component
// ============================================================================

export default function PaymentsHistoryScreen() {
  const contentWidth = useTableContentWidth();
  const { payments, isLoading, isStreaming, refresh } = usePayments();
  const [activeTab, setActiveTab] = useState("Payments Logs");

  // Column config
  const columns = useMemo<ColumnDefinition<PaymentView>[]>(
    () => [
    {
      key: "paymentNo",
      title: "Payment No",
      width: "14%",
      visible: true,
      hideable: false,
      render: (item) => (
        <Text className="text-blue-600 font-medium text-lg">{item.paymentNo || '-'}</Text>
      ),
    },
    {
      key: "businessName",
      title: "Business / Customer",
      width: "22%",
      visible: true,
      render: (item) => (
        <View>
          <Text className="text-blue-600 text-lg font-bold" numberOfLines={1}>{item.businessName || '-'}</Text>
          <Text className="text-blue-600 text-base" numberOfLines={1}>{item.customerName || '-'}</Text>
        </View>
      ),
    },
    {
      key: "paymentType",
      title: "Type",
      width: "11%",
      visible: true,
      render: (item) => {
        const typeText = PAYMENT_TYPE[item.paymentType as keyof typeof PAYMENT_TYPE] || 'Unknown';
        return <Text className="text-[#1A1A1A] text-lg">{typeText}</Text>;
      },
    },
    {
      key: "amount",
      title: "Amount",
      width: "10%",
      align: "center",
      visible: true,
      render: (item) => (
        <Text className="text-[#1A1A1A] text-lg font-bold">{formatCurrency(item.amount)}</Text>
      ),
    },
    {
      key: "status",
      title: "Status",
      width: "11%",
      align: "center",
      visible: true,
      render: (item) => {
        const statusColor = getStatusColor(item.status);
        const statusText = PAYMENT_STATUS[item.status as keyof typeof PAYMENT_STATUS] || 'Unknown';
        return (
          <View className={`px-3 py-1 rounded ${statusColor.bg}`}>
            <Text className={`text-sm font-bold ${statusColor.text}`}>{statusText}</Text>
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
      render: (item) => (
        <Text className="text-gray-600 text-lg">{formatDate(item.paymentDate)}</Text>
      ),
    },
    {
      key: "memo",
      title: "Memo",
      width: "15%",
      visible: true,
      render: (item) => (
        <Text className="text-gray-500 text-sm" numberOfLines={1}>{item.memo || '-'}</Text>
      ),
    },
    {
      key: "actions",
      title: "Actions",
      width: ACTION_COL_WIDTH,
      align: "center",
      visible: true,
      render: () => (
        <Pressable 
          className="rounded-lg items-center justify-center"
          style={{ width: buttonSize.md.height, height: buttonSize.md.height, backgroundColor: colors.primaryLight, borderRadius: buttonSize.md.borderRadius }}
        >
          <Ionicons name="eye" size={iconSize.md} color={colors.primary} />
        </Pressable>
      ),
    },
  ],
    []
  );

  // Filters
  const filters: FilterDefinition[] = [
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

  const { setConfig: setBulkEditConfig, setSelection: setBulkEditSelection } = useBulkEditContext();

  const handleBulkAction = useCallback((rows: PaymentView[]) => {
    if (rows.length === 0) {
      Alert.alert("Bulk Export", "Please select payment(s) first.");
      return;
    }
    Alert.alert("Bulk Export", `${rows.length} payment(s) selected. Export is coming soon.`);
  }, []);

  useEffect(() => {
    setBulkEditConfig({ label: "Bulk Export", onPress: handleBulkAction });
    return () => setBulkEditConfig(null);
  }, [handleBulkAction, setBulkEditConfig]);

  const handleSearch = useCallback((item: PaymentView, query: string) => {
    const q = query.toLowerCase();
    return (
      item.businessName.toLowerCase().includes(q) ||
      item.customerName.toLowerCase().includes(q) ||
      item.paymentNo.toLowerCase().includes(q)
    );
  }, []);

  const handleFilter = useCallback((item: PaymentView, filters: Record<string, string | null>) => {
    if (filters.status && filters.status !== "all") {
      if (item.status !== parseInt(filters.status)) return false;
    }
    if (filters.type && filters.type !== "all") {
      if (item.paymentType !== parseInt(filters.type)) return false;
    }
    return true;
  }, []);

  return (
    <View className="flex-1 bg-[#F7F7F9]">
      <PageHeader title="Payments History" showBack={false} />

      {/* Tabs */}
      <View className="bg-[#F7F7F9] flex-row border-b border-gray-200">
        {TABS.map((tab) => (
          <Pressable
            key={tab}
            onPress={() => setActiveTab(tab)}
            className={`px-6 py-3 ${activeTab === tab ? "border-b-2 border-red-500" : ""}`}
          >
            <Text className={`font-medium ${activeTab === tab ? "text-red-500" : "text-gray-600"}`}>
              {tab}
            </Text>
          </Pressable>
        ))}
      </View>

      <DataTable<PaymentView>
        data={payments}
        columns={columns}
        keyExtractor={(item) => item.id}
        searchable
        searchPlaceholder="Search payments..."
        searchHint="Search by Payment No, Business Name, Customer Name"
        onSearch={handleSearch}
        filters={filters}
        onFilter={handleFilter}
        filtersInSettingsModal
        bulkActions
        bulkActionText="Bulk Export"
        bulkActionInActionRow
        bulkActionInSidebar
        onBulkActionPress={handleBulkAction}
        onSelectionChange={(_, rows) => setBulkEditSelection(rows)}
        columnSelector
        toolbarButtonStyle="shopping-cart"
        onRefresh={refresh}
        isLoading={isLoading}
        isStreaming={isStreaming}
        emptyIcon="card-outline"
        emptyText="No payments found"
        totalCount={payments.length}
        horizontalScroll
        minWidth={contentWidth}
      />
    </View>
  );
}
