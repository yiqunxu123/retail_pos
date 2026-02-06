/**
 * Report Page Component
 * 
 * Generic page component for displaying reports with filters and export
 */

import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import { ActivityIndicator, Alert, Pressable, Text, View } from "react-native";
import khubApi from "../utils/api/khub";
import { ColumnDefinition, DataTable } from "./DataTable";
import { PageHeader } from "./PageHeader";
import { ReportFilter, ReportFilterValues } from "./ReportFilter";

interface ReportPageProps<T = any> {
  title: string;
  apiEndpoint: string;
  columns: ColumnDefinition<T>[];
  keyExtractor: (item: T) => string;
  defaultFilters?: ReportFilterValues;
  showCustomerFilter?: boolean;
  showSearchFilter?: boolean;
  additionalFilters?: React.ReactNode;
  transformData?: (data: any) => T[];
}

export function ReportPage<T = any>({
  title,
  apiEndpoint,
  columns,
  keyExtractor,
  defaultFilters,
  showCustomerFilter = false,
  showSearchFilter = false,
  additionalFilters,
  transformData,
}: ReportPageProps<T>) {
  const [data, setData] = useState<T[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showFilter, setShowFilter] = useState(false);
  const [filters, setFilters] = useState<ReportFilterValues>(
    defaultFilters || {
      startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split('T')[0],
      endDate: new Date().toISOString().split('T')[0],
    }
  );

  // Fetch report data
  const fetchReport = async (appliedFilters: ReportFilterValues) => {
    setIsLoading(true);
    try {
      const params: any = {
        start_date: appliedFilters.startDate,
        end_date: appliedFilters.endDate,
      };

      if (appliedFilters.searchKey) {
        params.search_key = appliedFilters.searchKey;
      }

      if (appliedFilters.customerId) {
        params.customer_id = appliedFilters.customerId;
      }

      const response = await khubApi.get(apiEndpoint, { params });
      
      let reportData = response.data.entities || response.data.data || [];
      
      // Transform data if needed
      if (transformData) {
        reportData = transformData(reportData);
      }

      setData(reportData);
    } catch (error: any) {
      console.error('Failed to fetch report:', error);

      // 401 is handled by the interceptor + AuthContext (auto-logout),
      // so only show alerts for non-auth errors.
      if (error.response?.status === 401) {
        Alert.alert('Session Expired', 'Your session has expired. Please log in again.');
      } else {
        Alert.alert(
          'Error',
          error.response?.data?.message || 'Failed to load report data'
        );
      }
      setData([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Load report on mount and when filters change
  useEffect(() => {
    fetchReport(filters);
  }, []);

  const handleApplyFilters = (newFilters: ReportFilterValues) => {
    setFilters(newFilters);
    fetchReport(newFilters);
  };

  const handleExport = async () => {
    try {
      const params: any = {
        start_date: filters.startDate,
        end_date: filters.endDate,
        export_type: 'csv',
      };

      if (filters.searchKey) {
        params.search_key = filters.searchKey;
      }

      if (filters.customerId) {
        params.customer_id = filters.customerId;
      }

      const response = await khubApi.get(`${apiEndpoint}/export`, { params });
      
      const downloadUrl = response.data.download_url || response.data.url;
      
      if (downloadUrl) {
        Alert.alert('Export Ready', 'Your export is ready. Download link has been generated.');
        // TODO: Implement actual download with Linking or expo-file-system
      } else {
        Alert.alert('Export Started', 'Your export is being generated. Check back in a few minutes.');
      }
    } catch (error: any) {
      console.error('Failed to export report:', error);
      Alert.alert(
        'Export Failed',
        error.response?.data?.message || 'Failed to export report'
      );
    }
  };

  return (
    <View className="flex-1 bg-gray-50">
      <PageHeader title={title} />

      {/* Filter Bar */}
      <View className="bg-white px-4 py-3 border-b border-gray-200">
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center gap-2">
            <Ionicons name="calendar-outline" size={20} color="#6B7280" />
            <Text className="text-sm text-gray-600">
              {filters.startDate} to {filters.endDate}
            </Text>
          </View>
          <View className="flex-row gap-2">
            <Pressable
              onPress={() => setShowFilter(true)}
              className="flex-row items-center gap-2 px-4 py-2 rounded-lg border-2"
              style={{ borderColor: "#EC1A52" }}
            >
              <Ionicons name="filter-outline" size={18} color="#EC1A52" />
              <Text className="font-semibold" style={{ color: "#EC1A52" }}>
                Filter
              </Text>
            </Pressable>
            <Pressable
              onPress={handleExport}
              className="flex-row items-center gap-2 px-4 py-2 rounded-lg"
              style={{ backgroundColor: "#EC1A52" }}
            >
              <Ionicons name="download-outline" size={18} color="white" />
              <Text className="font-semibold text-white">Export</Text>
            </Pressable>
          </View>
        </View>
      </View>

      {/* Report Data */}
      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#EC1A52" />
          <Text className="mt-4 text-gray-600">Loading report...</Text>
        </View>
      ) : (
        <DataTable<T>
          data={data}
          columns={columns}
          keyExtractor={keyExtractor}
          isLoading={isLoading}
          onRefresh={() => fetchReport(filters)}
          emptyIcon="document-text-outline"
          emptyText="No data available for selected date range"
          totalCount={data.length}
        />
      )}

      {/* Filter Modal */}
      <ReportFilter
        visible={showFilter}
        onClose={() => setShowFilter(false)}
        onApply={handleApplyFilters}
        initialValues={filters}
        showCustomer={showCustomerFilter}
        showSearch={showSearchFilter}
        additionalFilters={additionalFilters}
      />
    </View>
  );
}
