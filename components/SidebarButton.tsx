import { Text, Pressable, View } from "react-native";
import { ReactNode } from "react";

type ButtonVariant = "default" | "active" | "primary" | "danger" | "warning";

interface SidebarButtonProps {
  label: string;
  icon?: ReactNode;
  variant?: ButtonVariant;
  onPress?: () => void;
  fullWidth?: boolean;
  disabled?: boolean;
}

// Maps variant to style classes
const variantStyles: Record<ButtonVariant, string> = {
  default: "bg-white border border-gray-200",
  active: "bg-blue-50 border-l-4 border-l-blue-500 border-y border-r border-gray-200",
  primary: "bg-purple-600",
  danger: "bg-red-500",
  warning: "bg-yellow-400",
};

const textStyles: Record<ButtonVariant, string> = {
  default: "text-gray-700 font-medium",
  active: "text-blue-700 font-semibold",
  primary: "text-white font-medium",
  danger: "text-white font-medium",
  warning: "text-gray-800 font-medium",
};

/**
 * SidebarButton - Action button for the sidebar
 * Supports multiple variants and disabled state
 */
export function SidebarButton({
  label,
  icon,
  variant = "default",
  onPress,
  fullWidth = true,
  disabled = false,
}: SidebarButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      className={`
        ${variantStyles[variant]}
        ${fullWidth ? "w-full" : "flex-1"}
        min-h-[48px] px-3 py-3 rounded-lg
        justify-center items-center
        ${disabled ? "opacity-50" : ""}
      `}
      style={({ pressed }) => ({ opacity: disabled ? 0.5 : pressed ? 0.7 : 1 })}
    >
      <View className="flex-row items-center gap-2">
        {icon}
        <Text
          className={`${textStyles[variant]} text-sm text-center`}
          numberOfLines={2}
          adjustsFontSizeToFit
          minimumFontScale={0.8}
        >
          {label}
        </Text>
      </View>
    </Pressable>
  );
}
