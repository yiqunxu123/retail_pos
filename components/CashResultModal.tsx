import { Ionicons } from "@expo/vector-icons";
import { Pressable, Text, View } from "react-native";
import { iconSize, colors, modalContent } from "@/utils/theme";
import { CenteredModal } from "./CenteredModal";
import { ThemedButton } from "./ThemedButton";

interface CashResultModalProps {
  visible: boolean;
  onClose: () => void;
  isMatched: boolean;
  expectedAmount: number;
  actualAmount: number;
  onConfirm?: () => void;
  onReview?: () => void;
}

export function CashResultModal({
  visible,
  onClose,
  isMatched,
  expectedAmount,
  actualAmount,
  onConfirm,
  onReview,
}: CashResultModalProps) {
  return (
    <CenteredModal
      visible={visible}
      onClose={onClose}
      size="md"
      showCloseButton={false}
      header={
        <View className="flex-row justify-between items-center flex-1">
          <Text className="text-2xl font-semibold" style={{ color: colors.text }}>
            {isMatched ? "Cash Matched" : "Cash Mismatch"}
          </Text>
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
            style={{ flex: 1, backgroundColor: colors.primaryLight, borderColor: colors.error, borderWidth: 1 }}
            textStyle={{ color: colors.error, fontSize: 18 }}
          />
          {isMatched ? (
            <ThemedButton
              title="Declare Cash"
              onPress={onConfirm}
              fullWidth
              size="lg"
              style={{ flex: 1, backgroundColor: colors.primary }}
              textStyle={{ fontSize: 18 }}
            />
          ) : (
            <ThemedButton
              title="Review Amount"
              onPress={onReview}
              fullWidth
              size="lg"
              style={{ flex: 1, backgroundColor: colors.purple }}
              textStyle={{ fontSize: 18 }}
            />
          )}
        </View>
      }
    >
      {/* Content */}
          <View className="items-center px-5 pt-5 pb-6">
            {/* Icon */}
            <View className="mb-5">
              {isMatched ? (
                <View className="w-20 h-20 rounded-full items-center justify-center" style={{ backgroundColor: colors.success, borderWidth: 4, borderColor: colors.primaryLight }}>
                  <Ionicons name="checkmark" size={iconSize['4xl']} color="white" />
                </View>
              ) : (
                <View className="w-20 h-20 rounded-full items-center justify-center" style={{ backgroundColor: colors.error, borderWidth: 4, borderColor: colors.primaryLight }}>
                  <Ionicons name="close" size={iconSize['4xl']} color="white" />
                </View>
              )}
            </View>

            {/* Message */}
            <Text className="text-center mb-6 px-2" style={{ fontSize: modalContent.valueFontSize, color: modalContent.labelColor }}>
              {isMatched
                ? "The cash amount entered matches the system total.\nYou can proceed to declare cash and end your shift."
                : "The cash amount entered does not match the system total.\nPlease review the difference before declaring cash."}
            </Text>

            {/* Amounts */}
            <View className="flex-row gap-3 w-full mb-6">
              <View
                className="flex-1 justify-center"
                style={{
                  backgroundColor: modalContent.boxBackgroundAlt,
                  borderWidth: modalContent.boxBorderWidth,
                  borderColor: modalContent.boxBorderColor,
                  padding: modalContent.boxPadding,
                  borderRadius: modalContent.boxRadius,
                  minHeight: 100,
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 3 },
                  shadowOpacity: 0.07,
                  shadowRadius: 5,
                  elevation: 2,
                }}
              >
                <Text className="mb-1" style={{ fontSize: modalContent.labelFontSize, color: modalContent.labelColor }}>Expected Cash</Text>
                <Text className="font-bold text-right w-full" style={{ fontSize: modalContent.valueLargeFontSize, color: modalContent.valueColor }}>
                  ${expectedAmount.toFixed(0)}
                </Text>
              </View>
              <View
                className="flex-1 justify-center"
                style={{
                  backgroundColor: isMatched ? "#ECFDF5" : "#FEF2F2",
                  borderWidth: modalContent.boxBorderWidth,
                  borderColor: isMatched ? colors.success : colors.error,
                  padding: modalContent.boxPadding,
                  borderRadius: modalContent.boxRadius,
                  minHeight: 100,
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 3 },
                  shadowOpacity: 0.07,
                  shadowRadius: 5,
                  elevation: 2,
                }}
              >
                <Text className="mb-1" style={{ fontSize: modalContent.labelFontSize, color: modalContent.labelColor }}>Entered Cash</Text>
                <Text 
                  className={`text-5xl font-bold text-right w-full ${isMatched ? "text-green-600" : "text-red-600"}`}
                >
                  ${actualAmount.toFixed(0)}
                </Text>
              </View>
            </View>
          </View>
    </CenteredModal>
  );
}
