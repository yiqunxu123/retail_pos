import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Alert, Pressable, ScrollView, Text, View } from "react-native";
import { PageHeader } from "../../components";

interface ReportItem {
  id: string;
  name: string;
  route: string | null;
}

const REPORTS_LEFT: ReportItem[] = [
  { id: "1", name: "Brand Velocity Report", route: "/report/brand-velocity" },
  { id: "2", name: "Category Velocity Report", route: "/report/category-velocity" },
  { id: "3", name: "Customer Sales Report", route: "/report/customer-category-sales" },
  { id: "4", name: "Customer Velocity Report", route: "/report/customer-velocity-yoy" },
];

const REPORTS_RIGHT: ReportItem[] = [
  { id: "5", name: "Lost Sale Report", route: null },
  { id: "6", name: "Detail Sale Report", route: null },
  { id: "7", name: "Sales Summary Report", route: null },
  { id: "8", name: "Sales Rep Category Report", route: null },
];

export default function ReportingScreen() {
  const router = useRouter();

  const ReportRow = ({ item }: { item: ReportItem }) => (
    <Pressable
      onPress={() => {
        if (item.route) {
          router.push(item.route as any);
        } else {
          Alert.alert(item.name, "Coming soon");
        }
      }}
      className="flex-row items-center justify-between py-4 px-5 border-b border-gray-100 active:bg-gray-50"
    >
      <Text className={`text-base flex-1 ${item.route ? "text-gray-800" : "text-gray-400"}`}>{item.name}</Text>
      <Ionicons name="chevron-forward" size={20} color={item.route ? "#9ca3af" : "#d1d5db"} />
    </Pressable>
  );

  return (
    <View className="flex-1 bg-[#F7F7F9]">
      {/* Header */}
      <PageHeader title="Business Reporting" showBack={false} />

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
