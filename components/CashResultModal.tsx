import { Ionicons } from "@expo/vector-icons";
import { Modal, Pressable, Text, View } from "react-native";

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
      <View className="flex-1 justify-center items-center bg-black/50">
        <View className="bg-white rounded-xl w-[500px] overflow-hidden shadow-xl">
          {/* Header */}
          <View className="flex-row justify-between items-center px-6 py-4 border-b border-gray-100">
            <Text className="text-xl font-bold text-gray-900">
              {isMatched ? "Cash Matched" : "Cash Mismatch"}
            </Text>
            <Pressable onPress={onClose}>
              <Ionicons name="close" size={24} color="#9CA3AF" />
            </Pressable>
          </View>

          {/* Content */}
          <View className="items-center px-8 py-8">
            {/* Icon */}
            <View className="mb-6">
              {isMatched ? (
                <View className="w-16 h-16 bg-green-500 rounded-full items-center justify-center shadow-lg border-4 border-green-100">
                  <Ionicons name="checkmark" size={40} color="white" />
                </View>
              ) : (
                <View className="w-16 h-16 bg-red-600 rounded-full items-center justify-center shadow-lg border-4 border-red-100">
                  <Ionicons name="close" size={40} color="white" />
                </View>
              )}
            </View>

            {/* Message */}
            <Text className="text-center text-gray-600 mb-8 text-base px-4">
              {isMatched
                ? "The cash amount entered matches the system total.\nYou can proceed to declare cash and end your shift."
                : "The cash amount entered does not match the system total.\nPlease review the difference before declaring cash."}
            </Text>

            {/* Amounts */}
            <View className="flex-row gap-4 w-full mb-8">
              <View className="flex-1 bg-[#F7F7F9] p-4 rounded-lg items-center border border-gray-200 shadow-sm">
                <Text className="text-gray-500 text-sm font-medium mb-1">Expected Cash</Text>
                <Text className="text-2xl font-bold text-gray-900">
                  ${expectedAmount.toFixed(0)}
                </Text>
              </View>
              <View className="flex-1 bg-[#F7F7F9] p-4 rounded-lg items-center border border-gray-200 shadow-sm">
                <Text className="text-gray-500 text-sm font-medium mb-1">Entered Cash Amount</Text>
                <Text 
                  className={`text-2xl font-bold ${isMatched ? "text-green-600" : "text-red-600"}`}
                >
                  ${actualAmount.toFixed(0)}
                </Text>
              </View>
            </View>

            {/* Buttons */}
            <View className="flex-row gap-4 w-full">
              <Pressable
                onPress={onClose}
                className="flex-1 py-3 bg-red-50 rounded-lg items-center"
              >
                <Text className="text-red-500 font-semibold text-base">Cancel</Text>
              </Pressable>
              
              {isMatched ? (
                <Pressable
                  onPress={onConfirm}
                  className="flex-1 py-3 rounded-lg items-center"
                  style={{ backgroundColor: "#EC1A52" }}
                >
                  <Text className="text-white font-semibold text-base">Declare Cash</Text>
                </Pressable>
              ) : (
                <Pressable
                  onPress={onReview}
                  className="flex-1 py-3 rounded-lg items-center"
                  style={{ backgroundColor: "#6D28D9" }} // Purple for Review Amount
                >
                  <Text className="text-white font-semibold text-base">Review Amount</Text>
                </Pressable>
              )}
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}
