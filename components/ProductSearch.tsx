import { buttonSize, colors, iconSize } from "@/utils/theme";
import { Ionicons } from "@expo/vector-icons";
import { Pressable, Text, TextInput, View } from "react-native";

interface ProductSearchProps {
  searchQuery: string;
  onSearchChange: (text: string) => void;
  scanQty: string;
  onScanQtyChange: (text: string) => void;
  onRefresh?: () => void;
  onSearchFocus?: () => void;
}

/**
 * ProductSearch - Search bar and scan controls for POS
 * Includes product search input, scan quantity, refresh and logs buttons
 */
export function ProductSearch({
  searchQuery,
  onSearchChange,
  scanQty,
  onScanQtyChange,
  onRefresh,
  onSearchFocus,
}: ProductSearchProps) {
  return (
    <View className="bg-[#F7F7F9] rounded-lg p-4 mb-4 shadow-sm">
      <View className="flex-row items-center gap-4">
        {/* Search Input */}
        <View className="flex-1">
          <Text className="text-[#5A5F66] text-lg mb-2">
            Add product by Name, SKU, UPC
          </Text>
          <Pressable
            onPress={onSearchFocus}
            className="flex-row items-center bg-white border border-gray-200 rounded-lg px-3 py-3 shadow-sm"
          >
            <Ionicons name="search" size={iconSize.base} color={colors.textTertiary} />
            <TextInput
              className="flex-1 ml-2 text-gray-800 text-lg"
              placeholder="Search Products"
              placeholderTextColor="#9ca3af"
              value={searchQuery}
              onChangeText={onSearchChange}
              onFocus={onSearchFocus}
            />
          </Pressable>
        </View>

        {/* Scan Qty */}
        <View>
          <Text className="text-[#5A5F66] text-lg mb-2">Scan Qty</Text>
          <TextInput
            className="w-20 bg-white border border-gray-200 rounded-lg px-3 py-3 text-center text-gray-800 text-lg shadow-sm"
            keyboardType="numeric"
            value={scanQty}
            onChangeText={onScanQtyChange}
          />
        </View>

        {/* Refresh Button */}
        <Pressable
          onPress={onRefresh}
          className="px-4 rounded-lg flex-row items-center gap-2 mt-5"
          style={({ pressed }) => ({ 
            height: buttonSize.md.height, 
            backgroundColor: colors.primary, 
            borderRadius: buttonSize.md.borderRadius, 
            opacity: pressed ? 0.8 : 1 
          })}
        >
          <Ionicons name="refresh" size={iconSize.md} color="white" />
          <Text className="text-white font-medium">Refresh</Text>
        </Pressable>
      </View>
    </View>
  );
}
