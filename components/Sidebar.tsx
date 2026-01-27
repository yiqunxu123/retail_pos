import { Ionicons } from "@expo/vector-icons";
import { usePathname, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Alert, ScrollView, Text, View } from "react-native";
import { useAuth } from "../contexts/AuthContext";
import { useClock } from "../contexts/ClockContext";
import { SidebarButton } from "./SidebarButton";

// ============================================================================
// Constants
// ============================================================================

/** Sidebar width constant - exported for use in layout calculations */
export const SIDEBAR_WIDTH = 220;

// ============================================================================
// Types
// ============================================================================

type SectionType = "dashboard" | "catalog" | "inventory" | "sale" | "report";

interface MenuItem {
  label: string;
  icon: string;
  route: string;
}

interface SectionConfig {
  title: string;
  items: MenuItem[];
}

interface SidebarProps {
  isLandscape: boolean;
  onClockInPress: () => void;
  onClockOutPress: () => void;
  onExitProgram?: () => void;
}

// ============================================================================
// Section Menu Configurations
// ============================================================================

const SECTION_MENUS: Record<SectionType, SectionConfig> = {
  dashboard: {
    title: "Dashboard",
    items: [],
  },
  catalog: {
    title: "Product Catalog",
    items: [
      { label: "Products", icon: "cube-outline", route: "/catalog/products" },
    ],
  },
  inventory: {
    title: "Inventory",
    items: [
      { label: "Stock", icon: "layers-outline", route: "/inventory/stocks" },
      { label: "Stock Alerts", icon: "alert-circle-outline", route: "/inventory/stock-alerts" },
    ],
  },
  sale: {
    title: "Sales",
    items: [
      { label: "Customers", icon: "people-outline", route: "/sale/customers" },
      { label: "Customer Groups", icon: "people-circle-outline", route: "/sale/customer-groups" },
      { label: "Add Quick Order", icon: "add-circle-outline", route: "/sale/add-quick-order" },
      { label: "Fulfillment", icon: "checkmark-done-outline", route: "/sale/fulfillments" },
      { label: "Sales History", icon: "receipt-outline", route: "/sale/sales-history" },
      { label: "Sales Return", icon: "return-down-back-outline", route: "/sale/sales-return" },
      { label: "Payment History", icon: "card-outline", route: "/sale/payments-history" },
    ],
  },
  report: {
    title: "Report",
    items: [
      { label: "Business Reporting", icon: "bar-chart-outline", route: "/report" },
      { label: "Brand Velocity Report", icon: "analytics-outline", route: "/report/brand-velocity" },
      { label: "Print", icon: "print-outline", route: "/report/print" },
    ],
  },
};

// ============================================================================
// Helper Functions
// ============================================================================

/** Determines the current section based on the pathname */
function getSectionFromPath(pathname: string): SectionType {
  if (pathname.startsWith("/catalog")) return "catalog";
  if (pathname.startsWith("/inventory")) return "inventory";
  if (pathname.startsWith("/sale")) return "sale";
  if (pathname.startsWith("/report")) return "report";
  return "dashboard";
}

// ============================================================================
// Sub-components
// ============================================================================

/** Displays clock status when user is clocked in */
function ClockStatusCard({
  clockInTime,
  elapsedTime,
}: {
  clockInTime: string;
  elapsedTime: string;
}) {
  return (
    <View className="bg-purple-100 rounded-lg p-3 gap-2">
      <View className="flex-row justify-between">
        <View className="flex-1">
          <Text className="text-purple-600 text-xs font-medium">Clock In Time:</Text>
          <Text className="text-purple-800 text-sm font-bold">{clockInTime}</Text>
        </View>
        <View className="flex-1 items-end">
          <Text className="text-purple-600 text-xs font-medium">Clock In Duration:</Text>
          <Text className="text-purple-800 text-sm font-bold">{elapsedTime}</Text>
        </View>
      </View>
    </View>
  );
}

/** Branding placeholder section */
function BrandingSection({ isLandscape }: { isLandscape: boolean }) {
  return (
    <View className={`${!isLandscape ? "w-full" : ""}`}>
      <View className="bg-gray-200 rounded-lg p-4 items-center mb-2">
        <Text className="text-gray-600 text-sm font-medium">Branding</Text>
        <Text className="text-gray-600 text-sm font-medium">Section</Text>
      </View>
    </View>
  );
}

