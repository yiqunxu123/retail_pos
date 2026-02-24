import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Pressable, Text, ActivityIndicator } from "react-native";
import { colors, buttonSize, iconSize } from "@/utils/theme";

interface TableToolbarButtonProps {
  title?: string;
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  variant?: "primary" | "dark" | "surfaceDark";
  isLoading?: boolean;
  /** Override icon color (default: white) */
  iconColor?: string;
}

/**
 * TableToolbarButton - Reusable button for table toolbars (Refresh, Settings, etc.)
 * 统一高度 40px (buttonSize.md)，icon-only 模式为正方形
 */
export function TableToolbarButton({
  title,
  icon,
  onPress,
  variant = "primary",
  isLoading = false,
  iconColor,
}: TableToolbarButtonProps) {
  const isPrimary = variant === "primary";
  const isSurfaceDark = variant === "surfaceDark";
  const token = buttonSize.md;
  // Shopping cart style: primary/surfaceDark bg, white icon (no iconColor override)
  const useShoppingCartStyle = isSurfaceDark || (isPrimary && !iconColor);
  const useLightBg = !!iconColor && !useShoppingCartStyle;

  const getBackgroundColor = () => {
    if (useLightBg) return colors.white;
    if (isSurfaceDark) return colors.surfaceDark;
    if (isPrimary) return colors.primary;
    return colors.text;
  };

  return (
    <Pressable 
      onPress={onPress}
      disabled={isLoading}
      className="shadow-sm"
      style={({ pressed }) => ({
        height: token.height,
        width: title ? undefined : token.height,
        paddingHorizontal: title ? 24 : 0,
        borderRadius: token.borderRadius,
        flexDirection: "row" as const,
        alignItems: "center" as const,
        justifyContent: "center" as const,
        gap: 6,
        backgroundColor: getBackgroundColor(),
        borderWidth: useLightBg ? 2 : 0,
        borderColor: useLightBg ? (iconColor || colors.primary) : undefined,
        opacity: pressed ? 0.8 : 1,
      })}
    >
      {isLoading ? (
        <ActivityIndicator size="small" color="white" />
      ) : (
        <Ionicons name={icon} size={title ? iconSize.sm : iconSize.base} color={iconColor ?? "white"} />
      )}
      {title && (
        <Text className="text-white font-medium">
          {title}
        </Text>
      )}
    </Pressable>
  );
}
