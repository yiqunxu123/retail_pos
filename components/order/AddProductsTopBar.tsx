import { buttonSize, colors, iconSize } from '@/utils/theme';
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { useRenderTrace } from "../../utils/debug/useRenderTrace";

interface AddProductsTopBarProps {
  insetTop: number;
  onOpenBarcodePrintModal: () => void;
  onOpenProductSettings: () => void;
}

function AddProductsTopBarComponent({
  insetTop,
  onOpenBarcodePrintModal,
  onOpenProductSettings,
}: AddProductsTopBarProps) {
  useRenderTrace(
    "AddProductsTopBar",
    {
      insetTop,
      onOpenBarcodePrintModal,
      onOpenProductSettings,
    },
    { throttleMs: 100 }
  );

  return (
    <View
      className="flex-row items-end gap-3 bg-[#F7F7F9] border-b border-gray-200"
      style={{ paddingTop: insetTop + 10, paddingHorizontal: 16, paddingBottom: 10 }}
    >
      <View className="flex-1">
        <Text className="text-[#5A5F66] text-lg mb-1" >
          Scan barcode to add product
        </Text>
        <View className="flex-row items-center bg-gray-100 border border-gray-200 rounded-xl px-3 py-3">
          <Ionicons name="barcode-outline" size={iconSize.base} color={colors.textTertiary} />
          <Text
            className="flex-1 ml-2 text-gray-400 text-lg"
          >
            Ready for scanning...
          </Text>
        </View>
      </View>

      <TouchableOpacity
        className="px-6 rounded-xl flex-row items-center justify-center gap-1 shadow-sm"
        style={{ height: buttonSize.md.height, backgroundColor: colors.primary, borderRadius: buttonSize.md.borderRadius }}
      >
        <Ionicons name="refresh" size={iconSize.sm} color="white" />
        <Text className="text-white font-medium" >Refresh</Text>
      </TouchableOpacity>

      <TouchableOpacity
        className="px-5 rounded-xl flex-row items-center justify-center gap-2 shadow-sm"
        onPress={onOpenBarcodePrintModal}
        style={{ height: buttonSize.md.height, backgroundColor: colors.info, borderRadius: buttonSize.md.borderRadius }}
      >
        <Ionicons name="barcode-outline" size={iconSize.md} color="white" />
        <Text className="text-white font-medium" >Print Barcode</Text>
      </TouchableOpacity>

      <TouchableOpacity
        className="items-center justify-center rounded-xl shadow-sm"
        onPress={onOpenProductSettings}
        style={{ width: buttonSize.md.height, height: buttonSize.md.height, backgroundColor: colors.surfaceDark, borderRadius: buttonSize.md.borderRadius }}
      >
        <Ionicons name="settings-outline" size={iconSize.base} color="white" />
      </TouchableOpacity>
    </View>
  );
}

export const AddProductsTopBar = React.memo(AddProductsTopBarComponent);
AddProductsTopBar.displayName = "AddProductsTopBar";
