import { Ionicons, MaterialCommunityIcons, MaterialIcons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Alert, Dimensions, Image, Modal, Pressable, ScrollView, Text, TextInput, TouchableOpacity, View } from "react-native";
import { captureRef } from "react-native-view-shot";
import { AddDiscountModal } from "../../components/AddDiscountModal";
import { AddQuickCustomerModal, type QuickCustomerResult } from "../../components/AddQuickCustomerModal";
import { AddTaxModal } from "../../components/AddTaxModal";
import { BrandingSection } from "../../components/BrandingSection";
import { CashEntryModal } from "../../components/CashEntryModal";
import { CashPaymentModal } from "../../components/CashPaymentModal";
import { CashResultModal } from "../../components/CashResultModal";
import { DeclareCashModal } from "../../components/DeclareCashModal";
import { ParkedOrdersModal } from "../../components/ParkedOrdersModal";
import { ParkOrderModal } from "../../components/ParkOrderModal";
import { ProductSettingsModal } from "../../components/ProductSettingsModal";
import { ReceiptData, ReceiptTemplate } from "../../components/ReceiptTemplate";
import { SaleInvoiceModal } from "../../components/SaleInvoiceModal";
import { SearchProduct, SearchProductModal } from "../../components/SearchProductModal";
import { SidebarButton } from "../../components/SidebarButton";
import { useAuth } from "../../contexts/AuthContext";
import { OrderProduct, useOrder } from "../../contexts/OrderContext";
import { useParkedOrders } from "../../contexts/ParkedOrderContext";
import {
  createSaleOrder,
  getSaleOrderById,
  type CreateSaleOrderPayload,
  type SaleOrderEntity,
} from "../../utils/api/orders";
import {
  getPoolStatus,
  isAnyPrinterModuleAvailable,
  openCashDrawer,
  printToAllWithFormat,
} from "../../utils/PrinterPoolManager";
import { printImageToAll } from "../../utils/receiptImagePrint";
import { formatReceiptText } from "../../utils/receiptTextFormat";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// Action button width
const SIDEBAR_WIDTH = 260;

/**
 * Staff POS Sales Screen - Matches Figma design
 */
