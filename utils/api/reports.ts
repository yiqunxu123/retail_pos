/**
 * Sales Report API Functions
 *
 * Mirrors the Web endpoints from salesReportCrud.js.
 * All report data is fetched directly from the KHUB backend API
 * (not via PowerSync) because reports involve real-time aggregation.
 *
 * Base URLs (from kapp/client/tenant/src/constants/config/index.js):
 *   SALE_REPORT_URL      = /tenant/api/v1/report/sale/order
 *   VELOCITY_REPORT_URL  = /tenant/api/v1/report/sale/order/velocity/price-cost
 *   SALE_FINANCE_URL     = /tenant/api/v1/report/sale/finance
 *   COUNTY_VELOCITY_URL  = /tenant/api/v1/report/msa
 */

import khubApi from './khub';

// ---------------------------------------------------------------------------
// Base paths
// ---------------------------------------------------------------------------

const SALE_REPORT = '/tenant/api/v1/report/sale/order';
const VELOCITY_REPORT = '/tenant/api/v1/report/sale/order/velocity/price-cost';
const SALE_FINANCE = '/tenant/api/v1/report/sale/finance';
const COUNTY_VELOCITY = '/tenant/api/v1/report/msa';
const CUSTOMER_REPORT = '/tenant/api/v1/report/sale/customer';

// ---------------------------------------------------------------------------
// Shared types
// ---------------------------------------------------------------------------

export interface ReportParams {
  start_date?: string;
  end_date?: string;
  page?: number;
  page_size?: number;
  sort_by?: string;
  search_key?: string;
  customer_ids?: string;
  product_ids?: string;
  category_ids?: string;
  brand_ids?: string;
  supplier_ids?: string;
  sale_rep_ids?: string;
  sale_type?: string;
  channel_ids?: string;
  order_type?: string;
  order_status?: string;
  [key: string]: any;
}

export interface ExportParams extends ReportParams {
  export_type?: 'csv' | 'pdf';
  report_name?: string;
  keys?: string[];
  headers?: string[];
}

// ---------------------------------------------------------------------------
// Helper
// ---------------------------------------------------------------------------

function get<T = any>(url: string, params?: ReportParams) {
  return khubApi.get<T>(url, { params });
}

function postExport(url: string, body: ExportParams, params?: ReportParams) {
  return khubApi.post(url, body, { params: { ...params, page_size: -1 } });
}

// ---------------------------------------------------------------------------
// Sales Reports  (mirrored from salesReportCrud.js)
// ---------------------------------------------------------------------------

/** Sales Summary / Sale Commission – product_sales */
export function fetchSalesSummary(params: ReportParams) {
  return get(`${SALE_REPORT}/product_sales`, params);
}
export function exportSalesSummary(body: ExportParams, params: ReportParams) {
  return postExport(`${SALE_REPORT}/product_sales/export`, body, params);
}

/** Item Velocity – product_velocity */
export function fetchItemVelocity(params: ReportParams) {
  return get(`${SALE_REPORT}/product_velocity`, params);
}
export function exportItemVelocity(body: ExportParams, params: ReportParams) {
  return postExport(`${SALE_REPORT}/product_velocity/export`, body, params);
}

/** Customer Velocity – velocity/price-cost */
export function fetchCustomerVelocity(params: ReportParams) {
  return get(VELOCITY_REPORT, params);
}
export function exportCustomerVelocity(body: ExportParams, params: ReportParams) {
  return postExport(`${VELOCITY_REPORT}/export`, body, params);
}

/** Detail Sale / Items Detail – products_sale_detail */
export function fetchDetailSale(params: ReportParams) {
  return get(`${SALE_REPORT}/products_sale_detail`, params);
}
export function exportDetailSale(body: ExportParams, params: ReportParams) {
  return postExport(`${SALE_REPORT}/products_sale_detail/export`, body, params);
}

/** Brand Velocity – brand_velocity */
export function fetchBrandVelocity(params: ReportParams) {
  return get(`${SALE_REPORT}/brand_velocity`, params);
}
export function exportBrandVelocity(body: ExportParams, params: ReportParams) {
  return postExport(`${SALE_REPORT}/brand_velocity/export`, body, params);
}

