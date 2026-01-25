import { Modal, View, Text, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface ClockOutModalProps {
  visible: boolean;
  onClose: () => void;
  onClockOut: () => void;
}

/**
 * ClockOutModal - Confirmation dialog for clocking out
 * Shows warning message and confirm/cancel buttons
 */
export function ClockOutModal({ visible, onClose, onClockOut }: ClockOutModalProps) {
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
        {/* Modal content */}
        <Pressable
          className="bg-white rounded-xl w-[380px] overflow-hidden"
          onPress={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <View className="flex-row justify-between items-center px-4 py-3 border-b border-gray-200">
            <Text className="text-lg font-semibold text-gray-800">
              Clock Out
            </Text>
            <Pressable
              onPress={onClose}
              className="p-1"
              style={({ pressed }) => ({ opacity: pressed ? 0.5 : 1 })}
            >
              <Ionicons name="close" size={24} color="#6b7280" />
            </Pressable>
          </View>

          {/* Content */}
          <View className="px-6 py-6">
            <Text className="text-gray-700 text-center text-base leading-6">
              Are you sure you want to clock out?
            </Text>
            <Text className="text-gray-500 text-center text-sm mt-2 leading-5">
              Any active work session will be ended, and you will be logged out of the system.
            </Text>
          </View>

          {/* Actions */}
          <View className="flex-row gap-3 px-6 pb-6">
            <Pressable
              onPress={onClose}
              className="flex-1 border border-orange-500 py-3 rounded-lg items-center"
              style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
            >
              <Text className="text-orange-500 font-semibold">⊗ Cancel</Text>
            </Pressable>
            <Pressable
              onPress={onClockOut}
              className="flex-1 bg-red-500 py-3 rounded-lg items-center"
              style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1 })}
            >
              <Text className="text-white font-semibold">Clock Out</Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
