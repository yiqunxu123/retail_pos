import { createContext, ReactNode, useCallback, useContext, useMemo, useState } from "react";

export interface OrderProduct {
  id: string;
  /** Original product ID from the database (for API calls) */
  productId: string;
  sku: string;
  name: string;
  salePrice: number;
  unit: string;
  quantity: number;
  tnVaporTax: number;
  ncVaporTax: number;
  total: number;
}

export interface OrderState {
  // Customer
  customerId: string | null;
  customerName: string;
  paymentTerms: string;
  invoiceDueDate: string;
  orderType: "sale" | "return";
  orderNumber: string;
  shippingType: string;
  expIkaEligible: boolean;
  notesInternal: string;
  notesInvoice: string;
  // Products
  products: OrderProduct[];
  channel: string;
  // Checkout
  orderDate: string;
  dispatchDate: string;
  salesRep: string;
  additionalDiscount: number;
  /** 1 = Fixed ($), 2 = Percentage (%) — mirrors API discount_type */
  discountType: 1 | 2;
  shippingCharges: number;
}

interface OrderContextType {
  order: OrderState;
  updateOrder: (updates: Partial<OrderState>) => void;
  addProduct: (product: OrderProduct) => void;
  removeProduct: (id: string) => void;
  /** Update product quantity. If isDelta=true, value is added to current quantity. */
  updateProductQuantity: (id: string, value: number, isDelta?: boolean) => void;
  clearOrder: () => void;
  getOrderSummary: () => {
    totalProducts: number;
    totalQuantity: number;
    subTotal: number;
    tax: number;
    total: number;
  };
}

const initialOrder: OrderState = {
  customerId: null,
  customerName: "Guest Customer",
  paymentTerms: "Due Immediately",
  invoiceDueDate: "DD/MM/YYYY",
  orderType: "sale",
  orderNumber: "",
  shippingType: "",
  expIkaEligible: false,
  notesInternal: "",
  notesInvoice: "",
  products: [],
  channel: "Primary",
  orderDate: "DD/MM/YYYY",
  dispatchDate: "DD/MM/YYYY",
  salesRep: "",
  additionalDiscount: 0,
  discountType: 1,
  shippingCharges: 0,
};

const OrderContext = createContext<OrderContextType | null>(null);

export function OrderProvider({ children }: { children: ReactNode }) {
  const [order, setOrder] = useState<OrderState>(initialOrder);

  const updateOrder = useCallback((updates: Partial<OrderState>) => {
    setOrder((prev) => ({ ...prev, ...updates }));
  }, []);

  const addProduct = useCallback((product: OrderProduct) => {
    setOrder((prev) => {
      // Check if product already exists (by productId)
      const existingIndex = prev.products.findIndex(
        (p) => p.productId === product.productId
      );
      
      if (existingIndex >= 0) {
        // Product exists - increase quantity
        const newProducts = [...prev.products];
        const existing = newProducts[existingIndex];
        const newQty = existing.quantity + product.quantity;
        newProducts[existingIndex] = {
          ...existing,
          quantity: newQty,
          total: existing.salePrice * newQty,
        };
        return { ...prev, products: newProducts };
      }
      
      // New product - add to list
      return { ...prev, products: [...prev.products, product] };
    });
  }, []);

  const removeProduct = useCallback((id: string) => {
    setOrder((prev) => ({
      ...prev,
      products: prev.products.filter((p) => p.id !== id),
    }));
  }, []);

  const updateProductQuantity = useCallback((id: string, value: number, isDelta = false) => {
    setOrder((prev) => {
      const newProducts = prev.products
        .map((p) => {
          if (p.id !== id) return p;
          const newQty = isDelta ? p.quantity + value : value;
          return { ...p, quantity: newQty, total: p.salePrice * newQty };
        })
        .filter((p) => p.quantity > 0);
      return { ...prev, products: newProducts };
    });
  }, []);

  const clearOrder = useCallback(() => setOrder(initialOrder), []);

  const getOrderSummary = useCallback(() => {
    const totalProducts = order.products.length;
    const totalQuantity = order.products.reduce((sum, p) => sum + p.quantity, 0);
    const subTotal = order.products.reduce((sum, p) => sum + p.total, 0);
    const tax = order.products.reduce((sum, p) => sum + p.tnVaporTax + p.ncVaporTax, 0);
    const discountAmt = parseFloat(
      (order.discountType === 2
        ? (subTotal * order.additionalDiscount) / 100
        : order.additionalDiscount
      ).toFixed(2)
    );
    const total = parseFloat((subTotal + tax + order.shippingCharges - discountAmt).toFixed(2));
    return { totalProducts, totalQuantity, subTotal, tax, total };
  }, [order]);

  const contextValue = useMemo(() => ({
    order,
    updateOrder,
    addProduct,
    removeProduct,
    updateProductQuantity,
    clearOrder,
    getOrderSummary,
  }), [order, updateOrder, addProduct, removeProduct, updateProductQuantity, clearOrder, getOrderSummary]);

  return (
    <OrderContext.Provider value={contextValue}>
      {children}
    </OrderContext.Provider>
  );
}

export function useOrder() {
  const context = useContext(OrderContext);
  if (!context) throw new Error("useOrder must be used within OrderProvider");
  return context;
}
