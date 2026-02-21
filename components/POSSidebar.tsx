import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { ScrollView, View } from "react-native";
import { useRenderTrace } from "../utils/debug/useRenderTrace";
import { BrandingSection } from "./BrandingSection";
import { SidebarButton } from "./SidebarButton";

// POS Sidebar width
export const POS_SIDEBAR_WIDTH = 440;

interface POSSidebarProps {
  isLandscape: boolean;
  onAddProduct?: () => void;
  onCashPayment?: () => void;
  onCardPayment?: () => void;
  onDeleteProduct?: () => void;
  onEmptyCart?: () => void;
  onPayLater?: () => void;
  onGoToMenu?: () => void;
  onPaymentMethod1?: () => void;
  onPaymentMethod2?: () => void;
  onPaymentMethod3?: () => void;
  /** Hide checkout buttons when in order flow */
  hideNavButtons?: boolean;
}

/**
 * POSSidebar - Matches the buttons in the reference image
 */
function POSSidebarComponent({
  isLandscape,
  onAddProduct,
  onCashPayment,
  onDeleteProduct,
  onEmptyCart,
  onPayLater,
  onGoToMenu,
  onPaymentMethod1,
  onPaymentMethod3,
  hideNavButtons = false,
}: POSSidebarProps & { onPaymentMethod1?: () => void; onPaymentMethod3?: () => void }) {
  useRenderTrace("POSSidebar", {
    isLandscape,
    hideNavButtons,
    onAddProduct,
    onCashPayment,
    onDeleteProduct,
    onEmptyCart,
    onPayLater,
    onGoToMenu,
    onPaymentMethod1,
    onPaymentMethod3,
  });

  return (
    <View
      className="bg-[#F7F7F9]"
      style={{
        width: isLandscape ? POS_SIDEBAR_WIDTH : "100%",
      }}
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ gap: 12, padding: 16 }}
      >
        {/* Branding Section */}
        <View className="mb-2">
           <BrandingSection />
        </View>

        {/* Column 1: Add New Product (Full Width Primary) */}
        <SidebarButton
          title="Add New Product"
          variant="primary"
          onPress={onAddProduct}
        />

        {/* Row: Cash Payment | (Something else) */}
        <View className="flex-row gap-3">
          <SidebarButton
            title="Cash Payment"
            variant="outline"
            fullWidth={false}
            onPress={onCashPayment}
          />
          <SidebarButton
            title="Card Payment"
            variant="outline"
            fullWidth={false}
          />
        </View>

        {/* Row: Payment Method 1 | Payment Method 2? (Actually image shows Method 1 and Method 3?) */}
        <View className="flex-row gap-3">
          <SidebarButton
            title="Payment Method 1"
            variant="outline"
            fullWidth={false}
            onPress={onPaymentMethod1}
          />
          <SidebarButton
            title="Payment Method 2"
            variant="outline"
            fullWidth={false}
          />
        </View>

        <View className="flex-row gap-3">
          <SidebarButton
            title="Payment Method 3"
            variant="outline"
            fullWidth={false}
            onPress={onPaymentMethod3}
          />
          <SidebarButton
            title="Payment Method 4"
            variant="outline"
            fullWidth={false}
          />
        </View>

        {/* Row: Pay Later | (Something else) */}
        <View className="flex-row gap-3">
          <SidebarButton
            title="Pay Later"
            variant="outline"
            fullWidth={false}
            onPress={onPayLater}
          />
          <SidebarButton
            title="Add Misc Item"
            variant="outline"
            fullWidth={false}
          />
        </View>

        {/* Row: Delete Product (Solid Orange/Brown) */}
        <SidebarButton
          title="Delete Product"
          variant="danger" // We can keep danger or adjust color
          onPress={onDeleteProduct}
        />

        {/* Row: Go to Menu | Empty Cart */}
        <View className="flex-row gap-3">
          <SidebarButton
            title="Go to Menu"
            variant="outline"
            icon={<Ionicons name="apps-outline" size={24} color="#EC1A52" />}
            fullWidth={false}
            onPress={onGoToMenu}
          />
          <SidebarButton
            title="Empty Cart"
            variant="outline"
            icon={<Ionicons name="trash-outline" size={24} color="#EC1A52" />}
            fullWidth={false}
            onPress={onEmptyCart}
          />
        </View>
      </ScrollView>
    </View>
  );
}

export const POSSidebar = React.memo(POSSidebarComponent);
POSSidebar.displayName = "POSSidebar";
