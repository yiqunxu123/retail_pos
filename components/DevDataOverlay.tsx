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

import { colors, iconSize } from '@/utils/theme';
import { Ionicons } from "@expo/vector-icons";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Animated,
    FlatList,
    Image,
    Modal,
    PanResponder,
    Pressable,
    ScrollView,
    Text,
    View,
    useWindowDimensions,
} from "react-native";
import { captureRef } from "react-native-view-shot";
import { clearPromotions, seedPromotions } from "../utils/api/products";
import { powerSyncDb, usePowerSync } from "../utils/powersync/PowerSyncProvider";
import { ReceiptData, ReceiptTemplate } from "./ReceiptTemplate";

// ---------------------------------------------------------------------------
// Mock receipt data for testing
// ---------------------------------------------------------------------------

const MOCK_RECEIPT_DATA: ReceiptData = {
  orderNo: "A5",
  dateTime: "02/06/26 21:25",
  items: [
    { name: "Drinks", qty: 2, price: 5.00, totalPrice: 10.00 },
    { name: "Open A Table For 2 People", qty: 1, price: 23.00, totalPrice: 23.00 },
  ],
  subtotal: 33.00,
  discount: 0,
  taxLabel: "0%",
  tax: 0.00,
  total: 33.00,
};

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
  /** Optional custom loader – if provided, uses this instead of PowerSync query */
  loadFn?: () => Promise<Record<string, any>[]>;
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
  label: "Products",
  allColumns: [
    "id", "name", "sku", "upc", "brand_id", "main_category_id", "status",
    "weight", "weight_unit", "description", "is_online", "unit_of_measurement",
    "slug", "sold_count", "is_featured", "images", "created_at", "updated_at",
  ],
  defaultColumns: ["id", "name", "sku", "status", "created_at"],
};

export const CATEGORIES_TABLE: DevTableConfig = {
  name: "categories",
  label: "Categories",
  allColumns: [
    "id", "name", "code", "slug", "is_featured", "image", "parent_id",
    "created_at", "updated_at",
  ],
  defaultColumns: ["id", "name", "parent_id", "code", "created_at"],
};

export const PROMOTION_DETAILS_TABLE: DevTableConfig = {
  name: "promotion_details",
  label: "Promo Details",
  allColumns: [
    "id", "promotion_id", "product_id", "unit_price_id", "channel_id",
    "value_type", "value", "min_qty", "is_enabled",
    "total_ecom_sold", "total_tenant_sold", "total_app_sold", "unit",
    "created_at", "updated_at",
  ],
  defaultColumns: ["id", "promotion_id", "product_id", "value_type", "value", "is_enabled"],
};


// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function DevDataOverlay({ tables, defaultTable }: DevDataOverlayProps) {
  // Only render in dev
  if (!__DEV__) return null;

  const { width: screenWidth } = useWindowDimensions();
  const { reconnect } = usePowerSync();
  const [syncing, setSyncing] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [clearing, setClearing] = useState(false);

  // --- Receipt test state ---
  const receiptRef = useRef<View>(null);
  const [generatingReceipt, setGeneratingReceipt] = useState(false);
  const [receiptImageUri, setReceiptImageUri] = useState<string | null>(null);
  const [showReceiptPreview, setShowReceiptPreview] = useState(false);

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
      let result: Record<string, any>[];
      if (table.loadFn) {
        result = await table.loadFn();
      } else {
        try {
          result = await powerSyncDb.getAll<Record<string, any>>(
            `SELECT * FROM ${table.name} ORDER BY created_at DESC LIMIT 200`,
          );
        } catch {
          result = await powerSyncDb.getAll<Record<string, any>>(
            `SELECT * FROM ${table.name} LIMIT 200`,
          );
        }
      }
      setRows(result);
      setMessage(`${result.length} records`);
    } catch (err: any) {
      setRows([]);
      setMessage(`Error: ${err.message || err}`);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!showSheet) return;
    loadData(activeTable);
  }, [showSheet, activeTable, loadData]);

  // --- Trigger PowerSync re-sync then reload data ---
  const triggerResync = useCallback(async (table: DevTableConfig) => {
    setSyncing(true);
    setMessage("Syncing...");
    try {
      await reconnect();
      // Give PowerSync a moment to pull fresh data from server
      await new Promise((r) => setTimeout(r, 2500));
      await loadData(table);
      setMessage((prev) => {
        const base = prev.replace("Syncing...", "").trim();
        return base ? `${base} (synced)` : "Sync complete";
      });
    } catch (err: any) {
      Alert.alert("Sync Failed", err?.message || String(err));
    } finally {
      setSyncing(false);
    }
  }, [reconnect, loadData]);

  // Reset columns and sort when switching tables
  const switchTable = useCallback((table: DevTableConfig) => {
    setActiveTable(table);
    setSelectedCols(table.defaultColumns);
    setShowColPicker(false);
    setSortCol(null);
    setSortDir("asc");
  }, []);

  // --- Generate receipt image from mock data ---
  const handleReceiptTest = useCallback(async () => {
    setGeneratingReceipt(true);
    try {
      // Small delay to ensure the off-screen ReceiptTemplate is rendered
      await new Promise((r) => setTimeout(r, 300));

      if (!receiptRef.current) {
        Alert.alert("Error", "Receipt template ref not available");
        return;
      }

      const uri = await captureRef(receiptRef, {
        format: "png",
        quality: 1,
        result: "data-uri",
      });

      setReceiptImageUri(uri);
      setShowReceiptPreview(true);
    } catch (err: any) {
      Alert.alert("Receipt generation failed", err?.message || String(err));
    } finally {
      setGeneratingReceipt(false);
    }
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
          className="items-center justify-center"
          style={{
            width: 52,
            height: 52,
            borderRadius: 14,
            backgroundColor: "rgba(0,0,0,0.55)",
          }}
          onPress={() => {
            if (!isDraggingRef.current) {
              setShowSheet(true);
            }
          }}
        >
          <Ionicons name="bug-outline" size={iconSize.md} color="#22D3EE" />
          <Text className="text-sm font-bold"
                style={{ color: "#22D3EE", letterSpacing: 1.5, marginTop: 1 }}>DEV</Text>
        </Pressable>
      </Animated.View>

      {/* Hidden receipt template for capture (opacity:0, collapsable:false for Android) */}
      <View
        style={{ position: "absolute", top: 0, left: 0, opacity: 0 }}
        pointerEvents="none"
        collapsable={false}
      >
        <ReceiptTemplate ref={receiptRef} data={MOCK_RECEIPT_DATA} />
      </View>

      {/* Receipt image preview modal */}
      <Modal
        visible={showReceiptPreview}
        transparent
        animationType="fade"
        onRequestClose={() => setShowReceiptPreview(false)}
      >
        <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.85)", justifyContent: "center", alignItems: "center" }}>
          <View style={{ backgroundColor: "#FFF", borderRadius: 12, padding: 16, maxWidth: "90%", maxHeight: "85%", alignItems: "center" }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", width: "100%", marginBottom: 12 }}>
              <Text className="text-base font-bold"
              style={{ color: "#111" }}>Receipt Preview</Text>
              <Pressable onPress={() => setShowReceiptPreview(false)}>
                <Ionicons name="close-circle" size={iconSize.xl} color={colors.textTertiary} />
              </Pressable>
            </View>
            {receiptImageUri && (
              <ScrollView style={{ maxHeight: 500 }} showsVerticalScrollIndicator>
                <Image
                  source={{ uri: receiptImageUri }}
                  style={{ width: 320, height: 400 }}
                  resizeMode="contain"
                />
              </ScrollView>
            )}
            <Text className="text-sm"
            style={{ color: colors.textTertiary, marginTop: 8 }}>
              800px width - ~10cm thermal paper
            </Text>
          </View>
        </View>
      </Modal>

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
                <View style={{ backgroundColor: "#1E1E1E", borderRadius: 4, padding: 3 }}>
                  <Ionicons name="code-slash-outline" size={iconSize.xs} color="#22D3EE" />
                </View>
                <Text className="text-lg font-semibold text-gray-800">
                  Data Test - {activeTable.label}
                </Text>
                <View style={{ backgroundColor: "#1E1E1E", borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2 }}>
                  <Text className="text-sm font-bold"
                  style={{ color: "#22D3EE" }}>DEV ONLY</Text>
                </View>
              </View>
              <Pressable onPress={() => setShowSheet(false)}>
                <Ionicons name="close" size={iconSize.lg} color={colors.textTertiary} />
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
                  <Ionicons name="options-outline" size={iconSize.xs} color={colors.textMedium} />
                  <Text className="text-gray-700 text-sm">Cols</Text>
                </Pressable>
                <Pressable
                  className="flex-row items-center gap-1 px-3 py-1.5 rounded-lg border border-gray-300"
                  onPress={() => loadData(activeTable)}
                >
                  <Ionicons name="refresh" size={iconSize.xs} color={colors.textMedium} />
                  <Text className="text-gray-700 text-sm">Refresh</Text>
                </Pressable>
                <Pressable
                  className="flex-row items-center gap-1 px-3 py-1.5 rounded-lg border border-blue-400"
                  style={syncing ? { opacity: 0.6 } : {}}
                  disabled={syncing}
                  onPress={() => triggerResync(activeTable)}
                >
                  {syncing
                    ? <ActivityIndicator size={iconSize.xs} color={colors.info} />
                    : <Ionicons name="cloud-download-outline" size={iconSize.xs} color={colors.info} />
                  }
                  <Text className="text-blue-600 text-sm">{syncing ? "Syncing" : "Sync"}</Text>
                </Pressable>
                <Pressable
                  className="flex-row items-center gap-1 px-3 py-1.5 rounded-lg border border-green-500 bg-green-50"
                  style={generatingReceipt ? { opacity: 0.6 } : {}}
                  disabled={generatingReceipt}
                  onPress={handleReceiptTest}
                >
                  {generatingReceipt
                    ? <ActivityIndicator size={iconSize.xs} color="#16A34A" />
                    : <Ionicons name="receipt-outline" size={iconSize.xs} color="#16A34A" />
                  }
                  <Text className="text-green-700 text-sm">{generatingReceipt ? "Generating" : "Receipt"}</Text>
                </Pressable>
              </View>
            </View>

            {/* Message */}
            {message !== "" && (
              <View className="px-5 pb-2">
                <Text className="text-sm text-gray-500">{message}</Text>
              </View>
            )}

            {/* Promotion tools – only visible on Promo Details tab */}
            {activeTable.name === "promotion_details" && (
              <View className="flex-row items-center gap-2 px-5 pb-2">
                <Pressable
                  className="flex-row items-center gap-1 px-3 py-1.5 rounded-lg border border-orange-400 bg-orange-50"
                  style={seeding ? { opacity: 0.6 } : {}}
                  disabled={seeding}
                  onPress={async () => {
                    setSeeding(true);
                    try {
                      const count = await seedPromotions(powerSyncDb);
                      setMessage(`Seeded ${count} promotions`);
                      await loadData(activeTable);
                    } catch (err: any) {
                      Alert.alert("Seed Failed", err?.message || String(err));
                    } finally {
                      setSeeding(false);
                    }
                  }}
                >
                  {seeding
                    ? <ActivityIndicator size={iconSize.xs} color="#EA580C" />
                    : <Ionicons name="flask-outline" size={iconSize.xs} color="#EA580C" />
                  }
                  <Text className="text-orange-700 text-sm">{seeding ? "Seeding" : "Seed"}</Text>
                </Pressable>
                <Pressable
                  className="flex-row items-center gap-1 px-3 py-1.5 rounded-lg border border-red-400 bg-red-50"
                  style={clearing ? { opacity: 0.6 } : {}}
                  disabled={clearing}
                  onPress={async () => {
                    setClearing(true);
                    try {
                      const msg = await clearPromotions(powerSyncDb);
                      setMessage(msg);
                      await loadData(activeTable);
                    } catch (err: any) {
                      Alert.alert("Clear Failed", err?.message || String(err));
                    } finally {
                      setClearing(false);
                    }
                  }}
                >
                  {clearing
                    ? <ActivityIndicator size={iconSize.xs} color={colors.errorDark} />
                    : <Ionicons name="trash-outline" size={iconSize.xs} color={colors.errorDark} />
                  }
                  <Text className="text-red-700 text-sm">{clearing ? "Clearing" : "Clear"}</Text>
                </Pressable>
              </View>
            )}

            {/* Column picker */}
            {showColPicker && (
              <View className="flex-row flex-wrap items-center gap-1.5 px-5 pb-3">
                <Pressable onPress={() => setSelectedCols([...activeTable.allColumns])}>
                  <Text className="text-blue-500 text-sm font-medium mr-1">All</Text>
                </Pressable>
                <Pressable onPress={() => setSelectedCols(activeTable.defaultColumns)}>
                  <Text className="text-gray-400 text-sm font-medium mr-2">Reset</Text>
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
                      <Text className={`text-sm ${isOn ? "text-white" : "text-gray-500"}`}>{col}</Text>
                    </Pressable>
                  );
                })}
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
                              size={iconSize.xs}
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
                            <Text className="text-sm text-gray-700" numberOfLines={1}>
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
                          <Ionicons name="document-outline" size={iconSize['2xl']} color={colors.borderMedium} />
                          <Text className="text-gray-400 mt-2">No data</Text>
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
