/**
 * DevDataOverlay - Draggable dev-only floating button + half-sheet data viewer.
 *
 * Usage:
 *   <DevDataOverlay tables={["products", "categories"]} defaultTable="products" />
 *
 * Only renders in __DEV__ mode. Provides:
 *   - A draggable floating button (default position: top-right)
 *   - A bottom half-sheet showing PowerSync table data
 *   - Column picker, refresh, table switcher
 *   - Ordered by created_at DESC
 */

import { Ionicons } from "@expo/vector-icons";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
    ActivityIndicator,
    Animated,
    FlatList,
    Modal,
    PanResponder,
    Pressable,
    ScrollView,
    Text,
    View,
    useWindowDimensions,
} from "react-native";
import { powerSyncDb } from "../utils/powersync/PowerSyncProvider";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface DevTableConfig {
  /** Table name in PowerSync (e.g. "products") */
  name: string;
  /** Display label */
  label: string;
  /** All available columns (excluding id which is always present) */
  allColumns: string[];
  /** Default visible columns */
  defaultColumns: string[];
}

interface DevDataOverlayProps {
  /** Table configs to offer */
  tables: DevTableConfig[];
  /** Which table to show initially (name) */
  defaultTable?: string;
}

// ---------------------------------------------------------------------------
// Presets – common table configs for quick use
// ---------------------------------------------------------------------------

export const PRODUCTS_TABLE: DevTableConfig = {
  name: "products",
  label: "产品",
  allColumns: [
    "id", "name", "sku", "upc", "brand_id", "main_category_id", "status",
    "weight", "weight_unit", "description", "is_online", "unit_of_measurement",
    "slug", "sold_count", "is_featured", "images", "created_at", "updated_at",
  ],
  defaultColumns: ["id", "name", "sku", "status", "created_at"],
};

