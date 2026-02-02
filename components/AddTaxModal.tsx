import { Ionicons } from "@expo/vector-icons";
import { useState, useEffect } from "react";
import { Modal, View, Text, TouchableOpacity, TextInput, KeyboardAvoidingView, Platform } from "react-native";

type TaxType = "percentage" | "fixed";

interface AddTaxModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: (taxAmount: number, taxType: TaxType, taxName: string) => void;
  subTotal: number;
}

const PRESET_TAX_RATES = [
  { name: "State Tax", rate: 7 },
  { name: "Local Tax", rate: 2.25 },
  { name: "Vapor Tax", rate: 5 },
  { name: "Custom", rate: 0 },
];

/**
 * AddTaxModal - Add custom tax to order
 * Supports percentage or fixed amount tax
 */
export function AddTaxModal({
  visible,
  onClose,
  onConfirm,
  subTotal,
}: AddTaxModalProps) {
  const [taxValue, setTaxValue] = useState("");
  const [taxType, setTaxType] = useState<TaxType>("percentage");
  const [taxName, setTaxName] = useState("Custom Tax");
  const [selectedPreset, setSelectedPreset] = useState<number | null>(null);

  useEffect(() => {
    if (visible) {
      setTaxValue("");
      setTaxType("percentage");
      setTaxName("Custom Tax");
      setSelectedPreset(null);
    }
  }, [visible]);

  const taxValueNum = parseFloat(taxValue) || 0;
  const calculatedTax =
    taxType === "percentage" ? (subTotal * taxValueNum) / 100 : taxValueNum;

  const handlePresetSelect = (index: number) => {
    const preset = PRESET_TAX_RATES[index];
    setSelectedPreset(index);
    setTaxName(preset.name);
    if (preset.rate > 0) {
      setTaxValue(preset.rate.toString());
      setTaxType("percentage");
    } else {
      setTaxValue("");
    }
  };

  const handleConfirm = () => {
    if (taxValueNum > 0) {
      onConfirm(calculatedTax, taxType, taxName);
    }
  };

  const handleNumberPress = (num: string) => {
    setTaxValue((prev) => prev + num);
    setSelectedPreset(PRESET_TAX_RATES.length - 1); // Custom
  };

  const handleClear = () => {
    setTaxValue("");
  };

  const handleBackspace = () => {
    setTaxValue((prev) => prev.slice(0, -1));
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
            style={{ width: 500 }}
            activeOpacity={1}
            onPress={(e) => e.stopPropagation()}
          >
          {/* Header */}
          <View className="flex-row justify-between items-center px-6 py-4 border-b border-gray-200">
            <View className="flex-row items-center gap-3">
              <View className="w-10 h-10 bg-purple-100 rounded-full items-center justify-center">
                <Ionicons name="receipt-outline" size={24} color="#8B5CF6" />
              </View>
              <Text className="text-xl font-semibold text-gray-800">
                Add Tax
              </Text>
            </View>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color="#6b7280" />
            </TouchableOpacity>
          </View>

          {/* Content */}
          <View className="px-6 py-5">
            {/* Preset Tax Rates */}
            <View className="mb-4">
              <Text className="text-gray-600 text-sm mb-2">Quick Select Tax</Text>
              <View className="flex-row gap-2">
                {PRESET_TAX_RATES.map((preset, index) => (
                  <TouchableOpacity
                    key={preset.name}
                    onPress={() => handlePresetSelect(index)}
                    className={`flex-1 py-2 px-3 rounded-lg border ${
                      selectedPreset === index
                        ? "bg-purple-500 border-purple-500"
                        : "bg-white border-gray-200"
                    }`}
                  >
                    <Text
                      className={`text-center text-sm font-medium ${
                        selectedPreset === index ? "text-white" : "text-gray-700"
                      }`}
                    >
                      {preset.name}
                    </Text>
                    {preset.rate > 0 && (
                      <Text
                        className={`text-center text-xs ${
                          selectedPreset === index ? "text-white/80" : "text-gray-500"
                        }`}
                      >
                        {preset.rate}%
                      </Text>
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Tax Type Toggle */}
            <View className="flex-row gap-2 mb-4">
              <TouchableOpacity
                onPress={() => setTaxType("percentage")}
                className={`flex-1 py-2 rounded-lg border ${
                  taxType === "percentage"
                    ? "bg-purple-500 border-purple-500"
                    : "bg-white border-gray-200"
                }`}
              >
                <Text
                  className={`text-center font-medium ${
                    taxType === "percentage" ? "text-white" : "text-gray-700"
                  }`}
                >
                  Percentage (%)
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setTaxType("fixed")}
                className={`flex-1 py-2 rounded-lg border ${
                  taxType === "fixed"
                    ? "bg-purple-500 border-purple-500"
                    : "bg-white border-gray-200"
                }`}
              >
                <Text
                  className={`text-center font-medium ${
                    taxType === "fixed" ? "text-white" : "text-gray-700"
                  }`}
                >
                  Fixed Amount ($)
                </Text>
              </TouchableOpacity>
            </View>

            {/* Tax Name Input */}
            <View className="mb-4">
              <Text className="text-gray-600 text-sm mb-2">Tax Name</Text>
              <TextInput
                className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-3"
                placeholder="Enter tax name"
                placeholderTextColor="#9ca3af"
                value={taxName}
                onChangeText={setTaxName}
              />
            </View>

            {/* Value Display and Keypad */}
            <View className="flex-row gap-4">
              {/* Display */}
              <View className="flex-1">
                <View className="flex-row gap-3 mb-3">
                  <View className="flex-1">
                    <Text className="text-gray-600 text-sm mb-2">Sub Total</Text>
                    <View className="border border-gray-200 rounded-lg p-3 bg-gray-50">
                      <Text className="text-gray-800 text-lg text-center">
                        ${subTotal.toFixed(2)}
                      </Text>
                    </View>
                  </View>
                  <View className="flex-1">
                    <Text className="text-gray-600 text-sm mb-2">
                      Tax {taxType === "percentage" ? "Rate" : "Amount"}
                    </Text>
                    <View className="border-2 border-purple-500 rounded-lg p-3 bg-purple-50">
                      <Text className="text-purple-600 text-lg text-center font-bold">
                        {taxType === "percentage" ? `${taxValue || "0"}%` : `$${taxValue || "0"}`}
                      </Text>
                    </View>
                  </View>
                </View>
                <View>
                  <Text className="text-gray-600 text-sm mb-2">Tax Amount</Text>
                  <View className="border-2 border-green-500 rounded-lg p-3 bg-green-50">
                    <Text className="text-green-600 text-xl text-center font-bold">
                      ${calculatedTax.toFixed(2)}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Number Pad */}
              <View className="w-40">
                {numberPad.map((row, rowIndex) => (
                  <View key={rowIndex} className="flex-row gap-1 mb-1">
                    {row.map((num) => (
                      <TouchableOpacity
                        key={num}
                        onPress={() => handleNumberPress(num)}
                        className="flex-1 bg-gray-100 py-3 rounded items-center border border-gray-200"
                        activeOpacity={0.7}
                      >
                        <Text className="text-lg font-medium text-gray-800">{num}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                ))}
                <View className="flex-row gap-1 mb-1">
                  <TouchableOpacity
                    onPress={() => handleNumberPress("0")}
                    className="flex-1 bg-gray-100 py-3 rounded items-center border border-gray-200"
                    activeOpacity={0.7}
                  >
                    <Text className="text-lg font-medium text-gray-800">0</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => handleNumberPress(".")}
                    className="flex-1 bg-gray-100 py-3 rounded items-center border border-gray-200"
                    activeOpacity={0.7}
                  >
                    <Text className="text-lg font-medium text-gray-800">.</Text>
                  </TouchableOpacity>
                </View>
                <View className="flex-row gap-1">
                  <TouchableOpacity
                    onPress={handleClear}
                    className="flex-1 bg-red-100 py-3 rounded items-center"
                    activeOpacity={0.7}
                  >
                    <Text className="text-red-500 font-medium">C</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={handleBackspace}
                    className="flex-1 bg-red-100 py-3 rounded items-center"
                    activeOpacity={0.7}
                  >
                    <Ionicons name="backspace-outline" size={20} color="#EF4444" />
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            {/* Action Buttons */}
            <View className="flex-row gap-3 mt-5">
              <TouchableOpacity
                onPress={onClose}
                className="flex-1 border border-gray-300 rounded-lg py-3 items-center"
              >
                <Text className="text-gray-700 font-medium">Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleConfirm}
                className={`flex-1 rounded-lg py-3 items-center ${
                  taxValueNum > 0 ? "bg-purple-500" : "bg-gray-300"
                }`}
                disabled={taxValueNum <= 0}
              >
                <Text
                  className={`font-medium ${
                    taxValueNum > 0 ? "text-white" : "text-gray-500"
                  }`}
                >
                  Add Tax
                </Text>
              </TouchableOpacity>
            </View>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </Modal>
  );
}
