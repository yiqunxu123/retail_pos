import { Ionicons } from "@expo/vector-icons";
import { View, Text, TextInput, Pressable } from "react-native";

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
    <View className="bg-white rounded-lg p-4 mb-4">
      <View className="flex-row items-center gap-4">
        {/* Search Input */}
        <View className="flex-1">
          <Text className="text-gray-600 text-sm mb-2">
            Add product by Name, SKU, UPC
          </Text>
          <Pressable
            onPress={onSearchFocus}
            className="flex-row items-center bg-gray-50 border border-gray-200 rounded-lg px-3 py-2"
          >
            <Ionicons name="search" size={20} color="#9ca3af" />
            <TextInput
              className="flex-1 ml-2 text-gray-800 text-base"
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
          <Text className="text-gray-600 text-sm mb-2">Scan Qty</Text>
          <TextInput
            className="w-16 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-center text-gray-800"
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
          <Ionicons name="refresh" size={18} color="white" />
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
