import { Ionicons } from "@expo/vector-icons";
import React, { useCallback, useEffect, memo } from "react";
import { FlatList, Image, Pressable, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { fontSize, fontWeight, colors, iconSize } from '@/utils/theme';
import { useRenderTrace } from "../utils/debug/useRenderTrace";

const styles = StyleSheet.create({
  // Row styles
  row: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 20, borderBottomWidth: 1, borderBottomColor: colors.borderLight, backgroundColor: colors.white },
  rowSelected: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 20, borderBottomWidth: 1, borderBottomColor: colors.borderLight, backgroundColor: colors.primaryLight, borderLeftWidth: 4, borderLeftColor: colors.primary },
  nameCol: { flex: 1 },
  sku: { color: colors.text, fontSize: fontSize.lg, fontFamily: "Montserrat", fontWeight: fontWeight.semibold },
  name: { color: "#5A5F66", fontSize: fontSize.base, fontFamily: "Montserrat", marginTop: 4 },
  promo: { backgroundColor: "#FFA64D", paddingHorizontal: 8, paddingVertical: 2, borderRadius: 9999, marginTop: 8, alignSelf: "flex-start" },
  promoText: { fontSize: fontSize.md, fontWeight: fontWeight.bold, color: "#6B4F1D" },
  qtyCol: { width: 140, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 },
  qtyBtn: { width: 40, height: 40, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  qtyBtnMinus: { backgroundColor: colors.primaryLight, borderWidth: 1, borderColor: "#FECACA" },
  qtyBtnPlus: { backgroundColor: colors.primary },
  qtyText: { color: colors.text, fontSize: fontSize.xl, fontFamily: "Montserrat", fontWeight: fontWeight.bold, width: 32, textAlign: "center" },
  taxCol: { width: 120, alignItems: "center" },
  taxText: { color: colors.text, fontSize: fontSize.lg, fontFamily: "Montserrat" },
  totalCol: { width: 120, alignItems: "flex-end", paddingRight: 16 },
  totalText: { color: colors.text, fontSize: fontSize.xl, fontFamily: "Montserrat", fontWeight: fontWeight.bold },
  // Container styles (converted from className)
  container: { flex: 1, paddingHorizontal: 12, paddingTop: 40, paddingBottom: 8 },
  tableWrapper: { backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border, borderRadius: 16, overflow: "hidden", flex: 1 },
  // Header styles
  headerRow: { flexDirection: "row", backgroundColor: colors.white, borderBottomWidth: 1, borderBottomColor: colors.backgroundSecondary, paddingHorizontal: 16, paddingVertical: 16 },
  headerFlex1: { flex: 1 },
  headerText: { color: "#5A5F66", fontSize: fontSize.base, fontFamily: "Montserrat", fontWeight: fontWeight.bold },
  headerQtyCol: { width: 140, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 4 },
  headerTaxCol: { width: 120, alignItems: "center" },
  headerTotalCol: { width: 120, alignItems: "flex-end", paddingRight: 16 },
  // Empty state styles
  emptyContainer: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.white, paddingVertical: 32 },
  emptyImageWrapper: { width: 384, height: 384, marginBottom: 8, alignItems: "center", justifyContent: "center" },
  emptyImage: { width: 380, height: 380 },
  emptyText: { color: "#5A5F66", textAlign: "center", fontFamily: "Montserrat", fontSize: fontSize.lg, marginBottom: 24, paddingHorizontal: 80, marginTop: -20 },
});

export interface ProductItem {
  id: string;
  sku: string;
  name: string;
  isPromo?: boolean;
  salePrice: number;
  unit: string;
  quantity: number;
  tnVaporTax: number;
  ncVaporTax: number;
  total: number;
}

interface ProductTableProps {
  products: ProductItem[];
  onQuantityChange: (id: string, delta: number) => void;
  selectedProductId?: string;
  onSelectProduct?: (product: ProductItem) => void;
}

interface ProductRowProps {
  item: ProductItem;
  isSelected: boolean;
  onSelect: () => void;
  onDecrease: () => void;
  onIncrease: () => void;
}

