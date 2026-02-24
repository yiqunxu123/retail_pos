import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams } from "expo-router";
import { Text, View } from "react-native";
import { PageHeader } from "../../components";
import { colors } from "../../utils/theme";

export default function ReportPage() {
  const { title } = useLocalSearchParams<{ title: string }>();

  return (
    <View className="flex-1 bg-[#F7F7F9]">
      <PageHeader title={title || "Report"} showBack={false} />
      <View className="flex-1 justify-center items-center">
        <Ionicons name="construct-outline" size={64} color={colors.border} />
        <Text className="text-lg font-medium mt-4" style={{ color: colors.textTertiary }}>Coming Soon</Text>
        <Text className="text-sm mt-2" style={{ color: colors.textTertiary }}>This report is under development</Text>
      </View>
    </View>
  );
}
