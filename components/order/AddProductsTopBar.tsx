import { colors, fontSize, fontWeight, iconSize } from '@/utils/theme';
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { useRenderTrace } from "../../utils/debug/useRenderTrace";

interface AddProductsTopBarProps {
  insetTop: number;
  scanLogsCount: number;
  onOpenScanLogModal: () => void;
  onOpenBarcodePrintModal: () => void;
  onOpenProductSettings: () => void;
}

function AddProductsTopBarComponent({
  insetTop,
  scanLogsCount,
  onOpenScanLogModal,
  onOpenBarcodePrintModal,
  onOpenProductSettings,
}: AddProductsTopBarProps) {
  useRenderTrace(
    "AddProductsTopBar",
    {
      insetTop,
      scanLogsCount,
      onOpenScanLogModal,
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
        <Text className="text-[#5A5F66] text-[18px] mb-1" style={{ fontFamily: fontFamily.primary }}>
          Scan barcode to add product
        </Text>
        <View className="flex-row items-center bg-gray-100 border border-gray-200 rounded-xl px-3 py-3">
          <Ionicons name="barcode-outline" size={iconSize.base} color={colors.textTertiary} />
          <Text
            className="flex-1 ml-2 text-gray-400 text-[18px]"
            style={{ fontFamily: fontFamily.primary }}
          >
            Ready for scanning...
          </Text>
        </View>
      </View>

      <TouchableOpacity
        className="h-11 px-6 rounded-xl flex-row items-center justify-center gap-1 shadow-sm"
        style={{ backgroundColor: colors.primary }}
      >
        <Ionicons name="refresh" size={iconSize.sm} color="white" />
        <Text className="text-white font-medium">Refresh</Text>
      </TouchableOpacity>

      <TouchableOpacity
        className="h-11 border border-red-500 bg-white px-6 rounded-xl flex-row items-center justify-center gap-2 shadow-sm"
        onPress={onOpenScanLogModal}
      >
        <Ionicons name="barcode-outline" size={iconSize.md} color={colors.primary} />
        <Text className="text-red-500 font-medium">Scan Logs</Text>
        {scanLogsCount > 0 && (
          <View
            style={{
              backgroundColor: colors.primary,
              borderRadius: 10,
              minWidth: 20,
              height: 20,
              alignItems: "center",
              justifyContent: "center",
              paddingHorizontal: 6,
            }}
          >
            <Text style={{ color: colors.textWhite, fontSize: fontSize.md, fontWeight: fontWeight.bold }}>{scanLogsCount}</Text>
          </View>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        className="h-11 bg-[#3B82F6] px-5 rounded-xl flex-row items-center justify-center gap-2 shadow-sm"
        onPress={onOpenBarcodePrintModal}
      >
        <Ionicons name="barcode-outline" size={iconSize.md} color="white" />
        <Text className="text-white font-medium">Print Barcode</Text>
      </TouchableOpacity>

      <TouchableOpacity
        className="bg-[#20232A] p-3 rounded-xl shadow-sm"
        onPress={onOpenProductSettings}
      >
        <Ionicons name="settings-outline" size={iconSize.base} color="white" />
      </TouchableOpacity>
    </View>
  );
}

export const AddProductsTopBar = React.memo(AddProductsTopBarComponent);
AddProductsTopBar.displayName = "AddProductsTopBar";
