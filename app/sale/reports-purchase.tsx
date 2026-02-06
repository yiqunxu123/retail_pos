import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Pressable, ScrollView, Text, View } from "react-native";
import { PageHeader } from "../../components";

const PURCHASE_REPORTS = [
  { id: "purchase-received-history", title: "Purchase Received History Report" },
  { id: "purchase-order-received-detailed", title: "Purchase Order Received Detailed Report" },
  { id: "purchase-order-tax", title: "Purchase Order Tax Report" },
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

export default function PurchaseReportsScreen() {
  const handleReportPress = (title: string) => {
    router.push({ pathname: "/sale/report-page", params: { title } } as any);
  };

  const leftColumn = PURCHASE_REPORTS.filter((_, i) => i % 2 === 0);
  const rightColumn = PURCHASE_REPORTS.filter((_, i) => i % 2 === 1);

  return (
    <View className="flex-1 bg-white">
      <PageHeader title="Purchase Order Reports" />

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
