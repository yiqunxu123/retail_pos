import khubApi from "./khub";

const STOCKS_BULK_EDIT_URL = "/tenant/api/v1/catalog/products/bulk_update_stock";

export interface BulkStockUpdateItem {
  product_id: number;
  channel_id: number;
  available_qty: number;
  on_hold_qty: number;
  back_order_qty: number;
  hold_free_shipment: number;
  stock_qty_data: Record<number, number>;
}

export async function bulkUpdateStocks(payload: BulkStockUpdateItem[]) {
  return khubApi.post(STOCKS_BULK_EDIT_URL, payload);
}

