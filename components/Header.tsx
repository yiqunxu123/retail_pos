import { Ionicons } from "@expo/vector-icons";
import { Text, TouchableOpacity, View } from "react-native";
import { useAppNavigation } from "../hooks/useAppNavigation";

interface HeaderProps {
  title: string;
  subtitle?: string;
  badge?: string;
  showBack?: boolean;
}

/**
 * Header - Page header with title, optional back button, and badge
 * Back button navigates to dashboard
 */
export function Header({ title, subtitle, badge, showBack = false }: HeaderProps) {
  const { navigateTo } = useAppNavigation();

  const handleBack = () => {
    navigateTo("/");
  };

  return (
    <View className="flex-row justify-between items-center px-6 py-4 bg-[#EC1A52] rounded-xl">
      <View className="flex-row items-center flex-1">
        {/* Back button */}
        {showBack && (
          <TouchableOpacity
            onPress={handleBack}
            className="mr-3 p-1"
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="menu" size={24} color="white" />
          </TouchableOpacity>
        )}
        
        <View className="flex-1">
          <Text className="text-white text-2xl font-bold">{title}</Text>
          {subtitle && (
            <Text className="text-white/80 text-sm mt-1">{subtitle}</Text>
          )}
        </View>
      </View>

      {/* Role badge */}
      {badge && (
        <View className="bg-[#F7F7F9] px-4 py-2 rounded">
          <Text className="text-gray-800 font-semibold text-sm">{badge}</Text>
        </View>
      )}
    </View>
  );
}
