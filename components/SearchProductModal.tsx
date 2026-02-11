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
import {
    useCategories,
    useProductSearch,
    useProductsByCategory,
} from "../utils/powersync/hooks";

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

const SIDEBAR_W = 200;

/**
 * SearchProductModal - Category sidebar + product grid layout
 */
export function SearchProductModal({
  visible,
  onClose,
  onSelectProduct,
}: SearchProductModalProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);

  // Data hooks
  const { categories, isLoading: catLoading } = useCategories();
  const { products: searchResults, isLoading: searchLoading } = useProductSearch(searchQuery);
  const { products: categoryProducts, isLoading: catProdLoading } = useProductsByCategory(selectedCategoryId);

  const isSearching = searchQuery.length >= 2;
  const isLoading = isSearching ? searchLoading : catProdLoading;

  // Map products to SearchProduct shape
  const displayProducts = useMemo(() => {
    const source = isSearching ? searchResults : categoryProducts;
    return source.map((p) => ({
      id: p.id,
      name: p.name,
      sku: p.sku || p.upc || "",
      category: p.categoryName || "Uncategorized",
      quantity: 0,
      price: p.salePrice,
      image: p.images?.[0],
    }));
  }, [isSearching, searchResults, categoryProducts]);

  // Total product count for "All" badge
  const totalProductCount = useMemo(
    () => categories.reduce((sum, c) => sum + c.productCount, 0),
    [categories]
  );

  const handleSelectProduct = useCallback(
    (product: SearchProduct) => {
      onSelectProduct(product);
    },
    [onSelectProduct]
  );

  const handleClose = () => {
    setSearchQuery("");
    setSelectedCategoryId(null);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose}>
      <Pressable className="flex-1 bg-black/50 justify-center items-center" onPress={handleClose}>
        {/* Modal card — takes most of the screen */}
        <Pressable
          className="bg-white rounded-2xl overflow-hidden flex-row"
          style={{ width: "90%", height: "85%" }}
          onPress={() => {}}
        >
          {/* ===== Left Sidebar — Categories ===== */}
          <View className="bg-gray-50 border-r border-gray-200" style={{ width: SIDEBAR_W }}>
            {/* Sidebar header */}
            <View className="px-4 pt-4 pb-2">
              <Text className="text-gray-800 font-bold text-base">Categories</Text>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* All */}
              <Pressable
                onPress={() => setSelectedCategoryId(null)}
                className={`flex-row items-center justify-between px-4 py-3 ${
                  selectedCategoryId === null ? "bg-red-50 border-r-2 border-red-500" : ""
                }`}
              >
                <Text
                  className={`text-sm font-medium ${
                    selectedCategoryId === null ? "text-red-600" : "text-gray-700"
                  }`}
                >
                  All
                </Text>
                <View className="bg-gray-200 rounded-full px-2 py-0.5 min-w-[28px] items-center">
                  <Text className="text-gray-600 text-xs font-medium">{totalProductCount}</Text>
                </View>
              </Pressable>

              {catLoading ? (
                <ActivityIndicator className="mt-4" color="#ef4444" />
              ) : (
                categories.map((cat) => (
                  <Pressable
                    key={cat.id}
                    onPress={() => {
                      setSelectedCategoryId(cat.id);
                      setSearchQuery("");
                    }}
                    className={`flex-row items-center justify-between px-4 py-3 ${
                      selectedCategoryId === cat.id ? "bg-red-50 border-r-2 border-red-500" : ""
                    }`}
                  >
                    <Text
                      className={`text-sm flex-1 mr-2 ${
                        selectedCategoryId === cat.id ? "text-red-600 font-medium" : "text-gray-700"
                      }`}
                      numberOfLines={1}
                    >
                      {cat.name}
                    </Text>
                    <View className="bg-gray-200 rounded-full px-2 py-0.5 min-w-[28px] items-center">
                      <Text className="text-gray-600 text-xs font-medium">{cat.productCount}</Text>
                    </View>
                  </Pressable>
                ))
              )}
            </ScrollView>
          </View>

          {/* ===== Right Content — Search + Product Grid ===== */}
          <View className="flex-1">
            {/* Top bar: search + close */}
            <View className="flex-row items-center gap-3 px-4 py-3 border-b border-gray-200">
              <View className="flex-1 flex-row items-center bg-gray-100 rounded-lg px-3 py-2">
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
              <Pressable onPress={handleClose} className="p-2">
                <Ionicons name="close" size={22} color="#6b7280" />
              </Pressable>
            </View>

            {/* Product count label */}
            <View className="px-4 pt-3 pb-1">
              <Text className="text-gray-500 text-xs">
                {isSearching
                  ? `Search results: ${displayProducts.length}`
                  : `${selectedCategoryId ? categories.find((c) => c.id === selectedCategoryId)?.name : "All"} — ${displayProducts.length} products`}
              </Text>
            </View>

            {/* Product grid */}
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
              <ScrollView
                className="flex-1"
                contentContainerStyle={{
                  flexDirection: "row",
                  flexWrap: "wrap",
                  padding: 12,
                  gap: 12,
                }}
              >
                {displayProducts.map((product) => (
                  <Pressable
                    key={product.id}
                    onPress={() => handleSelectProduct(product)}
                    className="bg-white border border-gray-200 rounded-xl overflow-hidden"
                    style={{ width: 160 }}
                  >
                    {/* Image */}
                    <View className="w-full h-28 bg-gray-100 items-center justify-center">
                      {product.image ? (
                        <Image
                          source={{ uri: product.image }}
                          className="w-full h-full"
                          resizeMode="cover"
                        />
                      ) : (
                        <Ionicons name="cube-outline" size={36} color="#d1d5db" />
                      )}
                    </View>

                    {/* Info */}
                    <View className="p-2">
                      <Text className="text-gray-800 text-xs font-medium" numberOfLines={2}>
                        {product.name}
                      </Text>
                      <Text className="text-gray-400 text-[10px] mt-0.5" numberOfLines={1}>
                        {product.sku}
                      </Text>
                      <View className="flex-row items-center justify-between mt-2">
                        <Text className="text-red-500 font-bold text-sm">
                          ${product.price.toFixed(2)}
                        </Text>
                        <View className="bg-red-500 rounded-full w-6 h-6 items-center justify-center">
                          <Ionicons name="add" size={16} color="white" />
                        </View>
                      </View>
                    </View>
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
