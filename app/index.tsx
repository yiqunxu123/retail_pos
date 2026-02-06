import { FontAwesome5, Ionicons, MaterialCommunityIcons, MaterialIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Alert, Modal, Pressable, ScrollView, Text, ToastAndroid, TouchableOpacity, useWindowDimensions, View } from "react-native";
import {
    ActionCard,
    DateRangePickerModal,
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
import type { DashboardFilters } from "../utils/powersync/hooks";
import { useCashManagement, useChannels, useDashboardStats } from "../utils/powersync/hooks";
import { usePowerSync } from "../utils/powersync/PowerSyncProvider";
import {
    addPrinter,
    addPrinterListener,
    getPoolStatus,
    getPrinters,
    isAnyPrinterModuleAvailable,
    openCashDrawer,
    print,
    printToAll,
    printToOne
} from "../utils/PrinterPoolManager";

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

// Date helpers - use local date, NOT UTC
function getToday(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function formatDateDisplay(dateStr: string): string {
  const [y, m, d] = dateStr.split('-');
  return `${m}-${d}-${y}`; // MM-DD-YYYY like K Web
}

export default function Dashboard() {
  const { width, height } = useWindowDimensions();
  const router = useRouter();
  const { user, isAdmin } = useAuth();
  const { isClockedIn, selectedPosLine, selectPosLine, clockIn, getClockInTimeString, getElapsedTime } = useClock();
  const { viewMode, setViewMode, isStaffMode } = useViewMode();
  const { clearAndResync, isConnected, isSyncing } = usePowerSync();

  // Dashboard filters - default to "Today"
  const [datePresetIndex, setDatePresetIndex] = useState<number | null>(0);
  const [startDate, setStartDate] = useState(getToday());
  const [endDate, setEndDate] = useState(getToday());
  const [selectedChannelIds, setSelectedChannelIds] = useState<number[]>([]);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showChannelPicker, setShowChannelPicker] = useState(false);

  // Get channels
  const { channels, primaryChannel } = useChannels();

  // Initialize with primary channel when loaded
  useEffect(() => {
    if (primaryChannel && selectedChannelIds.length === 0) {
      // Don't filter by channel initially (show all, same as K Web "All Channels")
      // User can select specific channels if needed
    }
  }, [primaryChannel]);

  // Build filters
  const dashboardFilters = useMemo<DashboardFilters>(() => ({
    startDate,
    endDate,
    channelIds: selectedChannelIds,
  }), [startDate, endDate, selectedChannelIds]);

  const { stats } = useDashboardStats(dashboardFilters);
  const { cashSummary, userSales } = useCashManagement(user?.id);

  // Date range selection (from DateRangePickerModal)
  const handleDateApply = useCallback((start: string, end: string, presetIdx: number | null) => {
    setStartDate(start);
    setEndDate(end);
    setDatePresetIndex(presetIdx);
    setShowDatePicker(false);
  }, []);

  // Channel selection
  const toggleChannel = useCallback((channelId: number) => {
    setSelectedChannelIds(prev => {
      if (prev.includes(channelId)) {
        return prev.filter(id => id !== channelId);
      }
      return [...prev, channelId];
    });
  }, []);

  const selectAllChannels = useCallback(() => {
    setSelectedChannelIds([]);
    setShowChannelPicker(false);
  }, []);

  // Get display label for current date range
  const PRESET_LABELS = ['Today', 'Yesterday', 'Last 7 Days', 'Last 14 Days', 'Last 30 Days', 'This Month', 'This Year', 'Last 1 Year'];
  const dateLabel = datePresetIndex !== null
    ? PRESET_LABELS[datePresetIndex] || `${formatDateDisplay(startDate)} ~ ${formatDateDisplay(endDate)}`
    : `${formatDateDisplay(startDate)} ~ ${formatDateDisplay(endDate)}`;
  
  // Get display label for current channel selection
  const channelLabel = selectedChannelIds.length === 0 
    ? 'All Channels' 
    : selectedChannelIds.length === 1 
      ? channels.find(c => c.id === selectedChannelIds[0])?.name || 'Channel'
      : `${selectedChannelIds.length} Channels`;
  
  // Printer config state (loaded from AsyncStorage)
  const [printerIp, setPrinterIp] = useState(DEFAULT_PRINTER_IP);
  const [printerPort, setPrinterPort] = useState(DEFAULT_PRINTER_PORT);
  const [clockDuration, setClockDuration] = useState("00:00:00");
  const [printerList, setPrinterList] = useState<{ id: string; name: string }[]>([]);
  
  // Parked orders
  const { parkedOrders, resumeOrder, deleteParkedOrder } = useParkedOrders();
  const [showParkedOrdersModal, setShowParkedOrdersModal] = useState(false);
  
  // Cash Management modals
  const [showDeclareCashModal, setShowDeclareCashModal] = useState(false);
  const [showCashEntryModal, setShowCashEntryModal] = useState(false);
  const [showCashResultModal, setShowCashResultModal] = useState(false);
  const [cashResult, setCashResult] = useState({ isMatched: true, actualCash: 0 });
  
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

  // Initialize printer pool from saved settings - run only once
  useEffect(() => {
    let isMounted = true;
    
    const initPrinterPool = async () => {
      // If pool already has printers, skip initialization
      if (getPrinters().length > 0) {
        console.log("🖨️ [Dashboard] Pool already has printers, skipping init");
        // Update printer list state
        const currentPrinters = getPrinters().filter(p => p.enabled);
        setPrinterList(currentPrinters.map(p => ({ id: p.id, name: p.name })));
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
        
        // Log final pool status and update state
        const status = getPoolStatus();
        console.log("🖨️ [Dashboard] Pool initialized:", status.printers.length, "printers");
        status.printers.forEach(p => {
          console.log("   -", p.id, `(${p.name})`, p.enabled ? "enabled" : "disabled", p.status);
        });
        
        // Update printer list state
        const enabledPrinters = status.printers.filter(p => p.enabled);
        setPrinterList(enabledPrinters.map(p => ({ id: p.id, name: p.name })));
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
      // Update printer list (status may have changed)
      if (event.type === 'printer_added' || event.type === 'printer_removed') {
        const currentPrinters = getPrinters().filter(p => p.enabled);
        setPrinterList(currentPrinters.map(p => ({ id: p.id, name: p.name })));
      }
    });
    
    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []); // Remove dependencies, run only once

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

  // Test print function - supports specific printer or print to all
  const handleTestPrint = async (printerIndex?: number | 'all') => {
    try {
      if (!isClockedIn) {
        clockIn("TEST-001", 1);
      }

      if (printerList.length === 0) {
        ToastAndroid.show(`❌ No available printers`, ToastAndroid.LONG);
        return;
      }

      const receipt = buildTestReceipt();

      if (printerIndex === 'all') {
        // Print to all printers in parallel (Promise.all)
        console.log("🖨️ [Dashboard] ========== PARALLEL Print to ALL ==========");
        ToastAndroid.show(`⏳ Printing in parallel...`, ToastAndroid.SHORT);
        
        const result = await printToAll(receipt);
        
        if (result.success) {
          const successPrinters = result.results.filter(r => r.success).map(r => r.printer);
          const failedPrinters = result.results.filter(r => !r.success).map(r => r.printer);
          
          if (failedPrinters.length === 0) {
            ToastAndroid.show(`✅ All successful: ${successPrinters.join(', ')}`, ToastAndroid.LONG);
          } else {
            ToastAndroid.show(`⚠️ Success: ${successPrinters.join(', ')} | Failed: ${failedPrinters.join(', ')}`, ToastAndroid.LONG);
          }
        } else {
          ToastAndroid.show(`❌ All prints failed`, ToastAndroid.LONG);
        }
      } else if (typeof printerIndex === 'number') {
        // Print to specific printer (using TCP, non-blocking)
        const targetPrinter = printerList[printerIndex];
        if (!targetPrinter) {
          ToastAndroid.show(`❌ Printer ${printerIndex + 1} not found`, ToastAndroid.LONG);
          return;
        }
        console.log(`🖨️ [Dashboard] ========== Print to: ${targetPrinter.name} ==========`);
        ToastAndroid.show(`⏳ Printing...`, ToastAndroid.SHORT);
        
        const result = await printToOne(targetPrinter.id, receipt);
        if (result.success) {
          ToastAndroid.show(`✅ ${targetPrinter.name} success`, ToastAndroid.LONG);
        } else {
          ToastAndroid.show(`❌ ${targetPrinter.name} failed: ${result.error}`, ToastAndroid.LONG);
        }
      } else {
        // Default load balancing
        console.log("🖨️ [Dashboard] ========== Print (load balanced) ==========");
        print(receipt);
        ToastAndroid.show(`✅ Print job sent`, ToastAndroid.LONG);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.log("🖨️ [Dashboard] ERROR:", msg, err);
      ToastAndroid.show(`❌ Error: ${msg}`, ToastAndroid.LONG);
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
            <TouchableOpacity 
              className="flex-1"
              onLongPress={() => {
                Alert.alert(
                  "🔄 Clear & Resync Database",
                  "This will clear all local data and re-download everything from the server. The app may take a few moments to resync.\n\nContinue?",
                  [
                    { text: "Cancel", style: "cancel" },
                    {
                      text: "Clear & Resync",
                      style: "destructive",
                      onPress: async () => {
                        try {
                          ToastAndroid.show("🔄 Clearing database...", ToastAndroid.LONG);
                          await clearAndResync();
                          ToastAndroid.show("✅ Database cleared! Resyncing...", ToastAndroid.LONG);
                        } catch (error) {
                          const msg = error instanceof Error ? error.message : String(error);
                          ToastAndroid.show(`❌ Error: ${msg}`, ToastAndroid.LONG);
                        }
                      },
                    },
                  ]
                );
              }}
              activeOpacity={0.8}
            >
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
              {/* Sync Status Indicator */}
              <View className="flex-row items-center mt-2 gap-2">
                <View 
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: 4,
                    backgroundColor: isConnected ? '#10B981' : '#EF4444',
                  }}
                />
                <Text className="text-white text-xs opacity-75">
                  {isSyncing ? 'Syncing...' : isConnected ? 'Connected' : 'Offline'}
                </Text>
                <Text className="text-white text-xs opacity-50 ml-2">
                  (Long press to resync)
                </Text>
              </View>
            </TouchableOpacity>
            
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
            <ActionCard
              title="Start Sale"
              backgroundColor="#EC1A52"
              onPress={() => router.push("/order/add-products")}
              disabled={!isClockedIn}
            />

            <ActionCard
              title="Resume Last Order"
              backgroundColor="#5F4BB6"
              onPress={() => setShowParkedOrdersModal(true)}
              disabled={!isClockedIn}
              badge={parkedOrders.length > 0 ? parkedOrders.length : undefined}
            />
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
              <Text className="text-white font-bold" style={{ fontSize: 22 }}>${userSales.toFixed(2)}</Text>
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
    <View className="flex-1 bg-gray-100">
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 16 }}
        showsVerticalScrollIndicator={false}
      >
        {/* ===== HEADER GROUP ===== */}
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
          <TouchableOpacity 
            className="flex-1"
            onLongPress={() => {
              Alert.alert(
                "🔄 Clear & Resync Database",
                "This will clear all local data and re-download everything from the server. The app may take a few moments to resync.\n\nContinue?",
                [
                  { text: "Cancel", style: "cancel" },
                  {
                    text: "Clear & Resync",
                    style: "destructive",
                    onPress: async () => {
                      try {
                        ToastAndroid.show("🔄 Clearing database...", ToastAndroid.LONG);
                        await clearAndResync();
                        ToastAndroid.show("✅ Database cleared! Resyncing...", ToastAndroid.LONG);
                      } catch (error) {
                        const msg = error instanceof Error ? error.message : String(error);
                        ToastAndroid.show(`❌ Error: ${msg}`, ToastAndroid.LONG);
                      }
                    },
                  },
                ]
              );
            }}
            activeOpacity={0.8}
          >
            <Text 
              className="text-white font-semibold"
              style={{ fontSize: 28, letterSpacing: -0.5 }}
            >
              Welcome, {user?.name || "User"}
            </Text>
            <Text 
              className="text-white font-medium mt-1"
              style={{ fontSize: 16 }}
            >
              Access sales, reporting, and system actions quickly and securely.
            </Text>
            {/* Sync Status Indicator */}
            <View className="flex-row items-center mt-2 gap-2">
              <View 
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: isConnected ? '#10B981' : '#EF4444',
                }}
              />
              <Text className="text-white text-xs opacity-75">
                {isSyncing ? 'Syncing...' : isConnected ? 'Connected' : 'Offline'}
              </Text>
              <Text className="text-white text-xs opacity-50 ml-2">
                (Long press to resync)
              </Text>
            </View>
          </TouchableOpacity>
          
          {/* Role Badge */}
          <View 
            className="bg-white rounded-xl px-4 py-2 ml-4"
            style={{ borderWidth: 1, borderColor: "#1A1A1A" }}
          >
            <Text 
              className="font-semibold"
              style={{ fontSize: 16, color: "#1A1A1A" }}
            >
              ADMIN
            </Text>
          </View>
        </View>

        {/* ===== NAVIGATION GROUP ===== */}
        <View className="flex-row gap-4 mb-4">
          <TouchableOpacity
            onPress={() => router.push("/catalog/products")}
            className="flex-1 rounded-xl justify-center items-center gap-2"
            style={{
              backgroundColor: "#3B82F6",
              minHeight: 160,
              shadowColor: "#989898",
              shadowOffset: { width: 4, height: 4 },
              shadowOpacity: 0.25,
              shadowRadius: 4,
              elevation: 4,
            }}
          >
            <Ionicons name="cube-outline" size={32} color="white" />
            <Text className="text-white font-medium" style={{ fontSize: 16 }}>Product Catalog</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => router.push("/inventory/stocks")}
            className="flex-1 rounded-xl justify-center items-center gap-2"
            style={{
              backgroundColor: "#10B981",
              minHeight: 160,
              shadowColor: "#989898",
              shadowOffset: { width: 4, height: 4 },
              shadowOpacity: 0.25,
              shadowRadius: 4,
              elevation: 4,
            }}
          >
            <Ionicons name="layers-outline" size={32} color="white" />
            <Text className="text-white font-medium" style={{ fontSize: 16 }}>Inventory</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => router.push("/sale/customers")}
            className="flex-1 rounded-xl justify-center items-center gap-2"
            style={{
              backgroundColor: "#8B5CF6",
              minHeight: 160,
              shadowColor: "#989898",
              shadowOffset: { width: 4, height: 4 },
              shadowOpacity: 0.25,
              shadowRadius: 4,
              elevation: 4,
            }}
          >
            <Ionicons name="cart-outline" size={32} color="white" />
            <Text className="text-white font-medium" style={{ fontSize: 16 }}>Sales</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => router.push("/report")}
            className="flex-1 rounded-xl justify-center items-center gap-2"
            style={{
              backgroundColor: "#F59E0B",
              minHeight: 160,
              shadowColor: "#989898",
              shadowOffset: { width: 4, height: 4 },
              shadowOpacity: 0.25,
              shadowRadius: 4,
              elevation: 4,
            }}
          >
            <Ionicons name="bar-chart-outline" size={32} color="white" />
            <Text className="text-white font-medium" style={{ fontSize: 16 }}>Report</Text>
          </TouchableOpacity>
        </View>

        {/* ===== DASHBOARD FILTERS ===== */}
        {showAdminStats && (
          <View className="flex-row justify-end gap-3 mb-4">
            {/* Date Range Selector */}
            <TouchableOpacity
              onPress={() => setShowDatePicker(true)}
              className="flex-row items-center rounded-lg px-4 py-3 gap-2"
              style={{ backgroundColor: '#fff', borderWidth: 1, borderColor: '#E5E7EB' }}
            >
              <Ionicons name="calendar-outline" size={18} color="#4B5563" />
              <Text style={{ fontSize: 14, color: '#1F2937', fontWeight: '500' }}>{dateLabel}</Text>
              <Ionicons name="chevron-down" size={14} color="#9CA3AF" />
            </TouchableOpacity>

            {/* Channel Selector */}
            <TouchableOpacity
              onPress={() => setShowChannelPicker(true)}
              className="flex-row items-center rounded-lg px-4 py-3 gap-2"
              style={{ backgroundColor: '#fff', borderWidth: 1, borderColor: '#E5E7EB' }}
            >
              <Ionicons name="storefront-outline" size={18} color="#4B5563" />
              <Text style={{ fontSize: 14, color: '#1F2937', fontWeight: '500' }}>{channelLabel}</Text>
              <Ionicons name="chevron-down" size={14} color="#9CA3AF" />
            </TouchableOpacity>
          </View>
        )}

        {/* ===== DASHBOARD OVERVIEW GROUP ===== */}
        {showAdminStats && (
          <>
            <View className="flex-row gap-4 mb-4">
              <StatCard
                title="Total Sale/Revenue"
                value={formatCurrency(stats.totalRevenue)}
                subtitle={`${stats.orderCount} orders`}
                icon={<Ionicons name="pricetag" size={24} color="white" />}
                variant="yellow"
              />
              <StatCard
                title="Paid Amount"
                value={formatCurrency(stats.paidAmount)}
                icon={<FontAwesome5 name="coins" size={22} color="white" />}
                variant="teal"
              />
              <StatCard
                title="Payable Amount"
                value={formatCurrency(stats.payableAmount)}
                icon={<Ionicons name="cart" size={24} color="white" />}
                variant="purple"
              />
            </View>

            <View className="flex-row gap-4">
              <StatCard
                title="Receivable Amount"
                value={formatCurrency(stats.receivableAmount)}
                subtitle={`${stats.customerCount} customers`}
                icon={<MaterialCommunityIcons name="cash-multiple" size={24} color="white" />}
                variant="blue"
              />
              <StatCard
                title="Delivery Orders"
                value={String(stats.deliveryOrdersCount)}
                icon={<MaterialCommunityIcons name="truck-delivery" size={24} color="white" />}
                variant="pink"
              />
              <StatCard
                title="Pickup Orders"
                value={String(stats.pickupOrdersCount)}
                icon={<MaterialCommunityIcons name="shopping" size={24} color="white" />}
                variant="dark"
              />
            </View>
          </>
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

        {/* Print Test Buttons - dynamically generated for any number of printers */}
        {printerList.map((printer, index) => {
          // Assign different colors for each printer
          const colors = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899'];
          const bgColor = colors[index % colors.length];
          
          return (
            <TouchableOpacity
              key={printer.id}
              onPress={() => handleTestPrint(index)}
              style={{
                backgroundColor: bgColor,
                paddingVertical: 12,
                paddingHorizontal: 16,
                borderRadius: 12,
                flexDirection: "row",
                alignItems: "center",
                gap: 6,
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 4,
                elevation: 8,
              }}
            >
              <Ionicons name="print" size={20} color="white" />
              <Text style={{ color: "white", fontWeight: "bold", fontSize: 14 }}>
                {printer.name}
              </Text>
            </TouchableOpacity>
          );
        })}

        {/* Print All button - only show when there are 2+ printers */}
        {printerList.length >= 2 && (
          <TouchableOpacity
            onPress={() => handleTestPrint('all')}
            style={{
              backgroundColor: "#7c3aed",
              paddingVertical: 12,
              paddingHorizontal: 16,
              borderRadius: 12,
              flexDirection: "row",
              alignItems: "center",
              gap: 6,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 4,
              elevation: 8,
            }}
          >
            <Ionicons name="print-outline" size={20} color="white" />
            <Text style={{ color: "white", fontWeight: "bold", fontSize: 14 }}>
              All ({printerList.length})
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* ===== DATE RANGE PICKER MODAL ===== */}
      <DateRangePickerModal
        visible={showDatePicker}
        onClose={() => setShowDatePicker(false)}
        onApply={handleDateApply}
        activePresetIndex={datePresetIndex}
      />

      {/* ===== CHANNEL PICKER MODAL ===== */}
      <Modal
        visible={showChannelPicker}
        transparent
        animationType="fade"
        onRequestClose={() => setShowChannelPicker(false)}
      >
        <Pressable 
          className="flex-1 justify-center items-center"
          style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
          onPress={() => setShowChannelPicker(false)}
        >
          <Pressable 
            className="bg-white rounded-2xl p-6"
            style={{ width: 360, maxWidth: '90%', maxHeight: '70%' }}
            onPress={() => {}}
          >
            <Text className="font-bold mb-4" style={{ fontSize: 18, color: '#1F2937' }}>
              Select Channels
            </Text>
            
            {/* All Channels Option */}
            <TouchableOpacity
              onPress={selectAllChannels}
              className="flex-row items-center py-3 px-4 rounded-lg mb-2"
              style={{
                backgroundColor: selectedChannelIds.length === 0 ? '#EC1A52' : '#F3F4F6',
              }}
            >
              <Ionicons 
                name={selectedChannelIds.length === 0 ? "checkmark-circle" : "ellipse-outline"} 
                size={20} 
                color={selectedChannelIds.length === 0 ? '#fff' : '#9CA3AF'} 
              />
              <Text 
                className="ml-3 font-medium"
                style={{ 
                  fontSize: 15, 
                  color: selectedChannelIds.length === 0 ? '#fff' : '#374151' 
                }}
              >
                All Channels
              </Text>
            </TouchableOpacity>

            {/* Individual Channels */}
            <ScrollView style={{ maxHeight: 300 }}>
              {channels.map(ch => {
                const isSelected = selectedChannelIds.includes(ch.id);
                return (
                  <TouchableOpacity
                    key={ch.id}
                    onPress={() => toggleChannel(ch.id)}
                    className="flex-row items-center py-3 px-4 rounded-lg mb-2"
                    style={{
                      backgroundColor: isSelected ? '#EFF6FF' : '#F3F4F6',
                      borderWidth: isSelected ? 1 : 0,
                      borderColor: '#3B82F6',
                    }}
                  >
                    <Ionicons 
                      name={isSelected ? "checkmark-circle" : "ellipse-outline"} 
                      size={20} 
                      color={isSelected ? '#3B82F6' : '#9CA3AF'} 
                    />
                    <Text 
                      className="ml-3 font-medium"
                      style={{ fontSize: 15, color: isSelected ? '#1D4ED8' : '#374151' }}
                    >
                      {ch.name}
                    </Text>
                    {ch.is_primary === 1 && (
                      <View className="ml-2 bg-green-100 rounded-full px-2 py-0.5">
                        <Text style={{ fontSize: 11, color: '#059669' }}>Primary</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            <TouchableOpacity
              onPress={() => setShowChannelPicker(false)}
              className="mt-3 py-3 items-center rounded-lg"
              style={{ backgroundColor: '#EC1A52' }}
            >
              <Text style={{ fontSize: 15, color: '#fff', fontWeight: '600' }}>Done</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}
