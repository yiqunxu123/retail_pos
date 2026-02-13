/**
 * DateRangePickerModal
 *
 * Quick preset date range picker aligned with K Web's dashboard.
 * Selecting a preset immediately applies and closes the modal.
 */

import { Ionicons } from "@expo/vector-icons";
import React, { useCallback } from "react";
import {
    Modal,
    Pressable,
    Text,
    TouchableOpacity
} from "react-native";
import { getLocalToday } from "../utils/powersync/sqlFilters";

// ── Types ────────────────────────────────────────────────────────────────────

interface DateRangePickerModalProps {
  visible: boolean;
  onClose: () => void;
  onApply: (startDate: string, endDate: string, presetIndex: number | null) => void;
  activePresetIndex: number | null;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function toDateStr(d: Date): string {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function getToday(): string {
  return getLocalToday();
}

function parseDateStr(dateStr: string): [number, number, number] {
  const [y, m, d] = dateStr.split("-").map(Number);
  return [y, m, d];
}

function getDateOffset(days: number): string {
  const [y, m, day] = parseDateStr(getToday());
  const d = new Date(Date.UTC(y, m - 1, day));
  d.setUTCDate(d.getUTCDate() - days);
  return toDateStr(d);
}

function getYearAgoToday(): string {
  const [y, m, day] = parseDateStr(getToday());
  const d = new Date(Date.UTC(y - 1, m - 1, day));
  return toDateStr(d);
}

function getThisMonthStart(): string {
  const [y, m] = parseDateStr(getToday());
  return `${y}-${String(m).padStart(2, "0")}-01`;
}

function getThisYearStart(): string {
  const [y] = parseDateStr(getToday());
  return `${y}-01-01`;
}

const PRESETS = [
  { label: "Today", getRange: () => ({ start: getToday(), end: getToday() }) },
  { label: "Yesterday", getRange: () => ({ start: getDateOffset(1), end: getDateOffset(1) }) },
  { label: "Last 7 Days", getRange: () => ({ start: getDateOffset(6), end: getToday() }) },
  { label: "Last 14 Days", getRange: () => ({ start: getDateOffset(13), end: getToday() }) },
  { label: "Last 30 Days", getRange: () => ({ start: getDateOffset(29), end: getToday() }) },
  { label: "This Month", getRange: () => ({ start: getThisMonthStart(), end: getToday() }) },
  { label: "This Year", getRange: () => ({ start: getThisYearStart(), end: getToday() }) },
  { label: "Last 1 Year", getRange: () => ({ start: getYearAgoToday(), end: getToday() }) },
];

// ── Component ────────────────────────────────────────────────────────────────

export function DateRangePickerModal({
  visible,
  onClose,
  onApply,
  activePresetIndex,
}: DateRangePickerModalProps) {
  const handlePreset = useCallback(
    (index: number) => {
      const { start, end } = PRESETS[index].getRange();
      onApply(start, end, index);
    },
    [onApply]
  );

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: "rgba(0,0,0,0.5)",
        }}
        onPress={onClose}
      >
        <Pressable
          style={{
            backgroundColor: "#fff",
            borderRadius: 16,
            paddingVertical: 20,
            paddingHorizontal: 16,
            width: 280,
            maxWidth: "90%",
          }}
          onPress={() => {}}
        >
          <Text
            style={{
              fontSize: 16,
              fontWeight: "700",
              color: "#1F2937",
              marginBottom: 16,
              paddingHorizontal: 4,
            }}
          >
            Select Date Range
          </Text>

          {PRESETS.map((preset, index) => {
            const isActive = activePresetIndex === index;
            return (
              <TouchableOpacity
                key={preset.label}
                onPress={() => handlePreset(index)}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  paddingVertical: 12,
                  paddingHorizontal: 14,
                  borderRadius: 10,
                  marginBottom: 4,
                  backgroundColor: isActive ? "#EC1A52" : "transparent",
                }}
                activeOpacity={0.7}
              >
                <Ionicons
                  name={isActive ? "checkmark-circle" : "ellipse-outline"}
                  size={18}
                  color={isActive ? "#fff" : "#9CA3AF"}
                  style={{ marginRight: 10 }}
                />
                <Text
                  style={{
                    flex: 1,
                    fontSize: 15,
                    fontWeight: isActive ? "600" : "400",
                    color: isActive ? "#fff" : "#374151",
                  }}
                >
                  {preset.label}
                </Text>
                {isActive && (
                  <Ionicons name="checkmark" size={16} color="#fff" />
                )}
              </TouchableOpacity>
            );
          })}

          <TouchableOpacity
            onPress={onClose}
            style={{
              marginTop: 12,
              paddingVertical: 10,
              alignItems: "center",
            }}
          >
            <Text style={{ fontSize: 14, color: "#6B7280", fontWeight: "500" }}>Cancel</Text>
          </TouchableOpacity>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
