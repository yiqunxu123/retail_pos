import { colors, iconSize } from "@/utils/theme";
import { Ionicons } from "@expo/vector-icons";
import { Pressable, Text, TextInput, View } from "react-native";

interface ProductSearchProps {
  searchQuery: string;
  onSearchChange: (text: string) => void;
  scanQty: string;
  onScanQtyChange: (text: string) => void;
  onRefresh?: () => void;
  onScanLogs?: () => void;
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
  onScanLogs,
  onSearchFocus,
}: ProductSearchProps) {
  return (
    <View className="bg-[#F7F7F9] rounded-lg p-4 mb-4 shadow-sm">
      <View className="flex-row items-center gap-4">
        {/* Search Input */}
        <View className="flex-1">
          <Text className="text-[#5A5F66] text-[18px] mb-2" style={{ fontFamily: 'Montserrat' }}>
            Add product by Name, SKU, UPC
          </Text>
          <Pressable
            onPress={onSearchFocus}
            className="flex-row items-center bg-white border border-gray-200 rounded-lg px-3 py-3 shadow-sm"
          >
            <Ionicons name="search" size={iconSize.base} color={colors.textTertiary} />
            <TextInput
              className="flex-1 ml-2 text-gray-800 text-[18px]"
              style={{ fontFamily: 'Montserrat' }}
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
          <Text className="text-[#5A5F66] text-[18px] mb-2" style={{ fontFamily: 'Montserrat' }}>Scan Qty</Text>
          <TextInput
            className="w-20 bg-white border border-gray-200 rounded-lg px-3 py-3 text-center text-gray-800 text-[18px] shadow-sm"
            style={{ fontFamily: 'Montserrat' }}
            keyboardType="numeric"
            value={scanQty}
            onChangeText={onScanQtyChange}
          />
        </View>

        {/* Refresh Button */}
        <Pressable
          onPress={onRefresh}
          className="bg-red-500 px-4 py-3 rounded-lg flex-row items-center gap-2 mt-5"
          style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1 })}
        >
          <Ionicons name="refresh" size={iconSize.md} color="white" />
          <Text className="text-white font-medium">Refresh</Text>
        </Pressable>

        {/* Scan Logs Button */}
        <Pressable
          onPress={onScanLogs}
          className="bg-white border border-gray-300 px-4 py-3 rounded-lg mt-5"
          style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1 })}
        >
          <Text className="text-gray-700 font-medium">Scan Logs</Text>
        </Pressable>
      </View>
    </View>
  );
}
