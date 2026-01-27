// ============================================================================
// Catalog Types
// ============================================================================

export interface Product {
  id: string;
  variant: boolean;
  name: string;
  onlineSale: boolean;
  netCostPrice: number;
  baseCostPrice: number;
  salePrice: number;
  isMSA: boolean;
  imageUrl?: string;
}

// ============================================================================
// Inventory Types
// ============================================================================

export interface Stock {
  id: string;
  productName: string;
  netCostPrice: number;
  onHold: number;
  salePrice: number;
  sku: string;
  upc: string;
  availableQty: number;
}

export interface StockAlert {
  id: string;
  productName: string;
  skuUpc: string;
  channelName: string;
  categoryName: string;
  availableQty: number;
  backOrderQty: number;
  totalQty: number;
  minQty: number;
  maxQty: number;
}

// ============================================================================
// Customer Types
// ============================================================================

export interface Customer {
  id: string;
  businessName: string;
  name: string;
  allowEcom: boolean;
  onAccountBalance: number;
  isActive: boolean;
}

export interface CustomerGroup {
  id: string;
  groupName: string;
  tier: string;
  noOfCustomers: number;
  noOfProducts: number;
}

/** Simplified customer for order forms */
export interface OrderCustomer {
  id: string;
  name: string;
  email: string;
  phone: string;
}

// ============================================================================
// Order Types
// ============================================================================

export type InvoiceStatus = "Paid" | "Un Paid" | "Partially";

export interface Order {
  id: string;
  orderNumber: string;
  dateTime: string;
  businessName: string;
  customerName: string;
  createdBy: string;
  saleTotal: number;
  invoiceStatus: InvoiceStatus;
}

export interface OrderProduct {
  id: string;
  sku: string;
  name: string;
  price: number;
  quantity: number;
  total: number;
}

export interface Fulfillment {
  id: string;
  businessName: string;
  customerName: string;
  orderNo: string;
  shippingType: string;
  pickerDetails: string;
  pickerAssigned: boolean;
}

// ============================================================================
// Payment Types
// ============================================================================

export type PaymentStatus = "Paid" | "Pending" | "Partial" | "Failed";
export type ScheduleStatus = "N/A" | "Scheduled" | "Overdue";
export type PaymentCategory = "Sale" | "Return" | "Refund";

export interface Payment {
  id: string;
  orderNo: string;
  orderAmount: number;
  businessName: string;
  paymentType: string;
  subType: string;
  scheduleStatus: ScheduleStatus;
  paidAmount: number;
  collectedBy: string;
  paymentStatus: PaymentStatus;
  paymentDetails: string;
  paymentDate: string;
  paymentId: string;
  invoiceNo: string;
  paymentCategory: PaymentCategory;
}

// ============================================================================
// Report Types
// ============================================================================

export interface BrandReport {
  id: string;
  brandName: string;
  qtySold: number;
  salesRevenue: number;
  cost: number;
  margin: number;
  marginPercentage: number;
}

export interface CategoryReport {
  id: string;
  categoryName: string;
  qtySold: number;
  salesRevenue: number;
  cost: number;
  margin: number;
  marginPercentage: number;
}

export interface CustomerCategorySale {
  id: string;
  invoiceDate: string;
  saleOrderNumber: string;
  dateShipped: string;
  customerName: string;
  address: string;
  city: string;
  county: string;
  tea: number;
  milk: number;
  scale: number;
  alaska: number;
  butane: number;
  etc: number;
}

export interface CustomerVelocityData {
  id: string;
  month: string;
  year1Qty: number;
  year1Revenue: number;
  year2Qty: number;
  year2Revenue: number;
  qtyChange: number;
  revenueChange: number;
}

export interface CustomerBrandVelocity {
  id: string;
  customerNo: string;
  customerId: string;
  customerName: string;
  businessName: string;
  brand: string;
  qtySold: number;
  salesRevenue: number;
  cost: number;
  margin: number;
  marginPercentage: number;
}

// ============================================================================
// UI / Component Types
// ============================================================================

export interface OrderStat {
  label: string;
  value: number;
  color: string;
}

/** Color configuration for status badges */
export interface StatusColorConfig {
  bg: string;
  text: string;
}
