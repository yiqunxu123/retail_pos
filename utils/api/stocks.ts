import khubApi from "./khub";

const STOCKS_BULK_EDIT_URL = "/tenant/api/v1/catalog/products/bulk_update_stock";
const STOCKS_GET_URL = "/tenant/api/v1/inventory/stocks/get";
const STOCKS_UPDATE_URL = "/tenant/api/v1/inventory/stocks/update";

export interface BulkStockUpdateItem {
  product_id: number;
  channel_id: number;
  available_qty: number;
  on_hold_qty: number;
  back_order_qty: number;
  hold_free_shipment: number;
  stock_qty_data: Record<number, number>;
}

export interface StockChannelInfo {
  channel_id: number | string;
  channel_name?: string | null;
  in_hand?: number | null;
  on_hold?: number | null;
  damaged?: number | null;
  min_qty?: number | null;
  max_qty?: number | null;
  back_order?: number | null;
  coming_soon?: number | null;
  hold_free_shipment?: number | null;
  lowest_unit_definition?: number | null;
  sold_by_unit?: number | string | null;
  [key: string]: unknown;
}

export interface StockDetailEntity {
  product_id: number;
  product_name?: string | null;
  product_qty?: number | null;
  channel_info?: StockChannelInfo[];
  [key: string]: unknown;
}

export interface UpdateStockPayload {
  product_id: number;
  channel_info: StockChannelInfo[];
}

export async function bulkUpdateStocks(payload: BulkStockUpdateItem[]) {
  return khubApi.post(STOCKS_BULK_EDIT_URL, payload);
}

export async function getStockByProductId(productId: number) {
  const response = await khubApi.get(STOCKS_GET_URL, {
    params: { product_id: productId },
  });
  return response.data?.entity?.[0] as StockDetailEntity | undefined;
}

export async function updateStocks(payload: UpdateStockPayload) {
  return khubApi.post(STOCKS_UPDATE_URL, payload);
}
