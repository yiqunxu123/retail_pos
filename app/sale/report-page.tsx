import { useLocalSearchParams } from "expo-router";
import { View } from "react-native";
import { PageHeader } from "../../components";

export default function ReportPage() {
  const { title } = useLocalSearchParams<{ title: string }>();

  return (
    <View className="flex-1 bg-[#F7F7F9]">
      <PageHeader title={title || "Report"} showBack={true} />

      {/* Empty Content */}
      <View className="flex-1 bg-[#F7F7F9]" />
    </View>
  );
}
