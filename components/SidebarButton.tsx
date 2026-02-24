import React, { ReactNode } from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { colors, buttonSize } from '@/utils/theme';

interface SidebarButtonProps {
  title: string;
  icon?: ReactNode;
  onPress?: () => void;
  onLongPress?: () => void;
  variant?: "primary" | "secondary" | "outline" | "danger" | "ghost" | "purple-outline" | "purple" | "yellow";
  fullWidth?: boolean;
  disabled?: boolean;
}

// Consistent text style for all button states
const TEXT_STYLE = {
  fontSize: 18,
  fontWeight: '400' as const,
};

/**
 * SidebarButton - Unified button component for all sidebars
 * Supports multiple variants to match design specifications
 */
export function SidebarButton({
  title,
  icon,
  onPress,
  onLongPress,
  variant = "outline",
  fullWidth = true,
  disabled = false,
}: SidebarButtonProps) {
  // Styles based on variant
  const getStyles = () => {
    switch (variant) {
      case "primary":
        return {
          container: { backgroundColor: colors.primary, borderWidth: 0 },
          text: { color: colors.textWhite },
          iconColor: colors.textWhite,
        };
      case "danger":
        return {
          container: { backgroundColor: colors.error, borderWidth: 0 },
          text: { color: colors.textWhite },
          iconColor: colors.textWhite,
        };
      case "yellow":
        return {
          container: { backgroundColor: colors.warning, borderWidth: 0 },
          text: { color: colors.text },
          iconColor: colors.text,
        };
      case "secondary":
        return {
          container: { backgroundColor: colors.backgroundSecondary, borderWidth: 1, borderColor: colors.borderMedium },
          text: { color: colors.textSecondary },
          iconColor: colors.textSecondary,
        };
      case "ghost":
        return {
          container: { backgroundColor: colors.backgroundTertiary, borderWidth: 1, borderColor: colors.textTertiary },
          text: { color: colors.textTertiary },
          iconColor: colors.textTertiary,
        };
      case "purple-outline":
        return {
          container: { backgroundColor: colors.backgroundTertiary, borderWidth: 1, borderColor: colors.purple },
          text: { color: colors.purple },
          iconColor: colors.purple,
        };
      case "purple":
        return {
          container: { backgroundColor: colors.purple, borderWidth: 0 },
          text: { color: colors.textWhite },
          iconColor: colors.textWhite,
        };
      case "outline":
      default:
        return {
          container: { backgroundColor: colors.white, borderWidth: 1, borderColor: colors.primary },
          text: { color: colors.primary },
          iconColor: colors.primary,
        };
    }
  };

  const styles = getStyles();
  const iconWithColor = icon ? (
    typeof icon === "object" && "props" in icon ? (
      // If it's a vector icon, we try to clone it with the correct color
      React.cloneElement(icon as any, { color: styles.iconColor })
    ) : (
      icon
    )
  ) : null;

  const content = (
    <>
      {iconWithColor}
      <Text style={{ ...TEXT_STYLE, ...styles.text, textAlign: "center", marginTop: 4, marginHorizontal: 4 }}>
        {title}
      </Text>
    </>
  );

  const h = buttonSize.sidebar.height;

  if (disabled || (!onPress && !onLongPress)) {
    return (
      <View
        className={`${fullWidth ? "w-full" : "flex-1"} rounded-lg justify-center items-center`}
        style={{ height: h, ...styles.container, opacity: disabled ? 0.6 : 1 }}
      >
        {content}
      </View>
    );
  }

  return (
    <TouchableOpacity
      onPress={onPress}
      onLongPress={onLongPress}
      className={`${fullWidth ? "w-full" : "flex-1"} rounded-lg justify-center items-center`}
      style={{ height: h, ...styles.container }}
    >
      {content}
    </TouchableOpacity>
  );
}
