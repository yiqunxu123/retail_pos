/**
 * CloseButton - 统一的关闭/删除按钮
 *
 * 用于所有弹窗、面板的关闭按钮，保持全 app 一致。
 * 样式参考：CashEntryModal, CashResultModal, AmountPadModal 等
 */

import { colors, iconSize } from "@/utils/theme";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Pressable } from "react-native";

interface CloseButtonProps {
  onPress: () => void;
  size?: keyof typeof iconSize;
  /** 默认深色图标；设为 light 时用于深色/primary 背景（如 CustomerDetailsModal） */
  variant?: "default" | "light";
}

/** 统一的关闭按钮：图标 X，无背景 */
export function CloseButton({
  onPress,
  size = "2xl",
  variant = "default",
}: CloseButtonProps) {
  const iconColor = variant === "light" ? colors.textWhite : colors.textDark;
  return (
    <Pressable
      onPress={onPress}
      hitSlop={8}
      style={({ pressed }) => ({ opacity: pressed ? 0.55 : 1 })}
    >
      <Ionicons name="close" size={iconSize[size]} color={iconColor} />
    </Pressable>
  );
}
