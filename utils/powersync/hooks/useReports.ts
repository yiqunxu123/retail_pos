/**
 * Reports Data Hooks
 * 
 * Provides aggregated report data from PowerSync.
 * Reports aggregate data from sale_order_details, products, brands, categories, customers.
 * 
 * Usage:
 *   const { reports, isLoading } = useBrandVelocityReport();
 *   const { reports, isLoading } = useCategoryVelocityReport();
 */

import { useMemo } from 'react';
import { useSyncStream } from '../useSyncStream';

// ============================================================================
// Types
// ============================================================================

/** Brand velocity report row */
export interface BrandReportView {
  id: string;
  brandName: string;
  qtySold: number;
  salesRevenue: number;
  cost: number;
  margin: number;
  marginPercentage: number;
}

/** Category velocity report row */
export interface CategoryReportView {
  id: string;
  categoryName: string;
  qtySold: number;
  salesRevenue: number;
  cost: number;
  margin: number;
  marginPercentage: number;
}

/** Customer sales report row */
export interface CustomerSalesReportView {
  id: string;
  orderNo: string;
  orderDate: string;
  customerId: string;
  customerName: string;
  businessName: string;
  city: string;
  totalAmount: number;
}

/** Customer velocity (YOY) report row */
export interface CustomerVelocityView {
  id: string;
  customerNo: string;
  customerId: string;
  customerName: string;
  businessName: string;
  qtySold: number;
  salesRevenue: number;
  cost: number;
  margin: number;
  marginPercentage: number;
}

// ============================================================================
// Raw DB Types
// ============================================================================

interface BrandReportRow {
  brand_id: string;
  brand_name: string;
  qty_sold: number;
  sales_revenue: number;
  cost: number;
}

interface CategoryReportRow {
  category_id: string;
  category_name: string;
  qty_sold: number;
  sales_revenue: number;
  cost: number;
}

interface CustomerSalesRow {
  id: string;
  no: string;
  order_date: string;
  customer_id: string;
  customer_name: string;
  business_name: string;
  city: string;
  total_price: number;
}

interface CustomerVelocityRow {
  customer_id: string;
  customer_no: string;
  customer_name: string;
  business_name: string;
  qty_sold: number;
  sales_revenue: number;
  cost: number;
}

// ============================================================================
// Hooks
// ============================================================================

/** Get brand velocity report - sales aggregated by brand */
export function useBrandVelocityReport() {
  const { data, isLoading, error, isStreaming, refresh } = useSyncStream<BrandReportRow>(
    `SELECT 
      b.id as brand_id,
      b.name as brand_name,
      COALESCE(SUM(sod.qty), 0) as qty_sold,
      COALESCE(SUM(sod.total_price), 0) as sales_revenue,
      COALESCE(SUM(sod.qty * up.cost), 0) as cost
     FROM brands b
     LEFT JOIN products p ON b.id = p.brand_id
     LEFT JOIN sale_order_details sod ON p.id = sod.product_id
     LEFT JOIN unit_prices up ON p.id = up.product_id AND sod.channel_id = up.channel_id
     GROUP BY b.id, b.name
     HAVING SUM(sod.qty) > 0 OR 1=1
     ORDER BY sales_revenue DESC`
  );

  const reports = useMemo<BrandReportView[]>(() => 
    data.map(row => {
      const margin = row.sales_revenue - row.cost;
      const marginPercentage = row.sales_revenue > 0 ? (margin / row.sales_revenue) * 100 : 0;
      return {
        id: String(row.brand_id),
        brandName: row.brand_name || 'Unknown',
        qtySold: row.qty_sold || 0,
        salesRevenue: row.sales_revenue || 0,
        cost: row.cost || 0,
        margin,
        marginPercentage,
      };
    }), [data]);

  return { reports, isLoading, error, isStreaming, refresh, count: reports.length };
}

