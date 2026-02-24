import { Ionicons } from "@expo/vector-icons";
import { Pressable, Text, View } from "react-native";
import { iconSize, colors, modalContent } from "@/utils/theme";
import { CenteredModal } from "./CenteredModal";
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
    <CenteredModal
      visible={visible}
      onClose={onClose}
      size="md"
      showCloseButton={false}
      header={
        <View className="flex-row justify-between items-center flex-1">
          <Text className="text-2xl font-semibold" style={{ color: colors.text }}>Clock Out</Text>
          <Pressable onPress={onClose} style={({ pressed }) => ({ opacity: pressed ? 0.55 : 1 })}>
            <Ionicons name="close" size={iconSize['2xl']} color={colors.textDark} />
          </Pressable>
        </View>
      }
      footer={
        <View className="flex-row gap-4 flex-1">
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
      }
    >
      <View className="px-8 pt-14 pb-12">
            <Text className="text-center leading-7" style={{ fontSize: modalContent.valueFontSize, fontWeight: modalContent.valueFontWeight, color: modalContent.labelColor }}>
              If you have not declared cash for this shift, you must complete cash declaration before clocking out.
            </Text>
            <Text className="text-center leading-7 mt-2" style={{ fontSize: modalContent.valueFontSize, fontWeight: modalContent.valueFontWeight, color: modalContent.labelColor }}>
              If cash has already been declared, you may proceed to clock out.
            </Text>
          </View>
    </CenteredModal>
  );
}