/** Category Velocity / Category Price – category_price */
export function fetchCategoryVelocity(params: ReportParams) {
  return get(`${SALE_REPORT}/category_price`, params);
}
export function exportCategoryVelocity(body: ExportParams, params: ReportParams) {
  return postExport(`${SALE_REPORT}/category_price/export`, body, params);
}

/** Customer Brand Velocity */
export function fetchCustomerBrandVelocity(params: ReportParams) {
  return get(`${SALE_REPORT}/customer_brand_velocity`, params);
}
export function exportCustomerBrandVelocity(body: ExportParams, params: ReportParams) {
  return postExport(`${SALE_REPORT}/customer_brand_velocity/export`, body, params);
}

/** Customer Category Velocity */
export function fetchCustomerCategoryVelocity(params: ReportParams) {
  return get(`${SALE_REPORT}/customer_category_velocity`, params);
}
export function exportCustomerCategoryVelocity(body: ExportParams, params: ReportParams) {
  return postExport(`${SALE_REPORT}/customer_category_velocity/export`, body, params);
}

/** Customer Product Velocity */
export function fetchCustomerProductVelocity(params: ReportParams) {
  return get(`${SALE_REPORT}/customer_product_velocity`, params);
}
export function exportCustomerProductVelocity(body: ExportParams, params: ReportParams) {
  return postExport(`${SALE_REPORT}/customer_product_velocity/export`, body, params);
}

/** Customer Category Sales */
export function fetchCustomerCategorySales(params: ReportParams) {
  return get(`${SALE_REPORT}/customer_category_sale`, params);
}
export function exportCustomerCategorySales(body: ExportParams, params: ReportParams) {
  return postExport(`${SALE_REPORT}/customer_category_sale/export`, body, params);
}

/** Sales Rep Category */
export function fetchSalesRepCategory(params: ReportParams) {
  return get(`${SALE_REPORT}/sales_rep_category`, params);
}
export function exportSalesRepCategory(body: ExportParams, params: ReportParams) {
  return postExport(`${SALE_REPORT}/sales_rep_category/export`, body, params);
}

/** Sales Rep Product */
export function fetchSalesRepProduct(params: ReportParams) {
  return get(`${SALE_REPORT}/sales_rep_product`, params);
}
export function exportSalesRepProduct(body: ExportParams, params: ReportParams) {
  return postExport(`${SALE_REPORT}/sales_rep_product/export`, body, params);
}

/** Sales Rep Brand */
export function fetchSalesRepBrand(params: ReportParams) {
  return get(`${SALE_REPORT}/sales_rep_brand`, params);
}
export function exportSalesRepBrand(body: ExportParams, params: ReportParams) {
  return postExport(`${SALE_REPORT}/sales_rep_brand/export`, body, params);
}

/** Lost Sale */
export function fetchLostSale(params: ReportParams) {
  return get(`${SALE_REPORT}/lost_sales`, params);
}
export function exportLostSale(body: ExportParams, params: ReportParams) {
  return postExport(`${SALE_REPORT}/lost_sales/export`, body, params);
}

/** Customer Performance (export-only endpoint) */
export function exportCustomerPerformance(body: ExportParams, params: ReportParams) {
  return postExport(`${CUSTOMER_REPORT}/customer_performance_report/export`, body, params);
}

/** County Velocity */
export function fetchCountyVelocity(params: ReportParams) {
  return get(`${COUNTY_VELOCITY}/county-report`, params);
}
export function exportCountyVelocity(body: ExportParams, params: ReportParams) {
  return postExport(`${COUNTY_VELOCITY}/county-report/export`, body, params);
}

/** Invoice History */
export function fetchInvoiceHistory(params: ReportParams) {
  return get(`${SALE_REPORT}/invoice_history`, params);
}
export function exportInvoiceHistory(body: ExportParams, params: ReportParams) {
  return postExport(`${SALE_REPORT}/invoice_history/export`, body, params);
}

/** Customer Invoice Aging */
export function fetchAgingReport(params: ReportParams) {
  return get(`${SALE_REPORT}/aging`, params);
}
export function exportAgingReport(body: ExportParams, params: ReportParams) {
  return postExport(`${SALE_REPORT}/aging/export`, body, params);
}

/** Item Velocity Week-on-Week (export-only) */
export function exportItemVelocityWoW(body: ExportParams, params: ReportParams) {
  return postExport(
    '/tenant/api/v1/report/sale/order/week_on_week_item_velocity/export',
    body,
    params,
  );
}

