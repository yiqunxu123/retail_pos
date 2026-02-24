/**
 * LeftSlidePanel - 通用左滑弹窗组件
 *
 * 结构与 SearchProductModal 一致，分为三部分：
 * - 头（Header）: 标题 + 关闭按钮
 * - 体（Body）: 可选，主内容区域
 * - 底（Footer）: 可选，底部固定区域
 *
 * 用于 Search Product（头+体+底）、Add Note（仅头）等场景。
 */

import { colors, spacing } from "@/utils/theme";
import React, { forwardRef, useCallback, useEffect, useImperativeHandle, useMemo, useRef } from "react";
import {
  Animated,
  BackHandler,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { CloseButton } from "./CloseButton";

const PANEL_WIDTH_RATIO = 0.5;
const BACKDROP_MAX_OPACITY = 0.35;

export interface LeftSlidePanelHandle {
  open: () => void;
  close: (reason?: string) => void;
  isOpen: () => boolean;
}

export interface LeftSlidePanelProps {
  /**  controlled: visible 由外部控制；uncontrolled: 通过 ref 控制 */
  visible?: boolean;
  onClose: (reason?: string) => void;
  title: string;
  /** 主内容区（内容 + 分页等），不传则不渲染 body */
  body?: React.ReactNode;
  /** 底部固定区，不传则不渲染 footer */
  footer?: React.ReactNode;
  /** 自定义 header 右侧（如需要替换关闭按钮或添加操作） */
  headerRight?: React.ReactNode;
}

const LeftSlidePanel = forwardRef<LeftSlidePanelHandle, LeftSlidePanelProps>(
  function LeftSlidePanel(
    { visible, onClose, title, body, footer, headerRight },
    ref
  ) {
    const isControlled = typeof visible === "boolean";
    const controlledVisible = visible ?? false;
    const insets = useSafeAreaInsets();
    const { width } = useWindowDimensions();
    const panelWidth = Math.max(1, Math.round(width * PANEL_WIDTH_RATIO));

    const safeAreaPadding = useMemo(
      () =>
        Platform.OS === "android"
          ? {
              paddingTop: insets.top,
              paddingLeft: insets.left,
              paddingRight: insets.right,
            }
          : null,
      [insets.left, insets.right, insets.top]
    );

    const [isPanelOpen, setIsPanelOpen] = React.useState(controlledVisible);
    const progress = useRef(new Animated.Value(controlledVisible ? 1 : 0)).current;
    const isOpenRef = useRef(controlledVisible);
    const targetOpenRef = useRef(controlledVisible);

    const panelTranslateX = useMemo(
      () =>
        progress.interpolate({
          inputRange: [0, 1],
          outputRange: [-panelWidth, 0],
        }),
      [panelWidth, progress]
    );
    const backdropOpacity = useMemo(
      () =>
        progress.interpolate({
          inputRange: [0, 1],
          outputRange: [0, BACKDROP_MAX_OPACITY],
        }),
      [progress]
    );

    const animateTo = useCallback(
      (nextOpen: boolean, reason: string) => {
        if (targetOpenRef.current === nextOpen && isOpenRef.current === nextOpen) {
          return;
        }
        targetOpenRef.current = nextOpen;
        progress.stopAnimation();
        progress.setValue(nextOpen ? 1 : 0);
        isOpenRef.current = nextOpen;
        targetOpenRef.current = nextOpen;
        setIsPanelOpen(nextOpen);
      },
      [progress]
    );

    useImperativeHandle(
      ref,
      () => ({
        open: () => animateTo(true, "imperative"),
        close: (reason = "manual") => animateTo(false, reason),
        isOpen: () => isOpenRef.current,
      }),
      [animateTo]
    );

    useEffect(() => {
      if (!isControlled) return;
      animateTo(controlledVisible, "controlled");
    }, [animateTo, controlledVisible, isControlled]);

    useEffect(() => {
      const sub = BackHandler.addEventListener("hardwareBackPress", () => {
        if (!isOpenRef.current) return false;
        onClose("hardware_back");
        return true; // consume event
      });
      return () => sub.remove();
    }, [onClose]);

    /** 用户点击关闭/背景时通知父级，由父级调用 ref.close() 执行关闭动画 */
    const handleBackdropPress = useCallback(() => {
      onClose("backdrop");
    }, [onClose]);

    const handleClosePress = useCallback(() => {
      onClose("close_button");
    }, [onClose]);

    const rootPointerEvents = isPanelOpen ? "box-none" : "none";

    return (
      <View pointerEvents={rootPointerEvents} style={styles.rootContainer}>
        <Animated.View
          pointerEvents="none"
          style={[styles.backdrop, { opacity: backdropOpacity }]}
        />
        <View pointerEvents="none" style={styles.touchGate}>
          <View pointerEvents="none" style={{ width: panelWidth }} />
          <Pressable style={styles.backdropPressArea} onPress={handleBackdropPress} />
        </View>
        <Animated.View
          pointerEvents={isPanelOpen ? "auto" : "none"}
          style={[
            styles.panel,
            { width: panelWidth, transform: [{ translateX: panelTranslateX }] },
          ]}
        >
          <View style={[styles.panelInner, safeAreaPadding]}>
            {/* Header: 标题 + 关闭（与 ActionCard/CashEntryModal 等一致） */}
            <View style={styles.header}>
              <View className="flex-row items-center justify-between">
                <Text
                  className="text-2xl font-semibold"
                  style={{ color: colors.text }}
                >
                  {title}
                </Text>
                {headerRight ?? (
                  <CloseButton onPress={handleClosePress} />
                )}
              </View>
            </View>

            {/* Body: 仅在有 body 时渲染 */}
            {body != null ? (
              <View style={styles.body}>{body}</View>
            ) : null}

            {/* Footer: 仅在有 footer 时渲染 */}
            {footer != null ? (
              <View style={styles.footer}>{footer}</View>
            ) : null}
          </View>
        </Animated.View>
      </View>
    );
  }
);

const styles = StyleSheet.create({
  rootContainer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1000,
    elevation: 1000,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#000000",
  },
  touchGate: {
    ...StyleSheet.absoluteFillObject,
    flexDirection: "row",
    zIndex: 1,
  },
  backdropPressArea: {
    flex: 1,
  },
  panel: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    height: "100%",
    backgroundColor: "#ffffff",
    borderRightWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    shadowColor: "#000000",
    shadowOpacity: 0.12,
    shadowRadius: 8,
    shadowOffset: { width: 2, height: 0 },
    elevation: 8,
    zIndex: 2,
  },
  panelInner: {
    flex: 1,
  },
  header: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
    paddingBottom: spacing.md,
    backgroundColor: "#ffffff",
  },
  body: {
    flex: 1,
    minHeight: 200,
    overflow: "hidden",
  },
  footer: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    backgroundColor: "#ffffff",
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
});

export { LeftSlidePanel };
