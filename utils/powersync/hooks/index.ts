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
export { useCustomerById, useCustomers, useCustomerSearch } from './useCustomers';
export type { CustomerView } from './useCustomers';

// Customer Groups hooks
export { useCustomerGroupById, useCustomerGroups } from './useCustomerGroups';
export type { CustomerGroupView } from './useCustomerGroups';

// Product hooks
export { useProductById, useProducts, useProductSearch } from './useProducts';
export type { ProductView } from './useProducts';

// Stock hooks
export { useStockAlerts, useStocks, useStockSearch } from './useStocks';
export type { StockView } from './useStocks';

// Sale order hooks
export { FULFILMENT_STATUS, ORDER_STATUS, useSaleOrderById, useSaleOrders, useSaleOrderSearch } from './useSaleOrders';
export type { SaleOrderView } from './useSaleOrders';

// Payment hooks
export { PAYMENT_STATUS, PAYMENT_TYPE, usePaymentById, usePayments, usePaymentSearch } from './usePayments';
export type { PaymentView } from './usePayments';

// Dashboard stats hooks
export { useDashboardStats } from './useDashboardStats';
export type { DashboardStats } from './useDashboardStats';

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

