import { Ionicons, MaterialCommunityIcons, MaterialIcons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { Alert, Image, Modal, Pressable, ScrollView, Text, TextInput, TouchableOpacity, View } from "react-native";
import { captureRef } from "react-native-view-shot";
import { AddDiscountModal } from "../../components/AddDiscountModal";
import { AddQuickCustomerModal } from "../../components/AddQuickCustomerModal";
import { AddTaxModal } from "../../components/AddTaxModal";
import { BrandingSection } from "../../components/BrandingSection";
import { CashEntryModal } from "../../components/CashEntryModal";
import { CashPaymentModal } from "../../components/CashPaymentModal";
import { CashResultModal } from "../../components/CashResultModal";
import { DeclareCashModal } from "../../components/DeclareCashModal";
import { ParkOrderModal } from "../../components/ParkOrderModal";
import { ParkedOrdersModal } from "../../components/ParkedOrdersModal";
import { ProductSettingsModal } from "../../components/ProductSettingsModal";
import { ReceiptData, ReceiptTemplate } from "../../components/ReceiptTemplate";
import { SearchProduct, SearchProductModal } from "../../components/SearchProductModal";
import { SidebarButton } from "../../components/SidebarButton";
import { useAuth } from "../../contexts/AuthContext";
import { OrderProduct, useOrder } from "../../contexts/OrderContext";
import { useParkedOrders } from "../../contexts/ParkedOrderContext";
import {
  getPoolStatus,
  isAnyPrinterModuleAvailable,
  openCashDrawer
} from "../../utils/PrinterPoolManager";

// Action button width
const SIDEBAR_WIDTH = 260;

/**
 * Staff POS Sales Screen - Matches Figma design
 */
export default function AddProductsScreen() {
  const router = useRouter();
  const { order, updateOrder, addProduct, updateProductQuantity, removeProduct, clearOrder, getOrderSummary } = useOrder();
  const { parkedOrders, parkOrder, resumeOrder, deleteParkedOrder } = useParkedOrders();
  const { user } = useAuth();
  const { retrieveOrderId } = useLocalSearchParams<{ retrieveOrderId?: string }>();
  const resumedRef = useRef(false);

  // Auto-resume parked order when navigated with retrieveOrderId
  useEffect(() => {
    if (!retrieveOrderId || resumedRef.current) return;
    resumedRef.current = true;

    (async () => {
      const parkedOrder = await resumeOrder(retrieveOrderId);
      if (parkedOrder && parkedOrder.products.length > 0) {
        clearOrder();
        parkedOrder.products.forEach((product) => {
          addProduct(product);
        });
        updateOrder({
          customerName: parkedOrder.customerName,
          customerId: parkedOrder.customerId,
        });
        // Delete the parked order after successful resume
        deleteParkedOrder(retrieveOrderId).catch(() => {});
        Alert.alert("Success", `Order ${parkedOrder.note || ''} resumed with ${parkedOrder.products.length} product(s)`);
      } else if (parkedOrder) {
        Alert.alert("Warning", "Order resumed but no products found");
      }
    })();
  }, [retrieveOrderId]);

  const [scanQty, setScanQty] = useState("1");
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [showCashPaymentModal, setShowCashPaymentModal] = useState(false);
  const [showDiscountModal, setShowDiscountModal] = useState(false);
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  
  // Park Order modals
  const [showParkOrderModal, setShowParkOrderModal] = useState(false);
  const [showParkedOrdersModal, setShowParkedOrdersModal] = useState(false);
  
  // Cash Management modals
  const [showDeclareCashModal, setShowDeclareCashModal] = useState(false);
  const [showCashEntryModal, setShowCashEntryModal] = useState(false);
  const [showCashResultModal, setShowCashResultModal] = useState(false);
  const [cashResult, setCashResult] = useState({ isMatched: true, actualCash: 0 });
  
  // Tax modal
  const [showTaxModal, setShowTaxModal] = useState(false);
  
  // Product Settings modal
  const [showProductSettingsModal, setShowProductSettingsModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<OrderProduct | null>(null);

  // Receipt image
  const receiptRef = useRef<View>(null);
  const [generatingReceipt, setGeneratingReceipt] = useState(false);
  const [receiptImageUri, setReceiptImageUri] = useState<string | null>(null);
  const [showReceiptPreview, setShowReceiptPreview] = useState(false);

  const products = order.products;
  const summary = getOrderSummary();

  // Build receipt data from current order
  const buildReceiptData = useCallback((): ReceiptData => {
    const now = new Date();
    const dateStr = `${String(now.getMonth() + 1).padStart(2, "0")}/${String(now.getDate()).padStart(2, "0")}/${String(now.getFullYear()).slice(-2)} ${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
    return {
      orderNo: order.orderNumber || "--",
      dateTime: dateStr,
      items: products.map((p) => ({
        name: p.name,
        qty: p.quantity,
        price: p.salePrice,
        totalPrice: p.total,
      })),
      subtotal: summary.subTotal,
      discount: order.additionalDiscount,
      taxLabel: summary.tax > 0 ? undefined : "0%",
      tax: summary.tax,
      total: summary.total,
    };
  }, [order, products, summary]);

  const handlePrintReceipt = useCallback(async () => {
    if (products.length === 0) {
      Alert.alert("No Products", "Add products before printing receipt.");
      return;
    }
    setGeneratingReceipt(true);
    try {
      await new Promise((r) => setTimeout(r, 300));
      if (!receiptRef.current) {
        Alert.alert("Error", "Receipt template not ready");
        return;
      }
      const uri = await captureRef(receiptRef, {
        format: "png",
        quality: 1,
        result: "data-uri",
      });
      setReceiptImageUri(uri);
      setShowReceiptPreview(true);
    } catch (err: any) {
      Alert.alert("Receipt Error", err?.message || String(err));
    } finally {
      setGeneratingReceipt(false);
    }
  }, [products]);
  
  // Mock cash summary - in real app this would come from backend
  const cashSummary = {
    openingBalance: 200.00,
    totalSales: 1250.50,
    totalRefunds: 45.00,
    expectedCash: 200.00 + 1250.50 - 45.00,
  };

  // Handle adding product from search modal
  const handleAddProductFromSearch = useCallback((searchProduct: SearchProduct) => {
    const qty = parseInt(scanQty) || 1;
    const newProduct: OrderProduct = {
      id: `${searchProduct.id}-${Date.now()}`,
      productId: searchProduct.id,
      sku: searchProduct.sku,
      name: searchProduct.name,
      salePrice: searchProduct.price,
      unit: "Piece",
      quantity: qty,
      tnVaporTax: 0,
      ncVaporTax: 0,
      total: searchProduct.price * qty,
    };
    addProduct(newProduct);
    setShowSearchModal(false);
  }, [scanQty, addProduct]);

  const handleQuantityChange = (id: string, delta: number) => {
    const product = products.find((p) => p.id === id);
    if (product) {
      const newQty = Math.max(1, product.quantity + delta);
      updateProductQuantity(id, newQty);
    }
  };

  const handleParkOrder = () => {
    if (products.length === 0) {
      Alert.alert("Error", "Please add products to cart first");
      return;
    }
    setShowParkOrderModal(true);
  };

  const handleConfirmParkOrder = async (note?: string) => {
    try {
      await parkOrder(order, user?.name || "Staff", note);
      setShowParkOrderModal(false);
      clearOrder();
      Alert.alert("Success", "Order parked successfully");
    } catch {
      // Error alert already shown in parkOrder
    }
  };

  const handleResumeOrder = async (id: string) => {
    const parkedOrder = await resumeOrder(id);
    if (parkedOrder && parkedOrder.products.length > 0) {
      clearOrder();
      // Restore products to current order
      parkedOrder.products.forEach((product) => {
        addProduct(product);
      });
      updateOrder({
        customerName: parkedOrder.customerName,
        customerId: parkedOrder.customerId,
      });
      // Delete the parked order after successful resume
      deleteParkedOrder(id).catch(() => {});
      setShowParkedOrdersModal(false);
      Alert.alert("Success", `Order resumed with ${parkedOrder.products.length} product(s)`);
    } else if (parkedOrder) {
      setShowParkedOrdersModal(false);
      Alert.alert("Warning", "Order resumed but no products were found");
    }
  };

  const handleDeleteParkedOrder = async (id: string) => {
    try {
      await deleteParkedOrder(id);
    } catch {
      // Error alert is already shown inside deleteParkedOrder
    }
  };

  // Cash Management handlers
  const handleOpenCashRegister = () => {
    setShowDeclareCashModal(true);
  };

  // Open physical cash drawer via printer pool
  const handleOpenCashDrawer = async () => {
    // Check if any printer is available in pool
    const poolStatus = getPoolStatus();
    const hasIdlePrinter = poolStatus.printers.some(p => p.enabled && p.status === 'idle');

    if (!isAnyPrinterModuleAvailable() || !hasIdlePrinter) {
      Alert.alert(
        "Printer Not Available",
        "Cash drawer requires a connected printer.\n\nPlease configure a printer in Settings.",
        [{ text: "OK" }]
      );
      return;
    }

    // Open drawer via pool (auto-select available printer)
    try {
      await openCashDrawer();
      Alert.alert("Success", "Cash drawer opened");
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to open cash drawer");
    }
  };

  const handleCashEntryConfirm = (actualCash: number) => {
    const difference = actualCash - cashSummary.expectedCash;
    const isMatched = Math.abs(difference) < 0.01; // Allow for small rounding differences
    setCashResult({ isMatched, actualCash });
    setShowCashEntryModal(false);
    setShowCashResultModal(true);
  };

  const handleCashResultConfirm = () => {
    setShowCashResultModal(false);
    Alert.alert("Success", "Cash register closed successfully");
  };

  // Product Settings handler
  const handleProductSettings = (product: OrderProduct) => {
    setSelectedProduct(product);
    setShowProductSettingsModal(true);
  };

  const handleEmptyCart = () => {
    Alert.alert("Empty Cart", "Are you sure you want to remove all items?", [
      { text: "Cancel", style: "cancel" },
      { text: "Empty", style: "destructive", onPress: () => clearOrder() },
    ]);
  };

  const handleGoToMenu = () => {
    router.back();
  };

  const handleCashPayment = () => {
    if (products.length === 0) {
      Alert.alert("Error", "Please add products to cart first");
      return;
    }
    setShowCashPaymentModal(true);
  };


  return (
    <View className="flex-1 flex-row bg-gray-100">
      {/* Main Content Area */}
      <View className="flex-1">
        {/* Top Bar */}
        <View className="flex-row items-center gap-3 p-3 bg-white border-b border-gray-200">
          <Text className="text-gray-600 text-sm">Add product by Name, SKU, UPC</Text>
          
          {/* Search Input */}
          <TouchableOpacity
            onPress={() => setShowSearchModal(true)}
            className="flex-1 flex-row items-center bg-gray-50 border border-gray-200 rounded-lg px-3 py-2"
          >
            <Ionicons name="search" size={18} color="#9ca3af" />
            <Text className="flex-1 ml-2 text-gray-400">Search Products</Text>
          </TouchableOpacity>

          {/* Scan Qty */}
          <View className="flex-row items-center gap-2">
            <Text className="text-gray-600 text-sm">Scan Qty</Text>
            <TextInput
              className="w-14 bg-gray-50 border border-gray-200 rounded-lg px-2 py-2 text-center text-gray-800"
              keyboardType="numeric"
              value={scanQty}
              onChangeText={setScanQty}
            />
          </View>

          {/* Refresh Button */}
          <TouchableOpacity className="bg-red-500 px-4 py-2 rounded-lg flex-row items-center gap-1">
            <Ionicons name="refresh" size={16} color="white" />
            <Text className="text-white font-medium">Refresh</Text>
          </TouchableOpacity>

          {/* Scan Logs Button */}
          <TouchableOpacity className="border border-red-500 px-4 py-2 rounded-lg">
            <Text className="text-red-500 font-medium">Scan Logs</Text>
          </TouchableOpacity>

          {/* Settings Button - Opens Product Settings Modal */}
          <TouchableOpacity 
            className="bg-gray-800 p-2 rounded-lg"
            onPress={() => {
              if (products.length === 0) {
                Alert.alert("No Product", "Please add a product first");
                return;
              }
              
              // Use selected product or first product
              const productToEdit = selectedProduct || products[0];
              setSelectedProduct(productToEdit);
              setShowProductSettingsModal(true);
            }}
          >
            <Ionicons name="settings-outline" size={20} color="white" />
          </TouchableOpacity>
        </View>

        {/* Products Table */}
        <ScrollView className="flex-1" contentContainerStyle={{ padding: 12 }}>
          <View className="bg-white rounded-lg overflow-hidden">
            {/* Table Header */}
            <View className="flex-row bg-gray-50 border-b border-gray-200 px-3 py-2">
              <Text className="w-28 text-gray-600 text-xs font-semibold">SKU/UPC</Text>
              <Text className="flex-1 text-gray-600 text-xs font-semibold">Product Name</Text>
              <Text className="w-20 text-gray-600 text-xs font-semibold">Sale Price</Text>
              <Text className="w-16 text-gray-600 text-xs font-semibold">Unit</Text>
              <Text className="w-20 text-gray-600 text-xs font-semibold">Quantity</Text>
              <Text className="w-20 text-gray-600 text-xs font-semibold">TN Vapor Tax</Text>
              <Text className="w-20 text-gray-600 text-xs font-semibold">NC Vapor Tax</Text>
              <Text className="w-20 text-gray-600 text-xs font-semibold">Total</Text>
            </View>

            {/* Empty State */}
            {products.length === 0 ? (
              <View className="py-16 items-center">
                <View className="w-32 h-32 mb-4">
                  <MaterialCommunityIcons name="cart-outline" size={80} color="#d1d5db" />
                </View>
                <Text className="text-gray-500 text-center mb-2">
                  There are no products in the list yet, Add Products to get Started
                </Text>
                <TouchableOpacity
                  onPress={() => setShowSearchModal(true)}
                  className="mt-4 border border-red-500 px-6 py-2 rounded-lg flex-row items-center gap-2"
                >
                  <Ionicons name="add" size={18} color="#EC1A52" />
                  <Text className="text-red-500 font-medium">Add New Product</Text>
                </TouchableOpacity>
              </View>
            ) : (
              /* Table Body */
              products.map((product, index) => {
                const isSelected = selectedProduct?.id === product.id;
                return (
                <Pressable
                  key={product.id}
                  onPress={() => setSelectedProduct(product)}
                  className={`flex-row items-center px-3 py-2 ${
                    isSelected 
                      ? 'bg-red-50 border-l-4 border-red-500' 
                      : index % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                  }`}
                >
                  <Text className="w-28 text-gray-800 text-xs">{product.sku}</Text>
                  <View className="flex-1 pr-2">
                    <Text className="text-gray-800 text-xs" numberOfLines={2}>
                      {product.name}
                    </Text>
                    {index === 0 && (
                      <View className="bg-yellow-400 px-2 py-0.5 rounded mt-1 self-start">
                        <Text className="text-xs font-medium">PROMO</Text>
                      </View>
                    )}
                  </View>
                  <Text className="w-20 text-gray-800 text-xs">{product.salePrice}</Text>
                  <View className="w-16">
                    <View className="flex-row items-center bg-gray-100 rounded px-1 py-1">
                      <Text className="text-gray-700 text-xs flex-1">{product.unit}</Text>
                      <Ionicons name="chevron-down" size={10} color="#6b7280" />
                    </View>
                  </View>
                  {/* Quantity Controls */}
                  <View className="w-20 flex-row items-center justify-center gap-1">
                    <TouchableOpacity
                      onPress={() => handleQuantityChange(product.id, -1)}
                      className="w-5 h-5 bg-red-500 rounded items-center justify-center"
                    >
                      <Ionicons name="remove" size={12} color="white" />
                    </TouchableOpacity>
                    <Text className="w-5 text-center text-gray-800 text-xs">{product.quantity}</Text>
                    <TouchableOpacity
                      onPress={() => handleQuantityChange(product.id, 1)}
                      className="w-5 h-5 bg-green-500 rounded items-center justify-center"
                    >
                      <Ionicons name="add" size={12} color="white" />
                    </TouchableOpacity>
                  </View>
                  <Text className="w-20 text-gray-800 text-xs">${product.tnVaporTax.toFixed(4)}</Text>
                  <Text className="w-20 text-gray-800 text-xs">${product.ncVaporTax.toFixed(4)}</Text>
                  <Text className="w-20 text-red-500 text-xs font-medium">${product.total.toFixed(2)}</Text>
                </Pressable>
              );})
            )}
          </View>
        </ScrollView>

        {/* Bottom Section */}
        <View className="flex-row p-3 gap-3 bg-white border-t border-gray-200">
          {/* Customer Card */}
          <View className="bg-white border border-gray-200 rounded-lg p-3" style={{ width: 180 }}>
            <Text className="text-red-500 text-xs mb-1">Current Status:</Text>
            <Text className="text-gray-800 font-semibold mb-2">Guest Customer</Text>
            <TouchableOpacity
              onPress={() => setShowCustomerModal(true)}
              className="bg-red-500 rounded-lg py-2 px-3 flex-row items-center justify-center gap-1"
            >
              <Ionicons name="add" size={16} color="white" />
              <Text className="text-white font-medium text-sm">Add Quick Customer</Text>
            </TouchableOpacity>
          </View>

          {/* Order Summary */}
          <View className="flex-1 flex-row">
            <View className="flex-1 px-4">
              <View className="flex-row justify-between py-1">
                <Text className="text-gray-600 text-sm">Total Products</Text>
                <Text className="text-gray-800 font-medium">{String(products.length).padStart(2, '0')}</Text>
              </View>
              <View className="flex-row justify-between py-1">
                <Text className="text-gray-600 text-sm">Total Quantity</Text>
                <Text className="text-gray-800 font-medium">{String(summary.totalQuantity).padStart(2, '0')}</Text>
              </View>
              <View className="flex-row justify-between py-1">
                <Text className="text-gray-600 text-sm">Sub Total</Text>
                <Text className="text-gray-800 font-medium">${summary.subTotal.toFixed(2)}</Text>
              </View>
            </View>
            <View className="flex-1 px-4">
              <View className="flex-row justify-between py-1">
                <Text className="text-gray-600 text-sm">Additional Discount</Text>
                <Text className="text-gray-800 font-medium">$0.00</Text>
              </View>
              <View className="flex-row justify-between py-1">
                <Text className="text-gray-600 text-sm">Delivery Charges</Text>
                <Text className="text-gray-800 font-medium">$0.00</Text>
              </View>
              <View className="flex-row justify-between py-1">
                <Text className="text-gray-600 text-sm">Tax</Text>
                <Text className="text-gray-800 font-medium">${summary.tax.toFixed(2)}</Text>
              </View>
            </View>
          </View>

          {/* Total */}
          <View className="items-end justify-center px-4">
            <Text className="text-red-500 text-sm">Total</Text>
            <Text className="text-red-500 text-2xl font-bold">${summary.total.toFixed(2)}</Text>
          </View>
        </View>
      </View>

      {/* Right Action Panel */}
      <View className="bg-gray-50 border-l border-gray-200 p-2" style={{ width: SIDEBAR_WIDTH }}>
        {/* Branding Section */}
        <View className="mb-2">
          <BrandingSection />
        </View>

        {/* Go to Menu - Top position below branding */}
        <View className="mb-3">
          <SidebarButton
            title="Go to Menu"
            icon={<Ionicons name="menu-outline" size={20} color="#EC1A52" />}
            onPress={handleGoToMenu}
          />
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
          {/* Row 1 */}
          <View>
        
            <SidebarButton
              title="Open Drawer"
              onPress={handleOpenCashDrawer}
              icon={<MaterialCommunityIcons name="cash-register" size={20} color="#EC1A52" />}
              fullWidth={false}
            />
          </View>

          {/* Row 2 */}
          <View className="flex-row gap-2">
            <SidebarButton
              title="Cash Payment"
              onPress={handleCashPayment}
              icon={<MaterialCommunityIcons name="cash" size={20} color="#EC1A52" />}
              fullWidth={false}
            />
            <SidebarButton
              title="Card Payment"
              onPress={() => Alert.alert("Card Payment", "Feature coming soon")}
              icon={<MaterialCommunityIcons name="credit-card" size={20} color="#EC1A52" />}
              fullWidth={false}
            />
          </View>

          {/* Row 3 */}
          <View className="flex-row gap-2">
            <SidebarButton
              title="Payment Method"
              onPress={() => Alert.alert("Payment Method 1", "Feature coming soon")}
              icon={<MaterialIcons name="payment" size={20} color="#EC1A52" />}
              fullWidth={false}
            />
            <SidebarButton
              title="Payment Method"
              onPress={() => Alert.alert("Payment Method 2", "Feature coming soon")}
              icon={<MaterialIcons name="payment" size={20} color="#EC1A52" />}
              fullWidth={false}
            />
          </View>

          {/* Row 4 */}
          <View className="flex-row gap-2">
            <SidebarButton
              title="Payment Method"
              onPress={() => Alert.alert("Payment Method 3", "Feature coming soon")}
              icon={<MaterialIcons name="payment" size={20} color="#EC1A52" />}
              fullWidth={false}
            />
            <SidebarButton
              title={generatingReceipt ? "Printing..." : "Print Receipt"}
              onPress={handlePrintReceipt}
              icon={<Ionicons name="print-outline" size={20} color="#EC1A52" />}
              fullWidth={false}
            />
          </View>

          {/* Row 5 */}
          <View className="flex-row gap-2">
            <SidebarButton
              title="Pay Later"
              onPress={() => Alert.alert("Pay Later", "Feature coming soon")}
              icon={<MaterialCommunityIcons name="clock-outline" size={20} color="#EC1A52" />}
              fullWidth={false}
            />
            <SidebarButton
              title="Add Tax"
              onPress={() => setShowTaxModal(true)}
              icon={<Ionicons name="add-circle-outline" size={20} color="#EC1A52" />}
              fullWidth={false}
            />
          </View>

          {/* Row 6 */}
          <View className="flex-row gap-2">
            <SidebarButton
              title="Delete Product"
              onPress={() => Alert.alert("Delete Product", "Select a product to delete")}
              icon={<Ionicons name="trash-outline" size={20} color="#EC1A52" />}
              fullWidth={false}
            />
            <SidebarButton
              title="Void Payment"
              onPress={() => Alert.alert("Void Payment", "Feature coming soon")}
              icon={<MaterialCommunityIcons name="cancel" size={20} color="#EC1A52" />}
              fullWidth={false}
            />
          </View>

          {/* Row 7 */}
          <View className="flex-row gap-2">
            <SidebarButton
              title="Add Discount"
              onPress={() => setShowDiscountModal(true)}
              icon={<MaterialIcons name="discount" size={20} color="#EC1A52" />}
              fullWidth={false}
            />
            <SidebarButton
              title="Park Order"
              onPress={handleParkOrder}
              icon={<MaterialCommunityIcons name="pause-circle-outline" size={20} color="#EC1A52" />}
              fullWidth={false}
            />
          </View>

          {/* Row 8 */}
          <SidebarButton
            title="Empty Cart"
            onPress={handleEmptyCart}
            icon={<Ionicons name="trash-outline" size={20} color="#EC1A52" />}
          />
        </ScrollView>
      </View>

      {/* Modals */}
      <SearchProductModal
        visible={showSearchModal}
        onClose={() => setShowSearchModal(false)}
        onSelectProduct={handleAddProductFromSearch}
      />

      <CashPaymentModal
        visible={showCashPaymentModal}
        onClose={() => setShowCashPaymentModal(false)}
        subTotal={summary.total}
        onConfirm={(amountPaid) => {
          Alert.alert("Payment Complete", `Change due: $${(amountPaid - summary.total).toFixed(2)}`);
          setShowCashPaymentModal(false);
          clearOrder();
          router.back();
        }}
      />

      <AddDiscountModal
        visible={showDiscountModal}
        onClose={() => setShowDiscountModal(false)}
        subTotal={summary.subTotal}
        onConfirm={(discount, type) => {
          Alert.alert("Discount Applied", `Discount: ${type === 'percentage' ? `${discount}%` : `$${discount.toFixed(2)}`}`);
          setShowDiscountModal(false);
        }}
      />

      <AddQuickCustomerModal
        visible={showCustomerModal}
        onClose={() => setShowCustomerModal(false)}
        onSave={(customer) => {
          Alert.alert("Customer Added", `Customer: ${customer.businessName}`);
          setShowCustomerModal(false);
        }}
      />

      {/* Park Order Modals */}
      <ParkOrderModal
        visible={showParkOrderModal}
        onClose={() => setShowParkOrderModal(false)}
        onConfirm={handleConfirmParkOrder}
        customerName={order.customerName}
        totalItems={products.length}
        totalAmount={summary.total}
      />

      <ParkedOrdersModal
        visible={showParkedOrdersModal}
        onClose={() => setShowParkedOrdersModal(false)}
        parkedOrders={parkedOrders}
        onResumeOrder={handleResumeOrder}
        onDeleteOrder={handleDeleteParkedOrder}
      />

      {/* Cash Management Modals */}
      <DeclareCashModal
        visible={showDeclareCashModal}
        onClose={() => setShowDeclareCashModal(false)}
        onContinue={() => {
          setShowDeclareCashModal(false);
          setShowCashEntryModal(true);
        }}
        cashSummary={cashSummary}
      />

      <CashEntryModal
        visible={showCashEntryModal}
        onClose={() => setShowCashEntryModal(false)}
        onConfirm={handleCashEntryConfirm}
        expectedCash={cashSummary.expectedCash}
      />

      <CashResultModal
        visible={showCashResultModal}
        onClose={() => setShowCashResultModal(false)}
        onConfirm={handleCashResultConfirm}
        onReview={() => {
          setShowCashResultModal(false);
          setShowCashEntryModal(true);
        }}
        isMatched={cashResult.isMatched}
        expectedAmount={cashSummary.expectedCash}
        actualAmount={cashResult.actualCash}
      />

      {/* Tax Modal */}
      <AddTaxModal
        visible={showTaxModal}
        onClose={() => setShowTaxModal(false)}
        onConfirm={(taxAmount, taxType, taxName) => {
          Alert.alert("Tax Added", `${taxName}: $${taxAmount.toFixed(2)}`);
          setShowTaxModal(false);
        }}
        subTotal={summary.subTotal}
      />

      {/* Product Settings Modal */}
      <ProductSettingsModal
        visible={showProductSettingsModal}
        onClose={() => setShowProductSettingsModal(false)}
        onSave={(settings) => {
          Alert.alert("Settings Saved", "Product settings have been updated");
          setShowProductSettingsModal(false);
        }}
        product={selectedProduct}
      />

      {/* Hidden receipt template for capture */}
      <View
        style={{ position: "absolute", top: 0, left: 0, opacity: 0 }}
        pointerEvents="none"
        collapsable={false}
      >
        <ReceiptTemplate ref={receiptRef} data={buildReceiptData()} />
      </View>

      {/* Receipt Image Preview Modal */}
      <Modal
        visible={showReceiptPreview}
        transparent
        animationType="fade"
        onRequestClose={() => setShowReceiptPreview(false)}
      >
        <Pressable
          style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.85)", justifyContent: "center", alignItems: "center" }}
          onPress={() => setShowReceiptPreview(false)}
        >
          <Pressable
            style={{ backgroundColor: "#FFF", borderRadius: 12, padding: 16, maxWidth: "90%", maxHeight: "85%", alignItems: "center" }}
            onPress={() => {}}
          >
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", width: "100%", marginBottom: 12 }}>
              <Text style={{ fontSize: 16, fontWeight: "700", color: "#111" }}>Print Preview</Text>
              <TouchableOpacity onPress={() => setShowReceiptPreview(false)}>
                <Ionicons name="close-circle" size={24} color="#9CA3AF" />
              </TouchableOpacity>
            </View>
            {receiptImageUri && (
              <ScrollView style={{ maxHeight: 500 }} showsVerticalScrollIndicator>
                <Image
                  source={{ uri: receiptImageUri }}
                  style={{ width: 360, height: 450 }}
                  resizeMode="contain"
                />
              </ScrollView>
            )}
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}
