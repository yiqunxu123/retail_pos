import { Modal, View, Text, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";

interface ClockInModalProps {
  visible: boolean;
  onClose: () => void;
  onClockIn: (employeeId: string) => void;
}

/**
 * ClockInModal - Numeric keypad for entering employee ID
 * Displays a PIN-style input with number pad
 */
export function ClockInModal({ visible, onClose, onClockIn }: ClockInModalProps) {
  const [pin, setPin] = useState("");

  const handleNumberPress = (num: string) => {
    if (pin.length < 6) {
      setPin((prev) => prev + num);
    }
  };

  const handleClear = () => {
    setPin("");
  };

  const handleCorrect = () => {
    setPin((prev) => prev.slice(0, -1));
  };

  const handleClockIn = () => {
    if (pin.length > 0) {
      onClockIn(pin);
      setPin("");
    }
  };

  const handleClose = () => {
    setPin("");
    onClose();
  };

  // Number pad layout
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
      onRequestClose={handleClose}
    >
      <Pressable
        className="flex-1 bg-black/50 justify-center items-center"
        onPress={handleClose}
      >
        {/* Modal content - prevent close on inner press */}
        <Pressable
          className="bg-white rounded-xl w-[340px] overflow-hidden"
          onPress={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <View className="flex-row justify-between items-center px-4 py-3 border-b border-gray-200">
            <Text className="text-lg font-semibold text-gray-800">
              Enter your Clock In ID
            </Text>
            <Pressable
              onPress={handleClose}
              className="p-1"
              style={({ pressed }) => ({ opacity: pressed ? 0.5 : 1 })}
            >
              <Ionicons name="close" size={24} color="#6b7280" />
            </Pressable>
          </View>

          {/* PIN Display */}
          <View className="px-6 py-4">
            <View className="flex-row items-center gap-2 mb-4">
              <Ionicons name="person-outline" size={20} color="#6b7280" />
              <View className="flex-1 border-b-2 border-gray-300 py-2">
                <Text className="text-2xl font-bold text-gray-800 text-right tracking-[8px]">
                  {pin || " "}
                </Text>
              </View>
            </View>

            {/* Number Pad */}
            <View className="gap-2">
              {numberPad.map((row, rowIndex) => (
                <View key={rowIndex} className="flex-row gap-2">
                  {row.map((num) => (
                    <Pressable
                      key={num}
                      onPress={() => handleNumberPress(num)}
                      className="flex-1 bg-gray-100 py-4 rounded-lg items-center justify-center"
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

              {/* Bottom row: Cancel, 0, Correct */}
              <View className="flex-row gap-2">
                <Pressable
                  onPress={handleClear}
                  className="flex-1 bg-orange-500 py-4 rounded-lg items-center justify-center"
                  style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1 })}
                >
                  <Text className="text-white font-semibold">⊗ Cancel</Text>
                </Pressable>
                <Pressable
                  onPress={() => handleNumberPress("0")}
                  className="flex-1 bg-gray-100 py-4 rounded-lg items-center justify-center"
                  style={({ pressed }) => ({
                    backgroundColor: pressed ? "#d1d5db" : "#f3f4f6",
                  })}
                >
                  <Text className="text-xl font-semibold text-gray-800">0</Text>
                </Pressable>
                <Pressable
                  onPress={handleCorrect}
                  className="flex-1 bg-orange-500 py-4 rounded-lg items-center justify-center"
                  style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1 })}
                >
                  <Text className="text-white font-semibold">⊗ Correct</Text>
                </Pressable>
              </View>

              {/* Clock In button */}
              <Pressable
                onPress={handleClockIn}
                className={`py-4 rounded-lg items-center justify-center ${
                  pin.length > 0 ? "bg-green-500" : "bg-gray-300"
                }`}
                style={({ pressed }) => ({ opacity: pressed && pin.length > 0 ? 0.8 : 1 })}
                disabled={pin.length === 0}
              >
                <Text className={`font-semibold ${pin.length > 0 ? "text-white" : "text-gray-500"}`}>
                  Clock In
                </Text>
              </Pressable>
            </View>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
