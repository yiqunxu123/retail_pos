import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Text, TouchableOpacity, View } from "react-native";

interface PageHeaderProps {
  title: string;
  showBack?: boolean;
}

/**
 * PageHeader - Simple page header with optional back button
 * Used for subsection screens to navigate back to dashboard
 */
export function PageHeader({ title, showBack = true }: PageHeaderProps) {
  const router = useRouter();

  const handleBack = () => {
    router.back();
  };

  return (
    <View className="bg-white px-5 py-4 border-b border-gray-200 flex-row items-center">
      {showBack && (
        <TouchableOpacity
          onPress={handleBack}
          className="mr-4 p-1"
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="arrow-back" size={24} color="#374151" />
        </TouchableOpacity>
      )}
      <Text className="text-2xl font-bold text-gray-800">{title}</Text>
    </View>
  );
}
