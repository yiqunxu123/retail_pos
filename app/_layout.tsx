import { Slot, usePathname, useRouter } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, Text, View, useWindowDimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Sidebar } from "../components";
import { ClockInModal } from "../components/ClockInModal";
import { ClockOutModal } from "../components/ClockOutModal";
import { AuthProvider, useAuth } from "../contexts/AuthContext";
import { ClockProvider, useClock } from "../contexts/ClockContext";
import "../global.css";
import { PowerSyncProvider } from "../utils/powersync/PowerSyncProvider";
import LoginScreen from "./login";

/**
 * LayoutContent - Inner layout component that uses clock context
 */
function LayoutContent() {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const pathname = usePathname();
  const router = useRouter();
  const { isAuthenticated, isLoading, user, logout } = useAuth();
  const { isClockedIn, selectedPosLine, clockIn, clockOut, selectPosLine } = useClock();

  const [showClockInModal, setShowClockInModal] = useState(false);
  const [showClockOutModal, setShowClockOutModal] = useState(false);

  // Determine layout orientation
  const isLandscape = width > height;

  // Check if we're on the POS line screen (hide default sidebar)
  const isPosLineScreen = pathname === "/pos-line";

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
    if (selectedPosLine) {
      setShowClockInModal(true);
    } else {
      console.log("Please select a POS Line first");
    }
  };

  // Handle Clock In submission
  const handleClockIn = (employeeId: string) => {
    if (selectedPosLine) {
      clockIn(employeeId, selectedPosLine);
      setShowClockInModal(false);
    }
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
        paddingBottom: insets.bottom,
        paddingLeft: insets.left,
        paddingRight: insets.right,
      }}
    >
      {/* Main layout container */}
      <View className={`flex-1 ${isLandscape && !isPosLineScreen ? "flex-row" : "flex-col"}`}>
        {/* Page content area - renders current route */}
        <View className="flex-1">
          <Slot />
        </View>

        {/* Default Sidebar - only show on home screen */}
        {!isPosLineScreen && (
          <Sidebar
            isLandscape={isLandscape}
            onClockInPress={handleClockInPress}
            onClockOutPress={() => setShowClockOutModal(true)}
            onExitProgram={logout}
          />
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
 * Wraps app with PowerSyncProvider, AuthProvider and ClockProvider for global state
 */
export default function RootLayout() {
  return (
    <PowerSyncProvider>
      <AuthProvider>
        <ClockProvider>
          <LayoutContent />
        </ClockProvider>
      </AuthProvider>
    </PowerSyncProvider>
  );
}
