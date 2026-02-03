import { Ionicons, MaterialCommunityIcons, MaterialIcons, Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Alert, Text, View, ScrollView } from "react-native";
import { useAuth } from "../contexts/AuthContext";
import { useClock } from "../contexts/ClockContext";
import { useViewMode } from "../contexts/ViewModeContext";
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
  const router = useRouter();
  const { logout } = useAuth();
  const { isClockedIn } = useClock();
  const { setViewMode } = useViewMode();

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

  const handleSettings = () => {
    router.push("/settings" as any);
  };

  const navigateTo = (path: string) => router.push(path as any);

  return (
    <View
      className={`bg-gray-50 p-2 ${isLandscape ? "border-l border-gray-200" : "border-t border-gray-200"}`}
      style={{ width: isLandscape ? STAFF_SIDEBAR_WIDTH : "100%" }}
    >
      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ gap: 8 }}
      >
        {/* Branding Section */}
        <View
          className="rounded-lg py-2 px-3 items-center justify-center"
          style={{
            backgroundColor: "#D9D9D9",
            borderWidth: 1,
            borderColor: "#1A1A1A",
            borderStyle: "dashed",
          }}
        >
          <Text style={{ fontSize: 12, color: "#1A1A1A", fontWeight: "500" }}>Branding</Text>
        </View>

        {/* Switch to Admin Mode */}
        <SidebarButton
          title="Switch to Admin"
          icon={<Ionicons name="swap-horizontal" size={20} color="#EC1A52" />}
          onPress={() => setViewMode("admin")}
        />

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
