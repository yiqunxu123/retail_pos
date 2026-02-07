/**
 * ReceiptTemplate - Receipt layout component for thermal printer image generation.
 *
 * Renders order data as a fixed-width View (576px for 80mm paper at 203 DPI).
 * Designed to be captured as a bitmap image via react-native-view-shot
 * and sent to thermal printers.
 *
 * Usage:
 *   const receiptRef = useRef<View>(null);
 *   <ReceiptTemplate ref={receiptRef} data={receiptData} />
 *   // then: captureRef(receiptRef, { format: 'png', result: 'base64' })
 */

import { forwardRef } from "react";
import { StyleSheet, Text, View } from "react-native";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ReceiptItem {
  name: string;
  qty: number;
  price: number;       // unit price
  totalPrice: number;  // qty * price (after any item-level discount)
}

export interface ReceiptData {
  /** Order number / identifier (e.g. "SO-20260206-001") */
  orderNo: string;
  /** Formatted date string (e.g. "02/06/26 21:25") */
  dateTime: string;
  /** Line items */
  items: ReceiptItem[];
  /** Subtotal before discount/tax */
  subtotal: number;
  /** Discount amount (positive number) */
  discount: number;
  /** Tax rate label (e.g. "0%") */
  taxLabel?: string;
  /** Tax amount */
  tax: number;
  /** Grand total */
  total: number;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Width in pixels – 800px matches ~10cm (100mm) thermal paper at 203 DPI */
const RECEIPT_WIDTH = 800;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const fmt = (n: number): string => `$${n.toFixed(2)}`;

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export const ReceiptTemplate = forwardRef<View, { data: ReceiptData }>(
  ({ data }, ref) => {
    const { orderNo, dateTime, items, subtotal, discount, taxLabel, tax, total } = data;

    return (
      <View ref={ref} style={styles.container} collapsable={false}>
        {/* ── Dashed top border ── */}
        <View style={styles.dashedLine}>
          {Array.from({ length: 20 }).map((_, i) => (
            <View key={i} style={styles.dash} />
          ))}
        </View>

        {/* ── Header: Order No + DateTime ── */}
        <View style={styles.headerRow}>
          <Text style={styles.headerText}>{orderNo}</Text>
          <Text style={styles.headerText}>{dateTime}</Text>
        </View>

        {/* ── Solid line ── */}
        <View style={styles.solidLine} />

        {/* ── Items ── */}
        {items.map((item, idx) => (
          <View key={idx} style={styles.itemRow}>
            <Text style={styles.itemName} numberOfLines={1}>
              {item.qty} x {item.name}
            </Text>
            <Text style={styles.itemPrice}>{fmt(item.totalPrice)}</Text>
          </View>
        ))}

        {/* ── Solid line ── */}
        <View style={styles.solidLine} />

        {/* ── Totals ── */}
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Subtotal:</Text>
          <Text style={styles.totalValue}>{fmt(subtotal)}</Text>
        </View>

        {discount > 0 && (
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Discount:</Text>
            <Text style={styles.totalValue}>-{fmt(discount)}</Text>
          </View>
        )}

        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Tax({taxLabel ?? "0%"}):</Text>
          <Text style={styles.totalValue}>{fmt(tax)}</Text>
        </View>

        <View style={styles.totalRow}>
          <Text style={[styles.totalLabel, styles.bold]}>Total:</Text>
          <Text style={[styles.totalValue, styles.bold]}>{fmt(total)}</Text>
        </View>

        {/* ── Bottom padding for paper cut ── */}
        <View style={{ height: 24 }} />
      </View>
    );
  },
);

ReceiptTemplate.displayName = "ReceiptTemplate";

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: {
    width: RECEIPT_WIDTH,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 24,
    paddingVertical: 16,
  },

  // ── Dashed line ──
  dashedLine: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  dash: {
    width: 24,
    height: 3,
    backgroundColor: "#000000",
  },

  // ── Solid line ──
  solidLine: {
    borderBottomWidth: 2,
    borderBottomColor: "#000000",
    marginVertical: 12,
  },

  // ── Header ──
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerText: {
    fontSize: 28,
    fontWeight: "700",
    color: "#000000",
  },

  // ── Item rows ──
  itemRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingVertical: 6,
  },
  itemName: {
    flex: 1,
    fontSize: 24,
    fontWeight: "600",
    color: "#000000",
    marginRight: 16,
  },
  itemPrice: {
    fontSize: 24,
    fontWeight: "600",
    color: "#000000",
  },

  // ── Totals ──
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 4,
  },
  totalLabel: {
    fontSize: 24,
    fontWeight: "600",
    color: "#000000",
  },
  totalValue: {
    fontSize: 24,
    fontWeight: "600",
    color: "#000000",
  },

  // ── Modifiers ──
  bold: {
    fontWeight: "900",
    fontSize: 26,
  },
});
