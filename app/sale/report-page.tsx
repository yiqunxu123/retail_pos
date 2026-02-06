import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams } from "expo-router";
import { Pressable, Text, View } from "react-native";
import { useAppNavigation } from "../../hooks/useAppNavigation";

export default function ReportPage() {
  const { title } = useLocalSearchParams<{ title: string }>();
  const { safeGoBack } = useAppNavigation();

  return (
    <View className="flex-1 bg-white">
      {/* Header with Back Button */}
      <View className="px-6 py-4 flex-row items-center border-b border-gray-200">
        <Pressable onPress={() => safeGoBack()} className="mr-4">
          <Ionicons name="arrow-back" size={24} color="#1A1A1A" />
        </Pressable>
        <Text className="text-2xl font-bold text-gray-900">{title || "Report"}</Text>
      </View>

      {/* Empty Content */}
      <View className="flex-1 bg-white" />
    </View>
  );
}
