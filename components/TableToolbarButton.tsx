import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Pressable, Text, ActivityIndicator } from "react-native";

interface TableToolbarButtonProps {
  title?: string;
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  variant?: "primary" | "dark";
  isLoading?: boolean;
}

/**
 * TableToolbarButton - Reusable button for table toolbars (Refresh, Settings, etc.)
 */
export function TableToolbarButton({
  title,
  icon,
  onPress,
  variant = "primary",
  isLoading = false,
}: TableToolbarButtonProps) {
  const isPrimary = variant === "primary";
  
  return (
    <Pressable 
      onPress={onPress}
      disabled={isLoading}
      className={`${
        isPrimary ? "bg-[#EC1A52] px-6" : "bg-[#1A1A1A] px-3"
      } py-2.5 rounded-lg flex-row items-center justify-center gap-2 active:opacity-80`}
    >
      {isLoading ? (
        <ActivityIndicator size="small" color="white" />
      ) : (
        <Ionicons name={icon} size={isPrimary ? 20 : 24} color="white" />
      )}
      {title && (
        <Text className="text-white font-Montserrat font-semibold text-[16px]">
          {title}
        </Text>
      )}
    </Pressable>
  );
}
