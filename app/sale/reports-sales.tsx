import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Pressable, ScrollView, Text, View } from "react-native";
import { PageHeader } from "../../components";

// Sales report items - route is the actual page path, null means placeholder
const SALES_REPORTS: { id: string; title: string; route: string | null }[] = [
  { id: "brand-velocity", title: "Brand Velocity Report", route: "/report/brand-velocity" },
  { id: "customer-velocity-yoy", title: "Customer Velocity Report (Year on Year)", route: "/report/customer-velocity-yoy" },
  { id: "category-velocity", title: "Category Velocity Report", route: "/report/category-velocity" },
  { id: "customer-category-velocity", title: "Customer Category Velocity Report", route: null },
  { id: "customer-category-sales", title: "Customer Category Sales Report", route: "/report/customer-category-sales" },
  { id: "customer-brand-velocity", title: "Customer Brand Velocity Report", route: null },
  { id: "customer-product-velocity", title: "Customer Product Velocity Report", route: null },
  { id: "county-velocity", title: "County Velocity Report", route: null },
  { id: "customer-velocity", title: "Customer Velocity Report", route: null },
  { id: "customer-performance", title: "Customer Performance Report", route: null },
  { id: "detail-sale", title: "Detail Sale Report", route: null },
  { id: "item-velocity", title: "Item Velocity Report", route: null },
  { id: "item-velocity-wow", title: "Item Velocity Report (Week on Week)", route: null },
  { id: "item-velocity-mom", title: "Item Velocity Report (Month on Month)", route: null },
  { id: "lost-sale", title: "Lost Sale Report", route: null },
  { id: "sales-summary", title: "Sales Summary Report", route: null },
  { id: "sales-rep-category", title: "Sales Rep Category Report", route: null },
  { id: "sales-rep-product", title: "Sales Rep Product Report", route: null },
  { id: "sales-rep-brand", title: "Sales Rep Brand Report", route: null },
];

interface ReportItemProps {
  title: string;
  onPress: () => void;
}

interface ReportConfig {
  id: string;
  title: string;
  route: string | null;
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
  const handleReportPress = (report: ReportConfig) => {
    if (report.route) {
      router.push(report.route as any);
    } else {
      router.push({ pathname: "/sale/report-page", params: { title: report.title } } as any);
    }
  };

  // Split reports into two columns
  const leftColumn = SALES_REPORTS.filter((_, i) => i % 2 === 0);
  const rightColumn = SALES_REPORTS.filter((_, i) => i % 2 === 1);

  return (
    <View className="flex-1 bg-[#F7F7F9]">
      <PageHeader title="Sales Reports" showBack />

      {/* Reports Grid - Two Columns */}
      <ScrollView className="flex-1 px-6">
        <View className="flex-row gap-4">
          {/* Left Column */}
          <View className="flex-1">
            {leftColumn.map((report: ReportConfig) => (
              <ReportItem
                key={report.id}
                title={report.title}
                onPress={() => handleReportPress(report)}
              />
            ))}
          </View>

          {/* Right Column */}
          <View className="flex-1">
            {rightColumn.map((report: ReportConfig) => (
              <ReportItem
                key={report.id}
                title={report.title}
                onPress={() => handleReportPress(report)}
              />
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
