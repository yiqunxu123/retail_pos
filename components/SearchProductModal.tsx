import { Ionicons } from "@expo/vector-icons";
import { useCallback, useMemo, useState } from "react";
import { ActivityIndicator, Image, Modal, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { useProductSearch, useProducts } from "../utils/powersync/hooks";

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
 * SearchProductModal - Searchable product list modal
 *
 * Uses PowerSync local database for real-time product search.
 * Shows initial product list on open, filters as user types.
 */
export function SearchProductModal({
  visible,
  onClose,
  onSelectProduct,
}: SearchProductModalProps) {
  const [searchQuery, setSearchQuery] = useState("");

  // Use search hook when query >= 2 chars, otherwise show all products
  const { products: searchResults, isLoading: searchLoading } = useProductSearch(searchQuery);
  const { products: allProducts, isLoading: allLoading } = useProducts();

  // Show search results when searching, otherwise show first 50 products
  const displayProducts = useMemo(() => {
    const source = searchQuery.length >= 2 ? searchResults : allProducts.slice(0, 50);
    return source.map((p) => ({
      id: p.id,
      name: p.name,
      sku: p.sku || p.upc || "",
      category: p.categoryName || "Uncategorized",
      quantity: 0, // Stock quantity not in product view, can be enhanced later
      price: p.salePrice,
      image: p.images?.[0],
    }));
  }, [searchQuery, searchResults, allProducts]);

  const isLoading = searchQuery.length >= 2 ? searchLoading : allLoading;

  const handleSelectProduct = useCallback(
    (product: SearchProduct) => {
      onSelectProduct(product);
      setSearchQuery("");
    },
    [onSelectProduct]
  );

  const handleClose = () => {
    setSearchQuery("");
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
    >
      <Pressable
        className="flex-1 bg-black/50 justify-start items-start p-8"
        onPress={handleClose}
      >
        {/* Modal Content - Positioned top-left like in screenshot */}
        <Pressable
          className="bg-white rounded-xl overflow-hidden shadow-xl"
          style={{ width: 420 }}
          onPress={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <View className="flex-row justify-between items-center px-4 py-3 bg-red-500">
            <Text className="text-white text-lg font-semibold">Search Products</Text>
            <Pressable
              onPress={handleClose}
              className="w-6 h-6 bg-white rounded-full items-center justify-center"
              style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
            >
              <Ionicons name="close" size={16} color="#ef4444" />
            </Pressable>
          </View>

          {/* Search Input */}
          <View className="px-4 py-3 border-b border-gray-200">
            <View className="flex-row items-center bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
              <Ionicons name="search" size={18} color="#9ca3af" />
              <TextInput
                className="flex-1 ml-2 text-gray-800"
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
            {searchQuery.length === 1 && (
              <Text className="text-gray-400 text-xs mt-1 ml-1">
                Type at least 2 characters to search
              </Text>
            )}
          </View>

          {/* Product List */}
          <View style={{ maxHeight: 350 }}>
            {isLoading ? (
              <View className="py-8 items-center">
                <ActivityIndicator size="small" color="#EC1A52" />
                <Text className="text-gray-400 mt-2">Loading products...</Text>
              </View>
            ) : displayProducts.length === 0 ? (
              <View className="py-8 items-center">
                <Ionicons name="search-outline" size={48} color="#d1d5db" />
                <Text className="text-gray-400 mt-2">No products found</Text>
              </View>
            ) : (
              <ScrollView>
                {displayProducts.map((product) => (
                  <Pressable
                    key={product.id}
                    onPress={() => handleSelectProduct(product)}
                    className="flex-row items-center px-4 py-3 border-b border-gray-100"
                    style={({ pressed }) => ({
                      backgroundColor: pressed ? "#f3f4f6" : "white",
                    })}
                  >
                    {/* Product Image */}
                    <View className="w-12 h-12 bg-gray-100 rounded-lg items-center justify-center mr-3">
                      {product.image ? (
                        <Image
                          source={{ uri: product.image }}
                          className="w-full h-full rounded-lg"
                        />
                      ) : (
                        <Ionicons name="cube-outline" size={24} color="#9ca3af" />
                      )}
                    </View>

                    {/* Product Info */}
                    <View className="flex-1 mr-2">
                      <Text className="text-gray-800 font-medium" numberOfLines={1}>
                        {product.name}
                      </Text>
                      <Text className="text-gray-500 text-xs">{product.sku}</Text>
                    </View>

                    {/* Category Tag */}
                    <View className="bg-teal-100 px-2 py-1 rounded mr-2">
                      <Text className="text-teal-700 text-xs font-medium" numberOfLines={1}>
                        {product.category}
                      </Text>
                    </View>

                    {/* Price */}
                    <Text className="text-gray-800 font-bold">
                      ${product.price.toFixed(2)}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>
            )}
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
