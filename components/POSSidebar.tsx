import { Ionicons } from "@expo/vector-icons";
import { ScrollView, Text, View } from "react-native";
import { SidebarButton } from "./SidebarButton";

// POS Sidebar width - slightly wider for action buttons
export const POS_SIDEBAR_WIDTH = 240;

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
        bg-gray-50 p-3
        ${isLandscape ? "border-l border-gray-200" : "border-t border-gray-200"}
      `}
      style={{
        width: isLandscape ? POS_SIDEBAR_WIDTH : "100%",
      }}
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerClassName="gap-2"
      >
        {/* TEST: Print Receipt Button - Prominent for testing */}
        <SidebarButton
          label="🖨 PRINT RECEIPT (TEST)"
          icon={<Ionicons name="print-outline" size={20} color="#374151" />}
          onPress={onPrintReceipt}
        />

        {/* Branding Section */}
        <View className="bg-gray-200 rounded-lg p-3 items-center mb-1">
          <Text className="text-gray-600 text-sm font-medium">Branding</Text>
          <Text className="text-gray-600 text-sm font-medium">Section</Text>
        </View>

        {/* Add Product Row */}
        <View className="flex-row gap-2">
          <SidebarButton
            label="Add New Product"
            fullWidth={false}
            onPress={onAddProduct}
          />
          <SidebarButton
            label="Add Misc Item"
            fullWidth={false}
            onPress={onMiscItem}
          />
        </View>

        {/* Payment Methods */}
        <View className="flex-row gap-2">
          <SidebarButton
            label="Cash Payment"
            fullWidth={false}
            onPress={onCashPayment}
          />
          <SidebarButton
            label="Card Payment"
            fullWidth={false}
            onPress={onCardPayment}
          />
        </View>

        <View className="flex-row gap-2">
          <SidebarButton
            label="Bank 1 Machine"
            fullWidth={false}
          />
          <SidebarButton
            label="Bank 2 Machine"
            fullWidth={false}
          />
        </View>

        <View className="flex-row gap-2">
          <SidebarButton
            label="Bank 3 Machine"
            fullWidth={false}
          />
          <SidebarButton
            label="Bank 4 Machine"
            fullWidth={false}
          />
        </View>

        {/* Online Transfer / Add Tax */}
        <View className="flex-row gap-2">
          <SidebarButton
            label="Online Transfer"
            fullWidth={false}
          />
          <SidebarButton
            label="⊕ Add Tax"
            fullWidth={false}
          />
        </View>

        {/* Delete / Void */}
        <View className="flex-row gap-2">
          <SidebarButton
            label="Delete Product"
            fullWidth={false}
            onPress={onDeleteProduct}
          />
          <SidebarButton
            label="Void Payment"
            fullWidth={false}
            onPress={onVoidPayment}
          />
        </View>

        {/* Add Notes / Add Discount */}
        <View className="flex-row gap-2">
          <SidebarButton
            label="Add Notes"
            fullWidth={false}
            onPress={onAddNotes}
          />
          <SidebarButton
            label="Add Discount"
            fullWidth={false}
            onPress={onAddDiscount}
          />
        </View>

        {/* Empty Cart / Park Order */}
        <View className="flex-row gap-2">
          <SidebarButton
            label="🗑 Empty Cart"
            fullWidth={false}
            onPress={onEmptyCart}
          />
          <SidebarButton
            label="⏱ Park Order"
            fullWidth={false}
            onPress={onParkOrder}
          />
        </View>

        {/* Checkout & Go to Menu - Hidden when in order flow */}
        {!hideNavButtons && (
          <>
            <SidebarButton
              label="Checkout"
              icon={<Ionicons name="cart-outline" size={18} color="#374151" />}
              onPress={onCheckout}
            />
            <SidebarButton
              label="Go to Menu"
              icon={<Ionicons name="grid-outline" size={18} color="#374151" />}
              onPress={onGoToMenu}
            />
          </>
        )}
      </ScrollView>
    </View>
  );
}
