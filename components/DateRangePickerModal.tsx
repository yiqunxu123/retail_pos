/**
 * DateRangePickerModal
 *
 * Quick preset date range picker aligned with K Web's dashboard.
 * Selecting a preset immediately applies and closes the modal.
 */

import { Ionicons } from "@expo/vector-icons";
import React, { useCallback, useEffect, useState } from "react";
import { Calendar, DateData } from "react-native-calendars";
import {
    Modal,
    Pressable,
    ScrollView,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { getLocalToday } from "../utils/powersync/sqlFilters";
import { fontSize, fontWeight, colors, iconSize, buttonSize } from '@/utils/theme';

// ── Types ────────────────────────────────────────────────────────────────────

interface DateRangePickerModalProps {
  visible: boolean;
  onClose: () => void;
  onApply: (startDate: string, endDate: string, presetIndex: number | null) => void;
  activePresetIndex: number | null;
  startDate: string;
  endDate: string;
}

export interface DateRangePreset {
  label: string;
  getRange: () => { start: string; end: string };
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

function buildMarkedDates(
  startDate: string,
  endDate: string,
  activeTarget: "start" | "end" | null
): Record<string, any> {
  const marks: Record<string, any> = {};
  if (startDate) {
    marks[startDate] = {
      selected: true,
      selectedColor: activeTarget === "start" ? colors.primary : colors.textTertiary,
    };
  }
  if (endDate) {
    marks[endDate] = {
      selected: true,
      selectedColor: activeTarget === "end" ? colors.primary : "#2563EB",
    };
  }
  return marks;
}

export const DATE_RANGE_PRESETS: DateRangePreset[] = [
  { label: "Today", getRange: () => ({ start: getToday(), end: getToday() }) },
  { label: "Yesterday", getRange: () => ({ start: getDateOffset(1), end: getDateOffset(1) }) },
  // Keep offsets aligned with K Web RangePicker presets.
  { label: "Last 7 Days", getRange: () => ({ start: getDateOffset(7), end: getToday() }) },
  { label: "Last 14 Days", getRange: () => ({ start: getDateOffset(14), end: getToday() }) },
  { label: "Last 30 Days", getRange: () => ({ start: getDateOffset(30), end: getToday() }) },
];

// ── Component ────────────────────────────────────────────────────────────────

export function DateRangePickerModal({
  visible,
  onClose,
  onApply,
  activePresetIndex,
  startDate,
  endDate,
}: DateRangePickerModalProps) {
  const [customStartDate, setCustomStartDate] = useState(startDate);
  const [customEndDate, setCustomEndDate] = useState(endDate);
  const [pickerTarget, setPickerTarget] = useState<"start" | "end" | null>(null);

  useEffect(() => {
    if (!visible) return;
    setCustomStartDate(startDate);
    setCustomEndDate(endDate);
    setPickerTarget(null);
  }, [visible, startDate, endDate]);

  const handlePreset = useCallback(
    (index: number) => {
      const { start, end } = DATE_RANGE_PRESETS[index].getRange();
      onApply(start, end, index);
    },
    [onApply]
  );

  const openPicker = useCallback((target: "start" | "end") => {
    setPickerTarget(target);
  }, []);

  const handleDayPress = useCallback((day: DateData) => {
    const selected = day.dateString;
    if (pickerTarget === "start") {
      setCustomStartDate(selected);
      if (selected > customEndDate) setCustomEndDate(selected);
    } else if (pickerTarget === "end") {
      setCustomEndDate(selected);
      if (selected < customStartDate) setCustomStartDate(selected);
    }
    setPickerTarget(null);
  }, [pickerTarget, customStartDate, customEndDate]);

  const applyCustomRange = useCallback(() => {
    const normalizedStart = customStartDate <= customEndDate ? customStartDate : customEndDate;
    const normalizedEnd = customStartDate <= customEndDate ? customEndDate : customStartDate;
    onApply(normalizedStart, normalizedEnd, null);
  }, [customStartDate, customEndDate, onApply]);

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
            width: 360,
            maxWidth: "90%",
            maxHeight: "88%",
          }}
          onPress={() => {}}
        >
          <ScrollView showsVerticalScrollIndicator={false} bounces={false}>
            <Text
              style={{
                fontSize: fontSize.lg,
                fontWeight: fontWeight.bold,
                color: colors.textDark,
                marginBottom: 16,
                paddingHorizontal: 4,
              }}
            >
              Select Date Range
            </Text>

            <Text
              style={{
                fontSize: fontSize.md,
                fontWeight: fontWeight.bold,
                color: colors.textMedium,
                marginBottom: 8,
                paddingHorizontal: 4,
              }}
            >
              Custom Range
            </Text>

            <View style={{ flexDirection: "row", gap: 8 }}>
              <TouchableOpacity
                onPress={() => openPicker("start")}
                style={{
                  flex: 1,
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                  borderWidth: 1,
                  borderColor: pickerTarget === "start" ? colors.primary : colors.border,
                  borderRadius: 10,
                  paddingHorizontal: 12,
                  paddingVertical: 10,
                  backgroundColor: "#fff",
                }}
                activeOpacity={0.8}
              >
                <View>
                  <Text style={{ fontSize: fontSize.md, color: colors.textSecondary, marginBottom: 2 }}>Start Date</Text>
                  <Text style={{ fontSize: fontSize.base, color: colors.text, fontWeight: fontWeight.semibold }}>{customStartDate}</Text>
                </View>
                <Ionicons name="calendar-outline" size={iconSize.md} color={colors.textSecondary} />
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => openPicker("end")}
                style={{
                  flex: 1,
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                  borderWidth: 1,
                  borderColor: pickerTarget === "end" ? colors.primary : colors.border,
                  borderRadius: 10,
                  paddingHorizontal: 12,
                  paddingVertical: 10,
                  backgroundColor: "#fff",
                }}
                activeOpacity={0.8}
              >
                <View>
                  <Text style={{ fontSize: fontSize.md, color: colors.textSecondary, marginBottom: 2 }}>End Date</Text>
                  <Text style={{ fontSize: fontSize.base, color: colors.text, fontWeight: fontWeight.semibold }}>{customEndDate}</Text>
                </View>
                <Ionicons name="calendar-outline" size={iconSize.md} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            {pickerTarget && (
              <View
                style={{
                  marginTop: 10,
                  borderWidth: 1,
                  borderColor: colors.border,
                  borderRadius: 10,
                  overflow: "hidden",
                }}
              >
                <Text
                  style={{
                    paddingHorizontal: 12,
                    paddingTop: 10,
                    fontSize: fontSize.md,
                    color: colors.textSecondary,
                    fontWeight: fontWeight.semibold,
                  }}
                >
                  {pickerTarget === "start" ? "Select Start Date" : "Select End Date"}
                </Text>
                <Calendar
                  current={pickerTarget === "start" ? customStartDate : customEndDate}
                  onDayPress={handleDayPress}
                  markedDates={buildMarkedDates(customStartDate, customEndDate, pickerTarget)}
                  theme={{
                    todayTextColor: colors.primary,
                    arrowColor: colors.primary,
                    textMonthFontWeight: fontWeight.bold,
                    textDayHeaderFontWeight: fontWeight.semibold,
                  }}
                />
              </View>
            )}

            <TouchableOpacity
              onPress={applyCustomRange}
              style={{
                marginTop: 12,
                borderRadius: buttonSize.md.borderRadius,
                height: buttonSize.md.height,
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: colors.primary,
              }}
              activeOpacity={0.85}
            >
              <Text style={{ color: "#fff", fontSize: fontSize.base, fontWeight: fontWeight.bold }}>Apply Range</Text>
            </TouchableOpacity>

            <View
              style={{
                height: 1,
                backgroundColor: colors.border,
                marginVertical: 12,
              }}
            />

            <Text
              style={{
                fontSize: fontSize.md,
                fontWeight: fontWeight.bold,
                color: colors.textMedium,
                marginBottom: 10,
                paddingHorizontal: 4,
              }}
            >
              Quick Ranges
            </Text>

            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
              {DATE_RANGE_PRESETS.map((preset, index) => {
                const isActive = activePresetIndex === index;
                return (
                  <TouchableOpacity
                    key={preset.label}
                    onPress={() => handlePreset(index)}
                    style={{
                      paddingVertical: 8,
                      paddingHorizontal: 12,
                      borderRadius: 999,
                      borderWidth: 1,
                      borderColor: isActive ? colors.primary : colors.border,
                      backgroundColor: isActive ? "#FDE8EE" : "#fff",
                    }}
                    activeOpacity={0.8}
                  >
                    <Text
                      style={{
                        fontSize: fontSize.md,
                        fontWeight: isActive ? fontWeight.bold : fontWeight.medium,
                        color: isActive ? colors.primary : "#4B5563",
                      }}
                    >
                      {preset.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
