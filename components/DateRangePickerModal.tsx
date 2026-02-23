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
import { colors, iconSize, buttonSize } from '@/utils/theme';

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
        className="flex-1 bg-black/45 justify-center items-center px-4"
        onPress={onClose}
      >
        <Pressable
          className="bg-white rounded-xl overflow-hidden"
          style={{
            width: "92%",
            maxWidth: 664,
            maxHeight: "88%",
            borderWidth: 1,
            borderColor: colors.border,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.18,
            shadowRadius: 20,
            elevation: 8,
          }}
          onPress={(e) => e.stopPropagation()}
        >
          <View className="flex-row justify-between items-center px-5 py-4 border-b border-[#E4E7EC]">
            <Text className="text-2xl font-semibold" style={{ color: colors.text }}>Select Date Range</Text>
            <Pressable onPress={onClose} style={({ pressed }) => ({ opacity: pressed ? 0.55 : 1 })}>
              <Ionicons name="close" size={iconSize['2xl']} color={colors.textDark} />
            </Pressable>
          </View>

          <ScrollView className="px-4 pt-4 pb-5" showsVerticalScrollIndicator={false} bounces={false}>
            <Text
              className="text-lg font-bold"
              style={{
                color: colors.textMedium,
                marginBottom: 10,
                paddingHorizontal: 4,
              }}
            >
              Custom Range
            </Text>

            <View style={{ flexDirection: "row", gap: 12 }}>
              <TouchableOpacity
                onPress={() => openPicker("start")}
                style={{
                  flex: 1,
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                  borderWidth: 1,
                  borderColor: pickerTarget === "start" ? colors.primary : colors.border,
                  borderRadius: 12,
                  paddingHorizontal: 16,
                  paddingVertical: 14,
                  backgroundColor: "#F4F5F7",
                }}
                activeOpacity={0.8}
              >
                <View>
                  <Text className="text-base font-medium" style={{ color: colors.textSecondary, marginBottom: 4 }}>Start Date</Text>
                  <Text className="text-lg font-semibold" style={{ color: colors.text }}>{customStartDate}</Text>
                </View>
                <Ionicons name="calendar-outline" size={iconSize.xl} color={colors.textSecondary} />
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
                  borderRadius: 12,
                  paddingHorizontal: 16,
                  paddingVertical: 14,
                  backgroundColor: "#F4F5F7",
                }}
                activeOpacity={0.8}
              >
                <View>
                  <Text className="text-base font-medium" style={{ color: colors.textSecondary, marginBottom: 4 }}>End Date</Text>
                  <Text className="text-lg font-semibold" style={{ color: colors.text }}>{customEndDate}</Text>
                </View>
                <Ionicons name="calendar-outline" size={iconSize.xl} color={colors.textSecondary} />
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
                  className="text-sm font-semibold"
                  style={{
                    paddingHorizontal: 12,
                    paddingTop: 10,
                    color: colors.textSecondary,
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
                    textMonthFontWeight: '700',
                    textDayHeaderFontWeight: '600',
                  }}
                />
              </View>
            )}

            <TouchableOpacity
              onPress={applyCustomRange}
              style={{
                marginTop: 16,
                borderRadius: buttonSize.md.borderRadius,
                height: buttonSize.lg.height,
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: colors.primary,
              }}
              activeOpacity={0.85}
            >
              <Text className="text-lg font-bold" style={{ color: "#fff" }}>Apply Range</Text>
            </TouchableOpacity>

            <View
              style={{
                height: 1,
                backgroundColor: colors.border,
                marginVertical: 12,
              }}
            />

            <Text
              className="text-lg font-bold"
              style={{
                color: colors.textMedium,
                marginBottom: 12,
                paddingHorizontal: 4,
              }}
            >
              Quick Ranges
            </Text>

            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
              {DATE_RANGE_PRESETS.map((preset, index) => {
                const isActive = activePresetIndex === index;
                return (
                  <TouchableOpacity
                    key={preset.label}
                    onPress={() => handlePreset(index)}
                    style={{
                      paddingVertical: 12,
                      paddingHorizontal: 16,
                      borderRadius: 999,
                      borderWidth: 1,
                      borderColor: isActive ? colors.primary : colors.border,
                      backgroundColor: isActive ? "#FDE8EE" : "#F4F5F7",
                    }}
                    activeOpacity={0.8}
                  >
                    <Text
                      className="text-base"
                      style={{
                        fontWeight: isActive ? '700' : '500',
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
