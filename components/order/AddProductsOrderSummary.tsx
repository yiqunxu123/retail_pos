import { colors } from '@/utils/theme';
import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { useRenderTrace } from "../../utils/debug/useRenderTrace";

interface AddProductsOrderSummaryProps {
  productsCount: number;
  totalQuantity: number;
  subTotal: number;
  tax: number;
  total: number;
  additionalDiscount: number;
  discountType: 1 | 2;
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border, borderRadius: 12, overflow: "hidden" },
  columns: { flexDirection: "row" },
  col: { flex: 1 },
  colLeft: { flex: 1, borderRightWidth: 1, borderRightColor: colors.backgroundSecondary },
  row: { flexDirection: "row", justifyContent: "space-between", paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: colors.backgroundSecondary },
  rowLast: { flexDirection: "row", justifyContent: "space-between", paddingHorizontal: 20, paddingVertical: 16 },
  label: { color: "#5A5F66", fontSize: 18, fontWeight: '500' },
  value: { color: colors.text, fontSize: 18, fontWeight: '700' },
  totalRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", backgroundColor: colors.primaryLight, borderTopWidth: 1, borderTopColor: "#FEE2E2", paddingHorizontal: 24, paddingVertical: 16 },
  totalLabel: { color: colors.primary, fontSize: 24, fontWeight: '700' },
  totalValue: { color: colors.primary, fontSize: 32, fontWeight: '700' },
});

function AddProductsOrderSummaryComponent({
  productsCount,
  totalQuantity,
  subTotal,
  tax,
  total,
  additionalDiscount,
  discountType,
}: AddProductsOrderSummaryProps) {
  useRenderTrace(
    "AddProductsOrderSummary",
    { productsCount, totalQuantity, subTotal, tax, total, additionalDiscount, discountType },
    { throttleMs: 100 }
  );

  // $1 spent = 100 credits. e.g. $8.99 = 899 credits. Init: loyalty credit used = 0.
  const loyaltyCreditUsed = 0;
  const loyaltyEarned = Math.round(subTotal * 100);

  return (
    <View style={s.container}>
      <View style={s.columns}>
        <View style={s.colLeft}>
          <View style={s.row}>
            <Text style={s.label}>Total Products</Text>
            <Text style={s.value}>{productsCount}</Text>
          </View>
          <View style={s.row}>
            <Text style={s.label}>Total Quantity</Text>
            <Text style={s.value}>{totalQuantity}</Text>
          </View>
          <View style={s.row}>
            <Text style={s.label}>Sub Total</Text>
            <Text style={s.value}>${subTotal.toFixed(2)}</Text>
          </View>
          <View style={s.rowLast}>
            <Text style={s.label}>Loyalty Credit</Text>
            <Text style={s.value}>{loyaltyCreditUsed === 0 ? "0" : `-$${loyaltyCreditUsed.toFixed(2)}`}</Text>
          </View>
        </View>

        <View style={s.col}>
          <View style={s.row}>
            <Text style={s.label}>Additional Discount</Text>
            <Text style={s.value}>
              {discountType === 2 ? `${additionalDiscount}%` : `$${additionalDiscount.toFixed(2)}`}
            </Text>
          </View>
          <View style={s.row}>
            <Text style={s.label}>Delivery Charges</Text>
            <Text style={s.value}>$0.00</Text>
          </View>
          <View style={s.row}>
            <Text style={s.label}>Tax</Text>
            <Text style={s.value}>${tax.toFixed(2)}</Text>
          </View>
          <View style={s.rowLast}>
            <Text style={s.label}>Loyalty Earned</Text>
            <Text style={s.value}>{loyaltyEarned}</Text>
          </View>
        </View>
      </View>

      <View style={s.totalRow}>
        <Text style={s.totalLabel}>Total</Text>
        <Text style={s.totalValue}>${total.toFixed(2)}</Text>
      </View>
    </View>
  );
}

export const AddProductsOrderSummary = React.memo(AddProductsOrderSummaryComponent);
AddProductsOrderSummary.displayName = "AddProductsOrderSummary";
