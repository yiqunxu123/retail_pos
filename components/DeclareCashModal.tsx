import { buttonSize, colors, iconSize } from "@/utils/theme";
import { ThemedButton } from "./ThemedButton";
import { Ionicons } from "@expo/vector-icons";
import { Modal, Pressable, Text, View } from "react-native";

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
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable className="flex-1 bg-black/45 justify-center items-center px-4" onPress={onClose}>
        <Pressable
          className="bg-white rounded-xl overflow-hidden"
          style={{
            borderWidth: 1, borderColor: colors.border,
            width: "92%",
            maxWidth: 664,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.18,
            shadowRadius: 20,
            elevation: 8,
          }}
          onPress={(e) => e.stopPropagation()}
        >
          <View className="flex-row justify-between items-center px-5 py-3 border-b border-[#E4E7EC]">
            <Text className="text-2xl font-semibold" style={{ color: colors.text }}>Declare Cash</Text>
            <Pressable onPress={onClose} style={({ pressed }) => ({ opacity: pressed ? 0.55 : 1 })}>
              <Ionicons name="close" size={iconSize['2xl']} color={colors.textDark} />
            </Pressable>
          </View>

          <View className="px-4 pt-2.5 pb-4">
            <View className="flex-row gap-3 mb-3">
              <View className="flex-1">
                <Text style={{ color: colors.textDark }} className="text-lg font-semibold mb-1.5">Opening Cash Amount</Text>
                <View
                  className="rounded-lg bg-[#F4F5F7] border border-[#E4E7EC] px-4 py-4 justify-center"
                  style={{
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 3 },
                    shadowOpacity: 0.07,
                    shadowRadius: 5,
                    elevation: 2,
                    minHeight: 114,
                  }}
                >
                  <Text className="text-[#D83767] text-5xl leading-[58px] font-bold text-right w-full">
                    ${openingCash.toFixed(0)}
                  </Text>
                </View>
              </View>

              <View className="flex-1">
                <Text style={{ color: colors.textDark }} className="text-lg font-semibold mb-1.5">Total Cash Sales</Text>
                <View
                  className="rounded-lg bg-[#F4F5F7] border border-[#E4E7EC] px-4 py-4 justify-center"
                  style={{
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 3 },
                    shadowOpacity: 0.07,
                    shadowRadius: 5,
                    elevation: 2,
                    minHeight: 114,
                  }}
                >
                  <Text className="text-[#1C9B73] text-5xl leading-[58px] font-bold text-right w-full">
                    ${totalCashSales.toFixed(0)}
                  </Text>
                </View>
              </View>
            </View>

            <View className="flex-row gap-3 mb-4">
              <View className="flex-1">
                <Text style={{ color: colors.textDark }} className="text-lg font-semibold mb-1.5">Cash Refunds</Text>
                <View
                  className="rounded-lg bg-[#F4F5F7] border border-[#E4E7EC] px-4 py-4 justify-center"
                  style={{
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 3 },
                    shadowOpacity: 0.07,
                    shadowRadius: 5,
                    elevation: 2,
                    minHeight: 114,
                  }}
                >
                  <Text className="text-[#CC5B23] text-5xl leading-[58px] font-bold text-right w-full">
                    ${cashRefunds.toFixed(0)}
                  </Text>
                </View>
              </View>

              <View className="flex-1">
                <Text style={{ color: colors.textDark }} className="text-lg font-semibold mb-1.5">Expected Cash In Drawer</Text>
                <View
                  className="rounded-lg bg-[#F4F5F7] border border-[#E4E7EC] px-4 py-4 justify-center"
                  style={{
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 3 },
                    shadowOpacity: 0.07,
                    shadowRadius: 5,
                    elevation: 2,
                    minHeight: 114,
                  }}
                >
                  <Text style={{ color: colors.text }} className="text-5xl leading-[58px] font-bold text-right w-full">
                    ${expectedCashInDrawer.toFixed(0)}
                  </Text>
                </View>
              </View>
            </View>

            <View className="flex-row gap-4">
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
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
