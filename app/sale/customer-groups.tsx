/**
 * Customer Groups Screen
 * Uses the unified DataTable component
 * 
 * Data source: customer_groups table
 * Missing fields (showing "-"):
 * - tier: Not in DB
 * - noOfProducts: Needs aggregate query
 */

import { Ionicons } from "@expo/vector-icons";
import { Pressable, Text, View } from "react-native";
import { ColumnDefinition, DataTable, PageHeader } from "../../components";
import { CustomerGroupView, useCustomerGroups } from "../../utils/powersync/hooks";

// ============================================================================
// Main Component
// ============================================================================

export default function CustomerGroupsScreen() {
  const { groups, isLoading, isStreaming, refresh, count } = useCustomerGroups();

  // 列配置
  const columns: ColumnDefinition<CustomerGroupView>[] = [
    {
      key: "name",
      title: "Group Name",
      width: "flex",
      visible: true,
      hideable: false,
      render: (item) => (
        <View>
          <Text className="text-gray-800 font-medium">{item.name || "-"}</Text>
          {item.description && (
            <Text className="text-gray-500 text-sm" numberOfLines={1}>{item.description}</Text>
          )}
        </View>
      ),
    },
    {
      key: "tier",
      title: "Tier",
      width: 80,
      align: "center",
      visible: true,
      render: () => <Text className="text-gray-400">-</Text>,
    },
    {
      key: "customerCount",
      title: "Customers",
      width: 110,
      align: "center",
      visible: true,
      render: (item) => <Text className="text-gray-700">{item.customerCount}</Text>,
    },
    {
      key: "products",
      title: "Products",
      width: 110,
      align: "center",
      visible: true,
      render: () => <Text className="text-gray-400">-</Text>,
    },
    {
      key: "actions",
      title: "Actions",
      width: 70,
      align: "center",
      visible: true,
      hideable: false,
      render: () => (
        <Pressable>
          <Ionicons name="ellipsis-horizontal" size={20} color="#9ca3af" />
        </Pressable>
      ),
    },
  ];

  // 排序选项
  const sortOptions = [
    { label: "Name (A-Z)", value: "name_asc" },
    { label: "Name (Z-A)", value: "name_desc" },
  ];

  const handleSearch = (item: CustomerGroupView, query: string) => {
    const q = query.toLowerCase();
    return (
      item.name.toLowerCase().includes(q) ||
      item.description.toLowerCase().includes(q)
    );
  };

  const handleSort = (data: CustomerGroupView[], sortBy: string | null) => {
    if (!sortBy) return data;
    const sorted = [...data];
    switch (sortBy) {
      case "name_asc": return sorted.sort((a, b) => a.name.localeCompare(b.name));
      case "name_desc": return sorted.sort((a, b) => b.name.localeCompare(a.name));
      default: return sorted;
    }
  };

  return (
    <View className="flex-1 bg-gray-50">
      <PageHeader title="Customer Groups" />

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
