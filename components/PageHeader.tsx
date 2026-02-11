import { Ionicons } from "@expo/vector-icons";
import { type ReactNode } from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { useAppNavigation } from "../hooks/useAppNavigation";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  showBack?: boolean;
  /** Optional content rendered on the right side of the header (e.g. action buttons, badge) */
  rightContent?: ReactNode;
  /** Banner style: red rounded card matching dashboard headers */
  variant?: "default" | "banner";
  /** Optional long press handler (e.g. for resync) */
  onLongPress?: () => void;
  /** Extra content rendered below subtitle inside the banner */
  children?: ReactNode;
}

/**
 * PageHeader - Unified page header component
 * - "default": Simple white bar with back button + title (for sub-pages)
 * - "banner": Red rounded card header (for dashboards and main sections)
 */
export function PageHeader({
  title,
  subtitle,
  showBack = true,
  rightContent,
  variant = "default",
  onLongPress,
  children,
}: PageHeaderProps) {
  const { safeGoBack } = useAppNavigation();

  if (variant === "banner") {
    return (
      <View
        className="rounded-xl p-5 mb-4 flex-row justify-between items-center"
        style={{
          backgroundColor: "#EC1A52",
          shadowColor: "#989898",
          shadowOffset: { width: 4, height: 4 },
          shadowOpacity: 0.25,
          shadowRadius: 4,
          elevation: 4,
        }}
      >
        <TouchableOpacity
          className="flex-1"
          onLongPress={onLongPress}
          activeOpacity={onLongPress ? 0.8 : 1}
          disabled={!onLongPress}
        >
          <Text
            className="text-white font-semibold"
            style={{ fontSize: 28, letterSpacing: -0.5 }}
          >
            {title}
          </Text>
          {subtitle && (
            <Text
              className="text-white font-medium mt-1"
              style={{ fontSize: 16 }}
            >
              {subtitle}
            </Text>
          )}
          {children}
        </TouchableOpacity>
        {rightContent && <View className="ml-4">{rightContent}</View>}
      </View>
    );
  }

  // Default variant
  return (
    <View className="bg-white px-5 py-4 border-b border-gray-200 flex-row items-center">
      <View className="flex-row items-center flex-1 min-w-0">
        {showBack && (
          <TouchableOpacity
            onPress={() => safeGoBack()}
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
