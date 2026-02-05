import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Pressable, ScrollView, Text, View } from "react-native";
import { PageHeader } from "../../components";

// Sales report items
const SALES_REPORTS = [
  { id: "brand-velocity", title: "Brand Velocity Report", route: "/sale/reports/brand-velocity" },
  { id: "customer-velocity-yoy", title: "Customer Velocity Report (Year on Year)", route: "/sale/reports/customer-velocity-yoy" },
  { id: "category-velocity", title: "Category Velocity Report", route: "/sale/reports/category-velocity" },
  { id: "customer-category-velocity", title: "Customer Category Velocity Report", route: "/sale/reports/customer-category-velocity" },
  { id: "customer-category-sales", title: "Customer Category Sales Report", route: "/sale/reports/customer-category-sales" },
  { id: "customer-brand-velocity", title: "Customer Brand Velocity Report", route: "/sale/reports/customer-brand-velocity" },
  { id: "customer-product-velocity", title: "Customer Product Velocity Report", route: "/sale/reports/customer-product-velocity" },
  { id: "county-velocity", title: "County Velocity Report", route: "/sale/reports/county-velocity" },
  { id: "customer-velocity", title: "Customer Velocity Report", route: "/sale/reports/customer-velocity" },
  { id: "customer-performance", title: "Customer Performance Report", route: "/sale/reports/customer-performance" },
  { id: "detail-sale", title: "Detail Sale Report", route: "/sale/reports/detail-sale" },
  { id: "item-velocity", title: "Item Velocity Report", route: "/sale/reports/item-velocity" },
  { id: "item-velocity-wow", title: "Item Velocity Report (Week on Week)", route: "/sale/reports/item-velocity-wow" },
  { id: "item-velocity-mom", title: "Item Velocity Report (Month on Month)", route: "/sale/reports/item-velocity-mom" },
  { id: "lost-sale", title: "Lost Sale Report", route: "/sale/reports/lost-sale" },
  { id: "sales-summary", title: "Sales Summary Report", route: "/sale/reports/sales-summary" },
  { id: "sales-rep-category", title: "Sales Rep Category Report", route: "/sale/reports/sales-rep-category" },
  { id: "sales-rep-product", title: "Sales Rep Product Report", route: "/sale/reports/sales-rep-product" },
  { id: "sales-rep-brand", title: "Sales Rep Brand Report", route: "/sale/reports/sales-rep-brand" },
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

export default function SalesReportsScreen() {
  const handleReportPress = (route: string) => {
    router.push(route as any);
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
                onPress={() => handleReportPress(report.route)}
              />
            ))}
          </View>

          {/* Right Column */}
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