/** Get category velocity report - sales aggregated by category */
export function useCategoryVelocityReport() {
  const { data, isLoading, error, isStreaming, refresh } = useSyncStream<CategoryReportRow>(
    `SELECT 
      c.id as category_id,
      c.name as category_name,
      COALESCE(SUM(sod.qty), 0) as qty_sold,
      COALESCE(SUM(sod.total_price), 0) as sales_revenue,
      COALESCE(SUM(sod.qty * up.cost), 0) as cost
     FROM categories c
     LEFT JOIN products p ON c.id = p.main_category_id
     LEFT JOIN sale_order_details sod ON p.id = sod.product_id
     LEFT JOIN unit_prices up ON p.id = up.product_id AND sod.channel_id = up.channel_id
     GROUP BY c.id, c.name
     HAVING SUM(sod.qty) > 0 OR 1=1
     ORDER BY sales_revenue DESC`
  );

  const reports = useMemo<CategoryReportView[]>(() => 
    data.map(row => {
      const margin = row.sales_revenue - row.cost;
      const marginPercentage = row.sales_revenue > 0 ? (margin / row.sales_revenue) * 100 : 0;
      return {
        id: String(row.category_id),
        categoryName: row.category_name || 'Unknown',
        qtySold: row.qty_sold || 0,
        salesRevenue: row.sales_revenue || 0,
        cost: row.cost || 0,
        margin,
        marginPercentage,
      };
    }), [data]);

  return { reports, isLoading, error, isStreaming, refresh, count: reports.length };
}

/** Get customer sales report - orders with customer info */
export function useCustomerSalesReport() {
  const { data, isLoading, error, isStreaming, refresh } = useSyncStream<CustomerSalesRow>(
    `SELECT 
      so.id,
      so.no,
      so.order_date,
      so.customer_id,
      c.name as customer_name,
      c.business_name,
      c.business_city as city,
      so.total_price
     FROM sale_orders so
     LEFT JOIN customers c ON so.customer_id = c.id
     ORDER BY so.order_date DESC`
  );

  const reports = useMemo<CustomerSalesReportView[]>(() => 
    data.map(row => ({
      id: String(row.id),
      orderNo: row.no || '',
      orderDate: row.order_date || '',
      customerId: String(row.customer_id || ''),
      customerName: row.customer_name || '',
      businessName: row.business_name || '',
      city: row.city || '',
      totalAmount: row.total_price || 0,
    })), [data]);

  return { reports, isLoading, error, isStreaming, refresh, count: reports.length };
}

/** Get customer velocity report - sales aggregated by customer */
export function useCustomerVelocityReport() {
  const { data, isLoading, error, isStreaming, refresh } = useSyncStream<CustomerVelocityRow>(
    `SELECT 
      c.id as customer_id,
      c.no as customer_no,
      c.name as customer_name,
      c.business_name,
      COALESCE(SUM(sod.qty), 0) as qty_sold,
      COALESCE(SUM(sod.total_price), 0) as sales_revenue,
      COALESCE(SUM(sod.qty * up.cost), 0) as cost
     FROM customers c
     LEFT JOIN sale_orders so ON c.id = so.customer_id
     LEFT JOIN sale_order_details sod ON so.id = sod.sale_order_id
     LEFT JOIN unit_prices up ON sod.product_id = up.product_id AND sod.channel_id = up.channel_id
     GROUP BY c.id, c.no, c.name, c.business_name
     HAVING SUM(sod.qty) > 0 OR 1=1
     ORDER BY sales_revenue DESC`
  );

  const reports = useMemo<CustomerVelocityView[]>(() => 
    data.map(row => {
      const margin = row.sales_revenue - row.cost;
      const marginPercentage = row.sales_revenue > 0 ? (margin / row.sales_revenue) * 100 : 0;
      return {
        id: String(row.customer_id),
        customerNo: row.customer_no || '',
        customerId: String(row.customer_id),
        customerName: row.customer_name || '',
        businessName: row.business_name || '',
        qtySold: row.qty_sold || 0,
        salesRevenue: row.sales_revenue || 0,
        cost: row.cost || 0,
        margin,
        marginPercentage,
      };
    }), [data]);

  return { reports, isLoading, error, isStreaming, refresh, count: reports.length };
}
