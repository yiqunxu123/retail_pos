import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Alert, Dimensions, Image, Modal, Pressable, ScrollView, Text, TextInput, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { captureRef } from "react-native-view-shot";
import { AddDiscountModal } from "../../components/AddDiscountModal";
import { BarcodePrintModal } from "../../components/BarcodePrintModal";
import { type QuickCustomerResult } from "../../components/AddQuickCustomerModal";
import { AddTaxModal } from "../../components/AddTaxModal";
import { CashEntryModal } from "../../components/CashEntryModal";
import { CashPaymentModal } from "../../components/CashPaymentModal";
import { CashResultModal } from "../../components/CashResultModal";
import { DeclareCashModal } from "../../components/DeclareCashModal";
import { ParkedOrdersModal } from "../../components/ParkedOrdersModal";
import { ParkOrderModal } from "../../components/ParkOrderModal";
import { POSSidebar } from "../../components/POSSidebar";
import { ProductSettingsModal } from "../../components/ProductSettingsModal";
import { ProductTable } from "../../components/ProductTable";
import { ReceiptData, ReceiptTemplate } from "../../components/ReceiptTemplate";
import { SaleInvoiceModal } from "../../components/SaleInvoiceModal";
import { SearchCustomerModal } from "../../components/SearchCustomerModal";
import { SearchProduct, SearchProductModal } from "../../components/SearchProductModal";
import { useAuth } from "../../contexts/AuthContext";
import { OrderProduct, useOrder } from "../../contexts/OrderContext";
import { useProducts } from "../../utils/powersync/hooks";
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

// Action button width
const SIDEBAR_WIDTH = 440;

function buildCustomerSnapshot(
  customerId: string | null,
  customerName: string
): QuickCustomerResult | null {
  if (!customerId || !customerName || customerName === "Guest Customer") return null;
  const numericId = Number(customerId);
  if (Number.isNaN(numericId)) return null;

  return {
    id: numericId,
    no: undefined,
    business_name: customerName,
    name: undefined,
    email: null,
    business_phone_no: null,
    class_of_trades: "Retailer",
    customer_type: null,
    is_active: true,
    customer_billing_details: null,
    sale_agent_obj: { label: "Please Select", value: null },
  };
}

