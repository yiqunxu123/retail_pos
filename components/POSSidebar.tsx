import { Ionicons } from "@expo/vector-icons";
import { ScrollView, View } from "react-native";
import { BrandingSection } from "./BrandingSection";
import { SidebarButton } from "./SidebarButton";

// POS Sidebar width - matches unified sidebar width
export const POS_SIDEBAR_WIDTH = 260;

interface POSSidebarProps {
  isLandscape: boolean;
  onAddProduct?: () => void;
  onCashPayment?: () => void;
  onCardPayment?: () => void;
  onDeleteProduct?: () => void;
  onVoidPayment?: () => void;
  onEmptyCart?: () => void;
  onParkOrder?: () => void;
  onGoToMenu?: () => void;
  onCheckout?: () => void;
  onAddDiscount?: () => void;
  onAddNotes?: () => void;
  onMiscItem?: () => void;
  onPrintReceipt?: () => void;
  /** Hide checkout and go to menu buttons when in order flow */
  hideNavButtons?: boolean;
}

/**
 * POSSidebar - Action sidebar for POS sales screen
 * Contains payment methods, product actions, and cart controls
 */
export function POSSidebar({
  isLandscape,
  onAddProduct,
  onCashPayment,
  onCardPayment,
  onDeleteProduct,
  onVoidPayment,
  onEmptyCart,
  onParkOrder,
  onGoToMenu,
  onCheckout,
  onAddDiscount,
  onAddNotes,
  onMiscItem,
  onPrintReceipt,
  hideNavButtons = false,
}: POSSidebarProps) {
  return (
    <View
      className={`
        bg-gray-50 p-2
        ${isLandscape ? "border-l border-gray-200" : "border-t border-gray-200"}
      `}
      style={{
        width: isLandscape ? POS_SIDEBAR_WIDTH : "100%",
      }}
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ gap: 8 }}
      >
        {/* Branding Section */}
        <BrandingSection />

        {
          !hideNavButtons && (
            <SidebarButton
              title="Go to Menu"
              icon={<Ionicons name="grid-outline" size={18} color="#EC1A52" />}
              onPress={onGoToMenu}
            />
          )
        }
        {/* TEST: Print Receipt Button - Prominent for testing */}
        <SidebarButton
          title="🖨 PRINT RECEIPT (TEST)"
          icon={<Ionicons name="print-outline" size={20} color="#EC1A52" />}
          onPress={onPrintReceipt}
        />

        {/* Add Product Row */}
        <View>
         
          <SidebarButton
            title="Add Misc Item"
            fullWidth={true}
            onPress={onMiscItem}
          />
        </View>

        {/* Payment Methods */}
        <View className="flex-row gap-2">
          <SidebarButton
            title="Cash Payment"
            fullWidth={false}
            onPress={onCashPayment}
          />
          <SidebarButton
            title="Card Payment"
            fullWidth={false}
            onPress={onCardPayment}
          />
        </View>

        <View className="flex-row gap-2">
          <SidebarButton
            title="Bank 1 Machine"
            fullWidth={false}
          />
          <SidebarButton
            title="Bank 2 Machine"
            fullWidth={false}
          />
        </View>

        <View className="flex-row gap-2">
          <SidebarButton
            title="Bank 3 Machine"
            fullWidth={false}
          />
          <SidebarButton
            title="Bank 4 Machine"
            fullWidth={false}
          />
        </View>

        {/* Online Transfer / Add Tax */}
        <View className="flex-row gap-2">
          <SidebarButton
            title="Online Transfer"
            fullWidth={false}
          />
          <SidebarButton
            title="⊕ Add Tax"
            fullWidth={false}
          />
        </View>

        {/* Delete / Void */}
        <View className="flex-row gap-2">
          <SidebarButton
            title="Delete Product"
            fullWidth={false}
            onPress={onDeleteProduct}
          />
          <SidebarButton
            title="Void Payment"
            fullWidth={false}
            onPress={onVoidPayment}
          />
        </View>

        {/* Add Notes / Add Discount */}
        <View className="flex-row gap-2">
          <SidebarButton
            title="Add Notes"
            fullWidth={false}
            onPress={onAddNotes}
          />
          <SidebarButton
            title="Add Discount"
            fullWidth={false}
            onPress={onAddDiscount}
          />
        </View>

        {/* Empty Cart / Park Order */}
        <View className="flex-row gap-2">
          <SidebarButton
            title="🗑 Empty Cart"
            fullWidth={false}
            onPress={onEmptyCart}
          />
          <SidebarButton
            title="⏱ Park Order"
            fullWidth={false}
            onPress={onParkOrder}
          />
        </View>

        {/* Checkout & Go to Menu - Hidden when in order flow */}
        {!hideNavButtons && (

            <SidebarButton
              title="Checkout"
              icon={<Ionicons name="cart-outline" size={18} color="#EC1A52" />}
              onPress={onCheckout}
            />

        )}
      </ScrollView>
    </View>
  );
}
