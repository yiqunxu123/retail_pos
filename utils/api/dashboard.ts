/**
 * Dashboard API Service
 * 
 * Provides methods to fetch dashboard statistics from KHub API.
 */

import khubApi from './khub';

// ============================================================================
// Types
// ============================================================================

export interface BasicStatsResponse {
  total_products: number;
  total_online_products: number;
  total_categories: number;
  total_brands: number;
  total_customers: number;
  total_suppliers: number;
  total_stock_cost: number;
}

export interface SalesData {
  total_pickup_orders: number;
  total_drop_off_orders: number;
  total_delivery_orders: number;
  total_sales: number;
  paid_amounts: number;
  payable_amount: number;
  receivable_amount: number;
}

export interface InventoryData {
  purchase_orders: Record<string, number>;
  sale_orders: Record<string, number>;
  sales_return: Record<string, number>;
}

export interface DashboardStatsResponse {
  sales_data: SalesData;
  inventory_data: InventoryData;
}

export interface DashboardStatsParams {
  start_date?: string;
  end_date?: string;
  channel_ids?: string;
}

// ============================================================================
// API Methods
// ============================================================================

/**
 * Get basic dashboard statistics (fixed stats)
 * @param channelIds - Optional channel IDs filter
 */
export const getBasicStats = async (channelIds?: string): Promise<BasicStatsResponse> => {
  const params = channelIds ? { channel_ids: channelIds } : {};
  const response = await khubApi.get('/tenant/api/v1/report/dashboard/basic_stats', { params });
  return response.data;
};

/**
 * Get dashboard statistics with date range
 * @param params - Query parameters including start_date, end_date, channel_ids
 */
export const getDashboardStats = async (params: DashboardStatsParams): Promise<DashboardStatsResponse> => {
  const response = await khubApi.get('/tenant/api/v1/report/dashboard/stats', { params });
  return response.data;
};

/**
 * Get stock alerts
 * @param params - Query parameters for filtering stock alerts
 */
export const getStockAlerts = async (params: any) => {
  const response = await khubApi.get('/tenant/api/v1/report/dashboard/stocks', { params });
  return response.data;
};

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Format date for API (YYYY-MM-DDTHH:MM:SS)
 */
export const formatDateForAPI = (date: Date): string => {
  return date.toISOString().slice(0, 19);
};

/**
 * Get default date range (last 30 days)
 */
export const getDefaultDateRange = () => {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 30);
  
  return {
    start_date: formatDateForAPI(startDate),
    end_date: formatDateForAPI(endDate),
  };
};
