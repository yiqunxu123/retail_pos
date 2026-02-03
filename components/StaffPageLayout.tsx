import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Alert, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { useAuth } from "../contexts/AuthContext";
import { useClock } from "../contexts/ClockContext";

const SIDEBAR_WIDTH = 280;

interface StaffPageLayoutProps {
  children: React.ReactNode;
  sidebarCustomButtons?: React.ReactNode;
  title?: string;
  subTitle?: string;
}

/**
 * Sidebar Button Component
 */
export function SidebarButton({
  title,
  icon,
  onPress,
  bgColor = "#FFFFFF",
  textColor = "#1A1A1A",
  borderColor = "#E5E7EB",
  isFullWidth = true,
}: {
  title: string;
  icon?: React.ReactNode;
  onPress: () => void;
  bgColor?: string;
  textColor?: string;
  borderColor?: string;
  isFullWidth?: boolean;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      className={`${isFullWidth ? "w-full" : "flex-1"} rounded-lg justify-center items-center py-3 px-2 mb-2`}
      style={{
        backgroundColor: bgColor,
        borderWidth: 1,
        borderColor: borderColor,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
      }}
    >
      {icon && <View className="mb-1">{icon}</View>}
      <Text className="text-center font-medium" style={{ color: textColor, fontSize: 13 }}>
        {title}
      </Text>
    </TouchableOpacity>
  );
}

export default function StaffPageLayout({ children, sidebarCustomButtons, title, subTitle }: StaffPageLayoutProps) {
  const router = useRouter();
  const { logout } = useAuth();
  const { isClockedIn, clockIn, clockOut } = useClock();

  // Handle Time Clock logic
  const handleTimeClock = () => {
    // If using the real ClockContext, toggle clock in/out or show modal
    // For now, simulating the button press
    if (isClockedIn) {
      // Logic for already clocked in
    } else {
      // Logic for clocking in
    }
    // In real implementation, this would trigger the modal
  };

  const handleClockOut = () => {
    Alert.alert(
      "Clock Out",
      "Are you sure you want to clock out?",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Clock Out", style: "destructive", onPress: () => clockOut() }
      ]
    );
  };

  const handleGoToMenu = () => {
    router.push("/");
  };

  const handleExit = () => {
    Alert.alert("Exit", "This would exit the POS application");
  };

  return (
    <View className="flex-1 flex-row bg-white">
      {/* Main Content Area (Left) */}
      <View className="flex-1 flex-col">
        {/* Optional Header if title is provided */}
        {(title || subTitle) && (
          <View className="px-6 py-4 border-b border-gray-200">
             {title && (
                <View className="flex-row items-center mb-1">
                  <TouchableOpacity onPress={() => router.back()} className="mr-3 p-1">
                    <Ionicons name="arrow-back" size={24} color="#1A1A1A" />
                  </TouchableOpacity>
                  <Text className="text-2xl font-bold text-gray-900">{title}</Text>
                </View>
             )}
             {subTitle && <Text className="text-gray-500 text-sm ml-9">{subTitle}</Text>}
          </View>
        )}
        
        <View className="flex-1">
          {children}
        </View>
      </View>

      {/* Right Sidebar */}
      <View 
        className="bg-gray-50 border-l border-gray-200 p-2 flex-col" 
        style={{ width: SIDEBAR_WIDTH }}
      >
        {/* Branding Section */}
        <View
          className="rounded-lg py-2 px-3 items-center justify-center mb-4"
          style={{
            backgroundColor: "#D9D9D9",
            borderWidth: 1,
            borderColor: "#1A1A1A",
            borderStyle: "dashed",
            height: 60
          }}
        >
          <Text style={{ fontSize: 12, color: "#1A1A1A", fontWeight: "500" }}>Branding Section</Text>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
          {/* Top Fixed Buttons: Time Clock | Change User */}
          <View className="flex-row gap-2 mb-2">
            <SidebarButton 
              title="Time Clock" 
              icon={<Ionicons name="time-outline" size={20} color="#1A1A1A" />}
              onPress={handleTimeClock}
              isFullWidth={false}
            />
            <SidebarButton 
              title="Change User" 
              icon={<MaterialCommunityIcons name="account-switch-outline" size={20} color="#EC1A52" />}
              onPress={() => Alert.alert("Change User", "Functionality implementation pending")}
              isFullWidth={false}
              textColor="#EC1A52"
              borderColor="#EC1A52"
            />
          </View>

          {/* Page Specific Buttons (Injected) */}
          <View>
            {sidebarCustomButtons}
          </View>

          {/* Common Bottom Buttons */}
          <SidebarButton 
            title="Go to Menu"
            icon={<Ionicons name="menu-outline" size={20} color="#EC1A52" />}
            onPress={handleGoToMenu}
            textColor="#EC1A52"
            borderColor="#EC1A52"
          />

          <SidebarButton 
            title="Clock out"
            icon={<Ionicons name="log-out-outline" size={20} color="#EC1A52" />}
            onPress={handleClockOut}
            textColor="#EC1A52"
            borderColor="#EC1A52"
          />

          <SidebarButton 
            title="Exit Program"
            icon={<Ionicons name="close-circle-outline" size={20} color="#FFFFFF" />}
            onPress={handleExit}
            bgColor="#E43A00"
            textColor="#FFFFFF"
            borderColor="#E43A00"
          />
          
        </ScrollView>
      </View>
    </View>
  );
}
