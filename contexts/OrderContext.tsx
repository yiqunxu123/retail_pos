import { createContext, ReactNode, useContext, useState } from "react";

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
  updateProductQuantity: (id: string, quantity: number) => void;
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

  const updateOrder = (updates: Partial<OrderState>) => {
    setOrder((prev) => ({ ...prev, ...updates }));
  };

  const addProduct = (product: OrderProduct) => {
    setOrder((prev) => ({
      ...prev,
      products: [...prev.products, product],
    }));
  };

  const removeProduct = (id: string) => {
    setOrder((prev) => ({
      ...prev,
      products: prev.products.filter((p) => p.id !== id),
    }));
  };

  const updateProductQuantity = (id: string, quantity: number) => {
    setOrder((prev) => ({
      ...prev,
      products: prev.products.map((p) =>
        p.id === id ? { ...p, quantity, total: p.salePrice * quantity } : p
      ),
    }));
  };

  const clearOrder = () => setOrder(initialOrder);

  const getOrderSummary = () => {
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
  };

  return (
    <OrderContext.Provider
      value={{
        order,
        updateOrder,
        addProduct,
        removeProduct,
        updateProductQuantity,
        clearOrder,
        getOrderSummary,
      }}
    >
      {children}
    </OrderContext.Provider>
  );
}

export function useOrder() {
  const context = useContext(OrderContext);
  if (!context) throw new Error("useOrder must be used within OrderProvider");
  return context;
}
