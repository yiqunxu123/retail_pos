import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Pressable, ScrollView, Text, View } from "react-native";
import { PageHeader } from "../../components";

const MAS_REPORTS = [
  { id: "mas-sales", title: "MAS Sales Report" },
  { id: "mas-inventory", title: "MAS Inventory Report" },
  { id: "mas-compliance", title: "MAS Compliance Report" },
  { id: "mas-transaction", title: "MAS Transaction Report" },
  { id: "mas-summary", title: "MAS Summary Report" },
  { id: "mas-audit", title: "MAS Audit Report" },
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

export default function MASReportsScreen() {
  const handleReportPress = (title: string) => {
    router.push({ pathname: "/sale/report-page", params: { title } } as any);
  };

  const leftColumn = MAS_REPORTS.filter((_, i) => i % 2 === 0);
  const rightColumn = MAS_REPORTS.filter((_, i) => i % 2 === 1);

  return (
    <View className="flex-1 bg-[#F7F7F9]">
      <PageHeader title="MAS Reports" showBack />

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
