/**
 * Enhanced Dashboard Hook
 * 
 * Combines local PowerSync data with server API data for comprehensive dashboard stats.
 * 
 * This hook provides:
 * 1. Real-time local stats from PowerSync (instant updates)
 * 2. Additional server stats from KHub API (more detailed, fetched on demand)
 * 
 * Usage:
 *   const { localStats, serverStats, isLoading, refresh } = useEnhancedDashboard();
 */

import { useCallback, useEffect, useState } from 'react';
import {
    getBasicStats,
    getDashboardStats,
    getDefaultDateRange,
    type BasicStatsResponse,
    type DashboardStatsResponse
} from '../../api/dashboard';
import { useDashboardStats } from './useDashboardStats';

// ============================================================================
// Types
// ============================================================================

export interface EnhancedDashboardData {
  // Local stats from PowerSync
  localStats: {
    totalRevenue: number;
    paidAmount: number;
    receivableAmount: number;
    payableAmount: number;
    extendedStockValue: number;
    deliveryOrdersCount: number;
    customerCount: number;
    productCount: number;
    orderCount: number;
  };
  
  // Server stats from API (optional, loaded on demand)
  serverStats?: {
    basic?: BasicStatsResponse;
    dashboard?: DashboardStatsResponse;
  };
  
  isLoading: boolean;
  error?: string;
}

// ============================================================================
// Hook
// ============================================================================

export function useEnhancedDashboard(options?: {
  fetchServerStats?: boolean;
  dateRange?: { start_date: string; end_date: string };
  channelIds?: string;
}) {
  const { stats: localStats } = useDashboardStats();
  const [serverStats, setServerStats] = useState<{
    basic?: BasicStatsResponse;
    dashboard?: DashboardStatsResponse;
  }>();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>();

  const fetchServerStats = useCallback(async () => {
    if (!options?.fetchServerStats) return;
    
    setIsLoading(true);
    setError(undefined);
    
    try {
      const [basicStatsData, dashboardStatsData] = await Promise.all([
        getBasicStats(options.channelIds),
        getDashboardStats({
          ...(options.dateRange || getDefaultDateRange()),
          channel_ids: options.channelIds,
        }),
      ]);
      
      setServerStats({
        basic: basicStatsData,
        dashboard: dashboardStatsData,
      });
    } catch (err) {
      console.error('Failed to fetch server stats:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch server stats');
    } finally {
      setIsLoading(false);
    }
  }, [options?.fetchServerStats, options?.channelIds, options?.dateRange]);

  useEffect(() => {
    if (options?.fetchServerStats) {
      fetchServerStats();
    }
  }, [fetchServerStats, options?.fetchServerStats]);

  return {
    localStats,
    serverStats,
    isLoading,
    error,
    refresh: fetchServerStats,
  };
}
