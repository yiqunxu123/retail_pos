import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Pressable, ScrollView, Text, View } from "react-native";
import { PageHeader } from "../../components";

const MAS_REPORTS = [
  { id: "mas-sales", title: "MAS Sales Report", route: "/sale/reports/mas-sales" },
  { id: "mas-inventory", title: "MAS Inventory Report", route: "/sale/reports/mas-inventory" },
  { id: "mas-compliance", title: "MAS Compliance Report", route: "/sale/reports/mas-compliance" },
  { id: "mas-transaction", title: "MAS Transaction Report", route: "/sale/reports/mas-transaction" },
  { id: "mas-summary", title: "MAS Summary Report", route: "/sale/reports/mas-summary" },
  { id: "mas-audit", title: "MAS Audit Report", route: "/sale/reports/mas-audit" },
];

interface ReportItemProps {
  title: string;
  onPress: () => void;
}

interface ReportConfig {
  id: string;
  title: string;
  route: string;
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
  const handleReportPress = (route: string) => {
    router.push(route as any);
  };

  const leftColumn = MAS_REPORTS.filter((_, i) => i % 2 === 0);
  const rightColumn = MAS_REPORTS.filter((_, i) => i % 2 === 1);

  return (
    <View className="flex-1 bg-white">
      <PageHeader title="MAS Reports" />

      <ScrollView className="flex-1 px-6">
        <View className="flex-row gap-4">
          <View className="flex-1">
            {leftColumn.map((report: ReportConfig) => (
              <ReportItem
                key={report.id}
                title={report.title}
                onPress={() => handleReportPress(report.route)}
              />
            ))}
          </View>
          <View className="flex-1">
            {rightColumn.map((report: ReportConfig) => (
              <ReportItem
                key={report.id}
                title={report.title}
                onPress={() => handleReportPress(report.route)}
              />
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
