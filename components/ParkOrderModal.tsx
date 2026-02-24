import { buttonSize, colors, iconSize, modalContent } from "@/utils/theme";
import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { Text, TextInput, View } from "react-native";
import { CenteredModal } from "./CenteredModal";
import { ThemedButton } from "./ThemedButton";

interface ParkOrderModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: (note?: string) => void;
  customerName: string;
  totalItems: number;
  totalAmount: number;
}

/**
 * ParkOrderModal - Confirm parking the current order
 * Shows order summary and optional note input
 */
export function ParkOrderModal({
  visible,
  onClose,
  onConfirm,
  customerName,
  totalItems,
  totalAmount,
}: ParkOrderModalProps) {
  const [note, setNote] = useState("");

  const handleConfirm = () => {
    onConfirm(note || undefined);
    setNote("");
  };

  const handleCancel = () => {
    setNote("");
    onClose();
  };

  return (
    <CenteredModal
      visible={visible}
      onClose={onClose}
      size="md"
      title="Park Order"
      keyboardAvoiding
      header={
        <View className="flex-row items-center flex-1">
          <View className="h-10 bg-yellow-100 rounded-full items-center justify-center mr-3" style={{ width: "10%" }}>
            <Ionicons name="pause-circle" size={iconSize.xl} color={colors.warning} />
          </View>
          <Text className="text-xl font-semibold" style={{ color: colors.textDark }}>
            Park Order
          </Text>
        </View>
      }
      scrollable={false}
      footer={
        <>
          <ThemedButton
            title="Cancel"
            variant="outline"
            onPress={handleCancel}
            fullWidth
            size="lg"
            textStyle={{ fontSize: 18 }}
          />
          <ThemedButton
            title="Park Order"
            onPress={handleConfirm}
            fullWidth
            style={{ flex: 1, backgroundColor: colors.warning }}
            textStyle={{ color: colors.text }}
          />
        </>
      }
    >
      <Text className="text-center mb-6" style={{ fontSize: modalContent.valueFontSize, color: modalContent.labelColor }}>
        Are you sure you want to park this order?{"\n"}
        The order will be saved and can be resumed later.
      </Text>

      <View className="mb-5 shadow-sm" style={{ backgroundColor: modalContent.boxBackground, padding: modalContent.boxPaddingPct, borderRadius: modalContent.boxRadius, borderWidth: modalContent.boxBorderWidth, borderColor: modalContent.boxBorderColor }}>
        <View className="flex-row justify-between mb-2">
          <Text style={{ fontSize: modalContent.labelFontSize, color: modalContent.labelColor }}>Customer</Text>
          <Text style={{ fontSize: modalContent.valueFontSize, fontWeight: modalContent.valueFontWeight, color: modalContent.valueColor }}>{customerName}</Text>
        </View>
        <View className="flex-row justify-between mb-2">
          <Text style={{ fontSize: modalContent.labelFontSize, color: modalContent.labelColor }}>Total Items</Text>
          <Text style={{ fontSize: modalContent.valueFontSize, fontWeight: modalContent.valueFontWeight, color: modalContent.valueColor }}>{totalItems}</Text>
        </View>
        <View className="flex-row justify-between">
          <Text style={{ fontSize: modalContent.labelFontSize, color: modalContent.labelColor }}>Total Amount</Text>
          <Text className="font-bold" style={{ fontSize: modalContent.valueLargeFontSize, color: colors.primary }}>${totalAmount.toFixed(2)}</Text>
        </View>
      </View>

      <View className="mb-5">
        <Text className="mb-1.5" style={{ fontSize: modalContent.titleFontSize, fontWeight: modalContent.titleFontWeight, color: modalContent.titleColor }}>Add Note (Optional)</Text>
        <TextInput
          className="shadow-sm"
          style={{ backgroundColor: modalContent.inputBackground, borderWidth: modalContent.boxBorderWidth, borderColor: modalContent.inputBorderColor, borderRadius: modalContent.boxRadius, paddingHorizontal: modalContent.inputPaddingHorizontal, paddingVertical: modalContent.inputPaddingVertical, fontSize: modalContent.inputFontSize }}
          placeholder="Enter a note for this parked order..."
          placeholderTextColor="#9ca3af"
          value={note}
          onChangeText={setNote}
          multiline
          numberOfLines={2}
        />
      </View>
    </CenteredModal>
  );
}
