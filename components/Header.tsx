import { Text, View } from "react-native";

interface HeaderProps {
  title: string;
  subtitle?: string;
  badge?: string;
}

/**
 * Header - Dashboard header with title and optional badge
 * Displays welcome message and user role badge
 */
export function Header({ title, subtitle, badge }: HeaderProps) {
  return (
    <View className="flex-row justify-between items-center px-6 py-4 bg-red-500 rounded-xl">
      <View className="flex-1">
        <Text className="text-white text-2xl font-bold">{title}</Text>
        {subtitle && (
          <Text className="text-white/80 text-sm mt-1">{subtitle}</Text>
        )}
      </View>

      {/* Role badge */}
      {badge && (
        <View className="bg-white px-4 py-2 rounded">
          <Text className="text-gray-800 font-semibold text-sm">{badge}</Text>
        </View>
      )}
    </View>
  );
}
