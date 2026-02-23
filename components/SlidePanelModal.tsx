/**
 * SlidePanelModal - Shared left slide-in panel (50% width)
 * Same size as SearchProductModal for consistency across Add Product, Add Customer, etc.
 */

import { buttonSize, colors, iconSize } from "@/utils/theme";
import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useMemo } from "react";
import {
  BackHandler,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const PANEL_WIDTH_RATIO = 0.5;
const BACKDROP_OPACITY = 0.35;

export interface SlidePanelModalProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  /** Optional footer (e.g. Cancel/Save buttons). Rendered fixed at bottom. */
  footer?: React.ReactNode;
  /** If true, children are wrapped in ScrollView with standard padding. Default true. */
  scrollable?: boolean;
  /** Custom content padding. Default { horizontal: 24, bottom: 100 } */
  contentPadding?: { horizontal?: number; bottom?: number };
}

export function SlidePanelModal({
  visible,
  onClose,
  title,
  children,
  footer,
  scrollable = true,
  contentPadding = { horizontal: 24, bottom: 100 },
}: SlidePanelModalProps) {
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const panelWidth = Math.max(1, Math.round(width * PANEL_WIDTH_RATIO));

  const safeAreaPadding = useMemo(
    () =>
      Platform.OS === "android"
        ? {
            paddingTop: insets.top,
            paddingBottom: insets.bottom,
            paddingLeft: insets.left,
            paddingRight: insets.right,
          }
        : null,
    [insets.bottom, insets.left, insets.right, insets.top]
  );

  useEffect(() => {
    if (!visible) return;
    const sub = BackHandler.addEventListener("hardwareBackPress", () => {
      onClose();
      return true;
    });
    return () => sub.remove();
  }, [visible, onClose]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View pointerEvents="box-none" style={styles.rootContainer}>
        <View
          pointerEvents="none"
          style={[styles.backdrop, { opacity: visible ? BACKDROP_OPACITY : 0 }]}
        />

        <View pointerEvents={visible ? "auto" : "none"} style={styles.touchGate}>
          <View
            style={[
              styles.panelHost,
              {
                width: panelWidth,
                transform: [{ translateX: visible ? 0 : -panelWidth }],
              },
            ]}
          >
            <View
              className="bg-white h-full border-r border-gray-200 rounded-tr-3xl rounded-br-3xl"
              style={[styles.panel, { width: panelWidth }, safeAreaPadding]}
            >
              {/* Header */}
              <View className="px-6 pt-6 pb-4">
                <View className="flex-row items-center justify-between">
                  <Text
                    className="text-2xl font-bold"
                    style={{ color: colors.primary }}
                  >
                    {title}
                  </Text>
                  <TouchableOpacity
                    onPress={onClose}
                    style={{
                      width: buttonSize.md.height,
                      height: buttonSize.md.height,
                      borderRadius: 16,
                      backgroundColor: colors.primary,
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Ionicons name="close" size={20} color="white" />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Content */}
              {scrollable ? (
                <ScrollView
                  className="flex-1"
                  contentContainerStyle={{
                    paddingHorizontal: contentPadding.horizontal ?? 24,
                    paddingBottom: contentPadding.bottom ?? 100,
                  }}
                  showsVerticalScrollIndicator={true}
                  keyboardShouldPersistTaps="handled"
                >
                  {children}
                </ScrollView>
              ) : (
                <View
                  className="flex-1"
                  style={{
                    paddingHorizontal: contentPadding.horizontal ?? 24,
                    paddingBottom: contentPadding.bottom ?? 100,
                  }}
                >
                  {children}
                </View>
              )}

              {/* Footer */}
              {footer && (
                <View
                  className="absolute bottom-0 left-0 right-0 flex-row gap-4 px-6 py-4 bg-white border-t border-gray-200 rounded-br-3xl"
                  style={{ zIndex: 10, elevation: 10 }}
                >
                  {footer}
                </View>
              )}
            </View>
          </View>

          <Pressable style={styles.backdropPressArea} onPress={onClose} />
        </View>
      </View>
    </Modal>
  );
}

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
  },
  panelHost: {
    height: "100%",
  },
  panel: {
    height: "100%",
    shadowColor: "#000000",
    shadowOpacity: 0.12,
    shadowRadius: 8,
    shadowOffset: { width: 2, height: 0 },
    elevation: 8,
  },
  backdropPressArea: {
    flex: 1,
  },
});
