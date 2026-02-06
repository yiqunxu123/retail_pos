import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Pressable, ScrollView, Text, View } from "react-native";
import { PageHeader } from "../../components";

// Sales report items
const SALES_REPORTS = [
  { id: "brand-velocity", title: "Brand Velocity Report" },
  { id: "customer-velocity-yoy", title: "Customer Velocity Report (Year on Year)" },
  { id: "category-velocity", title: "Category Velocity Report" },
  { id: "customer-category-velocity", title: "Customer Category Velocity Report" },
  { id: "customer-category-sales", title: "Customer Category Sales Report" },
  { id: "customer-brand-velocity", title: "Customer Brand Velocity Report" },
  { id: "customer-product-velocity", title: "Customer Product Velocity Report" },
  { id: "county-velocity", title: "County Velocity Report" },
  { id: "customer-velocity", title: "Customer Velocity Report" },
  { id: "customer-performance", title: "Customer Performance Report" },
  { id: "detail-sale", title: "Detail Sale Report" },
  { id: "item-velocity", title: "Item Velocity Report" },
  { id: "item-velocity-wow", title: "Item Velocity Report (Week on Week)" },
  { id: "item-velocity-mom", title: "Item Velocity Report (Month on Month)" },
  { id: "lost-sale", title: "Lost Sale Report" },
  { id: "sales-summary", title: "Sales Summary Report" },
  { id: "sales-rep-category", title: "Sales Rep Category Report" },
  { id: "sales-rep-product", title: "Sales Rep Product Report" },
  { id: "sales-rep-brand", title: "Sales Rep Brand Report" },
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

export default function SalesReportsScreen() {
  const handleReportPress = (title: string) => {
    router.push({ pathname: "/sale/report-page", params: { title } } as any);
  };

  // Split reports into two columns
  const leftColumn = SALES_REPORTS.filter((_, i) => i % 2 === 0);
  const rightColumn = SALES_REPORTS.filter((_, i) => i % 2 === 1);

  return (
    <View className="flex-1 bg-white">
      <PageHeader title="Sales Reports" />

      {/* Reports Grid - Two Columns */}
      <ScrollView className="flex-1 px-6">
        <View className="flex-row gap-4">
          {/* Left Column */}
          <View className="flex-1">
            {leftColumn.map((report: ReportConfig) => (
              <ReportItem
                key={report.id}
                title={report.title}
                onPress={() => handleReportPress(report.title)}
              />
            ))}
          </View>

          {/* Right Column */}
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