export default function AddProductsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
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
  const [selectedCustomerData, setSelectedCustomerData] = useState<QuickCustomerResult | null>(null);

  // Sale Invoice modal
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [invoiceOrder, setInvoiceOrder] = useState<SaleOrderEntity | null>(null);
  const [placingOrder, setPlacingOrder] = useState(false);
  // When a real order is placed, store its receipt data so the hidden template renders it
  const [orderReceiptData, setOrderReceiptData] = useState<ReceiptData | null>(null);

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
  const [sendingToPrinter, setSendingToPrinter] = useState(false);
  const [receiptImageSize, setReceiptImageSize] = useState<{ w: number; h: number }>({ w: 384, h: 600 });

  const products = order.products;
  const summary = getOrderSummary();

  // Preview card / image dimensions based on screen short edge (stable across renders)
  const previewCardWidth = useMemo(() =>
    Math.min(Dimensions.get('window').width, Dimensions.get('window').height) * 0.75
  , []);
  const previewImgWidth = previewCardWidth - 32;
  const previewImgHeight = receiptImageSize.w > 0
    ? previewImgWidth * (receiptImageSize.h / receiptImageSize.w)
    : previewImgWidth * 1.5;

  // Build receipt data from current cart (for live preview template)
  const receiptData = useMemo((): ReceiptData => {
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
      discountAmount: products.reduce((sum, p) => sum + Math.max(0, p.salePrice * p.quantity - p.total), 0),
      additionalDiscount: order.additionalDiscount,
      additionalDiscountType: order.discountType,
      taxLabel: summary.tax > 0 ? undefined : "0%",
      tax: summary.tax,
      total: summary.total,
      createdBy: user?.name || undefined,
      customerName: selectedCustomerData?.business_name || undefined,
      customerEmail: selectedCustomerData?.email || undefined,
      customerPhone: selectedCustomerData?.business_phone_no || undefined,
    };
  }, [order, products, summary, selectedCustomerData, user]);

  // Build receipt data from a placed SaleOrderEntity (real server data)
  const buildReceiptFromOrder = useCallback((so: SaleOrderEntity): ReceiptData => {
    const details = so.sale_order_details || [];
    const invoice = so.invoice;
    const customer = so.customer;
    const d = new Date(so.created_at);
    const dateStr = `${String(d.getMonth() + 1).padStart(2, "0")}/${String(d.getDate()).padStart(2, "0")}/${String(d.getFullYear()).slice(-2)} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
    const subTotal = invoice?.sub_total ?? details.reduce((sum, dt) => sum + dt.total_price, 0);
    const totalDiscount = invoice?.total_discount ?? so.total_discount ?? 0;
    const taxAmount = so.tax_amount ?? so.tax ?? 0;
    const invoiceTotal = invoice?.total_amount ?? so.total_price ?? 0;
    return {
      orderNo: so.no || "--",
      dateTime: dateStr,
      items: details.map((dt) => ({
        name: dt.product?.name || dt.name || "ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â",
        qty: dt.qty ?? 0,
        price: dt.unit_price ?? dt.price ?? 0,
        totalPrice: dt.total_price ?? (dt.unit_price ?? 0) * (dt.qty ?? 0),
      })),
      subtotal: subTotal || 0,
      discountAmount: totalDiscount || 0,
      additionalDiscount: so.discount ?? 0,
      additionalDiscountType: so.discount_type,
      taxLabel: taxAmount > 0 ? undefined : "0%",
      tax: taxAmount || 0,
      total: invoiceTotal || 0,
      createdBy: so.created_by
        ? `${so.created_by.first_name} ${so.created_by.last_name}`
        : undefined,
      customerName: customer?.business_name || undefined,
      customerContact: customer?.customer_billing_details?.name || undefined,
      customerEmail: customer?.email || undefined,
      customerPhone: customer?.business_phone_no || customer?.customer_billing_details?.telephone_num || undefined,
      customerAddress: customer?.customer_billing_details?.address || undefined,
    };
  }, []);

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
        // No width override ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â template uses PRINTER_DOTS / PixelRatio.get()
        // so native capture produces exactly 384px (= printer dots)
      });
      setReceiptImageUri(uri);
      // Get actual image dimensions for correct aspect ratio in preview
      Image.getSize(uri, (w, h) => setReceiptImageSize({ w, h }), () => {});
      setShowReceiptPreview(true);
    } catch (err: any) {
      Alert.alert("Receipt Error", err?.message || String(err));
    } finally {
      setGeneratingReceipt(false);
    }
  }, [products]);

  // Text-based printing: format receipt as text ÃƒÂ¢Ã¢â‚¬Â Ã¢â‚¬â„¢ ESC/POS commands ÃƒÂ¢Ã¢â‚¬Â Ã¢â‚¬â„¢ TCP
  const handleTextPrint = useCallback(async () => {
    if (products.length === 0) {
      Alert.alert("No Products", "Add products before printing receipt.");
      return;
    }
    setSendingToPrinter(true);
    try {
      // Use printToAllWithFormat to format text per printer's printWidth
      const result = await printToAllWithFormat((printWidth) =>
        formatReceiptText(receiptData, printWidth)
      );
      if (result.success) {
        const successCount = result.results.filter(r => r.success).length;
        Alert.alert("Printed", `Receipt sent to ${successCount} printer(s)`);
      } else {
        Alert.alert("Print Failed", "Could not reach any printer. Check printer settings.");
      }
    } catch (err: any) {
      Alert.alert("Print Error", err?.message || String(err));
    } finally {
      setSendingToPrinter(false);
    }
  }, [products, receiptData]);

  // Image-based printing: screenshot PNG ÃƒÂ¢Ã¢â‚¬Â Ã¢â‚¬â„¢ ESC/POS raster bitmap ÃƒÂ¢Ã¢â‚¬Â Ã¢â‚¬â„¢ TCP
  const handleImagePrint = useCallback(async () => {
    if (!receiptImageUri) {
      Alert.alert("Error", "No receipt image. Please generate preview first.");
      return;
    }
    setSendingToPrinter(true);
    try {
      const result = await printImageToAll(receiptImageUri);
      if (result.success) {
        const successCount = result.results.filter(r => r.success).length;
        Alert.alert("Printed", `Image sent to ${successCount} printer(s)`);
      } else {
        Alert.alert("Print Failed", "Could not reach any printer. Check printer settings.");
      }
    } catch (err: any) {
      Alert.alert("Print Error", err?.message || String(err));
    } finally {
      setSendingToPrinter(false);
    }
  }, [receiptImageUri]);

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
      const newQty = product.quantity + delta;
      if (newQty <= 0) {
        removeProduct(id);
      } else {
        updateProductQuantity(id, newQty);
      }
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

  // Place Order ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â call API and show Sale Invoice modal
  const handlePlaceOrder = useCallback(async () => {
    if (products.length === 0) {
      Alert.alert("Error", "Please add products to cart first");
      return;
    }

    Alert.alert(
      "Confirm Order",
      `Place order with ${products.length} product(s) for $${summary.total.toFixed(2)}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Place Order",
          onPress: async () => {
            setPlacingOrder(true);
            try {
              const now = new Date().toISOString();
              const payload: CreateSaleOrderPayload = {
                // TODO: product discount / discount_type should come from cart item
                sale_order_details: products.map((p) => ({
                  product_id: parseInt(p.productId, 10),
                  qty: p.quantity,
                  unit: 1, // TODO: Piece=1, should come from product unit
                  unit_price: p.salePrice,
                  discount: 0,
                  discount_type: 1, // Fixed
                })),
                customer_id: order.customerId ? parseInt(order.customerId, 10) : null,
                // TODO: order_type should be selectable (Walk-in=1 Phone=2 Online=3 Offsite=4 Other=5)
                order_type: 1, // Walk-in
                // TODO: sale_type should be selectable (Order=1 Return=2)
                sale_type: 1, // Sale Order
                // TODO: shipping_type should be selectable (Pickup=1 Delivery=2 DropOff=3)
                shipping_type: 1, // Pickup
                // TODO: channel_id should come from app config / user settings
                channel_id: 1,
                order_date: now,
                dispatch_date: now,
                due_date: now,
                // API treats discount as a fixed dollar amount, so always convert & send type 1
                discount: parseFloat(
                  (order.discountType === 2
                    ? (summary.subTotal * order.additionalDiscount) / 100
                    : order.additionalDiscount
                  ).toFixed(2)
                ),
                discount_type: 1,
                delivery_charges: order.shippingCharges || 0,
                // TODO: payment_detail should support multiple payment types, not just hardcoded Cash
                payment_detail: {
                  payments: [
                    {
                      payment_type: 1, // TODO: Cash=1, should be selectable
                      amount: parseFloat(summary.total.toFixed(2)),
                      category: 1, // SALE_RECEIPT
                    },
                  ],
                  collected_by_id: user?.id ? parseInt(user.id, 10) : 1,
                  payment_date: now,
                },
              };

              console.log("[PlaceOrder] Sending payload:", JSON.stringify(payload, null, 2));
              const res = await createSaleOrder(payload);
              const entity = res.data.entity;
              console.log("[PlaceOrder] Created ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â Order No:", entity.no, "peculiar_no:", entity.peculiar_no, "Status:", entity.status);

              // The POST response only returns basic order info.
              // Fetch the full order (with sale_order_details, invoice, customer, etc.)
              let fullOrder: SaleOrderEntity = entity;
              if (entity.id) {
                try {
                  const detailRes = await getSaleOrderById(entity.id);
                  fullOrder = detailRes.data.entity;
                  console.log("[PlaceOrder] Fetched full order ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â products:", fullOrder.sale_order_details?.length, "invoice:", !!fullOrder.invoice);
                } catch (fetchErr: any) {
                  console.warn("[PlaceOrder] Could not fetch full order, building from cart:", fetchErr?.message);
                  // Fallback: build sale_order_details from cart so modal has content
                  fullOrder = {
                    ...entity,
                    sale_order_details: products.map((p, idx) => ({
                      id: idx,
                      sale_order_id: entity.id,
                      product_id: parseInt(p.productId, 10),
                      product: { id: parseInt(p.productId, 10), name: p.name, sku: p.sku },
                      qty: p.quantity,
                      unit: 1,
                      unit_price: p.salePrice,
                      price: p.salePrice,
                      discount: 0,
                      discount_type: 1,
                      total_price: p.salePrice * p.quantity,
                    })),
                    customer: selectedCustomerData ? {
                      id: parseInt(order.customerId || "0", 10),
                      business_name: selectedCustomerData.business_name || "",
                      email: selectedCustomerData.email || undefined,
                      business_phone_no: selectedCustomerData.business_phone_no || undefined,
                    } : undefined,
                  } as SaleOrderEntity;
                }
              }

              // Check print format setting
              const printFormat = await AsyncStorage.getItem("print_format").catch(() => null);

              if (printFormat === "receipt") {
                // Receipt mode ÃƒÂ¢Ã¢â‚¬Â Ã¢â‚¬â„¢ build receipt from real order and print directly
                const rd = buildReceiptFromOrder(fullOrder);
                console.log("ÃƒÂ°Ã…Â¸Ã‚Â§Ã‚Â¾ [PlaceOrder] Receipt mode ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â printing", fullOrder.no);
                try {
                  const printResult = await printToAllWithFormat((printWidth) =>
                    formatReceiptText(rd, printWidth)
                  );
                  const ok = printResult.results.filter(r => r.success).length;
                  Alert.alert("Order Placed", `Order ${fullOrder.no} ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â receipt sent to ${ok} printer(s).`);
                } catch (printErr) {
                  console.warn("[PlaceOrder] Print error:", printErr);
                  Alert.alert("Order Placed", `Order ${fullOrder.no} created. Print failed.`);
                }
                clearOrder();
                setSelectedCustomerData(null);
              } else {
                // A4 mode (default) ÃƒÂ¢Ã¢â‚¬Â Ã¢â‚¬â„¢ show SaleInvoiceModal
                setInvoiceOrder(fullOrder);
                setShowInvoiceModal(true);
              }
            } catch (err: any) {
              console.error("[PlaceOrder] Error message:", err?.message);
              console.error("[PlaceOrder] Error status:", err?.response?.status);
              console.error("[PlaceOrder] Error data:", JSON.stringify(err?.response?.data));
              console.error("[PlaceOrder] Full error:", JSON.stringify(err, Object.getOwnPropertyNames(err)));
              const errors = err?.response?.data?.errors;
              const msg = Array.isArray(errors)
                ? errors.join("\n")
                : err?.response?.data?.message || err?.message || "Failed to place order";
              Alert.alert("Order Error", msg);
            } finally {
              setPlacingOrder(false);
            }
          },
        },
      ]
    );
  }, [products, order, summary, buildReceiptFromOrder, clearOrder]);

  // After invoice modal ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â "New Order" resets everything
  const handleInvoiceNewOrder = useCallback(() => {
    setShowInvoiceModal(false);
    setInvoiceOrder(null);
    clearOrder();
    setSelectedCustomerData(null);
  }, [clearOrder]);


  return (
    <View className="flex-1 flex-row bg-[#F7F7F9]" style={{ marginTop: -insets.top }}>
      {/* Main Content Area */}
      <View className="flex-1">
        {/* Top Bar */}
        <View
          className="flex-row items-end gap-3 bg-white border-b border-gray-200"
          style={{ paddingTop: insets.top + 10, paddingHorizontal: 16, paddingBottom: 10 }}
        >
          {/* Search group: label on top, search bar below */}
          <View className="flex-1">
            <Text className="text-[#5A5F66] text-sm mb-1">Add product by Name, SKU, UPC</Text>
            <TouchableOpacity
              onPress={() => setShowSearchModal(true)}
              className="flex-row items-center bg-white border border-gray-300 rounded-xl px-3 py-2.5"
            >
              <Ionicons name="search" size={18} color="#9ca3af" />
              <Text className="flex-1 ml-2 text-gray-400">Search Products</Text>
            </TouchableOpacity>
          </View>

          {/* Scan Qty group: label on top, input below */}
          <View>
            <Text className="text-[#5A5F66] text-sm mb-1">Scan Qty</Text>
            <TextInput
              className="w-16 bg-white border border-gray-300 rounded-xl px-2 py-2.5 text-center text-gray-800"
              keyboardType="numeric"
              value={scanQty}
              onChangeText={setScanQty}
            />
          </View>

          {/* Refresh Button */}
          <TouchableOpacity
            className="h-11 px-6 rounded-xl flex-row items-center justify-center gap-1"
            style={{ backgroundColor: '#EC1A52' }}
          >
            <Ionicons name="refresh" size={16} color="white" />
            <Text className="text-white font-medium">Refresh</Text>
          </TouchableOpacity>

          {/* Scan Logs Button */}
          <TouchableOpacity className="h-11 border border-red-500 px-6 rounded-xl items-center justify-center">
            <Text className="text-red-500 font-medium">Scan Logs</Text>
          </TouchableOpacity>

          {/* Settings Button */}
          <TouchableOpacity 
            className="bg-[#20232A] p-3 rounded-xl"
            onPress={() => {
              if (products.length === 0) {
                Alert.alert("No Product", "Please add a product first");
                return;
              }
              const productToEdit = selectedProduct || products[0];
              setSelectedProduct(productToEdit);
              setShowProductSettingsModal(true);
            }}
          >
            <Ionicons name="settings-outline" size={20} color="white" />
          </TouchableOpacity>
        </View>

        {/* Products Table */}
        <ScrollView className="flex-1" contentContainerStyle={{ paddingHorizontal: 12, paddingTop: 12, paddingBottom: 10 }}>
          <View className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            {/* Table Header */}
            <View className="flex-row bg-[#F7F7FA] border-b border-gray-200 px-3 py-2.5">
              <View className="w-28 flex-row items-center">
                <Text className="text-[#5A5F66] text-xs font-semibold">SKU/UPC</Text>
                <Ionicons name="chevron-expand" size={12} color="#9ca3af" style={{ marginLeft: 4 }} />
              </View>
              <View className="flex-1 flex-row items-center">
                <Text className="text-[#5A5F66] text-xs font-semibold">Product Name</Text>
                <Ionicons name="chevron-expand" size={12} color="#9ca3af" style={{ marginLeft: 4 }} />
              </View>
              <View className="w-20 flex-row items-center">
                <Text className="text-[#5A5F66] text-xs font-semibold">Sale Price</Text>
                <Ionicons name="chevron-expand" size={12} color="#9ca3af" style={{ marginLeft: 4 }} />
              </View>
              <Text className="w-16 text-[#5A5F66] text-xs font-semibold">Unit</Text>
              <View className="w-20 flex-row items-center">
                <Text className="text-[#5A5F66] text-xs font-semibold">Quantity</Text>
                <Ionicons name="chevron-expand" size={12} color="#9ca3af" style={{ marginLeft: 4 }} />
              </View>
              <Text className="w-20 text-[#5A5F66] text-xs font-semibold">TN Vapor Tax</Text>
              <Text className="w-20 text-[#5A5F66] text-xs font-semibold">NC Vapor Tax</Text>
              <Text className="w-20 text-[#5A5F66] text-xs font-semibold">Total</Text>
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
                  className={`flex-row items-center px-3 py-2.5 border-b border-[#F0F1F4] ${
                    isSelected 
                      ? 'bg-[#FFF6F8] border-l-2 border-[#EC1A52]' 
                      : 'bg-white'
                  }`}
                >
                  <Text className="w-28 text-[#2E3136] text-xs font-medium">{product.sku}</Text>
                  <View className="flex-1 pr-2">
                    <Text className="text-[#3A3D42] text-xs" numberOfLines={2}>
                      {product.name}
                    </Text>
                    {index === 0 && (
                      <View className="bg-[#FDCB6E] px-2 py-0.5 rounded-full mt-1 self-start">
                        <Text className="text-[10px] font-semibold text-[#6B4F1D]">PROMO</Text>
                      </View>
                    )}
                  </View>
                  <Text className="w-20 text-[#6A6F77] text-xs">{product.salePrice}</Text>
                  <View className="w-16">
                    <View className="flex-row items-center rounded px-1 py-1">
                      <Text className="text-[#6A6F77] text-xs flex-1">{product.unit}</Text>
                      <Ionicons name="chevron-down" size={10} color="#6b7280" />
                    </View>
                  </View>
                  {/* Quantity Controls */}
                  <View className="w-20 flex-row items-center justify-center gap-1.5">
                    <TouchableOpacity
                      onPress={() => handleQuantityChange(product.id, -1)}
                      className="w-5 h-5 bg-[#EC1A52] rounded items-center justify-center"
                    >
                      <Ionicons name="remove" size={12} color="white" />
                    </TouchableOpacity>
                    <Text className="w-5 text-center text-[#2E3136] text-xs font-medium">{product.quantity}</Text>
                    <TouchableOpacity
                      onPress={() => handleQuantityChange(product.id, 1)}
                      className="w-5 h-5 bg-[#EC1A52] rounded items-center justify-center"
                    >
                      <Ionicons name="add" size={12} color="white" />
                    </TouchableOpacity>
                  </View>
                  <Text className="w-20 text-[#3A3D42] text-xs">${product.tnVaporTax.toFixed(4)}</Text>
                  <Text className="w-20 text-[#3A3D42] text-xs">${product.ncVaporTax.toFixed(4)}</Text>
                  <Text className="w-20 text-[#2E3136] text-xs font-bold">${product.total.toFixed(2)}</Text>
                </Pressable>
              );})
            )}
          </View>
        </ScrollView>

        {/* Bottom Section */}
        <View className="flex-row p-3 gap-3 bg-[#F8F8FA] border-t border-gray-200">
          {/* Customer Card */}
          <View className="bg-[#FFF7F8] border border-gray-200 rounded-xl p-3" style={{ width: 220 }}>
            {selectedCustomerData ? (
              <>
                {/* Customer Name Label */}
                <Text className="text-red-400 text-xs mb-1">Customer Name:</Text>
                {/* Customer Name */}
                <Text className="text-gray-900 font-bold text-lg mb-2">
                  {selectedCustomerData.business_name}
                </Text>
                {/* Loyalty Member Badge */}
                <View className="border border-red-500 rounded-full px-3 py-1 self-start mb-2">
                  <Text className="text-red-500 text-xs font-medium">Loyalty Member</Text>
                </View>
                {/* Loyalty Points Balance Badge */}
                <View className="bg-gray-800 rounded-full px-3 py-1 self-start mb-3">
                  <Text className="text-white text-xs">Loyalty Points Balance: 760</Text>
                </View>
                {/* Action Buttons */}
                <View className="flex-row gap-2">
                  <TouchableOpacity
                    onPress={() => setShowCustomerModal(true)}
                    className="flex-1 bg-red-500 rounded-lg py-2.5 items-center"
                  >
                    <Text className="text-white text-xs font-medium">Change{'\n'}Customer</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => {
                      setSelectedCustomerData(null);
                      updateOrder({ customerName: "Guest Customer", customerId: null });
                    }}
                    className="flex-1 bg-red-500 rounded-lg py-2.5 items-center"
                  >
                    <Text className="text-white text-xs font-medium">Remove{'\n'}Customer</Text>
                  </TouchableOpacity>
                </View>
              </>
            ) : (
              <>
                <View className="items-center">
                  <Text className="text-[#C88A98] text-sm mb-1">Current Status:</Text>
                  <Text className="text-gray-900 font-semibold text-[18px] mb-3">Guest Customer</Text>
                  <TouchableOpacity
                    onPress={() => setShowCustomerModal(true)}
                    className="w-full bg-[#C9154A] rounded-xl py-3 items-center justify-center"
                  >
                    <Ionicons name="add" size={34} color="white" />
                    <Text className="text-white font-medium text-[15px] mt-1">Add Quick Customer</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>

          {/* Order Summary + Total */}
          <View className="flex-1 bg-white border border-gray-200 rounded-xl overflow-hidden">
            {/* Summary Rows */}
            <View className="flex-row px-4 py-3">
              <View className="flex-1 pr-4 border-r border-[#EEF0F3]">
                <View className="flex-row justify-between py-1.5">
                  <Text className="text-gray-600 text-sm">Total Products</Text>
                  <Text className="text-gray-800 font-medium">{String(products.length).padStart(2, '0')}</Text>
                </View>
                <View className="flex-row justify-between py-1.5">
                  <Text className="text-gray-600 text-sm">Total Quantity</Text>
                  <Text className="text-gray-800 font-medium">{String(summary.totalQuantity).padStart(2, '0')}</Text>
                </View>
                <View className="flex-row justify-between py-1.5">
                  <Text className="text-gray-600 text-sm">Loyalty Credit</Text>
                  <Text className="text-gray-800 font-medium">-$10.00</Text>
                </View>
                <View className="flex-row justify-between py-1.5">
                  <Text className="text-gray-600 text-sm">Sub Total</Text>
                  <Text className="text-gray-800 font-semibold">${summary.subTotal.toFixed(2)}</Text>
                </View>
              </View>
              <View className="flex-1 pl-4">
                <View className="flex-row justify-between py-1.5">
                  <Text className="text-gray-600 text-sm">Additional Discount</Text>
                  <Text className="text-gray-800 font-medium">
                    {order.discountType === 2
                      ? `${order.additionalDiscount}%`
                      : `$${order.additionalDiscount.toFixed(2)}`}
                  </Text>
                </View>
                <View className="flex-row justify-between py-1.5">
                  <Text className="text-gray-600 text-sm">Delivery Charges</Text>
                  <Text className="text-gray-800 font-medium">$0.00</Text>
                </View>
                <View className="flex-row justify-between py-1.5">
                  <Text className="text-gray-600 text-sm">Loyalty Points Earned</Text>
                  <Text className="text-gray-800 font-medium">120</Text>
                </View>
                <View className="flex-row justify-between py-1.5">
                  <Text className="text-gray-600 text-sm">Tax</Text>
                  <Text className="text-gray-800 font-medium">${summary.tax.toFixed(2)}</Text>
                </View>
              </View>
            </View>

            {/* Total Bar */}
            <View className="flex-row justify-between items-center bg-[#FFF0F3] border-t border-red-100 px-4 py-2.5">
              <Text className="text-red-500 text-[24px] font-bold">Total</Text>
              <Text className="text-red-500 text-[32px] font-bold">${summary.total.toFixed(2)}</Text>
            </View>
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
              title={placingOrder ? "Placing..." : "Place Order"}
              onPress={handlePlaceOrder}
              icon={<Ionicons name="checkmark-circle-outline" size={20} color="#EC1A52" />}
              fullWidth={false}
            />
            <SidebarButton
              title={sendingToPrinter ? "Printing..." : "Print Receipt"}
              onPress={handleTextPrint}
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
          const dt = type === "percentage" ? 2 : 1;
          console.log("ÃƒÂ°Ã…Â¸Ã‚ÂÃ‚Â·ÃƒÂ¯Ã‚Â¸Ã‚Â [Discount] Saving ÃƒÂ¢Ã¢â‚¬Â Ã¢â‚¬â„¢", { additionalDiscount: discount, discountType: dt });
          updateOrder({ additionalDiscount: discount, discountType: dt as 1 | 2 });
          Alert.alert("Discount Applied", `Discount: ${type === 'percentage' ? `${discount}%` : `$${discount.toFixed(2)}`}`);
          setShowDiscountModal(false);
        }}
      />

      <AddQuickCustomerModal
        visible={showCustomerModal}
        onClose={() => setShowCustomerModal(false)}
        onSave={(customer) => {
          setSelectedCustomerData(customer);
          updateOrder({
            customerName: customer.business_name,
            customerId: String(customer.id),
          });
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

      {/* Sale Invoice Modal ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â shown after placing an order */}
      <SaleInvoiceModal
        visible={showInvoiceModal}
        onClose={() => {
          setShowInvoiceModal(false);
          setInvoiceOrder(null);
        }}
        onNewOrder={handleInvoiceNewOrder}
        onPrint={handleTextPrint}
        order={invoiceOrder}
      />

      {/* Hidden receipt template for capture */}
      <View
        style={{ position: "absolute", top: 0, left: 0, opacity: 0 }}
        pointerEvents="none"
        collapsable={false}
      >
        <ReceiptTemplate ref={receiptRef} data={orderReceiptData ?? receiptData} />
      </View>

      {/* Receipt Image Preview Modal ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â popup card */}
      <Modal
        visible={showReceiptPreview}
        transparent
        animationType="fade"
        onRequestClose={() => {
          setShowReceiptPreview(false);
          if (orderReceiptData) {
            // Was a post-order preview ÃƒÂ¢Ã¢â‚¬Â Ã¢â‚¬â„¢ clean up
            setOrderReceiptData(null);
            clearOrder();
            setSelectedCustomerData(null);
            setInvoiceOrder(null);
          }
        }}
      >
        <Pressable
          style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center' }}
          onPress={() => {
            setShowReceiptPreview(false);
            if (orderReceiptData) {
              setOrderReceiptData(null);
              clearOrder();
              setSelectedCustomerData(null);
              setInvoiceOrder(null);
            }
          }}
        >
          <Pressable
            style={{
              backgroundColor: '#FFF',
              borderRadius: 12,
              padding: 16,
              width: previewCardWidth,
              maxHeight: '85%',
            }}
            onPress={() => {/* prevent close */}}
          >
            {/* Header */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <Text style={{ fontSize: 16, fontWeight: '700', color: '#111' }}>Print Preview</Text>
              <TouchableOpacity
                onPress={() => {
                  setShowReceiptPreview(false);
                  if (orderReceiptData) {
                    setOrderReceiptData(null);
                    clearOrder();
                    setSelectedCustomerData(null);
                    setInvoiceOrder(null);
                  }
                }}
                hitSlop={12}
              >
                <Ionicons name="close-circle" size={26} color="#9CA3AF" />
              </TouchableOpacity>
            </View>

            {/* Scrollable image */}
            <ScrollView showsVerticalScrollIndicator style={{ marginBottom: 12 }}>
              {receiptImageUri ? (
                <Image
                  source={{ uri: receiptImageUri }}
                  style={{ width: previewImgWidth, height: previewImgHeight }}
                  resizeMode="contain"
                />
              ) : (
                <View style={{ height: 120, justifyContent: 'center', alignItems: 'center' }}>
                  <Text style={{ color: '#9CA3AF' }}>No image preview available</Text>
                </View>
              )}
            </ScrollView>

            {/* Action buttons */}
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <TouchableOpacity
                onPress={handleImagePrint}
                disabled={sendingToPrinter}
                style={{
                  flex: 1,
                  backgroundColor: sendingToPrinter ? '#9CA3AF' : '#EC1A52',
                  paddingVertical: 12,
                  borderRadius: 8,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                }}
              >
                <Ionicons name="print" size={16} color="#FFF" />
                <Text style={{ color: '#FFF', fontWeight: '700', fontSize: 14 }}>
                  {sendingToPrinter ? 'Sending...' : 'Print'}
                </Text>
              </TouchableOpacity>
              {orderReceiptData && (
                <TouchableOpacity
                  onPress={() => {
                    setShowReceiptPreview(false);
                    setOrderReceiptData(null);
                    clearOrder();
                    setSelectedCustomerData(null);
                    setInvoiceOrder(null);
                  }}
                  style={{
                    flex: 1,
                    backgroundColor: '#3b82f6',
                    paddingVertical: 12,
                    borderRadius: 8,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6,
                  }}
                >
                  <Ionicons name="add-circle-outline" size={16} color="#FFF" />
                  <Text style={{ color: '#FFF', fontWeight: '700', fontSize: 14 }}>New Order</Text>
                </TouchableOpacity>
              )}
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

