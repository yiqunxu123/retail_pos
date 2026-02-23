/**
 * Report Filter Component
 * 
 * Generic filter component for reports with date range and basic filters
 */

import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { Modal, Pressable, ScrollView, Text, View } from "react-native";
import { iconSize, colors } from "@/utils/theme";
import { FormInput } from "./FormInput";

export interface ReportFilterValues {
  startDate: string;
  endDate: string;
  searchKey?: string;
  customerId?: string;
  [key: string]: any;
}

interface ReportFilterProps {
  visible: boolean;
  onClose: () => void;
  onApply: (filters: ReportFilterValues) => void;
  initialValues?: ReportFilterValues;
  showCustomer?: boolean;
  showSearch?: boolean;
  additionalFilters?: React.ReactNode;
}

export function ReportFilter({
  visible,
  onClose,
  onApply,
  initialValues,
  showCustomer = false,
  showSearch = false,
  additionalFilters,
}: ReportFilterProps) {
  const today = new Date().toISOString().split('T')[0];
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split('T')[0];

  const [filters, setFilters] = useState<ReportFilterValues>({
    startDate: initialValues?.startDate || thirtyDaysAgo,
    endDate: initialValues?.endDate || today,
    searchKey: initialValues?.searchKey || '',
    customerId: initialValues?.customerId || '',
  });

  const handleApply = () => {
    onApply(filters);
    onClose();
  };

  const handleReset = () => {
    const resetFilters = {
      startDate: thirtyDaysAgo,
      endDate: today,
      searchKey: '',
      customerId: '',
    };
    setFilters(resetFilters);
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View className="flex-1 bg-black/50">
        <View className="flex-1 mt-20 bg-white rounded-t-3xl">
          {/* Header */}
          <View className="flex-row items-center justify-between p-4 border-b border-gray-200">
            <Text className="text-xl font-bold text-gray-800">Filter Report</Text>
            <Pressable onPress={onClose} className="p-2">
              <Ionicons name="close" size={iconSize.xl} color={colors.textMedium} />
            </Pressable>
          </View>

          {/* Filter Content */}
          <ScrollView className="flex-1 p-4">
            {/* Date Range */}
            <View className="mb-4">
              <Text className="text-sm font-semibold text-gray-700 mb-2">
                Date Range
              </Text>
              <View className="flex-row gap-2">
                <View className="flex-1">
                  <FormInput
                    label="Start Date"
                    value={filters.startDate}
                    onChangeText={(text) => setFilters({ ...filters, startDate: text })}
                    placeholder="YYYY-MM-DD"
                  />
                </View>
                <View className="flex-1">
                  <FormInput
                    label="End Date"
                    value={filters.endDate}
                    onChangeText={(text) => setFilters({ ...filters, endDate: text })}
                    placeholder="YYYY-MM-DD"
                  />
                </View>
              </View>
            </View>

            {/* Search Key */}
            {showSearch && (
              <View className="mb-4">
                <FormInput
                  label="Search"
                  value={filters.searchKey}
                  onChangeText={(text) => setFilters({ ...filters, searchKey: text })}
                  placeholder="Search orders, products..."
                />
              </View>
            )}

            {/* Customer ID */}
            {showCustomer && (
              <View className="mb-4">
                <FormInput
                  label="Customer ID (Optional)"
                  value={filters.customerId}
                  onChangeText={(text) => setFilters({ ...filters, customerId: text })}
                  placeholder="Enter customer ID"
                />
              </View>
            )}

            {/* Additional Filters */}
            {additionalFilters}
          </ScrollView>

          {/* Action Buttons */}
          <View className="p-4 border-t border-gray-200">
            <View className="flex-row gap-3">
              <Pressable
                onPress={handleReset}
                className="flex-1 py-3 rounded-lg border-2 border-gray-300"
              >
                <Text className="text-center font-semibold text-gray-700">
                  Reset
                </Text>
              </Pressable>
              <Pressable
                onPress={handleApply}
                className="flex-1 py-3 rounded-lg"
                style={{ backgroundColor: colors.primary }}
              >
                <Text className="text-center font-semibold text-white">
                  Apply Filters
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}
