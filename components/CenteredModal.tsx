/**
 * CenteredModal - 统一居中弹窗组件
 *
 * 提供一致的 width、maxHeight、阴影、关闭行为。
 * 所有居中 overlay 弹窗应使用此组件。
 *
 * 尺寸预设 (theme.modalSizes):
 *   sm   - 420px，简短确认
 *   md   - 560px，标准表单
 *   lg   - 720px，复杂内容
 *   xl   - 960px，大表格
 *   full - 92% 宽，maxWidth 1100
 */

import { colors, iconSize, modalContent, modalSizes } from "@/utils/theme";
import { Ionicons } from "@expo/vector-icons";
import React, { ReactNode, useEffect } from "react";
import {
  BackHandler,
  Dimensions,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ViewStyle,
} from "react-native";

export type ModalSizePreset = keyof typeof modalSizes;

export interface CenteredModalProps {
  visible: boolean;
  onClose: () => void;
  /** 尺寸预设，默认 md */
  size?: ModalSizePreset;
  /** 自定义宽度，覆盖 size */
  width?: number | string;
  /** 自定义 maxWidth */
  maxWidth?: number | string;
  /** 自定义 maxHeight */
  maxHeight?: number | string;
  /** 标题（显示在 header） */
  title?: string;
  /** 自定义 header（覆盖 title） */
  header?: ReactNode;
  /** header 容器 style（如自定义背景色） */
  headerStyle?: ViewStyle;
  /** 是否隐藏 header */
  hideHeader?: boolean;
  /** 是否显示关闭按钮，默认 true。自定义 header 若已含关闭按钮可设为 false */
  showCloseButton?: boolean;
  /** 内容是否可滚动，默认 true */
  scrollable?: boolean;
  /** 底部固定区域 */
  footer?: ReactNode;
  /**  children 替代默认 ScrollView 包裹 */
  children: ReactNode;
  /** 点击 backdrop 是否关闭，默认 true */
  closeOnBackdrop?: boolean;
  /** 是否支持 Android 返回键关闭，默认 true */
  closeOnBackPress?: boolean;
  /** 内容区 className */
  contentClassName?: string;
  /** 内容区 style */
  contentStyle?: ViewStyle;
  /** 内容区内边距，默认 true */
  contentPadding?: boolean;
  /** 是否包裹 KeyboardAvoidingView */
  keyboardAvoiding?: boolean;
}

function resolveSize(
  size: ModalSizePreset,
  overrides: { width?: number | string; maxWidth?: number | string; maxHeight?: number | string }
) {
  const preset = modalSizes[size];
  const { width: screenWidth } = Dimensions.get("window");

  let width: number | string = overrides.width ?? preset.width;
  let maxWidth: number | string | undefined =
    overrides.maxWidth ?? (typeof preset.maxWidth === "number" ? preset.maxWidth : undefined);
  let maxHeight: number | string =
    overrides.maxHeight ?? preset.maxHeight ?? "88%";

  // 百分比 maxWidth 转为数值
  if (typeof preset.maxWidth === "string" && preset.maxWidth.endsWith("%")) {
    const pct = parseInt(preset.maxWidth, 10) / 100;
    maxWidth = Math.round(screenWidth * pct);
  }

  return { width, maxWidth, maxHeight };
}

export function CenteredModal({
  visible,
  onClose,
  size = "md",
  width: widthOverride,
  maxWidth: maxWidthOverride,
  maxHeight: maxHeightOverride,
  title,
  header,
  headerStyle,
  hideHeader = false,
  showCloseButton = true,
  scrollable = true,
  footer,
  children,
  closeOnBackdrop = true,
  closeOnBackPress = true,
  contentClassName,
  contentStyle,
  contentPadding = true,
  keyboardAvoiding = false,
}: CenteredModalProps) {
  const { width, maxWidth, maxHeight } = resolveSize(size, {
    width: widthOverride,
    maxWidth: maxWidthOverride,
    maxHeight: maxHeightOverride,
  });

  useEffect(() => {
    if (!visible || !closeOnBackPress) return;
    const sub = BackHandler.addEventListener("hardwareBackPress", () => {
      onClose();
      return true;
    });
    return () => sub.remove();
  }, [visible, closeOnBackPress, onClose]);

  const backdrop = (
    <Pressable
      style={styles.backdrop}
      onPress={closeOnBackdrop ? onClose : undefined}
    >
      <Pressable
        style={[
          styles.content,
          {
            width,
            maxWidth: maxWidth as number | undefined,
            maxHeight,
            // 当 maxHeight 为百分比时，设 height 使弹窗占满该比例，减少内部 scroll
            ...(typeof maxHeight === "string" && maxHeight.endsWith("%")
              ? { height: maxHeight }
              : {}),
            flexDirection: "column",
          },
        ]}
        onPress={(e) => e.stopPropagation()}
      >
        {/* Header */}
        {!hideHeader && (
          <View style={[styles.header, headerStyle]}>
            {header ?? (title ? (
              <Text
                style={{ fontSize: modalContent.titleFontSize + 2, fontWeight: modalContent.titleFontWeight, color: modalContent.titleColor }}
              >
                {title}
              </Text>
            ) : null)}
            <View style={{ flex: 1 }} />
            {showCloseButton && (
              <TouchableOpacity
                onPress={onClose}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              >
                <Ionicons
                  name="close"
                  size={iconSize.xl}
                  color={colors.textSecondary}
                />
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Body */}
        {scrollable ? (
          <ScrollView
            style={styles.scrollBody}
            contentContainerStyle={[contentPadding ? styles.scrollContent : styles.scrollContentNoPadding, { width: "100%" }]}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <View className={contentClassName} style={[contentStyle, { width: "100%" }]}>
              {children}
            </View>
          </ScrollView>
        ) : (
          <View style={[contentPadding ? styles.body : styles.bodyNoPadding, { flex: 1 }]}>
            <View className={contentClassName} style={[contentStyle, { flex: 1, width: "100%" }]}>
              {children}
            </View>
          </View>
        )}

        {/* Footer */}
        {footer ? (
          <View style={styles.footer}>{footer}</View>
        ) : null}
      </Pressable>
    </Pressable>
  );

  const content = keyboardAvoiding ? (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.wrapper}
      keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
    >
      {backdrop}
    </KeyboardAvoidingView>
  ) : (
    <View style={styles.wrapper}>{backdrop}</View>
  );

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      {content}
    </Modal>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
  },
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  content: {
    backgroundColor: colors.white,
    borderRadius: 12,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 10,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    paddingHorizontal: "5%",
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  scrollBody: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: "5%",
    paddingVertical: 16,
    paddingBottom: "5%",
    flexGrow: 1,
  },
  scrollContentNoPadding: {
    padding: 0,
    flexGrow: 1,
  },
  body: {
    paddingHorizontal: "5%",
    paddingVertical: 16,
    paddingBottom: "5%",
  },
  bodyNoPadding: {
    padding: 0,
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    width: "100%",
    gap: 12,
    paddingHorizontal: "5%",
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
});
