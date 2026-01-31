import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Alert, Pressable, ScrollView, Text, View } from "react-native";

// Sales report items
const SALES_REPORTS = [
  { id: "brand-velocity", title: "Brand Velocity Report" },
  { id: "item-velocity", title: "Item Velocity Report" },
  { id: "customer-velocity", title: "Customer Velocity Report" },
  { id: "detail-sales", title: "Detail Sales Report" },
  { id: "brand-velocity-2", title: "Brand Velocity Report" },
  { id: "detail-sales-2", title: "Detail Sales Report" },
  { id: "brand-velocity-3", title: "Brand Velocity Report" },
  { id: "detail-sales-3", title: "Detail Sales Report" },
  { id: "brand-velocity-4", title: "Brand Velocity Report" },
  { id: "detail-sales-4", title: "Detail Sales Report" },
  { id: "brand-velocity-5", title: "Brand Velocity Report" },
  { id: "detail-sales-5", title: "Detail Sales Report" },
  { id: "brand-velocity-6", title: "Brand Velocity Report" },
  { id: "detail-sales-6", title: "Detail Sales Report" },
  { id: "brand-velocity-7", title: "Brand Velocity Report" },
  { id: "detail-sales-7", title: "Detail Sales Report" },
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

export default function SalesReportsScreen() {
  const handleReportPress = (reportId: string, title: string) => {
    Alert.alert("View Report", `Opening ${title}...`);
  };

  const handleBack = () => {
    router.back();
  };

  // Split reports into two columns
  const leftColumn = SALES_REPORTS.filter((_, i) => i % 2 === 0);
  const rightColumn = SALES_REPORTS.filter((_, i) => i % 2 === 1);

  return (
    <View className="flex-1 bg-white">
      {/* Header with Back Button */}
      <View className="px-6 py-4 flex-row items-center">
        <Pressable onPress={handleBack} className="mr-4">
          <Ionicons name="arrow-back" size={24} color="#1A1A1A" />
        </Pressable>
        <Text className="text-2xl font-bold text-gray-900">Sales Reports</Text>
      </View>

      {/* Reports Grid - Two Columns */}
      <ScrollView className="flex-1 px-6">
        <View className="flex-row gap-4">
          {/* Left Column */}
          <View className="flex-1">
            {leftColumn.map((report) => (
              <ReportItem
                key={report.id}
                title={report.title}
                onPress={() => handleReportPress(report.id, report.title)}
              />
            ))}
          </View>

          {/* Right Column */}
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
