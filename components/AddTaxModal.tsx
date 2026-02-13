import { Ionicons } from "@expo/vector-icons";
import { useEffect, useMemo, useState } from "react";
import { Modal, Pressable, Text, View } from "react-native";

type TaxType = "percentage" | "fixed";

interface AddTaxModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: (taxAmount: number, taxType: TaxType, taxName: string) => void;
  subTotal: number;
}

/**
 * AddTaxModal - aligned to Add Tax visual draft and current POS modal scale.
 */
export function AddTaxModal({
  visible,
  onClose,
  onConfirm,
  subTotal,
}: AddTaxModalProps) {
  const [taxValue, setTaxValue] = useState("");
  const [taxType, setTaxType] = useState<TaxType>("percentage");
  const [showTypeDropdown, setShowTypeDropdown] = useState(false);

  useEffect(() => {
    if (!visible) return;
    setTaxValue("");
    setTaxType("percentage");
    setShowTypeDropdown(false);
  }, [visible]);

  const taxNum = useMemo(() => Number.parseFloat(taxValue) || 0, [taxValue]);
  const taxAmount = useMemo(
    () => (taxType === "percentage" ? (subTotal * taxNum) / 100 : taxNum),
    [subTotal, taxNum, taxType]
  );
  const totalAfterTax = useMemo(() => subTotal + taxAmount, [subTotal, taxAmount]);

  const handleNumberPress = (num: string) => {
    if (taxType === "percentage") {
      const next = taxValue + num;
      if ((Number.parseFloat(next) || 0) <= 100) {
        setTaxValue(next);
      }
      return;
    }
    setTaxValue((prev) => prev + num);
  };

  const handleCorrect = () => {
    setTaxValue((prev) => prev.slice(0, -1));
  };

  const handleConfirm = () => {
    const taxName = taxType === "percentage" ? "Percentage Tax" : "Fixed Tax";
    onConfirm(taxAmount, taxType, taxName);
    setTaxValue("");
    setShowTypeDropdown(false);
  };

  const numberPad = [
    ["1", "2", "3"],
    ["4", "5", "6"],
    ["7", "8", "9"],
  ];

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable className="flex-1 bg-black/35 justify-center items-center" onPress={onClose}>
        <Pressable
          className="bg-white rounded-2xl overflow-hidden border border-[#E5E7EB]"
          style={{ width: 690 }}
          onPress={(e) => e.stopPropagation()}
        >
          <View className="flex-row justify-between items-center px-5 py-2.5 border-b border-[#E5E7EB]">
            <View className="flex-row items-center gap-4">
              <Text className="text-2xl font-semibold text-gray-800">Add Tax</Text>
              <View className="relative">
                <Pressable
                  onPress={() => setShowTypeDropdown((prev) => !prev)}
                  className="flex-row items-center bg-white border border-[#D9B8C6] px-3 py-1.5 rounded-md gap-2"
                >
                  <Text className="text-[#D53A66] text-[15px] font-medium">
                    {taxType === "percentage" ? "Percentage (%)" : "Fixed Amount ($)"}
                  </Text>
                  <Ionicons name="chevron-down" size={16} color="#9CA3AF" />
                </Pressable>
                {showTypeDropdown && (
                  <View className="absolute top-10 left-0 bg-white border border-gray-200 rounded-lg shadow-lg z-10 min-w-[190px]">
                    <Pressable
                      onPress={() => {
                        setTaxType("percentage");
                        setTaxValue("");
                        setShowTypeDropdown(false);
                      }}
                      className="px-4 py-2 border-b border-gray-100"
                    >
                      <Text className="text-gray-700">Percentage (%)</Text>
                    </Pressable>
                    <Pressable
                      onPress={() => {
                        setTaxType("fixed");
                        setTaxValue("");
                        setShowTypeDropdown(false);
                      }}
                      className="px-4 py-2"
                    >
                      <Text className="text-gray-700">Fixed Amount ($)</Text>
                    </Pressable>
                  </View>
                )}
              </View>
            </View>
            <Pressable onPress={onClose} style={({ pressed }) => ({ opacity: pressed ? 0.5 : 1 })}>
              <Ionicons name="close" size={26} color="#1f2937" />
            </Pressable>
          </View>

          <View className="px-4 pt-2.5 pb-3">
            <View className="flex-row gap-3 mb-2.5">
              <View className="flex-1">
                <Text className="text-[#111827] text-[17px] font-semibold mb-1.5">Sub Total</Text>
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
                  <Text className="text-[#E33163] text-[44px] leading-[50px] font-bold text-right w-full">
                    {subTotal.toFixed(0)}
                  </Text>
                </View>
              </View>

              <View className="flex-1">
                <Text className="text-[#111827] text-[17px] font-semibold mb-1.5">Tax Amount</Text>
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
                  <Text className="text-[#16A085] text-[44px] leading-[50px] font-bold text-right w-full">
                    {taxType === "percentage" ? `${taxValue || "0"}%` : taxValue || "0"}
                  </Text>
                </View>
              </View>

              <View className="flex-1">
                <Text className="text-[#111827] text-[17px] font-semibold mb-1.5">Total After Tax</Text>
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
                  <Text className="text-[#2A2FB2] text-[44px] leading-[50px] font-bold text-right w-full">
                    {totalAfterTax.toFixed(0)}
                  </Text>
                </View>
              </View>
            </View>

            <View className="flex-row gap-3 items-stretch">
              <View className="flex-1 gap-2">
                {numberPad.map((row, rowIndex) => (
                  <View key={rowIndex} className="flex-row gap-2">
                    {row.map((num) => (
                      <Pressable
                        key={num}
                        onPress={() => handleNumberPress(num)}
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
                <View className="flex-row gap-2">
                  <Pressable
                    onPress={() => handleNumberPress("0")}
                    className="flex-1 bg-white h-16 rounded-xl items-center justify-center border border-gray-200"
                    style={({ pressed }) => ({
                      backgroundColor: pressed ? "#E7EBF1" : "#FFFFFF",
                    })}
                  >
                    <Text className="text-[30px] leading-[34px] font-semibold text-gray-800">0</Text>
                  </Pressable>
                </View>
              </View>

              <View className="w-52 gap-2">
                <Pressable
                  onPress={onClose}
                  className="bg-[#E65B22] h-16 w-full rounded-xl items-center justify-center flex-row gap-2"
                  style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1 })}
                >
                  <Ionicons name="close-circle-outline" size={18} color="#FFFFFF" />
                  <Text className="text-white text-[17px] font-semibold">Cancel</Text>
                </Pressable>
                <Pressable
                  onPress={handleCorrect}
                  className="border border-[#D9C2CC] h-16 w-full rounded-xl items-center justify-center bg-white flex-row gap-2"
                  style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1 })}
                >
                  <Ionicons name="backspace-outline" size={18} color="#B85A7B" />
                  <Text className="text-[#B85A7B] text-[17px] font-semibold">Correct</Text>
                </Pressable>
                <Pressable
                  onPress={handleConfirm}
                  className="h-16 w-full rounded-xl items-center justify-center border bg-[#EC1A52] border-[#D51549]"
                  style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1 })}
                >
                  <Text className="text-white text-[17px] font-semibold">Confirm</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
