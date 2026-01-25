import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { ScrollView, Text, View } from "react-native";
import { useClock } from "../contexts/ClockContext";
import { SidebarButton } from "./SidebarButton";

// Sidebar width constant - exported for use in layout calculations
export const SIDEBAR_WIDTH = 220;

interface SidebarProps {
  isLandscape: boolean;
  onClockInPress: () => void;
  onClockOutPress: () => void;
  onCheckout?: () => void;
  onGoToMenu?: () => void;
  onExitProgram?: () => void;
}

/**
 * Sidebar - Global navigation sidebar
 * Sticky component that appears on all screens
 * Shows clock status when user is clocked in
 */
export function Sidebar({
  isLandscape,
  onClockInPress,
  onClockOutPress,
  onCheckout,
  onGoToMenu,
  onExitProgram,
}: SidebarProps) {
  const router = useRouter();
  const { isClockedIn, getClockInTimeString, getElapsedTime } = useClock();
  const [elapsedTime, setElapsedTime] = useState("00:00:00");

  // Navigation handlers
  const navigateTo = (path: string) => {
    router.push(path as any);
  };

  // Update elapsed time every second when clocked in
  useEffect(() => {
    if (!isClockedIn) {
      setElapsedTime("00:00:00");
      return;
    }

    const interval = setInterval(() => {
      setElapsedTime(getElapsedTime());
    }, 1000);

    return () => clearInterval(interval);
  }, [isClockedIn, getElapsedTime]);

  return (
    <View
      className={`
        bg-gray-50 p-3
        ${isLandscape ? "border-l border-gray-200" : "border-t border-gray-200"}
      `}
      style={{
        width: isLandscape ? SIDEBAR_WIDTH : "100%",
      }}
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerClassName={`gap-2 ${!isLandscape ? "flex-row flex-wrap" : ""}`}
      >
        {/* Branding Section */}
        <View className={`${!isLandscape ? "w-full" : ""}`}>
          <View className="bg-gray-200 rounded-lg p-4 items-center mb-2">
            <Text className="text-gray-600 text-sm font-medium">Branding</Text>
            <Text className="text-gray-600 text-sm font-medium">Section</Text>
          </View>
        </View>

        {/* Clock In/Out - Side by side */}
        <View className="flex-row gap-2">
          <SidebarButton
            label="Clock In"
            icon={<Ionicons name="log-in-outline" size={18} color={isClockedIn ? "#9ca3af" : "#374151"} />}
            fullWidth={false}
            onPress={onClockInPress}
            disabled={isClockedIn}
          />
          <SidebarButton
            label="Clock Out"
            icon={<Ionicons name="log-out-outline" size={18} color="white" />}
            variant="danger"
            fullWidth={false}
            onPress={onClockOutPress}
            disabled={!isClockedIn}
          />
        </View>

        {/* Clock Status - Only show when clocked in */}
        {isClockedIn && (
          <View className="bg-purple-100 rounded-lg p-3 gap-2">
            <View className="flex-row justify-between">
              <View className="flex-1">
                <Text className="text-purple-600 text-xs font-medium">Clock In Time:</Text>
                <Text className="text-purple-800 text-sm font-bold">{getClockInTimeString()}</Text>
              </View>
              <View className="flex-1 items-end">
                <Text className="text-purple-600 text-xs font-medium">Clock In Duration:</Text>
                <Text className="text-purple-800 text-sm font-bold">{elapsedTime}</Text>
              </View>
            </View>
          </View>
        )}

        {/* Navigation buttons */}
        <SidebarButton
          label="Customers"
          icon={<Ionicons name="people-outline" size={18} color="#374151" />}
          onPress={() => navigateTo("/sale/customers")}
        />

        <SidebarButton
          label="Customer Groups"
          icon={<Ionicons name="people-circle-outline" size={18} color="#374151" />}
          onPress={() => navigateTo("/sale/customer-groups")}
        />

        <SidebarButton
          label="Products"
          icon={<Ionicons name="cube-outline" size={18} color="#374151" />}
          onPress={() => navigateTo("/catalog/products")}
        />

        <SidebarButton
          label="Stocks"
          icon={<Ionicons name="layers-outline" size={18} color="#374151" />}
          onPress={() => navigateTo("/inventory/stocks")}
        />

        <SidebarButton
          label="Stock Alerts"
          icon={<Ionicons name="alert-circle-outline" size={18} color="#374151" />}
          onPress={() => navigateTo("/inventory/stock-alerts")}
        />

        <SidebarButton
          label="Fulfillments"
          icon={<Ionicons name="checkmark-done-outline" size={18} color="#374151" />}
          onPress={() => navigateTo("/sale/fulfillments")}
        />

        <SidebarButton
          label="Payments History"
          icon={<Ionicons name="card-outline" size={18} color="#374151" />}
          onPress={() => navigateTo("/sale/payments-history")}
        />

        <SidebarButton
          label="Sales Return"
          icon={<Ionicons name="return-down-back-outline" size={18} color="#374151" />}
          onPress={() => navigateTo("/sale/sales-return")}
        />

        {/* Checkout Button */}
        {/* <SidebarButton
          label="Checkout"
          icon={<Ionicons name="cart-outline" size={18} color="white" />}
          variant="danger"
          onPress={onCheckout}
        /> */}

        {/* Go to Menu / Back Button */}
        <SidebarButton
          label="Go to Menu"
          icon={<Ionicons name="grid-outline" size={18} color="#374151" />}
          onPress={onGoToMenu}
        />

        {/* Bottom action buttons */}
        <View className="flex-row gap-2 mt-2">
          <SidebarButton
            label="Refresh"
            icon={<Ionicons name="refresh" size={18} color="#374151" />}
            variant="warning"
            fullWidth={false}
          />
          <SidebarButton
            label="Exit Program"
            icon={<Ionicons name="close-circle-outline" size={18} color="white" />}
            variant="danger"
            fullWidth={false}
            onPress={onExitProgram}
          />
        </View>
      </ScrollView>
    </View>
  );
}
