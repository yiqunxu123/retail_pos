/**
 * PowerSync Data Hooks
 * 
 * Centralized exports for all data hooks.
 * Each hook provides real-time synced data from PowerSync.
 * 
 * Architecture:
 * - hooks/useXxx.ts    - Data fetching hooks
 * - schema.ts          - Database schema definitions
 * - useSyncStream.ts   - Base streaming hook
 * 
 * Usage:
 *   import { useCustomers, useProducts, useStocks } from '@/utils/powersync/hooks';
 */

// Customer hooks
export { useCustomerById, useCustomerSearch, useCustomers } from './useCustomers';
export type { CustomerView } from './useCustomers';

// Customer Groups hooks
export { useCustomerGroupById, useCustomerGroups } from './useCustomerGroups';
export type { CustomerGroupView } from './useCustomerGroups';

// Category hooks
export { useCategories } from './useCategories';
export type { CategoryView } from './useCategories';

// Product hooks
export { useProductById, useProductSearch, useProducts, useProductsByCategory } from './useProducts';
export type { ProductView } from './useProducts';

// Stock hooks
export { useStockAlerts, useStockSearch, useStocks } from './useStocks';
export type { StockView, StocksQueryFilters } from './useStocks';

// Sale order hooks
export { FULFILMENT_STATUS, ORDER_STATUS, fetchSaleOrderProducts, useParkedOrders, useSaleOrderById, useSaleOrderSearch, useSaleOrders } from './useSaleOrders';
export type { ParkedOrderView, ResolvedOrderProduct, SaleOrderView } from './useSaleOrders';

// Payment hooks
export { PAYMENT_STATUS, PAYMENT_TYPE, usePaymentById, usePaymentSearch, usePayments } from './usePayments';
export type { PaymentView } from './usePayments';

// Dashboard stats hooks
export { useDashboardStats } from './useDashboardStats';
export type { DashboardFilters, DashboardStats } from './useDashboardStats';

// Channel hooks
export { useChannels } from './useChannels';
export type { Channel } from './useChannels';

// Cash management hooks
export { useCashManagement } from './useCashManagement';
export type { CashSummary } from './useCashManagement';

// Report hooks
export {
    useBrandVelocityReport,
    useCategoryVelocityReport,
    useCustomerSalesReport,
    useCustomerVelocityReport
} from './useReports';
export type {
    BrandReportView,
    CategoryReportView,
    CustomerSalesReportView,
    CustomerVelocityView
} from './useReports';

