import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { ActivityIndicator, Pressable, Text, ViewStyle, TextStyle } from "react-native";
import { buttonSize, colors, iconSize as iconSizeTokens } from "@/utils/theme";

// ============================================================================
// ThemedButton — 全局统一按钮组件
// ============================================================================
//
// 用法:
//   <ThemedButton title="Save" onPress={save} />
//   <ThemedButton title="Cancel" variant="outline" onPress={cancel} />
//   <ThemedButton icon="settings-outline" variant="dark" size="md" onPress={open} />
//   <ThemedButton title="Delete" variant="danger" size="md" onPress={del} />

type ButtonSize = "xs" | "sm" | "md" | "lg" | "xl";
type ButtonVariant = "primary" | "outline" | "ghost" | "dark" | "danger" | "secondary";

interface ThemedButtonProps {
  title?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  onPress?: () => void;
  size?: ButtonSize;
  variant?: ButtonVariant;
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

const VARIANT_STYLES: Record<ButtonVariant, { bg: string; text: string; border?: string }> = {
  primary:   { bg: colors.primary,             text: colors.textWhite },
  outline:   { bg: "transparent",              text: colors.text,          border: colors.border },
  ghost:     { bg: "transparent",              text: colors.text },
  dark:      { bg: colors.text,                text: colors.textWhite },
  danger:    { bg: colors.error,               text: colors.textWhite },
  secondary: { bg: colors.backgroundSecondary, text: colors.text },
};

export function ThemedButton({
  title,
  icon,
  onPress,
  size = "md",
  variant = "primary",
  disabled = false,
  loading = false,
  fullWidth = false,
  style,
  textStyle,
}: ThemedButtonProps) {
  const token = buttonSize[size];
  const variantStyle = VARIANT_STYLES[variant];

  const containerStyle: ViewStyle = {
    height: token.height,
    paddingHorizontal: icon && !title ? 0 : token.paddingHorizontal,
    width: icon && !title ? token.height : undefined, // icon-only: square
    borderRadius: token.borderRadius,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: title && icon ? 6 : 0,
    backgroundColor: disabled ? colors.backgroundSecondary : variantStyle.bg,
    borderWidth: variantStyle.border ? 1 : 0,
    borderColor: variantStyle.border,
    opacity: disabled ? 0.6 : 1,
    ...(fullWidth ? { flex: 1 } : {}),
    ...style,
  };

  const labelStyle: TextStyle = {
    fontSize: token.fontSize,
    fontWeight: token.fontWeight,
    color: disabled ? colors.textTertiary : variantStyle.text,
    fontFamily: "Montserrat",
    ...textStyle,
  };

  const iconColor = disabled ? colors.textTertiary : variantStyle.text;
  const iconSz = token.iconSize;

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [containerStyle, pressed && { opacity: 0.8 }]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={iconColor} />
      ) : icon ? (
        <Ionicons name={icon} size={iconSz} color={iconColor} />
      ) : null}
      {title ? <Text style={labelStyle}>{title}</Text> : null}
    </Pressable>
  );
}

export default ThemedButton;
