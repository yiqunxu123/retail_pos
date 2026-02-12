import { Ionicons } from "@expo/vector-icons";
import { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Modal,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { useProducts } from "../utils/powersync/hooks";

export interface SearchProduct {
  id: string;
  name: string;
  sku: string;
  category: string;
  quantity: number;
  price: number;
  image?: string;
}

interface SearchProductModalProps {
  visible: boolean;
  onClose: () => void;
  onSelectProduct: (product: SearchProduct) => void;
}

/**
 * SearchProductModal - left half screen floating panel
 */
export function SearchProductModal({ visible, onClose, onSelectProduct }: SearchProductModalProps) {
  const [searchQuery, setSearchQuery] = useState("");

  const { products: allProducts, isLoading } = useProducts();

  const displayProducts = useMemo(() => {
    const keyword = searchQuery.trim().toLowerCase();

    const filtered = keyword
      ? allProducts.filter((product) => {
          const name = (product.name || "").toLowerCase();
          const sku = (product.sku || "").toLowerCase();
          const upc = (product.upc || "").toLowerCase();
          return name.includes(keyword) || sku.includes(keyword) || upc.includes(keyword);
        })
      : allProducts;

    return filtered.map((product) => ({
      id: product.id,
      name: product.name,
      sku: product.sku || product.upc || "",
      category: product.categoryName || "Uncategorized",
      quantity: 0,
      price: product.salePrice,
      image: product.images?.[0],
    }));
  }, [allProducts, searchQuery]);

  const handleSelectProduct = useCallback(
    (product: SearchProduct) => {
      onSelectProduct(product);
    },
    [onSelectProduct]
  );

  const handleClose = useCallback(() => {
    setSearchQuery("");
    onClose();
  }, [onClose]);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose}>
      <View className="flex-1 flex-row bg-black/35">
        <Pressable
          className="bg-white h-full border-r border-gray-200"
          style={{ width: "50%" }}
          onPress={() => {}}
        >
          <View className="px-5 pt-4 pb-3 border-b border-gray-200">
            <View className="flex-row items-center justify-between mb-3">
              <Text className="text-[#C9154A] text-[16px] font-semibold">Search Products</Text>
              <Pressable
                onPress={handleClose}
                className="w-6 h-6 rounded-full bg-[#EC1A52] items-center justify-center"
              >
                <Ionicons name="close" size={14} color="white" />
              </Pressable>
            </View>

            <View className="flex-row items-center bg-white border border-gray-300 rounded-md px-3 py-2">
              <Ionicons name="search" size={18} color="#9ca3af" />
              <TextInput
                className="flex-1 ml-2 text-gray-800 text-sm"
                placeholder="Search by name, SKU, UPC..."
                placeholderTextColor="#9ca3af"
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoFocus
              />
              {searchQuery.length > 0 && (
                <Pressable onPress={() => setSearchQuery("")}>
                  <Ionicons name="close-circle" size={18} color="#9ca3af" />
                </Pressable>
              )}
            </View>
          </View>

          {isLoading ? (
            <View className="flex-1 items-center justify-center">
              <ActivityIndicator size="large" color="#ef4444" />
            </View>
          ) : displayProducts.length === 0 ? (
            <View className="flex-1 items-center justify-center">
              <Ionicons name="cube-outline" size={48} color="#d1d5db" />
              <Text className="text-gray-400 mt-2">No products found</Text>
            </View>
          ) : (
            <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 12 }}>
              {displayProducts.map((product) => (
                <Pressable
                  key={product.id}
                  onPress={() => handleSelectProduct(product)}
                  className="flex-row items-center px-5 py-3 border-b border-[#F0F1F4]"
                >
                  <View className="w-12 h-12 rounded-md bg-gray-100 overflow-hidden items-center justify-center mr-3">
                    {product.image ? (
                      <Image source={{ uri: product.image }} className="w-full h-full" resizeMode="cover" />
                    ) : (
                      <Ionicons name="cube-outline" size={22} color="#c4c8cf" />
                    )}
                  </View>

                  <View className="flex-1 pr-3">
                    <Text className="text-[#22252A] text-[13px] font-medium" numberOfLines={1}>
                      {product.name}
                    </Text>
                    <Text className="text-[#737985] text-[10px] mt-0.5" numberOfLines={1}>
                      {product.category?.toUpperCase()}
                    </Text>
                    <Text className="text-[#C5C9D0] text-[10px] mt-0.5" numberOfLines={1}>
                      {product.sku || ""}
                    </Text>
                  </View>

                  <Text className="text-[#2E3136] text-[18px] font-semibold">${product.price.toFixed(2)}</Text>
                </Pressable>
              ))}
            </ScrollView>
          )}
        </Pressable>

        <Pressable className="flex-1" onPress={handleClose} />
      </View>
    </Modal>
  );
}