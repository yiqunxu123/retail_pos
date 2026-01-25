import { Ionicons } from "@expo/vector-icons";
import { View, Text, Pressable, ScrollView } from "react-native";

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
  onSelectProduct?: (id: string) => void;
}

/**
 * ProductTable - Displays cart items in a table format
 * Shows product details with quantity controls
 */
export function ProductTable({
  products,
  onQuantityChange,
  selectedProductId,
  onSelectProduct,
}: ProductTableProps) {
  // Table header columns
  const headers = [
    { label: "SKU/UPC", width: 140, sortable: true },
    { label: "Product Name", width: 240, sortable: true },
    { label: "Sale Price", width: 80, sortable: true },
    { label: "Unit", width: 80 },
    { label: "Quantity", width: 100, sortable: true },
    { label: "TN Vapor Tax", width: 90 },
    { label: "NC Vapor Tax", width: 90 },
    { label: "Total", width: 100 },
  ];

  return (
    <View className="bg-white rounded-lg overflow-hidden flex-1">
      {/* Table Header */}
      <View className="flex-row bg-gray-50 border-b border-gray-200 px-3 py-3">
        {headers.map((header, index) => (
          <View
            key={index}
            className="flex-row items-center"
            style={{ width: header.width }}
          >
            <Text className="text-gray-600 text-xs font-semibold">
              {header.label}
            </Text>
            {header.sortable && (
              <Ionicons name="chevron-expand" size={12} color="#9ca3af" style={{ marginLeft: 4 }} />
            )}
          </View>
        ))}
      </View>

      {/* Table Body */}
      <ScrollView className="flex-1">
        {products.map((product, index) => (
          <Pressable
            key={product.id}
            onPress={() => onSelectProduct?.(product.id)}
            className={`flex-row items-center px-3 py-3 border-b border-gray-100 ${
              selectedProductId === product.id ? "bg-blue-50" : ""
            }`}
            style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
          >
            {/* SKU/UPC */}
            <View style={{ width: 140 }}>
              <Text className="text-gray-800 text-sm">{product.sku}</Text>
            </View>

            {/* Product Name */}
            <View style={{ width: 240 }} className="pr-2">
              <Text className="text-gray-800 text-sm" numberOfLines={2}>
                {product.name}
              </Text>
              {product.isPromo && (
                <View className="bg-red-500 px-2 py-0.5 rounded self-start mt-1">
                  <Text className="text-white text-xs font-medium">PROMO</Text>
                </View>
              )}
            </View>

            {/* Sale Price */}
            <View style={{ width: 80 }}>
              <Text className="text-gray-800 text-sm">{product.salePrice}</Text>
            </View>

            {/* Unit */}
            <View style={{ width: 80 }}>
              <View className="flex-row items-center bg-gray-100 rounded px-2 py-1">
                <Text className="text-gray-700 text-xs">{product.unit}</Text>
                <Ionicons name="chevron-down" size={12} color="#6b7280" />
              </View>
            </View>

            {/* Quantity Controls */}
            <View style={{ width: 100 }} className="flex-row items-center gap-2">
              <Pressable
                onPress={() => onQuantityChange(product.id, -1)}
                className="w-7 h-7 bg-red-500 rounded items-center justify-center"
                style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
              >
                <Ionicons name="remove" size={16} color="white" />
              </Pressable>
              <Text className="text-gray-800 text-sm font-medium w-6 text-center">
                {product.quantity}
              </Text>
              <Pressable
                onPress={() => onQuantityChange(product.id, 1)}
                className="w-7 h-7 bg-green-500 rounded items-center justify-center"
                style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
              >
                <Ionicons name="add" size={16} color="white" />
              </Pressable>
            </View>

            {/* TN Vapor Tax */}
            <View style={{ width: 90 }}>
              <Text className="text-gray-800 text-sm">
                ${product.tnVaporTax.toFixed(4)}
              </Text>
            </View>

            {/* NC Vapor Tax */}
            <View style={{ width: 90 }}>
              <Text className="text-gray-800 text-sm">
                ${product.ncVaporTax.toFixed(4)}
              </Text>
            </View>

            {/* Total */}
            <View style={{ width: 100 }}>
              <Text className="text-gray-800 text-sm font-medium">
                ${product.total.toFixed(2)}
              </Text>
            </View>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}
