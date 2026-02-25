import { iconSize } from '@/utils/theme';
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { Alert, ScrollView, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "../contexts/AuthContext";
import { useBulkEditContext } from "../contexts/BulkEditContext";
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
  const { pathname, navigateTo, router } = useAppNavigation();
  const insets = useSafeAreaInsets();
  const { logout } = useAuth();
  const { isClockedIn } = useClock();
  const { isStaffMode, setViewMode } = useViewMode();
  const { config: bulkEditConfig, selectedCount, selectedRows, triggerBulkEdit } = useBulkEditContext();

  const handleChangeUser = () => {
    setViewMode(isStaffMode ? "admin" : "staff");
    // Navigate back to homepage after switching user
    navigateTo("/");
  };

  const handleExitProgram = () => {
    Alert.alert("Exit Program", "Are you sure you want to logout?", [
      { text: "Cancel", style: "cancel" },
      { text: "Exit", style: "destructive", onPress: () => logout() },
    ]);
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
        icon: <MaterialCommunityIcons name="arrow-left-box" size={iconSize['2xl']} />,
        variant: "secondary",
        onPress: undefined,
        disabled: true,
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
        onPress: () =>
          router.replace({
            pathname: "/sale/customers",
            params: { openAddCustomer: String(Date.now()) },
          }),
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
        onPress: () =>
          router.replace({
            pathname: "/inventory/stocks",
            params: { openAddProduct: String(Date.now()) },
          }),
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
    } else if (pathname.includes("/settings")) {
      return {
        title: "Button 1",
        icon: <Ionicons name="add-circle-outline" size={iconSize['2xl']} />,
        variant: "secondary",
        onPress: undefined,
        disabled: true,
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
          disabled={dynamicBtn.disabled}
          onPress={dynamicBtn.onPress}
        />

        {/* Page-specific buttons: Inventory, Customers, or default (Print/View Invoice) */}
        {pathname.includes("/inventory") ? (
          <>
            <SidebarButton
              title="Add Product"
              icon={<Ionicons name="add-circle-outline" size={iconSize['2xl']} />}
              variant="yellow"
              onPress={() =>
                router.replace({
                  pathname: "/inventory/stocks",
                  params: { openAddProduct: String(Date.now()) },
                })
              }
            />
            <SidebarButton
              title="Stock Alerts"
              icon={<Ionicons name="alert-circle-outline" size={iconSize['2xl']} />}
              variant="danger"
              onPress={() => navigateTo("/inventory/stock-alerts")}
            />
          </>
        ) : pathname.includes("/sale/customers") ? (
          <>
            <SidebarButton
              title="View Customer Details"
              icon={<Ionicons name="person-outline" size={iconSize['2xl']} />}
              variant={bulkEditConfig?.viewSingleItem && selectedCount === 1 ? "yellow" : "secondary"}
              disabled={!bulkEditConfig?.viewSingleItem || selectedCount !== 1}
              onPress={
                bulkEditConfig?.viewSingleItem && selectedCount === 1 && selectedRows[0]
                  ? () => bulkEditConfig.viewSingleItem!(selectedRows[0])
                  : undefined
              }
            />
            <SidebarButton
              title="Add Customer Payment"
              icon={<Ionicons name="card-outline" size={iconSize['2xl']} />}
              variant="outline"
              onPress={() => Alert.alert("Add Customer Payment", "Feature coming soon")}
            />
          </>
        ) : pathname.includes("/settings") ? (
          <>
            <SidebarButton
              title="Button 2"
              icon={<MaterialCommunityIcons name="printer" size={iconSize['2xl']} />}
              variant="secondary"
              disabled={true}
            />
            <SidebarButton
              title="Button 3"
              icon={<MaterialCommunityIcons name="text-box-check-outline" size={iconSize['2xl']} />}
              variant="secondary"
              disabled={true}
            />
          </>
        ) : (
          <>
            <SidebarButton
              title="Print Invoice"
              icon={<MaterialCommunityIcons name="printer" size={iconSize['2xl']} />}
              variant="secondary"
              disabled={true}
            />
            <SidebarButton
              title="View Invoice"
              icon={<MaterialCommunityIcons name="text-box-check-outline" size={iconSize['2xl']} />}
              variant={bulkEditConfig?.viewSingleItem && selectedCount === 1 ? "yellow" : "secondary"}
              disabled={!bulkEditConfig?.viewSingleItem || selectedCount !== 1}
              onPress={
                bulkEditConfig?.viewSingleItem && selectedCount === 1 && selectedRows[0]
                  ? () => bulkEditConfig.viewSingleItem!(selectedRows[0])
                  : undefined
              }
            />
          </>
        )}

        {/* Edit / Bulk Edit - 融合侧边栏与表格批量操作：无选择时灰色禁用，已选时红色可点击 */}
        <SidebarButton
          title={bulkEditConfig ? (selectedCount > 0 ? `${bulkEditConfig.label} (${selectedCount})` : bulkEditConfig.label) : "Edit"}
          icon={<MaterialCommunityIcons name="square-edit-outline" size={iconSize['2xl']} />}
          variant={bulkEditConfig && selectedCount > 0 ? "danger" : "secondary"}
          disabled={!bulkEditConfig || selectedCount === 0}
          onPress={bulkEditConfig && selectedCount > 0 ? triggerBulkEdit : undefined}
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
          onPress={handleExitProgram}
        />
      </ScrollView>
    </View>
  );
}