interface ScanLogEntry {
  id: string;
  code: string;
  timestamp: Date;
  matched: boolean;
  productName?: string;
}

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
        const snapshot = buildCustomerSnapshot(
          parkedOrder.customerId,
          parkedOrder.customerName
        );
        setSelectedCustomerData(snapshot);
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
  const [showScanLogModal, setShowScanLogModal] = useState(false);
  const [showBarcodePrintModal, setShowBarcodePrintModal] = useState(false);
  const [scanLogs, setScanLogs] = useState<ScanLogEntry[]>([]);
  const scanBufferRef = useRef("");
  const scanTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hiddenInputRef = useRef<TextInput>(null);
  const { products: allProducts } = useProducts();
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [showCashPaymentModal, setShowCashPaymentModal] = useState(false);
  const [showDiscountModal, setShowDiscountModal] = useState(false);
  const [selectedCustomerData, setSelectedCustomerData] = useState<QuickCustomerResult | null>(null);
  const [orderSettings, setOrderSettings] = useState({
    paymentTerms: "due_immediately",
    shippingType: "pickup",
    orderNumber: "",
    invoiceDueDate: "",
    notesInternal: "",
    notesInvoice: "",
  });

  useEffect(() => {
    if (selectedCustomerData) return;
    const snapshot = buildCustomerSnapshot(order.customerId, order.customerName);
    if (snapshot) {
      setSelectedCustomerData(snapshot);
    }
  }, [order.customerId, order.customerName, selectedCustomerData]);

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

  // Process a scanned barcode: look up product, add to cart, log it
  const handleScanComplete = useCallback((code: string) => {
    const trimmed = code.trim();
    if (!trimmed) return;

    const keyword = trimmed.toLowerCase();
    const matchedProduct = allProducts.find((p) => {
      const sku = (p.sku || "").toLowerCase();
      const upc = (p.upc || "").toLowerCase();
      return sku === keyword || upc === keyword;
    });

    const entry: ScanLogEntry = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      code: trimmed,
      timestamp: new Date(),
      matched: !!matchedProduct,
      productName: matchedProduct?.name,
    };
    setScanLogs((prev) => [entry, ...prev]);

    if (matchedProduct) {
      const qty = parseInt(scanQty) || 1;
      const newProduct: OrderProduct = {
        id: `${matchedProduct.id}-${Date.now()}`,
        productId: matchedProduct.id,
        sku: matchedProduct.sku,
        name: matchedProduct.name,
        salePrice: matchedProduct.salePrice,
        unit: "Piece",
        quantity: qty,
        tnVaporTax: 0,
        ncVaporTax: 0,
        total: matchedProduct.salePrice * qty,
      };
      addProduct(newProduct);
    }
  }, [allProducts, scanQty, addProduct]);

  // Scanner submits via Enter key (onSubmitEditing)
  const handleScannerSubmit = useCallback(() => {
    const code = scanBufferRef.current.trim();
    if (code.length >= 3) {
      handleScanComplete(code);
    }
    scanBufferRef.current = "";
    hiddenInputRef.current?.setNativeProps?.({ text: "" });
    setTimeout(() => {
      hiddenInputRef.current?.clear();
      hiddenInputRef.current?.focus();
    }, 50);
  }, [handleScanComplete]);

  // Track characters as they come in from the scanner
  const handleScannerInput = useCallback((text: string) => {
    scanBufferRef.current = text;

    // Fallback: auto-submit after 400ms of silence (for scanners without Enter suffix)
    if (scanTimerRef.current) clearTimeout(scanTimerRef.current);
    scanTimerRef.current = setTimeout(() => {
      const buffered = scanBufferRef.current.trim();
      if (buffered.length >= 4) {
        handleScanComplete(buffered);
        scanBufferRef.current = "";
        hiddenInputRef.current?.setNativeProps?.({ text: "" });
        setTimeout(() => {
          hiddenInputRef.current?.clear();
          hiddenInputRef.current?.focus();
        }, 50);
      }
    }, 400);
  }, [handleScanComplete]);

  // Refocus hidden input whenever a modal closes
  // NOTE: Scan Log and Barcode Print modals should NOT block scanner input
  useEffect(() => {
    const blockingScanModal = showSearchModal || showCustomerModal ||
      showCashPaymentModal || showDiscountModal || showProductSettingsModal ||
      showParkOrderModal || showParkedOrdersModal || showDeclareCashModal ||
      showCashEntryModal || showCashResultModal || showTaxModal || showInvoiceModal;
    if (!blockingScanModal) {
      setTimeout(() => hiddenInputRef.current?.focus(), 200);
    }
  }, [showSearchModal, showCustomerModal, showCashPaymentModal,
      showDiscountModal, showProductSettingsModal, showParkOrderModal,
      showParkedOrdersModal, showDeclareCashModal, showCashEntryModal,
      showCashResultModal, showTaxModal, showInvoiceModal]);

  // Periodic refocus: ensure scanner input always has focus (every 2s)
  // Scan Log and Barcode Print modals allow scanning while open
  useEffect(() => {
    const interval = setInterval(() => {
      const blockingScanModal = showSearchModal || showCustomerModal ||
        showCashPaymentModal || showDiscountModal || showProductSettingsModal ||
        showParkOrderModal || showParkedOrdersModal || showDeclareCashModal ||
        showCashEntryModal || showCashResultModal || showTaxModal || showInvoiceModal;
      if (!blockingScanModal) {
        hiddenInputRef.current?.focus();
      }
    }, 2000);
    return () => clearInterval(interval);
  }, [showSearchModal, showCustomerModal, showCashPaymentModal,
      showDiscountModal, showProductSettingsModal, showParkOrderModal,
      showParkedOrdersModal, showDeclareCashModal, showCashEntryModal,
      showCashResultModal, showTaxModal, showInvoiceModal]);

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
      customerName:
        selectedCustomerData?.business_name ||
        (order.customerName !== "Guest Customer" ? order.customerName : undefined),
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
      const snapshot = buildCustomerSnapshot(
        parkedOrder.customerId,
        parkedOrder.customerName
      );
      setSelectedCustomerData(snapshot);
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

  const handleDeleteProduct = () => {
    if (!selectedProduct) {
      Alert.alert("No Selection", "Please select a product to delete.");
      return;
    }
    removeProduct(selectedProduct.id);
    setSelectedProduct(null);
  };

  const handleGoToMenu = () => {
    router.back();
  };

  const handleAddNotes = () => {
    Alert.alert("Add Notes", "Feature coming soon");
  };

  // Place Order Logic - Now part of payment flow
  const executeOrderPlacement = useCallback(async (paymentType: number = 1) => {
    if (products.length === 0) return;

    setPlacingOrder(true);
    try {
      const now = new Date().toISOString();
      const payload: CreateSaleOrderPayload = {
        sale_order_details: products.map((p) => ({
          product_id: parseInt(p.productId, 10),
          qty: p.quantity,
          unit: 1, 
          unit_price: p.salePrice,
          discount: 0,
          discount_type: 1,
        })),
        customer_id: order.customerId ? parseInt(order.customerId, 10) : null,
        order_type: 1,
        sale_type: 1,
        shipping_type: 1,
        channel_id: 1,
        order_date: now,
        dispatch_date: now,
        due_date: now,
        discount: parseFloat(
          (order.discountType === 2
            ? (summary.subTotal * order.additionalDiscount) / 100
            : order.additionalDiscount
          ).toFixed(2)
        ),
        discount_type: 1,
        delivery_charges: order.shippingCharges || 0,
        payment_detail: {
          payments: [
            {
              payment_type: paymentType,
              amount: parseFloat(summary.total.toFixed(2)),
              category: 1,
            },
          ],
          collected_by_id: user?.id ? parseInt(user.id, 10) : 1,
          payment_date: now,
        },
      };

      const res = await createSaleOrder(payload);
      const entity = res.data.entity;

      let fullOrder: SaleOrderEntity = entity;
      if (entity.id) {
        try {
          const detailRes = await getSaleOrderById(entity.id);
          fullOrder = detailRes.data.entity;
        } catch (fetchErr: any) {
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
              no: selectedCustomerData.no || undefined,
              business_name: selectedCustomerData.business_name || "",
              name: selectedCustomerData.name || undefined,
              email: selectedCustomerData.email || undefined,
              business_phone_no: selectedCustomerData.business_phone_no || undefined,
              customer_billing_details: selectedCustomerData.customer_billing_details || undefined,
            } : undefined,
          } as SaleOrderEntity;
        }
      }

      const printFormat = await AsyncStorage.getItem("print_format").catch(() => null);

      if (printFormat === "receipt") {
        const rd = buildReceiptFromOrder(fullOrder);
        try {
          await printToAllWithFormat((printWidth) => formatReceiptText(rd, printWidth));
        } catch (printErr) {}
        clearOrder();
        setSelectedCustomerData(null);
        router.back();
      } else {
        setInvoiceOrder(fullOrder);
        setShowInvoiceModal(true);
      }
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || "Failed to place order";
      Alert.alert("Order Error", msg);
    } finally {
      setPlacingOrder(false);
    }
  }, [products, order, summary, user, selectedCustomerData, buildReceiptFromOrder, clearOrder, router]);

  const handleCashPayment = () => {
    if (products.length === 0) {
      Alert.alert("Error", "Please add products to cart first");
      return;
    }
    setShowCashPaymentModal(true);
  };

  const handleCardPayment = () => {
    if (products.length === 0) {
      Alert.alert("Error", "Please add products to cart first");
      return;
    }
    Alert.alert("Card Payment", `Charge $${summary.total.toFixed(2)}?`, [
      { text: "Cancel", style: "cancel" },
      { text: "Confirm", onPress: () => executeOrderPlacement(2) }
    ]);
  };

  const handleCashPaymentConfirm = useCallback(async (amountReceived: number) => {
    await executeOrderPlacement(1); // 1 = Cash
    setShowCashPaymentModal(false);
    // Note: change calculation alert could be added here or inside executeOrderPlacement
    if (amountReceived > summary.total) {
      Alert.alert("Payment Complete", `Change due: $${(amountReceived - summary.total).toFixed(2)}`);
    }
  }, [executeOrderPlacement, summary.total]);

  // After invoice modal ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â "New Order" resets everything
  const handleInvoiceNewOrder = useCallback(() => {
    setShowInvoiceModal(false);
    setInvoiceOrder(null);
    clearOrder();
    setSelectedCustomerData(null);
  }, [clearOrder]);


  return (
    <View className="flex-1 flex-row bg-[#F7F7F9]">
      {/* Main Content Area */}
      <View className="flex-1">
        {/* Top Bar */}
        <View
          className="flex-row items-end gap-3 bg-[#F7F7F9] border-b border-gray-200"
          style={{ paddingTop: insets.top + 10, paddingHorizontal: 16, paddingBottom: 10 }}
        >
          {/* Search group: label on top, search bar below */}
          <View className="flex-1">
            <Text className="text-[#5A5F66] text-[18px] mb-1" style={{ fontFamily: 'Montserrat' }}>Add product by Name, SKU, UPC</Text>
            <TouchableOpacity
              onPress={() => setShowSearchModal(true)}
              className="flex-row items-center bg-white border border-gray-300 rounded-xl px-3 py-3 shadow-sm"
            >
              <Ionicons name="search" size={20} color="#9ca3af" />
              <Text className="flex-1 ml-2 text-gray-400 text-[18px]" style={{ fontFamily: 'Montserrat' }}>Search Products</Text>
            </TouchableOpacity>
          </View>

          {/* Scan Qty group: label on top, input below */}
          <View>
            <Text className="text-[#5A5F66] text-[18px] mb-1" style={{ fontFamily: 'Montserrat' }}>Scan Qty</Text>
            <TextInput
              className="w-20 bg-white border border-gray-300 rounded-xl px-2 py-3 text-center text-gray-800 text-[18px] shadow-sm"
              style={{ fontFamily: 'Montserrat' }}
              keyboardType="numeric"
              value={scanQty}
              onChangeText={setScanQty}
            />
          </View>

          {/* Refresh Button */}
          <TouchableOpacity
            className="h-11 px-6 rounded-xl flex-row items-center justify-center gap-1 shadow-sm"
            style={{ backgroundColor: '#EC1A52' }}
          >
            <Ionicons name="refresh" size={16} color="white" />
            <Text className="text-white font-medium">Refresh</Text>
          </TouchableOpacity>

          {/* Scan Logs Button */}
          <TouchableOpacity
            className="h-11 border border-red-500 bg-white px-6 rounded-xl flex-row items-center justify-center gap-2 shadow-sm"
            onPress={() => setShowScanLogModal(true)}
          >
            <Ionicons name="barcode-outline" size={18} color="#EC1A52" />
            <Text className="text-red-500 font-medium">Scan Logs</Text>
            {scanLogs.length > 0 && (
              <View style={{
                backgroundColor: "#EC1A52",
                borderRadius: 10,
                minWidth: 20,
                height: 20,
                alignItems: "center",
                justifyContent: "center",
                paddingHorizontal: 6,
              }}>
                <Text style={{ color: "#FFF", fontSize: 11, fontWeight: "700" }}>{scanLogs.length}</Text>
              </View>
            )}
          </TouchableOpacity>

          {/* Print Barcode Button */}
          <TouchableOpacity
            className="h-11 bg-[#3B82F6] px-5 rounded-xl flex-row items-center justify-center gap-2 shadow-sm"
            onPress={() => setShowBarcodePrintModal(true)}
          >
            <Ionicons name="barcode-outline" size={18} color="white" />
            <Text className="text-white font-medium">Print Barcode</Text>
          </TouchableOpacity>

          {/* Settings Button */}
          <TouchableOpacity 
            className="bg-[#20232A] p-3 rounded-xl shadow-sm"
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
        <ProductTable
          products={products}
          onQuantityChange={handleQuantityChange}
          selectedProductId={selectedProduct?.id}
          onSelectProduct={(p) => setSelectedProduct(p as any)}
          onAddProductPress={() => setShowSearchModal(true)}
        />

        {/* Bottom Section */}
        <View className="flex-row p-4 gap-4 bg-[#F7F7F9]">
          {/* Customer Card (Left) */}
          <View className="bg-[#FFC0D1] border border-[#FFB5C5] rounded-xl p-4 shadow-sm" style={{ width: 280, justifyContent: 'center' }}>
            {selectedCustomerData ? (
              <View>
                <Text className="text-[#EC1A52] text-[14px] font-Montserrat font-medium mb-1 text-center">Current Status:</Text>
                <Text className="text-[#1A1A1A] font-Montserrat font-bold text-[22px] mb-3 text-center">
                  {selectedCustomerData.business_name}
                </Text>
                
                {/* Loyalty Info */}
                <View className="items-center mb-4">
                  <View className="bg-[#FFF0F3] border border-[#FECACA] rounded-full px-4 py-1.5 mb-2">
                    <Text className="text-[#EC1A52] text-[12px] font-Montserrat font-semibold">Loyalty Member</Text>
                  </View>
                  <View className="bg-[#20232A] rounded-full px-4 py-1.5">
                    <Text className="text-white text-[12px] font-Montserrat">Loyalty Points: 760</Text>
                  </View>
                </View>

                {/* Action Buttons */}
                <View className="flex-row gap-2">
                  <TouchableOpacity
                    onPress={() => setShowCustomerModal(true)}
                    className="flex-1 bg-[#EC1A52] rounded-lg py-3 items-center shadow-sm"
                  >
                    <Text className="text-white text-[13px] font-Montserrat font-semibold text-center">Change{'\n'}Customer</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => {
                      setSelectedCustomerData(null);
                      updateOrder({ customerName: "Guest Customer", customerId: null });
                    }}
                    className="flex-1 bg-[#FEE2E2] rounded-lg py-3 items-center border border-[#FECACA]"
                  >
                    <Text className="text-[#EC1A52] text-[13px] font-Montserrat font-semibold text-center">Remove{'\n'}Customer</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <View className="items-center">
                <Text className="text-[#EC1A52] text-[16px] font-Montserrat font-medium mb-1">Current Status:</Text>
                <Text className="text-[#1A1A1A] font-Montserrat font-bold text-[24px] mb-6">Guest Customer</Text>
                <TouchableOpacity
                  onPress={() => setShowCustomerModal(true)}
                  className="w-full bg-[#EC1A52] rounded-xl py-4 items-center justify-center shadow-md"
                >
                  <View className="items-center">
                    <Ionicons name="add" size={32} color="white" />
                    <Text className="text-white font-Montserrat font-bold text-[18px] mt-1">Add Quick Customer</Text>
                  </View>
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* Order Summary Table (Right) */}
          <View className="flex-1 bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
            <View className="flex-row">
              {/* Left Summary Column */}
              <View className="flex-1 border-r border-gray-100">
                <View className="flex-row justify-between px-5 py-4 border-b border-gray-100">
                  <Text className="text-[#5A5F66] text-[16px] font-Montserrat font-medium">Total Products</Text>
                  <Text className="text-[#1A1A1A] text-[18px] font-Montserrat font-bold">{products.length}</Text>
                </View>
                <View className="flex-row justify-between px-5 py-4 border-b border-gray-100">
                  <Text className="text-[#5A5F66] text-[16px] font-Montserrat font-medium">Total Quantity</Text>
                  <Text className="text-[#1A1A1A] text-[18px] font-Montserrat font-bold">{summary.totalQuantity}</Text>
                </View>
                <View className="flex-row justify-between px-5 py-4 border-b border-gray-100">
                  <Text className="text-[#5A5F66] text-[16px] font-Montserrat font-medium">Sub Total</Text>
                  <Text className="text-[#1A1A1A] text-[18px] font-Montserrat font-bold">${summary.subTotal.toFixed(2)}</Text>
                </View>
                <View className="flex-row justify-between px-5 py-4">
                  <Text className="text-[#5A5F66] text-[16px] font-Montserrat font-medium">Loyalty Credit</Text>
                  <Text className="text-[#1A1A1A] text-[18px] font-Montserrat font-bold">-$10.00</Text>
                </View>
              </View>

              {/* Right Summary Column */}
              <View className="flex-1">
                <View className="flex-row justify-between px-5 py-4 border-b border-gray-100">
                  <Text className="text-[#5A5F66] text-[16px] font-Montserrat font-medium">Additional Discount</Text>
                  <Text className="text-[#1A1A1A] text-[18px] font-Montserrat font-bold">
                    {order.discountType === 2
                      ? `${order.additionalDiscount}%`
                      : `$${order.additionalDiscount.toFixed(2)}`}
                  </Text>
                </View>
                <View className="flex-row justify-between px-5 py-4 border-b border-gray-100">
                  <Text className="text-[#5A5F66] text-[16px] font-Montserrat font-medium">Delivery Charges</Text>
                  <Text className="text-[#1A1A1A] text-[18px] font-Montserrat font-bold">$0.00</Text>
                </View>
                <View className="flex-row justify-between px-5 py-4 border-b border-gray-100">
                  <Text className="text-[#5A5F66] text-[16px] font-Montserrat font-medium">Tax</Text>
                  <Text className="text-[#1A1A1A] text-[18px] font-Montserrat font-bold">${summary.tax.toFixed(2)}</Text>
                </View>
                <View className="flex-row justify-between px-5 py-4">
                  <Text className="text-[#5A5F66] text-[16px] font-Montserrat font-medium">Loyalty Earned</Text>
                  <Text className="text-[#1A1A1A] text-[18px] font-Montserrat font-bold">120</Text>
                </View>
              </View>
            </View>

            {/* Total Bar */}
            <View className="flex-row justify-between items-center bg-[#FFF0F3] border-t border-[#FEE2E2] px-6 py-4">
              <Text className="text-[#EC1A52] text-[24px] font-Montserrat font-bold">Total</Text>
              <Text className="text-[#EC1A52] text-[32px] font-Montserrat font-bold">${summary.total.toFixed(2)}</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Right Action Panel */}
      <POSSidebar
        isLandscape={true}
        onAddProduct={() => setShowSearchModal(true)}
        onCashPayment={handleCashPayment}
        onCardPayment={handleCardPayment}
        onPayLater={() => Alert.alert("Pay Later", "Feature coming soon")}
        onDeleteProduct={handleDeleteProduct}
        onEmptyCart={handleEmptyCart}
        onGoToMenu={handleGoToMenu}
        hideNavButtons={false}
      />

      {/* Modals */}
      <SearchProductModal
        visible={showSearchModal}
        onClose={() => setShowSearchModal(false)}
        onSelectProduct={handleAddProductFromSearch}
      />

      <SearchCustomerModal
        visible={showCustomerModal}
        onClose={() => setShowCustomerModal(false)}
        onSelectCustomer={(customer) => {
          if (customer) {
            setSelectedCustomerData(customer);
            updateOrder({
              customerName: customer.business_name,
              customerId: String(customer.id),
            });
          } else {
            // null means "remove customer"
            setSelectedCustomerData(null);
            updateOrder({ customerName: "Guest Customer", customerId: null });
          }
          setShowCustomerModal(false);
        }}
        currentCustomer={selectedCustomerData}
        orderSettings={orderSettings}
        onOrderSettingsChange={setOrderSettings}
      />

      <CashPaymentModal
        visible={showCashPaymentModal}
        onClose={() => setShowCashPaymentModal(false)}
        subTotal={summary.total}
        onConfirm={handleCashPaymentConfirm}
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

      {/* Barcode Print Modal */}
      <BarcodePrintModal
        visible={showBarcodePrintModal}
        onClose={() => setShowBarcodePrintModal(false)}
        cartItems={products.map((p) => ({
          productId: p.productId,
          name: p.name,
          sku: p.sku,
          salePrice: p.salePrice,
          quantity: p.quantity,
        }))}
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
      {/* Hidden TextInput for QBT2500 scanner HID input */}
      <TextInput
        ref={hiddenInputRef}
        style={{
          position: "absolute",
          width: 1,
          height: 1,
          opacity: 0,
          top: 0,
          left: 0,
        }}
        autoFocus
        blurOnSubmit={false}
        returnKeyType="done"
        onChangeText={handleScannerInput}
        onSubmitEditing={handleScannerSubmit}
        showSoftInputOnFocus={false}
        caretHidden
      />

      {/* Scan Logs Modal */}
      <Modal
        visible={showScanLogModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowScanLogModal(false)}
      >
        <Pressable
          style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", alignItems: "center" }}
          onPress={() => setShowScanLogModal(false)}
        >
          <Pressable
            style={{
              backgroundColor: "#FFF",
              borderRadius: 16,
              width: 560,
              maxHeight: "80%",
              overflow: "hidden",
            }}
            onPress={() => {}}
          >
            {/* Header */}
            <View style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              paddingHorizontal: 24,
              paddingVertical: 18,
              borderBottomWidth: 1,
              borderBottomColor: "#F0F1F4",
              backgroundColor: "#FAFAFA",
            }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                <View style={{
                  width: 40, height: 40, borderRadius: 12,
                  backgroundColor: "#EC1A52", alignItems: "center", justifyContent: "center",
                }}>
                  <Ionicons name="barcode-outline" size={22} color="#FFF" />
                </View>
                <View>
                  <Text style={{ fontFamily: "Montserrat", fontSize: 20, fontWeight: "700", color: "#1A1A1A" }}>
                    Scan Logs
                  </Text>
                  <Text style={{ fontFamily: "Montserrat", fontSize: 13, color: "#9CA3AF", marginTop: 1 }}>
                    {scanLogs.length} scan{scanLogs.length !== 1 ? "s" : ""} recorded
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                onPress={() => setShowScanLogModal(false)}
                style={{
                  width: 36, height: 36, borderRadius: 18,
                  backgroundColor: "#F3F4F6", alignItems: "center", justifyContent: "center",
                }}
              >
                <Ionicons name="close" size={20} color="#6B7280" />
              </TouchableOpacity>
            </View>

            {/* Table Header */}
            <View style={{
              flexDirection: "row",
              paddingHorizontal: 24,
              paddingVertical: 12,
              backgroundColor: "#F7F7F9",
              borderBottomWidth: 1,
              borderBottomColor: "#E5E7EB",
            }}>
              <Text style={{ width: 50, fontFamily: "Montserrat", fontSize: 12, fontWeight: "700", color: "#6B7280" }}>#</Text>
              <Text style={{ flex: 1, fontFamily: "Montserrat", fontSize: 12, fontWeight: "700", color: "#6B7280" }}>BARCODE</Text>
              <Text style={{ flex: 1.5, fontFamily: "Montserrat", fontSize: 12, fontWeight: "700", color: "#6B7280" }}>PRODUCT</Text>
              <Text style={{ width: 70, fontFamily: "Montserrat", fontSize: 12, fontWeight: "700", color: "#6B7280", textAlign: "center" }}>STATUS</Text>
              <Text style={{ width: 80, fontFamily: "Montserrat", fontSize: 12, fontWeight: "700", color: "#6B7280", textAlign: "right" }}>TIME</Text>
            </View>

            {/* Log Entries */}
            {scanLogs.length === 0 ? (
              <View style={{ paddingVertical: 60, alignItems: "center", justifyContent: "center" }}>
                <Ionicons name="scan-outline" size={56} color="#D1D5DB" />
                <Text style={{ fontFamily: "Montserrat", fontSize: 16, fontWeight: "600", color: "#9CA3AF", marginTop: 16 }}>
                  No scans yet
                </Text>
                <Text style={{ fontFamily: "Montserrat", fontSize: 13, color: "#C4C8CF", marginTop: 6, textAlign: "center", paddingHorizontal: 40 }}>
                  Scan a barcode with your QBT2500 scanner and it will appear here
                </Text>
              </View>
            ) : (
              <ScrollView style={{ maxHeight: 420 }} contentContainerStyle={{ paddingBottom: 8 }}>
                {scanLogs.map((log, index) => (
                  <View
                    key={log.id}
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      paddingHorizontal: 24,
                      paddingVertical: 14,
                      borderBottomWidth: 1,
                      borderBottomColor: "#F3F4F6",
                      backgroundColor: index % 2 === 0 ? "#FFFFFF" : "#FAFAFA",
                    }}
                  >
                    <Text style={{ width: 50, fontFamily: "Montserrat", fontSize: 13, color: "#9CA3AF" }}>
                      {scanLogs.length - index}
                    </Text>
                    <View style={{ flex: 1 }}>
                      <Text
                        style={{ fontFamily: "Montserrat", fontSize: 15, fontWeight: "700", color: "#1A1A1A", letterSpacing: 1.5 }}
                        selectable
                      >
                        {log.code}
                      </Text>
                    </View>
                    <View style={{ flex: 1.5 }}>
                      <Text
                        style={{
                          fontFamily: "Montserrat",
                          fontSize: 13,
                          fontWeight: "500",
                          color: log.matched ? "#1A1A1A" : "#9CA3AF",
                        }}
                        numberOfLines={1}
                      >
                        {log.matched ? log.productName : "—"}
                      </Text>
                    </View>
                    <View style={{ width: 70, alignItems: "center" }}>
                      <View style={{
                        paddingHorizontal: 10,
                        paddingVertical: 4,
                        borderRadius: 20,
                        backgroundColor: log.matched ? "#ECFDF5" : "#FEF2F2",
                      }}>
                        <Text style={{
                          fontFamily: "Montserrat",
                          fontSize: 11,
                          fontWeight: "700",
                          color: log.matched ? "#059669" : "#DC2626",
                        }}>
                          {log.matched ? "FOUND" : "MISS"}
                        </Text>
                      </View>
                    </View>
                    <Text style={{ width: 80, fontFamily: "Montserrat", fontSize: 12, color: "#9CA3AF", textAlign: "right" }}>
                      {log.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                    </Text>
                  </View>
                ))}
              </ScrollView>
            )}

            {/* Footer */}
            <View style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              paddingHorizontal: 24,
              paddingVertical: 16,
              borderTopWidth: 1,
              borderTopColor: "#F0F1F4",
              backgroundColor: "#FAFAFA",
            }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 16 }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                  <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: "#059669" }} />
                  <Text style={{ fontFamily: "Montserrat", fontSize: 13, color: "#6B7280" }}>
                    {scanLogs.filter((l) => l.matched).length} matched
                  </Text>
                </View>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                  <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: "#DC2626" }} />
                  <Text style={{ fontFamily: "Montserrat", fontSize: 13, color: "#6B7280" }}>
                    {scanLogs.filter((l) => !l.matched).length} missed
                  </Text>
                </View>
              </View>
              {scanLogs.length > 0 && (
                <TouchableOpacity
                  onPress={() => setScanLogs([])}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 6,
                    paddingHorizontal: 16,
                    paddingVertical: 8,
                    borderRadius: 8,
                    borderWidth: 1,
                    borderColor: "#E5E7EB",
                    backgroundColor: "#FFF",
                  }}
                >
                  <Ionicons name="trash-outline" size={16} color="#DC2626" />
                  <Text style={{ fontFamily: "Montserrat", fontSize: 13, fontWeight: "600", color: "#DC2626" }}>
                    Clear All
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}
