import { Ionicons } from "@expo/vector-icons";
import { useState, useEffect } from "react";
import { Modal, View, Text, Pressable } from "react-native";

interface CashPaymentModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: (cashReceived: number) => void;
  subTotal: number;
}

/**
 * CashPaymentModal - Cash payment with change calculation
 * Shows numeric keypad for entering received amount
 */
export function CashPaymentModal({
  visible,
  onClose,
  onConfirm,
  subTotal,
}: CashPaymentModalProps) {
  const [cashReceived, setCashReceived] = useState("");

  // Reset when modal opens
  useEffect(() => {
    if (visible) {
      setCashReceived("");
    }
  }, [visible]);

  const cashReceivedNum = parseFloat(cashReceived) || 0;
  const changeDue = Math.max(0, cashReceivedNum - subTotal);

  const handleNumberPress = (num: string) => {
    setCashReceived((prev) => prev + num);
  };

  const handleCancel = () => {
    setCashReceived("");
  };

  const handleCorrect = () => {
    setCashReceived((prev) => prev.slice(0, -1));
  };

  const handleConfirm = () => {
    if (cashReceivedNum >= subTotal) {
      onConfirm(cashReceivedNum);
      setCashReceived("");
    }
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
            <Text className="text-xl font-semibold text-gray-800">
              Total Cash Recieved
            </Text>
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

              {/* Cash Received */}
              <View className="flex-1">
                <Text className="text-gray-600 text-sm mb-2">Cash Recieved</Text>
                <View className="border-2 border-green-500 rounded-lg p-4 items-center bg-green-50">
                  <Text className="text-green-600 text-3xl font-bold">
                    {cashReceived || "0"}
                  </Text>
                </View>
              </View>

              {/* Change Due */}
              <View className="flex-1">
                <Text className="text-gray-600 text-sm mb-2">Change Due</Text>
                <View className="border-2 border-purple-500 rounded-lg p-4 items-center bg-purple-50">
                  <Text className="text-purple-600 text-3xl font-bold">
                    {changeDue.toFixed(0)}
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
                  <Pressable
                    onPress={() => handleNumberPress(".")}
                    className="flex-1 bg-gray-100 py-4 rounded-lg items-center justify-center border border-gray-200"
                    style={({ pressed }) => ({
                      backgroundColor: pressed ? "#d1d5db" : "#f3f4f6",
                    })}
                  >
                    <Text className="text-xl font-semibold text-gray-800">.</Text>
                  </Pressable>
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
                  className={`py-4 rounded-lg items-center justify-center flex-1 ${
                    cashReceivedNum >= subTotal ? "bg-green-500" : "bg-gray-300"
                  }`}
                  style={({ pressed }) => ({
                    opacity: pressed && cashReceivedNum >= subTotal ? 0.8 : 1,
                  })}
                  disabled={cashReceivedNum < subTotal}
                >
                  <Text
                    className={`font-semibold ${
                      cashReceivedNum >= subTotal ? "text-white" : "text-gray-500"
                    }`}
                  >
                    Confirm
                  </Text>
                </Pressable>
              </View>
            </View>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
