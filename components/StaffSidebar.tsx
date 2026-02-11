import { Feather, Ionicons, MaterialCommunityIcons, MaterialIcons } from "@expo/vector-icons";
import { Alert, ScrollView, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "../contexts/AuthContext";
import { useClock } from "../contexts/ClockContext";
import { useViewMode } from "../contexts/ViewModeContext";
import { useAppNavigation } from "../hooks/useAppNavigation";
import { BrandingSection } from "./BrandingSection";
import { SidebarButton } from "./SidebarButton";

// Sidebar width - matches Figma (440px scaled down for mobile)
export const STAFF_SIDEBAR_WIDTH = 260;

interface StaffSidebarProps {
  isLandscape: boolean;
  onClockInPress: () => void;
  onClockOutPress: () => void;
}

/**
 * StaffSidebar - Navigation sidebar for staff/cashier mode
 * Matches Figma design with proper active/inactive states
 */
export function StaffSidebar({
  isLandscape,
  onClockInPress,
  onClockOutPress,
}: StaffSidebarProps) {
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
      { text: "Logout", style: "destructive", onPress: () => logout() },
    ]);
  };

  const handleChangeUser = () => {
    Alert.alert("Change User", "Switch to a different user?", [
      { text: "Cancel", style: "cancel" },
      { text: "Switch User", onPress: () => { setViewMode("admin"); handleLogout(); } },
    ]);
  };

  const handleSettings = () => navigateTo("/settings");

  return (
    <View
      className={`bg-gray-50 p-2 ${isLandscape ? "border-l border-gray-200 h-full" : "border-t border-gray-200 flex-1"}`}
      style={{ width: isLandscape ? STAFF_SIDEBAR_WIDTH : "100%" }}
    >
      <ScrollView 
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ gap: 8, paddingBottom: Math.max(insets.bottom, 16) + 8 }}
      >
        {/* Branding Section */}
        <BrandingSection />

        {/* Switch to Admin (on dashboard) or Back to Menu (on other pages) */}
        {isDashboard ? (
          <SidebarButton
            title="Switch to Admin"
            icon={<Ionicons name="swap-horizontal" size={20} color="#EC1A52" />}
            onPress={() => setViewMode("admin")}
          />
        ) : (
          <SidebarButton
            title="Back to Menu"
            icon={<Ionicons name="arrow-back" size={20} color="#EC1A52" />}
            onPress={() => navigateTo("/")}
          />
        )}

        {/* Row 1: Time Clock | Change User */}
        <View className="flex-row gap-2">
          <SidebarButton
            title="Time Clock"
            icon={<Ionicons name="time-outline" size={24} color={isClockedIn ? "#848484" : "#EC1A52"} />}
            onPress={onClockInPress}
            isActive={!isClockedIn}
            fullWidth={false}
          />
          <SidebarButton
            title="Change User"
            icon={<MaterialCommunityIcons name="account-switch" size={24} color="#848484" />}
            onPress={handleChangeUser}
            isActive={false}
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

        {/* Logout row - changes based on clock status */}
        {isClockedIn ? (
          // Clocked in: Clock Out | Settings
          <View className="flex-row gap-2">
            <SidebarButton
              title="Clock Out"
              icon={<Ionicons name="time-outline" size={24} color="#EC1A52" />}
              onPress={onClockOutPress}
              fullWidth={false}
            />
            <SidebarButton
              title="Settings"
              icon={<Ionicons name="settings-outline" size={24} color="#EC1A52" />}
              onPress={handleSettings}
              fullWidth={false}
            />
          </View>
        ) : (
          // Not clocked in: Logout (disabled)
          <SidebarButton
            title="Logout"
            icon={<Feather name="log-out" size={24} color="#848484" />}
            onPress={handleLogout}
            isActive={false}
          />
        )}

        {/* Row Bottom: Refresh | Exit Program */}
        <View className="flex-row gap-2">
          <SidebarButton
            title="Refresh"
            icon={<Ionicons name="refresh" size={20} color="#EC1A52" />}
            onPress={() => Alert.alert("Refresh", "Data refreshed")}
            fullWidth={false}
          />
          <SidebarButton
            title="Exit"
            icon={<Ionicons name="close-circle-outline" size={20} color="#EC1A52" />}
            onPress={() => Alert.alert("Exit", "This would exit the POS application")}
            fullWidth={false}
          />
        </View>
      </ScrollView>
    </View>
  );
}
