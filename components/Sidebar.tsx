import { Feather, Ionicons, MaterialCommunityIcons, MaterialIcons } from "@expo/vector-icons";
import { Alert, ScrollView, View } from "react-native";
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
  const { isClockedIn } = useClock();
  const { setViewMode } = useViewMode();
  
  // Check if we're on the dashboard/home page
  const isDashboard = pathname === "/" || pathname === "/index";

  const handleLogout = () => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      { text: "Cancel", style: "cancel" },
      { text: "Confirm", style: "destructive", onPress: () => logout() },
    ]);
  };

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

        {/* Row: Time Clock | Clock Out */}
        <View className="flex-row gap-2">
          <SidebarButton
            title="Time Clock"
            icon={<Ionicons name="time-outline" size={24} color={isClockedIn ? "#848484" : "#EC1A52"} />}
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

        {/* Sales History - Full width */}
        <SidebarButton
          title="Sales History"
          icon={<MaterialCommunityIcons name="history" size={24} color={isClockedIn ? "#EC1A52" : "#848484"} />}
          onPress={() => navigateTo("/sale/sales-history")}
          isActive={isClockedIn}
        />

        {/* Sales Return - Full width */}
        <SidebarButton
          title="Sales Return"
          icon={<MaterialIcons name="assignment-return" size={24} color={isClockedIn ? "#EC1A52" : "#848484"} />}
          onPress={() => navigateTo("/sale/sales-return")}
          isActive={isClockedIn}
        />

        {/* View Reports - Full width */}
        <SidebarButton
          title="View Reports"
          icon={<Ionicons name="bar-chart-outline" size={24} color={isClockedIn ? "#EC1A52" : "#848484"} />}
          onPress={() => navigateTo("/sale/reports")}
          isActive={isClockedIn}
        />

        {/* View Customers - Full width */}
        <SidebarButton
          title="View Customers"
          icon={<Ionicons name="people-outline" size={24} color={isClockedIn ? "#EC1A52" : "#848484"} />}
          onPress={() => navigateTo("/sale/customers")}
          isActive={isClockedIn}
        />

        {/* View Parked Orders - Full width */}
        <SidebarButton
          title="View Parked Orders"
          icon={<MaterialCommunityIcons name="pause-circle-outline" size={24} color={isClockedIn ? "#EC1A52" : "#848484"} />}
          onPress={() => navigateTo("/sale/parked-orders")}
          isActive={isClockedIn}
        />

        {/* Payments - Full width */}
        <SidebarButton
          title="Payments"
          icon={<Ionicons name="card-outline" size={24} color={isClockedIn ? "#EC1A52" : "#848484"} />}
          onPress={() => navigateTo("/sale/payments-history")}
          isActive={isClockedIn}
        />

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
