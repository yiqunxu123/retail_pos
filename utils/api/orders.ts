/**
 * Sale Orders API
 *
 * Backend endpoints:
 *   POST   /tenant/api/v1/sale/order                       – create sale order
 *   GET    /tenant/api/v1/sale/order/:peculiar_no          – get order by peculiar_no (with public_key)
 *   POST   /tenant/api/v1/sale/order/calc-charges          – calculate order charges/taxes
 */

import khubApi from './khub';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface SaleOrderDetailPayload {
  product_id: number;
  qty: number;
  unit: number; // 1=Piece, 2=Pack, 3=Case, 4=Pallet
  unit_price: number;
  discount: number;
  discount_type: number; // 1=Fixed, 2=Percentage
}

export interface CreateSaleOrderPayload {
  sale_order_details: SaleOrderDetailPayload[];
  customer_id: number | null;
  order_type: number; // 1=Walk-in, 2=Phone, 3=Online, 4=Offsite, 5=Other
  sale_type: number; // 1=Order, 2=Return
  shipping_type: number; // 1=Pickup, 2=Delivery, 3=DropOff
  channel_id: number;
  order_date: string;
  dispatch_date: string;
  due_date: string;
  discount: number;
  discount_type: number;
  delivery_charges: number;
  is_parked?: boolean;
  is_zero_tax_allowed?: boolean;
  payment_detail?: {
    payments: Array<{
      payment_type: number;
      amount: number;
      category: number; // 1 = SALE_RECEIPT, 2 = SALE_REFUND
      reference_number?: string;
      check_no?: string;
      check_date?: string;
      check_acc_title?: string;
      payment_sub_type?: number;
    }>;
    collected_by_id: number;
    payment_date: string; // datetime string
  };
}

/** Product detail within a sale order (from the API response) */
export interface SaleOrderDetailEntity {
  id: number;
  sale_order_id: number;
  product_id: number;
  product?: {
    id: number;
    name: string;
    sku?: string;
    upc?: string;
    retail_upc1?: string;
    images?: string[];
    msrp_price?: number;
    unit_prices?: Record<string, { price?: number; upc?: string }>;
    main_category?: { name?: string };
  };
  name?: string;
  sku?: string;
  upc?: string;
  retail_upc1?: string;
  msrp_price?: number;
  qty: number;
  unit: number;
  unit_price: number;
  price: number;
  discount: number;
  discount_type: number;
  total_price: number;
  tax_amount?: number;
  tax_values?: Array<{ tax: { name: string }; amount: number; value: number }>;
  sale_order_detail_taxes?: Array<{ tax: { name: string }; amount: number; value: number }>;
}

/** Invoice attached to a sale order */
export interface InvoiceEntity {
  id: number;
  status: number;
  sub_total: number;
  total_amount: number;
  total_discount: number;
  paid_amount: number;
  remaining_amount: number;
  due_date?: string;
  payments?: Array<{
    id: number;
    payment_type: number;
    payment_sub_type?: number;
    reference_number?: string;
    payment_date?: string;
    paid_amount: number;
    applied_amount: number;
    remaining_amount: number;
    status: number;
  }>;
}

/** The full sale order entity returned by the API */
export interface SaleOrderEntity {
  id: number;
  no: string;
  peculiar_no?: string;
  status: number;
  sale_type: number;
  order_type: number;
  shipping_type: number;
  channel_id: number;
  customer_id: number | null;
  total_price: number;
  tax: number;
  tax_amount?: number;
  discount: number;
  total_discount?: number;
  delivery_charges: number;
  order_date: string;
  created_at: string;
  updated_at: string;
  created_by?: {
    id: number;
    first_name: string;
    last_name: string;
    username?: string;
  };
  customer?: {
    id: number;
    no?: string;
    business_name: string;
    email?: string;
    business_phone_no?: string;
    balance?: number;
    customer_billing_details?: {
      name?: string;
      address?: string;
      city?: string;
      state?: string;
      country?: string;
      zip_code?: string;
      telephone_num?: string;
    };
  };
  sale_agent?: {
    id: number;
    username?: string;
    first_name?: string;
    last_name?: string;
  };
  sale_order_details: SaleOrderDetailEntity[];
  invoice?: InvoiceEntity;
  sale_order_level_taxes?: Array<{ tax: { name: string }; amount: number; value: number }>;
  sale_order_li_total_taxes?: Array<{ tax: { name: string }; amount: number; value: number }>;
  billing_detail?: Record<string, unknown>;
  shipping_detail?: Record<string, unknown>;
  note?: string;
  external_note?: string;
  pre_order_customer_balance?: number;
  post_order_customer_balance?: number;
  requires_action?: boolean;
}

export interface CreateSaleOrderResponse {
  message: string;
  entity: SaleOrderEntity;
  errors?: string[];
}

// ---------------------------------------------------------------------------
// API functions
// ---------------------------------------------------------------------------

const ORDER_URL = '/tenant/api/v1/sale/order';

/**
 * Create a new sale order (POST /sale/order).
 * For a normal (non-parked) order, omit `is_parked` or set it to false.
 */
export async function createSaleOrder(payload: CreateSaleOrderPayload) {
  return khubApi.post<CreateSaleOrderResponse>(ORDER_URL, payload);
}

/**
 * Get a sale order by its integer ID (authenticated).
 * GET /sale/order/{sale_order_id}?edit=1&include_main_category=1&include_transferable_qty=1
 */
export async function getSaleOrderById(saleOrderId: number) {
  return khubApi.get<{ entity: SaleOrderEntity }>(
    `${ORDER_URL}/${saleOrderId}`,
    {
      params: {
        edit: 1,
        include_main_category: 1,
        include_transferable_qty: 1,
      },
    }
  );
}

/**
 * Get a sale order by its peculiar_no (URL-safe base64 encoded order number).
 * This is what the web uses on the public invoice page: GET /sale/order/{peculiar_no}?public_key=...
 */
export async function getSaleOrderByNo(peculiarNo: string, publicKey?: string) {
  return khubApi.get<{ entity: SaleOrderEntity }>(
    `${ORDER_URL}/${peculiarNo}`,
    {
      params: {
        public_key: publicKey || '',
        include_main_category: 1,
        include_transferable_qty: 1,
      },
    }
  );
}
