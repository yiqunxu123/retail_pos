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
  onOpenDrawer?: () => void;
  onAddTax?: () => void;
  onAddDiscount?: () => void;
  onVoidPayment?: () => void;
  onAddNotes?: () => void;
  onParkOrder?: () => void;
  onCheckout?: () => void;
  /** Hide checkout buttons when in order flow */
  hideNavButtons?: boolean;
}

/**
 * POSSidebar - POS action buttons
 */
function POSSidebarComponent({
  isLandscape,
  onAddProduct,
  onCashPayment,
  onCardPayment,
  onDeleteProduct,
  onEmptyCart,
  onPayLater,
  onGoToMenu,
  onAddTax,
  onAddDiscount,
  onVoidPayment,
  onAddNotes,
  onParkOrder,
  hideNavButtons = false,
}: POSSidebarProps) {
  useRenderTrace("POSSidebar", {
    isLandscape,
    hideNavButtons,
    onAddProduct,
    onCashPayment,
    onCardPayment,
    onDeleteProduct,
    onEmptyCart,
    onPayLater,
    onGoToMenu,
    onAddTax,
    onAddDiscount,
    onVoidPayment,
    onAddNotes,
    onParkOrder,
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

        {/* Add New Product (Full Width Primary) */}
        <SidebarButton
          title="Add New Product"
          variant="primary"
          onPress={onAddProduct}
        />

        {/* Row: Cash Payment | Card Payment */}
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
            onPress={onCardPayment}
          />
        </View>

        {/* Row: Park Order | Add Tax */}
        <View className="flex-row gap-3">
          <SidebarButton
            title="Park Order"
            variant="outline"
            icon={<Ionicons name="pause-circle-outline" size={24} color="#EC1A52" />}
            fullWidth={false}
            onPress={onParkOrder}
          />
          <SidebarButton
            title="Add Tax"
            variant="outline"
            icon={<Ionicons name="calculator-outline" size={24} color="#EC1A52" />}
            fullWidth={false}
            onPress={onAddTax}
          />
        </View>

        {/* Row: Add Discount | Void Payment */}
        <View className="flex-row gap-3">
          <SidebarButton
            title="Add Discount"
            variant="outline"
            icon={<Ionicons name="pricetag-outline" size={24} color="#EC1A52" />}
            fullWidth={false}
            onPress={onAddDiscount}
          />
          <SidebarButton
            title="Void Payment"
            variant="outline"
            icon={<Ionicons name="close-circle-outline" size={24} color="#EC1A52" />}
            fullWidth={false}
            onPress={onVoidPayment}
          />
        </View>

        {/* Row: Add Notes | Pay Later */}
        <View className="flex-row gap-3">
          <SidebarButton
            title="Add Notes"
            variant="outline"
            icon={<Ionicons name="document-text-outline" size={24} color="#EC1A52" />}
            fullWidth={false}
            onPress={onAddNotes}
          />
          <SidebarButton
            title="Pay Later"
            variant="outline"
            icon={<Ionicons name="time-outline" size={24} color="#EC1A52" />}
            fullWidth={false}
            onPress={onPayLater}
          />
        </View>

        {/* Delete Product (Solid Orange/Brown) */}
        <SidebarButton
          title="Delete Product"
          variant="danger"
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
