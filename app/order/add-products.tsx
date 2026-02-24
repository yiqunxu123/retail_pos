import { colors, iconSize } from '@/utils/theme';
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Alert, Dimensions, Image, Modal, Pressable, ScrollView, Text, TextInput, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { captureRef } from "react-native-view-shot";
import { AddDiscountModal } from "../../components/AddDiscountModal";
import { type QuickCustomerResult } from "../../components/AddQuickCustomerModal";
import { AddTaxModal } from "../../components/AddTaxModal";
import { CashEntryModal } from "../../components/CashEntryModal";
import { CashPaymentModal } from "../../components/CashPaymentModal";
import { CashResultModal } from "../../components/CashResultModal";
import { DeclareCashModal } from "../../components/DeclareCashModal";
import { AddProductsCustomerCard } from "../../components/order/AddProductsCustomerCard";
import { AddProductsOrderSummary } from "../../components/order/AddProductsOrderSummary";
import { AddProductsTopBar } from "../../components/order/AddProductsTopBar";
import { HiddenScannerInput } from "../../components/order/HiddenScannerInput";
import {
  AddNotePanelController,
  AddNotePanelControllerHandle,
} from "../../components/order/AddNotePanelController";
import {
  SearchProductModalController,
  SearchProductModalControllerHandle,
} from "../../components/order/SearchProductModalController";
import { ParkedOrdersModal } from "../../components/ParkedOrdersModal";
import { ParkOrderModal } from "../../components/ParkOrderModal";
import { POSSidebar } from "../../components/POSSidebar";
import { ProductSettingsModal } from "../../components/ProductSettingsModal";
import { ProductTable } from "../../components/ProductTable";
import { ReceiptData, ReceiptTemplate } from "../../components/ReceiptTemplate";
import { SaleInvoiceModal } from "../../components/SaleInvoiceModal";
import { SearchProduct } from "../../components/SearchProductModal";
import { useAuth } from "../../contexts/AuthContext";
import { OrderProduct, useOrder } from "../../contexts/OrderContext";
import { useParkedOrders } from "../../contexts/ParkedOrderContext";
import {
  createSaleOrder,
  getSaleOrderById,
  type CreateSaleOrderPayload,
  type SaleOrderEntity,
} from "../../utils/api/orders";
import { useRenderTrace } from "../../utils/debug/useRenderTrace";
import { useProducts } from "../../utils/powersync/hooks";
import {
  getPoolStatus,
  isAnyPrinterModuleAvailable,
  openCashDrawer,
  printToAllWithFormat,
} from "../../utils/PrinterPoolManager";
import { printBarcodeLabelsForCart } from "../../utils/barcodePrint";
import { printImageToAll } from "../../utils/receiptImagePrint";
import { formatReceiptText } from "../../utils/receiptTextFormat";

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

/**
 * Staff POS Sales Screen - Matches Figma design
 */