/** Item Velocity Month-on-Month (export-only) */
export function exportItemVelocityMoM(body: ExportParams, params: ReportParams) {
  return postExport(
    '/tenant/api/v1/report/sale/order/monthly_item_velocity/export',
    body,
    params,
  );
}

/** Customer Velocity Year-on-Year (export-only) */
export function exportCustomerVelocityYoY(body: ExportParams, params: ReportParams) {
  return postExport(
    '/tenant/api/v1/report/sale/order/yoy_customer_velocity_report/export',
    body,
    params,
  );
}

// ---------------------------------------------------------------------------
// Financial Reports (bonus – used by other report categories)
// ---------------------------------------------------------------------------

export function fetchPaymentReceived(params: ReportParams) {
  return get(`${SALE_FINANCE}/payment_receive_report`, params);
}

export function fetchAccountReceivable(params: ReportParams) {
  return get(`${SALE_FINANCE}/account_receivable`, params);
}

export function fetchPaymentLog(params: ReportParams) {
  return get(`${SALE_FINANCE}/payment_log_report`, { ...params, log_report: 1 });
}

export function fetchAccountPayable(params: ReportParams) {
  return get(`${SALE_FINANCE}/supplier_payable`, params);
}

export function fetchDaySummary(params: ReportParams) {
  return get(`${SALE_FINANCE}/day_wise_summery`, params);
}

export function fetchProfitMarginAccrual(params: ReportParams) {
  return get(`${SALE_FINANCE}/profit_margin_report_accrual`, params);
}

export function fetchProfitMarginCash(params: ReportParams) {
  return get(`${SALE_FINANCE}/profit_margin_report_cash_basis`, params);
}

// ---------------------------------------------------------------------------
// Inventory Reports
// ---------------------------------------------------------------------------

const INVENTORY_REPORT = '/tenant/api/v1/report/inv/stock';
const PO_REPORT = '/tenant/api/v1/report/inv/purchase-order';

export function fetchInventoryValuation(params: ReportParams) {
  return get(`${INVENTORY_REPORT}/inventory_valuation_report`, params);
}

export function fetchBackOrder(params: ReportParams) {
  return get(`${INVENTORY_REPORT}/inventory-backorder`, params);
}

export function fetchInventoryAdjustment(params: ReportParams) {
  return get(`${INVENTORY_REPORT}/inventory-adjustment`, params);
}

export function fetchInventorySpotCheck(params: ReportParams) {
  return get(`${INVENTORY_REPORT}/inventory-spot-check`, params);
}

export function fetchOnHold(params: ReportParams) {
  return get(`${INVENTORY_REPORT}/inventory-onhold`, params);
}

export function fetchPartiallyFulfilled(params: ReportParams) {
  return get(`${INVENTORY_REPORT}/partially-fulfilled`, params);
}

// ---------------------------------------------------------------------------
// Purchasing Reports
// ---------------------------------------------------------------------------

export function fetchPurchaseOrderTaxColumns() {
  return get(`${PO_REPORT}/purchase_order_tax_report/columns`);
}

export function fetchSupplierPOReport(params: ReportParams) {
  return get(`${PO_REPORT}/purchase_receive_history_detail`, params);
}

export function fetchPurchaseReceivedHistory(params: ReportParams) {
  return get(`${PO_REPORT}/purchase_receive_history`, params);
}

export function fetchSupplierPaymentLog(params: ReportParams) {
  return get(`${SALE_FINANCE}/supplier_payment_log_report`, { ...params, log_report: 1 });
}

// ---------------------------------------------------------------------------
// Compliance Reports
// ---------------------------------------------------------------------------

export function fetchCaliforniaCigarette() {
  return get(`${PO_REPORT}/california_cigarette_receiving_report`);
}

export function fetchKentuckyTobaccoTax() {
  return get(`${SALE_FINANCE}/kentucky_tobacco_tax_report`);
}

export function fetchKentuckyCigaretteTax() {
  return get(`${SALE_FINANCE}/kentucky_cigarette_tax_report`);
}

// ---------------------------------------------------------------------------
// Background Task Status (for long-running export jobs)
// ---------------------------------------------------------------------------

export function checkTaskStatus(taskId: string) {
  return get(`/tenant/api/v1/core/utils/task/${taskId}`);
}
