import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Pressable, ScrollView, Text, View } from "react-native";
import { PageHeader } from "../../components";

const LEGAL_REPORTS = [
  { id: "california-cigarette-receiving", title: "California Cigarette Receiving Report" },
  { id: "kentucky-cigarette-tax", title: "Kentucky Cigarette Tax Report" },
  { id: "kentucky-tobacco-tax", title: "Kentucky Tobacco Tax Report" },
  { id: "ldr", title: "LDR Report" },
  { id: "rap", title: "RAP Report" },
  { id: "rcr", title: "RCR Report" },
];

interface ReportItemProps {
  title: string;
  onPress: () => void;
}

interface ReportConfig {
  id: string;
  title: string;
}

function ReportItem({ title, onPress }: ReportItemProps) {
  return (
    <Pressable
      onPress={onPress}
      className="flex-row items-center justify-between px-4 py-4 rounded-lg border-2 mb-3"
      style={{ borderColor: "#EC1A52" }}
    >
      <Text className="text-gray-800 font-medium">{title}</Text>
      <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
    </Pressable>
  );
}

export default function LegalReportsScreen() {
  const handleReportPress = (title: string) => {
    router.push({ pathname: "/sale/report-page", params: { title } } as any);
  };

  const leftColumn = LEGAL_REPORTS.filter((_, i) => i % 2 === 0);
  const rightColumn = LEGAL_REPORTS.filter((_, i) => i % 2 === 1);

  return (
    <View className="flex-1 bg-[#F7F7F9]">
      <PageHeader title="Legal Reports" showBack />

      <ScrollView className="flex-1 px-6">
        <View className="flex-row gap-4">
          <View className="flex-1">
            {leftColumn.map((report: ReportConfig) => (
              <ReportItem
                key={report.id}
                title={report.title}
                onPress={() => handleReportPress(report.title)}
              />
            ))}
          </View>
          <View className="flex-1">
            {rightColumn.map((report: ReportConfig) => (
              <ReportItem
                key={report.id}
                title={report.title}
                onPress={() => handleReportPress(report.title)}
              />
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
