import { iconSize } from '@/utils/theme';
import { Ionicons, MaterialCommunityIcons, MaterialIcons } from "@expo/vector-icons";
import { Alert, ScrollView, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "../contexts/AuthContext";
import { useClock } from "../contexts/ClockContext";
import { useViewMode } from "../contexts/ViewModeContext";
import { useAppNavigation } from "../hooks/useAppNavigation";
import { BrandingSection } from "./BrandingSection";
import { SidebarButton } from "./SidebarButton";

/** Sidebar width constant - exported for use in layout calculations */
export const DASHBOARD_SIDEBAR_WIDTH = 440;

interface DashboardSidebarProps {
  isLandscape: boolean;
  onClockInPress: () => void;
  onClockInLongPress?: () => void;
  onClockOutPress: () => void;
  onExitProgram?: () => void;
}

/**
 * DashboardSidebar - Unified navigation sidebar for both Admin and Staff modes
 * Automatically switches "Change User" behavior based on current view mode
 */
export function DashboardSidebar({
  isLandscape,
  onClockInPress,
  onClockInLongPress,
  onClockOutPress,
}: DashboardSidebarProps) {
  const { navigateTo } = useAppNavigation();
  const insets = useSafeAreaInsets();
  const { logout } = useAuth();
  const { isClockedIn } = useClock();
  const { isStaffMode, setViewMode } = useViewMode();

  const handleChangeUser = () => {
    // Toggle between admin and staff mode
    setViewMode(isStaffMode ? "admin" : "staff");
  };

  const handleLogout = () => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      { text: "Cancel", style: "cancel" },
      { text: "Logout", style: "destructive", onPress: () => logout() },
    ]);
  };

  const handleSettings = () => navigateTo("/settings");

  return (
    <View
      className={`bg-[#F7F7F9] ${isLandscape ? "h-full" : "flex-1"}`}
      style={{ width: isLandscape ? DASHBOARD_SIDEBAR_WIDTH : "100%" }}
    >
      <ScrollView
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          gap: 12,
          padding: 16,
          paddingBottom: Math.max(insets.bottom, 16) + 16,
        }}
      >
        {/* Branding */}
        <BrandingSection />

        {/* Top Row: Time Clock | Change User */}
        <View className="flex-row gap-3">
          {isClockedIn ? (
            <SidebarButton
              title="Clock In"
              icon={<Ionicons name="time-outline" size={iconSize['2xl']} />}
              variant="secondary"
              disabled={true}
              fullWidth={false}
            />
          ) : (
            <SidebarButton
              title="Time Clock"
              icon={<Ionicons name="time-outline" size={iconSize['2xl']} />}
              onPress={onClockInPress}
              onLongPress={onClockInLongPress}
              variant="primary"
              fullWidth={false}
            />
          )}
          <SidebarButton
            title="Change User"
            icon={<MaterialCommunityIcons name="account-switch" size={iconSize['2xl']} />}
            onPress={handleChangeUser}
            variant="outline"
            fullWidth={false}
          />
        </View>

        {/* Sales History */}
        <SidebarButton
          title="Sales History"
          icon={<MaterialCommunityIcons name="history" size={iconSize['2xl']} />}
          onPress={() => navigateTo("/sale/sales-history")}
          variant={isClockedIn ? "outline" : "secondary"}
          disabled={!isClockedIn}
        />

        {/* Sales Return */}
        <SidebarButton
          title="Sales Return"
          icon={<MaterialCommunityIcons name="arrow-left-box" size={iconSize['2xl']} />}
          onPress={() => navigateTo("/sale/sales-return")}
          variant={isClockedIn ? "outline" : "secondary"}
          disabled={!isClockedIn}
        />

        {/* View Reports */}
        <SidebarButton
          title="View Reports"
          icon={<Ionicons name="bar-chart-outline" size={iconSize['2xl']} />}
          onPress={() => navigateTo("/sale/reports")}
          variant={isClockedIn ? "outline" : "secondary"}
          disabled={!isClockedIn}
        />

        {/* View Customers */}
        <SidebarButton
          title="View Customers"
          icon={<Ionicons name="people-outline" size={iconSize['2xl']} />}
          onPress={() => navigateTo("/sale/customers")}
          variant={isClockedIn ? "outline" : "secondary"}
          disabled={!isClockedIn}
        />

        {/* View Parked Orders */}
        <SidebarButton
          title="View Parked Orders"
          icon={<MaterialCommunityIcons name="pause-circle-outline" size={iconSize['2xl']} />}
          onPress={() => navigateTo("/sale/parked-orders")}
          variant={isClockedIn ? "purple-outline" : "secondary"}
          disabled={!isClockedIn}
        />

        {/* Row: Clock out | Settings (Shown when clocked in) or Logout (Shown when clocked out) */}
        {isClockedIn ? (
          <View className="flex-row gap-3">
            <SidebarButton
              title="Clock out"
              icon={<Ionicons name="log-out-outline" size={iconSize['2xl']} />}
              onPress={onClockOutPress}
              variant="outline"
              fullWidth={false}
            />
            <SidebarButton
              title="Settings"
              icon={<Ionicons name="settings-outline" size={iconSize['2xl']} />}
              onPress={handleSettings}
              variant="outline"
              fullWidth={false}
            />
          </View>
        ) : (
          <SidebarButton
            title="Logout"
            icon={<Ionicons name="log-out-outline" size={iconSize['2xl']} />}
            onPress={handleLogout}
            variant="secondary"
            disabled={true}
          />
        )}

        {/* Bottom Actions */}
        <View className="flex-row gap-3">
          <SidebarButton
            title="Refresh"
            icon={<Ionicons name="refresh" size={iconSize['2xl']} />}
            onPress={() => Alert.alert("Refresh", "Data refreshed")}
            variant="primary"
            fullWidth={false}
          />
          <SidebarButton
            title="Exit Program"
            icon={<Ionicons name="close-circle-outline" size={iconSize['2xl']} />}
            onPress={handleLogout}
            variant="danger"
            fullWidth={false}
          />
        </View>
      </ScrollView>
    </View>
  );
}
