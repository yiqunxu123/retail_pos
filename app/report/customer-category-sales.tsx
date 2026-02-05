/**
 * Customer Category Sales Report
 * Uses the unified DataTable component
 */

import { Text, View } from "react-native";
import { ColumnDefinition, DataTable, PageHeader } from "../../components";
import { CustomerSalesReportView, useCustomerSalesReport } from "../../utils/powersync/hooks";

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
  const { reports, isLoading, isStreaming } = useCustomerSalesReport();

  // 列配置
  const columns: ColumnDefinition<CustomerSalesReportView>[] = [
    {
      key: "orderDate",
      title: "Date",
      width: 100,
      visible: true,
      render: (item) => <Text className="text-gray-600 text-sm">{formatDate(item.orderDate)}</Text>,
    },
    {
      key: "orderNo",
      title: "Order No",
      width: 140,
      visible: true,
      render: (item) => (
        <Text className="text-blue-600 text-sm font-medium">{item.orderNo || '-'}</Text>
      ),
    },
    {
      key: "customerName",
      title: "Customer Name",
      width: "flex",
      visible: true,
      hideable: false,
      render: (item) => (
        <Text className="text-gray-800 text-sm font-medium" numberOfLines={1}>
          {item.customerName || '-'}
        </Text>
      ),
    },
    {
      key: "businessName",
      title: "Business Name",
      width: "flex",
      visible: true,
      render: (item) => (
        <Text className="text-blue-600 text-sm" numberOfLines={1}>{item.businessName || '-'}</Text>
      ),
    },
    {
      key: "city",
      title: "City",
      width: 120,
      visible: true,
      render: (item) => <Text className="text-gray-600 text-sm">{item.city || '-'}</Text>,
    },
    {
      key: "totalAmount",
      title: "Total",
      width: 120,
      align: "right",
      visible: true,
      render: (item) => (
        <Text className="text-green-600 text-sm font-medium">{formatCurrency(item.totalAmount)}</Text>
      ),
    },
  ];

  // 排序选项
  const sortOptions = [
    { label: "Date (Newest)", value: "date_desc" },
    { label: "Date (Oldest)", value: "date_asc" },
    { label: "Customer (A-Z)", value: "customer_asc" },
    { label: "Amount (High-Low)", value: "amount_desc" },
    { label: "Amount (Low-High)", value: "amount_asc" },
  ];

  const handleSearch = (item: CustomerSalesReportView, query: string) => {
    const q = query.toLowerCase();
    return (
      item.customerName.toLowerCase().includes(q) ||
      item.businessName.toLowerCase().includes(q) ||
      item.orderNo.toLowerCase().includes(q) ||
      item.city.toLowerCase().includes(q)
    );
  };

  const handleSort = (data: CustomerSalesReportView[], sortBy: string | null) => {
    if (!sortBy) return data;
    const sorted = [...data];
    switch (sortBy) {
      case "date_desc": return sorted.sort((a, b) => new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime());
      case "date_asc": return sorted.sort((a, b) => new Date(a.orderDate).getTime() - new Date(b.orderDate).getTime());
      case "customer_asc": return sorted.sort((a, b) => a.customerName.localeCompare(b.customerName));
      case "amount_desc": return sorted.sort((a, b) => b.totalAmount - a.totalAmount);
      case "amount_asc": return sorted.sort((a, b) => a.totalAmount - b.totalAmount);
      default: return sorted;
    }
  };

  return (
    <View className="flex-1 bg-gray-50">
      <PageHeader title="Customer Sales Report">
        {isStreaming && <Text className="text-green-600 text-xs ml-3">● Live</Text>}
      </PageHeader>

      <DataTable<CustomerSalesReportView>
        data={reports}
        columns={columns}
        keyExtractor={(item) => item.id}
        searchable
        searchPlaceholder="Search..."
        searchHint="Search by Customer, Order No, City"
        onSearch={handleSearch}
        sortOptions={sortOptions}
        onSort={handleSort}
        columnSelector
        isLoading={isLoading}
        isStreaming={isStreaming}
        emptyIcon="document-text-outline"
        emptyText="No records found"
        totalCount={reports.length}
      />
    </View>
  );
}
