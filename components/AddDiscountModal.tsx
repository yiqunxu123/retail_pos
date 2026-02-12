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
        className="flex-1 bg-black/45 justify-center items-center"
        onPress={onClose}
      >
        <Pressable
          className="bg-white rounded-xl overflow-hidden"
          style={{ width: 700 }}
          onPress={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <View className="flex-row justify-between items-center px-5 py-3 border-b border-gray-200">
            <View className="flex-row items-center gap-4">
              <Text className="text-xl font-semibold text-gray-800">
                Add Discount
              </Text>
              {/* Discount Type Dropdown */}
              <View className="relative">
                <Pressable
                  onPress={() => setShowTypeDropdown(!showTypeDropdown)}
                  className="flex-row items-center bg-white border border-[#D4D7DE] px-3 py-1.5 rounded-md gap-2"
                >
                  <Text className="text-[#EC1A52]">
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
          <View className="px-4 py-3">
            <View className="flex-row gap-3 mb-3">
              {/* Sub Total */}
              <View className="flex-1">
                <Text className="text-[#111827] text-base font-semibold mb-2">Sub Total</Text>
                <View className="rounded-lg bg-[#F6F7F9] px-4 py-4 border border-[#E4E7EC] justify-center" style={{ shadowColor: "#000", shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.12, shadowRadius: 6, elevation: 4, minHeight: 112 }}>
                  <Text className="text-[#E33163] text-[46px] leading-[52px] font-bold text-right w-full">
                    {subTotal.toFixed(0)}
                  </Text>
                </View>
              </View>

              {/* Discount Amount */}
              <View className="flex-1">
                <Text className="text-[#111827] text-base font-semibold mb-2">Discount Amount</Text>
                <View className="rounded-lg bg-[#F6F7F9] px-4 py-4 border border-[#E4E7EC] justify-center" style={{ shadowColor: "#000", shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.12, shadowRadius: 6, elevation: 4, minHeight: 112 }}>
                  <Text className="text-[#16A085] text-[46px] leading-[52px] font-bold text-right w-full">
                    {discountType === "percentage"
                      ? `${discountValue || "0"}%`
                      : discountValue || "0"}
                  </Text>
                </View>
              </View>

              {/* Total After Discount */}
              <View className="flex-1">
                <Text className="text-[#111827] text-base font-semibold mb-2">Total After Discount</Text>
                <View className="rounded-lg bg-[#F6F7F9] px-4 py-4 border border-[#E4E7EC] justify-center" style={{ shadowColor: "#000", shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.12, shadowRadius: 6, elevation: 4, minHeight: 112 }}>
                  <Text className="text-[#2A2FB2] text-[46px] leading-[52px] font-bold text-right w-full">
                    {totalAfterDiscount.toFixed(0)}
                  </Text>
                </View>
              </View>
            </View>

            {/* Number Pad */}
            <View className="flex-row gap-3 items-stretch">
              {/* Numbers */}
              <View className="flex-1 gap-2">
                {numberPad.map((row, rowIndex) => (
                  <View key={rowIndex} className="flex-row gap-2">
                    {row.map((num) => (
                      <Pressable
                        key={num}
                        onPress={() => handleNumberPress(num)}
                        className="flex-1 bg-white h-16 rounded-lg items-center justify-center border border-gray-200"
                        style={({ pressed }) => ({
                          backgroundColor: pressed ? "#E7EBF1" : "#FFFFFF",
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
                    className="flex-1 bg-white h-16 rounded-lg items-center justify-center border border-gray-200"
                    style={({ pressed }) => ({
                      backgroundColor: pressed ? "#E7EBF1" : "#FFFFFF",
                    })}
                  >
                    <Text className="text-xl font-semibold text-gray-800">0</Text>
                  </Pressable>
                  {discountType === "fixed" && (
                    <Pressable
                      onPress={() => handleNumberPress(".")}
                      className="flex-1 bg-white h-16 rounded-lg items-center justify-center border border-gray-200"
                      style={({ pressed }) => ({
                        backgroundColor: pressed ? "#E7EBF1" : "#FFFFFF",
                      })}
                    >
                      <Text className="text-xl font-semibold text-gray-800">.</Text>
                    </Pressable>
                  )}
                </View>
              </View>

              {/* Action Buttons */}
              <View className="w-56 gap-2 items-center">
                <Pressable
                  onPress={handleCancel}
                  className="bg-[#F45A08] h-14 w-[95%] rounded-lg items-center justify-center flex-row gap-2"
                  style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1 })}
                >
                  <Ionicons name="close-circle-outline" size={18} color="#FFFFFF" />
                  <Text className="text-white text-[14px] font-semibold">Cancel</Text>
                </Pressable>
                <Pressable
                  onPress={handleCorrect}
                  className="border border-[#D9C2CC] h-14 w-[95%] rounded-lg items-center justify-center bg-white flex-row gap-2"
                  style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1 })}
                >
                  <Ionicons name="backspace-outline" size={18} color="#B85A7B" />
                  <Text className="text-[#B85A7B] text-[14px] font-semibold">Correct</Text>
                </Pressable>
                <Pressable
                  onPress={handleConfirm}
                  className="bg-[#EC1A52] h-14 w-[95%] rounded-lg items-center justify-center border border-[#D51549]"
                  style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1 })}
                >
                  <Text className="text-white text-[14px] font-semibold">Confirm</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
