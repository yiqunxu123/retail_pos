import { buttonSize, colors, iconSize } from "@/utils/theme";
import { ThemedButton } from "./ThemedButton";
import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { KeyboardAvoidingView, Modal, Platform, Text, TextInput, TouchableOpacity, View } from "react-native";

interface ParkOrderModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: (note?: string) => void;
  customerName: string;
  totalItems: number;
  totalAmount: number;
}

/**
 * ParkOrderModal - Confirm parking the current order
 * Shows order summary and optional note input
 */
export function ParkOrderModal({
  visible,
  onClose,
  onConfirm,
  customerName,
  totalItems,
  totalAmount,
}: ParkOrderModalProps) {
  const [note, setNote] = useState("");

  const handleConfirm = () => {
    onConfirm(note || undefined);
    setNote("");
  };

  const handleCancel = () => {
    setNote("");
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <TouchableOpacity
          className="flex-1 bg-black/50 justify-center items-center"
          activeOpacity={1}
          onPress={onClose}
        >
          <TouchableOpacity
            className="bg-white rounded-xl overflow-hidden"
            style={{ width: 420 }}
            activeOpacity={1}
            onPress={(e) => e.stopPropagation()}
          >
          {/* Header */}
          <View className="flex-row justify-between items-center px-6 py-4 border-b border-gray-200">
            <View className="flex-row items-center gap-3">
              <View className="w-10 h-10 bg-yellow-100 rounded-full items-center justify-center">
                <Ionicons name="pause-circle" size={iconSize.xl} color={colors.warning} />
              </View>
              <Text className="text-xl font-semibold text-gray-800">
                Park Order
              </Text>
            </View>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={iconSize.xl} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Content */}
          <View className="px-6 py-5">
            <Text className="text-gray-600 text-center mb-6">
              Are you sure you want to park this order?{"\n"}
              The order will be saved and can be resumed later.
            </Text>

            {/* Order Summary */}
            <View className="bg-[#F7F7F9] rounded-lg p-4 mb-5 shadow-sm">
              <View className="flex-row justify-between mb-2">
                <Text className="text-gray-600">Customer</Text>
                <Text className="text-gray-800 font-medium">{customerName}</Text>
              </View>
              <View className="flex-row justify-between mb-2">
                <Text className="text-gray-600">Total Items</Text>
                <Text className="text-gray-800 font-medium">{totalItems}</Text>
              </View>
              <View className="flex-row justify-between">
                <Text className="text-gray-600">Total Amount</Text>
                <Text className="text-red-500 font-bold text-lg">${totalAmount.toFixed(2)}</Text>
              </View>
            </View>

            {/* Note Input */}
            <View className="mb-5">
              <Text className="text-gray-600 text-sm mb-2">Add Note (Optional)</Text>
              <TextInput
                className="bg-white border border-gray-200 rounded-lg px-4 py-3 shadow-sm"
                placeholder="Enter a note for this parked order..."
                placeholderTextColor="#9ca3af"
                value={note}
                onChangeText={setNote}
                multiline
                numberOfLines={2}
              />
            </View>

            {/* Action Buttons */}
            <View className="flex-row gap-4">
              <ThemedButton
                title="Cancel"
                variant="outline"
                onPress={handleCancel}
                fullWidth
                size="lg"
                textStyle={{ fontSize: 18 }}
              />
              <ThemedButton
                title="Park Order"
                onPress={handleConfirm}
                fullWidth
                style={{ flex: 1, backgroundColor: colors.warning }}
                textStyle={{ color: colors.text }}
              />
            </View>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </Modal>
  );
}
