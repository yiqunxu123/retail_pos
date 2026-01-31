import { Ionicons, MaterialCommunityIcons, MaterialIcons, Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Alert, Text, TouchableOpacity, View, ScrollView } from "react-native";
import { useAuth } from "../contexts/AuthContext";
import { useClock } from "../contexts/ClockContext";
import { useViewMode } from "../contexts/ViewModeContext";

// Sidebar width - matches Figma (440px scaled down for mobile)
export const STAFF_SIDEBAR_WIDTH = 280;

interface StaffSidebarProps {
  isLandscape: boolean;
  onClockInPress: () => void;
  onClockOutPress: () => void;
}

/**
 * Staff Button - Vertical layout matching Figma design
 */
function StaffButton({
  title,
  icon,
  onPress,
  isActive = true,
  isPrimary = false,
}: {
  title: string;
  icon: React.ReactNode;
  onPress: () => void;
  isActive?: boolean;
  isPrimary?: boolean;
}) {
  // Primary style (red background, white text)
  if (isPrimary) {
    return (
      <TouchableOpacity
        onPress={onPress}
        className="flex-1 rounded-lg justify-center items-center py-3"
        style={{
          backgroundColor: "#EC1A52",
          shadowColor: "#000",
          shadowOffset: { width: 1, height: 1 },
          shadowOpacity: 0.25,
          shadowRadius: 4,
          elevation: 2,
        }}
      >
        {icon}
        <Text className="font-medium text-center mt-1 text-white" style={{ fontSize: 14 }}>
          {title}
        </Text>
      </TouchableOpacity>
    );
  }

  // Inactive style (gray border, gray text, disabled)
  if (!isActive) {
    return (
      <View
        className="flex-1 rounded-lg justify-center items-center py-3"
        style={{
          backgroundColor: "#F2F2F2",
          borderWidth: 1,
          borderColor: "#848484",
          opacity: 0.5,
        }}
      >
        {icon}
        <Text className="font-medium text-center mt-1" style={{ fontSize: 14, color: "#848484" }}>
          {title}
        </Text>
      </View>
    );
  }

  // Active style (white bg, red border, red text)
  return (
    <TouchableOpacity
      onPress={onPress}
      className="flex-1 rounded-lg justify-center items-center py-3"
      style={{
        backgroundColor: "#FFFFFF",
        borderWidth: 1,
        borderColor: "#EC1A52",
        shadowColor: "#000",
        shadowOffset: { width: 1, height: 1 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 2,
      }}
    >
      {icon}
      <Text className="font-medium text-center mt-1" style={{ fontSize: 14, color: "#EC1A52" }}>
        {title}
      </Text>
    </TouchableOpacity>
  );
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
        <TouchableOpacity
          onPress={() => setViewMode("admin")}
          className="rounded-lg py-2 px-3 flex-row items-center justify-center gap-2"
          style={{
            backgroundColor: "#1A1A1A",
          }}
        >
          <Ionicons name="swap-horizontal" size={18} color="#FFFFFF" />
          <Text style={{ fontSize: 12, color: "#FFFFFF", fontWeight: "600" }}>Switch to Admin</Text>
        </TouchableOpacity>

        {/* Row 1: Time Clock | Change User */}
        <View className="flex-row gap-2">
          <StaffButton
            title="Time Clock"
            icon={<Ionicons name="time-outline" size={24} color={isClockedIn ? "#848484" : "#FFFFFF"} />}
            onPress={onClockInPress}
            isPrimary={!isClockedIn}
            isActive={isClockedIn ? false : true}
          />
          <StaffButton
            title="Change User"
            icon={<MaterialCommunityIcons name="account-switch" size={24} color="#848484" />}
            onPress={handleChangeUser}
            isActive={false}
          />
        </View>

        {/* Sales History - Full width */}
        <StaffButton
          title="Sales History"
          icon={<MaterialCommunityIcons name="history" size={24} color={isClockedIn ? "#EC1A52" : "#848484"} />}
          onPress={() => navigateTo("/sale/sales-history")}
          isActive={isClockedIn}
        />

        {/* Sales Return - Full width */}
        <StaffButton
          title="Sales Return"
          icon={<MaterialIcons name="assignment-return" size={24} color={isClockedIn ? "#EC1A52" : "#848484"} />}
          onPress={() => navigateTo("/sale/sales-return")}
          isActive={isClockedIn}
        />

        {/* View Reports - Full width */}
        <StaffButton
          title="View Reports"
          icon={<Ionicons name="bar-chart-outline" size={24} color={isClockedIn ? "#EC1A52" : "#848484"} />}
          onPress={() => navigateTo("/sale/reports")}
          isActive={isClockedIn}
        />

        {/* View Customers - Full width */}
        <StaffButton
          title="View Customers"
          icon={<Ionicons name="people-outline" size={24} color={isClockedIn ? "#EC1A52" : "#848484"} />}
          onPress={() => navigateTo("/sale/customers")}
          isActive={isClockedIn}
        />

        {/* View Parked Orders - Full width */}
        <StaffButton
          title="View Parked Orders"
          icon={<MaterialCommunityIcons name="pause-circle-outline" size={24} color={isClockedIn ? "#EC1A52" : "#848484"} />}
          onPress={() => navigateTo("/sale/parked-orders")}
          isActive={isClockedIn}
        />

        {/* Logout row - changes based on clock status */}
        {isClockedIn ? (
          // Clocked in: Clock Out | Settings
          <View className="flex-row gap-2">
            <StaffButton
              title="Clock Out"
              icon={<Ionicons name="time-outline" size={24} color="#FFFFFF" />}
              onPress={onClockOutPress}
              isPrimary={true}
            />
            <StaffButton
              title="Settings"
              icon={<Ionicons name="settings-outline" size={24} color="#EC1A52" />}
              onPress={handleSettings}
              isActive={true}
            />
          </View>
        ) : (
          // Not clocked in: Logout (disabled)
          <StaffButton
            title="Logout"
            icon={<Feather name="log-out" size={24} color="#848484" />}
            onPress={handleLogout}
            isActive={false}
          />
        )}

        {/* Row Bottom: Refresh | Exit Program - Always active */}
        <View className="flex-row gap-2">
          <TouchableOpacity
            onPress={() => Alert.alert("Refresh", "Data refreshed")}
            className="flex-1 rounded-lg py-3 justify-center items-center flex-row gap-1"
            style={{ backgroundColor: "#EC1A52" }}
          >
            <Ionicons name="refresh" size={18} color="#FFFFFF" />
            <Text className="text-white font-semibold" style={{ fontSize: 14 }}>Refresh</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => Alert.alert("Exit", "This would exit the POS application")}
            className="flex-1 rounded-lg py-3 justify-center items-center flex-row gap-1"
            style={{ backgroundColor: "#E43A00" }}
          >
            <Ionicons name="close-circle-outline" size={18} color="#FFFFFF" />
            <Text className="text-white font-semibold" style={{ fontSize: 14 }}>Exit</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}
