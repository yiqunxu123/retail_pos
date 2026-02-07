import { createContext, ReactNode, useCallback, useContext } from "react";
import { Alert } from "react-native";
import khubApi from "../utils/api/khub";
import {
    fetchSaleOrderProducts,
    useParkedOrders as useParkedOrdersSync,
    type ParkedOrderView,
} from "../utils/powersync/hooks";
import { OrderState, type OrderProduct } from "./OrderContext";

// ============================================================================
// Types
// ============================================================================

/** Legacy parked order shape (kept for ParkedOrdersModal compatibility) */
export interface ParkedOrder {
  id: string;
  customerName: string;
  customerId: string | null;
  products: OrderProduct[];
  total: number;
  parkedAt: string;
  parkedBy: string;
  note?: string;
}

interface ParkedOrderContextType {
  /** Parked orders in legacy shape (for ParkedOrdersModal) */
  parkedOrders: ParkedOrder[];
  /** Full parked order views from PowerSync (for DataTable) */
  remoteOrders: ParkedOrderView[];
  /** Park the current order via API (POST with is_parked: true) */
  parkOrder: (order: OrderState, parkedBy: string, note?: string) => Promise<void>;
  /** Resume a parked order — fetches products from PowerSync and returns full order */
  resumeOrder: (id: string) => Promise<ParkedOrder | null>;
  /** Delete a parked order via API */
  deleteParkedOrder: (id: string) => Promise<void>;
  /** No-op, kept for interface compatibility */
  clearAllParkedOrders: () => void;
  /** Loading state */
  isLoading: boolean;
  /** Total count */
  count: number;
  /** Refresh from PowerSync */
  refresh: () => void;
}

// ============================================================================
// Context
// ============================================================================

const ParkedOrderContext = createContext<ParkedOrderContextType | null>(null);

// ============================================================================
// Provider
// ============================================================================

export function ParkedOrderProvider({ children }: { children: ReactNode }) {
  const {
    orders: remoteOrders,
    isLoading,
    refresh,
    count,
  } = useParkedOrdersSync();

  // Map to legacy shape for ParkedOrdersModal (products loaded on resume)
  const parkedOrders: ParkedOrder[] = remoteOrders.map(
    (o: ParkedOrderView) => ({
      id: o.id,
      customerName: o.customerName || "Guest Customer",
      customerId: o.customerId ? String(o.customerId) : null,
      products: [], // Products are fetched on-demand during resume
      total: o.totalPrice,
      parkedAt: o.createdAt,
      parkedBy: o.createdByName,
      note: o.orderNo,
    })
  );

  /**
   * Park the current order via backend API.
   * POST /sale/order with is_parked: true
   *
   * Payload format mirrors K Web's createOrder (see kapp ordersCrud.js)
   * with special handling for parked orders (no payment, is_zero_tax_allowed).
   */
  const parkOrder = async (
    order: OrderState,
    _parkedBy: string,
    _note?: string
  ) => {
    try {
      const now = new Date().toISOString();

      const saleOrderDetails = order.products.map((p) => ({
        product_id: parseInt(p.productId, 10),
        qty: p.quantity,
        unit: 1, // 1 = Piece (default)
        unit_price: p.salePrice,
        discount: 0,
        discount_type: 1, // 1 = Fixed
        sale_type: 1, // 1 = Sale Order
      }));

      const payload = {
        is_parked: true,
        is_zero_tax_allowed: true,
        sale_order_details: saleOrderDetails,
        customer_id: order.customerId ? parseInt(order.customerId, 10) : null,
        order_type: 1, // 1 = Walk-in
        sale_type: 1, // 1 = Sale Order
        shipping_type: 1, // 1 = Pickup
        channel_id: 1, // Default channel
        order_date: now,
        dispatch_date: now,
        due_date: now,
        discount: order.additionalDiscount || 0,
        discount_type: 1,
        delivery_charges: order.shippingCharges || 0,
      };

      console.log("[ParkOrder] Sending payload:", JSON.stringify(payload, null, 2));
      await khubApi.post("/tenant/api/v1/sale/order", payload);
      refresh();
    } catch (error: any) {
      console.error("[ParkOrder] Error:", error.response?.status, JSON.stringify(error.response?.data));
      const errors = error.response?.data?.errors;
      const msg = Array.isArray(errors)
        ? errors.join("\n")
        : error.response?.data?.message || "Failed to park order";
      Alert.alert("Park Order Error", msg);
      throw error;
    }
  };

  /** Resume — fetches order products from PowerSync local DB and returns full order */
  const resumeOrder = useCallback(async (id: string): Promise<ParkedOrder | null> => {
    const order = parkedOrders.find((o) => o.id === id);
    if (!order) return null;

    try {
      const products = await fetchSaleOrderProducts(id);
      console.log(`[ResumeOrder] Fetched ${products.length} products for order ${id}`);
      return { ...order, products };
    } catch (error) {
      console.error("[ResumeOrder] Failed to fetch products:", error);
      Alert.alert("Resume Error", "Failed to load order products");
      return null;
    }
  }, [parkedOrders]);

  /** Delete via API */
  const deleteParkedOrder = async (id: string) => {
    try {
      await khubApi.delete(`/tenant/api/v1/sale/order/${id}`);
      refresh();
    } catch (error: any) {
      const msg =
        error.response?.data?.message ||
        error.response?.data?.errors?.[0] ||
        "Failed to delete parked order";
      Alert.alert("Delete Error", msg);
      throw error;
    }
  };

  const clearAllParkedOrders = () => {};

  return (
    <ParkedOrderContext.Provider
      value={{
        parkedOrders,
        remoteOrders,
        parkOrder,
        resumeOrder,
        deleteParkedOrder,
        clearAllParkedOrders,
        isLoading,
        count,
        refresh,
      }}
    >
      {children}
    </ParkedOrderContext.Provider>
  );
}

export function useParkedOrderContext() {
  const context = useContext(ParkedOrderContext);
  if (!context)
    throw new Error(
      "useParkedOrderContext must be used within ParkedOrderProvider"
    );
  return context;
}

export function useParkedOrders() {
  return useParkedOrderContext();
}
