/**
 * Application Constants
 * 
 * Aligned with K Web constants from:
 * kapp/server/constants/__init__.py
 * 
 * IMPORTANT: All values below are copied directly from K Web source code.
 * Do NOT change these values without checking K Web first.
 */

// ============================================================================
// Sale Order Status
// Source: kapp/server/constants/__init__.py line 369
// ============================================================================

export const SaleOrderStatus = {
  PENDING: 10,
  PICKER_ASSIGNED: 15,
  IN_PROGRESS: 20,
  PICKING_IN_PROGRESS: 21,
  PICKING_PARKED: 22,
  PICKED: 23,
  PACKING_IN_PROGRESS: 26,
  PACKED: 30,
  PARTIALLY_EXECUTED: 35,
  EXECUTED: 40,
  COMPLETED: 50,
  PARTIALLY_RETURNED: 55,
  RETURNED: 60,
  PARKED: 70,
  DISCARDED: 80,
  VOID: 90,
} as const;

export type SaleOrderStatus = typeof SaleOrderStatus[keyof typeof SaleOrderStatus];

// ============================================================================
// Sale Type
// Source: kapp/server/constants/__init__.py line 321
// ============================================================================

export const SaleType = {
  ORDER: 1,
  RETURN: 2,
} as const;

export type SaleType = typeof SaleType[keyof typeof SaleType];

// ============================================================================
// Payment Status
// Source: kapp/server/constants/__init__.py line 837
// ============================================================================

export const PaymentStatus = {
  PENDING: 1,
  PAID: 2,
  FULLY_REFUNDED: 3,
  PARTIALLY_REFUNDED: 4,
  VOID: 5,
  FAILED: 6,
  UNKNOWN: 7,
  RETURNED: 8,
} as const;

export type PaymentStatus = typeof PaymentStatus[keyof typeof PaymentStatus];

// ============================================================================
// Payment Category
// Source: kapp/server/constants/__init__.py line 291
// ============================================================================

export const PaymentCategory = {
  SALE_RECEIPT: 1,
  SALE_REFUND: 2,
  PURCHASE_PAYMENT: 3,
  PURCHASE_PAYMENT_RETURN: 4,
  MUTUAL_PAYMENT: 5,
  RECHARGE: 6,
  BILL_PAYMENT: 7,
  BILL_PAYMENT_RETURN: 8,
} as const;

export type PaymentCategory = typeof PaymentCategory[keyof typeof PaymentCategory];

// ============================================================================
// Payment Type
// Source: kapp/server/constants/__init__.py line 193
// ============================================================================

export const PaymentType = {
  CASH: 1,
  CHEQUE: 2,
  CREDIT_DEBIT_GATEWAY: 3,
  CASH_ON_DELIVERY: 4,
  WIRE_TRANSFER: 5,
  ON_ACCOUNT: 6,
  MONEY_ORDER: 7,
  CUSTOMER_USE_CREDIT: 8,
  CUSTOMER_ADD_CREDIT: 9,
  SUPPLIER_OVERPAYMENT_USED: 10,
  SUPPLIER_OVERPAYMENT_ADDED: 11,
  GRAIL_PAY: 12,
  CREDIT_DEBIT_TERMINAL: 13,
} as const;

export type PaymentType = typeof PaymentType[keyof typeof PaymentType];

// ============================================================================
// Invoice Status
// Source: kapp/server/constants/__init__.py line 477
// ============================================================================

export const InvoiceStatus = {
  DUE: 1,
  UN_PAID: 2,
  PAID: 3,
  OVER_PAID: 4,
  PARTIALLY_PAID: 5,
  FULLY_REFUNDED: 6,
  PARTIALLY_REFUNDED: 7,
  VOID: 8,
} as const;

export type InvoiceStatus = typeof InvoiceStatus[keyof typeof InvoiceStatus];

// ============================================================================
// Purchase Order Status
// Source: kapp/server/constants/__init__.py line 398
// ============================================================================

export const PurchaseOrderStatus = {
  RETURNED: 1,
  IN_PROGRESS: 2,
  CANCELLED: 3,
  PARTIALLY_RECEIVED: 4,
  RECEIVED: 5,
  CLOSED: 6,
  PARTIALLY_RETURNED: 7,
  PARKED: 8,
} as const;

export type PurchaseOrderStatus = typeof PurchaseOrderStatus[keyof typeof PurchaseOrderStatus];

// ============================================================================
// Shipping Type
// Source: kapp/server/constants/__init__.py line 509
// ============================================================================

export const ShippingType = {
  PICK_UP: 1,
  DELIVERY: 2,
  DROP_OFF: 3,
} as const;

export type ShippingType = typeof ShippingType[keyof typeof ShippingType];

// ============================================================================
// Product Status
// Source: kapp/server/constants/__init__.py line 328
// ============================================================================

export const ProductStatus = {
  ACTIVE: 1,
  INACTIVE: 2,
} as const;

export type ProductStatus = typeof ProductStatus[keyof typeof ProductStatus];

// ============================================================================
// Fulfilment Status (kept for local use, verify against K Web if needed)
// ============================================================================

export const FulfilmentStatus = {
  NOT_FULFILLED: 0,
  PARTIALLY_FULFILLED: 1,
  FULFILLED: 2,
} as const;

export type FulfilmentStatus = typeof FulfilmentStatus[keyof typeof FulfilmentStatus];

