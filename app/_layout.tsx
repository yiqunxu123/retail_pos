import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as NavigationBar from "expo-navigation-bar";
import { Slot, usePathname, useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { colors, iconSize, buttonSize } from '@/utils/theme';
import {
  ActivityIndicator,
  Animated,
  AppState,
  PanResponder,
  Platform,
  Pressable,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ClockInModal } from "../components/ClockInModal";
import { ClockOutModal } from "../components/ClockOutModal";
import { DashboardSidebar } from "../components/DashboardSidebar";
import { SubPageSidebar } from "../components/SubPageSidebar";
import { AuthProvider, useAuth } from "../contexts/AuthContext";
import { BulkEditProvider } from "../contexts/BulkEditContext";
import { ClockProvider, useClock } from "../contexts/ClockContext";
import { ParkedOrderProvider } from "../contexts/ParkedOrderContext";
import { TimezoneProvider } from "../contexts/TimezoneContext";
import { ViewModeProvider } from "../contexts/ViewModeContext";
import "../global.css";
import { PowerSyncProvider } from "../utils/powersync/PowerSyncProvider";
import { addPrinter, getPrinters } from "../utils/PrinterPoolManager";
import LoginScreen from "./login";

/**
 * LayoutContent - Inner layout component that uses contexts
 */
function LayoutContent() {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const pathname = String(usePathname() || "/");
  const router = useRouter();
  const { isAuthenticated, isLoading, user, logout } = useAuth();
  const { isClockedIn, selectedPosLine, clockIn, clockOut, selectPosLine } = useClock();
  // ViewMode is now handled internally by DashboardSidebar

  // Keep Android system navigation bar hidden globally.
  useEffect(() => {
    if (Platform.OS === "android") {
      const hideNavBar = async () => {
        try {
          await NavigationBar.setVisibilityAsync("hidden");
        } catch (e) {
          console.warn("Failed to hide navigation bar:", e);
        }
      };

      hideNavBar();
      const retry1 = setTimeout(hideNavBar, 240);
      const retry2 = setTimeout(hideNavBar, 960);
      const retry3 = setTimeout(hideNavBar, 2200);

      const appStateSub = AppState.addEventListener("change", (state) => {
        if (state === "active") {
          void hideNavBar();
        }
      });

      const visibilitySub = NavigationBar.addVisibilityListener((event) => {
        if (event.visibility !== "hidden") {
          void hideNavBar();
        }
      });

      return () => {
        clearTimeout(retry1);
        clearTimeout(retry2);
        clearTimeout(retry3);
        appStateSub.remove();
        visibilitySub.remove();
      };
    }
  }, [pathname]);

  // Initialize printer pool globally
  useEffect(() => {
    const initPrinterPool = async () => {
      if (getPrinters().length > 0) return;
      
      try {
        const savedConfig = await AsyncStorage.getItem("printer_pool_config");
        if (savedConfig) {
          const printers = JSON.parse(savedConfig);
          printers.forEach((p: any) => {
            if (!getPrinters().find(existing => existing.id === p.id)) {
              addPrinter(p);
            }
          });
          console.log(`🖨️ [Layout] Initialized ${printers.length} printers`);
        }
      } catch (e) {
        console.warn("🖨️ [Layout] Failed to init printer pool:", e);
      }
    };
    initPrinterPool();
  }, []);

  const [showClockInModal, setShowClockInModal] = useState(false);
  const [showClockOutModal, setShowClockOutModal] = useState(false);

  // Determine layout orientation
  const isLandscape = width > height;

  // Check if we're on the dashboard
  const isDashboard = pathname === "/" || pathname === "/index";

  // Check if we're on screens that have their OWN sidebar (hide global sidebar)
  // Only add-products has its own action sidebar; other order pages get the global sidebar
  const isOrderAddProductsScreen = pathname === "/order/add-products";
  const isOrderAddCustomerScreen = pathname === "/order/add-customer";
  
  // Hide global sidebar ONLY for pages that provide their own sidebar/action panel
  const hideSidebar =
    isOrderAddProductsScreen ||
    isOrderAddCustomerScreen;

  // Show loading screen while checking stored authentication
  if (isLoading) {
    return (
      <View
        className="flex-1 bg-[#F7F7F9] justify-center items-center"
        style={{
          paddingTop: insets.top,
          paddingBottom: insets.bottom,
          paddingLeft: insets.left,
          paddingRight: insets.right,
        }}
      >
        <ActivityIndicator size="large" color="#ef4444" />
        <Text className="text-gray-500 mt-4">Loading...</Text>
      </View>
    );
  }

  // If not authenticated, show login screen
  if (!isAuthenticated) {
    return (
      <View
        className="flex-1 bg-[#F7F7F9]"
        style={{
          paddingTop: insets.top,
          paddingBottom: insets.bottom,
          paddingLeft: insets.left,
          paddingRight: insets.right,
        }}
      >
        <LoginScreen />
      </View>
    );
  }

  // Handle Clock In button press
  const handleClockInPress = () => {
    setShowClockInModal(true);
  };

  // DEV ONLY: Long press Time Clock → auto clock-in (skip PIN modal)
  const handleClockInLongPress = __DEV__ ? () => {
    if (!isClockedIn) {
      clockIn("dev", selectedPosLine || 1);
      console.log("⚡ [DEV] Auto clock-in via long press");
    }
  } : undefined;

  // Handle Clock In submission
  const handleClockIn = (employeeId: string) => {
    clockIn(employeeId, selectedPosLine || 1);
    setShowClockInModal(false);
  };

  // Handle Clock Out confirmation
  const handleClockOut = () => {
    clockOut();
    selectPosLine(null);
    setShowClockOutModal(false);
  };

  const handleDeclareCash = () => {
    setShowClockOutModal(false);
    router.push({
      pathname: "/",
      params: { openDeclareCash: `${Date.now()}` },
    });
  };

  return (
    <View
      className="flex-1 bg-[#F7F7F9]"
      style={{
        paddingTop: insets.top,
        paddingLeft: insets.left,
        paddingRight: insets.right,
      }}
    >
      {/* Main layout container */}
      <BulkEditProvider>
        <View className={`flex-1 ${isLandscape && !hideSidebar ? "flex-row" : "flex-col"}`}>
          {/* Page content area - renders current route */}
          <View className="flex-1">
            <Slot />
          </View>

          {/* Sidebar - Dashboard gets full sidebar, sub-pages get simplified sidebar */}
          {!hideSidebar && (
          isDashboard ? (
            <DashboardSidebar
              isLandscape={isLandscape}
              onClockInPress={handleClockInPress}
              onClockInLongPress={handleClockInLongPress}
              onClockOutPress={() => setShowClockOutModal(true)}
            />
          ) : (
            <SubPageSidebar
              isLandscape={isLandscape}
              onClockInPress={handleClockInPress}
              onClockInLongPress={handleClockInLongPress}
              onClockOutPress={() => setShowClockOutModal(true)}
            />
          )
        )}
        </View>
      </BulkEditProvider>

      {/* Clock In Modal */}
      <ClockInModal
        visible={showClockInModal}
        onClose={() => setShowClockInModal(false)}
        onClockIn={handleClockIn}
      />

      {/* Clock Out Modal */}
      <ClockOutModal
        visible={showClockOutModal}
        onClose={() => setShowClockOutModal(false)}
        onDeclareCash={handleDeclareCash}
        onClockOut={handleClockOut}
      />

      {/* Dev Tools Floating Button – dev mode only */}
      {__DEV__ && <DevToolsFab />}
    </View>
  );
}

// ---------------------------------------------------------------------------
// DevToolsFab – Draggable floating button that navigates to /dev-tools
// ---------------------------------------------------------------------------

function DevToolsFab() {
  const { width: screenWidth } = useWindowDimensions();
  const router = useRouter();

  const posRef = useRef({ x: -1, y: -1 });
  const pan = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;
  const isDraggingRef = useRef(false);

  if (posRef.current.x < 0 && screenWidth > 0) {
    const initX = screenWidth - 68;
    const initY = 140;
    posRef.current = { x: initX, y: initY };
    pan.setValue({ x: initX, y: initY });
  }

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        isDraggingRef.current = false;
      },
      onPanResponderMove: (_evt, gs) => {
        if (Math.abs(gs.dx) > 4 || Math.abs(gs.dy) > 4) {
          isDraggingRef.current = true;
        }
        pan.setValue({
          x: posRef.current.x + gs.dx,
          y: posRef.current.y + gs.dy,
        });
      },
      onPanResponderRelease: (_evt, gs) => {
        posRef.current = {
          x: posRef.current.x + gs.dx,
          y: posRef.current.y + gs.dy,
        };
      },
    }),
  ).current;

  return (
    <Animated.View
      style={{
        position: "absolute",
        left: pan.x,
        top: pan.y,
        zIndex: 9999,
      }}
      {...panResponder.panHandlers}
    >
      <Pressable
        className="items-center justify-center"
        style={{
          width: buttonSize.xl.height,
          height: buttonSize.xl.height,
          borderRadius: 14,
          backgroundColor: "rgba(0,0,0,0.55)",
        }}
        onPress={() => {
          if (!isDraggingRef.current) {
            router.push("/dev-tools");
          }
        }}
      >
        <Ionicons name="bug-outline" size={iconSize.md} color="#22D3EE" />
        <Text className="text-sm font-bold"
            style={{ color: "#22D3EE", letterSpacing: 1.5, marginTop: 1 }}>DEV</Text>
      </Pressable>
    </Animated.View>
  );
}

/**
 * RootLayout - Main app layout with sticky sidebar
 * Wraps app with providers for global state
 */
export default function RootLayout() {
  return (
    <TimezoneProvider>
      <PowerSyncProvider>
        <AuthProvider>
          <ClockProvider>
            <ViewModeProvider>
              <ParkedOrderProvider>
                <LayoutContent />
              </ParkedOrderProvider>
            </ViewModeProvider>
          </ClockProvider>
        </AuthProvider>
      </PowerSyncProvider>
    </TimezoneProvider>
  );
}
