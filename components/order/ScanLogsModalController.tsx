import { Ionicons } from "@expo/vector-icons";
import React, {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
} from "react";
import { fontSize, fontWeight, colors, iconSize } from '@/utils/theme';
import {
  BackHandler,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRenderTrace } from "../../utils/debug/useRenderTrace";
import {
  ModalControllerHandle,
  useModalVisibilityState,
} from "./modalVisibilityController";
import { useModalOpenPerf } from "./useModalOpenPerf";

export interface ScanLogEntryView {
  id: string;
  code: string;
  timestamp: Date;
  matched: boolean;
  productName?: string;
}

interface ScanLogSummaryView {
  matched: number;
  missed: number;
}

export type ScanLogsModalControllerHandle = ModalControllerHandle;

interface ScanLogsModalControllerProps {
  logs: ScanLogEntryView[];
  summary: ScanLogSummaryView;
  onClearLogs: () => void;
  onVisibleStateChange?: (visible: boolean) => void;
}

const ScanLogsModalControllerInner = forwardRef<
  ScanLogsModalControllerHandle,
  ScanLogsModalControllerProps
>(function ScanLogsModalControllerInner(
  { logs, summary, onClearLogs, onVisibleStateChange },
  ref
) {
  const { height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const safeAreaPadding = useMemo(
    () => ({
      paddingTop: insets.top,
      paddingBottom: insets.bottom,
      paddingLeft: insets.left,
      paddingRight: insets.right,
    }),
    [insets.bottom, insets.left, insets.right, insets.top]
  );
  const { visible, open, close, isVisible } =
    useModalVisibilityState(onVisibleStateChange);
  const { markOpenClick } = useModalOpenPerf("scan_logs", visible);

  const openTracked = useCallback(() => {
    if (isVisible()) return;
    markOpenClick();
    open();
  }, [isVisible, markOpenClick, open]);

  useRenderTrace(
    "ScanLogsModalController",
    {
      visible,
      logsLength: logs.length,
      summaryMatched: summary.matched,
      summaryMissed: summary.missed,
      onClearLogs,
      onVisibleStateChange,
    },
    { throttleMs: 100 }
  );

  useImperativeHandle(
    ref,
    () => ({
      open: openTracked,
      close,
      isVisible,
    }),
    [close, isVisible, openTracked]
  );

  const handleClose = useCallback(() => {
    close();
  }, [close]);

  useEffect(() => {
    if (!visible) return;
    const subscription = BackHandler.addEventListener("hardwareBackPress", () => {
      handleClose();
      return true;
    });
    return () => subscription.remove();
  }, [handleClose, visible]);

  return (
    <View pointerEvents="box-none" style={styles.rootContainer}>
      <View
        pointerEvents="none"
        style={[styles.backdrop, { opacity: visible ? 0.5 : 0 }]}
      />
      <View pointerEvents={visible ? "auto" : "none"} style={[styles.touchGate, safeAreaPadding]}>
        <Pressable style={styles.backdropOverlay} onPress={handleClose} />
        <Pressable
          style={[
            styles.panel,
            {
              transform: [{ translateY: visible ? 0 : height }],
            },
          ]}
          onPress={() => {}}
        >
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              paddingHorizontal: 24,
              paddingVertical: 18,
              borderBottomWidth: 1,
            borderBottomColor: colors.borderLight,
            backgroundColor: colors.backgroundLight,
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
              <View
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 12,
                  backgroundColor: colors.primary,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Ionicons name="barcode-outline" size={iconSize.lg} color={colors.textWhite} />
              </View>
              <View>
                <Text
                  style={{
                    fontFamily: "Montserrat",
                    fontSize: fontSize.xl,
                    fontWeight: fontWeight.bold,
                    color: colors.text,
                  }}
                >
                  Scan Logs
                </Text>
                <Text
                  style={{
                    fontFamily: "Montserrat",
                    fontSize: fontSize.md,
                    color: colors.textTertiary,
                    marginTop: 1,
                  }}
                >
                  {logs.length} scan{logs.length !== 1 ? "s" : ""} recorded
                </Text>
              </View>
            </View>
            <TouchableOpacity
              onPress={handleClose}
              style={{
                width: 36,
                height: 36,
                borderRadius: 18,
                backgroundColor: colors.backgroundSecondary,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Ionicons name="close" size={iconSize.base} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <View
            style={{
              flexDirection: "row",
              paddingHorizontal: 24,
              paddingVertical: 12,
              backgroundColor: colors.backgroundTertiary,
              borderBottomWidth: 1,
              borderBottomColor: colors.border,
            }}
          >
            <Text
              style={{
                width: 50,
                fontFamily: "Montserrat",
                fontSize: fontSize.md,
                fontWeight: fontWeight.bold,
                color: colors.textSecondary,
              }}
            >
              #
            </Text>
            <Text
              style={{
                flex: 1,
                fontFamily: "Montserrat",
                fontSize: fontSize.md,
                fontWeight: fontWeight.bold,
                color: colors.textSecondary,
              }}
            >
              BARCODE
            </Text>
            <Text
              style={{
                flex: 1.5,
                fontFamily: "Montserrat",
                fontSize: fontSize.md,
                fontWeight: fontWeight.bold,
                color: colors.textSecondary,
              }}
            >
              PRODUCT
            </Text>
            <Text
              style={{
                width: 70,
                fontFamily: "Montserrat",
                fontSize: fontSize.md,
                fontWeight: fontWeight.bold,
                color: colors.textSecondary,
                textAlign: "center",
              }}
            >
              STATUS
            </Text>
            <Text
              style={{
                width: 80,
                fontFamily: "Montserrat",
                fontSize: fontSize.md,
                fontWeight: fontWeight.bold,
                color: colors.textSecondary,
                textAlign: "right",
              }}
            >
              TIME
            </Text>
          </View>

          {logs.length === 0 ? (
            <View style={{ paddingVertical: 60, alignItems: "center", justifyContent: "center" }}>
              <Ionicons name="scan-outline" size={iconSize['5xl']} color={colors.borderMedium} />
              <Text
                style={{
                  fontFamily: "Montserrat",
                  fontSize: fontSize.base,
                  fontWeight: fontWeight.semibold,
                  color: colors.textTertiary,
                  marginTop: 16,
                }}
              >
                No scans yet
              </Text>
              <Text
                style={{
                  fontFamily: "Montserrat",
                  fontSize: fontSize.md,
                  color: "#C4C8CF",
                  marginTop: 6,
                  textAlign: "center",
                  paddingHorizontal: 40,
                }}
              >
                Scan a barcode with your QBT2500 scanner and it will appear here
              </Text>
            </View>
          ) : (
            <ScrollView style={{ maxHeight: 420 }} contentContainerStyle={{ paddingBottom: 8 }}>
              {logs.map((log, index) => (
                <View
                  key={log.id}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    paddingHorizontal: 24,
                    paddingVertical: 14,
                    borderBottomWidth: 1,
                    borderBottomColor: colors.backgroundSecondary,
                    backgroundColor: index % 2 === 0 ? colors.white : colors.backgroundLight,
                  }}
                >
                  <Text
                    style={{
                      width: 50,
                      fontFamily: "Montserrat",
                      fontSize: fontSize.md,
                      color: colors.textTertiary,
                    }}
                  >
                    {logs.length - index}
                  </Text>
                  <View style={{ flex: 1 }}>
                    <Text
                      style={{
                        fontFamily: "Montserrat",
                        fontSize: fontSize.base,
                        fontWeight: fontWeight.bold,
                        color: colors.text,
                        letterSpacing: 1.5,
                      }}
                      selectable
                    >
                      {log.code}
                    </Text>
                  </View>
                  <View style={{ flex: 1.5 }}>
                    <Text
                      style={{
                        fontFamily: "Montserrat",
                        fontSize: fontSize.md,
                        fontWeight: fontWeight.medium,
                        color: log.matched ? colors.text : colors.textTertiary,
                      }}
                      numberOfLines={1}
                    >
                      {log.matched ? log.productName : "-"}
                    </Text>
                  </View>
                  <View style={{ width: 70, alignItems: "center" }}>
                    <View
                      style={{
                        paddingHorizontal: 10,
                        paddingVertical: 4,
                        borderRadius: 20,
                        backgroundColor: log.matched ? "#ECFDF5" : "#FEF2F2",
                      }}
                    >
                      <Text
                        style={{
                          fontFamily: "Montserrat",
                          fontSize: fontSize.md,
                          fontWeight: fontWeight.bold,
                          color: log.matched ? "#059669" : colors.errorDark,
                        }}
                      >
                        {log.matched ? "FOUND" : "MISS"}
                      </Text>
                    </View>
                  </View>
                  <Text
                    style={{
                      width: 80,
                      fontFamily: "Montserrat",
                      fontSize: fontSize.md,
                      color: colors.textTertiary,
                      textAlign: "right",
                    }}
                  >
                    {log.timestamp.toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                      second: "2-digit",
                    })}
                  </Text>
                </View>
              ))}
            </ScrollView>
          )}

          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              paddingHorizontal: 24,
              paddingVertical: 16,
              borderTopWidth: 1,
              borderTopColor: colors.borderLight,
              backgroundColor: colors.backgroundLight,
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center", gap: 16 }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: "#059669" }} />
                <Text style={{ fontFamily: "Montserrat", fontSize: fontSize.md, color: colors.textSecondary }}>
                  {summary.matched} matched
                </Text>
              </View>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: colors.errorDark }} />
                <Text style={{ fontFamily: "Montserrat", fontSize: fontSize.md, color: colors.textSecondary }}>
                  {summary.missed} missed
                </Text>
              </View>
            </View>
            {logs.length > 0 && (
              <TouchableOpacity
                onPress={onClearLogs}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 6,
                  paddingHorizontal: 16,
                  paddingVertical: 8,
                  borderRadius: 8,
                  borderWidth: 1,
                  borderColor: colors.border,
                  backgroundColor: colors.white,
                }}
              >
                <Ionicons name="trash-outline" size={iconSize.sm} color={colors.errorDark} />
                <Text
                  style={{
                    fontFamily: "Montserrat",
                    fontSize: fontSize.md,
                    fontWeight: fontWeight.semibold,
                    color: colors.errorDark,
                  }}
                >
                  Clear All
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </Pressable>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  rootContainer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1100,
    elevation: 1100,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.black,
  },
  touchGate: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
  },
  backdropOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  panel: {
    backgroundColor: colors.white,
    borderRadius: 16,
    width: 560,
    maxHeight: "80%",
    overflow: "hidden",
    zIndex: 2,
    elevation: 10,
    shadowColor: "#000000",
    shadowOpacity: 0.18,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 2 },
  },
});

export const ScanLogsModalController = React.memo(ScanLogsModalControllerInner);
ScanLogsModalController.displayName = "ScanLogsModalController";
