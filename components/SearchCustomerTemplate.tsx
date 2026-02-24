/**
 * SearchCustomerTemplate - 公共客户搜索 UI 模板组件
 *
 * 结构与 ProductSearchTemplate 一致：标题 + 搜索框 + 结果列表。
 * 可嵌入页面或弹窗。
 *
 * Usage:
 *   <SearchCustomerTemplate
 *     title="Search for Customer by:"
 *     searchQuery={query}
 *     onSearchChange={setQuery}
 *     customers={customers}
 *     isLoading={loading}
 *     onSelectCustomer={handleSelect}
 *     rightContent={<SaveButton />}
 *     listMaxHeight={320}
 *   />
 */

import { colors, iconSize } from '@/utils/theme';
import { Ionicons } from "@expo/vector-icons";
import React, { useCallback } from "react";
import {
  ActivityIndicator,
  FlatList,
  ListRenderItemInfo,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import type { CustomerEntity } from "../utils/api/customers";

export interface SearchCustomerTemplateProps {
  title?: string;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  searchPlaceholder?: string;
  customers: CustomerEntity[];
  isLoading?: boolean;
  onSelectCustomer: (customer: CustomerEntity) => void;
  emptyMessage?: string;
  rightContent?: React.ReactNode;
  /** Max height for list when used with form below (e.g. Add Customer page) */
  listMaxHeight?: number;
  /** Custom render for customer row */
  renderCustomerRow?: (item: CustomerEntity, index: number) => React.ReactElement;
}

const DEFAULT_EMPTY_MESSAGE = "No customers found";

function formatBillingAddress(
  billing?: { address?: string; city?: string; county?: string; state?: string; country?: string } | null
): string {
  if (!billing) return "";
  return [billing.address, billing.city, billing.county, billing.state, billing.country]
    .filter(Boolean)
    .join(", ");
}

function getCustomerTypeLabel(customerType: number | null | undefined): string {
  const labels: Record<number, string> = { 1: "Walk In", 2: "Online" };
  return customerType ? (labels[customerType] || "N/A") : "N/A";
}

function DefaultCustomerRow({
  item,
  onPress,
}: {
  item: CustomerEntity;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      className="border border-gray-200 rounded-xl px-3 py-3 mb-2 mx-2"
      style={({ pressed }) => ({
        backgroundColor: pressed ? "#f4f5f6" : colors.backgroundTertiary,
        opacity: item.is_active === false ? 0.55 : 1,
      })}
    >
      <Text className="text-gray-900 text-sm font-semibold">
        {item.business_name}
        {item.name ? `, ${item.name}` : ""}
      </Text>
      <Text className="text-gray-600 text-sm mt-1">
        Phone: {item.business_phone_no || "N/A"}
      </Text>
      <Text className="text-gray-600 text-sm">Email: {item.email || "N/A"}</Text>
      {formatBillingAddress(item.customer_billing_details) !== "" && (
        <Text className="text-gray-600 text-sm">
          Address: {formatBillingAddress(item.customer_billing_details)}
        </Text>
      )}
      <Text className="text-gray-600 text-sm">Customer No: {item.no || "N/A"}</Text>
      <Text className="text-gray-600 text-sm">
        Customer Type: {getCustomerTypeLabel(item.customer_type ?? null)}
      </Text>
      {item.is_active === false && (
        <Text className="text-red-500 text-sm mt-0.5 font-medium">Inactive</Text>
      )}
    </Pressable>
  );
}

export function SearchCustomerTemplate({
  title = "Search for Customer by:",
  searchQuery,
  onSearchChange,
  searchPlaceholder = "Customer Name / Business Name / ID / Email / Phone",
  customers,
  isLoading = false,
  onSelectCustomer,
  emptyMessage = DEFAULT_EMPTY_MESSAGE,
  rightContent,
  listMaxHeight,
  renderCustomerRow,
}: SearchCustomerTemplateProps) {
  const keyExtractor = useCallback((item: CustomerEntity) => String(item.id), []);

  const renderItem = useCallback(
    ({ item, index }: ListRenderItemInfo<CustomerEntity>) => {
      if (renderCustomerRow) {
        return renderCustomerRow(item, index);
      }
      return (
        <DefaultCustomerRow
          item={item}
          onPress={() => onSelectCustomer(item)}
        />
      );
    },
    [onSelectCustomer, renderCustomerRow]
  );

  const listContainerStyle = listMaxHeight
    ? [styles.listContainerConstrained, { height: listMaxHeight }]
    : styles.listContainer;

  const containerStyle = listMaxHeight
    ? [styles.container, styles.containerEmbedded]
    : styles.container;

  return (
    <View style={containerStyle}>
      {/* Header - same as ProductSearchTemplate */}
      <View className="px-6 pt-6 pb-4 bg-white border-b border-gray-200">
        <View className="flex-row items-center justify-between mb-4">
          <Text className="text-2xl font-bold" style={{ color: colors.primary }}>
            {title}
          </Text>
          {rightContent}
        </View>

        {/* Search Input - same style as ProductSearchTemplate */}
        <View
          className="flex-row items-center bg-white border-2 rounded-xl px-3 py-3 shadow-sm"
          style={{ borderColor: colors.primary }}
        >
          <Ionicons name="search" size={iconSize.xl} color={colors.primary} />
          <TextInput
            className="flex-1 ml-3 text-gray-800 text-lg"
            style={{ fontWeight: "500" }}
            placeholder={searchPlaceholder}
            placeholderTextColor={colors.textTertiary}
            value={searchQuery}
            onChangeText={onSearchChange}
            autoFocus={false}
          />
          {searchQuery.length > 0 && (
            <Pressable onPress={() => onSearchChange("")}>
              <Ionicons
                name="close-circle"
                size={iconSize.lg}
                color={colors.textTertiary}
              />
            </Pressable>
          )}
        </View>
      </View>

      {/* Content */}
      {isLoading ? (
        <View className="flex-1 items-center justify-center py-16">
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : customers.length === 0 ? (
        <View className="flex-1 items-center justify-center py-16">
          <Ionicons
            name="people-outline"
            size={iconSize['5xl']}
            color={colors.borderMedium}
          />
          <Text className="text-gray-400 mt-4 text-lg">{emptyMessage}</Text>
        </View>
      ) : (
        <View style={listContainerStyle}>
          <FlatList
            data={customers}
            keyExtractor={keyExtractor}
            renderItem={renderItem}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ paddingVertical: 12, paddingBottom: 20 }}
            initialNumToRender={10}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  containerEmbedded: {
    flex: 0,
  },
  listContainer: {
    flex: 1,
  },
  listContainerConstrained: {
    flexGrow: 0,
    flexShrink: 0,
  },
});
