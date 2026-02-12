import { Ionicons } from "@expo/vector-icons";
import { Slot, usePathname, useRouter } from "expo-router";
import { useRef, useState } from "react";
import { ActivityIndicator, Animated, PanResponder, Pressable, Text, View, useWindowDimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Sidebar } from "../components";
import { ClockInModal } from "../components/ClockInModal";
import { ClockOutModal } from "../components/ClockOutModal";
import { StaffSidebar } from "../components/StaffSidebar";
import { AuthProvider, useAuth } from "../contexts/AuthContext";
import { ClockProvider, useClock } from "../contexts/ClockContext";
import { ParkedOrderProvider } from "../contexts/ParkedOrderContext";
import { TimezoneProvider } from "../contexts/TimezoneContext";
import { ViewModeProvider, useViewMode } from "../contexts/ViewModeContext";
import "../global.css";
import { PowerSyncProvider } from "../utils/powersync/PowerSyncProvider";
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
  const { isStaffMode } = useViewMode();

  const [showClockInModal, setShowClockInModal] = useState(false);
  const [showClockOutModal, setShowClockOutModal] = useState(false);

  // Determine layout orientation
  const isLandscape = width > height;

  // Check if we're on screens that have their OWN sidebar (hide global sidebar)
  const isPosLineScreen = pathname === "/pos-line";
  // Only add-products has its own action sidebar; other order pages get the global sidebar
  const isOrderAddProductsScreen = pathname === "/order/add-products";
  
  // Only /sale/reports actually uses StaffPageLayout with its own sidebar
  const isStaffPageLayoutScreen = pathname === "/sale/reports";
  
  // Hide global sidebar ONLY for pages that provide their own sidebar/action panel
  const hideSidebar = isPosLineScreen || isOrderAddProductsScreen || isStaffPageLayoutScreen;

  // Show loading screen while checking stored authentication
  if (isLoading) {
    return (
      <View
        className="flex-1 bg-gray-100 justify-center items-center"
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
        className="flex-1 bg-gray-100"
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

  return (
    <View
      className="flex-1 bg-gray-100"
      style={{
        paddingTop: insets.top,
        paddingLeft: insets.left,
        paddingRight: insets.right,
      }}
    >
      {/* Main layout container */}
      <View className={`flex-1 ${isLandscape && !hideSidebar ? "flex-row" : "flex-col"}`}>
        {/* Page content area - renders current route */}
        <View className="flex-1">
          <Slot />
        </View>

        {/* Sidebar - switches between Admin and Staff mode */}
        {!hideSidebar && (
          isStaffMode ? (
            <StaffSidebar
              isLandscape={isLandscape}
              onClockInPress={handleClockInPress}
              onClockInLongPress={handleClockInLongPress}
              onClockOutPress={() => setShowClockOutModal(true)}
            />
          ) : (
            <Sidebar
              isLandscape={isLandscape}
              onClockInPress={handleClockInPress}
              onClockInLongPress={handleClockInLongPress}
              onClockOutPress={() => setShowClockOutModal(true)}
            />
          )
        )}
      </View>

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
          width: 52,
          height: 52,
          borderRadius: 14,
          backgroundColor: "rgba(0,0,0,0.55)",
        }}
        onPress={() => {
          if (!isDraggingRef.current) {
            router.push("/dev-tools");
          }
        }}
      >
        <Ionicons name="bug-outline" size={18} color="#22D3EE" />
        <Text style={{ color: "#22D3EE", fontSize: 8, fontWeight: "900", letterSpacing: 1.5, marginTop: 1 }}>DEV</Text>
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