export const CATEGORIES_TABLE: DevTableConfig = {
  name: "categories",
  label: "分类",
  allColumns: [
    "id", "name", "code", "slug", "is_featured", "image", "parent_id",
    "created_at", "updated_at",
  ],
  defaultColumns: ["id", "name", "parent_id", "code", "created_at"],
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function DevDataOverlay({ tables, defaultTable }: DevDataOverlayProps) {
  // Only render in dev
  if (!__DEV__) return null;

  const { width: screenWidth } = useWindowDimensions();

  // --- Draggable button ---
  const devPosRef = useRef({ x: -1, y: -1 });
  const devPan = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;
  const isDraggingRef = useRef(false);

  if (devPosRef.current.x < 0 && screenWidth > 0) {
    const initX = screenWidth - 64;
    const initY = 80;
    devPosRef.current = { x: initX, y: initY };
    devPan.setValue({ x: initX, y: initY });
  }

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        isDraggingRef.current = false;
      },
      onPanResponderMove: (_evt, gs) => {
        if (Math.abs(gs.dx) > 4 || Math.abs(gs.dy) > 4) {
          isDraggingRef.current = true;
        }
        devPan.setValue({
          x: devPosRef.current.x + gs.dx,
          y: devPosRef.current.y + gs.dy,
        });
      },
      onPanResponderRelease: (_evt, gs) => {
        devPosRef.current = {
          x: devPosRef.current.x + gs.dx,
          y: devPosRef.current.y + gs.dy,
        };
      },
    }),
  ).current;

  // --- Sheet state ---
  const [showSheet, setShowSheet] = useState(false);
  const initialTable = tables.find((t) => t.name === defaultTable) || tables[0];
  const [activeTable, setActiveTable] = useState<DevTableConfig>(initialTable);
  const [rows, setRows] = useState<Record<string, any>[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [selectedCols, setSelectedCols] = useState<string[]>(initialTable.defaultColumns);
  const [showColPicker, setShowColPicker] = useState(true);
  const [sortCol, setSortCol] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  // --- Sorting ---
  const sortedRows = useMemo(() => {
    if (!sortCol) return rows;
    const sorted = [...rows].sort((a, b) => {
      const va = a[sortCol];
      const vb = b[sortCol];
      if (va == null && vb == null) return 0;
      if (va == null) return 1;
      if (vb == null) return -1;
      if (typeof va === "number" && typeof vb === "number") return va - vb;
      return String(va).localeCompare(String(vb), undefined, { numeric: true });
    });
    return sortDir === "desc" ? sorted.reverse() : sorted;
  }, [rows, sortCol, sortDir]);

  const toggleSort = useCallback((col: string) => {
    if (sortCol === col) {
      setSortDir((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortCol(col);
      setSortDir("asc");
    }
  }, [sortCol]);

  // --- Load data ---
  const loadData = useCallback(async (table: DevTableConfig) => {
    setLoading(true);
    setMessage("");
    try {
      const result = await powerSyncDb.getAll<Record<string, any>>(
        `SELECT * FROM ${table.name} ORDER BY created_at DESC LIMIT 200`,
      );
      setRows(result);
      setMessage(`共 ${result.length} 条记录`);
    } catch {
      try {
        const result = await powerSyncDb.getAll<Record<string, any>>(
          `SELECT * FROM ${table.name} LIMIT 200`,
        );
        setRows(result);
        setMessage(`共 ${result.length} 条记录`);
      } catch (err2: any) {
        setRows([]);
        setMessage(`错误: ${err2.message || err2}`);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!showSheet) return;
    loadData(activeTable);
  }, [showSheet, activeTable, loadData]);

  // Reset columns and sort when switching tables
  const switchTable = useCallback((table: DevTableConfig) => {
    setActiveTable(table);
    setSelectedCols(table.defaultColumns);
    setShowColPicker(false);
    setSortCol(null);
    setSortDir("asc");
  }, []);

  // --- Column width helper ---
  const colWidth = (col: string) => {
    if (col === "id") return 80;
    if (col.includes("_at")) return 160;
    return 110;
  };

  return (
    <>
      {/* Draggable floating button */}
      <Animated.View
        style={{
          position: "absolute",
          left: devPan.x,
          top: devPan.y,
          zIndex: 9999,
        }}
        {...panResponder.panHandlers}
      >
        <Pressable
          className="w-12 h-12 rounded-full items-center justify-center"
          style={{ backgroundColor: "#111827", elevation: 6 }}
          onPress={() => {
            if (!isDraggingRef.current) {
              setShowSheet(true);
            }
          }}
        >
          <Ionicons name="flask-outline" size={20} color="#FFFFFF" />
        </Pressable>
      </Animated.View>

      {/* Half-sheet modal */}
      <Modal
        visible={showSheet}
        transparent
        animationType="slide"
        onRequestClose={() => setShowSheet(false)}
      >
        <View className="flex-1 bg-black/40 justify-end">
          <View className="bg-white rounded-t-2xl" style={{ height: "55%" }}>
            {/* Header */}
            <View className="flex-row items-center justify-between px-5 py-4 border-b border-gray-200">
              <View className="flex-row items-center gap-2">
                <Ionicons name="flask-outline" size={18} color="#111827" />
                <Text className="text-lg font-semibold text-gray-800">
                  数据测试 - {activeTable.label}
                </Text>
              </View>
              <Pressable onPress={() => setShowSheet(false)}>
                <Ionicons name="close" size={22} color="#9CA3AF" />
              </Pressable>
            </View>

            {/* Toolbar: table tabs + actions */}
            <View className="flex-row items-center justify-between px-5 py-3">
              <View className="flex-row items-center gap-2">
                {tables.map((t) => (
                  <Pressable
                    key={t.name}
                    className={`px-3 py-1.5 rounded-lg ${activeTable.name === t.name ? "bg-gray-900" : "bg-gray-100"}`}
                    onPress={() => switchTable(t)}
                  >
                    <Text className={activeTable.name === t.name ? "text-white" : "text-gray-700"}>
                      {t.label}
                    </Text>
                  </Pressable>
                ))}
              </View>
              <View className="flex-row items-center gap-2">
                <Pressable
                  className="flex-row items-center gap-1 px-3 py-1.5 rounded-lg border border-gray-300"
                  onPress={() => setShowColPicker(!showColPicker)}
                >
                  <Ionicons name="options-outline" size={14} color="#374151" />
                  <Text className="text-gray-700 text-sm">列</Text>
                </Pressable>
                <Pressable
                  className="flex-row items-center gap-1 px-3 py-1.5 rounded-lg border border-gray-300"
                  onPress={() => loadData(activeTable)}
                >
                  <Ionicons name="refresh" size={14} color="#374151" />
                  <Text className="text-gray-700 text-sm">刷新</Text>
                </Pressable>
              </View>
            </View>

            {/* Column picker */}
            {showColPicker && (
              <View className="flex-row flex-wrap items-center gap-1.5 px-5 pb-3">
                <Pressable onPress={() => setSelectedCols([...activeTable.allColumns])}>
                  <Text className="text-blue-500 text-xs font-medium mr-1">全选</Text>
                </Pressable>
                <Pressable onPress={() => setSelectedCols(activeTable.defaultColumns)}>
                  <Text className="text-gray-400 text-xs font-medium mr-2">重置</Text>
                </Pressable>
                {activeTable.allColumns.map((col) => {
                  const isOn = selectedCols.includes(col);
                  return (
                    <Pressable
                      key={col}
                      className={`rounded px-2 py-1 ${isOn ? "bg-gray-900" : "bg-gray-100"}`}
                      onPress={() => {
                        setSelectedCols((prev) =>
                          prev.includes(col)
                            ? prev.filter((c) => c !== col)
                            : [...prev, col],
                        );
                      }}
                    >
                      <Text className={`text-xs ${isOn ? "text-white" : "text-gray-500"}`}>{col}</Text>
                    </Pressable>
                  );
                })}
              </View>
            )}

            {/* Message */}
            {message !== "" && (
              <View className="px-5 pb-2">
                <Text className="text-xs text-gray-500">{message}</Text>
              </View>
            )}

            {/* Data table */}
            <View className="flex-1 px-4 pb-4">
              <ScrollView horizontal showsHorizontalScrollIndicator>
                <View className="flex-1">
                  {/* Header row */}
                  <View className="flex-row bg-gray-100 rounded-t-lg px-3 py-3">
                    {selectedCols.map((col) => {
                      const isSorted = sortCol === col;
                      return (
                        <Pressable
                          key={col}
                          style={{ width: colWidth(col), minHeight: 32 }}
                          className="px-1 flex-row items-center"
                          onPress={() => toggleSort(col)}
                        >
                          <Text
                            className={`text-sm font-bold ${isSorted ? "text-gray-900" : "text-gray-600"}`}
                            numberOfLines={1}
                          >
                            {col}
                          </Text>
                          {isSorted && (
                            <Ionicons
                              name={sortDir === "asc" ? "arrow-up" : "arrow-down"}
                              size={12}
                              color="#111827"
                              style={{ marginLeft: 3 }}
                            />
                          )}
                        </Pressable>
                      );
                    })}
                  </View>
                  {/* Data rows */}
                  <FlatList
                    data={sortedRows}
                    keyExtractor={(item, index) => item.id || String(index)}
                    renderItem={({ item }) => (
                      <View className="flex-row items-center bg-white border-b border-gray-100 px-3 py-2">
                        {selectedCols.map((col) => (
                          <View key={col} style={{ width: colWidth(col) }} className="px-1">
                            <Text className="text-xs text-gray-700" numberOfLines={1}>
                              {item[col] === null || item[col] === undefined
                                ? "-"
                                : col === "id"
                                ? String(item[col]).slice(0, 8) + "..."
                                : String(item[col])}
                            </Text>
                          </View>
                        ))}
                      </View>
                    )}
                    ListEmptyComponent={
                      loading ? (
                        <View className="items-center py-8">
                          <ActivityIndicator size="small" color="#111827" />
                        </View>
                      ) : (
                        <View className="items-center py-8">
                          <Ionicons name="document-outline" size={28} color="#d1d5db" />
                          <Text className="text-gray-400 mt-2">暂无数据</Text>
                        </View>
                      )
                    }
                  />
                </View>
              </ScrollView>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}
