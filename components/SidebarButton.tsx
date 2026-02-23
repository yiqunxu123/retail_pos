import React, { ReactNode } from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { fontSize, fontWeight, colors } from '@/utils/theme';

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
  fontSize: fontSize.lg,
  fontWeight: fontWeight.semibold,
  fontFamily: "Montserrat",
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
          container: { backgroundColor: "#E64A19", borderWidth: 0 },
          text: { color: colors.textWhite },
          iconColor: colors.textWhite,
        };
      case "yellow":
        return {
          container: { backgroundColor: "#FFD54F", borderWidth: 0 },
          text: { color: "#212121" },
          iconColor: "#212121",
        };
      case "secondary":
        return {
          container: { backgroundColor: "#EEEEEE", borderWidth: 1, borderColor: "#BDBDBD" },
          text: { color: "#757575" },
          iconColor: "#757575",
        };
      case "ghost":
        return {
          container: { backgroundColor: colors.backgroundTertiary, borderWidth: 1, borderColor: "#848484" },
          text: { color: "#848484" },
          iconColor: "#848484",
        };
      case "purple-outline":
        return {
          container: { backgroundColor: colors.backgroundTertiary, borderWidth: 1, borderColor: "#5F4BB6" },
          text: { color: "#5F4BB6" },
          iconColor: "#5F4BB6",
        };
      case "purple":
        return {
          container: { backgroundColor: "#5F4BB6", borderWidth: 0 },
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

  if (disabled || (!onPress && !onLongPress)) {
    return (
      <View
        className={`${fullWidth ? "w-full" : "flex-1"} rounded-lg justify-center items-center`}
        style={{ height: 100, ...styles.container, opacity: disabled ? 0.6 : 1 }}
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
      style={{ height: 100, ...styles.container }}
    >
      {content}
    </TouchableOpacity>
  );
}
