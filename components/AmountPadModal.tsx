import { colors, iconSize } from "@/utils/theme";
import { Ionicons } from "@expo/vector-icons";
import { Modal, Pressable, Text, View } from "react-native";

export interface AmountPadOption {
  label: string;
  value: string;
}

export interface AmountPadSummaryCard {
  label: string;
  value: string;
  valueColorClassName: string;
}

interface AmountPadModalProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  showTypeSelector?: boolean;
  typeLabel?: string;
  typeOptions?: AmountPadOption[];
  showTypeDropdown?: boolean;
  onToggleTypeDropdown?: () => void;
  onSelectType?: (value: string) => void;
  summaryCards: [AmountPadSummaryCard, AmountPadSummaryCard, AmountPadSummaryCard];
  onNumberPress: (num: string) => void;
  showZeroKey?: boolean;
  showDecimalKey?: boolean;
  onDecimalPress?: () => void;
  onCancelAction: () => void;
  onCorrectAction: () => void;
  onConfirmAction: () => void;
  confirmDisabled?: boolean;
  modalWidth?: number;
}

const NUMBER_PAD = [
  ["1", "2", "3"],
  ["4", "5", "6"],
  ["7", "8", "9"],
];

/**
 * Shared amount keypad modal used by Add Discount / Add Tax.
 */
