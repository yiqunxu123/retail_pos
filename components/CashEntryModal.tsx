import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useState, useEffect } from "react";
import { Modal, View, Text, TouchableOpacity } from "react-native";

interface CashEntryModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: (actualCash: number) => void;
  expectedCash: number;
}

/**
 * CashEntryModal - Enter actual cash in drawer
 * Shows numeric keypad for entering cash amount
 */
export function CashEntryModal({
  visible,
  onClose,
  onConfirm,
  expectedCash,
}: CashEntryModalProps) {
  const [cashAmount, setCashAmount] = useState("");

  useEffect(() => {
    if (visible) {
      setCashAmount("");
    }
  }, [visible]);

  const cashAmountNum = parseFloat(cashAmount) || 0;
  const difference = cashAmountNum - expectedCash;

  const handleNumberPress = (num: string) => {
    setCashAmount((prev) => prev + num);
  };

  const handleClear = () => {
    setCashAmount("");
  };

  const handleBackspace = () => {
    setCashAmount((prev) => prev.slice(0, -1));
  };

  const handleConfirm = () => {
    onConfirm(cashAmountNum);
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
      <TouchableOpacity
        className="flex-1 bg-black/50 justify-center items-center"
        activeOpacity={1}
        onPress={onClose}
      >
        <TouchableOpacity
          className="bg-white rounded-xl overflow-hidden"
          style={{ width: 480 }}
          activeOpacity={1}
          onPress={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <View className="flex-row justify-between items-center px-6 py-4 border-b border-gray-200">
            <View className="flex-row items-center gap-3">
              <View className="w-10 h-10 bg-green-100 rounded-full items-center justify-center">
                <MaterialCommunityIcons name="cash" size={24} color="#10B981" />
              </View>
              <Text className="text-xl font-semibold text-gray-800">
                Enter Actual Cash
              </Text>
            </View>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color="#6b7280" />
            </TouchableOpacity>
          </View>

          {/* Content */}
          <View className="px-6 py-5">
            {/* Amount Display */}
            <View className="flex-row gap-4 mb-6">
              {/* Expected Cash */}
              <View className="flex-1">
                <Text className="text-gray-600 text-sm mb-2">Expected Cash</Text>
                <View className="border-2 border-gray-300 rounded-lg p-4 items-center">
                  <Text className="text-purple-600 text-2xl font-bold">
                    ${expectedCash.toFixed(2)}
                  </Text>
                </View>
              </View>

              {/* Actual Cash */}
              <View className="flex-1">
                <Text className="text-gray-600 text-sm mb-2">Actual Cash</Text>
                <View className="border-2 border-green-500 rounded-lg p-4 items-center bg-green-50">
                  <Text className="text-green-600 text-2xl font-bold">
                    ${cashAmount || "0.00"}
                  </Text>
                </View>
              </View>

              {/* Difference */}
              <View className="flex-1">
                <Text className="text-gray-600 text-sm mb-2">Difference</Text>
                <View
                  className={`border-2 rounded-lg p-4 items-center ${
                    difference === 0
                      ? "border-green-500 bg-green-50"
                      : difference > 0
                      ? "border-blue-500 bg-blue-50"
                      : "border-red-500 bg-red-50"
                  }`}
                >
                  <Text
                    className={`text-2xl font-bold ${
                      difference === 0
                        ? "text-green-600"
                        : difference > 0
                        ? "text-blue-600"
                        : "text-red-500"
                    }`}
                  >
                    {difference >= 0 ? "+" : ""}${difference.toFixed(2)}
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
                      <TouchableOpacity
                        key={num}
                        onPress={() => handleNumberPress(num)}
                        className="flex-1 bg-gray-100 py-4 rounded-lg items-center justify-center border border-gray-200"
                        activeOpacity={0.7}
                      >
                        <Text className="text-xl font-semibold text-gray-800">
                          {num}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                ))}
                {/* Bottom row */}
                <View className="flex-row gap-2">
                  <TouchableOpacity
                    onPress={() => handleNumberPress("0")}
                    className="flex-1 bg-gray-100 py-4 rounded-lg items-center justify-center border border-gray-200"
                    activeOpacity={0.7}
                  >
                    <Text className="text-xl font-semibold text-gray-800">0</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => handleNumberPress(".")}
                    className="flex-1 bg-gray-100 py-4 rounded-lg items-center justify-center border border-gray-200"
                    activeOpacity={0.7}
                  >
                    <Text className="text-xl font-semibold text-gray-800">.</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Action Buttons */}
              <View className="w-28 gap-2">
                <TouchableOpacity
                  onPress={handleClear}
                  className="bg-red-500 py-4 rounded-lg items-center justify-center flex-1"
                  activeOpacity={0.7}
                >
                  <Text className="text-white font-semibold">Clear</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleBackspace}
                  className="border-2 border-red-500 py-4 rounded-lg items-center justify-center flex-1"
                  activeOpacity={0.7}
                >
                  <Ionicons name="backspace-outline" size={24} color="#EF4444" />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleConfirm}
                  className={`py-4 rounded-lg items-center justify-center flex-1 ${
                    cashAmount ? "bg-green-500" : "bg-gray-300"
                  }`}
                  activeOpacity={0.7}
                  disabled={!cashAmount}
                >
                  <Text
                    className={`font-semibold ${
                      cashAmount ? "text-white" : "text-gray-500"
                    }`}
                  >
                    Confirm
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}
