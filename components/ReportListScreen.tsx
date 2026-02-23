import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Pressable, ScrollView, Text, View } from "react-native";
import { PageHeader } from "./PageHeader";

export interface ReportConfig {
  id: string;
  title: string;
  route?: string | null;
}

interface ReportListScreenProps {
  title: string;
  reports: ReportConfig[];
  showBack?: boolean;
}

function ReportItem({ title, hasRoute, onPress }: { title: string; hasRoute: boolean; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      className="flex-row items-center justify-between px-4 py-4 rounded-lg border-2 mb-3"
      style={{ borderColor: hasRoute ? "#EC1A52" : "#D1D5DB" }}
    >
      <Text className={hasRoute ? "text-gray-800 font-medium" : "text-gray-400 font-medium"}>{title}</Text>
      <Ionicons name="chevron-forward" size={20} color={hasRoute ? "#9CA3AF" : "#D1D5DB"} />
    </Pressable>
  );
}

export function ReportListScreen({ title, reports, showBack = true }: ReportListScreenProps) {
  const handleReportPress = (report: ReportConfig) => {
    if (report.route) {
      router.push(report.route as any);
    } else {
      router.push({ pathname: "/sale/report-page", params: { title: report.title } } as any);
    }
  };

  const leftColumn = reports.filter((_, i) => i % 2 === 0);
  const rightColumn = reports.filter((_, i) => i % 2 === 1);

  return (
    <View className="flex-1 bg-[#F7F7F9]">
      <PageHeader title={title} showBack={showBack} />
      <ScrollView className="flex-1 px-6">
        <View className="flex-row gap-4">
          <View className="flex-1">
            {leftColumn.map((report) => (
              <ReportItem
                key={report.id}
                title={report.title}
                hasRoute={!!report.route}
                onPress={() => handleReportPress(report)}
              />
            ))}
          </View>
          <View className="flex-1">
            {rightColumn.map((report) => (
              <ReportItem
                key={report.id}
                title={report.title}
                hasRoute={!!report.route}
                onPress={() => handleReportPress(report)}
              />
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
