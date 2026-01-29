import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Pressable, ScrollView, Text, View } from "react-native";
import { PageHeader } from "../../components";

interface ReportItem {
  id: string;
  name: string;
  route: string;
}

const REPORTS_LEFT: ReportItem[] = [
  { id: "1", name: "Brand Velocity Report", route: "/report/brand-velocity" },
  { id: "2", name: "Category Velocity Report", route: "/report/category-velocity" },
  { id: "3", name: "Customer Sales Report", route: "/report/customer-category-sales" },
  { id: "4", name: "Customer Velocity Report", route: "/report/customer-velocity-yoy" },
];

const REPORTS_RIGHT: ReportItem[] = [
  { id: "5", name: "Lost Sale Report", route: "/report/lost-sales" },
  { id: "6", name: "Detail Sale Report", route: "/report/detail-sales" },
  { id: "7", name: "Sales Summary Report", route: "/report/sales-summary" },
  { id: "8", name: "Sales Rep Category Report", route: "/report/sales-rep-category" },
];

export default function ReportingScreen() {
  const router = useRouter();

  const ReportRow = ({ item }: { item: ReportItem }) => (
    <Pressable
      onPress={() => router.push(item.route as any)}
      className="flex-row items-center justify-between py-4 px-5 border-b border-gray-100 active:bg-gray-50"
    >
      <Text className="text-gray-800 text-base flex-1">{item.name}</Text>
      <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
    </Pressable>
  );

  return (
    <View className="flex-1 bg-white">
      {/* Header */}
      <PageHeader title="Business Reporting" />

      {/* Reports Grid */}
      <ScrollView className="flex-1" contentContainerClassName="p-5">
        <View className="flex-row">
          {/* Left Column */}
          <View className="flex-1 border-r border-gray-100">
            {REPORTS_LEFT.map((item) => (
              <ReportRow key={item.id} item={item} />
            ))}
          </View>

          {/* Right Column */}
          <View className="flex-1">
            {REPORTS_RIGHT.map((item) => (
              <ReportRow key={item.id} item={item} />
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
