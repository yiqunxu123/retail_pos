import { Feather, Ionicons, MaterialCommunityIcons, MaterialIcons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import { Alert, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "../contexts/AuthContext";
import { useClock } from "../contexts/ClockContext";
import { useViewMode } from "../contexts/ViewModeContext";
import { useAppNavigation } from "../hooks/useAppNavigation";
import { BrandingSection } from "./BrandingSection";
import { SidebarButton } from "./SidebarButton";

// ============================================================================
// Constants
// ============================================================================

/** Sidebar width constant - exported for use in layout calculations */
export const SIDEBAR_WIDTH = 260;

// ============================================================================
// Types
// ============================================================================

interface SidebarProps {
  isLandscape: boolean;
  onClockInPress: () => void;
  onClockOutPress: () => void;
  onExitProgram?: () => void;
}

// ============================================================================
// Main Component
// ============================================================================

/**
 * Sidebar - Admin navigation sidebar
 */
export function Sidebar({
  isLandscape,
  onClockInPress,
  onClockOutPress,
}: SidebarProps) {
  const { navigateTo, pathname } = useAppNavigation();
  const insets = useSafeAreaInsets();
  const { logout } = useAuth();
  const { isClockedIn, getClockInTimeString, getElapsedTime } = useClock();
  const { setViewMode } = useViewMode();
  
  // Check if we're on the dashboard/home page
  const isDashboard = pathname === "/" || pathname === "/index";
  const [elapsedTime, setElapsedTime] = useState("00:00:00");

  const handleLogout = () => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      { text: "Cancel", style: "cancel" },
      { text: "Confirm", style: "destructive", onPress: () => logout() },
    ]);
  };

  useEffect(() => {
    if (!isClockedIn) {
      setElapsedTime("00:00:00");
      return;
    }
    const interval = setInterval(() => setElapsedTime(getElapsedTime()), 1000);
    return () => clearInterval(interval);
  }, [isClockedIn, getElapsedTime]);

  return (
    <View
      className={`bg-gray-50 p-2 ${isLandscape ? "border-l border-gray-200 h-full" : "border-t border-gray-200 flex-1"}`}
      style={{ width: isLandscape ? SIDEBAR_WIDTH : "100%" }}
    >
      <ScrollView 
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ gap: 8, paddingBottom: Math.max(insets.bottom, 16) + 8 }}
      >
        {/* Branding */}
        <BrandingSection />

        {/* Switch to Cashier (on dashboard) or Go to Menu (on other pages) */}
        <View className="mb-3">
          {isDashboard ? (
            <SidebarButton
              title="Switch to Cashier"
              icon={<Ionicons name="swap-horizontal" size={20} color="#EC1A52" />}
              onPress={() => setViewMode("staff")}
            />
          ) : (
            <SidebarButton
              title="Go to Menu"
              icon={<Ionicons name="menu-outline" size={20} color="#EC1A52" />}
              onPress={() => navigateTo("/")}
            />
          )}
        </View>

        {/* Clock In/Out Row */}
        <View className="flex-row gap-2">
          <SidebarButton
            title="Clock In"
            icon={<Ionicons name="log-in-outline" size={24} color={isClockedIn ? "#848484" : "#EC1A52"} />}
            onPress={onClockInPress}
            isActive={!isClockedIn}
            fullWidth={false}
          />
          <SidebarButton
            title="Clock Out"
            icon={<Ionicons name="log-out-outline" size={24} color={isClockedIn ? "#EC1A52" : "#848484"} />}
            onPress={onClockOutPress}
            isActive={isClockedIn}
            fullWidth={false}
          />
        </View>

        {/* Clock Status */}
        {isClockedIn && (
          <View className="bg-purple-100 rounded-lg p-2">
            <View className="flex-row justify-between">
              <View>
                <Text className="text-purple-600" style={{ fontSize: 10 }}>Clock In:</Text>
                <Text className="text-purple-800 font-bold" style={{ fontSize: 11 }}>{getClockInTimeString()}</Text>
              </View>
              <View className="items-end">
                <Text className="text-purple-600" style={{ fontSize: 10 }}>Duration:</Text>
                <Text className="text-purple-800 font-bold" style={{ fontSize: 11 }}>{elapsedTime}</Text>
              </View>
            </View>
          </View>
        )}

        {/* Divider Line - Separates clock from navigation */}
        <View className="border-t border-gray-300 my-1" />

        {/* Navigation - 2 columns */}
        <View className="flex-row gap-2">
          <SidebarButton
            title="Sales History"
            icon={<MaterialCommunityIcons name="history" size={24} color={isClockedIn ? "#EC1A52" : "#848484"} />}
            onPress={() => navigateTo("/sale/sales-history")}
            isActive={isClockedIn}
            fullWidth={false}
          />
          <SidebarButton
            title="Sales Return"
            icon={<MaterialIcons name="assignment-return" size={24} color={isClockedIn ? "#EC1A52" : "#848484"} />}
            onPress={() => navigateTo("/sale/sales-return")}
            isActive={isClockedIn}
            fullWidth={false}
          />
        </View>

        <View className="flex-row gap-2">
          <SidebarButton
            title="Reports"
            icon={<Ionicons name="bar-chart-outline" size={24} color={isClockedIn ? "#EC1A52" : "#848484"} />}
            onPress={() => navigateTo("/sale/reports")}
            isActive={isClockedIn}
            fullWidth={false}
          />
          <SidebarButton
            title="Customers"
            icon={<Ionicons name="people-outline" size={24} color={isClockedIn ? "#EC1A52" : "#848484"} />}
            onPress={() => navigateTo("/sale/customers")}
            isActive={isClockedIn}
            fullWidth={false}
          />
        </View>

        <View className="flex-row gap-2">
          <SidebarButton
            title="Parked Orders"
            icon={<MaterialCommunityIcons name="pause-circle-outline" size={24} color={isClockedIn ? "#EC1A52" : "#848484"} />}
            onPress={() => navigateTo("/sale/parked-orders")}
            isActive={isClockedIn}
            fullWidth={false}
          />
          <SidebarButton
            title="Payments"
            icon={<Ionicons name="card-outline" size={24} color={isClockedIn ? "#EC1A52" : "#848484"} />}
            onPress={() => navigateTo("/sale/payments-history")}
            isActive={isClockedIn}
            fullWidth={false}
          />
        </View>

        {/* Bottom Actions */}
        <View className="flex-row gap-2 mt-1">
          <SidebarButton
            title="Refresh"
            icon={<Ionicons name="refresh" size={24} color="#EC1A52" />}
            onPress={() => Alert.alert("Refresh", "Data refreshed")}
            fullWidth={false}
          />
          <SidebarButton
            title="Logout"
            icon={<Feather name="log-out" size={24} color="#EC1A52" />}
            onPress={handleLogout}
            fullWidth={false}
          />
        </View>
      </ScrollView>
    </View>
  );
}
