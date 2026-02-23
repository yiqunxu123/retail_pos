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
import { useCallback, useMemo } from "react";
import { Pressable, Text, View } from "react-native";
import { ColumnDefinition, DataTable, PageHeader } from "../../components";
import { CustomerGroupView, useCustomerGroups } from "../../utils/powersync/hooks";

// ============================================================================
// Main Component
// ============================================================================

export default function CustomerGroupsScreen() {
  const { groups, isLoading, isStreaming, refresh, count } = useCustomerGroups();

  // Column config
  const columns = useMemo<ColumnDefinition<CustomerGroupView>[]>(
    () => [
    {
      key: "name",
      title: "Group Name",
      width: "flex",
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
      width: 100,
      align: "center",
      visible: true,
      render: () => <Text className="text-gray-400 text-lg">-</Text>,
    },
    {
      key: "customerCount",
      title: "Customers",
      width: 140,
      align: "center",
      visible: true,
      render: (item) => <Text className="text-lg font-bold" style={{ color: colors.text }}>{item.customerCount}</Text>,
    },
    {
      key: "products",
      title: "Products",
      width: 120,
      align: "center",
      visible: true,
      render: () => <Text className="text-gray-400 text-lg">-</Text>,
    },
    {
      key: "actions",
      title: "Actions",
      width: 80,
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
        sortOptions={sortOptions}
        onSort={handleSort}
        columnSelector
        addButton
        addButtonText="Create Customer Group"
        onAddPress={() => {}}
        isLoading={isLoading}
        isStreaming={isStreaming}
        onRefresh={refresh}
        emptyIcon="people-circle-outline"
        emptyText="No groups found"
        totalCount={count}
      />
    </View>
  );
}
