import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Pressable, ScrollView, Text, View } from "react-native";
import { PageHeader } from "../../components";

// Report category configuration
const REPORT_CATEGORIES = [
  {
    id: "sales",
    title: "Sales Reports",
    icon: "cash-register",
    color: "#3B82F6", // Blue
    route: "/sale/reports-sales",
  },
  {
    id: "purchase",
    title: "Purchase Order Reports",
    icon: "tag-outline",
    color: "#14B8A6", // Teal
    route: "/sale/reports-purchase",
  },
  {
    id: "inventory",
    title: "Inventory Reports",
    icon: "archive-outline",
    color: "#1A1A1A", // Black
    route: "/sale/reports-inventory",
  },
  {
    id: "financial",
    title: "Financial Reports",
    icon: "bar-chart-outline",
    color: "#F59E0B", // Orange
    route: "/sale/reports-financial",
  },
  {
    id: "mas",
    title: "MAS Reports",
    icon: "currency-usd",
    color: "#6D28D9", // Purple
    route: "/sale/reports-mas",
  },
  {
    id: "legal",
    title: "Legal Reports",
    icon: "gavel",
    color: "#16A34A", // Green
    route: "/sale/reports-legal",
  },
];

// Reusable Report Card Component
function ReportCard({ 
  title, 
  icon, 
  color, 
  onPress 
}: { 
  title: string; 
  icon: any; 
  color: string; 
  onPress: () => void;
}) {
  return (
    <Pressable 
      onPress={onPress}
      className="flex-1 h-32 rounded-xl justify-center items-center p-4"
      style={{ backgroundColor: color }}
    >
      <View className="mb-2">
        {["cash-register", "tag-outline", "archive-outline", "bar-chart-outline", "currency-usd", "gavel"].includes(icon) ? (
          <MaterialCommunityIcons name={icon} size={32} color="white" />
        ) : (
          <Ionicons name={icon} size={32} color="white" />
        )}
      </View>
      <Text className="text-white font-bold text-center text-sm">{title}</Text>
    </Pressable>
  );
}

export default function ReportsScreen() {
  return (
    <View className="flex-1 bg-[#F7F7F9]">
      <PageHeader title="View Reports" showBack />

      {/* Report Categories Grid */}
      <ScrollView className="flex-1 px-6" contentContainerStyle={{ paddingVertical: 16 }}>
        {/* Row 1 */}
        <View className="flex-row gap-4 mb-4">
          <ReportCard
            title={REPORT_CATEGORIES[0].title}
            icon={REPORT_CATEGORIES[0].icon}
            color={REPORT_CATEGORIES[0].color}
            onPress={() => router.push(REPORT_CATEGORIES[0].route as any)}
          />
          <ReportCard
            title={REPORT_CATEGORIES[1].title}
            icon={REPORT_CATEGORIES[1].icon}
            color={REPORT_CATEGORIES[1].color}
            onPress={() => router.push(REPORT_CATEGORIES[1].route as any)}
          />
        </View>

        {/* Row 2 */}
        <View className="flex-row gap-4 mb-4">
          <ReportCard
            title={REPORT_CATEGORIES[2].title}
            icon={REPORT_CATEGORIES[2].icon}
            color={REPORT_CATEGORIES[2].color}
            onPress={() => router.push(REPORT_CATEGORIES[2].route as any)}
          />
          <ReportCard
            title={REPORT_CATEGORIES[3].title}
            icon={REPORT_CATEGORIES[3].icon}
            color={REPORT_CATEGORIES[3].color}
            onPress={() => router.push(REPORT_CATEGORIES[3].route as any)}
          />
        </View>

        {/* Row 3 */}
        <View className="flex-row gap-4 mb-4">
          <ReportCard
            title={REPORT_CATEGORIES[4].title}
            icon={REPORT_CATEGORIES[4].icon}
            color={REPORT_CATEGORIES[4].color}
            onPress={() => router.push(REPORT_CATEGORIES[4].route as any)}
          />
          <ReportCard
            title={REPORT_CATEGORIES[5].title}
            icon={REPORT_CATEGORIES[5].icon}
            color={REPORT_CATEGORIES[5].color}
            onPress={() => router.push(REPORT_CATEGORIES[5].route as any)}
          />
        </View>
      </ScrollView>
    </View>
  );
}
