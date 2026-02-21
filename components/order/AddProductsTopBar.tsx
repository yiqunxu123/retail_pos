import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Text, TextInput, TouchableOpacity, View } from "react-native";
import { useRenderTrace } from "../../utils/debug/useRenderTrace";

interface AddProductsTopBarProps {
  insetTop: number;
  scanQty: string;
  onScanQtyChange: (value: string) => void;
  scanLogsCount: number;
  onOpenSearch: () => void;
  onOpenScanLogModal: () => void;
  onOpenBarcodePrintModal: () => void;
  onOpenProductSettings: () => void;
}

function AddProductsTopBarComponent({
  insetTop,
  scanQty,
  onScanQtyChange,
  scanLogsCount,
  onOpenSearch,
  onOpenScanLogModal,
  onOpenBarcodePrintModal,
  onOpenProductSettings,
}: AddProductsTopBarProps) {
  useRenderTrace(
    "AddProductsTopBar",
    {
      insetTop,
      scanQty,
      scanLogsCount,
      onScanQtyChange,
      onOpenSearch,
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
        <Text className="text-[#5A5F66] text-[18px] mb-1" style={{ fontFamily: "Montserrat" }}>
          Add product by Name, SKU, UPC
        </Text>
        <TouchableOpacity
          onPress={onOpenSearch}
          className="flex-row items-center bg-white border border-gray-300 rounded-xl px-3 py-3 shadow-sm"
        >
          <Ionicons name="search" size={20} color="#9ca3af" />
          <Text
            className="flex-1 ml-2 text-gray-400 text-[18px]"
            style={{ fontFamily: "Montserrat" }}
          >
            Search Products
          </Text>
        </TouchableOpacity>
      </View>

      <View>
        <Text className="text-[#5A5F66] text-[18px] mb-1" style={{ fontFamily: "Montserrat" }}>
          Scan Qty
        </Text>
        <TextInput
          className="w-20 bg-white border border-gray-300 rounded-xl px-2 py-3 text-center text-gray-800 text-[18px] shadow-sm"
          style={{ fontFamily: "Montserrat" }}
          keyboardType="numeric"
          value={scanQty}
          onChangeText={onScanQtyChange}
        />
      </View>

      <TouchableOpacity
        className="h-11 px-6 rounded-xl flex-row items-center justify-center gap-1 shadow-sm"
        style={{ backgroundColor: "#EC1A52" }}
      >
        <Ionicons name="refresh" size={16} color="white" />
        <Text className="text-white font-medium">Refresh</Text>
      </TouchableOpacity>

      <TouchableOpacity
        className="h-11 border border-red-500 bg-white px-6 rounded-xl flex-row items-center justify-center gap-2 shadow-sm"
        onPress={onOpenScanLogModal}
      >
        <Ionicons name="barcode-outline" size={18} color="#EC1A52" />
        <Text className="text-red-500 font-medium">Scan Logs</Text>
        {scanLogsCount > 0 && (
          <View
            style={{
              backgroundColor: "#EC1A52",
              borderRadius: 10,
              minWidth: 20,
              height: 20,
              alignItems: "center",
              justifyContent: "center",
              paddingHorizontal: 6,
            }}
          >
            <Text style={{ color: "#FFF", fontSize: 11, fontWeight: "700" }}>{scanLogsCount}</Text>
          </View>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        className="h-11 bg-[#3B82F6] px-5 rounded-xl flex-row items-center justify-center gap-2 shadow-sm"
        onPress={onOpenBarcodePrintModal}
      >
        <Ionicons name="barcode-outline" size={18} color="white" />
        <Text className="text-white font-medium">Print Barcode</Text>
      </TouchableOpacity>

      <TouchableOpacity
        className="bg-[#20232A] p-3 rounded-xl shadow-sm"
        onPress={onOpenProductSettings}
      >
        <Ionicons name="settings-outline" size={20} color="white" />
      </TouchableOpacity>
    </View>
  );
}

export const AddProductsTopBar = React.memo(AddProductsTopBarComponent);
AddProductsTopBar.displayName = "AddProductsTopBar";