export function AmountPadModal({
  visible,
  onClose,
  title,
  showTypeSelector = true,
  typeLabel,
  typeOptions = [],
  showTypeDropdown = false,
  onToggleTypeDropdown,
  onSelectType,
  summaryCards,
  onNumberPress,
  showZeroKey = true,
  showDecimalKey = false,
  onDecimalPress,
  onCancelAction,
  onCorrectAction,
  onConfirmAction,
  confirmDisabled = false,
  modalWidth = 690,
}: AmountPadModalProps) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable className="flex-1 bg-black/35 justify-center items-center" onPress={onClose}>
        <Pressable
          className="bg-white rounded-2xl overflow-hidden" style={{ width: modalWidth, borderWidth: 1, borderColor: colors.border }}
          onPress={(e) => e.stopPropagation()}
        >
          <View className="flex-row justify-between items-center px-5 py-3.5" style={{ borderBottomWidth: 1, borderBottomColor: colors.border }}>
            <View className="flex-row items-center gap-4">
              <Text className="text-2xl font-semibold text-gray-800 flex-shrink">{title}</Text>
              {showTypeSelector && typeLabel && (
                <View className="relative">
                  <Pressable
                    onPress={onToggleTypeDropdown}
                    className="flex-row items-center bg-white border border-[#D9B8C6] px-3 py-1.5 rounded-md gap-2"
                  >
                    <Text className="text-[#D53A66] text-[15px] font-medium">{typeLabel}</Text>
                    <Ionicons name="chevron-down" size={iconSize.md} color={colors.textTertiary} />
                  </Pressable>
                  {showTypeDropdown && (
                    <View className="absolute top-10 left-0 bg-white border border-gray-200 rounded-lg shadow-lg z-10 min-w-[190px]">
                      {typeOptions.map((option, idx) => (
                        <Pressable
                          key={option.value}
                          onPress={() => onSelectType?.(option.value)}
                          className={`px-4 py-2 ${idx < typeOptions.length - 1 ? "border-b border-gray-100" : ""}`}
                        >
                          <Text className="text-gray-700">{option.label}</Text>
                        </Pressable>
                      ))}
                    </View>
                  )}
                </View>
              )}
            </View>
            <Pressable onPress={onClose} style={({ pressed }) => ({ opacity: pressed ? 0.5 : 1 })}>
              <Ionicons name="close" size={iconSize['2xl']} color={colors.textDark} />
            </Pressable>
          </View>

          <View className="px-4 pt-4 pb-5">
            <View className="flex-row gap-3 mb-3">
              {summaryCards.map((card) => (
                <View key={card.label} className="flex-1">
                  <Text style={{ color: colors.text }} className="text-[17px] font-semibold mb-2">{card.label}</Text>
                  <View
                    className="rounded-lg bg-[#F6F7F9] px-4 py-4 border border-[#E4E7EC] justify-center"
                    style={{
                      shadowColor: "#000",
                      shadowOffset: { width: 0, height: 3 },
                      shadowOpacity: 0.08,
                      shadowRadius: 5,
                      elevation: 2,
                      minHeight: 110,
                    }}
                  >
                    <Text className={`${card.valueColorClassName} text-[44px] leading-[50px] font-bold text-right w-full`}>
                      {card.value}
                    </Text>
                  </View>
                </View>
              ))}
            </View>

            <View className="flex-row gap-3 items-stretch">
              <View className="flex-1 gap-2">
                {NUMBER_PAD.map((row, rowIndex) => (
                  <View key={rowIndex} className="flex-row gap-2">
                    {row.map((num) => (
                      <Pressable
                        key={num}
                        onPress={() => onNumberPress(num)}
                        className="flex-1 bg-white h-16 rounded-xl items-center justify-center border border-gray-200"
                        style={({ pressed }) => ({
                          backgroundColor: pressed ? "#E7EBF1" : "#FFFFFF",
                        })}
                      >
                        <Text className="text-[30px] leading-[34px] font-semibold text-gray-800">{num}</Text>
                      </Pressable>
                    ))}
                  </View>
                ))}
                {(showZeroKey || showDecimalKey) && (
                  <View className="flex-row gap-2">
                    {showZeroKey && (
                      <Pressable
                        onPress={() => onNumberPress("0")}
                        className="flex-1 bg-white h-16 rounded-xl items-center justify-center border border-gray-200"
                        style={({ pressed }) => ({
                          backgroundColor: pressed ? "#E7EBF1" : "#FFFFFF",
                        })}
                      >
                        <Text className="text-[30px] leading-[34px] font-semibold text-gray-800">0</Text>
                      </Pressable>
                    )}
                    {showDecimalKey && (
                      <Pressable
                        onPress={onDecimalPress}
                        className="flex-1 bg-white h-16 rounded-xl items-center justify-center border border-gray-200"
                        style={({ pressed }) => ({
                          backgroundColor: pressed ? "#E7EBF1" : "#FFFFFF",
                        })}
                      >
                        <Text className="text-[30px] leading-[34px] font-semibold text-gray-800">.</Text>
                      </Pressable>
                    )}
                  </View>
                )}
              </View>

              <View className="w-52 gap-2">
                <Pressable
                  onPress={onCancelAction}
                  className="bg-[#E65B22] h-16 w-full rounded-xl items-center justify-center flex-row gap-2"
                  style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1 })}
                >
                  <Ionicons name="close-circle-outline" size={iconSize.md} color="#FFFFFF" />
                  <Text className="text-white text-[17px] font-semibold">Cancel</Text>
                </Pressable>
                <Pressable
                  onPress={onCorrectAction}
                  className="border border-[#D9C2CC] h-16 w-full rounded-xl items-center justify-center bg-white flex-row gap-2"
                  style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1 })}
                >
                  <Ionicons name="backspace-outline" size={iconSize.md} color="#B85A7B" />
                  <Text className="text-[#B85A7B] text-[17px] font-semibold">Correct</Text>
                </Pressable>
                <Pressable
                  onPress={onConfirmAction}
                  className="h-16 w-full rounded-xl items-center justify-center border"
                  style={({ pressed }) => ({
                    ...(confirmDisabled 
                      ? { backgroundColor: colors.borderMedium, borderColor: colors.borderMedium } 
                      : { backgroundColor: colors.primary, borderColor: '#D51549', borderWidth: 1 }),
                    opacity: pressed ? 0.8 : 1,
                  })}
                  disabled={confirmDisabled}
                >
                  <Text className={confirmDisabled ? "text-[17px] font-semibold" : "text-white text-[17px] font-semibold"} style={confirmDisabled ? { color: colors.textSecondary } : undefined}>
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
