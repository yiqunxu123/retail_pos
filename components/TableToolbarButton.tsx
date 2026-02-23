import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Pressable, Text, ActivityIndicator } from "react-native";
import { colors, buttonSize, iconSize } from "@/utils/theme";

interface TableToolbarButtonProps {
  title?: string;
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  variant?: "primary" | "dark";
  isLoading?: boolean;
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
}: TableToolbarButtonProps) {
  const isPrimary = variant === "primary";
  const token = buttonSize.md; // 统一使用 md: height 40
  
  return (
    <Pressable 
      onPress={onPress}
      disabled={isLoading}
      style={({ pressed }) => ({
        height: token.height,
        width: title ? undefined : token.height, // icon-only: 正方形
        paddingHorizontal: title ? token.paddingHorizontal : 0,
        borderRadius: token.borderRadius,
        flexDirection: "row" as const,
        alignItems: "center" as const,
        justifyContent: "center" as const,
        gap: title ? 6 : 0,
        backgroundColor: isPrimary ? colors.primary : colors.text,
        opacity: pressed ? 0.8 : 1,
      })}
    >
      {isLoading ? (
        <ActivityIndicator size="small" color="white" />
      ) : (
        <Ionicons name={icon} size={iconSize.base} color="white" />
      )}
      {title && (
        <Text style={{
          color: colors.textWhite,
          fontFamily: "Montserrat",
          fontWeight: token.fontWeight,
          fontSize: token.fontSize,
        }}>
          {title}
        </Text>
      )}
    </Pressable>
  );
}
