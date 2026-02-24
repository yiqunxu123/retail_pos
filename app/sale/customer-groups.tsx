/**
 * Customer Groups Screen
 * Uses the unified DataTable component
 * 
 * Data source: customer_groups table
 * Missing fields (showing "-"):
 * - tier: Not in DB
 * - noOfProducts: Needs aggregate query
 */

import { colors, iconSize } from '@/utils/theme';
import { Ionicons } from "@expo/vector-icons";
import { useCallback, useEffect, useMemo } from "react";
import { Alert, Pressable, Text, View } from "react-native";
import { useBulkEditContext } from "../../contexts/BulkEditContext";
import { ACTION_COL_WIDTH, ColumnDefinition, DataTable, PageHeader } from "../../components";
import { useTableContentWidth } from "../../hooks/useTableContentWidth";
import { CustomerGroupView, useCustomerGroups } from "../../utils/powersync/hooks";

// ============================================================================
// Main Component
// ============================================================================

export default function CustomerGroupsScreen() {
  const contentWidth = useTableContentWidth();
  const { groups, isLoading, isStreaming, refresh, count } = useCustomerGroups();

  // Column config
  const columns = useMemo<ColumnDefinition<CustomerGroupView>[]>(
    () => [
    {
      key: "name",
      title: "Group Name",
      width: "49%",
      visible: true,
      hideable: false,
      render: (item) => (
        <View>
          <Text className="text-lg font-medium" style={{ color: colors.text }}>{item.name || "-"}</Text>
          {item.description && (
            <Text className="text-gray-500 text-sm" numberOfLines={1}>{item.description}</Text>
          )}
        </View>
      ),
    },
    {
      key: "tier",
      title: "Tier",
      width: "10%",
      align: "center",
      visible: true,
      render: () => <Text className="text-gray-400 text-lg">-</Text>,
    },
    {
      key: "customerCount",
      title: "Customers",
      width: "12%",
      align: "center",
      visible: true,
      render: (item) => <Text className="text-lg font-bold" style={{ color: colors.text }}>{item.customerCount}</Text>,
    },
    {
      key: "products",
      title: "Products",
      width: "11%",
      align: "center",
      visible: true,
      render: () => <Text className="text-gray-400 text-lg">-</Text>,
    },
    {
      key: "actions",
      title: "Actions",
      width: ACTION_COL_WIDTH,
      align: "center",
      visible: true,
      hideable: false,
      render: () => (
        <Pressable>
          <Ionicons name="ellipsis-horizontal" size={iconSize.xl} color={colors.textTertiary} />
        </Pressable>
      ),
    },
  ],
    []
  );

  // Sort options
  const sortOptions = [
    { label: "Name (A-Z)", value: "name_asc" },
    { label: "Name (Z-A)", value: "name_desc" },
  ];

  const { setConfig: setBulkEditConfig, setSelection: setBulkEditSelection } = useBulkEditContext();

  const handleBulkAction = useCallback((rows: CustomerGroupView[]) => {
    if (rows.length === 0) {
      Alert.alert("Bulk Edit", "Please select group(s) first.");
      return;
    }
    Alert.alert("Bulk Edit Groups", `${rows.length} group(s) selected. Bulk edit is coming soon.`);
  }, []);

  useEffect(() => {
    setBulkEditConfig({ label: "Bulk Edit", onPress: handleBulkAction });
    return () => setBulkEditConfig(null);
  }, [handleBulkAction, setBulkEditConfig]);

  const handleSearch = useCallback((item: CustomerGroupView, query: string) => {
    const q = query.toLowerCase();
    return (
      item.name.toLowerCase().includes(q) ||
      item.description.toLowerCase().includes(q)
    );
  }, []);

  const handleSort = useCallback((data: CustomerGroupView[], sortBy: string | null) => {
    if (!sortBy) return data;
    const sorted = [...data];
    switch (sortBy) {
      case "name_asc": return sorted.sort((a, b) => a.name.localeCompare(b.name));
      case "name_desc": return sorted.sort((a, b) => b.name.localeCompare(a.name));
      default: return sorted;
    }
  }, []);

  return (
    <View className="flex-1" style={{ backgroundColor: colors.backgroundTertiary }}>
      <PageHeader title="Customer Groups" showBack={false} />

      <DataTable<CustomerGroupView>
        data={groups}
        columns={columns}
        keyExtractor={(item) => item.id}
        searchable
        searchPlaceholder="Search groups..."
        searchHint="Search by Customer Group"
        onSearch={handleSearch}
        bulkActions
        bulkActionText="Bulk Edit"
        bulkActionInActionRow
        bulkActionInSidebar
        onBulkActionPress={handleBulkAction}
        onSelectionChange={(_, rows) => setBulkEditSelection(rows)}
        sortOptions={sortOptions}
        onSort={handleSort}
        columnSelector
        toolbarButtonStyle="shopping-cart"
        addButton
        addButtonText="Create Customer Group"
        onAddPress={() => {}}
        isLoading={isLoading}
        isStreaming={isStreaming}
        onRefresh={refresh}
        emptyIcon="people-circle-outline"
        emptyText="No groups found"
        totalCount={count}
        horizontalScroll
        minWidth={contentWidth}
      />
    </View>
  );
}
