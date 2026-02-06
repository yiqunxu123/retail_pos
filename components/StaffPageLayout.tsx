import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { Alert, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { useAuth } from "../contexts/AuthContext";
import { useClock } from "../contexts/ClockContext";
import { useAppNavigation } from "../hooks/useAppNavigation";
import { BrandingSection } from "./BrandingSection";
import { SidebarButton } from "./SidebarButton";

// Re-export SidebarButton for backward compatibility
export { SidebarButton };

const SIDEBAR_WIDTH = 260;

interface StaffPageLayoutProps {
  children: React.ReactNode;
  sidebarCustomButtons?: React.ReactNode;
  title?: string;
  subTitle?: string;
}

export default function StaffPageLayout({ children, sidebarCustomButtons, title, subTitle }: StaffPageLayoutProps) {
  const { navigateTo, router } = useAppNavigation();
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
    navigateTo("/");
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
        <View className="mb-2">
          <BrandingSection />
        </View>

        {/* Go to Menu - Top position below branding */}
        <View className="mb-3">
          <SidebarButton 
            title="Go to Menu"
            icon={<Ionicons name="menu-outline" size={20} color="#EC1A52" />}
            onPress={handleGoToMenu}
          />
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20, gap: 8 }}>
          {/* Top Fixed Buttons: Time Clock | Change User */}
          <View className="flex-row gap-2">
            <SidebarButton 
              title="Time Clock" 
              icon={<Ionicons name="time-outline" size={20} color="#EC1A52" />}
              onPress={handleTimeClock}
              fullWidth={false}
            />
            <SidebarButton 
              title="Change User" 
              icon={<MaterialCommunityIcons name="account-switch-outline" size={20} color="#848484" />}
              onPress={() => Alert.alert("Change User", "Functionality implementation pending")}
              fullWidth={false}
              isActive={false}
            />
          </View>

          {/* Page Specific Buttons (Injected) */}
          {sidebarCustomButtons && (
            <View style={{ gap: 8 }}>
              {sidebarCustomButtons}
            </View>
          )}

          {/* Common Bottom Buttons */}
          <SidebarButton 
            title="Clock out"
            icon={<Ionicons name="log-out-outline" size={20} color="#EC1A52" />}
            onPress={handleClockOut}
          />

          <SidebarButton 
            title="Exit Program"
            icon={<Ionicons name="close-circle-outline" size={20} color="#EC1A52" />}
            onPress={handleExit}
          />
        </ScrollView>
      </View>
    </View>
  );
}
