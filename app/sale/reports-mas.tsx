import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Alert, Pressable, ScrollView, Text, View } from "react-native";

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
  const handleReportPress = (reportId: string, title: string) => {
    Alert.alert("View Report", `Opening ${title}...`);
  };

  const leftColumn = MAS_REPORTS.filter((_, i) => i % 2 === 0);
  const rightColumn = MAS_REPORTS.filter((_, i) => i % 2 === 1);

  return (
    <View className="flex-1 bg-white">
      <View className="px-6 py-4 flex-row items-center">
        <Pressable onPress={() => router.back()} className="mr-4">
          <Ionicons name="arrow-back" size={24} color="#1A1A1A" />
        </Pressable>
        <Text className="text-2xl font-bold text-gray-900">MAS Reports</Text>
      </View>

      <ScrollView className="flex-1 px-6">
        <View className="flex-row gap-4">
          <View className="flex-1">
            {leftColumn.map((report) => (
              <ReportItem
                key={report.id}
                title={report.title}
                onPress={() => handleReportPress(report.id, report.title)}
              />
            ))}
          </View>
          <View className="flex-1">
            {rightColumn.map((report) => (
              <ReportItem
                key={report.id}
                title={report.title}
                onPress={() => handleReportPress(report.id, report.title)}
              />
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
