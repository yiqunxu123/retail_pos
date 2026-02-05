import { usePathname, useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { Alert, View, useWindowDimensions } from "react-native";
import {
    AddDiscountModal,
    CashPaymentModal,
    CustomerCard,
    OrderSummary,
    POSSidebar,
    ProductSearch,
    ProductTable,
    SearchProductModal
} from "../components";
import { ProductItem } from "../components/ProductTable";
import { SearchProduct } from "../components/SearchProductModal";
import { useClock } from "../contexts/ClockContext";
import {
    addPrinterListener,
    getPoolStatus,
    isAnyPrinterModuleAvailable,
    print
} from "../utils/PrinterPoolManager";

// Printer configuration
const PRINTER_IP = "192.168.1.100";
const PRINTER_PORT = 9100;

// Sample product data for demonstration
const SAMPLE_PRODUCTS: ProductItem[] = [
  {
    id: "1",
    sku: "6522/609137681542",
    name: '4" ALeaf Bubbler Hand Pipe ALHP2052-Purple',
    isPromo: true,
    salePrice: 8,
    unit: "Piece",
    quantity: 2,
    tnVaporTax: 0,
    ncVaporTax: 0,
    total: 16.0,
  },
  {
    id: "2",
    sku: "6522/609137681542",
    name: '4" ALeaf Bubbler Hand Pipe ALHP2052-Purple 4" ALeaf Bubbler',
    salePrice: 8,
    unit: "Piece",
    quantity: 2,
    tnVaporTax: 0,
    ncVaporTax: 0,
    total: 16.0,
  },
  {
    id: "3",
    sku: "6522/609137681542",
    name: '4" ALeaf Bubbler Hand Pipe ALHP2052-Purple',
    salePrice: 8,
    unit: "Piece",
    quantity: 2,
    tnVaporTax: 0,
    ncVaporTax: 0,
    total: 16.0,
  },
];

/**
 * POSLineScreen - Main POS sales interface
 * Displays product search, cart items, and payment controls
 */
export default function POSLineScreen() {
  const { width, height } = useWindowDimensions();
  const router = useRouter();
  const pathname = usePathname();
  const { selectedPosLine } = useClock();

  const isLandscape = width > height;
  
  // Hide nav buttons when in order flow
  const isInOrderFlow = pathname.startsWith("/order");

  // State
  const [searchQuery, setSearchQuery] = useState("");
  const [scanQty, setScanQty] = useState("1");
  const [products, setProducts] = useState<ProductItem[]>(SAMPLE_PRODUCTS);
  const [selectedProductId, setSelectedProductId] = useState<string>();
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [showCashPaymentModal, setShowCashPaymentModal] = useState(false);
  const [showDiscountModal, setShowDiscountModal] = useState(false);
  const [discount, setDiscount] = useState(0);

  // Calculate order summary
  const subTotal = products.reduce((sum, p) => sum + p.total, 0);
  const total = Math.max(0, subTotal - discount);
  const orderSummary = {
    totalProducts: products.length,
    totalQuantity: products.reduce((sum, p) => sum + p.quantity, 0),
    subTotal,
    additionalDiscount: discount,
    deliveryCharges: 0,
    tax: 0,
    total,
  };

  // Handle adding product from search modal
  const handleAddProductFromSearch = useCallback((searchProduct: SearchProduct) => {
    const qty = parseInt(scanQty) || 1;
    const newProduct: ProductItem = {
      id: `${searchProduct.id}-${Date.now()}`,
      sku: searchProduct.sku,
      name: searchProduct.name,
      salePrice: searchProduct.price,
      unit: "Piece",
      quantity: qty,
      tnVaporTax: 0,
      ncVaporTax: 0,
      total: searchProduct.price * qty,
    };
    setProducts((prev) => [...prev, newProduct]);
    setShowSearchModal(false);
  }, [scanQty]);

  // Handlers
  const handleQuantityChange = useCallback((id: string, delta: number) => {
    setProducts((prev) =>
      prev.map((p) =>
        p.id === id
          ? { ...p, quantity: Math.max(1, p.quantity + delta), total: p.salePrice * Math.max(1, p.quantity + delta) }
          : p
      )
    );
  }, []);

  const handleDeleteProduct = useCallback(() => {
    if (selectedProductId) {
      setProducts((prev) => prev.filter((p) => p.id !== selectedProductId));
      setSelectedProductId(undefined);
    } else {
      Alert.alert("No Selection", "Please select a product to delete.");
    }
  }, [selectedProductId]);

  const handleEmptyCart = useCallback(() => {
    Alert.alert(
      "Empty Cart",
      "Are you sure you want to remove all items?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Yes",
          onPress: () => {
            setProducts([]);
            setDiscount(0);
          },
        },
      ]
    );
  }, []);

  const handleGoToMenu = useCallback(() => {
    router.back();
  }, [router]);

  const handleParkOrder = useCallback(() => {
    Alert.alert("Order Parked", "Your order has been saved for later.");
    router.back();
  }, [router]);

  // Navigate to full order flow
  const handleCheckout = useCallback(() => {
    router.push("/order/add-customer");
  }, [router]);

  const handleAddProduct = useCallback(() => {
    setShowSearchModal(true);
  }, []);

  // Open search modal when search input is focused
  const handleSearchFocus = useCallback(() => {
    setShowSearchModal(true);
  }, []);

  // Cash payment
  const handleCashPayment = useCallback(() => {
    if (products.length === 0) {
      Alert.alert("Empty Cart", "Please add products before payment.");
      return;
    }
    setShowCashPaymentModal(true);
  }, [products.length]);

  const handleCashPaymentConfirm = useCallback((cashReceived: number) => {
    const change = cashReceived - total;
    Alert.alert(
      "Payment Complete",
      `Cash Received: $${cashReceived.toFixed(2)}\nChange: $${change.toFixed(2)}`,
      [
        {
          text: "OK",
          onPress: () => {
            setProducts([]);
            setDiscount(0);
            setShowCashPaymentModal(false);
          },
        },
      ]
    );
  }, [total]);

  // Add discount
  const handleAddDiscount = useCallback(() => {
    if (products.length === 0) {
      Alert.alert("Empty Cart", "Please add products before adding discount.");
      return;
    }
    setShowDiscountModal(true);
  }, [products.length]);

  const handleDiscountConfirm = useCallback((discountValue: number, type: "percentage" | "fixed") => {
    const discountAmount = type === "percentage"
      ? (subTotal * discountValue) / 100
      : discountValue;
    setDiscount(discountAmount);
    setShowDiscountModal(false);
  }, [subTotal]);

  // Build receipt content for thermal printer
  const buildReceipt = useCallback((): string => {
    let receipt = `
<CB>ITITANS STORE</CB>
<C>123 Main Street</C>
<C>City, State 12345</C>
<C>POS Line: ${selectedPosLine || "N/A"}</C>
<C>================================</C>

`;
    // Add products
    products.forEach((product) => {
      const name = product.name.length > 20 
        ? product.name.substring(0, 20) + "..." 
        : product.name.padEnd(20);
      receipt += `${name} x${product.quantity}    $${product.total.toFixed(2)}\n`;
    });

    receipt += `
<C>--------------------------------</C>
Subtotal:              $${subTotal.toFixed(2)}
`;

    if (discount > 0) {
      receipt += `Discount:             -$${discount.toFixed(2)}\n`;
    }

    receipt += `
<C>--------------------------------</C>
<CB>TOTAL: $${total.toFixed(2)}</CB>
<C>--------------------------------</C>

<C>Thank you for shopping!</C>
<C>Please come again</C>

`;
    return receipt;
  }, [products, subTotal, discount, total, selectedPosLine]);

  // Initialize printer pool and listen to events
  useEffect(() => {
    // Listen to print events - only alert on failure
    const unsubscribe = addPrinterListener((event) => {
      if (event.type === 'job_failed') {
        Alert.alert("Print Error", `Failed to print: ${event.data?.error || 'Unknown error'}`);
      }
    });

    return () => unsubscribe();
  }, []);

  // Handle print receipt - uses pool system (auto-selects available printer)
  const handlePrintReceipt = useCallback(() => {
    if (products.length === 0) {
      Alert.alert("Empty Cart", "Please add products before printing receipt.");
      return;
    }

    // Check if any printer is available
    const poolStatus = getPoolStatus();
    const hasEnabledPrinters = poolStatus.printers.some(p => p.enabled);

    if (!isAnyPrinterModuleAvailable() || !hasEnabledPrinters) {
      Alert.alert(
        "Printer Not Available",
        "No printers configured.\n\nPlease add a printer in Settings.\n\nReceipt Preview:\n" + buildReceipt().substring(0, 300) + "...",
        [{ text: "OK" }]
      );
      return;
    }

    // Show available printers status
    const idlePrinters = poolStatus.printers.filter(p => p.enabled && p.status === 'idle');
    const busyPrinters = poolStatus.printers.filter(p => p.enabled && p.status === 'busy');

    const statusMsg = `Printers: ${idlePrinters.length} idle, ${busyPrinters.length} busy\nQueue: ${poolStatus.queueLength} jobs`;

    Alert.alert(
      "Print Receipt",
      statusMsg,
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Print", 
          onPress: () => {
            try {
              const receipt = buildReceipt();
              print(receipt);  // Pool system automatically selects idle printer
            } catch (err) {
              const msg = err instanceof Error ? err.message : String(err);
              Alert.alert("Print Error", msg);
            }
          }
        },
      ]
    );
  }, [products.length, buildReceipt]);

  return (
    <View className={`flex-1 ${isLandscape ? "flex-row" : "flex-col"}`}>
      {/* Main Content Area */}
      <View className="flex-1 p-4">
        {/* Search Bar - clicking opens modal */}
        <ProductSearch
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          scanQty={scanQty}
          onScanQtyChange={setScanQty}
          onSearchFocus={handleSearchFocus}
        />

        {/* Product Table */}
        <View className="flex-1 mb-4">
          <ProductTable
            products={products}
            onQuantityChange={handleQuantityChange}
            selectedProductId={selectedProductId}
            onSelectProduct={setSelectedProductId}
          />
        </View>

        {/* Bottom Section - Customer Card + Order Summary */}
        <View className="flex-row gap-4">
          <CustomerCard />
          <OrderSummary {...orderSummary} />
        </View>
      </View>

      {/* POS Sidebar */}
      <POSSidebar
        isLandscape={isLandscape}
        onAddProduct={handleAddProduct}
        onDeleteProduct={handleDeleteProduct}
        onEmptyCart={handleEmptyCart}
        onGoToMenu={handleGoToMenu}
        onParkOrder={handleParkOrder}
        onCheckout={handleCheckout}
        onCashPayment={handleCashPayment}
        onAddDiscount={handleAddDiscount}
        onPrintReceipt={handlePrintReceipt}
        hideNavButtons={isInOrderFlow}
      />

      {/* Search Product Modal */}
      <SearchProductModal
        visible={showSearchModal}
        onClose={() => setShowSearchModal(false)}
        onSelectProduct={handleAddProductFromSearch}
      />

      {/* Cash Payment Modal */}
      <CashPaymentModal
        visible={showCashPaymentModal}
        onClose={() => setShowCashPaymentModal(false)}
        onConfirm={handleCashPaymentConfirm}
        subTotal={total}
      />

      {/* Add Discount Modal */}
      <AddDiscountModal
        visible={showDiscountModal}
        onClose={() => setShowDiscountModal(false)}
        onConfirm={handleDiscountConfirm}
        subTotal={subTotal}
      />
    </View>
  );
}
