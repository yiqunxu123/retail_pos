/**
 * Category Velocity Report
 * Uses the unified DataTable component
 */

import { Text, View } from "react-native";
import { ColumnDefinition, DataTable, FilterDefinition, PageHeader } from "../../components";
import { CategoryReportView, useCategoryVelocityReport } from "../../utils/powersync/hooks";

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
  const bg = percentage >= 15 ? "bg-green-100" : percentage >= 8 ? "bg-yellow-100" : "bg-red-100";
  const text = percentage >= 15 ? "text-green-700" : percentage >= 8 ? "text-yellow-700" : "text-red-700";
  return (
    <View className={`px-3 py-1 rounded ${bg}`}>
      <Text className={`font-medium ${text}`}>{percentage.toFixed(1)}%</Text>
    </View>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export default function CategoryVelocityReportScreen() {
  const { reports, isLoading, isStreaming } = useCategoryVelocityReport();

  // Column config
  const columns: ColumnDefinition<CategoryReportView>[] = [
    {
      key: "categoryName",
      title: "Category Name",
      width: "flex",
      visible: true,
      hideable: false,
      render: (item) => (
        <Text className="text-gray-800 font-medium pr-2">{item.categoryName}</Text>
      ),
    },
    {
      key: "qtySold",
      title: "Qty Sold",
      width: 100,
      align: "center",
      visible: true,
      render: (item) => <Text className="text-gray-800">{item.qtySold.toLocaleString()}</Text>,
    },
    {
      key: "salesRevenue",
      title: "Sales Revenue ($)",
      width: 140,
      align: "center",
      visible: true,
      render: (item) => <Text className="text-gray-800">{formatCurrency(item.salesRevenue)}</Text>,
    },
    {
      key: "cost",
      title: "Cost ($)",
      width: 120,
      align: "center",
      visible: true,
      render: (item) => <Text className="text-gray-800">{formatCurrency(item.cost)}</Text>,
    },
    {
      key: "margin",
      title: "Margin ($)",
      width: 120,
      align: "center",
      visible: true,
      render: (item) => (
        <Text className="text-green-600 font-medium">{formatCurrency(item.margin)}</Text>
      ),
    },
    {
      key: "marginPercentage",
      title: "Margin (%)",
      width: 120,
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
        { label: "High (>=15%)", value: "high" },
        { label: "Medium (8-15%)", value: "medium" },
        { label: "Low (<8%)", value: "low" },
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
    { label: "Category (A-Z)", value: "category_asc" },
  ];

  const handleSearch = (item: CategoryReportView, query: string) => {
    return item.categoryName.toLowerCase().includes(query.toLowerCase());
  };

  const handleFilter = (item: CategoryReportView, filters: Record<string, string | null>) => {
    if (filters.margin && filters.margin !== "all") {
      if (filters.margin === "high" && item.marginPercentage < 15) return false;
      if (filters.margin === "medium" && (item.marginPercentage < 8 || item.marginPercentage >= 15)) return false;
      if (filters.margin === "low" && item.marginPercentage >= 8) return false;
    }
    return true;
  };

  const handleSort = (data: CategoryReportView[], sortBy: string | null) => {
    if (!sortBy) return data;
    const sorted = [...data];
    switch (sortBy) {
      case "revenue_desc": return sorted.sort((a, b) => b.salesRevenue - a.salesRevenue);
      case "revenue_asc": return sorted.sort((a, b) => a.salesRevenue - b.salesRevenue);
      case "qty_desc": return sorted.sort((a, b) => b.qtySold - a.qtySold);
      case "qty_asc": return sorted.sort((a, b) => a.qtySold - b.qtySold);
      case "margin_desc": return sorted.sort((a, b) => b.marginPercentage - a.marginPercentage);
      case "margin_asc": return sorted.sort((a, b) => a.marginPercentage - b.marginPercentage);
      case "category_asc": return sorted.sort((a, b) => a.categoryName.localeCompare(b.categoryName));
      default: return sorted;
    }
  };

  return (
    <View className="flex-1 bg-gray-50">
      <PageHeader title="Category Velocity Report">
        {isStreaming && <Text className="text-green-600 text-xs ml-3">● Live</Text>}
      </PageHeader>

      <DataTable<CategoryReportView>
        data={reports}
        columns={columns}
        keyExtractor={(item) => item.id}
        searchable
        searchPlaceholder="Search categories..."
        searchHint="Search by Category name"
        onSearch={handleSearch}
        filters={filters}
        onFilter={handleFilter}
        sortOptions={sortOptions}
        onSort={handleSort}
        columnSelector
        isLoading={isLoading}
        isStreaming={isStreaming}
        emptyIcon="pie-chart-outline"
        emptyText="No categories found"
        totalCount={reports.length}
      />
    </View>
  );
}