// ============================================================================
// Order Type (kept for local use, verify against K Web if needed)
// ============================================================================

export const OrderType = {
  WALK_IN: 0,
  ONLINE: 1,
  PHONE: 2,
  OTHER: 3,
} as const;

export type OrderType = typeof OrderType[keyof typeof OrderType];

// ============================================================================
// Stock Status (kept for local use, verify against K Web if needed)
// ============================================================================

export const StockStatus = {
  IN_HAND: 0,
  BACK_ORDER: 1,
  COMING_SOON: 2,
  HOLD_FREE_SHIPMENT: 3,
  DELIVERED: 7,
} as const;

export type StockStatus = typeof StockStatus[keyof typeof StockStatus];

// ============================================================================
// Render Trace Debug
// ============================================================================

/**
 * Component render tracing is disabled by default.
 * Enable in dev by setting this to true, or from console:
 *   globalThis.__RENDER_TRACE_ENABLED__ = true
 */
export const RENDER_TRACE_ENABLED = true;

/**
 * Verbose mode prints before/after snapshots for changed keys.
 * Can also be toggled in dev console:
 *   globalThis.__RENDER_TRACE_VERBOSE__ = true
 */
export const RENDER_TRACE_VERBOSE = false;

/**
 * Default log throttle per component (ms).
 * Prevents noisy floods while typing in controlled inputs.
 */
export const RENDER_TRACE_THROTTLE_MS = 120;

/**
 * TTPL = Time To Product List.
 * Measures: click "Add Product" -> first product row visible.
 * Enable in dev by setting this to true, or from console:
 *   globalThis.__TTPL_TRACE_ENABLED__ = true
 */
export const TTPL_TRACE_ENABLED = true;

// ============================================================================
// Helper Functions
// ============================================================================

export function getSaleOrderStatusLabel(status: number): string {
  const labels: Record<number, string> = {
    [SaleOrderStatus.PENDING]: 'Pending',
    [SaleOrderStatus.PICKER_ASSIGNED]: 'Picker Assigned',
    [SaleOrderStatus.IN_PROGRESS]: 'In Progress',
    [SaleOrderStatus.PICKING_IN_PROGRESS]: 'Picking In Progress',
    [SaleOrderStatus.PICKING_PARKED]: 'Picking Parked',
    [SaleOrderStatus.PICKED]: 'Picked',
    [SaleOrderStatus.PACKING_IN_PROGRESS]: 'Packing In Progress',
    [SaleOrderStatus.PACKED]: 'Packed',
    [SaleOrderStatus.PARTIALLY_EXECUTED]: 'Partially Executed',
    [SaleOrderStatus.EXECUTED]: 'Executed',
    [SaleOrderStatus.COMPLETED]: 'Completed',
    [SaleOrderStatus.PARTIALLY_RETURNED]: 'Partially Returned',
    [SaleOrderStatus.RETURNED]: 'Returned',
    [SaleOrderStatus.PARKED]: 'Parked',
    [SaleOrderStatus.DISCARDED]: 'Discarded',
    [SaleOrderStatus.VOID]: 'Void',
  };
  return labels[status] || 'Unknown';
}

export function getPaymentStatusLabel(status: number): string {
  const labels: Record<number, string> = {
    [PaymentStatus.PENDING]: 'Pending',
    [PaymentStatus.PAID]: 'Paid',
    [PaymentStatus.FULLY_REFUNDED]: 'Fully Refunded',
    [PaymentStatus.PARTIALLY_REFUNDED]: 'Partially Refunded',
    [PaymentStatus.VOID]: 'Void',
    [PaymentStatus.FAILED]: 'Failed',
    [PaymentStatus.UNKNOWN]: 'Unknown',
    [PaymentStatus.RETURNED]: 'Returned',
  };
  return labels[status] || 'Unknown';
}

export function getPaymentCategoryLabel(category: number): string {
  const labels: Record<number, string> = {
    [PaymentCategory.SALE_RECEIPT]: 'Sale Receipt',
    [PaymentCategory.SALE_REFUND]: 'Sale Refund',
    [PaymentCategory.PURCHASE_PAYMENT]: 'Purchase Payment',
    [PaymentCategory.PURCHASE_PAYMENT_RETURN]: 'Purchase Payment Return',
    [PaymentCategory.MUTUAL_PAYMENT]: 'Mutual Payment',
    [PaymentCategory.RECHARGE]: 'Recharge',
    [PaymentCategory.BILL_PAYMENT]: 'Bill Payment',
    [PaymentCategory.BILL_PAYMENT_RETURN]: 'Bill Payment Return',
  };
  return labels[category] || 'Unknown';
}

export function getFulfilmentStatusLabel(status: number): string {
  const labels: Record<number, string> = {
    [FulfilmentStatus.NOT_FULFILLED]: 'Not Fulfilled',
    [FulfilmentStatus.PARTIALLY_FULFILLED]: 'Partially Fulfilled',
    [FulfilmentStatus.FULFILLED]: 'Fulfilled',
  };
  return labels[status] || 'Unknown';
}

export function isActiveSaleOrder(status: number): boolean {
  return ![
    SaleOrderStatus.VOID,
    SaleOrderStatus.DISCARDED,
  ].includes(status as any);
}

export function isPaymentCompleted(status: number): boolean {
  return status === PaymentStatus.PAID;
}
