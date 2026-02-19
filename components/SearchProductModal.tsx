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
          className="bg-white h-full border-r border-gray-200 shadow-2xl"
          style={{ width: "50%" }}
          onPress={() => {}}
        >
          <View className="px-6 pt-6 pb-4 bg-white">
            <View className="flex-row items-center justify-between mb-4">
              <Text 
                style={{ fontFamily: 'Montserrat', fontSize: 24, fontWeight: '700', color: '#EC1A52' }}
              >
                Search Products
              </Text>
              <Pressable
                onPress={handleClose}
                className="w-8 h-8 rounded-full bg-[#EC1A52] items-center justify-center shadow-sm"
              >
                <Ionicons name="close" size={20} color="white" />
              </Pressable>
            </View>

            <View className="flex-row items-center bg-white border-2 border-[#EC1A52] rounded-xl px-4 py-2.5 shadow-sm">
              <Ionicons name="search" size={24} color="#EC1A52" />
              <TextInput
                className="flex-1 ml-3 text-gray-800 text-[20px]"
                style={{ fontFamily: 'Montserrat', fontWeight: '500' }}
                placeholder="SI"
                placeholderTextColor="#9ca3af"
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoFocus
              />
              {searchQuery.length > 0 && (
                <Pressable onPress={() => setSearchQuery("")}>
                  <Ionicons name="close-circle" size={22} color="#9ca3af" />
                </Pressable>
              )}
            </View>
          </View>

          {isLoading ? (
            <View className="flex-1 items-center justify-center">
              <ActivityIndicator size="large" color="#EC1A52" />
            </View>
          ) : displayProducts.length === 0 ? (
            <View className="flex-1 items-center justify-center">
              <Ionicons name="cube-outline" size={64} color="#d1d5db" />
              <Text style={{ fontFamily: 'Montserrat' }} className="text-gray-400 mt-4 text-lg">No products found</Text>
            </View>
          ) : (
            <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 20 }}>
              {displayProducts.map((product) => (
                <Pressable
                  key={product.id}
                  onPress={() => handleSelectProduct(product)}
                  className="flex-row items-center px-6 py-5 border-b border-[#F0F1F4]"
                >
                  {/* Left side: Image and Name/SKU */}
                  <View className="flex-1 flex-row items-center">
                    {/* Product Image */}
                    <View className="w-16 h-16 rounded-xl bg-[#F7F7F9] overflow-hidden items-center justify-center mr-4 border border-gray-100">
                      {product.image ? (
                        <Image source={{ uri: product.image }} className="w-full h-full" resizeMode="cover" />
                      ) : (
                        <Ionicons name="cube-outline" size={32} color="#c4c8cf" />
                      )}
                    </View>

                    {/* Name and SKU */}
                    <View className="flex-1 min-w-[120px]">
                      <Text 
                        style={{ fontFamily: 'Montserrat', fontSize: 16, fontWeight: '700', color: '#1A1A1A' }} 
                        numberOfLines={2}
                      >
                        {product.name}
                      </Text>
                      <Text 
                        style={{ fontFamily: 'Montserrat', fontSize: 12, color: '#9CA3AF', marginTop: 2 }} 
                        numberOfLines={1}
                      >
                        {product.sku || ""}
                      </Text>
                    </View>
                  </View>

                  {/* Category: Centered in the row, moved 30px right */}
                  <View className="w-40 items-center px-2 ml-[30px]">
                    <Text 
                      style={{ 
                        fontFamily: 'Montserrat', 
                        fontSize: 14, 
                        fontWeight: '600', 
                        color: '#1A1A1A',
                        textAlign: 'center'
                      }}
                      numberOfLines={1}
                    >
                      {product.category?.toUpperCase()}
                    </Text>
                  </View>

                  {/* Price: Balanced with flex-1 to keep Category centered */}
                  <View className="flex-1 items-end">
                    <Text 
                      style={{ 
                        fontFamily: 'Montserrat', 
                        fontSize: 22, 
                        fontWeight: '700', 
                        color: '#1A1A1A',
                        transform: [{ translateX: -40 }] // Keep the text offset
                      }}
                    >
                      ${product.price.toFixed(2)}
                    </Text>
                  </View>
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