/** User info display */
function UserInfoCard({ userName }: { userName: string }) {
  return (
    <View className="bg-gray-100 rounded-lg p-3 mb-2">
      <Text className="text-gray-600 text-xs">Logged in as</Text>
      <Text className="text-gray-800 font-medium">{userName}</Text>
    </View>
  );
}

// ============================================================================
// Main Component
// ============================================================================

/**
 * Sidebar - Global navigation sidebar
 * Shows context-aware submenus based on current section
 */
export function Sidebar({
  isLandscape,
  onClockInPress,
  onClockOutPress,
}: SidebarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { logout, user } = useAuth();
  const { isClockedIn, getClockInTimeString, getElapsedTime } = useClock();
  const [elapsedTime, setElapsedTime] = useState("00:00:00");

  // Derive current section state
  const currentSection = getSectionFromPath(pathname);
  const isInSubsection = currentSection !== "dashboard";
  const sectionConfig = SECTION_MENUS[currentSection];

  // Navigation handler
  const navigateTo = (path: string) => {
    router.push(path as any);
  };

  // Logout with confirmation
  const handleLogout = () => {
    Alert.alert(
      "Logout",
      "Are you sure you want to logout?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Confirm",
          style: "destructive",
          onPress: async () => {
            await logout();
          },
        },
      ]
    );
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

  // -------------------------------------------------------------------------
  // Render Functions
  // -------------------------------------------------------------------------

  /** Renders the subsection navigation menu */
  const renderSubsectionMenu = () => (
    <>
      {/* Section Title */}
      <View className="p-3 mb-2">
        <Text className="text-black font-bold text-center">{sectionConfig.title}</Text>
      </View>

      {/* Section Menu Items */}
      {sectionConfig.items.map((item, index) => {
        const isActive = pathname === item.route;
        const iconColor = isActive ? "#1d4ed8" : "#374151";

        return (
          <SidebarButton
            key={index}
            label={item.label}
            icon={<Ionicons name={item.icon as any} size={18} color={iconColor} />}
            onPress={() => navigateTo(item.route)}
            variant={isActive ? "active" : "default"}
          />
        );
      })}
    </>
  );

  /** Renders the main dashboard menu */
  const renderDashboardMenu = () => (
    <>
      {/* Clock In/Out Buttons */}
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

      {/* Clock Status (visible when clocked in) */}
      {isClockedIn && (
        <ClockStatusCard
          clockInTime={getClockInTimeString()}
          elapsedTime={elapsedTime}
        />
      )}

      {/* Quick Navigation Buttons */}
      <SidebarButton
        label="Sales History"
        icon={<Ionicons name="receipt-outline" size={18} color="#374151" />}
        onPress={() => navigateTo("/sale/sales-history")}
      />
      <SidebarButton
        label="View Reports"
        icon={<Ionicons name="bar-chart-outline" size={18} color="#374151" />}
        onPress={() => {}}
      />
      <SidebarButton
        label="View Customers"
        icon={<Ionicons name="people-outline" size={18} color="#374151" />}
        onPress={() => navigateTo("/sale/customers")}
      />
      <SidebarButton
        label="View Parked Orders"
        icon={<Ionicons name="pause-circle-outline" size={18} color="#374151" />}
        onPress={() => {}}
      />
      <SidebarButton
        label="Resume Last Parked"
        icon={<Ionicons name="play-circle-outline" size={18} color="#374151" />}
        onPress={() => {}}
      />
      <SidebarButton
        label="Time Clock"
        icon={<Ionicons name="time-outline" size={18} color="#374151" />}
        onPress={() => {}}
      />
    </>
  );

  /** Renders dashboard-only footer actions */
  const renderDashboardFooter = () => (
    <>
      {/* User Info */}
      {user && <UserInfoCard userName={user.name || user.username} />}

      {/* Action Buttons */}
      <SidebarButton
        label="Refresh"
        icon={<Ionicons name="refresh" size={18} color="#374151" />}
        variant="warning"
        fullWidth={false}
      />
      <SidebarButton
        label="Logout"
        icon={<Ionicons name="log-out-outline" size={18} color="white" />}
        variant="danger"
        onPress={handleLogout}
      />
    </>
  );

  // -------------------------------------------------------------------------
  // Main Render
  // -------------------------------------------------------------------------

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
        <BrandingSection isLandscape={isLandscape} />

        {/* Context-aware menu rendering */}
        {isInSubsection ? renderSubsectionMenu() : renderDashboardMenu()}

        {/* Dashboard-only footer */}
        {!isInSubsection && renderDashboardFooter()}
      </ScrollView>
    </View>
  );
}
