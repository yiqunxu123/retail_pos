import { Ionicons } from "@expo/vector-icons";
import { useState, useCallback } from "react";
import { Modal, View, Text, Pressable, TextInput, ScrollView, Image } from "react-native";

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
  products?: SearchProduct[];
}

// Sample products for demonstration
const SAMPLE_PRODUCTS: SearchProduct[] = [
  { id: "1", name: "Shorts Green Athletic wear", sku: "6522/609137681542", category: "GROCERY/HEALTH", quantity: 5, price: 8.00 },
  { id: "2", name: "Shorts Green Athletic wear", sku: "6522/609137681543", category: "GROCERY/HEALTH", quantity: 5, price: 8.00 },
  { id: "3", name: "Shorts Green Athletic wear", sku: "6522/609137681544", category: "GROCERY/HEALTH", quantity: 5, price: 8.00 },
  { id: "4", name: "Shorts Green Athletic wear", sku: "6522/609137681545", category: "GROCERY/HEALTH", quantity: 5, price: 8.00 },
];

/**
 * SearchProductModal - Searchable product list modal
 * Reusable across POS, order flow, and inventory screens
 */
export function SearchProductModal({
  visible,
  onClose,
  onSelectProduct,
  products = SAMPLE_PRODUCTS,
}: SearchProductModalProps) {
  const [searchQuery, setSearchQuery] = useState("");

  // Filter products based on search query
  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
                placeholder="Search by name, SKU..."
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

          {/* Product List */}
          <View style={{ maxHeight: 350 }}>
            {filteredProducts.length === 0 ? (
              <View className="py-8 items-center">
                <Ionicons name="search-outline" size={48} color="#d1d5db" />
                <Text className="text-gray-400 mt-2">No products found</Text>
              </View>
            ) : (
              <ScrollView>
                {filteredProducts.map((product) => (
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
                      <Text className="text-teal-700 text-xs font-medium">
                        {product.category}
                      </Text>
                    </View>

                    {/* Quantity */}
                    <Text className="text-gray-500 text-xs mr-2">
                      Qty: {product.quantity}
                    </Text>

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
