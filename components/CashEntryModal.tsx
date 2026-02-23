import { buttonSize, colors, iconSize } from "@/utils/theme";
import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import { Modal, Pressable, Text, TouchableOpacity, View } from "react-native";

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
        className="flex-1 bg-black/45 justify-center items-center px-4"
        activeOpacity={1}
        onPress={onClose}
      >
        <TouchableOpacity
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
          activeOpacity={1}
          onPress={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <View className="flex-row justify-between items-center px-5 py-4 border-b border-[#E4E7EC]">
            <Text className="text-2xl font-semibold" style={{ color: colors.text }}>Enter Actual Cash</Text>
            <Pressable onPress={onClose} style={({ pressed }) => ({ opacity: pressed ? 0.55 : 1 })}>
              <Ionicons name="close" size={iconSize['2xl']} color={colors.textDark} />
            </Pressable>
          </View>

          {/* Content */}
          <View className="px-4 pt-4 pb-5">
            {/* Amount Display */}
            <View className="flex-row gap-3 mb-4">
              {/* Expected Cash */}
              <View className="flex-1">
                <Text className="text-lg font-semibold mb-2" style={{ color: colors.textDark }}>Expected Cash</Text>
                <View
                  className="rounded-lg px-4 py-4 justify-center"
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
                  <Text className="text-purple-600 text-5xl font-bold text-right w-full">
                    ${expectedCash.toFixed(0)}
                  </Text>
                </View>
              </View>

              {/* Actual Cash */}
              <View className="flex-1">
                <Text className="text-lg font-semibold mb-2" style={{ color: colors.textDark }}>Actual Cash</Text>
                <View
                  className="rounded-lg px-4 py-4 justify-center"
                  style={{
                    backgroundColor: "#ECFDF5",
                    borderWidth: 1,
                    borderColor: colors.success,
                    minHeight: 100,
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 3 },
                    shadowOpacity: 0.07,
                    shadowRadius: 5,
                    elevation: 2,
                  }}
                >
                  <Text className="text-green-600 text-5xl font-bold text-right w-full">
                    ${cashAmount || "0"}
                  </Text>
                </View>
              </View>

              {/* Difference */}
              <View className="flex-1">
                <Text className="text-lg font-semibold mb-2" style={{ color: colors.textDark }}>Difference</Text>
                <View
                  className="rounded-lg px-4 py-4 justify-center"
                  style={{
                    backgroundColor: difference === 0 ? "#ECFDF5" : difference > 0 ? "#EFF6FF" : "#FEF2F2",
                    borderWidth: 1,
                    borderColor: difference === 0 ? colors.success : difference > 0 ? colors.info : colors.error,
                    minHeight: 100,
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 3 },
                    shadowOpacity: 0.07,
                    shadowRadius: 5,
                    elevation: 2,
                  }}
                >
                  <Text
                    className={`text-5xl font-bold text-right w-full ${
                      difference === 0
                        ? "text-green-600"
                        : difference > 0
                        ? "text-blue-600"
                        : "text-red-500"
                    }`}
                  >
                    {difference >= 0 ? "+" : ""}${difference.toFixed(0)}
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
                        className="flex-1 bg-[#F4F5F7] py-4 rounded-lg items-center justify-center border border-[#E4E7EC]"
                        activeOpacity={0.7}
                      >
                        <Text className="text-2xl font-semibold text-gray-800">
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
                    className="flex-1 bg-[#F4F5F7] py-4 rounded-lg items-center justify-center border border-[#E4E7EC]"
                    activeOpacity={0.7}
                  >
                    <Text className="text-2xl font-semibold text-gray-800">0</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => handleNumberPress(".")}
                    className="flex-1 bg-[#F4F5F7] py-4 rounded-lg items-center justify-center border border-[#E4E7EC]"
                    activeOpacity={0.7}
                  >
                    <Text className="text-2xl font-semibold text-gray-800">.</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Action Buttons */}
              <View className="w-28 gap-2">
                <TouchableOpacity
                  onPress={handleClear}
                  style={{ flex: 1, paddingVertical: 16, backgroundColor: colors.error, borderRadius: buttonSize.md.borderRadius, alignItems: 'center', justifyContent: 'center' }}
                  activeOpacity={0.7}
                >
                  <Text className="text-white font-semibold">Clear</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleBackspace}
                  style={{ flex: 1, paddingVertical: 16, borderWidth: 2, borderColor: colors.error, borderRadius: buttonSize.md.borderRadius, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background }}
                  activeOpacity={0.7}
                >
                  <Ionicons name="backspace-outline" size={iconSize.xl} color={colors.error} />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleConfirm}
                  style={{ 
                    flex: 1, 
                    paddingVertical: 16, 
                    borderRadius: buttonSize.md.borderRadius, 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    backgroundColor: cashAmount ? colors.success : colors.borderMedium
                  }}
                  activeOpacity={0.7}
                  disabled={!cashAmount}
                >
                  <Text
                    className="text-lg font-semibold"
                    style={{ color: cashAmount ? colors.textWhite : colors.textSecondary }}
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
