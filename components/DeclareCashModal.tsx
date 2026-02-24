import { colors, iconSize, modalContent } from "@/utils/theme";
import { ThemedButton } from "./ThemedButton";
import { Ionicons } from "@expo/vector-icons";
import { Pressable, Text, View } from "react-native";
import { CenteredModal } from "./CenteredModal";

interface CashSummary {
  openingBalance: number;
  totalSales: number;
  totalRefunds: number;
  expectedCash: number;
}

interface DeclareCashModalProps {
  visible: boolean;
  onClose: () => void;
  onContinue: () => void;
  cashSummary: CashSummary;
}

/**
 * DeclareCashModal - Cash summary before entering actual counted cash.
 * Aligned to staff dashboard declare cash visual draft.
 */
export function DeclareCashModal({
  visible,
  onClose,
  onContinue,
  cashSummary,
}: DeclareCashModalProps) {
  const openingCash = cashSummary.openingBalance;
  const totalCashSales = cashSummary.totalSales;
  const cashRefunds = cashSummary.totalRefunds;
  const expectedCashInDrawer = cashSummary.expectedCash;

  return (
    <CenteredModal
      visible={visible}
      onClose={onClose}
      size="md"
      showCloseButton={false}
      header={
        <View className="flex-row justify-between items-center flex-1">
          <Text className="text-2xl font-semibold" style={{ color: colors.text }}>Declare Cash</Text>
          <Pressable onPress={onClose} style={({ pressed }) => ({ opacity: pressed ? 0.55 : 1 })}>
            <Ionicons name="close" size={iconSize['2xl']} color={colors.textDark} />
          </Pressable>
        </View>
      }
      footer={
        <View className="flex-row gap-4 flex-1">
          <ThemedButton
            title="Cancel"
            variant="outline"
            onPress={onClose}
            fullWidth
            size="lg"
            style={{ flex: 1, borderColor: colors.primary }}
            textStyle={{ color: colors.primary, fontSize: 18 }}
          />
          <ThemedButton
            title="Cash Entry"
            onPress={onContinue}
            fullWidth
            size="lg"
            style={{ flex: 1, backgroundColor: colors.primary }}
            textStyle={{ fontSize: 18 }}
          />
        </View>
      }
    >
      <View className="px-4 pt-2.5 pb-4">
            <View className="flex-row gap-3 mb-3">
              <View className="flex-1">
                <Text className="mb-1.5" style={{ fontSize: modalContent.titleFontSize, fontWeight: modalContent.titleFontWeight, color: modalContent.titleColor }}>Opening Cash Amount</Text>
                <View
                  className="justify-center"
                  style={{ backgroundColor: modalContent.boxBackgroundAlt, borderWidth: modalContent.boxBorderWidth, borderColor: modalContent.boxBorderColor, padding: modalContent.boxPadding, borderRadius: modalContent.boxRadius, minHeight: 114 }}
                >
                  <Text className="font-bold text-right w-full" style={{ fontSize: modalContent.valueLargeFontSize, lineHeight: 58, color: "#D83767" }}>
                    ${openingCash.toFixed(0)}
                  </Text>
                </View>
              </View>

              <View className="flex-1">
                <Text className="mb-1.5" style={{ fontSize: modalContent.titleFontSize, fontWeight: modalContent.titleFontWeight, color: modalContent.titleColor }}>Total Cash Sales</Text>
                <View
                  className="justify-center"
                  style={{ backgroundColor: modalContent.boxBackgroundAlt, borderWidth: modalContent.boxBorderWidth, borderColor: modalContent.boxBorderColor, padding: modalContent.boxPadding, borderRadius: modalContent.boxRadius, minHeight: 114 }}
                >
                  <Text className="font-bold text-right w-full" style={{ fontSize: modalContent.valueLargeFontSize, lineHeight: 58, color: "#1C9B73" }}>
                    ${totalCashSales.toFixed(0)}
                  </Text>
                </View>
              </View>
            </View>

            <View className="flex-row gap-3 mb-4">
              <View className="flex-1">
                <Text className="mb-1.5" style={{ fontSize: modalContent.titleFontSize, fontWeight: modalContent.titleFontWeight, color: modalContent.titleColor }}>Cash Refunds</Text>
                <View
                  className="justify-center"
                  style={{ backgroundColor: modalContent.boxBackgroundAlt, borderWidth: modalContent.boxBorderWidth, borderColor: modalContent.boxBorderColor, padding: modalContent.boxPadding, borderRadius: modalContent.boxRadius, minHeight: 114 }}
                >
                  <Text className="font-bold text-right w-full" style={{ fontSize: modalContent.valueLargeFontSize, lineHeight: 58, color: "#CC5B23" }}>
                    ${cashRefunds.toFixed(0)}
                  </Text>
                </View>
              </View>

              <View className="flex-1">
                <Text className="mb-1.5" style={{ fontSize: modalContent.titleFontSize, fontWeight: modalContent.titleFontWeight, color: modalContent.titleColor }}>Expected Cash In Drawer</Text>
                <View
                  className="justify-center"
                  style={{ backgroundColor: modalContent.boxBackgroundAlt, borderWidth: modalContent.boxBorderWidth, borderColor: modalContent.boxBorderColor, padding: modalContent.boxPadding, borderRadius: modalContent.boxRadius, minHeight: 114 }}
                >
                  <Text className="font-bold text-right w-full" style={{ fontSize: modalContent.valueLargeFontSize, lineHeight: 58, color: modalContent.valueColor }}>
                    ${expectedCashInDrawer.toFixed(0)}
                  </Text>
                </View>
              </View>
            </View>
      </View>
    </CenteredModal>
  );
}
