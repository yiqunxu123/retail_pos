import { useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Alert, Text, View } from "react-native";
import { useBulkEditContext } from "../../contexts/BulkEditContext";
import { ColumnDefinition, DataTable, PageHeader } from "../../components";
import { useTableContentWidth } from "../../hooks/useTableContentWidth";
import { CustomerVelocityView, useCustomerVelocityReport } from "../../utils/powersync/hooks";

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
  { label: "Customer Name (A-Z)", value: "customer_asc" },
  { label: "Business Name (A-Z)", value: "business_asc" },
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
      <Text className={`font-bold text-base ${colors.text}`}>
        {percentage.toFixed(1)}%
      </Text>
    </View>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export default function CustomerVelocityScreen() {
  const router = useRouter();
  const contentWidth = useTableContentWidth();
  
  // Data from PowerSync
  const { reports, isLoading, isStreaming, refresh } = useCustomerVelocityReport();

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<string | null>("revenue_desc");
  const [marginFilter, setMarginFilter] = useState<string | null>(null);

  // Apply filters and sorting
  const filteredData = useMemo(() => {
    let result = [...reports];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (r) =>
          r.customerName.toLowerCase().includes(query) ||
          r.businessName.toLowerCase().includes(query) ||
          r.customerId.includes(query) ||
          r.customerNo.toLowerCase().includes(query)
      );
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
        case "revenue_desc": result.sort((a, b) => b.salesRevenue - a.salesRevenue); break;
        case "revenue_asc": result.sort((a, b) => a.salesRevenue - b.salesRevenue); break;
        case "qty_desc": result.sort((a, b) => b.qtySold - a.qtySold); break;
        case "qty_asc": result.sort((a, b) => a.qtySold - b.qtySold); break;
        case "margin_desc": result.sort((a, b) => b.marginPercentage - a.marginPercentage); break;
        case "margin_asc": result.sort((a, b) => a.marginPercentage - b.marginPercentage); break;
        case "customer_asc": result.sort((a, b) => a.customerName.localeCompare(b.customerName)); break;
        case "business_asc": result.sort((a, b) => a.businessName.localeCompare(b.businessName)); break;
      }
    }

    return result;
  }, [reports, searchQuery, sortBy, marginFilter]);

  // Calculate summary totals
  const totals = filteredData.reduce(
    (acc, item) => ({
      qtySold: acc.qtySold + item.qtySold,
      revenue: acc.revenue + item.salesRevenue,
      cost: acc.cost + item.cost,
      margin: acc.margin + item.margin,
    }),
    { qtySold: 0, revenue: 0, cost: 0, margin: 0 }
  );

  const avgMarginPercentage = totals.revenue > 0
    ? (totals.margin / totals.revenue) * 100
    : 0;

  const { setConfig: setBulkEditConfig, setSelection: setBulkEditSelection } = useBulkEditContext();

  const handleBulkAction = useCallback((rows: CustomerVelocityView[]) => {
    if (rows.length === 0) {
      Alert.alert("Bulk Export", "Please select row(s) first.");
      return;
    }
    Alert.alert("Bulk Export", `${rows.length} row(s) selected. Export is coming soon.`);
  }, []);

  useEffect(() => {
    setBulkEditConfig({ label: "Bulk Export", onPress: handleBulkAction });
    return () => setBulkEditConfig(null);
  }, [handleBulkAction, setBulkEditConfig]);

  const handleSearch = useCallback((item: CustomerVelocityView, query: string) => {
    const q = query.toLowerCase();
    return (
      item.customerName.toLowerCase().includes(q) ||
      item.businessName.toLowerCase().includes(q) ||
      item.customerId.includes(q) ||
      item.customerNo.toLowerCase().includes(q)
    );
  }, []);

  const handleFiltersChange = useCallback((f: Record<string, unknown>) => {
    setMarginFilter(f.margin as string);
  }, []);

  const handleSort = useCallback((data: CustomerVelocityView[], sortBy: string | null) => {
    if (!sortBy) return data;
    const result = [...data];
    switch (sortBy) {
      case "revenue_desc": result.sort((a, b) => b.salesRevenue - a.salesRevenue); break;
      case "revenue_asc": result.sort((a, b) => a.salesRevenue - b.salesRevenue); break;
      case "qty_desc": result.sort((a, b) => b.qtySold - a.qtySold); break;
      case "qty_asc": result.sort((a, b) => a.qtySold - b.qtySold); break;
      case "margin_desc": result.sort((a, b) => b.marginPercentage - a.marginPercentage); break;
      case "margin_asc": result.sort((a, b) => a.marginPercentage - b.marginPercentage); break;
      case "customer_asc": result.sort((a, b) => a.customerName.localeCompare(b.customerName)); break;
      case "business_asc": result.sort((a, b) => a.businessName.localeCompare(b.businessName)); break;
    }
    return result;
  }, []);

  // Column definitions
  const columns = useMemo<ColumnDefinition<CustomerVelocityView>[]>(() => [
    {
      key: "customerNo",
      title: "No",
      width: "10%",
      render: (item) => (
        <Text className="text-gray-600 text-lg">{item.customerNo || '-'}</Text>
      ),
    },
    {
      key: "customerName",
      title: "Customer",
      width: "26%",
      render: (item) => (
        <View>
          <Text className="text-blue-600 text-base" numberOfLines={1}>{item.customerName || '-'}</Text>
          <Text className="text-blue-600 text-lg font-bold" numberOfLines={1}>{item.businessName || '-'}</Text>
        </View>
      ),
    },
    {
      key: "qtySold",
      title: "Qty",
      width: "8%",
      align: "center",
      render: (item) => (
        <Text className="text-[#1A1A1A] text-lg text-center">{item.qtySold}</Text>
      ),
    },
    {
      key: "salesRevenue",
      title: "Revenue",
      width: "12%",
      align: "right",
      render: (item) => (
        <Text className="text-[#1A1A1A] text-lg text-right">{formatCurrency(item.salesRevenue)}</Text>
      ),
    },
    {
      key: "cost",
      title: "Cost",
      width: "12%",
      align: "right",
      render: (item) => (
        <Text className="text-[#1A1A1A] text-lg text-right">{formatCurrency(item.cost)}</Text>
      ),
    },
    {
      key: "margin",
      title: "Margin",
      width: "12%",
      align: "right",
      render: (item) => (
        <Text className="text-green-600 text-lg font-bold text-right">{formatCurrency(item.margin)}</Text>
      ),
    },
    {
      key: "marginPercentage",
      title: "Margin %",
      width: "10%",
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
      <View className="w-[120px]">
        <Text className="text-[#1A1A1A] text-lg font-bold">TOTAL</Text>
      </View>
      <View className="w-[250px]">
        <Text className="text-[#1A1A1A] text-lg font-bold">{filteredData.length} customers</Text>
      </View>
      <View className="w-[100px]">
        <Text className="text-[#1A1A1A] text-lg font-bold text-center">{totals.qtySold}</Text>
      </View>
      <View className="w-[150px]">
        <Text className="text-[#1A1A1A] text-lg font-bold text-right">{formatCurrency(totals.revenue)}</Text>
      </View>
      <View className="w-[150px]">
        <Text className="text-[#1A1A1A] text-lg font-bold text-right">{formatCurrency(totals.cost)}</Text>
      </View>
      <View className="w-[150px]">
        <Text className="text-green-600 text-lg font-bold text-right">{formatCurrency(totals.margin)}</Text>
      </View>
      <View className="w-[120px]">
        <Text className="text-blue-600 text-lg font-bold text-center">{avgMarginPercentage.toFixed(1)}%</Text>
      </View>
    </View>
  );

  return (
    <View className="flex-1 bg-[#F7F7F9]">
      <PageHeader title="Customer Velocity Report" showBack={false} />

      <DataTable<CustomerVelocityView>
        data={reports}
        columns={columns}
        keyExtractor={(item) => item.id}
        searchable
        searchPlaceholder="Search customers..."
        onSearch={handleSearch}
        filters={[
          { key: "margin", placeholder: "All Margins", options: MARGIN_FILTER_OPTIONS, width: 140 },
        ]}
        onFiltersChange={handleFiltersChange}
        sortOptions={SORT_OPTIONS}
        onSort={handleSort}
        filtersInSettingsModal
        bulkActions
        bulkActionText="Bulk Export"
        bulkActionInActionRow
        bulkActionInSidebar
        onBulkActionPress={handleBulkAction}
        onSelectionChange={(_, rows) => setBulkEditSelection(rows)}
        isLoading={isLoading}
        isStreaming={isStreaming}
        onRefresh={refresh}
        columnSelector
        toolbarButtonStyle="shopping-cart"
        ListFooterComponent={filteredData.length > 0 ? renderTableFooter : null}
        horizontalScroll
        minWidth={contentWidth}
      />
    </View>
  );
}
