import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState, useCallback } from "react";
import {
  ScrollView,
  View,
  Text,
  Pressable,
  TextInput,
  Switch,
  useWindowDimensions,
} from "react-native";
import { SearchProductModal, SearchProduct } from "../../components/SearchProductModal";
import { OrderProduct, OrderCustomer } from "../../types";

export default function AddQuickOrderScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isWideScreen = width > 1024;

  // Customer state
  const [customerSearch, setCustomerSearch] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState<OrderCustomer | null>(null);
  const [paymentTerms, setPaymentTerms] = useState("Due Immediately");
  const [invoiceDate, setInvoiceDate] = useState("2026-01-26");
  const [orderNumber, setOrderNumber] = useState("");
  const [shippingType, setShippingType] = useState("Pick up");
  const [skipMSA, setSkipMSA] = useState(false);
  const [notes, setNotes] = useState("");

  // Product state
  const [storeChannel, setStoreChannel] = useState("Primary");
  const [productSearch, setProductSearch] = useState("");
  const [scanQty, setScanQty] = useState("1");
  const [products, setProducts] = useState<OrderProduct[]>([]);
  const [showSearchModal, setShowSearchModal] = useState(false);

  // Order state
  const [orderType, setOrderType] = useState("Offsite");
  const [orderDate, setOrderDate] = useState("2026-01-26");
  const [isSaleOrder, setIsSaleOrder] = useState(true);
  const [dispatchDate, setDispatchDate] = useState("2026-01-26");
  const [salesRep, setSalesRep] = useState("");
  const [additionalDiscount, setAdditionalDiscount] = useState("0");
  const [discountType, setDiscountType] = useState("$");
  const [deliveryCharges, setDeliveryCharges] = useState("");

  // Handle adding product from search
  const handleAddProduct = useCallback((searchProduct: SearchProduct) => {
    const qty = parseInt(scanQty) || 1;
    const existingIndex = products.findIndex(p => p.sku === searchProduct.sku);
    
    if (existingIndex >= 0) {
      const updated = [...products];
      updated[existingIndex].quantity += qty;
      updated[existingIndex].total = updated[existingIndex].price * updated[existingIndex].quantity;
      setProducts(updated);
    } else {
      const newProduct: OrderProduct = {
        id: `${searchProduct.id}-${Date.now()}`,
        sku: searchProduct.sku,
        name: searchProduct.name,
        price: searchProduct.price,
        quantity: qty,
        total: searchProduct.price * qty,
      };
      setProducts([...products, newProduct]);
    }
    setShowSearchModal(false);
  }, [scanQty, products]);

  // Handle quantity change
  const handleQuantityChange = (id: string, delta: number) => {
    setProducts(products.map(p => {
      if (p.id === id) {
        const newQty = Math.max(1, p.quantity + delta);
        return { ...p, quantity: newQty, total: p.price * newQty };
      }
      return p;
    }));
  };

  // Remove product
  const removeProduct = (id: string) => {
    setProducts(products.filter(p => p.id !== id));
  };

  // Empty cart
  const emptyCart = () => {
    setProducts([]);
  };

  // Calculate totals
  const totalProducts = products.length;
  const totalQuantity = products.reduce((sum, p) => sum + p.quantity, 0);
  const subTotal = products.reduce((sum, p) => sum + p.total, 0);
  const discount = discountType === "$" 
    ? parseFloat(additionalDiscount) || 0 
    : (subTotal * (parseFloat(additionalDiscount) || 0)) / 100;
  const delivery = parseFloat(deliveryCharges) || 0;
  const grandTotal = subTotal - discount + delivery;

  // Dropdown component
  const Dropdown = ({ label, value, options }: { label: string; value: string; options: string[] }) => (
    <View className="mb-4">
      <Text className="text-gray-600 text-sm mb-1.5">{label}</Text>
      <Pressable className="flex-row items-center bg-gray-50 border border-gray-200 rounded-lg px-3 py-3">
        <Text className="flex-1 text-gray-800">{value}</Text>
        <Ionicons name="chevron-down" size={16} color="#9ca3af" />
      </Pressable>
    </View>
  );

  // Input component
  const FormInput = ({ label, value, onChangeText, placeholder, keyboardType = "default" }: any) => (
    <View className="mb-4">
      <Text className="text-gray-600 text-sm mb-1.5">{label}</Text>
      <TextInput
        className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-3 text-gray-800"
        placeholder={placeholder}
        placeholderTextColor="#9ca3af"
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType}
      />
    </View>
  );

  return (
    <View className="flex-1 bg-gray-100">
      {/* Header */}
      <View className="bg-white px-5 py-4 border-b border-gray-200 flex-row items-center justify-between">
        <View className="flex-row items-center gap-4">
          <Pressable onPress={() => router.push("/")} className="p-2">
            <Ionicons name="arrow-back" size={24} color="#374151" />
          </Pressable>
          <Text className="text-xl font-bold text-gray-800">Add Quick Order</Text>
        </View>
        <View className="flex-row gap-2">
          <Pressable className="bg-blue-500 px-4 py-2.5 rounded-lg flex-row items-center gap-2">
            <Ionicons name="save-outline" size={18} color="white" />
            <Text className="text-white font-medium">Save Order</Text>
          </Pressable>
        </View>
      </View>

      <ScrollView className="flex-1" contentContainerClassName="p-5">
        <View className={`${isWideScreen ? "flex-row gap-4" : "gap-4"}`}>
          
          {/* LEFT PANEL - Customer Selection */}
          <View className={`bg-white rounded-xl p-5 ${isWideScreen ? "w-80" : ""}`}>
            <Text className="text-lg font-bold text-gray-800 mb-4">Customer</Text>
            
            {/* Search Inputs */}
            <View className="mb-4">
              <View className="flex-row items-center bg-blue-50 border border-blue-200 rounded-lg px-3 py-3 mb-2">
                <Ionicons name="person-outline" size={18} color="#3b82f6" />
                <TextInput
                  className="flex-1 ml-2 text-gray-800"
                  placeholder="Search by Customer Name/Business"
                  placeholderTextColor="#9ca3af"
                  value={customerSearch}
                  onChangeText={setCustomerSearch}
                />
              </View>
              <View className="flex-row items-center bg-gray-50 border border-gray-200 rounded-lg px-3 py-3 mb-2">
                <Ionicons name="key-outline" size={18} color="#6b7280" />
                <TextInput
                  className="flex-1 ml-2 text-gray-800"
                  placeholder="Search by Customer ID/Number"
                  placeholderTextColor="#9ca3af"
                />
              </View>
              <View className="flex-row items-center bg-gray-50 border border-gray-200 rounded-lg px-3 py-3">
                <Ionicons name="mail-outline" size={18} color="#6b7280" />
                <TextInput
                  className="flex-1 ml-2 text-gray-800"
                  placeholder="Search by Customer Email/Address"
                  placeholderTextColor="#9ca3af"
                />
              </View>
            </View>

            {/* Selected Customer Card */}
            <View className="bg-gray-50 rounded-lg p-4 mb-4">
              <Text className="text-gray-800 font-semibold text-lg">
                {selectedCustomer?.name || "Guest Customer"}
              </Text>
              <Pressable className="mt-2">
                <Text className="text-blue-500 font-medium">+ Add Quick Customer</Text>
              </Pressable>
            </View>

            {/* Order Details */}
            <Dropdown label="Payment Terms" value={paymentTerms} options={["Due Immediately", "Net 30", "Net 60"]} />
            <FormInput label="Invoice Due Date" value={invoiceDate} onChangeText={setInvoiceDate} />
            <FormInput label="Order Number" value={orderNumber} onChangeText={setOrderNumber} placeholder="Enter Order Number" />
            <Dropdown label="Shipping Type" value={shippingType} options={["Pick up", "Delivery", "Shipping"]} />

            {/* MSA Check Toggle */}
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-gray-600 text-sm">Skip MSA Eligibility Check</Text>
              <Switch
                value={skipMSA}
                onValueChange={setSkipMSA}
                trackColor={{ false: "#d1d5db", true: "#3b82f6" }}
                thumbColor="white"
              />
            </View>

            {/* Notes Section */}
            <View>
              <Text className="text-blue-500 font-medium mb-2">Notes</Text>
              <Text className="text-gray-600 text-sm mb-1.5">Notes (Internal)</Text>
              <TextInput
                className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-3 text-gray-800 h-24"
                placeholder="Enter notes..."
                placeholderTextColor="#9ca3af"
                value={notes}
                onChangeText={setNotes}
                multiline
                textAlignVertical="top"
              />
              <Text className="text-gray-400 text-xs mt-1">{500 - notes.length} Character(s) out of 500 remaining</Text>
            </View>
          </View>

          {/* MIDDLE PANEL - Products */}
          <View className={`bg-white rounded-xl p-4 ${isWideScreen ? "flex-1" : ""}`}>
            <Text className="text-lg font-bold text-gray-800 mb-4">Products</Text>
            
            {/* Store Channel & Search */}
            <View className="flex-row items-end gap-3 mb-4">
              <View className="flex-1">
                <Text className="text-gray-600 text-sm mb-1.5">Please select the Store Channel*</Text>
                <Pressable className="flex-row items-center bg-gray-50 border border-gray-200 rounded-lg px-3 py-3">
                  <Text className="flex-1 text-gray-800">{storeChannel}</Text>
                  <Ionicons name="chevron-down" size={16} color="#9ca3af" />
                </Pressable>
              </View>
              <Pressable className="bg-blue-500 px-4 py-3 rounded-lg">
                <Text className="text-white font-medium">Bulk Add & Edit</Text>
              </Pressable>
            </View>

            {/* Product Search Bar */}
            <View className="flex-row items-end gap-3 mb-4">
              <View className="flex-1">
                <Text className="text-gray-600 text-sm mb-1.5">Add product by Name, SKU, UPC</Text>
                <Pressable 
                  onPress={() => setShowSearchModal(true)}
                  className="flex-row items-center bg-gray-50 border border-gray-200 rounded-lg px-3 py-3"
                >
                  <Ionicons name="search" size={18} color="#9ca3af" />
                  <Text className="flex-1 ml-2 text-gray-400">Search Products</Text>
                </Pressable>
              </View>
              <View>
                <Text className="text-gray-600 text-sm mb-1.5 text-center">Scan Qty</Text>
                <TextInput
                  className="w-16 bg-gray-50 border border-gray-200 rounded-lg px-3 py-3 text-center text-gray-800"
                  keyboardType="numeric"
                  value={scanQty}
                  onChangeText={setScanQty}
                />
              </View>
              <Pressable className="bg-red-500 px-4 py-3 rounded-lg flex-row items-center gap-2">
                <Ionicons name="scan" size={18} color="white" />
                <Text className="text-white font-medium">Scan Logs</Text>
              </Pressable>
              <Pressable className="bg-gray-100 p-3 rounded-lg">
                <Ionicons name="settings-outline" size={20} color="#374151" />
              </Pressable>
            </View>

            {/* Products Table */}
            <View className="border border-gray-200 rounded-lg overflow-hidden">
              {/* Table Header */}
              <View className="flex-row bg-gray-50 px-4 py-3 border-b border-gray-200">
                <Text className="w-24 text-gray-500 text-xs font-semibold uppercase">SKU</Text>
                <Text className="flex-1 text-gray-500 text-xs font-semibold uppercase">Product Name</Text>
                <Text className="w-20 text-gray-500 text-xs font-semibold uppercase text-center">Price</Text>
                <Text className="w-24 text-gray-500 text-xs font-semibold uppercase text-center">Qty</Text>
                <Text className="w-20 text-gray-500 text-xs font-semibold uppercase text-center">Total</Text>
                <Text className="w-16 text-gray-500 text-xs font-semibold uppercase text-center">Action</Text>
              </View>

              {/* Empty State or Products */}
              {products.length === 0 ? (
                <View className="py-16 items-center">
                  <Ionicons name="cart-outline" size={64} color="#d1d5db" />
                  <Text className="text-gray-400 text-lg mt-4">Nothing in cart!</Text>
                  <Pressable 
                    onPress={() => setShowSearchModal(true)}
                    className="mt-4 bg-blue-500 px-6 py-3 rounded-lg"
                  >
                    <Text className="text-white font-medium">+ Add Products</Text>
                  </Pressable>
                </View>
              ) : (
                <ScrollView style={{ maxHeight: 300 }}>
                  {products.map((product) => (
                    <View key={product.id} className="flex-row items-center px-4 py-3 border-b border-gray-100">
                      <Text className="w-24 text-blue-600 text-sm font-medium">{product.sku}</Text>
                      <Text className="flex-1 text-gray-800 text-sm pr-2" numberOfLines={2}>{product.name}</Text>
                      <Text className="w-20 text-gray-800 text-sm text-center">${product.price.toFixed(2)}</Text>
                      <View className="w-24 flex-row items-center justify-center gap-1">
                        <Pressable
                          onPress={() => handleQuantityChange(product.id, -1)}
                          className="w-7 h-7 bg-red-500 rounded items-center justify-center"
                        >
                          <Ionicons name="remove" size={16} color="white" />
                        </Pressable>
                        <Text className="w-8 text-center text-gray-800 font-medium">{product.quantity}</Text>
                        <Pressable
                          onPress={() => handleQuantityChange(product.id, 1)}
                          className="w-7 h-7 bg-green-500 rounded items-center justify-center"
                        >
                          <Ionicons name="add" size={16} color="white" />
                        </Pressable>
                      </View>
                      <Text className="w-20 text-gray-800 text-sm text-center font-medium">${product.total.toFixed(2)}</Text>
                      <View className="w-16 items-center">
                        <Pressable
                          onPress={() => removeProduct(product.id)}
                          className="p-2 bg-red-100 rounded-lg"
                        >
                          <Ionicons name="trash-outline" size={16} color="#ef4444" />
                        </Pressable>
                      </View>
                    </View>
                  ))}
                </ScrollView>
              )}
            </View>
          </View>

          {/* RIGHT PANEL - Order Summary */}
          <View className={`bg-white rounded-xl p-4 ${isWideScreen ? "w-72" : ""}`}>
            <Text className="text-lg font-bold text-gray-800 mb-4">Order Summary</Text>

            {/* Order Type & Date */}
            <View className="flex-row gap-3 mb-4">
              <View className="flex-1">
                <Text className="text-gray-600 text-sm mb-1.5">Order Type</Text>
                <Pressable className="flex-row items-center bg-gray-50 border border-gray-200 rounded-lg px-3 py-2.5">
                  <Text className="flex-1 text-gray-800 text-sm">{orderType}</Text>
                  <Ionicons name="chevron-down" size={14} color="#9ca3af" />
                </Pressable>
              </View>
              <View className="flex-1">
                <Text className="text-gray-600 text-sm mb-1.5">Order Date</Text>
                <View className="flex-row items-center bg-gray-50 border border-gray-200 rounded-lg px-3 py-2.5">
                  <Text className="flex-1 text-gray-800 text-sm">{orderDate}</Text>
                  <Ionicons name="calendar-outline" size={14} color="#9ca3af" />
                </View>
              </View>
            </View>

            {/* Action Buttons */}
            <View className="gap-2 mb-4">
              <Pressable 
                onPress={emptyCart}
                className="bg-blue-100 py-3 rounded-lg flex-row items-center justify-center gap-2"
              >
                <Ionicons name="trash-outline" size={18} color="#3b82f6" />
                <Text className="text-blue-600 font-medium">Empty Cart</Text>
              </Pressable>
              <Pressable className="bg-blue-100 py-3 rounded-lg flex-row items-center justify-center gap-2">
                <Ionicons name="bookmark-outline" size={18} color="#3b82f6" />
                <Text className="text-blue-600 font-medium">Park Order</Text>
              </Pressable>
            </View>

            {/* Sale Order / Sale Return */}
            <View className="flex-row gap-4 mb-4">
              <Pressable 
                onPress={() => setIsSaleOrder(true)}
                className="flex-row items-center gap-2"
              >
                <View className={`w-5 h-5 rounded-full border-2 items-center justify-center ${isSaleOrder ? "border-blue-500" : "border-gray-300"}`}>
                  {isSaleOrder && <View className="w-2.5 h-2.5 rounded-full bg-blue-500" />}
                </View>
                <Text className="text-gray-700">Sale Order</Text>
              </Pressable>
              <Pressable 
                onPress={() => setIsSaleOrder(false)}
                className="flex-row items-center gap-2"
              >
                <View className={`w-5 h-5 rounded-full border-2 items-center justify-center ${!isSaleOrder ? "border-blue-500" : "border-gray-300"}`}>
                  {!isSaleOrder && <View className="w-2.5 h-2.5 rounded-full bg-blue-500" />}
                </View>
                <Text className="text-gray-700">Sale Return</Text>
              </Pressable>
            </View>

            {/* Dispatch Date */}
            <View className="mb-4">
              <Text className="text-gray-600 text-sm mb-1.5">Dispatch Date</Text>
              <View className="flex-row items-center bg-gray-50 border border-gray-200 rounded-lg px-3 py-3">
                <Text className="flex-1 text-gray-800">{dispatchDate}</Text>
                <Ionicons name="calendar-outline" size={16} color="#9ca3af" />
              </View>
            </View>

            {/* Sales Rep */}
            <View className="mb-4">
              <Text className="text-gray-600 text-sm mb-1.5">Please select the Sales Rep</Text>
              <Pressable className="flex-row items-center bg-gray-50 border border-gray-200 rounded-lg px-3 py-3">
                <Text className="flex-1 text-gray-400">Please Select</Text>
                <Ionicons name="chevron-down" size={16} color="#9ca3af" />
              </Pressable>
            </View>

            {/* Additional Discount */}
            <View className="mb-4">
              <Text className="text-gray-600 text-sm mb-1.5">Additional Discount</Text>
              <View className="flex-row gap-2">
                <TextInput
                  className="flex-1 bg-gray-50 border border-gray-200 rounded-lg px-3 py-3 text-gray-800"
                  keyboardType="numeric"
                  value={additionalDiscount}
                  onChangeText={setAdditionalDiscount}
                />
                <Pressable className="flex-row items-center bg-gray-50 border border-gray-200 rounded-lg px-3 py-3">
                  <Text className="text-gray-800">{discountType}</Text>
                  <Ionicons name="chevron-down" size={14} color="#9ca3af" />
                </Pressable>
              </View>
            </View>

            {/* Delivery Charges */}
            <View className="mb-4">
              <Text className="text-gray-600 text-sm mb-1.5">Delivery Charges</Text>
              <TextInput
                className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-3 text-gray-800"
                placeholder="Enter Amount"
                placeholderTextColor="#9ca3af"
                keyboardType="numeric"
                value={deliveryCharges}
                onChangeText={setDeliveryCharges}
              />
            </View>

            {/* Totals */}
            <View className="border-t border-gray-200 pt-4 gap-2">
              <View className="flex-row justify-between">
                <Text className="text-gray-600">Total Products</Text>
                <Text className="text-gray-800 font-medium">{totalProducts}</Text>
              </View>
              <View className="flex-row justify-between">
                <Text className="text-gray-600">Total Quantity</Text>
                <Text className="text-gray-800 font-medium">{totalQuantity}</Text>
              </View>
              <View className="flex-row justify-between">
                <Text className="text-gray-600">Sub Total</Text>
                <Text className="text-gray-800 font-medium">${subTotal.toFixed(2)}</Text>
              </View>
              <View className="flex-row justify-between">
                <Text className="text-gray-600">Additional Discount</Text>
                <Text className="text-red-500 font-medium">-${discount.toFixed(2)}</Text>
              </View>
              <View className="flex-row justify-between">
                <Text className="text-gray-600">Charges</Text>
                <Text className="text-gray-800 font-medium">${delivery.toFixed(2)}</Text>
              </View>
              <View className="flex-row justify-between pt-2 border-t border-gray-200 mt-2">
                <Text className="text-gray-800 font-bold text-lg">Grand Total</Text>
                <Text className="text-blue-600 font-bold text-lg">${grandTotal.toFixed(2)}</Text>
              </View>
            </View>

            {/* Preview Button */}
            <Pressable className="bg-gray-800 py-3 rounded-lg mt-4 flex-row items-center justify-center gap-2">
              <Ionicons name="eye-outline" size={18} color="white" />
              <Text className="text-white font-medium">Preview</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>

      {/* Search Product Modal */}
      <SearchProductModal
        visible={showSearchModal}
        onClose={() => setShowSearchModal(false)}
        onSelectProduct={handleAddProduct}
      />
    </View>
  );
}
