import { Ionicons } from "@expo/vector-icons";
import { useState, useCallback } from "react";
import { ScrollView, View, Text, Pressable, TextInput } from "react-native";
import { useOrder, OrderProduct } from "../../contexts/OrderContext";
import { StepNavigation } from "../../components/StepNavigation";
import { SearchProductModal, SearchProduct } from "../../components/SearchProductModal";

/**
 * AddProductsScreen - Step 2: Add products to order
 */
export default function AddProductsScreen() {
  const { order, updateOrder, addProduct, updateProductQuantity, removeProduct } = useOrder();
  const [searchQuery, setSearchQuery] = useState("");
  const [scanQty, setScanQty] = useState("1");
  const [showSearchModal, setShowSearchModal] = useState(false);

  // Use order products
  const products = order.products;

  // Handle adding product from search modal
  const handleAddProductFromSearch = useCallback((searchProduct: SearchProduct) => {
    const qty = parseInt(scanQty) || 1;
    const newProduct: OrderProduct = {
      id: `${searchProduct.id}-${Date.now()}`,
      sku: searchProduct.sku,
      name: searchProduct.name,
      salePrice: searchProduct.price,
      unit: "Piece",
      quantity: qty,
      tnVaporTax: 0,
      ncVaporTax: 0,
      total: searchProduct.price * qty,
    };
    addProduct(newProduct);
    setShowSearchModal(false);
  }, [scanQty, addProduct]);

  const handleQuantityChange = (id: string, delta: number) => {
    const product = products.find((p) => p.id === id);
    if (product) {
      const newQty = Math.max(1, product.quantity + delta);
      updateProductQuantity(id, newQty);
    }
  };

  // Calculate totals
  const subTotal = products.reduce((sum, p) => sum + p.total, 0);

  return (
    <View className="flex-1">
      <ScrollView className="flex-1" contentContainerClassName="p-4">
        {/* Top Controls */}
        <View className="bg-white rounded-lg p-4 mb-4">
          <View className="flex-row items-center gap-4">
            {/* Channel Select */}
            <View>
              <Text className="text-gray-600 text-sm mb-1.5">Select Chanel</Text>
              <Pressable className="flex-row items-center bg-gray-50 border border-gray-200 rounded-lg px-3 py-2.5 w-32">
                <Text className="flex-1 text-gray-800">{order.channel}</Text>
                <Ionicons name="chevron-down" size={16} color="#9ca3af" />
              </Pressable>
            </View>

            {/* Product Search - Opens Modal */}
            <View className="flex-1">
              <Text className="text-gray-600 text-sm mb-1.5">Add product by Name, SKU, UPC</Text>
              <Pressable
                onPress={() => setShowSearchModal(true)}
                className="flex-row items-center bg-gray-50 border border-gray-200 rounded-lg px-3 py-2"
              >
                <Ionicons name="search" size={18} color="#9ca3af" />
                <Text className="flex-1 ml-2 text-gray-400">Search Products</Text>
              </Pressable>
            </View>

            {/* Scan Qty */}
            <View>
              <Text className="text-gray-600 text-sm mb-1.5">Scan Qty</Text>
              <TextInput
                className="w-16 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2.5 text-center text-gray-800"
                keyboardType="numeric"
                value={scanQty}
                onChangeText={setScanQty}
              />
            </View>

            {/* Action Buttons */}
            <View className="flex-row gap-2 mt-5">
              <Pressable className="bg-red-500 px-4 py-2.5 rounded-lg">
                <Text className="text-white font-medium">Scan Logs</Text>
              </Pressable>
              <Pressable className="bg-red-100 px-4 py-2.5 rounded-lg">
                <Text className="text-red-500 font-medium">Misc Item</Text>
              </Pressable>
            </View>
          </View>

          {/* Second Row */}
          <View className="flex-row items-center justify-between mt-4">
            <View className="flex-row gap-2">
              <Pressable
                onPress={() => setShowSearchModal(true)}
                className="bg-red-500 px-4 py-2.5 rounded-lg"
              >
                <Text className="text-white font-medium">Add New Products</Text>
              </Pressable>
              <Pressable className="border border-gray-300 px-4 py-2.5 rounded-lg">
                <Text className="text-gray-700 font-medium">Bulk Add & Edit</Text>
              </Pressable>
            </View>
            <View className="flex-row gap-2">
              <Pressable
                onPress={() => updateOrder({ products: [] })}
                className="border border-red-500 px-4 py-2.5 rounded-lg"
              >
                <Text className="text-red-500 font-medium">Empty Cart</Text>
              </Pressable>
              <Pressable className="bg-red-500 px-4 py-2.5 rounded-lg">
                <Text className="text-white font-medium">Park Order</Text>
              </Pressable>
            </View>
          </View>
        </View>

        {/* Products Table */}
        <View className="bg-white rounded-lg overflow-hidden flex-1">
          {/* Table Header */}
          <View className="flex-row bg-gray-50 border-b border-gray-200 px-4 py-3">
            <Text className="w-32 text-gray-600 text-xs font-semibold">Product ↕</Text>
            <Text className="flex-1 text-gray-600 text-xs font-semibold">Name</Text>
            <Text className="w-20 text-gray-600 text-xs font-semibold">Sale Price</Text>
            <Text className="w-20 text-gray-600 text-xs font-semibold">Unit</Text>
            <Text className="w-24 text-gray-600 text-xs font-semibold">Quantity ↕</Text>
            <Text className="w-24 text-gray-600 text-xs font-semibold">TN Vapor Tax</Text>
            <Text className="w-24 text-gray-600 text-xs font-semibold">NC Vapor Tax</Text>
            <Text className="w-20 text-gray-600 text-xs font-semibold">Total</Text>
            <Text className="w-16 text-gray-600 text-xs font-semibold">Actions</Text>
          </View>

          {/* Empty State */}
          {products.length === 0 ? (
            <View className="py-12 items-center">
              <Ionicons name="cart-outline" size={48} color="#d1d5db" />
              <Text className="text-gray-400 mt-2">No products added yet</Text>
              <Pressable
                onPress={() => setShowSearchModal(true)}
                className="mt-4 bg-red-500 px-6 py-2 rounded-lg"
              >
                <Text className="text-white font-medium">+ Add Products</Text>
              </Pressable>
            </View>
          ) : (
            /* Table Body */
            products.map((product) => (
              <View
                key={product.id}
                className="flex-row items-center px-4 py-3 border-b border-gray-100"
              >
                <View className="w-32">
                  <Text className="text-red-500 text-sm">{product.sku}</Text>
                </View>
                <View className="flex-1 pr-2">
                  <Text className="text-gray-800 text-sm" numberOfLines={2}>
                    {product.name}
                  </Text>
                </View>
                <Text className="w-20 text-gray-800 text-sm">${product.salePrice.toFixed(2)}</Text>
                <View className="w-20">
                  <View className="flex-row items-center bg-gray-100 rounded px-2 py-1">
                    <Text className="text-gray-700 text-xs">{product.unit}</Text>
                    <Ionicons name="chevron-down" size={12} color="#6b7280" />
                  </View>
                </View>
                {/* Quantity Controls */}
                <View className="w-24 flex-row items-center gap-1">
                  <Pressable
                    onPress={() => handleQuantityChange(product.id, -1)}
                    className="w-6 h-6 bg-red-500 rounded items-center justify-center"
                  >
                    <Ionicons name="remove" size={14} color="white" />
                  </Pressable>
                  <Text className="w-6 text-center text-gray-800">{product.quantity}</Text>
                  <Pressable
                    onPress={() => handleQuantityChange(product.id, 1)}
                    className="w-6 h-6 bg-green-500 rounded items-center justify-center"
                  >
                    <Ionicons name="add" size={14} color="white" />
                  </Pressable>
                </View>
                <Text className="w-24 text-gray-800 text-sm">${product.tnVaporTax.toFixed(4)}</Text>
                <Text className="w-24 text-gray-800 text-sm">${product.ncVaporTax.toFixed(4)}</Text>
                <Text className="w-20 text-gray-800 text-sm font-medium">${product.total.toFixed(2)}</Text>
                <View className="w-16">
                  <Pressable
                    onPress={() => removeProduct(product.id)}
                    className="w-8 h-8 bg-red-100 rounded items-center justify-center"
                  >
                    <Ionicons name="trash-outline" size={16} color="#ef4444" />
                  </Pressable>
                </View>
              </View>
            ))
          )}
        </View>

        {/* Totals */}
        {products.length > 0 && (
          <View className="bg-white rounded-lg p-4 mt-4">
            <View className="flex-row justify-end">
              <Text className="text-gray-600 text-lg mr-4">Sub Total:</Text>
              <Text className="text-gray-800 text-lg font-bold">${subTotal.toFixed(2)}</Text>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Bottom Navigation */}
      <StepNavigation />

      {/* Search Product Modal */}
      <SearchProductModal
        visible={showSearchModal}
        onClose={() => setShowSearchModal(false)}
        onSelectProduct={handleAddProductFromSearch}
      />
    </View>
  );
}
