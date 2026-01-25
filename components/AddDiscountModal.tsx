import { Ionicons } from "@expo/vector-icons";
import { useState, useEffect } from "react";
import { Modal, View, Text, Pressable } from "react-native";

type DiscountType = "percentage" | "fixed";

interface AddDiscountModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: (discount: number, type: DiscountType) => void;
  subTotal: number;
}

/**
 * AddDiscountModal - Add discount with percentage or fixed amount
 * Shows numeric keypad for entering discount value
 */
export function AddDiscountModal({
  visible,
  onClose,
  onConfirm,
  subTotal,
}: AddDiscountModalProps) {
  const [discountValue, setDiscountValue] = useState("");
  const [discountType, setDiscountType] = useState<DiscountType>("percentage");
  const [showTypeDropdown, setShowTypeDropdown] = useState(false);

  // Reset when modal opens
  useEffect(() => {
    if (visible) {
      setDiscountValue("");
      setDiscountType("percentage");
    }
  }, [visible]);

  const discountNum = parseFloat(discountValue) || 0;

  // Calculate discount amount based on type
  const discountAmount =
    discountType === "percentage"
      ? (subTotal * discountNum) / 100
      : discountNum;

  const totalAfterDiscount = Math.max(0, subTotal - discountAmount);

  const handleNumberPress = (num: string) => {
    // Limit percentage to 100
    if (discountType === "percentage") {
      const newValue = discountValue + num;
      if (parseFloat(newValue) <= 100) {
        setDiscountValue(newValue);
      }
    } else {
      setDiscountValue((prev) => prev + num);
    }
  };

  const handleCancel = () => {
    setDiscountValue("");
  };

  const handleCorrect = () => {
    setDiscountValue((prev) => prev.slice(0, -1));
  };

  const handleConfirm = () => {
    onConfirm(discountNum, discountType);
    setDiscountValue("");
  };

  const numberPad = [
    ["1", "2", "3"],
    ["4", "5", "6"],
    ["7", "8", "9"],
  ];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable
        className="flex-1 bg-black/50 justify-center items-center"
        onPress={onClose}
      >
        <Pressable
          className="bg-white rounded-xl overflow-hidden"
          style={{ width: 480 }}
          onPress={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <View className="flex-row justify-between items-center px-6 py-4 border-b border-gray-200">
            <View className="flex-row items-center gap-4">
              <Text className="text-xl font-semibold text-gray-800">
                Add Discount
              </Text>
              {/* Discount Type Dropdown */}
              <View className="relative">
                <Pressable
                  onPress={() => setShowTypeDropdown(!showTypeDropdown)}
                  className="flex-row items-center bg-gray-100 px-3 py-2 rounded-lg gap-2"
                >
                  <Text className="text-gray-700">
                    {discountType === "percentage" ? "Percentage (%)" : "Fixed ($)"}
                  </Text>
                  <Ionicons name="chevron-down" size={16} color="#6b7280" />
                </Pressable>
                {showTypeDropdown && (
                  <View className="absolute top-10 left-0 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                    <Pressable
                      onPress={() => {
                        setDiscountType("percentage");
                        setShowTypeDropdown(false);
                        setDiscountValue("");
                      }}
                      className="px-4 py-2 border-b border-gray-100"
                    >
                      <Text className="text-gray-700">Percentage (%)</Text>
                    </Pressable>
                    <Pressable
                      onPress={() => {
                        setDiscountType("fixed");
                        setShowTypeDropdown(false);
                        setDiscountValue("");
                      }}
                      className="px-4 py-2"
                    >
                      <Text className="text-gray-700">Fixed ($)</Text>
                    </Pressable>
                  </View>
                )}
              </View>
            </View>
            <Pressable
              onPress={onClose}
              style={({ pressed }) => ({ opacity: pressed ? 0.5 : 1 })}
            >
              <Ionicons name="close" size={24} color="#6b7280" />
            </Pressable>
          </View>

          {/* Amount Display */}
          <View className="px-6 py-4">
            <View className="flex-row gap-4 mb-6">
              {/* Sub Total */}
              <View className="flex-1">
                <Text className="text-gray-600 text-sm mb-2">Sub Total</Text>
                <View className="border-2 border-gray-300 rounded-lg p-4 items-center">
                  <Text className="text-red-500 text-3xl font-bold">
                    {subTotal.toFixed(0)}
                  </Text>
                </View>
              </View>

              {/* Discount Amount */}
              <View className="flex-1">
                <Text className="text-gray-600 text-sm mb-2">Discount Amount</Text>
                <View className="border-2 border-green-500 rounded-lg p-4 items-center bg-green-50">
                  <Text className="text-green-600 text-3xl font-bold">
                    {discountType === "percentage"
                      ? `${discountValue || "0"}%`
                      : discountValue || "0"}
                  </Text>
                </View>
              </View>

              {/* Total After Discount */}
              <View className="flex-1">
                <Text className="text-gray-600 text-sm mb-2">Total After Discount</Text>
                <View className="border-2 border-purple-500 rounded-lg p-4 items-center bg-purple-50">
                  <Text className="text-purple-600 text-3xl font-bold">
                    {totalAfterDiscount.toFixed(0)}
                  </Text>
                </View>
              </View>
            </View>

            {/* Number Pad */}
            <View className="flex-row gap-3">
              {/* Numbers */}
              <View className="flex-1 gap-2">
                {numberPad.map((row, rowIndex) => (
                  <View key={rowIndex} className="flex-row gap-2">
                    {row.map((num) => (
                      <Pressable
                        key={num}
                        onPress={() => handleNumberPress(num)}
                        className="flex-1 bg-gray-100 py-4 rounded-lg items-center justify-center border border-gray-200"
                        style={({ pressed }) => ({
                          backgroundColor: pressed ? "#d1d5db" : "#f3f4f6",
                        })}
                      >
                        <Text className="text-xl font-semibold text-gray-800">
                          {num}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                ))}
                {/* Bottom row: 0 */}
                <View className="flex-row gap-2">
                  <Pressable
                    onPress={() => handleNumberPress("0")}
                    className="flex-1 bg-gray-100 py-4 rounded-lg items-center justify-center border border-gray-200"
                    style={({ pressed }) => ({
                      backgroundColor: pressed ? "#d1d5db" : "#f3f4f6",
                    })}
                  >
                    <Text className="text-xl font-semibold text-gray-800">0</Text>
                  </Pressable>
                  {discountType === "fixed" && (
                    <Pressable
                      onPress={() => handleNumberPress(".")}
                      className="flex-1 bg-gray-100 py-4 rounded-lg items-center justify-center border border-gray-200"
                      style={({ pressed }) => ({
                        backgroundColor: pressed ? "#d1d5db" : "#f3f4f6",
                      })}
                    >
                      <Text className="text-xl font-semibold text-gray-800">.</Text>
                    </Pressable>
                  )}
                </View>
              </View>

              {/* Action Buttons */}
              <View className="w-32 gap-2">
                <Pressable
                  onPress={handleCancel}
                  className="bg-red-500 py-4 rounded-lg items-center justify-center flex-1"
                  style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1 })}
                >
                  <Text className="text-white font-semibold">⊗ Cancel</Text>
                </Pressable>
                <Pressable
                  onPress={handleCorrect}
                  className="border-2 border-red-500 py-4 rounded-lg items-center justify-center flex-1"
                  style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1 })}
                >
                  <Text className="text-red-500 font-semibold">⊗ Correct</Text>
                </Pressable>
                <Pressable
                  onPress={handleConfirm}
                  className="bg-green-500 py-4 rounded-lg items-center justify-center flex-1"
                  style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1 })}
                >
                  <Text className="text-white font-semibold">Confirm</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
