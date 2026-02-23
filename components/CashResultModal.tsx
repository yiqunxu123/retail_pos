import { Ionicons } from "@expo/vector-icons";
import { Modal, Pressable, Text, View } from "react-native";
import { iconSize, colors, buttonSize } from "@/utils/theme";
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
    <Modal
      animationType="fade"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <Pressable
        className="flex-1 bg-black/45 justify-center items-center px-4"
        onPress={onClose}
      >
        <Pressable
          className="bg-white rounded-xl overflow-hidden"
          style={{
            width: "92%",
            maxWidth: 664,
            borderWidth: 1,
            borderColor: colors.border,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.18,
            shadowRadius: 20,
            elevation: 8,
          }}
          onPress={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <View className="flex-row justify-between items-center px-5 py-4 border-b border-[#E4E7EC]">
            <Text className="text-2xl font-semibold" style={{ color: colors.text }}>
              {isMatched ? "Cash Matched" : "Cash Mismatch"}
            </Text>
            <Pressable onPress={onClose} style={({ pressed }) => ({ opacity: pressed ? 0.55 : 1 })}>
              <Ionicons name="close" size={iconSize['2xl']} color={colors.textDark} />
            </Pressable>
          </View>

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
            <Text className="text-center text-gray-600 mb-6 text-lg px-2">
              {isMatched
                ? "The cash amount entered matches the system total.\nYou can proceed to declare cash and end your shift."
                : "The cash amount entered does not match the system total.\nPlease review the difference before declaring cash."}
            </Text>

            {/* Amounts */}
            <View className="flex-row gap-3 w-full mb-6">
              <View
                className="flex-1 rounded-lg px-4 py-4 justify-center"
                style={{
                  backgroundColor: "#F4F5F7",
                  borderWidth: 1,
                  borderColor: "#E4E7EC",
                  minHeight: 100,
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 3 },
                  shadowOpacity: 0.07,
                  shadowRadius: 5,
                  elevation: 2,
                }}
              >
                <Text className="text-base font-semibold mb-1" style={{ color: colors.textMedium }}>Expected Cash</Text>
                <Text className="text-5xl font-bold text-right w-full" style={{ color: colors.text }}>
                  ${expectedAmount.toFixed(0)}
                </Text>
              </View>
              <View
                className="flex-1 rounded-lg px-4 py-4 justify-center"
                style={{
                  backgroundColor: isMatched ? "#ECFDF5" : "#FEF2F2",
                  borderWidth: 1,
                  borderColor: isMatched ? colors.success : colors.error,
                  minHeight: 100,
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 3 },
                  shadowOpacity: 0.07,
                  shadowRadius: 5,
                  elevation: 2,
                }}
              >
                <Text className="text-base font-semibold mb-1" style={{ color: colors.textMedium }}>Entered Cash</Text>
                <Text 
                  className={`text-5xl font-bold text-right w-full ${isMatched ? "text-green-600" : "text-red-600"}`}
                >
                  ${actualAmount.toFixed(0)}
                </Text>
              </View>
            </View>

            {/* Buttons */}
            <View className="flex-row gap-4 w-full">
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
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
