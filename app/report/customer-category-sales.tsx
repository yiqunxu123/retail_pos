import { useRouter } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import {
    Text,
    View
} from "react-native";
import { ColumnDefinition, DataTable, PageHeader } from "../../components";
import { CustomerSalesReportView, useCustomerSalesReport } from "../../utils/powersync/hooks";

// ============================================================================
// Constants
// ============================================================================

const SORT_OPTIONS = [
  { label: "Date (Newest)", value: "date_desc" },
  { label: "Date (Oldest)", value: "date_asc" },
  { label: "Customer (A-Z)", value: "customer_asc" },
  { label: "Amount (High-Low)", value: "amount_desc" },
  { label: "Amount (Low-High)", value: "amount_asc" },
];

// ============================================================================
// Helper Functions
// ============================================================================

function formatCurrency(value: number): string {
  if (value === 0) return "-";
  return "$" + value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
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

// ============================================================================
// Main Component
// ============================================================================

export default function CustomerCategorySalesReportScreen() {
  const router = useRouter();
  
  // Data from PowerSync
  const { reports, isLoading, isStreaming, refresh } = useCustomerSalesReport();

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<string | null>("date_desc");

  // Filter and sort data
  const filteredReports = useMemo(() => {
    let result = [...reports];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (r) =>
          r.customerName.toLowerCase().includes(query) ||
          r.businessName.toLowerCase().includes(query) ||
          r.orderNo.toLowerCase().includes(query) ||
          r.city.toLowerCase().includes(query)
      );
    }

    // Sort
    if (sortBy) {
      switch (sortBy) {
        case "date_desc":
          result.sort((a, b) => new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime());
          break;
        case "date_asc":
          result.sort((a, b) => new Date(a.orderDate).getTime() - new Date(b.orderDate).getTime());
          break;
        case "customer_asc":
          result.sort((a, b) => a.customerName.localeCompare(b.customerName));
          break;
        case "amount_desc":
          result.sort((a, b) => b.totalAmount - a.totalAmount);
          break;
        case "amount_asc":
          result.sort((a, b) => a.totalAmount - b.totalAmount);
          break;
      }
    }

    return result;
  }, [reports, searchQuery, sortBy]);

  const handleSearch = useCallback((item: CustomerSalesReportView, query: string) => {
    const q = query.toLowerCase();
    return (
      item.customerName.toLowerCase().includes(q) ||
      item.businessName.toLowerCase().includes(q) ||
      item.orderNo.toLowerCase().includes(q) ||
      item.city.toLowerCase().includes(q)
    );
  }, []);

  const handleSort = useCallback((data: CustomerSalesReportView[], sortBy: string | null) => {
    if (!sortBy) return data;
    const result = [...data];
    switch (sortBy) {
      case "date_desc":
        result.sort((a, b) => new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime());
        break;
      case "date_asc":
        result.sort((a, b) => new Date(a.orderDate).getTime() - new Date(b.orderDate).getTime());
        break;
      case "customer_asc":
        result.sort((a, b) => a.customerName.localeCompare(b.customerName));
        break;
      case "amount_desc":
        result.sort((a, b) => b.totalAmount - a.totalAmount);
        break;
      case "amount_asc":
        result.sort((a, b) => a.totalAmount - b.totalAmount);
        break;
    }
    return result;
  }, []);

  // Column definitions
  const columns = useMemo<ColumnDefinition<CustomerSalesReportView>[]>(() => [
    {
      key: "orderDate",
      title: "Date",
      width: 150,
      render: (item) => (
        <Text className="text-[#1A1A1A] text-[18px] font-Montserrat">{formatDate(item.orderDate)}</Text>
      ),
    },
    {
      key: "orderNo",
      title: "Order No",
      width: 180,
      render: (item) => (
        <Text className="text-blue-600 text-[18px] font-Montserrat font-medium">{item.orderNo || '-'}</Text>
      ),
    },
    {
      key: "customerName",
      title: "Customer Name",
      width: 250,
      render: (item) => (
        <Text className="text-[#1A1A1A] text-[18px] font-Montserrat font-medium" numberOfLines={1}>
          {item.customerName || '-'}
        </Text>
      ),
    },
    {
      key: "businessName",
      title: "Business Name",
      width: 250,
      render: (item) => (
        <Text className="text-blue-600 text-[18px] font-Montserrat" numberOfLines={1}>
          {item.businessName || '-'}
        </Text>
      ),
    },
    {
      key: "city",
      title: "City",
      width: 150,
      render: (item) => (
        <Text className="text-[#1A1A1A] text-[18px] font-Montserrat">{item.city || '-'}</Text>
      ),
    },
    {
      key: "totalAmount",
      title: "Total",
      width: 150,
      align: "right",
      render: (item) => (
        <Text className="text-green-600 text-[18px] font-Montserrat font-bold text-right">
          {formatCurrency(item.totalAmount)}
        </Text>
      ),
    },
  ], []);

  // Calculate totals
  const totalAmount = filteredReports.reduce((acc, r) => acc + r.totalAmount, 0);

  const renderTableFooter = () => (
    <View className="flex-row items-center py-4 px-5 bg-gray-100 border-t-2 border-gray-300">
      <View className="w-[150px]">
        <Text className="text-[#1A1A1A] text-[18px] font-Montserrat font-bold">TOTAL</Text>
      </View>
      <View className="w-[180px]">
        <Text className="text-[#1A1A1A] text-[18px] font-Montserrat font-bold">{filteredReports.length} orders</Text>
      </View>
      <View className="w-[250px]" />
      <View className="w-[250px]" />
      <View className="w-[150px]" />
      <View className="w-[150px]">
        <Text className="text-green-600 text-[18px] font-Montserrat font-bold text-right">{formatCurrency(totalAmount)}</Text>
      </View>
    </View>
  );

  return (
    <View className="flex-1 bg-[#F7F7F9]">
      <PageHeader title="Customer Sales Report" showBack={false} />

      <DataTable<CustomerSalesReportView>
        data={reports}
        columns={columns}
        keyExtractor={(item) => item.id}
        searchable
        searchPlaceholder="Search customers, orders..."
        onSearch={handleSearch}
        sortOptions={SORT_OPTIONS}
        onSort={handleSort}
        isLoading={isLoading}
        isStreaming={isStreaming}
        onRefresh={refresh}
        columnSelector
        ListFooterComponent={filteredReports.length > 0 ? renderTableFooter : null}
        horizontalScroll
        minWidth={1130}
      />
    </View>
  );
}
