/**
 * Add Product Screen
 * 
 * Form to add a new product to the catalog.
 */

import { useRouter } from "expo-router";
import { useState } from "react";
import {
    Alert,
    Pressable,
    ScrollView,
    Text,
    TextInput,
    View,
} from "react-native";
import { PageHeader } from "../../components";

export default function AddProductScreen() {
  const router = useRouter();
  
  // Form state
  const [productName, setProductName] = useState("");
  const [sku, setSku] = useState("");
  const [upc, setUpc] = useState("");
  const [category, setCategory] = useState("");
  const [brand, setBrand] = useState("");
  const [salePrice, setSalePrice] = useState("");
  const [costPrice, setCostPrice] = useState("");

  const handleSave = () => {
    if (!productName.trim()) {
      Alert.alert("Error", "Product name is required");
      return;
    }
    
    // TODO: Save product to database
    Alert.alert("Success", "Product added successfully", [
      { text: "OK", onPress: () => router.back() }
    ]);
  };

  return (
    <View className="flex-1 bg-gray-50">
      <PageHeader title="Add Product" />

      <ScrollView className="flex-1 p-6">
        {/* Form Card */}
        <View className="bg-white rounded-xl p-6 shadow-sm">
          <Text className="text-lg font-semibold text-gray-800 mb-6">Product Information</Text>

          {/* Product Name */}
          <View className="mb-4">
            <Text className="text-gray-600 text-sm mb-2">Product Name *</Text>
            <TextInput
              className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-3"
              placeholder="Enter product name"
              placeholderTextColor="#9ca3af"
              value={productName}
              onChangeText={setProductName}
            />
          </View>

          {/* SKU & UPC */}
          <View className="flex-row gap-4 mb-4">
            <View className="flex-1">
              <Text className="text-gray-600 text-sm mb-2">SKU</Text>
              <TextInput
                className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-3"
                placeholder="Enter SKU"
                placeholderTextColor="#9ca3af"
                value={sku}
                onChangeText={setSku}
              />
            </View>
            <View className="flex-1">
              <Text className="text-gray-600 text-sm mb-2">UPC</Text>
              <TextInput
                className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-3"
                placeholder="Enter UPC"
                placeholderTextColor="#9ca3af"
                value={upc}
                onChangeText={setUpc}
              />
            </View>
          </View>

          {/* Category & Brand */}
          <View className="flex-row gap-4 mb-4">
            <View className="flex-1">
              <Text className="text-gray-600 text-sm mb-2">Category</Text>
              <TextInput
                className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-3"
                placeholder="Enter category"
                placeholderTextColor="#9ca3af"
                value={category}
                onChangeText={setCategory}
              />
            </View>
            <View className="flex-1">
              <Text className="text-gray-600 text-sm mb-2">Brand</Text>
              <TextInput
                className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-3"
                placeholder="Enter brand"
                placeholderTextColor="#9ca3af"
                value={brand}
                onChangeText={setBrand}
              />
            </View>
          </View>

          {/* Prices */}
          <View className="flex-row gap-4 mb-6">
            <View className="flex-1">
              <Text className="text-gray-600 text-sm mb-2">Cost Price</Text>
              <TextInput
                className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-3"
                placeholder="0.00"
                placeholderTextColor="#9ca3af"
                keyboardType="decimal-pad"
                value={costPrice}
                onChangeText={setCostPrice}
              />
            </View>
            <View className="flex-1">
              <Text className="text-gray-600 text-sm mb-2">Sale Price</Text>
              <TextInput
                className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-3"
                placeholder="0.00"
                placeholderTextColor="#9ca3af"
                keyboardType="decimal-pad"
                value={salePrice}
                onChangeText={setSalePrice}
              />
            </View>
          </View>

          {/* Buttons */}
          <View className="flex-row gap-4">
            <Pressable
              className="flex-1 bg-gray-200 py-3 rounded-lg items-center"
              onPress={() => router.back()}
            >
              <Text className="text-gray-700 font-medium">Cancel</Text>
            </Pressable>
            <Pressable
              className="flex-1 py-3 rounded-lg items-center"
              style={{ backgroundColor: "#3B82F6" }}
              onPress={handleSave}
            >
              <Text className="text-white font-medium">Save Product</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
