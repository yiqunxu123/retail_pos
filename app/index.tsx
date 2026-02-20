import { FontAwesome5, Ionicons, MaterialCommunityIcons, MaterialIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Alert, Modal, Pressable, ScrollView, Text, ToastAndroid, TouchableOpacity, useWindowDimensions, View } from "react-native";
import {
    ActionCard,
    DASHBOARD_SIDEBAR_WIDTH,
    DateRangePickerModal,
    StatCard,
    StatsBar
} from "../components";
import type { StatsBarItem } from "../components";
import { CashEntryModal } from "../components/CashEntryModal";
import { CashResultModal } from "../components/CashResultModal";
import { DeclareCashModal } from "../components/DeclareCashModal";
import { ParkedOrdersModal } from "../components/ParkedOrdersModal";
import { useAuth } from "../contexts/AuthContext";
import { useClock } from "../contexts/ClockContext";
import { useParkedOrders } from "../contexts/ParkedOrderContext";
import { useTimezone } from "../contexts/TimezoneContext";
import { useViewMode } from "../contexts/ViewModeContext";
import type { DashboardFilters } from "../utils/powersync/hooks";
import { useCashManagement, useChannels, useDashboardStats } from "../utils/powersync/hooks";
import { usePowerSync } from "../utils/powersync/PowerSyncProvider";
import { getLocalToday } from "../utils/powersync/sqlFilters";
import { useSyncStream } from "../utils/powersync/useSyncStream";
import {
    addPrinterListener,
    getPoolStatus,
    getPrinters,
    isAnyPrinterModuleAvailable,
    openCashDrawer
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

// Re-export getLocalToday as getToday for backward compat in this file
const getToday = getLocalToday;

function formatDateDisplay(dateStr: string): string {
  const [y, m, d] = dateStr.split('-');
  return `${m}-${d}-${y}`; // MM-DD-YYYY like K Web
}

interface SettingRow {
  value: unknown;
}

function extractTenantTimezone(value: unknown): string | null {
  try {
    const obj = typeof value === "string" ? JSON.parse(value) : value;
    const tz = (obj as any)?.timezone?.value;
    return typeof tz === "string" && tz.trim().length > 0 ? tz : null;
  } catch {
    return null;
  }
}

export default function Dashboard() {
  const { width, height } = useWindowDimensions();
  const router = useRouter();
  const { openDeclareCash } = useLocalSearchParams<{ openDeclareCash?: string | string[] }>();
  const { user, isAdmin } = useAuth();
  const { isClockedIn, selectedPosLine, selectPosLine, clockIn, getClockInTimeString, getElapsedTime } = useClock();
  const { viewMode, setViewMode, isStaffMode } = useViewMode();
  const { clearAndResync, isConnected, isSyncing } = usePowerSync();
  const { timezone, setTimezone } = useTimezone();
  const { data: settingsRows } = useSyncStream<SettingRow>(
    "SELECT value FROM settings WHERE type = 'admin-panel' AND sub_type = 'basic' LIMIT 1"
  );

  // Align app timezone with tenant timezone so dashboard date filters match K Web.
  useEffect(() => {
    const tenantTimezone = extractTenantTimezone(settingsRows[0]?.value);
    if (!tenantTimezone) return;
    if (timezone !== tenantTimezone) {
      console.log(`[Dashboard][TimezoneAlign] app=${timezone} tenant=${tenantTimezone}`);
      void setTimezone(tenantTimezone);
    }
  }, [settingsRows, timezone, setTimezone]);

  // Dashboard filters - default to "Today"
  const [datePresetIndex, setDatePresetIndex] = useState<number | null>(0);
  const [startDate, setStartDate] = useState(getToday());
  const [endDate, setEndDate] = useState(getToday());
  const [selectedChannelIds, setSelectedChannelIds] = useState<number[]>([]);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showChannelPicker, setShowChannelPicker] = useState(false);

  // When timezone changes, reset date filters to "Today" in the new timezone.
  // This ensures the dashboard queries pick up the new timezone immediately.
  useEffect(() => {
    const today = getToday();
    setStartDate(today);
    setEndDate(today);
    setDatePresetIndex(0);
  }, [timezone]);

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

  // Always display explicit range (same visual mental model as K Web RangePicker).
  const dateRangeLabel = `${formatDateDisplay(startDate)} ~ ${formatDateDisplay(endDate)}`;
  
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
  const [currentTime, setCurrentTime] = useState(new Date());
  const [printerList, setPrinterList] = useState<{ id: string; name: string }[]>([]);
  
  // Parked orders
  const { parkedOrders, deleteParkedOrder } = useParkedOrders();
  const [showParkedOrdersModal, setShowParkedOrdersModal] = useState(false);
  
  // Cash Management modals
  const [showDeclareCashModal, setShowDeclareCashModal] = useState(false);
  const [showCashEntryModal, setShowCashEntryModal] = useState(false);
  const [showCashResultModal, setShowCashResultModal] = useState(false);
  const [cashResult, setCashResult] = useState({ isMatched: true, actualCash: 0 });
  const [lastHandledDeclareCashToken, setLastHandledDeclareCashToken] = useState<string | null>(null);
  
  // Check if user is admin
  const showAdminStats = isAdmin();
  
  // Determine layout orientation
  const isLandscape = width > height;

  useEffect(() => {
    const openParam = Array.isArray(openDeclareCash) ? openDeclareCash[0] : openDeclareCash;
    if (!openParam) return;
    if (openParam === lastHandledDeclareCashToken) return;

    setShowDeclareCashModal(true);
    setLastHandledDeclareCashToken(openParam);
  }, [openDeclareCash, lastHandledDeclareCashToken]);
  
  // Calculate available content width
  const contentWidth = isLandscape ? width - DASHBOARD_SIDEBAR_WIDTH : width;

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

  // Real-time clock
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);
  
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

  // Sync printer list state for use in this component if needed (though UI is moved)
  useEffect(() => {
    const updatePrinters = () => {
      const enabledPrinters = getPrinters().filter(p => p.enabled);
      setPrinterList(enabledPrinters.map(p => ({ id: p.id, name: p.name })));
    };
    
    updatePrinters();
    const unsubscribe = addPrinterListener((event) => {
      if (['printer_added', 'printer_removed', 'printer_status_changed'].includes(event.type)) {
        updatePrinters();
      }
    });
    return () => unsubscribe();
  }, []); // Remove dependencies, run only once

  // =========================================================================
  // Staff Home Content
  // =========================================================================
  if (isStaffMode) {
    return (
      <View className="flex-1 bg-[#F7F7F9]">
        <ScrollView 
          className="flex-1"
          contentContainerStyle={{ padding: 16 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Header Bar */}
          <LinearGradient
            colors={["#9C1235", "#E91E63"]} // Dark red to vibrant red gradient
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={{
              height: 122,
              borderRadius: 12,
              paddingHorizontal: 20,
              marginBottom: 16,
              flexDirection: "row",
              justifyContent: "between",
              alignItems: "center",
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.2,
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
                style={{ 
                  fontSize: 36, 
                  lineHeight: 40,
                  letterSpacing: -0.72, // -2% of 36
                  fontWeight: "600", 
                  fontFamily: "Montserrat",
                  color: "#FFFFFF"
                }}
              >
                Welcome to KHUB POS System
              </Text>
              <View className="flex-row items-center mt-1 gap-4">
                <Text 
                  style={{ 
                    fontSize: 18, 
                    fontWeight: "500", 
                    fontFamily: "Montserrat",
                    color: "rgba(255, 255, 255, 0.9)"
                  }}
                >
                  Access sales, reporting, and system actions quickly and securely.
                </Text>
                
                {/* Connection Status Indicator */}
                <View className="flex-row items-center gap-2 bg-black/20 px-3 py-1 rounded-full">
                  <View 
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: 4,
                      backgroundColor: isConnected ? '#10B981' : '#EF4444',
                    }}
                  />
                  <Text style={{ color: "white", fontSize: 12, fontWeight: "600", fontFamily: "Montserrat" }}>
                    {isSyncing ? 'Syncing...' : isConnected ? 'Online' : 'Offline'}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
            
            {/* Role Badge */}
            <View 
              className="bg-white rounded-xl px-5 py-2.5 ml-4"
              style={{ borderWidth: 1, borderColor: "#1A1A1A" }}
            >
              <Text 
                style={{ fontSize: 18, color: "#1A1A1A", fontWeight: "600", fontFamily: "Montserrat" }}
              >
                CASHIER
              </Text>
            </View>
          </LinearGradient>

          {/* Primary Action Buttons */}
          <View className="flex-row gap-4 mb-4">
            <ActionCard
              title="Start Sale"
              gradientColors={["#EC1A52", "#9C1235"]}
              onPress={() => router.push("/order/add-products")}
              disabled={!isClockedIn}
              isGrayedOut={!isClockedIn}
              height={180}
            />

            <ActionCard
              title="Resume Last Order"
              gradientColors={["#5F4BB6", "#3F328C"]}
              onPress={() => setShowParkedOrdersModal(true)}
              disabled={!isClockedIn}
              isGrayedOut={!isClockedIn}
              badge={parkedOrders.length > 0 ? parkedOrders.length : undefined}
              height={180}
            />
          </View>

          {/* Secondary Action Buttons */}
          <View className="flex-row gap-4 mb-4">
            <ActionCard
              title="Open Drawer"
              backgroundColor="#EC1A52"
              outline
              isGrayedOut={!isClockedIn}
              grayVariant="light"
              icon={<MaterialCommunityIcons name="package-variant-closed" size={48} color={isClockedIn ? "#EC1A52" : "#FFFFFF"} />}
              onPress={async () => {
                const poolStatus = getPoolStatus();
                const hasIdlePrinter = poolStatus.printers.some(p => p.enabled && p.status === 'idle');
                if (!isAnyPrinterModuleAvailable() || !hasIdlePrinter) {
                  Alert.alert("Printer Not Available", "Cash drawer requires a connected printer.\n\nPlease configure a printer in Settings.", [{ text: "OK" }]);
                  return;
                }
                try {
                  await openCashDrawer();
                  Alert.alert("Success", "Cash drawer opened");
                } catch (error: any) {
                  Alert.alert("Error", error.message || "Failed to open cash drawer");
                }
              }}
              disabled={!isClockedIn}
              height={180}
            />

            <ActionCard
              title="Declare Cash"
              backgroundColor="#EC1A52"
              outline
              isGrayedOut={!isClockedIn}
              grayVariant="light"
              icon={<MaterialCommunityIcons name="cash-multiple" size={48} color={isClockedIn ? "#EC1A52" : "#FFFFFF"} />}
              onPress={() => setShowDeclareCashModal(true)}
              disabled={!isClockedIn}
              height={180}
            />

            <ActionCard
              title="Payments History"
              backgroundColor="#5F4BB6"
              outline
              isGrayedOut={!isClockedIn}
              grayVariant="light"
              icon={<MaterialIcons name="payment" size={48} color={isClockedIn ? "#5F4BB6" : "#FFFFFF"} />}
              onPress={() => router.push("/sale/payments-history")}
              disabled={!isClockedIn}
              height={180}
            />
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
          <StatsBar
            items={[
              { label: "User Sales :", value: `$${userSales.toFixed(2)}` },
              { label: "Parked Orders :", value: String(parkedOrders.length) },
              { label: "Clock In Time :", value: getClockInTimeString() },
              { label: "Clock In Duration :", value: clockDuration },
            ]}
          />
        )}

        {/* Parked Orders Modal */}
        <ParkedOrdersModal
          visible={showParkedOrdersModal}
          onClose={() => setShowParkedOrdersModal(false)}
          parkedOrders={parkedOrders}
          onResumeOrder={(id) => {
            setShowParkedOrdersModal(false);
            router.push({
              pathname: "/order/add-products",
              params: { retrieveOrderId: id },
            });
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
    <View className="flex-1 bg-[#F7F7F9]">
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 16 }}
        showsVerticalScrollIndicator={false}
      >
        {/* ===== HEADER GROUP ===== */}
        <LinearGradient
          colors={["#9C1235", "#E91E63"]} // Dark red to vibrant red gradient
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={{
            height: 122,
            borderRadius: 12,
            paddingHorizontal: 20,
            marginBottom: 16,
            flexDirection: "row",
            justifyContent: "between",
            alignItems: "center",
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.2,
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
              style={{ 
                fontSize: 36, 
                lineHeight: 40,
                letterSpacing: -0.72, // -2% of 36
                fontWeight: "600", 
                fontFamily: "Montserrat",
                color: "#FFFFFF"
              }}
            >
              Welcome to KHUB POS System
            </Text>
            <View className="flex-row items-center mt-1 gap-4">
              <Text 
                style={{ 
                  fontSize: 18, 
                  fontWeight: "500", 
                  fontFamily: "Montserrat",
                  color: "rgba(255, 255, 255, 0.9)"
                }}
              >
                Access sales, reporting, and system actions quickly and securely.
              </Text>
              
              {/* Connection Status Indicator */}
              <View className="flex-row items-center gap-2 bg-black/20 px-3 py-1 rounded-full">
                <View 
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: 4,
                    backgroundColor: isConnected ? '#10B981' : '#EF4444',
                  }}
                />
                <Text style={{ color: "white", fontSize: 12, fontWeight: "600", fontFamily: "Montserrat" }}>
                  {isSyncing ? 'Syncing...' : isConnected ? 'Online' : 'Offline'}
                </Text>
              </View>
            </View>
          </TouchableOpacity>
          
          {/* Role Badge */}
          <View 
            className="bg-[#1A1A1A] rounded-xl px-5 py-2.5 ml-4"
            style={{ borderWidth: 1, borderColor: "rgba(255,255,255,0.2)" }}
          >
            <Text 
              style={{ fontSize: 18, color: "#FFFFFF", fontWeight: "600", fontFamily: "Montserrat" }}
            >
              ADMIN
            </Text>
          </View>
        </LinearGradient>

        {/* ===== DASHBOARD FILTERS ===== */}
        {showAdminStats && (
          <View className="mb-4 gap-3">
            {/* Date Range Selector */}
            <View className="flex-row justify-end gap-3" style={{ flexWrap: "wrap" }}>
              <TouchableOpacity
                onPress={() => setShowDatePicker(true)}
                className="rounded-lg px-4 py-3"
                style={{ backgroundColor: '#fff', borderWidth: 1, borderColor: '#E5E7EB', minWidth: 260, flexShrink: 1 }}
              >
                <View className="flex-row items-center justify-between">
                  <View className="flex-row items-center gap-2">
                    <Ionicons name="calendar-outline" size={18} color="#4B5563" />
                    <Text style={{ fontSize: 14, color: '#1F2937', fontWeight: '600', fontFamily: 'Montserrat' }}>{dateRangeLabel}</Text>
                  </View>
                  <Ionicons name="chevron-down" size={14} color="#9CA3AF" />
                </View>
              </TouchableOpacity>

              {/* Channel Selector */}
              <TouchableOpacity
                onPress={() => setShowChannelPicker(true)}
                className="flex-row items-center rounded-lg px-4 py-3 gap-2"
                style={{ backgroundColor: '#fff', borderWidth: 1, borderColor: '#E5E7EB' }}
              >
                <Ionicons name="storefront-outline" size={18} color="#4B5563" />
                <Text style={{ fontSize: 14, color: '#1F2937', fontWeight: '500', fontFamily: 'Montserrat' }}>{channelLabel}</Text>
                <Ionicons name="chevron-down" size={14} color="#9CA3AF" />
              </TouchableOpacity>
            </View>
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
                icon={<Ionicons name="pricetag" size={40} color="white" />}
                variant="green"
                height={180}
              />
              <StatCard
                title="Paid Amount"
                value={formatCurrency(stats.paidAmount)}
                icon={<FontAwesome5 name="coins" size={36} color="white" />}
                variant="teal"
                height={180}
              />
              <StatCard
                title="Payable Amount"
                value={formatCurrency(stats.payableAmount)}
                icon={<Ionicons name="cart" size={40} color="white" />}
                variant="yellow"
                height={180}
              />
            </View>

            <View className="flex-row gap-4 mb-4">
              <StatCard
                title="Receivable Amount"
                value={formatCurrency(stats.receivableAmount)}
                subtitle={`${stats.customerCount} customers`}
                icon={<MaterialCommunityIcons name="cash-multiple" size={40} color="white" />}
                variant="blue"
                height={180}
              />
              <StatCard
                title="Pickup Orders"
                value={String(stats.pickupOrdersCount)}
                icon={<MaterialCommunityIcons name="shopping" size={40} color="white" />}
                variant="purple"
                height={180}
              />
              <StatCard
                title="Delivery Orders"
                value={String(stats.deliveryOrdersCount)}
                icon={<MaterialCommunityIcons name="truck-delivery" size={40} color="white" />}
                variant="red"
                height={180}
              />
            </View>
          </>
        )}

        {/* ===== NAVIGATION GROUP ===== */}
        <View className="flex-row gap-4 mb-4">
          <ActionCard
            title="Product Catalog"
            backgroundColor="#3B82F6"
            icon={<Ionicons name="cube-outline" size={40} color="white" />}
            onPress={() => router.push("/catalog/products")}
            height={180}
          />
          <ActionCard
            title="Inventory"
            backgroundColor="#10B981"
            icon={<Ionicons name="layers-outline" size={40} color="white" />}
            onPress={() => router.push("/inventory/stocks")}
            height={180}
          />
          <ActionCard
            title="Sales"
            backgroundColor="#8B5CF6"
            icon={<Ionicons name="cart-outline" size={40} color="white" />}
            onPress={() => router.push("/order/add-products")}
            height={180}
          />
          <ActionCard
            title="Report"
            backgroundColor="#F59E0B"
            icon={<Ionicons name="bar-chart-outline" size={40} color="white" />}
            onPress={() => router.push("/sale/reports")}
            height={180}
          />
        </View>
      </ScrollView>

        {/* Bottom Stats Bar - Time & Clock Info */}
      <StatsBar
        items={[
          { label: "Current Time :", value: currentTime.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true }) },
          { label: "Date :", value: currentTime.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) },
          ...(isClockedIn ? [
            { label: "Clock In Time :", value: getClockInTimeString() },
            { label: "Clock In Duration :", value: clockDuration },
          ] : []),
        ]}
      />

      {/* ===== DATE RANGE PICKER MODAL ===== */}
      <DateRangePickerModal
        visible={showDatePicker}
        onClose={() => setShowDatePicker(false)}
        onApply={handleDateApply}
        activePresetIndex={datePresetIndex}
        startDate={startDate}
        endDate={endDate}
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
