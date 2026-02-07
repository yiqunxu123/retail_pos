import { Ionicons } from "@expo/vector-icons";
import { type ReactNode } from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { useAppNavigation } from "../hooks/useAppNavigation";

interface PageHeaderProps {
  title: string;
  showBack?: boolean;
  /** Optional content rendered on the right side of the header (e.g. action buttons) */
  rightContent?: ReactNode;
}

/**
 * PageHeader - Simple page header with optional back button
 * Used for subsection screens to navigate back to dashboard
 */
export function PageHeader({ title, showBack = true, rightContent }: PageHeaderProps) {
  const { safeGoBack } = useAppNavigation();

  const handleBack = () => {
    safeGoBack();
  };

  return (
    <View className="bg-white px-5 py-4 border-b border-gray-200 flex-row items-center">
      <View className="flex-row items-center flex-1 min-w-0">
        {showBack && (
          <TouchableOpacity
            onPress={handleBack}
            className="mr-4 p-1"
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="arrow-back" size={24} color="#374151" />
          </TouchableOpacity>
        )}
        <Text className="text-2xl font-bold text-gray-800 flex-shrink" numberOfLines={1}>
          {title}
        </Text>
      </View>
      {rightContent && <View className="ml-3">{rightContent}</View>}
    </View>
  );
}
