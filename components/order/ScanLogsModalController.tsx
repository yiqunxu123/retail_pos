import { Ionicons } from "@expo/vector-icons";
import React, {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
} from "react";
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
              borderBottomColor: "#F0F1F4",
              backgroundColor: "#FAFAFA",
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
              <View
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 12,
                  backgroundColor: "#EC1A52",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Ionicons name="barcode-outline" size={22} color="#FFF" />
              </View>
              <View>
                <Text
                  style={{
                    fontFamily: "Montserrat",
                    fontSize: 20,
                    fontWeight: "700",
                    color: "#1A1A1A",
                  }}
                >
                  Scan Logs
                </Text>
                <Text
                  style={{
                    fontFamily: "Montserrat",
                    fontSize: 13,
                    color: "#9CA3AF",
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
                backgroundColor: "#F3F4F6",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Ionicons name="close" size={20} color="#6B7280" />
            </TouchableOpacity>
          </View>

          <View
            style={{
              flexDirection: "row",
              paddingHorizontal: 24,
              paddingVertical: 12,
              backgroundColor: "#F7F7F9",
              borderBottomWidth: 1,
              borderBottomColor: "#E5E7EB",
            }}
          >
            <Text
              style={{
                width: 50,
                fontFamily: "Montserrat",
                fontSize: 12,
                fontWeight: "700",
                color: "#6B7280",
              }}
            >
              #
            </Text>
            <Text
              style={{
                flex: 1,
                fontFamily: "Montserrat",
                fontSize: 12,
                fontWeight: "700",
                color: "#6B7280",
              }}
            >
              BARCODE
            </Text>
            <Text
              style={{
                flex: 1.5,
                fontFamily: "Montserrat",
                fontSize: 12,
                fontWeight: "700",
                color: "#6B7280",
              }}
            >
              PRODUCT
            </Text>
            <Text
              style={{
                width: 70,
                fontFamily: "Montserrat",
                fontSize: 12,
                fontWeight: "700",
                color: "#6B7280",
                textAlign: "center",
              }}
            >
              STATUS
            </Text>
            <Text
              style={{
                width: 80,
                fontFamily: "Montserrat",
                fontSize: 12,
                fontWeight: "700",
                color: "#6B7280",
                textAlign: "right",
              }}
            >
              TIME
            </Text>
          </View>

          {logs.length === 0 ? (
            <View style={{ paddingVertical: 60, alignItems: "center", justifyContent: "center" }}>
              <Ionicons name="scan-outline" size={56} color="#D1D5DB" />
              <Text
                style={{
                  fontFamily: "Montserrat",
                  fontSize: 16,
                  fontWeight: "600",
                  color: "#9CA3AF",
                  marginTop: 16,
                }}
              >
                No scans yet
              </Text>
              <Text
                style={{
                  fontFamily: "Montserrat",
                  fontSize: 13,
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
                    borderBottomColor: "#F3F4F6",
                    backgroundColor: index % 2 === 0 ? "#FFFFFF" : "#FAFAFA",
                  }}
                >
                  <Text
                    style={{
                      width: 50,
                      fontFamily: "Montserrat",
                      fontSize: 13,
                      color: "#9CA3AF",
                    }}
                  >
                    {logs.length - index}
                  </Text>
                  <View style={{ flex: 1 }}>
                    <Text
                      style={{
                        fontFamily: "Montserrat",
                        fontSize: 15,
                        fontWeight: "700",
                        color: "#1A1A1A",
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
                        fontSize: 13,
                        fontWeight: "500",
                        color: log.matched ? "#1A1A1A" : "#9CA3AF",
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
                          fontSize: 11,
                          fontWeight: "700",
                          color: log.matched ? "#059669" : "#DC2626",
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
                      fontSize: 12,
                      color: "#9CA3AF",
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
              borderTopColor: "#F0F1F4",
              backgroundColor: "#FAFAFA",
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center", gap: 16 }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: "#059669" }} />
                <Text style={{ fontFamily: "Montserrat", fontSize: 13, color: "#6B7280" }}>
                  {summary.matched} matched
                </Text>
              </View>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: "#DC2626" }} />
                <Text style={{ fontFamily: "Montserrat", fontSize: 13, color: "#6B7280" }}>
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
                  borderColor: "#E5E7EB",
                  backgroundColor: "#FFF",
                }}
              >
                <Ionicons name="trash-outline" size={16} color="#DC2626" />
                <Text
                  style={{
                    fontFamily: "Montserrat",
                    fontSize: 13,
                    fontWeight: "600",
                    color: "#DC2626",
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
    backgroundColor: "#000000",
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
    backgroundColor: "#FFF",
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
