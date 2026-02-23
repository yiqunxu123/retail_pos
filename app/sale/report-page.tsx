import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams } from "expo-router";
import { Text, View } from "react-native";
import { PageHeader } from "../../components";
import { colors, typography } from "../../utils/theme";

export default function ReportPage() {
  const { title } = useLocalSearchParams<{ title: string }>();

  return (
    <View className="flex-1 bg-[#F7F7F9]">
      <PageHeader title={title || "Report"} showBack={true} />
      <View className="flex-1 justify-center items-center">
        <Ionicons name="construct-outline" size={64} color={colors.border} />
        <Text style={{ ...typography.lgMedium, color: colors.textTertiary, marginTop: 16 }}>Coming Soon</Text>
        <Text style={{ ...typography.sm, color: colors.textTertiary, marginTop: 8 }}>This report is under development</Text>
      </View>
    </View>
  );
}
