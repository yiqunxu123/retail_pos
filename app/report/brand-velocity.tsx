import { useRouter } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import {
    Text,
    View,
} from "react-native";
import { ColumnDefinition, DataTable, PageHeader } from "../../components";
import { BrandReportView, useBrandVelocityReport } from "../../utils/powersync/hooks";

// ============================================================================
// Constants
// ============================================================================

const MARGIN_THRESHOLDS = {
  HIGH: 10,
  MEDIUM: 5,
};

const SORT_OPTIONS = [
  { label: "Revenue (High-Low)", value: "revenue_desc" },
  { label: "Revenue (Low-High)", value: "revenue_asc" },
  { label: "Qty Sold (High-Low)", value: "qty_desc" },
  { label: "Qty Sold (Low-High)", value: "qty_asc" },
  { label: "Margin % (High-Low)", value: "margin_desc" },
  { label: "Margin % (Low-High)", value: "margin_asc" },
];

const MARGIN_FILTER_OPTIONS = [
  { label: "All Margins", value: "all" },
  { label: "High (>=10%)", value: "high" },
  { label: "Medium (5-10%)", value: "medium" },
  { label: "Low (<5%)", value: "low" },
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
  if (percentage >= MARGIN_THRESHOLDS.HIGH) {
    return { bg: "bg-green-100", text: "text-green-700" };
  }
  if (percentage >= MARGIN_THRESHOLDS.MEDIUM) {
    return { bg: "bg-yellow-100", text: "text-yellow-700" };
  }
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

export default function BrandVelocityReportScreen() {
  const router = useRouter();
  
  // Data from PowerSync
  const { reports, isLoading, isStreaming, refresh } = useBrandVelocityReport();

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<string | null>("revenue_desc");
  const [marginFilter, setMarginFilter] = useState<string | null>(null);

  // Apply filters and sorting
  const filteredReports = useMemo(() => {
    let result = [...reports];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter((r) => r.brandName.toLowerCase().includes(query));
    }

    // Margin filter
    if (marginFilter && marginFilter !== "all") {
      switch (marginFilter) {
        case "high":
          result = result.filter((r) => r.marginPercentage >= 10);
          break;
        case "medium":
          result = result.filter((r) => r.marginPercentage >= 5 && r.marginPercentage < 10);
          break;
        case "low":
          result = result.filter((r) => r.marginPercentage < 5);
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
      }
    }

    return result;
  }, [reports, searchQuery, sortBy, marginFilter]);

  // Calculate summary totals
  const totals = filteredReports.reduce(
    (acc, report) => ({
      qtySold: acc.qtySold + report.qtySold,
      revenue: acc.revenue + report.salesRevenue,
      cost: acc.cost + report.cost,
      margin: acc.margin + report.margin,
    }),
    { qtySold: 0, revenue: 0, cost: 0, margin: 0 }
  );

  const avgMarginPercentage = totals.revenue > 0
    ? (totals.margin / totals.revenue) * 100
    : 0;

  const handleSearch = useCallback((item: BrandReportView, query: string) =>
    item.brandName.toLowerCase().includes(query.toLowerCase()), []);

  const handleFiltersChange = useCallback((f: Record<string, unknown>) => {
    setMarginFilter(f.margin as string);
  }, []);

  const handleSort = useCallback((data: BrandReportView[], sortBy: string | null) => {
    if (!sortBy) return data;
    const result = [...data];
    switch (sortBy) {
      case "revenue_desc": result.sort((a, b) => b.salesRevenue - a.salesRevenue); break;
      case "revenue_asc": result.sort((a, b) => a.salesRevenue - b.salesRevenue); break;
      case "qty_desc": result.sort((a, b) => b.qtySold - a.qtySold); break;
      case "qty_asc": result.sort((a, b) => a.qtySold - b.qtySold); break;
      case "margin_desc": result.sort((a, b) => b.marginPercentage - a.marginPercentage); break;
      case "margin_asc": result.sort((a, b) => a.marginPercentage - b.marginPercentage); break;
    }
    return result;
  }, []);

  // Column definitions
  const columns = useMemo<ColumnDefinition<BrandReportView>[]>(() => [
    {
      key: "brandName",
      title: "Brand Name",
      width: 300,
      render: (item) => (
        <Text className="text-[#1A1A1A] text-[18px] font-Montserrat font-medium pr-2" numberOfLines={2}>
          {item.brandName}
        </Text>
      ),
    },
    {
      key: "qtySold",
      title: "Qty Sold",
      width: 120,
      align: "center",
      render: (item) => (
        <Text className="text-[#1A1A1A] text-[18px] font-Montserrat text-center">{item.qtySold}</Text>
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
        <Text className="text-[#1A1A1A] text-[18px] font-Montserrat font-bold">TOTAL ({filteredReports.length} brands)</Text>
      </View>
      <View className="w-[120px]">
        <Text className="text-[#1A1A1A] text-[18px] font-Montserrat font-bold text-center">{totals.qtySold}</Text>
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
      <PageHeader title="Brand Velocity Report" showBack={false} />

      <DataTable<BrandReportView>
        data={reports}
        columns={columns}
        keyExtractor={(item) => item.id}
        searchable
        searchPlaceholder="Search brands..."
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
