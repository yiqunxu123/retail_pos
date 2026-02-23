import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams } from "expo-router";
import { Text, View } from "react-native";
import { PageHeader } from "../../components";

export default function ReportPage() {
  const { title } = useLocalSearchParams<{ title: string }>();

  return (
    <View className="flex-1 bg-[#F7F7F9]">
      <PageHeader title={title || "Report"} showBack={true} />
      <View className="flex-1 justify-center items-center">
        <Ionicons name="construct-outline" size={64} color="#D1D5DB" />
        <Text className="text-gray-400 text-lg font-medium mt-4">Coming Soon</Text>
        <Text className="text-gray-300 text-sm mt-2">This report is under development</Text>
      </View>
    </View>
  );
}
