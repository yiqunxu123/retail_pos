/**
 * ReceiptTemplate - Receipt layout component for thermal printer image generation.
 *
 * Renders order data as a fixed-width View (384px for 58mm paper at 203 DPI).
 * Designed to be captured as a bitmap image via react-native-view-shot
 * and sent to thermal printers.
 *
 * Usage:
 *   const receiptRef = useRef<View>(null);
 *   <ReceiptTemplate ref={receiptRef} data={receiptData} />
 *   // then: captureRef(receiptRef, { format: 'png', result: 'base64' })
 */

import QRCodeCore from "qrcode/lib/core/qrcode";
import { forwardRef, useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";
import { fontWeight, colors } from '@/utils/theme';

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
  /** Total discount amount (sum of item-level discounts) — maps to SaleInvoiceModal "Discount Amount" */
  discountAmount: number;
  /** Additional (order-level) discount raw value — maps to SaleInvoiceModal "Additional Discount" */
  additionalDiscount: number;
  /** Additional discount type: 1=Fixed($), 2=Percentage(%) */
  additionalDiscountType?: number;
  /** Tax rate label (e.g. "0%") */
  taxLabel?: string;
  /** Tax amount */
  tax: number;
  /** Grand total */
  total: number;

  // ── From SaleInvoiceModal order info ──
  /** Created by (e.g. "John Smith") */
  createdBy?: string;

  // ── From SaleInvoiceModal Bill To ──
  /** Customer business name */
  customerName?: string;
  /** Customer contact name (billing details) */
  customerContact?: string;
  /** Customer email */
  customerEmail?: string;
  /** Customer phone */
  customerPhone?: string;
  /** Customer address */
  customerAddress?: string;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/**
 * Receipt template width in dp.
 * A high-res value produces a crisp screenshot; the actual scaling to
 * each printer's dot width (e.g. 384 or 576) happens in receiptImagePrint.ts
 * at print time, based on each printer's configured `printWidth`.
 */
const RECEIPT_WIDTH = 576;

/** Scale factor — all design values are authored for a 384dp baseline */
const S = RECEIPT_WIDTH / 384;

/** Derived layout constants (all module-level, computed once) */
const CONTENT_WIDTH = RECEIPT_WIDTH - 8 * S * 2;
const QR_MARGIN = 4 * S;
const QR_PADDING = 6 * S;
const BARCODE_HEIGHT = 60 * S;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const fmt = (n: number): string => `$${n.toFixed(2)}`;

// ---------------------------------------------------------------------------
// Code 128-B barcode encoder (module-level, allocated once)
// ---------------------------------------------------------------------------

const CODE128_START_B = 104;
const CODE128_STOP = 106;

/** Code 128 bar patterns — each symbol = 6 bars: b w b w b w */
const CODE128_PATTERNS: number[][] = [
  [2,1,2,2,2,2],[2,2,2,1,2,2],[2,2,2,2,2,1],[1,2,1,2,2,3],[1,2,1,3,2,2],
  [1,3,1,2,2,2],[1,2,2,2,1,3],[1,2,2,3,1,2],[1,3,2,2,1,2],[2,2,1,2,1,3],
  [2,2,1,3,1,2],[2,3,1,2,1,2],[1,1,2,2,3,2],[1,2,2,1,3,2],[1,2,2,2,3,1],
  [1,1,3,2,2,2],[1,2,3,1,2,2],[1,2,3,2,2,1],[2,2,3,2,1,1],[2,2,1,1,3,2],
  [2,2,1,2,3,1],[2,1,3,2,1,2],[2,2,3,1,1,2],[3,1,2,1,3,1],[3,1,1,2,2,2],
  [3,2,1,1,2,2],[3,2,1,2,2,1],[3,1,2,2,1,2],[3,2,2,1,1,2],[3,2,2,2,1,1],
  [2,1,2,1,2,3],[2,1,2,3,2,1],[2,3,2,1,2,1],[1,1,1,3,2,3],[1,3,1,1,2,3],
  [1,3,1,3,2,1],[1,1,2,3,1,3],[1,3,2,1,1,3],[1,3,2,3,1,1],[2,1,1,3,1,3],
  [2,3,1,1,1,3],[2,3,1,3,1,1],[1,1,2,1,3,3],[1,1,2,3,3,1],[1,3,2,1,3,1],
  [1,1,3,1,2,3],[1,1,3,3,2,1],[1,3,3,1,2,1],[3,1,3,1,2,1],[2,1,1,3,3,1],
  [2,3,1,1,3,1],[2,1,3,1,1,3],[2,1,3,3,1,1],[2,1,3,1,3,1],[3,1,1,1,2,3],
  [3,1,1,3,2,1],[3,3,1,1,2,1],[3,1,2,1,1,3],[3,1,2,3,1,1],[3,3,2,1,1,1],
  [3,1,4,1,1,1],[2,2,1,4,1,1],[4,3,1,1,1,1],[1,1,1,2,2,4],[1,1,1,4,2,2],
  [1,2,1,1,2,4],[1,2,1,4,2,1],[1,4,1,1,2,2],[1,4,1,2,2,1],[1,1,2,2,1,4],
  [1,1,2,4,1,2],[1,2,2,1,1,4],[1,2,2,4,1,1],[1,4,2,1,1,2],[1,4,2,2,1,1],
  [2,4,1,2,1,1],[2,2,1,1,1,4],[4,1,3,1,1,1],[2,4,1,1,1,2],[1,3,4,1,1,1],
  [1,1,1,2,4,2],[1,2,1,1,4,2],[1,2,1,2,4,1],[1,1,4,2,1,2],[1,2,4,1,1,2],
  [1,2,4,2,1,1],[4,1,1,2,1,2],[4,2,1,1,1,2],[4,2,1,2,1,1],[2,1,2,1,4,1],
  [2,1,4,1,2,1],[4,1,2,1,2,1],[1,1,1,1,4,3],[1,1,1,3,4,1],[1,3,1,1,4,1],
  [1,1,4,1,1,3],[1,1,4,3,1,1],[4,1,1,1,1,3],[4,1,1,3,1,1],[1,1,3,1,4,1],
  [1,1,4,1,3,1],[3,1,1,1,4,1],[4,1,1,1,3,1],[2,1,1,4,1,2],[2,1,1,2,1,4],
  [2,1,1,2,3,2],[2,3,3,1,1,1,2],
];

/**
 * Encode text as Code 128-B bar widths.
 * Returns positive = black bar, negative = white space.
 */
function encodeCode128B(text: string): number[] {
  const values: number[] = [CODE128_START_B];
  for (let i = 0; i < text.length; i++) {
    values.push(text.charCodeAt(i) - 32);
  }
  let sum = values[0];
  for (let i = 1; i < values.length; i++) sum += values[i] * i;
  values.push(sum % 103);
  values.push(CODE128_STOP);

  const bars: number[] = [];
  for (const v of values) {
    const p = CODE128_PATTERNS[v];
    for (let j = 0; j < p.length; j++) {
      bars.push(j % 2 === 0 ? p[j] : -p[j]);
    }
  }
  return bars;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export const ReceiptTemplate = forwardRef<View, { data: ReceiptData }>(
  ({ data }, ref) => {
    const {
      orderNo, dateTime, items, subtotal,
      discountAmount, additionalDiscount, additionalDiscountType,
      taxLabel, tax, total,
      createdBy,
      customerName, customerContact, customerEmail, customerPhone, customerAddress,
    } = data;
    const hasCustomerInfo = customerName || customerContact || customerEmail || customerPhone || customerAddress;

    // Generate QR code matrix from order number
    const qrModules = useMemo(() => {
      try {
        const qr = QRCodeCore.create(orderNo, { errorCorrectionLevel: "L" });
        return qr.modules;
      } catch {
        return null;
      }
    }, [orderNo]);

    // Generate barcode bars from order number (only printable ASCII chars)
    const barcodeBars = useMemo(() => {
      try {
        // Filter to printable ASCII for Code128B
        const safe = orderNo.replace(/[^ -~]/g, '');
        if (safe.length === 0) return null;
        return encodeCode128B(safe);
      } catch {
        return null;
      }
    }, [orderNo]);

    // Dynamically calculate QR cell size so it fills the available width
    const qrCellSize = qrModules
      ? Math.floor((CONTENT_WIDTH - QR_MARGIN * 2 - QR_PADDING * 2) / qrModules.size)
      : 10 * S;

    const renderQrCode = () => {
      if (!qrModules) return null;
      const size = qrModules.size;
      const rows = [];
      for (let r = 0; r < size; r++) {
        const cells = [];
        for (let c = 0; c < size; c++) {
          cells.push(
            <View
              key={c}
              style={{
                width: qrCellSize,
                height: qrCellSize,
                backgroundColor: qrModules.get(r, c) ? colors.black : colors.white,
              }}
            />,
          );
        }
        rows.push(
          <View key={r} style={{ flexDirection: "row" }}>
            {cells}
          </View>,
        );
      }
      return (
        <View style={{ alignItems: "center", marginTop: 10 * S, marginBottom: 6 * S, marginHorizontal: QR_MARGIN }}>
          <View style={{ padding: QR_PADDING, backgroundColor: colors.white }}>{rows}</View>
          <Text style={{ fontSize: 11 * S, color: colors.black, marginTop: 4 * S, fontWeight: fontWeight.bold }}>
            {orderNo}
          </Text>
        </View>
      );
    };

    // Dynamically calculate barcode unit so it fills the available width
    const barcodeTotalUnits = barcodeBars
      ? barcodeBars.reduce((sum, w) => sum + Math.abs(w), 0)
      : 1;
    const barcodeUnit = barcodeBars
      ? Math.floor((CONTENT_WIDTH - QR_MARGIN * 2) / barcodeTotalUnits)
      : 3 * S;

    const renderBarcode = () => {
      if (!barcodeBars) return null;
      return (
        <View style={{ alignItems: "center", marginTop: 10 * S, marginBottom: 8 * S, marginHorizontal: QR_MARGIN }}>
          <View style={{ flexDirection: "row", height: BARCODE_HEIGHT }}>
            {barcodeBars.map((w, i) => (
              <View
                key={i}
                style={{
                  width: Math.abs(w) * barcodeUnit,
                  height: BARCODE_HEIGHT,
                  backgroundColor: w > 0 ? colors.black : colors.white,
                }}
              />
            ))}
          </View>
          <Text style={{ fontSize: 11 * S, color: colors.black, marginTop: 4 * S, fontWeight: fontWeight.bold, letterSpacing: 2 * S }}>
            {orderNo}
          </Text>
        </View>
      );
    };

    return (
      <View ref={ref} style={styles.container} collapsable={false}>
        {/* ── Dashed top border ── */}
        <View style={styles.dashedLine}>
          {Array.from({ length: 18 }).map((_, i) => (
            <View key={i} style={styles.dash} />
          ))}
        </View>

        {/* ── Header: Order No + DateTime ── */}
        <View style={styles.headerRow}>
          <Text style={styles.headerText}>{orderNo}</Text>
          <Text style={styles.headerText}>{dateTime}</Text>
        </View>

        {/* ── Order Info ── */}
        {createdBy && (
          <View style={{ paddingVertical: 2 * S }}>
            <Text style={styles.infoText}>Created by: {createdBy}</Text>
          </View>
        )}

        {/* ── Bill To ── */}
        {hasCustomerInfo && (
          <>
            <View style={styles.solidLine} />
            {customerName && <Text style={styles.infoText}>Customer: {customerName}</Text>}
            {customerContact && <Text style={styles.infoText}>Contact: {customerContact}</Text>}
            {customerEmail && <Text style={styles.infoText}>Email: {customerEmail}</Text>}
            {customerPhone && <Text style={styles.infoText}>Phone: {customerPhone}</Text>}
            {customerAddress && <Text style={styles.infoText}>Address: {customerAddress}</Text>}
          </>
        )}

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

        {discountAmount > 0 && (
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Discount Amount:</Text>
            <Text style={styles.totalValue}>{fmt(discountAmount)}</Text>
          </View>
        )}
        {additionalDiscount > 0 && (
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Additional Discount:</Text>
            <Text style={styles.totalValue}>
              {additionalDiscountType === 2
                ? `${parseFloat(additionalDiscount.toFixed(2))}%`
                : fmt(additionalDiscount)}
            </Text>
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

        {/* ── QR Code ── */}
        {renderQrCode()}

        {/* ── Barcode ── */}
        {renderBarcode()}

        {/* ── Bottom padding for paper cut ── */}
        <View style={{ height: 10 * S }} />
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
    backgroundColor: colors.white,
    paddingHorizontal: 8 * S,
    paddingVertical: 6 * S,
  },

  // ── Dashed line ──
  dashedLine: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 5 * S,
  },
  dash: {
    width: 10 * S,
    height: 2 * S,
    backgroundColor: colors.black,
  },

  // ── Solid line ──
  solidLine: {
    borderBottomWidth: 1 * S,
    borderBottomColor: colors.black,
    marginVertical: 5 * S,
  },

  // ── Header ──
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerText: {
    fontSize: 13 * S,
    fontWeight: fontWeight.bold,
    color: colors.black,
  },

  // ── Item rows ──
  itemRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingVertical: 3 * S,
  },
  itemName: {
    flex: 1,
    fontSize: 11 * S,
    fontWeight: fontWeight.semibold,
    color: colors.black,
    marginRight: 8 * S,
  },
  itemPrice: {
    fontSize: 11 * S,
    fontWeight: fontWeight.semibold,
    color: colors.black,
  },

  // ── Totals ──
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 2 * S,
  },
  totalLabel: {
    fontSize: 11 * S,
    fontWeight: fontWeight.semibold,
    color: colors.black,
  },
  totalValue: {
    fontSize: 11 * S,
    fontWeight: fontWeight.semibold,
    color: colors.black,
  },

  // ── Info text ──
  infoText: {
    fontSize: 10 * S,
    fontWeight: fontWeight.medium,
    color: colors.black,
    paddingVertical: 1 * S,
  },
  // ── Modifiers ──
  bold: {
    fontWeight: fontWeight.bold,
    fontSize: 13 * S,
  },
});
