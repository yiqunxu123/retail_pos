import { Feather, Ionicons, MaterialCommunityIcons, MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Alert, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "../contexts/AuthContext";
import { useClock } from "../contexts/ClockContext";
import { useViewMode } from "../contexts/ViewModeContext";
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
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { logout, user } = useAuth();
  const { isClockedIn, getClockInTimeString, getElapsedTime } = useClock();
  const { setViewMode } = useViewMode();
  const [elapsedTime, setElapsedTime] = useState("00:00:00");

  const navigateTo = (path: string) => router.push(path as any);

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
        <View
          className="rounded-lg py-2 px-3 items-center justify-center"
          style={{ backgroundColor: "#D9D9D9", borderWidth: 1, borderColor: "#1A1A1A", borderStyle: "dashed" }}
        >
          <Text style={{ fontSize: 12, color: "#1A1A1A", fontWeight: "500" }}>Branding</Text>
        </View>

        {/* Switch to Staff */}
        <SidebarButton
          title="Switch to Staff"
          icon={<Ionicons name="swap-horizontal" size={20} color="#EC1A52" />}
          onPress={() => setViewMode("staff")}
        />

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

        {/* Admin Section */}
        <View className="border-t border-gray-300 pt-1 mt-1">
          <Text className="text-gray-500 text-center mb-1" style={{ fontSize: 10 }}>Admin Functions</Text>
        </View>

        <View className="flex-row gap-2">
          <SidebarButton
            title="Products"
            icon={<Ionicons name="cube-outline" size={24} color="#EC1A52" />}
            onPress={() => navigateTo("/catalog/products")}
            fullWidth={false}
          />
          <SidebarButton
            title="Inventory"
            icon={<Ionicons name="layers-outline" size={24} color="#EC1A52" />}
            onPress={() => navigateTo("/inventory/stocks")}
            fullWidth={false}
          />
        </View>

        <View className="flex-row gap-2">
          <SidebarButton
            title="Fulfillment"
            icon={<Ionicons name="checkmark-done-outline" size={24} color="#EC1A52" />}
            onPress={() => navigateTo("/sale/fulfillments")}
            fullWidth={false}
          />
          <SidebarButton
            title="Settings"
            icon={<Ionicons name="settings-outline" size={24} color="#EC1A52" />}
            onPress={() => navigateTo("/settings")}
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

        {/* User Info */}
        {user && (
          <View className="bg-gray-100 rounded-lg p-2">
            <Text className="text-gray-600" style={{ fontSize: 10 }}>Logged in as</Text>
            <Text className="text-gray-800 font-medium" style={{ fontSize: 12 }}>{user.name || user.username}</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}
