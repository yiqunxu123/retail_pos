import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Pressable, Text, View } from "react-native";

interface ReportPlaceholderProps {
  title: string;
  description?: string;
}

export default function ReportPlaceholder({ 
  title, 
  description = "This report is under development and will be available soon." 
}: ReportPlaceholderProps) {
  return (
    <View className="flex-1 bg-white">
      {/* Header with Back Button */}
      <View className="px-6 py-4 flex-row items-center border-b border-gray-200">
        <Pressable onPress={() => router.back()} className="mr-4">
          <Ionicons name="arrow-back" size={24} color="#1A1A1A" />
        </Pressable>
        <Text className="text-2xl font-bold text-gray-900">{title}</Text>
      </View>

      {/* Content - Centered Message */}
      <View className="flex-1 justify-center items-center px-8">
        <View className="items-center">
          <Ionicons name="document-text-outline" size={80} color="#D1D5DB" />
          <Text className="text-xl font-semibold text-gray-800 mt-6 text-center">
            Report Under Development
          </Text>
          <Text className="text-base text-gray-500 mt-3 text-center leading-6">
            {description}
          </Text>
          <View className="mt-8 bg-yellow-50 border border-yellow-200 rounded-lg px-6 py-4">
            <Text className="text-sm text-yellow-800 text-center">
              ⚠️ Coming Soon
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}
