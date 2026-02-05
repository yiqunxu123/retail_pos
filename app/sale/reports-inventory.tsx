import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Pressable, ScrollView, Text, View } from "react-native";
import { PageHeader } from "../../components";

const INVENTORY_REPORTS = [
  { id: "back-order", title: "Back Order Report", route: "/sale/reports/back-order" },
  { id: "inventory-valuation", title: "Inventory Valuation Report", route: "/sale/reports/inventory-valuation" },
  { id: "inventory-spot-check", title: "Inventory Spot Check Report", route: "/sale/reports/inventory-spot-check" },
  { id: "inventory-adjustment", title: "Inventory Adjustment Report", route: "/sale/reports/inventory-adjustment" },
  { id: "on-hold", title: "On Hold Report", route: "/sale/reports/on-hold" },
  { id: "partially-fulfilled", title: "Partially Fulfilled Report", route: "/sale/reports/partially-fulfilled" },
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

export default function InventoryReportsScreen() {
  const handleReportPress = (route: string) => {
    router.push(route as any);
  };

  const leftColumn = INVENTORY_REPORTS.filter((_, i) => i % 2 === 0);
  const rightColumn = INVENTORY_REPORTS.filter((_, i) => i % 2 === 1);

  return (
    <View className="flex-1 bg-white">
      <PageHeader title="Inventory Reports" />

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
