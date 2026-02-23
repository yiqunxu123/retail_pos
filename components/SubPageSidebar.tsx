import { Ionicons, MaterialCommunityIcons, MaterialIcons } from "@expo/vector-icons";
import { Alert, ScrollView, View } from "react-native";
import { iconSize } from '@/utils/theme';
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useClock } from "../contexts/ClockContext";
import { useViewMode } from "../contexts/ViewModeContext";
import { useAppNavigation } from "../hooks/useAppNavigation";
import { BrandingSection } from "./BrandingSection";
import { SidebarButton } from "./SidebarButton";

export const SUB_PAGE_SIDEBAR_WIDTH = 440;

interface SubPageSidebarProps {
  isLandscape: boolean;
  onClockInPress: () => void;
  onClockInLongPress?: () => void;
  onClockOutPress: () => void;
}

/**
 * SubPageSidebar - Intelligent sidebar for sub-pages.
 * Automatically adapts the main action button based on the current page.
 */
export function SubPageSidebar({
  isLandscape,
  onClockInPress,
  onClockInLongPress,
  onClockOutPress,
}: SubPageSidebarProps) {
  const { pathname, navigateTo } = useAppNavigation();
  const insets = useSafeAreaInsets();
  const { isClockedIn } = useClock();
  const { isStaffMode, setViewMode } = useViewMode();

  const handleChangeUser = () => {
    setViewMode(isStaffMode ? "admin" : "staff");
    // Navigate back to homepage after switching user
    navigateTo("/");
  };

  // Dynamic button logic based on current page
  const getDynamicButton = () => {
    if (pathname.includes("/sale/parked-orders")) {
      return {
        title: "Resume Order",
        icon: <MaterialCommunityIcons name="play-speed" size={iconSize['2xl']} />,
        variant: "purple",
        onPress: () => Alert.alert("Resume Order", "Select an order from the list to resume"),
      };
    } else if (pathname.includes("/sale/sales-return")) {
      return {
        title: "Create Sale Return",
        icon: <MaterialIcons name="assignment-return" size={iconSize['2xl']} />,
        variant: "primary",
        onPress: () => Alert.alert("Create Sale Return", "Feature coming soon"),
      };
    } else if (pathname.includes("/sale/sales-history")) {
      return {
        title: "Add Order",
        icon: <Ionicons name="add-circle-outline" size={iconSize['2xl']} />,
        variant: "primary",
        onPress: () => navigateTo("/order/add-products"),
      };
    } else if (pathname.includes("/sale/customers")) {
      return {
        title: "Add Customer",
        icon: <Ionicons name="person-add-outline" size={iconSize['2xl']} />,
        variant: "primary",
        onPress: () => Alert.alert("Add Customer", "Feature coming soon"),
      };
    } else if (pathname.includes("/sale/reports")) {
      return {
        title: "View Reports",
        icon: <Ionicons name="bar-chart-outline" size={iconSize['2xl']} />,
        variant: "primary",
        onPress: () => {},
      };
    } else if (pathname.includes("/inventory")) {
      const isAlerts = pathname.includes("/stock-alerts");
      return {
        title: isAlerts ? "Stocks" : "Stock Alerts",
        icon: isAlerts ? (
          <MaterialCommunityIcons name="package-variant-closed" size={iconSize['2xl']} />
        ) : (
          <Ionicons name="alert-circle-outline" size={iconSize['2xl']} />
        ),
        variant: "primary",
        onPress: () => navigateTo(isAlerts ? "/inventory/stocks" : "/inventory/stock-alerts"),
      };
    } else if (pathname.includes("/catalog")) {
      return {
        title: "Add Product",
        icon: <Ionicons name="add-circle-outline" size={iconSize['2xl']} />,
        variant: "primary",
        onPress: () => navigateTo("/catalog/add-product"),
      };
    } else if (pathname.includes("/sale/fulfillments")) {
      return {
        title: "Fulfillments",
        icon: <MaterialCommunityIcons name="truck-delivery-outline" size={iconSize['2xl']} />,
        variant: "primary",
        onPress: () => {},
      };
    } else if (pathname.includes("/sale/payments-history")) {
      return {
        title: "Payments",
        icon: <Ionicons name="card-outline" size={iconSize['2xl']} />,
        variant: "primary",
        onPress: () => {},
      };
    }

    // Default: no special dynamic button, show "Add Order"
    return {
      title: "Add Order",
      icon: <Ionicons name="add-circle-outline" size={iconSize['2xl']} />,
      variant: "primary",
      onPress: () => navigateTo("/order/add-products"),
    };
  };

  const dynamicBtn = getDynamicButton();

  return (
    <View
      className={`bg-[#F7F7F9] ${isLandscape ? "h-full" : "flex-1"}`}
      style={{ width: isLandscape ? SUB_PAGE_SIDEBAR_WIDTH : "100%" }}
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
        {/* Branding + Intelligent "Go to Menu" (Three-line icon inside BrandingSection) */}
        <BrandingSection showGoBack={true} />

        {/* Row 1: Time Clock | Change User */}
        <View className="flex-row gap-3">
          {isClockedIn ? (
            <SidebarButton
              title="Time Clock"
              icon={<Ionicons name="time-outline" size={iconSize['2xl']} />}
              variant="secondary"
              onPress={onClockInPress}
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

        {/* Dynamic Action Button (Changes based on page: Resume Order, Add Customer, etc.) */}
        <SidebarButton
          title={dynamicBtn.title}
          icon={dynamicBtn.icon}
          variant={dynamicBtn.variant as any}
          onPress={dynamicBtn.onPress}
        />

        {/* Print Invoice */}
        <SidebarButton
          title="Print Invoice"
          icon={<MaterialCommunityIcons name="printer" size={iconSize['2xl']} />}
          variant="yellow"
          onPress={() => Alert.alert("Print Invoice", "Feature coming soon")}
        />

        {/* View Invoice */}
        <SidebarButton
          title="View Invoice"
          icon={<MaterialCommunityIcons name="text-box-check-outline" size={iconSize['2xl']} />}
          variant="outline"
          onPress={() => Alert.alert("View Invoice", "Feature coming soon")}
        />

        {/* Edit Order */}
        <SidebarButton
          title="Edit Order"
          icon={<MaterialCommunityIcons name="square-edit-outline" size={iconSize['2xl']} />}
          variant="secondary"
          onPress={() => Alert.alert("Edit Order", "Feature coming soon")}
        />

        {/* Clock out */}
        <SidebarButton
          title="Clock out"
          icon={<MaterialCommunityIcons name="logout" size={iconSize['2xl']} />}
          variant="outline"
          onPress={onClockOutPress}
        />

        {/* Exit Program */}
        <SidebarButton
          title="Exit Program"
          icon={<Ionicons name="close-circle-outline" size={iconSize['2xl']} />}
          variant="danger"
          onPress={() => Alert.alert("Exit", "This would exit the POS application")}
        />
      </ScrollView>
    </View>
  );
}
