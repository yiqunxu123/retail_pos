import { Ionicons } from "@expo/vector-icons";
import { Modal, Pressable, Text, View } from "react-native";
import { iconSize, colors, buttonSize } from "@/utils/theme";
import { ThemedButton } from "./ThemedButton";

interface ClockOutModalProps {
  visible: boolean;
  onClose: () => void;
  onDeclareCash: () => void;
  onClockOut: () => void;
}

/**
 * ClockOutModal - Clock out confirmation aligned to staff dashboard visual.
 */
export function ClockOutModal({
  visible,
  onClose,
  onDeclareCash,
  onClockOut,
}: ClockOutModalProps) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable className="flex-1 bg-black/45 justify-center items-center px-4" onPress={onClose}>
        <Pressable
          className="bg-white rounded-xl overflow-hidden"
          style={{
            borderWidth: 1, borderColor: colors.border,
            width: "92%",
            maxWidth: 680,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.2,
            shadowRadius: 20,
            elevation: 8,
          }}
          onPress={(e) => e.stopPropagation()}
        >
          <View className="flex-row justify-between items-center px-5 py-3" style={{ borderBottomWidth: 1, borderBottomColor: colors.border }}>
            <Text className="text-2xl font-semibold" style={{ color: colors.text }}>Clock Out</Text>
            <Pressable onPress={onClose} style={({ pressed }) => ({ opacity: pressed ? 0.55 : 1 })}>
              <Ionicons name="close" size={iconSize['2xl']} color={colors.textDark} />
            </Pressable>
          </View>

          <View className="px-8 pt-14 pb-12">
            <Text className="text-center text-[#4B5563] text-lg leading-7 font-medium">
              If you have not declared cash for this shift, you must complete cash declaration before clocking out.
            </Text>
            <Text className="text-center text-[#4B5563] text-lg leading-7 font-medium mt-2">
              If cash has already been declared, you may proceed to clock out.
            </Text>
          </View>

          <View className="flex-row gap-4 px-5 pb-5">
            <ThemedButton
              title="Cancel"
              variant="outline"
              onPress={onClose}
              fullWidth
              size="lg"
              style={{ flex: 1, backgroundColor: colors.primaryLight, borderColor: colors.primary }}
              textStyle={{ color: colors.primary, fontSize: 18 }}
            />
            <ThemedButton
              title="Declare Cash"
              onPress={onDeclareCash}
              fullWidth
              style={{ flex: 1, backgroundColor: colors.purple }}
            />
            <ThemedButton
              title="Clock Out"
              onPress={onClockOut}
              fullWidth
              style={{ flex: 1, backgroundColor: colors.primary }}
            />
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
