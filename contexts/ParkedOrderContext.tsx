import { createContext, useContext, useState, ReactNode, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { OrderState, OrderProduct } from "./OrderContext";

export interface ParkedOrder {
  id: string;
  customerName: string;
  products: OrderProduct[];
  total: number;
  parkedAt: string;
  parkedBy: string;
  note?: string;
}

interface ParkedOrderContextType {
  parkedOrders: ParkedOrder[];
  parkOrder: (order: OrderState, parkedBy: string, note?: string) => void;
  resumeOrder: (id: string) => ParkedOrder | null;
  deleteParkedOrder: (id: string) => void;
  clearAllParkedOrders: () => void;
}

const STORAGE_KEY = "@parked_orders";

const ParkedOrderContext = createContext<ParkedOrderContextType | null>(null);

export function ParkedOrderProvider({ children }: { children: ReactNode }) {
  const [parkedOrders, setParkedOrders] = useState<ParkedOrder[]>([]);

  // Load parked orders from storage on mount
  useEffect(() => {
    loadParkedOrders();
  }, []);

  const loadParkedOrders = async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        setParkedOrders(JSON.parse(stored));
      }
    } catch (error) {
      console.error("Failed to load parked orders:", error);
    }
  };

  const saveParkedOrders = async (orders: ParkedOrder[]) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(orders));
    } catch (error) {
      console.error("Failed to save parked orders:", error);
    }
  };

  const parkOrder = (order: OrderState, parkedBy: string, note?: string) => {
    const total = order.products.reduce((sum, p) => sum + p.total, 0);
    const newParkedOrder: ParkedOrder = {
      id: `PO-${Date.now()}`,
      customerName: order.customerName,
      products: order.products,
      total,
      parkedAt: new Date().toISOString(),
      parkedBy,
      note,
    };
    const updated = [...parkedOrders, newParkedOrder];
    setParkedOrders(updated);
    saveParkedOrders(updated);
  };

  const resumeOrder = (id: string): ParkedOrder | null => {
    const order = parkedOrders.find((o) => o.id === id);
    if (order) {
      // Remove from parked orders
      const updated = parkedOrders.filter((o) => o.id !== id);
      setParkedOrders(updated);
      saveParkedOrders(updated);
      return order;
    }
    return null;
  };

  const deleteParkedOrder = (id: string) => {
    const updated = parkedOrders.filter((o) => o.id !== id);
    setParkedOrders(updated);
    saveParkedOrders(updated);
  };

  const clearAllParkedOrders = () => {
    setParkedOrders([]);
    saveParkedOrders([]);
  };

  return (
    <ParkedOrderContext.Provider
      value={{
        parkedOrders,
        parkOrder,
        resumeOrder,
        deleteParkedOrder,
        clearAllParkedOrders,
      }}
    >
      {children}
    </ParkedOrderContext.Provider>
  );
}

export function useParkedOrders() {
  const context = useContext(ParkedOrderContext);
  if (!context) throw new Error("useParkedOrders must be used within ParkedOrderProvider");
  return context;
}
