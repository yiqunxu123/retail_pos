import { useRouter } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import {
    Text,
    View,
} from "react-native";
import { ColumnDefinition, DataTable, PageHeader } from "../../components";
import { CategoryReportView, useCategoryVelocityReport } from "../../utils/powersync/hooks";

// ============================================================================
// Constants
// ============================================================================

const SORT_OPTIONS = [
  { label: "Revenue (High-Low)", value: "revenue_desc" },
  { label: "Revenue (Low-High)", value: "revenue_asc" },
  { label: "Qty Sold (High-Low)", value: "qty_desc" },
  { label: "Qty Sold (Low-High)", value: "qty_asc" },
  { label: "Margin % (High-Low)", value: "margin_desc" },
  { label: "Margin % (Low-High)", value: "margin_asc" },
  { label: "Category (A-Z)", value: "category_asc" },
];

const MARGIN_FILTER_OPTIONS = [
  { label: "All Margins", value: "all" },
  { label: "High (>=15%)", value: "high" },
  { label: "Medium (8-15%)", value: "medium" },
  { label: "Low (<8%)", value: "low" },
];

// ============================================================================
// Helper Functions
// ============================================================================

function formatCurrency(value: number): string {
  return "$" + value.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function getMarginColorClasses(percentage: number): { bg: string; text: string } {
  if (percentage >= 15) return { bg: "bg-green-100", text: "text-green-700" };
  if (percentage >= 8) return { bg: "bg-yellow-100", text: "text-yellow-700" };
  return { bg: "bg-red-100", text: "text-red-700" };
}

// ============================================================================
// Reusable Components
// ============================================================================

function MarginBadge({ percentage }: { percentage: number }) {
  const colors = getMarginColorClasses(percentage);
  return (
    <View className={`px-3 py-1 rounded ${colors.bg}`}>
      <Text className={`font-Montserrat font-bold text-[16px] ${colors.text}`}>
        {percentage.toFixed(1)}%
      </Text>
    </View>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export default function CategoryVelocityReportScreen() {
  const router = useRouter();
  
  // Data from PowerSync
  const { reports, isLoading, isStreaming, refresh } = useCategoryVelocityReport();

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<string | null>("revenue_desc");
  const [marginFilter, setMarginFilter] = useState<string | null>(null);

  // Apply filters and sorting
  const filteredReports = useMemo(() => {
    let result = [...reports];

    // Search filter
    if (searchQuery) {
      result = result.filter((r) =>
        r.categoryName.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Margin filter
    if (marginFilter && marginFilter !== "all") {
      switch (marginFilter) {
        case "high":
          result = result.filter((r) => r.marginPercentage >= 15);
          break;
        case "medium":
          result = result.filter((r) => r.marginPercentage >= 8 && r.marginPercentage < 15);
          break;
        case "low":
          result = result.filter((r) => r.marginPercentage < 8);
          break;
      }
    }

    // Sort
    if (sortBy) {
      switch (sortBy) {
        case "revenue_desc":
          result.sort((a, b) => b.salesRevenue - a.salesRevenue);
          break;
        case "revenue_asc":
          result.sort((a, b) => a.salesRevenue - b.salesRevenue);
          break;
        case "qty_desc":
          result.sort((a, b) => b.qtySold - a.qtySold);
          break;
        case "qty_asc":
          result.sort((a, b) => a.qtySold - b.qtySold);
          break;
        case "margin_desc":
          result.sort((a, b) => b.marginPercentage - a.marginPercentage);
          break;
        case "margin_asc":
          result.sort((a, b) => a.marginPercentage - b.marginPercentage);
          break;
        case "category_asc":
          result.sort((a, b) => a.categoryName.localeCompare(b.categoryName));
          break;
      }
    }

    return result;
  }, [reports, searchQuery, sortBy, marginFilter]);

  // Calculate totals
  const totals = filteredReports.reduce(
    (acc, r) => ({
      qtySold: acc.qtySold + r.qtySold,
      revenue: acc.revenue + r.salesRevenue,
      cost: acc.cost + r.cost,
      margin: acc.margin + r.margin,
    }),
    { qtySold: 0, revenue: 0, cost: 0, margin: 0 }
  );

  const avgMarginPercentage = totals.revenue > 0 ? (totals.margin / totals.revenue) * 100 : 0;

  const handleSearch = useCallback((item: CategoryReportView, query: string) =>
    item.categoryName.toLowerCase().includes(query.toLowerCase()), []);

  const handleFiltersChange = useCallback((f: Record<string, unknown>) => {
    setMarginFilter(f.margin as string);
  }, []);

  const handleSort = useCallback((data: CategoryReportView[], sortBy: string | null) => {
    if (!sortBy) return data;
    const result = [...data];
    switch (sortBy) {
      case "revenue_desc": result.sort((a, b) => b.salesRevenue - a.salesRevenue); break;
      case "revenue_asc": result.sort((a, b) => a.salesRevenue - b.salesRevenue); break;
      case "qty_desc": result.sort((a, b) => b.qtySold - a.qtySold); break;
      case "qty_asc": result.sort((a, b) => a.qtySold - b.qtySold); break;
      case "margin_desc": result.sort((a, b) => b.marginPercentage - a.marginPercentage); break;
      case "margin_asc": result.sort((a, b) => a.marginPercentage - b.marginPercentage); break;
      case "category_asc": result.sort((a, b) => a.categoryName.localeCompare(b.categoryName)); break;
    }
    return result;
  }, []);

  // Column definitions
  const columns = useMemo<ColumnDefinition<CategoryReportView>[]>(() => [
    {
      key: "categoryName",
      title: "Category Name",
      width: 300,
      render: (item) => (
        <Text className="text-[#1A1A1A] text-[18px] font-Montserrat font-medium pr-2">{item.categoryName}</Text>
      ),
    },
    {
      key: "qtySold",
      title: "Qty Sold",
      width: 120,
      align: "center",
      render: (item) => (
        <Text className="text-[#1A1A1A] text-[18px] font-Montserrat text-center">{String(item.qtySold)}</Text>
      ),
    },
    {
      key: "salesRevenue",
      title: "Revenue",
      width: 150,
      align: "right",
      render: (item) => (
        <Text className="text-[#1A1A1A] text-[18px] font-Montserrat text-right">{formatCurrency(item.salesRevenue)}</Text>
      ),
    },
    {
      key: "cost",
      title: "Cost",
      width: 150,
      align: "right",
      render: (item) => (
        <Text className="text-[#1A1A1A] text-[18px] font-Montserrat text-right">{formatCurrency(item.cost)}</Text>
      ),
    },
    {
      key: "margin",
      title: "Margin ($)",
      width: 150,
      align: "right",
      render: (item) => (
        <Text className="text-green-600 text-[18px] font-Montserrat font-bold text-right">{formatCurrency(item.margin)}</Text>
      ),
    },
    {
      key: "marginPercentage",
      title: "Margin (%)",
      width: 150,
      align: "center",
      render: (item) => (
        <View className="items-center">
          <MarginBadge percentage={item.marginPercentage} />
        </View>
      ),
    },
  ], []);

  const renderTableFooter = () => (
    <View className="flex-row items-center py-4 px-5 bg-gray-100 border-t-2 border-gray-300">
      <View className="w-[300px]">
        <Text className="text-[#1A1A1A] text-[18px] font-Montserrat font-bold">TOTAL ({filteredReports.length} categories)</Text>
      </View>
      <View className="w-[120px]">
        <Text className="text-[#1A1A1A] text-[18px] font-Montserrat font-bold text-center">{totals.qtySold.toLocaleString()}</Text>
      </View>
      <View className="w-[150px]">
        <Text className="text-[#1A1A1A] text-[18px] font-Montserrat font-bold text-right">{formatCurrency(totals.revenue)}</Text>
      </View>
      <View className="w-[150px]">
        <Text className="text-[#1A1A1A] text-[18px] font-Montserrat font-bold text-right">{formatCurrency(totals.cost)}</Text>
      </View>
      <View className="w-[150px]">
        <Text className="text-green-600 text-[18px] font-Montserrat font-bold text-right">{formatCurrency(totals.margin)}</Text>
      </View>
      <View className="w-[150px]">
        <Text className="text-blue-600 text-[18px] font-Montserrat font-bold text-center">{avgMarginPercentage.toFixed(1)}%</Text>
      </View>
    </View>
  );

  return (
    <View className="flex-1 bg-[#F7F7F9]">
      <PageHeader title="Category Velocity Report" showBack={false} />

      <DataTable<CategoryReportView>
        data={reports}
        columns={columns}
        keyExtractor={(item) => item.id}
        searchable
        searchPlaceholder="Search categories..."
        onSearch={handleSearch}
        filters={[
          { key: "margin", placeholder: "All Margins", options: MARGIN_FILTER_OPTIONS, width: 140 },
        ]}
        onFiltersChange={handleFiltersChange}
        sortOptions={SORT_OPTIONS}
        onSort={handleSort}
        isLoading={isLoading}
        isStreaming={isStreaming}
        onRefresh={refresh}
        columnSelector
        ListFooterComponent={filteredReports.length > 0 ? renderTableFooter : null}
        horizontalScroll
        minWidth={1020}
      />
    </View>
  );
}
