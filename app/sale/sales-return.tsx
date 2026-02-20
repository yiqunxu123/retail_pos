/**
 * Sales Return Screen
 * Uses the unified DataTable component
 */

import { Ionicons } from "@expo/vector-icons";
import { useCallback, useMemo } from "react";
import { Pressable, Text, View } from "react-native";
import { ColumnDefinition, DataTable, FilterDefinition, PageHeader } from "../../components";

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
  { id: "2", returnNumber: "RE-260129-05971", dateTime: "01/28/2026, 09:49:11", customerName: "Test Customer Name", createdBy: "User 1", channelName: "Primary", invoiceTotal: -88888.00, returnTotal: -88888.00, status: "Pending" },
  { id: "3", returnNumber: "RE-260129-05972", dateTime: "01/28/2026, 09:49:11", customerName: "Test Customer Name", createdBy: "User 1", channelName: "Primary", invoiceTotal: -88888.00, returnTotal: -88888.00, status: "Pending" },
  { id: "4", returnNumber: "RE-260129-05973", dateTime: "01/28/2026, 09:49:11", customerName: "Test Customer Name", createdBy: "User 1", channelName: "Primary", invoiceTotal: -88888.00, returnTotal: -88888.00, status: "Complete" },
  { id: "5", returnNumber: "RE-260129-05974", dateTime: "01/28/2026, 09:49:11", customerName: "Test Customer Name", createdBy: "User 1", channelName: "Primary", invoiceTotal: -88888.00, returnTotal: -88888.00, status: "Pending" },
  { id: "6", returnNumber: "RE-260129-05975", dateTime: "01/28/2026, 09:49:11", customerName: "Test Customer Name", createdBy: "User 1", channelName: "Primary", invoiceTotal: -88888.00, returnTotal: -88888.00, status: "Complete" },
  { id: "7", returnNumber: "RE-260129-05976", dateTime: "01/28/2026, 09:49:11", customerName: "Test Customer Name", createdBy: "User 1", channelName: "Primary", invoiceTotal: -88888.00, returnTotal: -88888.00, status: "Pending" },
  { id: "8", returnNumber: "RE-260129-05977", dateTime: "01/28/2026, 09:49:11", customerName: "Test Customer Name", createdBy: "User 1", channelName: "Primary", invoiceTotal: -88888.00, returnTotal: -88888.00, status: "Complete" },
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
  // Column config
  const columns = useMemo<ColumnDefinition<SalesReturn>[]>(
    () => [
    {
      key: "returnNumber",
      title: "Return Number",
      width: 180,
      visible: true,
      hideable: false,
      render: (item) => (
        <Text className="text-blue-600 text-[18px] font-Montserrat font-medium" numberOfLines={1}>
          {item.returnNumber}
        </Text>
      ),
    },
    {
      key: "dateTime",
      title: "Date / Time",
      width: 200,
      visible: true,
      render: (item) => <Text className="text-[#1A1A1A] text-[18px] font-Montserrat">{item.dateTime}</Text>,
    },
    {
      key: "customerName",
      title: "Customer Name",
      width: "flex",
      visible: true,
      render: (item) => (
        <Text className="text-blue-600 text-[18px] font-Montserrat" numberOfLines={1}>{item.customerName}</Text>
      ),
    },
    {
      key: "createdBy",
      title: "Created By",
      width: 120,
      visible: true,
      render: (item) => <Text className="text-[#1A1A1A] text-[18px] font-Montserrat">{item.createdBy}</Text>,
    },
    {
      key: "channelName",
      title: "Channel Name",
      width: 120,
      visible: true,
      render: (item) => (
        <View className="bg-pink-100 px-3 py-1 rounded self-start">
          <Text className="text-pink-600 text-[14px] font-Montserrat font-medium">{item.channelName}</Text>
        </View>
      ),
    },
    {
      key: "invoiceTotal",
      title: "Invoice Total",
      width: 150,
      visible: true,
      render: (item) => (
        <Text className="text-red-600 text-[18px] font-Montserrat font-bold">{formatCurrency(item.invoiceTotal)}</Text>
      ),
    },
    {
      key: "returnTotal",
      title: "Return Total",
      width: 150,
      visible: true,
      render: (item) => (
        <Text className="text-red-600 text-[18px] font-Montserrat font-bold">{formatCurrency(item.returnTotal)}</Text>
      ),
    },
    {
      key: "status",
      title: "Status",
      width: 120,
      visible: true,
      render: (item) => (
        <View 
          className="px-3 py-1 rounded-full self-start"
          style={{ backgroundColor: item.status === "Complete" ? "#22C55E" : "#F59E0B" }}
        >
          <Text className="text-white text-[14px] font-Montserrat font-medium">{item.status}</Text>
        </View>
      ),
    },
    {
      key: "actions",
      title: "Actions",
      width: 100,
      align: "center",
      visible: true,
      hideable: false,
      render: () => (
        <View className="flex-row gap-2">
          <Pressable className="bg-red-50 p-2 rounded">
            <Ionicons name="print-outline" size={16} color="#EC1A52" />
          </Pressable>
          <Pressable className="bg-red-50 p-2 rounded">
            <Ionicons name="eye-outline" size={16} color="#EC1A52" />
          </Pressable>
        </View>
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
        { label: "Complete", value: "Complete" },
        { label: "Pending", value: "Pending" },
      ],
    },
  ];

  const handleSearch = useCallback((item: SalesReturn, query: string) => {
    const q = query.toLowerCase();
    return (
      item.returnNumber.toLowerCase().includes(q) ||
      item.customerName.toLowerCase().includes(q)
    );
  }, []);

  const handleFilter = useCallback((item: SalesReturn, filters: Record<string, string | null>) => {
    if (filters.status && filters.status !== "all") {
      return item.status === filters.status;
    }
    return true;
  }, []);

  return (
    <View className="flex-1 bg-[#F7F7F9]">
      <PageHeader title="Sales Return" showBack={false} />

      <DataTable<SalesReturn>
        data={SAMPLE_RETURNS}
        columns={columns}
        keyExtractor={(item) => item.id}
        searchable
        searchPlaceholder="Search Returns"
        searchHint="Search by Customer Name, SKU, UPC"
        onSearch={handleSearch}
        filters={filters}
        onFilter={handleFilter}
        columnSelector
        emptyIcon="return-down-back-outline"
        emptyText="No returns found"
        totalCount={SAMPLE_RETURNS.length}
      />
    </View>
  );
}