const ProductRow = memo(function ProductRow({
  item,
  isSelected,
  onSelect,
  onDecrease,
  onIncrease,
}: ProductRowProps) {
  return (
    <Pressable onPress={onSelect} style={isSelected ? styles.rowSelected : styles.row}>
      <View style={styles.nameCol}>
        <Text style={styles.sku} numberOfLines={1}>{item.sku}</Text>
        <Text style={styles.name} numberOfLines={2}>{item.name}</Text>
        {item.isPromo && (
          <View style={styles.promo}>
            <Text style={styles.promoText}>PROMO</Text>
          </View>
        )}
      </View>
      <View style={styles.qtyCol}>
        <TouchableOpacity onPress={onDecrease} style={[styles.qtyBtn, styles.qtyBtnMinus]}>
          <Ionicons name="remove" size={iconSize.base} color={colors.primary} />
        </TouchableOpacity>
        <Text style={styles.qtyText}>{item.quantity}</Text>
        <TouchableOpacity onPress={onIncrease} style={[styles.qtyBtn, styles.qtyBtnPlus]}>
          <Ionicons name="add" size={iconSize.base} color="white" />
        </TouchableOpacity>
      </View>
      <View style={styles.taxCol}>
        <Text style={styles.taxText}>${item.tnVaporTax.toFixed(4)}</Text>
      </View>
      <View style={styles.taxCol}>
        <Text style={styles.taxText}>${item.ncVaporTax.toFixed(4)}</Text>
      </View>
      <View style={styles.totalCol}>
        <Text style={styles.totalText}>${item.total.toFixed(2)}</Text>
      </View>
    </Pressable>
  );
}, (prev, next) => {
  return prev.item.id === next.item.id
    && prev.item.quantity === next.item.quantity
    && prev.item.total === next.item.total
    && prev.isSelected === next.isSelected;
});

/**
 * ProductTable - Simplified to match the background of the reference image
 */
const ITEM_HEIGHT = 90;

function ProductTableComponent({
  products,
  onQuantityChange,
  selectedProductId,
  onSelectProduct,
}: ProductTableProps) {
  const renderTime = Date.now();
  
  useRenderTrace("ProductTable", {
    productsLength: products.length,
    selectedProductId: selectedProductId ?? null,
    onQuantityChange,
    onSelectProduct,
  });

  // Log when commit completes (UI actually updated)
  useEffect(() => {
    const commitTime = Date.now();
    console.log(`[Perf] ProductTable COMMIT: render→commit=${commitTime - renderTime}ms, products=${products.length}, at=${commitTime}`);
  });

  const keyExtractor = useCallback((item: ProductItem) => item.id, []);
  
  const getItemLayout = useCallback((_: any, index: number) => ({
    length: ITEM_HEIGHT,
    offset: ITEM_HEIGHT * index,
    index,
  }), []);

  const renderProductRow = useCallback(
    ({ item }: { item: ProductItem }) => (
      <ProductRow
        item={item}
        isSelected={selectedProductId === item.id}
        onSelect={() => onSelectProduct?.(item)}
        onDecrease={() => onQuantityChange(item.id, -1)}
        onIncrease={() => onQuantityChange(item.id, 1)}
      />
    ),
    [onQuantityChange, onSelectProduct, selectedProductId]
  );

  return (
    <View style={styles.container}>
      <View style={styles.tableWrapper}>
        {/* Table Header */}
        <View style={styles.headerRow}>
          <View style={styles.headerFlex1}>
            <Text style={styles.headerText}>Product Name / Details</Text>
          </View>
          <View style={styles.headerQtyCol}>
            <Text style={styles.headerText}>Quantity</Text>
            <Ionicons name="swap-vertical" size={iconSize.xs} color={colors.textTertiary} />
          </View>
          <View style={styles.headerTaxCol}>
            <Text style={styles.headerText}>TN Vapor Tax</Text>
          </View>
          <View style={styles.headerTaxCol}>
            <Text style={styles.headerText}>NC Vapor Tax</Text>
          </View>
          <View style={styles.headerTotalCol}>
            <Text style={styles.headerText}>Total</Text>
          </View>
        </View>

        {/* Empty State */}
        {products.length === 0 ? (
          <View style={styles.emptyContainer}>
            <View style={styles.emptyImageWrapper}>
              <Image 
                source={require("../assets/images/cart-image.png")}
                style={styles.emptyImage}
                resizeMode="contain"
              />
            </View>
            <Text style={styles.emptyText}>
              Scan barcode to add products to cart
            </Text>
          </View>
        ) : (
          <FlatList
            data={products}
            keyExtractor={keyExtractor}
            renderItem={renderProductRow}
            getItemLayout={getItemLayout}
            initialNumToRender={8}
            maxToRenderPerBatch={4}
            updateCellsBatchingPeriod={50}
            windowSize={5}
            removeClippedSubviews={true}
            showsVerticalScrollIndicator
          />
        )}
      </View>
    </View>
  );
}

export const ProductTable = React.memo(ProductTableComponent);
ProductTable.displayName = "ProductTable";
