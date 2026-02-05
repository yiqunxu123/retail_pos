/**
 * Payments History Screen
 * Uses the unified DataTable component
 */

import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { ColumnDefinition, DataTable, FilterDefinition, PageHeader } from "../../components";
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
  const { payments, isLoading, isStreaming } = usePayments();
  const [activeTab, setActiveTab] = useState("Payments Logs");

  // 列配置
  const columns: ColumnDefinition<PaymentView>[] = [
    {
      key: "paymentNo",
      title: "Payment No",
      width: 130,
      visible: true,
      hideable: false,
      render: (item) => (
        <Text className="text-blue-600 font-medium text-sm">{item.paymentNo || '-'}</Text>
      ),
    },
    {
      key: "businessName",
      title: "Business / Customer",
      width: "flex",
      visible: true,
      render: (item) => (
        <View>
          <Text className="text-blue-600 text-sm" numberOfLines={1}>{item.businessName || '-'}</Text>
          <Text className="text-gray-500 text-xs" numberOfLines={1}>{item.customerName || '-'}</Text>
        </View>
      ),
    },
    {
      key: "paymentType",
      title: "Type",
      width: 110,
      visible: true,
      render: (item) => {
        const typeText = PAYMENT_TYPE[item.paymentType as keyof typeof PAYMENT_TYPE] || 'Unknown';
        return <Text className="text-gray-800 text-sm">{typeText}</Text>;
      },
    },
    {
      key: "amount",
      title: "Amount",
      width: 110,
      align: "center",
      visible: true,
      render: (item) => (
        <Text className="text-gray-800 text-sm font-medium">{formatCurrency(item.amount)}</Text>
      ),
    },
    {
      key: "status",
      title: "Status",
      width: 110,
      align: "center",
      visible: true,
      render: (item) => {
        const statusColor = getStatusColor(item.status);
        const statusText = PAYMENT_STATUS[item.status as keyof typeof PAYMENT_STATUS] || 'Unknown';
        return (
          <View className={`px-2 py-0.5 rounded ${statusColor.bg}`}>
            <Text className={`text-xs font-medium ${statusColor.text}`}>{statusText}</Text>
          </View>
        );
      },
    },
    {
      key: "paymentDate",
      title: "Date",
      width: 110,
      align: "center",
      visible: true,
      render: (item) => (
        <Text className="text-gray-600 text-sm">{formatDate(item.paymentDate)}</Text>
      ),
    },
    {
      key: "memo",
      title: "Memo",
      width: 180,
      visible: true,
      render: (item) => (
        <Text className="text-gray-500 text-xs" numberOfLines={1}>{item.memo || '-'}</Text>
      ),
    },
    {
      key: "actions",
      title: "Actions",
      width: 70,
      align: "center",
      visible: true,
      hideable: false,
      render: () => (
        <Pressable className="bg-blue-100 p-1.5 rounded">
          <Ionicons name="eye" size={14} color="#3b82f6" />
        </Pressable>
      ),
    },
  ];

  // 过滤器
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

  const handleSearch = (item: PaymentView, query: string) => {
    const q = query.toLowerCase();
    return (
      item.businessName.toLowerCase().includes(q) ||
      item.customerName.toLowerCase().includes(q) ||
      item.paymentNo.toLowerCase().includes(q)
    );
  };

  const handleFilter = (item: PaymentView, filters: Record<string, string | null>) => {
    if (filters.status && filters.status !== "all") {
      if (item.status !== parseInt(filters.status)) return false;
    }
    if (filters.type && filters.type !== "all") {
      if (item.paymentType !== parseInt(filters.type)) return false;
    }
    return true;
  };

  return (
    <View className="flex-1 bg-gray-50">
      <PageHeader title="Payments History" />

      {/* Tabs */}
      <View className="bg-white flex-row border-b border-gray-200">
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
        columnSelector
        isLoading={isLoading}
        isStreaming={isStreaming}
        emptyIcon="card-outline"
        emptyText="No payments found"
        totalCount={payments.length}
      />
    </View>
  );
}
