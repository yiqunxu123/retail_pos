import { createContext, ReactNode, useContext } from "react";
import { Alert } from "react-native";
import khubApi from "../utils/api/khub";
import {
    useParkedOrders as useParkedOrdersSync,
    type ParkedOrderView,
} from "../utils/powersync/hooks";
import { OrderState } from "./OrderContext";

// ============================================================================
// Types
// ============================================================================

/** Legacy parked order shape (kept for ParkedOrdersModal compatibility) */
export interface ParkedOrder {
  id: string;
  customerName: string;
  products: never[];
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
  /** Resume a parked order — returns legacy shape for compatibility */
  resumeOrder: (id: string) => ParkedOrder | null;
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

  // Map to legacy shape for ParkedOrdersModal
  const parkedOrders: ParkedOrder[] = remoteOrders.map(
    (o: ParkedOrderView) => ({
      id: o.id,
      customerName: o.customerName || "Guest Customer",
      products: [],
      total: o.totalPrice,
      parkedAt: o.createdAt,
      parkedBy: o.createdByName,
      note: o.orderNo,
    })
  );

  /**
   * Park the current order via backend API.
   * POST /sale/order with is_parked: true
   */
  const parkOrder = async (
    order: OrderState,
    _parkedBy: string,
    note?: string
  ) => {
    try {
      const saleOrderDetails = order.products.map((p) => ({
        product_id: p.id,
        qty: p.quantity,
        price: p.salePrice,
        discount: 0,
      }));

      const payload = {
        customer_id: order.customerId || null,
        sale_order_details: saleOrderDetails,
        is_parked: true,
        park_note: note || "Parked from mobile app",
        order_type: 0,
        sale_type: 1,
        shipping_type: 1,
        discount: order.additionalDiscount || 0,
      };

      await khubApi.post("/tenant/api/v1/sale/order", payload);
      refresh();
    } catch (error: any) {
      const msg =
        error.response?.data?.message ||
        error.response?.data?.errors?.[0] ||
        "Failed to park order";
      Alert.alert("Park Order Error", msg);
      throw error;
    }
  };

  /** Resume — returns legacy shape; actual order data loaded from backend */
  const resumeOrder = (id: string): ParkedOrder | null => {
    return parkedOrders.find((o) => o.id === id) || null;
  };

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
