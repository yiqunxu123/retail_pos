import { Slot, usePathname, useRouter } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, Text, View, useWindowDimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Sidebar } from "../components";
import { StaffSidebar } from "../components/StaffSidebar";
import { ClockInModal } from "../components/ClockInModal";
import { ClockOutModal } from "../components/ClockOutModal";
import { AuthProvider, useAuth } from "../contexts/AuthContext";
import { ClockProvider, useClock } from "../contexts/ClockContext";
import { ViewModeProvider, useViewMode } from "../contexts/ViewModeContext";
import { ParkedOrderProvider } from "../contexts/ParkedOrderContext";
import "../global.css";
import { PowerSyncProvider } from "../utils/powersync/PowerSyncProvider";
import LoginScreen from "./login";

/**
 * LayoutContent - Inner layout component that uses contexts
 */
function LayoutContent() {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const pathname = usePathname();
  const router = useRouter();
  const { isAuthenticated, isLoading, user, logout } = useAuth();
  const { isClockedIn, selectedPosLine, clockIn, clockOut, selectPosLine } = useClock();
  const { isStaffMode } = useViewMode();

  const [showClockInModal, setShowClockInModal] = useState(false);
  const [showClockOutModal, setShowClockOutModal] = useState(false);

  // Determine layout orientation
  const isLandscape = width > height;

  // Check if we're on screens that should hide the sidebar entirely
  const isPosLineScreen = pathname === "/pos-line";
  const isOrderScreen = pathname.startsWith("/order");
  
  // Pages using StaffPageLayout have their own sidebar (hide default sidebar in both staff and admin modes)
  const isStaffPageLayoutScreen = 
    pathname === "/sale/sales-history" ||
    pathname === "/sale/customers" ||
    pathname === "/sale/sales-return" ||
    pathname === "/sale/parked-orders" ||
    pathname === "/sale/reports" ||
    pathname.startsWith("/sale/reports-"); // Sub-report pages
  
  // Hide sidebar for: POS line, order pages (have their own action panel), and StaffPageLayout pages
  const hideSidebar = isPosLineScreen || isOrderScreen || isStaffPageLayoutScreen;

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
              onClockOutPress={() => setShowClockOutModal(true)}
            />
          ) : (
            <Sidebar
              isLandscape={isLandscape}
              onClockInPress={handleClockInPress}
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
    </View>
  );
}

/**
 * RootLayout - Main app layout with sticky sidebar
 * Wraps app with providers for global state
 */
export default function RootLayout() {
  return (
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
  );
}