function AddProductsHeavy() {
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

  // Delay mounting heavy modals so first paint is fast
  const [modalsReady, setModalsReady] = useState(false);
  // Mount controllers/scanner later than base modals to reduce first heavy burst
  const [controllersReady, setControllersReady] = useState(false);
  useEffect(() => {
    console.log('[AddProducts] modalsReady timer started');
    const id = setTimeout(() => {
      console.log('[AddProducts] modalsReady = true');
      setModalsReady(true);
    }, 300);
    return () => clearTimeout(id);
  }, []);
  useEffect(() => {
    if (!modalsReady) return;
    const id = setTimeout(() => {
      console.log('[AddProducts] controllersReady = true');
      setControllersReady(true);
    }, 350);
    return () => clearTimeout(id);
  }, [modalsReady]);
  const scanBufferRef = useRef("");
  const scanQueueRef = useRef<string[]>([]);  // Queue for pending scans
  const processingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hiddenInputRef = useRef<TextInput>(null!);
  const searchProductModalRef = useRef<SearchProductModalControllerHandle>(null);
  const addNotePanelRef = useRef<AddNotePanelControllerHandle>(null);
  const { products: allProducts, isLoading: isProductsLoading } = useProducts({ enabled: modalsReady });
  const [showSearchProductModal, setShowSearchProductModal] = useState(false);
  const [showAddNotePanel, setShowAddNotePanel] = useState(false);
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
  const selectedProductRef = useRef<OrderProduct | null>(null);
  selectedProductRef.current = selectedProduct;

  // Receipt image
  const receiptRef = useRef<View>(null);
  const [generatingReceipt, setGeneratingReceipt] = useState(false);
  const [receiptImageUri, setReceiptImageUri] = useState<string | null>(null);
  const [showReceiptPreview, setShowReceiptPreview] = useState(false);
  const [sendingToPrinter, setSendingToPrinter] = useState(false);
  const [receiptImageSize, setReceiptImageSize] = useState<{ w: number; h: number }>({ w: 384, h: 600 });

  const products = order.products;
  const productsRef = useRef<OrderProduct[]>([]);
  productsRef.current = products;
  const summary = getOrderSummary();
  const summaryRef = useRef(summary);
  summaryRef.current = summary;
  const orderRef = useRef(order);
  orderRef.current = order;
  const selectedCustomerDataRef = useRef(selectedCustomerData);
  selectedCustomerDataRef.current = selectedCustomerData;
  const productLookupMap = useMemo(() => {
    const map = new Map<string, (typeof allProducts)[number]>();
    allProducts.forEach((product) => {
      const sku = (product.sku || "").trim().toLowerCase();
      const upc = (product.upc || "").trim().toLowerCase();
      if (sku) map.set(sku, product);
      if (upc) map.set(upc, product);
    });
    return map;
  }, [allProducts]);
  const barcodeCartItems = useMemo(
    () =>
      products.map((p) => ({
        productId: p.productId,
        name: p.name,
        sku: p.sku,
        salePrice: p.salePrice,
        quantity: p.quantity,
      })),
    [products]
  );
  // TEMP: Disabled for performance testing
  // const scanLogSummary = useMemo(() => {
  //   let matched = 0;
  //   for (const log of scanLogs) {
  //     if (log.matched) matched += 1;
  //   }
  //   return {
  //     matched,
  //     missed: scanLogs.length - matched,
  //   };
  // }, [scanLogs]);
  const hasBlockingScanModal = useMemo(
    () =>
      showAddNotePanel ||
      showCashPaymentModal ||
      showDiscountModal ||
      showProductSettingsModal ||
      showParkOrderModal ||
      showParkedOrdersModal ||
      showDeclareCashModal ||
      showCashEntryModal ||
      showCashResultModal ||
      showTaxModal ||
      showInvoiceModal,
    [
      showAddNotePanel,
      showCashPaymentModal,
      showDiscountModal,
      showProductSettingsModal,
      showParkOrderModal,
      showParkedOrdersModal,
      showDeclareCashModal,
      showCashEntryModal,
      showCashResultModal,
      showTaxModal,
      showInvoiceModal,
    ]
  );
  const handleSearchProductModalVisibleStateChange = useCallback((visible: boolean) => {
    console.log(`[Modal] SearchProduct visible=${visible}`);
    if (visible) {
      hiddenInputRef.current?.blur();
    } else {
      // Unmount modal when closed
      setShowSearchProductModal(false);
    }
  }, []);

  // Open search product modal from sidebar
  const handleOpenSearchFromSidebar = useCallback(() => {
    hiddenInputRef.current?.blur();
    setShowSearchProductModal(true);
  }, []);

  useRenderTrace(
    "AddProductsScreen",
    {
      productsLength: products.length,
      allProductsLength: allProducts.length,
      isProductsLoading,
      summaryTotal: summary.total,
      selectedProductId: selectedProduct?.id ?? null,
      // scanLogsLength: scanLogs.length,
      hasBlockingScanModal,
      showAddNotePanel,
      showCashPaymentModal,
      showDiscountModal,
      showParkOrderModal,
      showParkedOrdersModal,
      showDeclareCashModal,
      showCashEntryModal,
      showCashResultModal,
      showTaxModal,
      showInvoiceModal,
      showProductSettingsModal,
      showReceiptPreview,
    },
    { throttleMs: 100, enabled: false }
  );

  useEffect(() => {
    const clickAt = (globalThis as any).__salesNavClickAt;
    const routeMountedAt = (globalThis as any).__salesRouteMountedAt;
    const now = Date.now();
    if (typeof clickAt === "number") {
      console.log(`[NavPerf][Sales] clickToHeavyTreeMountMs=${now - clickAt}`);
    }
    if (typeof routeMountedAt === "number" && now - routeMountedAt < 10000) {
      console.log(`[NavPerf][Sales] routeToHeavyTreeMountMs=${now - routeMountedAt}`);
    }
  }, []);

  // Preview card / image dimensions based on screen short edge (stable across renders)
  const previewCardWidth = useMemo(() =>
    Math.min(Dimensions.get('window').width, Dimensions.get('window').height) * 0.75
  , []);
  const previewImgWidth = previewCardWidth - 32;
  const previewImgHeight = receiptImageSize.w > 0
    ? previewImgWidth * (receiptImageSize.h / receiptImageSize.w)
    : previewImgWidth * 1.5;

  // Process a scanned barcode: look up product, add to cart
  const handleScanComplete = useCallback((code: string) => {
    const t0 = Date.now();
    const trimmed = code.trim();
    if (!trimmed) return;

    const keyword = trimmed.toLowerCase();
    const matchedProduct = productLookupMap.get(keyword);
    const t1 = Date.now();

    if (matchedProduct) {
      const newProduct: OrderProduct = {
        id: `${matchedProduct.id}-${Date.now()}`,
        productId: matchedProduct.id,
        sku: matchedProduct.sku,
        name: matchedProduct.name,
        salePrice: matchedProduct.salePrice,
        unit: "Piece",
        quantity: 1,
        tnVaporTax: 0,
        ncVaporTax: 0,
        total: matchedProduct.salePrice,
      };
      addProduct(newProduct);
      const t2 = Date.now();
      console.log(`[Scan] ✅ "${matchedProduct.name}" lookup=${t1-t0}ms addProduct=${t2-t1}ms total=${t2-t0}ms`);
    } else {
      console.log(`[Scan] ❌ "${keyword}" NOT FOUND, lookup=${t1-t0}ms`);
    }
  }, [productLookupMap, addProduct]);

  // Refocus hidden input whenever a modal closes
  const shouldRestoreScannerFocus = useCallback(
    () => !hasBlockingScanModal && !showSearchProductModal && !showAddNotePanel,
    [hasBlockingScanModal, showSearchProductModal, showAddNotePanel]
  );

  // Process scan queue - runs independently from input
  const processQueue = useCallback(() => {
    if (scanQueueRef.current.length === 0) {
      processingTimerRef.current = null;
      return;
    }
    
    const code = scanQueueRef.current.shift()!;
    const t0 = Date.now();
    handleScanComplete(code);
    const t1 = Date.now();
    console.log(`[Scan] Processed: "${code}" in ${t1 - t0}ms, remaining: ${scanQueueRef.current.length}`);
    
    // Process next item
    processingTimerRef.current = setTimeout(() => {
      processQueue();
    }, 50);
  }, [handleScanComplete]);

  // Track the offset of last Enter so we only extract new chars
  const lastSubmitOffsetRef = useRef(0);

  // Scanner submits via Enter key (onSubmitEditing)
  // Don't try to clear - just track offset and extract new portion
  const handleScannerSubmit = useCallback(() => {
    const t0 = Date.now();
    const fullText = scanBufferRef.current;
    const newPart = fullText.slice(lastSubmitOffsetRef.current).trim();
    console.log(`[Scan] Enter at ${t0}: "${newPart}" (offset=${lastSubmitOffsetRef.current})`);
    
    // Update offset to current position
    lastSubmitOffsetRef.current = fullText.length;
    
    if (newPart.length >= 3) {
      scanQueueRef.current.push(newPart);
    }
    
    // Start processing if not already running
    if (!processingTimerRef.current) {
      processQueue();
    }
  }, [processQueue]);

  // Track input - only ref, no state, no re-render
  const handleScannerInput = useCallback((text: string) => {
    scanBufferRef.current = text;
  }, []);

  // Focus hidden input after it's mounted and ready
  useEffect(() => {
    if (!controllersReady) return;
    if (shouldRestoreScannerFocus()) {
      setTimeout(() => {
        hiddenInputRef.current?.focus();
      }, 100);
    }
  }, [controllersReady, shouldRestoreScannerFocus]);

  // Auto-open SearchProductModal when showSearchProductModal becomes true.
  // Must wait for modalsReady (Controller mounts) and use rAF so ref is set after commit.
  useEffect(() => {
    if (!modalsReady || !showSearchProductModal) return;
    const id = requestAnimationFrame(() => {
      searchProductModalRef.current?.open();
    });
    return () => cancelAnimationFrame(id);
  }, [showSearchProductModal, modalsReady]);

  // Auto-open AddNotePanel when showAddNotePanel becomes true
  useEffect(() => {
    if (showAddNotePanel && addNotePanelRef.current) {
      addNotePanelRef.current.open();
    }
  }, [showAddNotePanel]);

  const handleHiddenInputFocus = useCallback(() => {
    // Scanner input focused
  }, []);

  const handleHiddenInputBlur = useCallback(() => {
    if (!shouldRestoreScannerFocus()) return;
    setTimeout(() => {
      if (shouldRestoreScannerFocus()) {
        hiddenInputRef.current?.focus();
      }
    }, 80);
  }, [shouldRestoreScannerFocus]);

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
    const newProduct: OrderProduct = {
      id: `${searchProduct.id}-${Date.now()}`,
      productId: searchProduct.id,
      sku: searchProduct.sku,
      name: searchProduct.name,
      salePrice: searchProduct.price,
      unit: "Piece",
      quantity: 1,
      tnVaporTax: 0,
      ncVaporTax: 0,
      total: searchProduct.price,
    };
    addProduct(newProduct);
  }, [addProduct]);

  const handleQuantityChange = useCallback((id: string, delta: number) => {
    updateProductQuantity(id, delta, true);
  }, [updateProductQuantity]);

  const handleSelectProductFromTable = useCallback((product: any) => {
    setSelectedProduct(product as OrderProduct);
  }, []);

  const handleOpenBarcodePrintModal = useCallback(async () => {
    await printBarcodeLabelsForCart(barcodeCartItems, allProducts);
  }, [barcodeCartItems, allProducts]);

  const handleOpenProductSettings = useCallback(() => {
    if (productsRef.current.length === 0) {
      Alert.alert("No Product", "Please add a product first");
      return;
    }
    const productToEdit = selectedProductRef.current || productsRef.current[0];
    setSelectedProduct(productToEdit);
    setShowProductSettingsModal(true);
  }, []);

  const handleOpenCustomerModal = useCallback(() => {
    hiddenInputRef.current?.blur();
    setShowAddNotePanel(true);
  }, []);

  const handleOrderSettingsChange = useCallback(
    (settings: {
      paymentTerms?: string;
      shippingType?: string;
      orderNumber?: string;
      invoiceDueDate?: string;
      notesInternal?: string;
      notesInvoice?: string;
    }) => {
      setOrderSettings((prev) => ({ ...prev, ...settings }));
    },
    []
  );

  const handleRemoveCustomer = useCallback(() => {
    setSelectedCustomerData(null);
    updateOrder({ customerName: "Guest Customer", customerId: null });
  }, [updateOrder]);

  const handleSelectCustomer = useCallback((customer: any) => {
    setSelectedCustomerData(customer);
    updateOrder({
      customerName: customer.business_name,
      customerId: String(customer.id),
    });
  }, [updateOrder]);

  const handleParkOrder = useCallback(() => {
    if (productsRef.current.length === 0) {
      Alert.alert("Error", "Please add products to cart first");
      return;
    }
    setShowParkOrderModal(true);
  }, []);

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

  const handleEmptyCart = useCallback(() => {
    Alert.alert("Empty Cart", "Are you sure you want to remove all items?", [
      { text: "Cancel", style: "cancel" },
      { text: "Empty", style: "destructive", onPress: () => clearOrder() },
    ]);
  }, [clearOrder]);

  const handleDeleteProduct = useCallback(() => {
    if (!selectedProductRef.current) {
      Alert.alert("No Selection", "Please select a product to delete.");
      return;
    }
    removeProduct(selectedProductRef.current.id);
    setSelectedProduct(null);
  }, [removeProduct]);

  const handleGoToMenu = useCallback(() => {
    router.back();
  }, [router]);

  const handleAddNotes = useCallback(() => {
    setShowAddNotePanel(true);
  }, []);

  const handleAddNotePanelVisibleStateChange = useCallback((visible: boolean) => {
    if (visible) {
      hiddenInputRef.current?.blur();
    }
    if (!visible) setShowAddNotePanel(false);
  }, []);

  const handleAddTax = useCallback(() => {
    setShowTaxModal(true);
  }, []);

  const handleAddDiscount = useCallback(() => {
    setShowDiscountModal(true);
  }, []);

  const handleVoidPayment = useCallback(() => {
    Alert.alert("Void Payment", "Feature coming soon");
  }, []);

  // Place Order Logic - Now part of payment flow
  const executeOrderPlacement = useCallback(async (paymentType: number = 1) => {
    const currentProducts = productsRef.current;
    const currentOrder = orderRef.current;
    const currentSummary = summaryRef.current;
    const currentCustomer = selectedCustomerDataRef.current;
    
    if (currentProducts.length === 0) return;

    setPlacingOrder(true);
    try {
      const now = new Date().toISOString();
      const payload: CreateSaleOrderPayload = {
        sale_order_details: currentProducts.map((p) => ({
          product_id: parseInt(p.productId, 10),
          qty: p.quantity,
          unit: 1, 
          unit_price: p.salePrice,
          discount: 0,
          discount_type: 1,
        })),
        customer_id: currentOrder.customerId ? parseInt(currentOrder.customerId, 10) : null,
        order_type: 1,
        sale_type: 1,
        shipping_type: 1,
        channel_id: 1,
        order_date: now,
        dispatch_date: now,
        due_date: now,
        discount: parseFloat(
          (currentOrder.discountType === 2
            ? (currentSummary.subTotal * currentOrder.additionalDiscount) / 100
            : currentOrder.additionalDiscount
          ).toFixed(2)
        ),
        discount_type: 1,
        delivery_charges: currentOrder.shippingCharges || 0,
        payment_detail: {
          payments: [
            {
              payment_type: paymentType,
              amount: parseFloat(currentSummary.total.toFixed(2)),
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
            sale_order_details: currentProducts.map((p, idx) => ({
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
            customer: currentCustomer ? {
              id: parseInt(currentOrder.customerId || "0", 10),
              no: currentCustomer.no || undefined,
              business_name: currentCustomer.business_name || "",
              name: currentCustomer.name || undefined,
              email: currentCustomer.email || undefined,
              business_phone_no: currentCustomer.business_phone_no || undefined,
              customer_billing_details: currentCustomer.customer_billing_details || undefined,
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
  }, [user, buildReceiptFromOrder, clearOrder, router]);

  const handleCashPayment = useCallback(() => {
    if (productsRef.current.length === 0) {
      Alert.alert("Error", "Please add products to cart first");
      return;
    }
    setShowCashPaymentModal(true);
  }, []);

  const handleCardPayment = useCallback(() => {
    if (productsRef.current.length === 0) {
      Alert.alert("Error", "Please add products to cart first");
      return;
    }
    Alert.alert("Card Payment", "Process card payment?", [
      { text: "Cancel", style: "cancel" },
      { text: "Confirm", onPress: () => executeOrderPlacement(2) }
    ]);
  }, [executeOrderPlacement]);

  const handlePayLater = useCallback(() => {
    Alert.alert("Pay Later", "Feature coming soon");
  }, []);

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
        <AddProductsTopBar
          insetTop={insets.top}
          onOpenBarcodePrintModal={handleOpenBarcodePrintModal}
          onOpenProductSettings={handleOpenProductSettings}
        />

        {/* Products Table */}
        <ProductTable
          products={products}
          onQuantityChange={handleQuantityChange}
          selectedProductId={selectedProduct?.id}
          onSelectProduct={handleSelectProductFromTable}
        />

        <View className="flex-row p-4 gap-4 bg-[#F7F7F9]">
          <AddProductsCustomerCard
            customer={selectedCustomerData}
            onOpenCustomerModal={handleOpenCustomerModal}
            onRemoveCustomer={handleRemoveCustomer}
          />
          <AddProductsOrderSummary
            productsCount={products.length}
            totalQuantity={summary.totalQuantity}
            subTotal={summary.subTotal}
            tax={summary.tax}
            total={summary.total}
            additionalDiscount={order.additionalDiscount}
            discountType={order.discountType}
          />
        </View>
      </View>

      {/* Right Action Panel */}
      {useMemo(() => (
        <POSSidebar
          isLandscape={true}
          onAddProduct={handleOpenSearchFromSidebar}
          onCashPayment={handleCashPayment}
          onCardPayment={handleCardPayment}
          onPayLater={handlePayLater}
          onDeleteProduct={handleDeleteProduct}
          onEmptyCart={handleEmptyCart}
          onGoToMenu={handleGoToMenu}
          onParkOrder={handleParkOrder}
          onAddTax={handleAddTax}
          onAddDiscount={handleAddDiscount}
          onVoidPayment={handleVoidPayment}
          onAddNotes={handleAddNotes}
          hideNavButtons={false}
        />
      ), [handleOpenSearchFromSidebar, handleCashPayment, handleCardPayment, handlePayLater, handleDeleteProduct, handleEmptyCart, handleGoToMenu, handleParkOrder, handleAddTax, handleAddDiscount, handleVoidPayment, handleAddNotes])}

      {/* Modals — deferred to keep first paint fast */}
      {modalsReady && (<>

      {showSearchProductModal && (<SearchProductModalController
        ref={searchProductModalRef}
        onSelectProduct={handleAddProductFromSearch}
        onVisibleStateChange={handleSearchProductModalVisibleStateChange}
      />)}

      <AddNotePanelController
        ref={addNotePanelRef}
        onVisibleStateChange={handleAddNotePanelVisibleStateChange}
        onSelectCustomer={handleSelectCustomer}
        orderSettings={orderSettings}
        onOrderSettingsChange={handleOrderSettingsChange}
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

      </>)}

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
              <Text className="text-lg font-bold" style={{ color: '#111' }}>Print Preview</Text>
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
                <Ionicons name="close-circle" size={26} color={colors.textTertiary} />
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
                  <Text style={{ color: colors.textTertiary }}>No image preview available</Text>
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
                  backgroundColor: sendingToPrinter ? colors.textTertiary : colors.primary,
                  paddingVertical: 12,
                  borderRadius: 8,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                }}
              >
                <Ionicons name="print" size={iconSize.sm} color="#FFF" />
                <Text className="text-base font-bold" style={{ color: '#FFF' }}>
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
                    backgroundColor: colors.info,
                    paddingVertical: 12,
                    borderRadius: 8,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6,
                  }}
                >
                  <Ionicons name="add-circle-outline" size={iconSize.sm} color="#FFF" />
                  <Text className="text-base font-bold" style={{ color: '#FFF' }}>New Order</Text>
                </TouchableOpacity>
              )}
            </View>
          </Pressable>
        </Pressable>
      </Modal>
      {controllersReady && (<HiddenScannerInput
        inputRef={hiddenInputRef}
        onChangeText={handleScannerInput}
        onSubmitEditing={handleScannerSubmit}
        onFocus={handleHiddenInputFocus}
        onBlur={handleHiddenInputBlur}
      />)}
    </View>
  );
}

function AddProductsContent() {
  const [heavyReady, setHeavyReady] = useState(false);
  const insets = useSafeAreaInsets();
  const noop = useCallback(() => {}, []);

  useEffect(() => {
    const clickAt = (globalThis as any).__salesNavClickAt;
    const routeMountedAt = (globalThis as any).__salesRouteMountedAt;
    const now = Date.now();
    if (typeof clickAt === "number") {
      console.log(`[NavPerf][Sales] clickToContentMountMs=${now - clickAt}`);
    }
    if (typeof routeMountedAt === "number" && now - routeMountedAt < 10000) {
      console.log(`[NavPerf][Sales] routeToContentMountMs=${now - routeMountedAt}`);
    }

    const id = setTimeout(() => {
      const heavyAt = Date.now();
      if (typeof clickAt === "number") {
        console.log(`[NavPerf][Sales] clickToHeavyMountMs=${heavyAt - clickAt}`);
      }
      setHeavyReady(true);
    }, 0);

    return () => clearTimeout(id);
  }, []);

  if (!heavyReady) {
    return (
      <View style={{ flex: 1, flexDirection: "row", backgroundColor: colors.backgroundTertiary }}>
        <View style={{ flex: 1 }}>
          <AddProductsTopBar
            insetTop={insets.top}
            onOpenBarcodePrintModal={noop}
            onOpenProductSettings={noop}
          />
          <ProductTable
            products={[]}
            onQuantityChange={noop}
          />
          <View className="flex-row p-4 gap-4 bg-[#F7F7F9]">
            <AddProductsCustomerCard
              customer={null}
              onOpenCustomerModal={noop}
              onRemoveCustomer={noop}
            />
            <AddProductsOrderSummary
              productsCount={0}
              totalQuantity={0}
              subTotal={0}
              tax={0}
              total={0}
              additionalDiscount={0}
              discountType={1}
            />
          </View>
        </View>
        <POSSidebar
          isLandscape={true}
          onAddProduct={noop}
          onCashPayment={noop}
          onCardPayment={noop}
          onPayLater={noop}
          onDeleteProduct={noop}
          onEmptyCart={noop}
          onGoToMenu={noop}
          onParkOrder={noop}
          onAddTax={noop}
          onAddDiscount={noop}
          onVoidPayment={noop}
          onAddNotes={noop}
          hideNavButtons={false}
        />
      </View>
    );
  }

  return <AddProductsHeavy />;
}

export default function AddProductsScreen() {
  useEffect(() => {
    const routeMountedAt = Date.now();
    (globalThis as any).__salesRouteMountedAt = routeMountedAt;
    const clickAt = (globalThis as any).__salesNavClickAt;
    if (typeof clickAt === "number") {
      console.log(`[NavPerf][Sales] clickToRouteMountMs=${routeMountedAt - clickAt}`);
    }
    const id = requestAnimationFrame(() => {
      const firstFrameAt = Date.now();
      if (typeof clickAt === "number") {
        console.log(`[NavPerf][Sales] clickToFirstFrameMs=${firstFrameAt - clickAt}`);
      }
    });
    return () => cancelAnimationFrame(id);
  }, []);
  return <AddProductsContent />;
}

