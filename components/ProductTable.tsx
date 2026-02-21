import { Ionicons } from "@expo/vector-icons";
import React, { useCallback } from "react";
import { FlatList, Image, Pressable, Text, TouchableOpacity, View } from "react-native";
import { useRenderTrace } from "../utils/debug/useRenderTrace";

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
  onAddProductPress?: () => void;
}

/**
 * ProductTable - Simplified to match the background of the reference image
 */
function ProductTableComponent({
  products,
  onQuantityChange,
  selectedProductId,
  onSelectProduct,
  onAddProductPress,
}: ProductTableProps) {
  useRenderTrace("ProductTable", {
    productsLength: products.length,
    selectedProductId: selectedProductId ?? null,
    onQuantityChange,
    onSelectProduct,
    onAddProductPress,
  });

  const keyExtractor = useCallback((item: ProductItem) => item.id, []);

  const renderProductRow = useCallback(
    ({ item }: { item: ProductItem }) => {
      const isSelected = selectedProductId === item.id;
      return (
        <Pressable
          onPress={() => onSelectProduct?.(item)}
          className={`flex-row items-center px-4 py-5 border-b border-[#F0F1F4] ${
            isSelected
              ? "bg-[#FFF0F3] border-l-4 border-[#EC1A52]"
              : "bg-white"
          }`}
        >
          <View className="flex-1">
            <Text className="text-[#1A1A1A] text-[16px] font-Montserrat font-semibold" numberOfLines={1}>
              {item.sku}
            </Text>
            <Text className="text-[#5A5F66] text-[14px] font-Montserrat mt-1" numberOfLines={2}>
              {item.name}
            </Text>
            {item.isPromo && (
              <View className="bg-[#FFA64D] px-2 py-0.5 rounded-full mt-2 self-start">
                <Text className="text-[10px] font-bold text-[#6B4F1D]">PROMO</Text>
              </View>
            )}
          </View>

          <View className="w-[140px] flex-row items-center justify-center gap-2">
            <TouchableOpacity
              onPress={() => onQuantityChange(item.id, -1)}
              className="w-10 h-10 bg-[#FFF0F3] rounded-lg items-center justify-center border border-[#FECACA]"
            >
              <Ionicons name="remove" size={20} color="#EC1A52" />
            </TouchableOpacity>
            <Text className="text-[#1A1A1A] text-[18px] font-Montserrat font-bold w-8 text-center">
              {item.quantity}
            </Text>
            <TouchableOpacity
              onPress={() => onQuantityChange(item.id, 1)}
              className="w-10 h-10 bg-[#EC1A52] rounded-lg items-center justify-center shadow-sm"
            >
              <Ionicons name="add" size={20} color="white" />
            </TouchableOpacity>
          </View>

          <View className="w-[120px] items-center">
            <Text className="text-[#1A1A1A] text-[16px] font-Montserrat">${item.tnVaporTax.toFixed(4)}</Text>
          </View>
          <View className="w-[120px] items-center">
            <Text className="text-[#1A1A1A] text-[16px] font-Montserrat">${item.ncVaporTax.toFixed(4)}</Text>
          </View>
          <View className="w-[120px] items-end pr-4">
            <Text className="text-[#1A1A1A] text-[18px] font-Montserrat font-bold">${item.total.toFixed(2)}</Text>
          </View>
        </Pressable>
      );
    },
    [onQuantityChange, onSelectProduct, selectedProductId]
  );

  return (
    <View className="flex-1 px-3 pt-10 pb-2">
      <View className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm flex-1">
        {/* Table Header */}
        <View className="flex-row bg-white border-b border-gray-100 px-4 py-4">
          <View className="flex-1">
            <Text className="text-[#5A5F66] text-[15px] font-Montserrat font-bold">Product Name / Details</Text>
          </View>
          <View className="w-[140px] flex-row items-center justify-center gap-1">
            <Text className="text-[#5A5F66] text-[15px] font-Montserrat font-bold">Quantity</Text>
            <Ionicons name="swap-vertical" size={14} color="#9CA3AF" />
          </View>
          <View className="w-[120px] items-center">
            <Text className="text-[#5A5F66] text-[15px] font-Montserrat font-bold">TN Vapor Tax</Text>
          </View>
          <View className="w-[120px] items-center">
            <Text className="text-[#5A5F66] text-[15px] font-Montserrat font-bold">NC Vapor Tax</Text>
          </View>
          <View className="w-[120px] items-end pr-4">
            <Text className="text-[#5A5F66] text-[15px] font-Montserrat font-bold">Total</Text>
          </View>
        </View>

        {/* Empty State */}
        {products.length === 0 ? (
          <View className="flex-1 items-center justify-center bg-white py-8">
            <View className="w-96 h-96 mb-2 items-center justify-center">
              <Image 
                source={require("../assets/images/cart-image.png")}
                style={{ width: 380, height: 380 }}
                resizeMode="contain"
              />
            </View>
            <Text className="text-[#5A5F66] text-center font-Montserrat text-[16px] mb-6 px-20" style={{ marginTop: -20 }}>
              There are no products in the list yet, Add Products to get Started
            </Text>
            {onAddProductPress && (
              <TouchableOpacity
                onPress={onAddProductPress}
                className="bg-[#EC1A52] px-8 py-3 rounded-lg flex-row items-center gap-2 shadow-sm"
              >
                <Ionicons name="add" size={24} color="white" />
                <Text className="text-white font-Montserrat font-bold text-[18px]">Add New Product</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          <FlatList
            data={products}
            keyExtractor={keyExtractor}
            renderItem={renderProductRow}
            initialNumToRender={12}
            maxToRenderPerBatch={12}
            windowSize={7}
            removeClippedSubviews
            showsVerticalScrollIndicator
          />
        )}
      </View>
    </View>
  );
}

export const ProductTable = React.memo(ProductTableComponent);
ProductTable.displayName = "ProductTable";
