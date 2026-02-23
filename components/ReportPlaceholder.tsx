import { Ionicons } from "@expo/vector-icons";
import { Pressable, Text, View } from "react-native";
import { iconSize, colors } from "@/utils/theme";
import { useAppNavigation } from "../hooks/useAppNavigation";

interface ReportPlaceholderProps {
  title: string;
}

export default function ReportPlaceholder({ title }: ReportPlaceholderProps) {
  const { safeGoBack } = useAppNavigation();

  return (
    <View className="flex-1" style={{ backgroundColor: colors.backgroundTertiary }}>
      {/* Header with Back Button */}
      <View className="px-6 py-4 flex-row items-center border-b border-gray-200">
        <Pressable onPress={() => safeGoBack()} className="mr-4">
          <Ionicons name="arrow-back" size={iconSize.xl} color={colors.text} />
        </Pressable>
        <Text className="text-2xl font-bold text-gray-900">{title}</Text>
      </View>

      {/* Empty Content */}
      <View className="flex-1" style={{ backgroundColor: colors.backgroundTertiary }} />
    </View>
  );
}
