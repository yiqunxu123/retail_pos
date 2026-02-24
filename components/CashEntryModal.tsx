import { buttonSize, colors, iconSize, modalContent } from "@/utils/theme";
import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import { Pressable, Text, TouchableOpacity, View } from "react-native";
import { CenteredModal } from "./CenteredModal";

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
    <CenteredModal
      visible={visible}
      onClose={onClose}
      size="md"
      showCloseButton={false}
      header={
        <View className="flex-row justify-between items-center flex-1">
          <Text className="text-2xl font-semibold" style={{ color: colors.text }}>Enter Actual Cash</Text>
          <Pressable onPress={onClose} style={({ pressed }) => ({ opacity: pressed ? 0.55 : 1 })}>
            <Ionicons name="close" size={iconSize['2xl']} color={colors.textDark} />
          </Pressable>
        </View>
      }
    >
      {/* Content */}
          <View className="px-4 pt-4 pb-5">
            {/* Amount Display */}
            <View className="flex-row gap-3 mb-4">
              {/* Expected Cash */}
              <View className="flex-1">
                <Text className="mb-2" style={{ fontSize: modalContent.titleFontSize, fontWeight: modalContent.titleFontWeight, color: modalContent.titleColor }}>Expected Cash</Text>
                <View
                  className="justify-center"
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
                  <Text className="font-bold text-right w-full" style={{ fontSize: modalContent.valueXlFontSize, color: "#7c3aed" }}>
                    ${expectedCash.toFixed(0)}
                  </Text>
                </View>
              </View>

              {/* Actual Cash */}
              <View className="flex-1">
                <Text className="mb-2" style={{ fontSize: modalContent.titleFontSize, fontWeight: modalContent.titleFontWeight, color: modalContent.titleColor }}>Actual Cash</Text>
                <View
                  className="justify-center"
                  style={{
                    backgroundColor: "#ECFDF5",
                    borderWidth: modalContent.boxBorderWidth,
                    borderColor: colors.success,
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
                  <Text className="font-bold text-right w-full" style={{ fontSize: modalContent.valueXlFontSize, color: "#16a34a" }}>
                    ${cashAmount || "0"}
                  </Text>
                </View>
              </View>

              {/* Difference */}
              <View className="flex-1">
                <Text className="mb-2" style={{ fontSize: modalContent.titleFontSize, fontWeight: modalContent.titleFontWeight, color: modalContent.titleColor }}>Difference</Text>
                <View
                  className="justify-center"
                  style={{
                    backgroundColor: difference === 0 ? "#ECFDF5" : difference > 0 ? "#EFF6FF" : "#FEF2F2",
                    borderWidth: modalContent.boxBorderWidth,
                    borderColor: difference === 0 ? colors.success : difference > 0 ? colors.info : colors.error,
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
                  <Text
                    className="font-bold text-right w-full"
                    style={{ fontSize: modalContent.valueXlFontSize, color: difference === 0 ? "#16a34a" : difference > 0 ? "#2563eb" : "#ef4444" }}
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
                        className="flex-1 py-4 items-center justify-center"
                        style={{ backgroundColor: modalContent.boxBackgroundAlt, borderRadius: modalContent.boxRadius, borderWidth: modalContent.boxBorderWidth, borderColor: modalContent.boxBorderColor }}
                        activeOpacity={0.7}
                      >
                        <Text style={{ fontSize: modalContent.valueLargeFontSize, fontWeight: modalContent.titleFontWeight, color: modalContent.valueColor }}>
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
                    style={{ flex: 1, backgroundColor: modalContent.boxBackgroundAlt, paddingVertical: 16, borderRadius: modalContent.boxRadius, borderWidth: modalContent.boxBorderWidth, borderColor: modalContent.boxBorderColor, alignItems: 'center', justifyContent: 'center' }}
                    activeOpacity={0.7}
                  >
                    <Text style={{ fontSize: modalContent.valueLargeFontSize, fontWeight: modalContent.titleFontWeight, color: modalContent.valueColor }}>0</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => handleNumberPress(".")}
                    style={{ flex: 1, backgroundColor: modalContent.boxBackgroundAlt, paddingVertical: 16, borderRadius: modalContent.boxRadius, borderWidth: modalContent.boxBorderWidth, borderColor: modalContent.boxBorderColor, alignItems: 'center', justifyContent: 'center' }}
                    activeOpacity={0.7}
                  >
                    <Text style={{ fontSize: modalContent.valueLargeFontSize, fontWeight: modalContent.titleFontWeight, color: modalContent.valueColor }}>.</Text>
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
    </CenteredModal>
  );
}
