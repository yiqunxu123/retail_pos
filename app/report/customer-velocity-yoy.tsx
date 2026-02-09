/**
 * Customer Velocity YoY Report
 * Uses the unified DataTable component
 */

import { Text, View } from "react-native";
import { ColumnDefinition, DataTable, FilterDefinition, PageHeader } from "../../components";
import { CustomerVelocityView, useCustomerVelocityReport } from "../../utils/powersync/hooks";

// ============================================================================
// Helper Functions
// ============================================================================

function formatCurrency(value: number): string {
  return "$" + value.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function MarginBadge({ percentage }: { percentage: number }) {
  const bg = percentage >= 10 ? "bg-green-100" : percentage >= 5 ? "bg-yellow-100" : "bg-red-100";
  const text = percentage >= 10 ? "text-green-700" : percentage >= 5 ? "text-yellow-700" : "text-red-700";
  return (
    <View className={`px-2 py-1 rounded ${bg}`}>
      <Text className={`text-sm font-medium ${text}`}>{percentage.toFixed(1)}%</Text>
    </View>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export default function CustomerVelocityScreen() {
  const { reports, isLoading, isStreaming } = useCustomerVelocityReport();

  // Column config
  const columns: ColumnDefinition<CustomerVelocityView>[] = [
    {
      key: "customerNo",
      title: "Customer No",
      width: 100,
      visible: true,
      render: (item) => <Text className="text-gray-600 text-sm">{item.customerNo || '-'}</Text>,
    },
    {
      key: "customerId",
      title: "ID",
      width: 80,
      visible: true,
      render: (item) => <Text className="text-blue-600 text-sm font-medium">{item.customerId}</Text>,
    },
    {
      key: "customerName",
      title: "Customer Name",
      width: 140,
      visible: true,
      render: (item) => (
        <Text className="text-gray-800 text-sm" numberOfLines={1}>{item.customerName || '-'}</Text>
      ),
    },
    {
      key: "businessName",
      title: "Business Name",
      width: "flex",
      visible: true,
      hideable: false,
      render: (item) => (
        <Text className="text-blue-600 text-sm" numberOfLines={1}>{item.businessName || '-'}</Text>
      ),
    },
    {
      key: "qtySold",
      title: "Qty Sold",
      width: 90,
      align: "center",
      visible: true,
      render: (item) => <Text className="text-gray-800 text-sm">{item.qtySold}</Text>,
    },
    {
      key: "salesRevenue",
      title: "Revenue",
      width: 120,
      align: "center",
      visible: true,
      render: (item) => <Text className="text-gray-800 text-sm">{formatCurrency(item.salesRevenue)}</Text>,
    },
    {
      key: "cost",
      title: "Cost",
      width: 120,
      align: "center",
      visible: true,
      render: (item) => <Text className="text-gray-800 text-sm">{formatCurrency(item.cost)}</Text>,
    },
    {
      key: "margin",
      title: "Margin",
      width: 110,
      align: "center",
      visible: true,
      render: (item) => (
        <Text className="text-green-600 text-sm font-medium">{formatCurrency(item.margin)}</Text>
      ),
    },
    {
      key: "marginPercentage",
      title: "Margin %",
      width: 100,
      align: "center",
      visible: true,
      render: (item) => <MarginBadge percentage={item.marginPercentage} />,
    },
  ];

  // Filters
  const filters: FilterDefinition[] = [
    {
      key: "margin",
      placeholder: "Margin Level",
      width: 140,
      options: [
        { label: "All Margins", value: "all" },
        { label: "High (>=10%)", value: "high" },
        { label: "Medium (5-10%)", value: "medium" },
        { label: "Low (<5%)", value: "low" },
      ],
    },
  ];

  // Sort options
  const sortOptions = [
    { label: "Revenue (High-Low)", value: "revenue_desc" },
    { label: "Revenue (Low-High)", value: "revenue_asc" },
    { label: "Qty Sold (High-Low)", value: "qty_desc" },
    { label: "Qty Sold (Low-High)", value: "qty_asc" },
    { label: "Margin % (High-Low)", value: "margin_desc" },
    { label: "Margin % (Low-High)", value: "margin_asc" },
    { label: "Customer Name (A-Z)", value: "customer_asc" },
    { label: "Business Name (A-Z)", value: "business_asc" },
  ];

  const handleSearch = (item: CustomerVelocityView, query: string) => {
    const q = query.toLowerCase();
    return (
      item.customerName.toLowerCase().includes(q) ||
      item.businessName.toLowerCase().includes(q) ||
      item.customerId.includes(q) ||
      item.customerNo.toLowerCase().includes(q)
    );
  };

  const handleFilter = (item: CustomerVelocityView, filters: Record<string, string | null>) => {
    if (filters.margin && filters.margin !== "all") {
      if (filters.margin === "high" && item.marginPercentage < 10) return false;
      if (filters.margin === "medium" && (item.marginPercentage < 5 || item.marginPercentage >= 10)) return false;
      if (filters.margin === "low" && item.marginPercentage >= 5) return false;
    }
    return true;
  };

  const handleSort = (data: CustomerVelocityView[], sortBy: string | null) => {
    if (!sortBy) return data;
    const sorted = [...data];
    switch (sortBy) {
      case "revenue_desc": return sorted.sort((a, b) => b.salesRevenue - a.salesRevenue);
      case "revenue_asc": return sorted.sort((a, b) => a.salesRevenue - b.salesRevenue);
      case "qty_desc": return sorted.sort((a, b) => b.qtySold - a.qtySold);
      case "qty_asc": return sorted.sort((a, b) => a.qtySold - b.qtySold);
      case "margin_desc": return sorted.sort((a, b) => b.marginPercentage - a.marginPercentage);
      case "margin_asc": return sorted.sort((a, b) => a.marginPercentage - b.marginPercentage);
      case "customer_asc": return sorted.sort((a, b) => a.customerName.localeCompare(b.customerName));
      case "business_asc": return sorted.sort((a, b) => a.businessName.localeCompare(b.businessName));
      default: return sorted;
    }
  };

  return (
    <View className="flex-1 bg-gray-50">
      <PageHeader title="Customer Velocity Report">
        {isStreaming && <Text className="text-green-600 text-xs ml-3">● Live</Text>}
      </PageHeader>

      <DataTable<CustomerVelocityView>
        data={reports}
        columns={columns}
        keyExtractor={(item) => item.id}
        searchable
        searchPlaceholder="Search..."
        searchHint="Search by Customer or Business"
        onSearch={handleSearch}
        filters={filters}
        onFilter={handleFilter}
        sortOptions={sortOptions}
        onSort={handleSort}
        columnSelector
        isLoading={isLoading}
        isStreaming={isStreaming}
        emptyIcon="analytics-outline"
        emptyText="No data found"
        totalCount={reports.length}
      />
    </View>
  );
}
