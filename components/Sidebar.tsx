import { Feather, Ionicons, MaterialCommunityIcons, MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Alert, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { useAuth } from "../contexts/AuthContext";
import { useClock } from "../contexts/ClockContext";
import { useViewMode } from "../contexts/ViewModeContext";

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
// Sub-components
// ============================================================================

/**
 * Small Button - For clock in/out (compact)
 */
function SmallButton({
  title,
  icon,
  onPress,
  isActive = true,
  variant = "default",
}: {
  title: string;
  icon: React.ReactNode;
  onPress: () => void;
  isActive?: boolean;
  variant?: "default" | "primary" | "danger";
}) {
  const styles = {
    default: {
      bg: isActive ? "#FFFFFF" : "#F2F2F2",
      border: isActive ? "#EC1A52" : "#848484",
      text: isActive ? "#EC1A52" : "#848484",
    },
    primary: {
      bg: "#EC1A52",
      border: "#EC1A52",
      text: "#FFFFFF",
    },
    danger: {
      bg: "#E43A00",
      border: "#E43A00",
      text: "#FFFFFF",
    },
  };

  const style = styles[variant];

  if (!isActive && variant === "default") {
    return (
      <View
        className="flex-1 rounded-lg py-2 items-center justify-center"
        style={{
          backgroundColor: style.bg,
          borderWidth: 1,
          borderColor: style.border,
          opacity: 0.5,
        }}
      >
        {icon}
        <Text style={{ fontSize: 10, color: style.text, fontWeight: "500", marginTop: 2 }} numberOfLines={1}>
          {title}
        </Text>
      </View>
    );
  }

  return (
    <TouchableOpacity
      onPress={onPress}
      className="flex-1 rounded-lg py-2 items-center justify-center"
      style={{
        backgroundColor: style.bg,
        borderWidth: variant === "default" ? 1 : 0,
        borderColor: style.border,
      }}
    >
      {icon}
      <Text style={{ fontSize: 10, color: style.text, fontWeight: "500", marginTop: 2 }} numberOfLines={1}>
        {title}
      </Text>
    </TouchableOpacity>
  );
}

/**
 * Nav Button - For navigation (larger)
 */
function NavButton({
  title,
  icon,
  onPress,
  isActive = true,
  variant = "default",
}: {
  title: string;
  icon: React.ReactNode;
  onPress: () => void;
  isActive?: boolean;
  variant?: "default" | "primary" | "danger";
}) {
  const styles = {
    default: {
      bg: isActive ? "#FFFFFF" : "#F2F2F2",
      border: isActive ? "#EC1A52" : "#848484",
      text: isActive ? "#EC1A52" : "#848484",
    },
    primary: {
      bg: "#EC1A52",
      border: "#EC1A52",
      text: "#FFFFFF",
    },
    danger: {
      bg: "#E43A00",
      border: "#E43A00",
      text: "#FFFFFF",
    },
  };

  const style = styles[variant];

  if (!isActive && variant === "default") {
    return (
      <View
        className="flex-1 rounded-lg py-3 items-center justify-center"
        style={{
          backgroundColor: style.bg,
          borderWidth: 1,
          borderColor: style.border,
          opacity: 0.5,
        }}
      >
        {icon}
        <Text style={{ fontSize: 12, color: style.text, fontWeight: "600", marginTop: 3 }} numberOfLines={1}>
          {title}
        </Text>
      </View>
    );
  }

  return (
    <TouchableOpacity
      onPress={onPress}
      className="flex-1 rounded-lg py-3 items-center justify-center"
      style={{
        backgroundColor: style.bg,
        borderWidth: variant === "default" ? 1 : 0,
        borderColor: style.border,
      }}
    >
      {icon}
      <Text style={{ fontSize: 12, color: style.text, fontWeight: "600", marginTop: 3 }} numberOfLines={1}>
        {title}
      </Text>
    </TouchableOpacity>
  );
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
      className={`bg-gray-50 p-2 ${isLandscape ? "border-l border-gray-200" : "border-t border-gray-200"}`}
      style={{ width: isLandscape ? SIDEBAR_WIDTH : "100%" }}
    >
      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ gap: 6 }}
      >
        {/* Branding */}
        <View
          className="rounded-lg py-2 px-3 items-center"
          style={{ backgroundColor: "#D9D9D9", borderWidth: 1, borderColor: "#1A1A1A", borderStyle: "dashed" }}
        >
          <Text style={{ fontSize: 11, color: "#1A1A1A", fontWeight: "500" }}>Branding</Text>
        </View>

        {/* Switch to Staff */}
        <TouchableOpacity
          onPress={() => setViewMode("staff")}
          className="rounded-lg py-2 px-3 flex-row items-center justify-center gap-2"
          style={{ backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: "#EC1A52" }}
        >
          <Ionicons name="swap-horizontal" size={16} color="#EC1A52" />
          <Text style={{ fontSize: 12, color: "#EC1A52", fontWeight: "600" }}>Switch to Staff</Text>
        </TouchableOpacity>

        {/* Clock In/Out Row - Small buttons */}
        <View className="flex-row gap-2">
          <SmallButton
            title="Clock In"
            icon={<Ionicons name="log-in-outline" size={18} color={isClockedIn ? "#848484" : "#EC1A52"} />}
            onPress={onClockInPress}
            isActive={!isClockedIn}
          />
          <SmallButton
            title="Clock Out"
            icon={<Ionicons name="log-out-outline" size={18} color={isClockedIn ? "#EC1A52" : "#848484"} />}
            onPress={onClockOutPress}
            isActive={isClockedIn}
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

        {/* Navigation - 2 columns with larger icons */}
        <View className="flex-row gap-2">
          <NavButton
            title="Sales History"
            icon={<MaterialCommunityIcons name="history" size={24} color={isClockedIn ? "#EC1A52" : "#848484"} />}
            onPress={() => navigateTo("/sale/sales-history")}
            isActive={isClockedIn}
          />
          <NavButton
            title="Sales Return"
            icon={<MaterialIcons name="assignment-return" size={24} color={isClockedIn ? "#EC1A52" : "#848484"} />}
            onPress={() => navigateTo("/sale/sales-return")}
            isActive={isClockedIn}
          />
        </View>

        <View className="flex-row gap-2">
          <NavButton
            title="Reports"
            icon={<Ionicons name="bar-chart-outline" size={24} color={isClockedIn ? "#EC1A52" : "#848484"} />}
            onPress={() => navigateTo("/sale/reports")}
            isActive={isClockedIn}
          />
          <NavButton
            title="Customers"
            icon={<Ionicons name="people-outline" size={24} color={isClockedIn ? "#EC1A52" : "#848484"} />}
            onPress={() => navigateTo("/sale/customers")}
            isActive={isClockedIn}
          />
        </View>

        <View className="flex-row gap-2">
          <NavButton
            title="Parked Orders"
            icon={<MaterialCommunityIcons name="pause-circle-outline" size={24} color={isClockedIn ? "#EC1A52" : "#848484"} />}
            onPress={() => navigateTo("/sale/parked-orders")}
            isActive={isClockedIn}
          />
          <NavButton
            title="Payments"
            icon={<Ionicons name="card-outline" size={24} color={isClockedIn ? "#EC1A52" : "#848484"} />}
            onPress={() => navigateTo("/sale/payments-history")}
            isActive={isClockedIn}
          />
        </View>

        {/* Admin Section */}
        <View className="border-t border-gray-300 pt-1 mt-1">
          <Text className="text-gray-500 text-center mb-1" style={{ fontSize: 10 }}>Admin Functions</Text>
        </View>

        <View className="flex-row gap-2">
          <NavButton
            title="Products"
            icon={<Ionicons name="cube-outline" size={24} color="#EC1A52" />}
            onPress={() => navigateTo("/catalog/products")}
          />
          <NavButton
            title="Inventory"
            icon={<Ionicons name="layers-outline" size={24} color="#EC1A52" />}
            onPress={() => navigateTo("/inventory/stocks")}
          />
        </View>

        <View className="flex-row gap-2">
          <NavButton
            title="Fulfillment"
            icon={<Ionicons name="checkmark-done-outline" size={24} color="#EC1A52" />}
            onPress={() => navigateTo("/sale/fulfillments")}
          />
          <NavButton
            title="Settings"
            icon={<Ionicons name="settings-outline" size={24} color="#EC1A52" />}
            onPress={() => navigateTo("/settings")}
          />
        </View>

        {/* Bottom Actions */}
        <View className="flex-row gap-2 mt-1">
          <NavButton
            title="Refresh"
            icon={<Ionicons name="refresh" size={24} color="#EC1A52" />}
            onPress={() => Alert.alert("Refresh", "Data refreshed")}
          />
          <NavButton
            title="Logout"
            icon={<Feather name="log-out" size={24} color="#EC1A52" />}
            onPress={handleLogout}
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
