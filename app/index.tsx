import { FontAwesome5, Ionicons, MaterialCommunityIcons, MaterialIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { Alert, ScrollView, Text, ToastAndroid, TouchableOpacity, useWindowDimensions, View } from "react-native";
import {
  Header,
  SIDEBAR_WIDTH,
  StatCard
} from "../components";
import { CashEntryModal } from "../components/CashEntryModal";
import { CashResultModal } from "../components/CashResultModal";
import { DeclareCashModal } from "../components/DeclareCashModal";
import { ParkedOrdersModal } from "../components/ParkedOrdersModal";
import { STAFF_SIDEBAR_WIDTH } from "../components/StaffSidebar";
import { useAuth } from "../contexts/AuthContext";
import { useClock } from "../contexts/ClockContext";
import { useParkedOrders } from "../contexts/ParkedOrderContext";
import { useViewMode } from "../contexts/ViewModeContext";
import { 
  print, 
  openCashDrawer, 
  addPrinterListener, 
  getPoolStatus,
  getPrinters,
  addPrinter,
  isAnyPrinterModuleAvailable,
  logPoolStatus,
} from "../utils/PrinterPoolManager";
import { useDashboardStats } from "../utils/powersync/hooks";

// Default printer configuration
const DEFAULT_PRINTER_IP = "192.168.1.100";
const DEFAULT_PRINTER_PORT = 9100;

// Format currency
const formatCurrency = (value: number): string => {
  if (value >= 1000000) {
    return `$${(value / 1000000).toFixed(2)}M`;
  } else if (value >= 1000) {
    return `$${(value / 1000).toFixed(2)}K`;
  }
  return `$${value.toFixed(2)}`;
};

export default function Dashboard() {
  const { width, height } = useWindowDimensions();
  const router = useRouter();
  const { user, isAdmin } = useAuth();
  const { isClockedIn, selectedPosLine, selectPosLine, clockIn, getClockInTimeString, getElapsedTime } = useClock();
  const { stats } = useDashboardStats();
  const { viewMode, setViewMode, isStaffMode } = useViewMode();
  
  // Printer config state (loaded from AsyncStorage)
  const [printerIp, setPrinterIp] = useState(DEFAULT_PRINTER_IP);
  const [printerPort, setPrinterPort] = useState(DEFAULT_PRINTER_PORT);
  const [clockDuration, setClockDuration] = useState("00:00:00");
  
  // Parked orders
  const { parkedOrders, resumeOrder, deleteParkedOrder } = useParkedOrders();
  const [showParkedOrdersModal, setShowParkedOrdersModal] = useState(false);
  
  // Cash Management modals
  const [showDeclareCashModal, setShowDeclareCashModal] = useState(false);
  const [showCashEntryModal, setShowCashEntryModal] = useState(false);
  const [showCashResultModal, setShowCashResultModal] = useState(false);
  const [cashResult, setCashResult] = useState({ isMatched: true, actualCash: 0 });
  
  // Mock cash summary
  const cashSummary = {
    openingBalance: 200.00,
    totalSales: 1250.50,
    totalRefunds: 45.00,
    expectedCash: 200.00 + 1250.50 - 45.00,
  };
  
  // Check if user is admin
  const showAdminStats = isAdmin();
  
  // Determine layout orientation
  const isLandscape = width > height;
  
  // Calculate available content width
  const sidebarWidth = isStaffMode ? STAFF_SIDEBAR_WIDTH : SIDEBAR_WIDTH;
  const contentWidth = isLandscape ? width - sidebarWidth : width;

  // Update clock duration
  useEffect(() => {
    if (!isClockedIn) {
      setClockDuration("00:00:00");
      return;
    }
    const interval = setInterval(() => {
      setClockDuration(getElapsedTime());
    }, 1000);
    return () => clearInterval(interval);
  }, [isClockedIn, getElapsedTime]);
  
  // Load saved printer settings on mount
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const savedIp = await AsyncStorage.getItem("printer_ip");
        const savedPort = await AsyncStorage.getItem("printer_port");
        if (savedIp) setPrinterIp(savedIp);
        if (savedPort) setPrinterPort(parseInt(savedPort, 10) || DEFAULT_PRINTER_PORT);
      } catch (e) {
        console.log("Failed to load printer settings");
      }
    };
    loadSettings();
  }, []);

  // Initialize printer pool from saved settings - 只运行一次
  useEffect(() => {
    let isMounted = true;
    
    const initPrinterPool = async () => {
      // 如果池中已有打印机，说明已初始化过，跳过
      if (getPrinters().length > 0) {
        console.log("🖨️ [Dashboard] Pool already has printers, skipping init");
        return;
      }
      
      console.log("🖨️ [Dashboard] Initializing printer pool...");
      try {
        // Load printer pool config from AsyncStorage
        const savedConfig = await AsyncStorage.getItem("printer_pool_config");
        console.log("🖨️ [Dashboard] Saved config:", savedConfig ? "found" : "not found");
        console.log("🖨️ [Dashboard] Raw config:", savedConfig);
        
        if (!isMounted) return;
        
        if (savedConfig) {
          const printers = JSON.parse(savedConfig);
          console.log("🖨️ [Dashboard] Loading", printers.length, "printers from config");
          printers.forEach((p: any) => {
            if (!getPrinters().find(existing => existing.id === p.id)) {
              console.log("🖨️ [Dashboard] Adding printer:", p.id, p.name);
              addPrinter(p);
            }
          });
        } else {
          console.log("🖨️ [Dashboard] No saved printer config");
        }
        
        // Log final pool status
        const status = getPoolStatus();
        console.log("🖨️ [Dashboard] Pool initialized:", status.printers.length, "printers");
        status.printers.forEach(p => {
          console.log("   -", p.id, `(${p.name})`, p.enabled ? "enabled" : "disabled", p.status);
        });
      } catch (e) {
        console.log("🖨️ [Dashboard] Failed to init printer pool:", e);
      }
    };
    initPrinterPool();

    // Listen to print events
    const unsubscribe = addPrinterListener((event) => {
      console.log("🖨️ [Dashboard] Print event:", event.type, event.jobId || "", event.printerId || "");
      if (event.type === 'job_failed') {
        Alert.alert("Print Error", `Failed to print: ${event.data?.error || 'Unknown error'}`);
      }
    });
    
    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []); // 移除依赖，只运行一次

  // Test receipt content
  const buildTestReceipt = (): string => {
    return `
<CB>ITITANS STORE</CB>
<C>123 Main Street</C>
<C>City, State 12345</C>
<C>================================</C>

TEST PRINT RECEIPT
Date: ${new Date().toLocaleString()}

Coffee Latte          x2    $8.00
Sandwich              x1   $12.50
Cookies               x3    $6.00

<C>--------------------------------</C>
<CB>TOTAL: $26.50</CB>
<C>--------------------------------</C>

<C>Thank you for shopping!</C>
<C>Please come again</C>

`;
  };

  // Test print function
  const handleTestPrint = () => {
    try {
      console.log("🖨️ [Dashboard] ========== Test print triggered ==========");
      
      if (!isClockedIn) {
        clockIn("TEST-001", 1);
      }

      const poolStatus = getPoolStatus();
      const hasEnabledPrinters = poolStatus.printers.some(p => p.enabled);
      const moduleAvailable = isAnyPrinterModuleAvailable();

      // 构建状态信息
      const idlePrinters = poolStatus.printers.filter(p => p.enabled && p.status === 'idle').length;
      const busyPrinters = poolStatus.printers.filter(p => p.status === 'busy').length;
      const statusMsg = `打印机: ${poolStatus.printers.length}台 (空闲${idlePrinters}/忙${busyPrinters}) | 队列: ${poolStatus.queueLength}`;

      console.log("🖨️ [Dashboard] Pool status:", {
        printerCount: poolStatus.printers.length,
        hasEnabledPrinters,
        moduleAvailable,
        queueLength: poolStatus.queueLength,
        printers: poolStatus.printers.map(p => `${p.id}(${p.status})`).join(", ")
      });

      if (!moduleAvailable || !hasEnabledPrinters) {
        console.log("🖨️ [Dashboard] No available printer, showing toast");
        ToastAndroid.show(`❌ 无可用打印机 | ${statusMsg}`, ToastAndroid.LONG);
        return;
      }

      const receipt = buildTestReceipt();
      console.log("🖨️ [Dashboard] Calling print()...");
      const jobId = print(receipt);
      console.log("🖨️ [Dashboard] Print job queued:", jobId);
      
      // 显示打印机状态
      const newStatus = getPoolStatus();
      const busyCount = newStatus.printers.filter(p => p.status === 'busy').length;
      const idleCount = newStatus.printers.filter(p => p.status === 'idle' && p.enabled).length;
      ToastAndroid.show(
        `✅ 打印任务已发送 | 打印中: ${busyCount} | 空闲: ${idleCount} | 等待: ${newStatus.queueLength}`,
        ToastAndroid.LONG
      );
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.log("🖨️ [Dashboard] ERROR:", msg, err);
      ToastAndroid.show(`❌ 错误: ${msg}`, ToastAndroid.LONG);
    }
  };

  // =========================================================================
  // Staff Home Content
  // =========================================================================
  if (isStaffMode) {
    return (
      <View className="flex-1 bg-gray-100">
        <ScrollView 
          className="flex-1"
          contentContainerStyle={{ padding: 16 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Header Bar */}
          <View 
            className="rounded-xl p-5 mb-4 flex-row justify-between items-center"
            style={{
              backgroundColor: "#EC1A52",
              shadowColor: "#989898",
              shadowOffset: { width: 4, height: 4 },
              shadowOpacity: 0.25,
              shadowRadius: 4,
              elevation: 4,
            }}
          >
            <View className="flex-1">
              <Text 
                className="text-white font-semibold"
                style={{ fontSize: 28, letterSpacing: -0.5 }}
              >
                Welcome to KHUB POS System
              </Text>
              <Text 
                className="text-white font-medium mt-1"
                style={{ fontSize: 16 }}
              >
                Access sales, reporting, and system actions quickly and securely.
              </Text>
            </View>
            
            {/* Role Badge */}
            <View 
              className="bg-white rounded-xl px-4 py-2 ml-4"
              style={{ borderWidth: 1, borderColor: "#1A1A1A" }}
            >
              <Text 
                className="font-semibold"
                style={{ fontSize: 16, color: "#1A1A1A" }}
              >
                STAFF
              </Text>
            </View>
          </View>

          {/* Primary Action Buttons */}
          <View className="flex-row gap-4 mb-4">
            <TouchableOpacity
              onPress={() => router.push("/order/add-products")}
              disabled={!isClockedIn}
              className="flex-1 rounded-xl justify-center items-center"
              style={{
                backgroundColor: isClockedIn ? "#EC1A52" : "#848484",
                minHeight: 160,
                shadowColor: "#989898",
                shadowOffset: { width: 4, height: 4 },
                shadowOpacity: 0.25,
                shadowRadius: 4,
                elevation: 4,
                opacity: isClockedIn ? 1 : 0.7,
              }}
            >
              <Text 
                className="text-white font-medium text-center"
                style={{ fontSize: 26, letterSpacing: -0.5 }}
              >
                Start Sale
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setShowParkedOrdersModal(true)}
              disabled={!isClockedIn}
              className="flex-1 rounded-xl justify-center items-center"
              style={{
                backgroundColor: isClockedIn ? "#5F4BB6" : "#848484",
                minHeight: 160,
                shadowColor: "#989898",
                shadowOffset: { width: 4, height: 4 },
                shadowOpacity: 0.25,
                shadowRadius: 4,
                elevation: 4,
                opacity: isClockedIn ? 1 : 0.7,
              }}
            >
              <Text 
                className="text-white font-medium text-center"
                style={{ fontSize: 26, letterSpacing: -0.5 }}
              >
                Resume Last Order
              </Text>
              {parkedOrders.length > 0 && (
                <View 
                  className="absolute top-3 right-3 bg-white rounded-full px-2 py-1"
                  style={{ minWidth: 24 }}
                >
                  <Text className="text-purple-600 font-bold text-center">{parkedOrders.length}</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>

          {/* Secondary Action Buttons */}
          <View className="flex-row gap-4 mb-4">
            <TouchableOpacity
              onPress={async () => {
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
              }}
              disabled={!isClockedIn}
              className="flex-1 rounded-xl justify-center items-center gap-2 py-6"
              style={{
                backgroundColor: isClockedIn ? "#FFFFFF" : "#F2F2F2",
                borderWidth: 2,
                borderColor: isClockedIn ? "#EC1A52" : "#848484",
                opacity: isClockedIn ? 1 : 0.6,
              }}
            >
              <MaterialCommunityIcons 
                name="package-variant-closed" 
                size={48} 
                color={isClockedIn ? "#EC1A52" : "#848484"} 
              />
              <Text style={{ fontSize: 20, color: isClockedIn ? "#EC1A52" : "#848484", fontWeight: "500" }}>
                Open Drawer
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setShowDeclareCashModal(true)}
              disabled={!isClockedIn}
              className="flex-1 rounded-xl justify-center items-center gap-2 py-6"
              style={{
                backgroundColor: isClockedIn ? "#FFFFFF" : "#F2F2F2",
                borderWidth: 2,
                borderColor: isClockedIn ? "#EC1A52" : "#848484",
                opacity: isClockedIn ? 1 : 0.6,
              }}
            >
              <MaterialCommunityIcons 
                name="cash-multiple" 
                size={48} 
                color={isClockedIn ? "#EC1A52" : "#848484"} 
              />
              <Text style={{ fontSize: 20, color: isClockedIn ? "#EC1A52" : "#848484", fontWeight: "500" }}>
                Declare Cash
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => router.push("/sale/payments-history")}
              disabled={!isClockedIn}
              className="flex-1 rounded-xl justify-center items-center gap-2 py-6"
              style={{
                backgroundColor: isClockedIn ? "#FFFFFF" : "#F2F2F2",
                borderWidth: 2,
                borderColor: isClockedIn ? "#EC1A52" : "#848484",
                opacity: isClockedIn ? 1 : 0.6,
              }}
            >
              <MaterialIcons 
                name="payment" 
                size={48} 
                color={isClockedIn ? "#EC1A52" : "#848484"} 
              />
              <Text style={{ fontSize: 20, color: isClockedIn ? "#EC1A52" : "#848484", fontWeight: "500" }}>
                Payments History
              </Text>
            </TouchableOpacity>
          </View>

          {/* Clock Status (when not clocked in) */}
          {!isClockedIn && (
            <View className="bg-amber-50 border border-amber-200 rounded-xl p-4">
              <Text className="text-amber-700 font-medium text-center" style={{ fontSize: 16 }}>
                Please clock in using the Time Clock button on the right to start your shift.
              </Text>
            </View>
          )}
        </ScrollView>

        {/* Bottom Stats Bar - Only show when clocked in */}
        {isClockedIn && (
          <View 
            className="flex-row px-4 py-3 gap-4"
            style={{ backgroundColor: "#1A1A1A" }}
          >
            <View className="flex-1 rounded-lg py-3 px-3 border-2 border-white items-center">
              <Text className="text-white font-semibold" style={{ fontSize: 14 }}>User Sales :</Text>
              <Text className="text-white font-bold" style={{ fontSize: 22 }}>$0.00</Text>
            </View>
            <View className="flex-1 rounded-lg py-3 px-3 border-2 border-white items-center">
              <Text className="text-white font-semibold" style={{ fontSize: 14 }}>Parked Orders :</Text>
              <Text className="text-white font-bold" style={{ fontSize: 22 }}>{parkedOrders.length}</Text>
            </View>
            <View className="flex-1 rounded-lg py-3 px-3 border-2 border-white items-center">
              <Text className="text-white font-semibold" style={{ fontSize: 14 }}>Clock In Time :</Text>
              <Text className="text-white font-bold" style={{ fontSize: 22 }}>{getClockInTimeString()}</Text>
            </View>
            <View className="flex-1 rounded-lg py-3 px-3 border-2 border-white items-center">
              <Text className="text-white font-semibold" style={{ fontSize: 14 }}>Clock In Duration :</Text>
              <Text className="text-white font-bold" style={{ fontSize: 22 }}>{clockDuration}</Text>
            </View>
          </View>
        )}

        {/* Parked Orders Modal */}
        <ParkedOrdersModal
          visible={showParkedOrdersModal}
          onClose={() => setShowParkedOrdersModal(false)}
          parkedOrders={parkedOrders}
          onResumeOrder={(id) => {
            const parkedOrder = resumeOrder(id);
            if (parkedOrder) {
              setShowParkedOrdersModal(false);
              router.push("/order/add-products");
            }
          }}
          onDeleteOrder={deleteParkedOrder}
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
          onConfirm={(actualCash) => {
            const difference = actualCash - cashSummary.expectedCash;
            const isMatched = Math.abs(difference) < 0.01;
            setCashResult({ isMatched, actualCash });
            setShowCashEntryModal(false);
            setShowCashResultModal(true);
          }}
          expectedCash={cashSummary.expectedCash}
        />

        <CashResultModal
          visible={showCashResultModal}
          onClose={() => setShowCashResultModal(false)}
          onConfirm={() => {
            setShowCashResultModal(false);
            Alert.alert("Success", "Cash register closed successfully");
          }}
          onReview={() => {
            setShowCashResultModal(false);
            setShowCashEntryModal(true); // Re-open cash entry to review
          }}
          isMatched={cashResult.isMatched}
          expectedAmount={cashSummary.expectedCash}
          actualAmount={cashResult.actualCash}
        />
      </View>
    );
  }

  // =========================================================================
  // Admin Dashboard Content
  // =========================================================================
  return (
    <View className="flex-1 bg-gray-50">
      <ScrollView
        className="flex-1"
        contentContainerClassName="p-4"
        showsVerticalScrollIndicator={false}
      >
        {/* ===== HEADER GROUP ===== */}
        <View className="bg-white rounded-xl p-4 border border-gray-100">
          <Header
            title={`Welcome, ${user?.name || "User"}`}
            subtitle="Access sales, reporting, and system actions quickly and securely."
            badge={isStaffMode ? "STAFF" : "ADMIN"}
          />
        </View>

        {/* ===== NAVIGATION GROUP ===== */}
        <View className="mt-4 bg-white rounded-xl p-4 border border-gray-100">
          <Text className="text-gray-700 font-semibold text-lg mb-3">
            Quick Actions
          </Text>
          <View className="flex-row flex-wrap gap-2">
            <TouchableOpacity
              onPress={() => router.push("/catalog/products")}
              className="flex-1 min-w-[140px] bg-blue-400 rounded-lg p-3 flex-row items-center justify-center gap-2"
            >
              <Ionicons name="cube-outline" size={20} color="white" />
              <Text className="text-white font-medium text-sm">Product Catalog</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => router.push("/inventory/stocks")}
              className="flex-1 min-w-[140px] bg-emerald-400 rounded-lg p-3 flex-row items-center justify-center gap-2"
            >
              <Ionicons name="layers-outline" size={20} color="white" />
              <Text className="text-white font-medium text-sm">Inventory</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => router.push("/sale/customers")}
              className="flex-1 min-w-[140px] bg-violet-400 rounded-lg p-3 flex-row items-center justify-center gap-2"
            >
              <Ionicons name="cart-outline" size={20} color="white" />
              <Text className="text-white font-medium text-sm">Sales</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => router.push("/report")}
              className="flex-1 min-w-[140px] bg-amber-400 rounded-lg p-3 flex-row items-center justify-center gap-2"
            >
              <Ionicons name="bar-chart-outline" size={20} color="white" />
              <Text className="text-white font-medium text-sm">Report</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ===== DASHBOARD OVERVIEW GROUP ===== */}
        {showAdminStats && (
          <View className="mt-4 bg-white rounded-xl p-4 border border-gray-100">
            <Text className="text-gray-700 font-semibold text-lg mb-3">
              Dashboard Overview
            </Text>
            <View className="flex-row gap-2 mb-2">
              <StatCard
                title="Total Sale/Revenue"
                value={formatCurrency(stats.totalRevenue)}
                subtitle={`${stats.orderCount} orders`}
                icon={<Ionicons name="pricetag" size={20} color="white" />}
                variant="green"
              />
              <StatCard
                title="Paid Amount"
                value={formatCurrency(stats.paidAmount)}
                icon={<FontAwesome5 name="coins" size={18} color="white" />}
                variant="yellow"
              />
              <StatCard
                title="Payable Amount"
                value={formatCurrency(stats.payableAmount)}
                icon={<Ionicons name="cart" size={20} color="white" />}
                variant="purple"
              />
            </View>

            <View className="flex-row gap-2">
              <StatCard
                title="Receivable Amount"
                value={formatCurrency(stats.receivableAmount)}
                subtitle={`${stats.customerCount} customers`}
                icon={<MaterialCommunityIcons name="cash-multiple" size={20} color="white" />}
                variant="red"
              />
              <StatCard
                title="Total Extended Stock"
                value={formatCurrency(stats.extendedStockValue)}
                subtitle={`${stats.productCount} products`}
                icon={<MaterialCommunityIcons name="package-variant" size={20} color="white" />}
                variant="yellow"
              />
              <StatCard
                title="Delivery Orders"
                value={String(stats.deliveryOrdersCount)}
                icon={<MaterialCommunityIcons name="clipboard-list-outline" size={20} color="white" />}
                variant="orange"
              />
            </View>
          </View>
        )}
      </ScrollView>

      {/* Floating Test Buttons */}
      <View
        style={{
          position: "absolute",
          bottom: 30,
          right: 20,
          gap: 12,
          zIndex: 999,
        }}
      >
        {/* Sync Test Button */}
        <TouchableOpacity
          onPress={() => router.push("/test-sync")}
          style={{
            backgroundColor: "#3B82F6",
            paddingVertical: 16,
            paddingHorizontal: 24,
            borderRadius: 12,
            flexDirection: "row",
            alignItems: "center",
            gap: 8,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 4,
            elevation: 8,
          }}
        >
          <Ionicons name="sync" size={24} color="white" />
          <Text style={{ color: "white", fontWeight: "bold", fontSize: 16 }}>
            TEST SYNC
          </Text>
        </TouchableOpacity>

        {/* Print Test Button */}
        <TouchableOpacity
          onPress={handleTestPrint}
          style={{
            backgroundColor: "#ef4444",
            paddingVertical: 16,
            paddingHorizontal: 24,
            borderRadius: 12,
            flexDirection: "row",
            alignItems: "center",
            gap: 8,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 4,
            elevation: 8,
          }}
        >
          <Ionicons name="print" size={24} color="white" />
          <Text style={{ color: "white", fontWeight: "bold", fontSize: 16 }}>
            TEST PRINT
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
