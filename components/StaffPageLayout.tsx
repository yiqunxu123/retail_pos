import { colors, iconSize } from "@/utils/theme";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { Alert, ScrollView, View } from "react-native";
import { useAuth } from "../contexts/AuthContext";
import { useClock } from "../contexts/ClockContext";
import { useViewMode } from "../contexts/ViewModeContext";
import { useAppNavigation } from "../hooks/useAppNavigation";
import { BrandingSection } from "./BrandingSection";
import { PageHeader } from "./PageHeader";
import { SidebarButton } from "./SidebarButton";

// Re-export SidebarButton for backward compatibility
export { SidebarButton };

const SIDEBAR_WIDTH = 440;

interface StaffPageLayoutProps {
  children: React.ReactNode;
  sidebarCustomButtons?: React.ReactNode;
  title?: string;
  subTitle?: string;
  showBack?: boolean;
}

export default function StaffPageLayout({ children, sidebarCustomButtons, title, subTitle, showBack = false }: StaffPageLayoutProps) {
  const { navigateTo } = useAppNavigation();
  const { logout } = useAuth();
  const { isClockedIn, clockOut } = useClock();
  const { isStaffMode, setViewMode } = useViewMode();

  // Handle Change User - switch mode and navigate to homepage
  const handleChangeUser = () => {
    setViewMode(isStaffMode ? "admin" : "staff");
    navigateTo("/");
  };

  // Handle Time Clock logic
  const handleTimeClock = () => {
    // If using the real ClockContext, toggle clock in/out or show modal
    if (isClockedIn) {
      // Logic for already clocked in
    } else {
      // Logic for clocking in
    }
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

  const handleExitProgram = () => {
    Alert.alert("Exit Program", "Are you sure you want to logout?", [
      { text: "Cancel", style: "cancel" },
      { text: "Exit", style: "destructive", onPress: () => logout() },
    ]);
  };

  return (
    <View className="flex-1 flex-row" style={{ backgroundColor: colors.backgroundTertiary }}>
      {/* Main Content Area (Left) */}
      <View className="flex-1 flex-col">
        {/* Optional Header if title is provided */}
        {(title || subTitle) && (
          <PageHeader title={title || ""} subtitle={subTitle} showBack={showBack} />
        )}
        
        <View className="flex-1">
          {children}
        </View>
      </View>

      {/* Right Sidebar */}
      <View 
        className="flex-col" 
        style={{ width: SIDEBAR_WIDTH, backgroundColor: colors.backgroundTertiary }}
      >
        {/* Branding Section */}
        <View className="px-2">
          <BrandingSection />
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 8, paddingBottom: 20, gap: 8 }}>
          {/* Top Fixed Buttons: Time Clock | Change User */}
          <View className="flex-row gap-2">
            <SidebarButton 
              title="Time Clock" 
              icon={<Ionicons name="time-outline" size={iconSize['2xl']} color={colors.primary} />}
              onPress={handleTimeClock}
              fullWidth={false}
            />
            <SidebarButton 
              title="Change User" 
              icon={<MaterialCommunityIcons name="account-switch-outline" size={iconSize['2xl']} color="#848484" />}
              onPress={handleChangeUser}
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
            icon={<Ionicons name="log-out-outline" size={iconSize['2xl']} color={colors.primary} />}
            onPress={handleClockOut}
          />

          <SidebarButton 
            title="Exit Program"
            icon={<Ionicons name="close-circle-outline" size={iconSize['2xl']} color={colors.primary} />}
            onPress={handleExitProgram}
          />
        </ScrollView>
      </View>
    </View>
  );
}
