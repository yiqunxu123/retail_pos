import { View, Text, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface POSLineCardProps {
  lineNumber: number;
  isActive?: boolean;
  isSelected?: boolean;
  itemCount?: number;
  total?: string;
  onPress?: () => void;
}

/**
 * POSLineCard - Represents a POS terminal line
 * States:
 * - Default: dashed gray border, empty
 * - Selected: solid blue border (before clock in)
 * - Active: solid green border with order info (after clock in)
 */
export function POSLineCard({
  lineNumber,
  isActive = false,
  isSelected = false,
  itemCount = 0,
  total = "$0.00",
  onPress,
}: POSLineCardProps) {
  // Determine border color based on state
  const getBorderColor = () => {
    if (isActive) return "#22c55e"; // green
    if (isSelected) return "#3b82f6"; // blue
    return "#9ca3af"; // gray
  };

  // Determine header background color
  const getHeaderBgColor = () => {
    if (isActive) return "bg-green-500";
    if (isSelected) return "bg-blue-500";
    return "bg-red-500";
  };

  return (
    <Pressable
      onPress={onPress}
      className="flex-1 min-h-[140px] rounded-lg bg-[#F7F7F9] overflow-hidden shadow-sm"
      style={({ pressed }) => ({
        opacity: pressed ? 0.7 : 1,
        borderWidth: 2,
        borderStyle: isActive || isSelected ? "solid" : "dashed",
        borderColor: getBorderColor(),
      })}
    >
      {/* Header - Line number with colored background */}
      <View className={`${getHeaderBgColor()} px-3 py-2`}>
        <Text className="text-white font-bold text-base">
          POS Line {lineNumber}
        </Text>
      </View>

      {/* Content area */}
      <View className="flex-1 p-3 items-center justify-center">
        {isActive ? (
          // Active state - show order summary
          <View className="items-center">
            <View className="flex-row items-center gap-2 mb-2">
              <Ionicons name="cart-outline" size={20} color="#6b7280" />
              <Text className="text-gray-600 text-sm">
                {itemCount} {itemCount === 1 ? "item" : "items"}
              </Text>
            </View>
            <Text className="text-gray-800 font-bold text-lg">{total}</Text>
          </View>
        ) : isSelected ? (
          // Selected state - show check mark
          <View className="items-center">
            <Ionicons name="checkmark-circle" size={36} color="#3b82f6" />
            <Text className="text-blue-600 text-xs mt-2 font-medium">Selected</Text>
          </View>
        ) : (
          // Empty state - show placeholder
          <View className="items-center">
            <Ionicons name="add-circle-outline" size={32} color="#d1d5db" />
            <Text className="text-gray-400 text-xs mt-2">Tap to select</Text>
          </View>
        )}
      </View>
    </Pressable>
  );
}
