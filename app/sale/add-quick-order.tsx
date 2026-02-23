import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { iconSize, colors } from '@/utils/theme';
import { useCallback, useState } from "react";
import {
    Pressable,
    ScrollView,
    Switch,
    Text,
    TextInput,
    useWindowDimensions,
    View,
} from "react-native";
import { SearchProduct, SearchProductModal } from "../../components/SearchProductModal";
import { OrderCustomer, OrderProduct } from "../../types";

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
        productId: searchProduct.id,
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
      <Text className="text-[#5A5F66] text-[18px] mb-1.5" style={{ fontFamily: 'Montserrat' }}>{label}</Text>
      <Pressable className="flex-row items-center bg-white border border-gray-200 rounded-xl px-3 py-3 shadow-sm">
        <Text className="flex-1 text-gray-800 text-[18px]" style={{ fontFamily: 'Montserrat' }}>{value}</Text>
        <Ionicons name="chevron-down" size={iconSize.base} color={colors.textTertiary} />
      </Pressable>
    </View>
  );

  // Input component
  const FormInput = ({ label, value, onChangeText, placeholder, keyboardType = "default" }: any) => (
    <View className="mb-4">
      <Text className="text-[#5A5F66] text-[18px] mb-1.5" style={{ fontFamily: 'Montserrat' }}>{label}</Text>
      <TextInput
        className="bg-white border border-gray-200 rounded-xl px-3 py-3 text-gray-800 text-[18px] shadow-sm"
        style={{ fontFamily: 'Montserrat' }}
        placeholder={placeholder}
        placeholderTextColor={colors.textTertiary}
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType}
      />
    </View>
  );

  return (
    <View className="flex-1" style={{ backgroundColor: colors.backgroundTertiary }}>
      {/* Header */}
      <View className="px-5 py-4 border-b border-gray-200 flex-row items-center justify-between" style={{ backgroundColor: colors.backgroundTertiary }}>
        <View className="flex-row items-center gap-4">
          <Pressable onPress={() => router.push("/")} className="p-2">
            <Ionicons name="menu" size={iconSize.xl} color={colors.textMedium} />
          </Pressable>
          <Text className="text-xl font-bold text-gray-800">Add Quick Order</Text>
        </View>
        <View className="flex-row gap-2">
          <Pressable className="bg-blue-500 px-4 py-2.5 rounded-lg flex-row items-center gap-2">
            <Ionicons name="save-outline" size={iconSize.md} color="white" />
            <Text className="text-white font-medium">Save Order</Text>
          </Pressable>
        </View>
      </View>

      <ScrollView className="flex-1" contentContainerClassName="p-5">
        <View className={`${isWideScreen ? "flex-row gap-4" : "gap-4"}`}>
          
          {/* LEFT PANEL - Customer Selection */}
          <View className={`bg-white border border-gray-200 rounded-xl p-5 shadow-sm ${isWideScreen ? "w-80" : ""}`}>
            <Text className="text-lg font-bold text-gray-800 mb-4">Customer</Text>
            
            {/* Search Inputs */}
            <View className="mb-4">
              <View className="flex-row items-center bg-white border border-blue-200 rounded-lg px-3 py-3 mb-2 shadow-sm">
                <Ionicons name="person-outline" size={iconSize.md} color={colors.primary} />
                <TextInput
                  className="flex-1 ml-2 text-gray-800"
                  placeholder="Search by Customer Name/Business"
                  placeholderTextColor={colors.textTertiary}
                  value={customerSearch}
                  onChangeText={setCustomerSearch}
                />
              </View>
              <View className="flex-row items-center bg-white border border-gray-200 rounded-lg px-3 py-3 mb-2 shadow-sm">
                <Ionicons name="key-outline" size={iconSize.md} color={colors.textSecondary} />
                <TextInput
                  className="flex-1 ml-2 text-gray-800"
                  placeholder="Search by Customer ID/Number"
                  placeholderTextColor={colors.textTertiary}
                />
              </View>
              <View className="flex-row items-center bg-white border border-gray-200 rounded-lg px-3 py-3 shadow-sm">
                <Ionicons name="mail-outline" size={iconSize.md} color={colors.textSecondary} />
                <TextInput
                  className="flex-1 ml-2 text-gray-800"
                  placeholder="Search by Customer Email/Address"
                  placeholderTextColor={colors.textTertiary}
                />
              </View>
            </View>

            {/* Selected Customer Card */}
            <View className="bg-white border border-gray-100 rounded-lg p-4 mb-4 shadow-sm">
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
              <Text className="text-[#5A5F66] text-[18px]" style={{ fontFamily: 'Montserrat' }}>Skip MSA Eligibility Check</Text>
              <Switch
                value={skipMSA}
                onValueChange={setSkipMSA}
                trackColor={{ false: colors.borderMedium, true: colors.info }}
                thumbColor="white"
              />
            </View>

            {/* Notes Section */}
            <View>
              <Text className="text-blue-500 font-medium mb-2 text-[18px]" style={{ fontFamily: 'Montserrat' }}>Notes</Text>
              <Text className="text-[#5A5F66] text-[18px] mb-1.5" style={{ fontFamily: 'Montserrat' }}>Notes (Internal)</Text>
              <TextInput
                className="bg-white border border-gray-200 rounded-xl px-3 py-3 text-gray-800 text-[18px] h-24 shadow-sm"
                style={{ fontFamily: 'Montserrat' }}
                placeholder="Enter notes..."
                placeholderTextColor={colors.textTertiary}
                value={notes}
                onChangeText={setNotes}
                multiline
                textAlignVertical="top"
              />
              <Text className="text-gray-400 text-[14px] mt-1" style={{ fontFamily: 'Montserrat' }}>{500 - notes.length} Character(s) out of 500 remaining</Text>
            </View>
          </View>

          {/* MIDDLE PANEL - Products */}
            <View className={`bg-white border border-gray-200 rounded-xl p-4 shadow-sm ${isWideScreen ? "flex-1" : ""}`}>
            <Text className="text-lg font-bold text-gray-800 mb-4">Products</Text>
            
            {/* Store Channel & Search */}
            <View className="flex-row items-end gap-3 mb-4">
              <View className="flex-1">
                <Text className="text-[#5A5F66] text-[18px] mb-1.5" style={{ fontFamily: 'Montserrat' }}>Please select the Store Channel*</Text>
                <Pressable className="flex-row items-center bg-white border border-gray-200 rounded-xl px-3 py-3 shadow-sm">
                  <Text className="flex-1 text-gray-800 text-[18px]" style={{ fontFamily: 'Montserrat' }}>{storeChannel}</Text>
                  <Ionicons name="chevron-down" size={iconSize.base} color={colors.textTertiary} />
                </Pressable>
              </View>
              <Pressable className="bg-blue-500 px-4 py-3 rounded-lg">
                <Text className="text-white font-medium">Bulk Add & Edit</Text>
              </Pressable>
            </View>

            {/* Product Search Bar */}
            <View className="flex-row items-end gap-3 mb-4">
              <View className="flex-1">
                <Text className="text-[#5A5F66] text-[18px] mb-1.5" style={{ fontFamily: 'Montserrat' }}>Add product by Name, SKU, UPC</Text>
                <Pressable 
                  onPress={() => setShowSearchModal(true)}
                  className="flex-row items-center bg-white border border-gray-200 rounded-lg px-3 py-3 shadow-sm"
                >
                  <Ionicons name="search" size={iconSize.base} color={colors.textTertiary} />
                  <Text className="flex-1 ml-2 text-gray-400 text-[18px]" style={{ fontFamily: 'Montserrat' }}>Search Products</Text>
                </Pressable>
              </View>
              <View>
                <Text className="text-[#5A5F66] text-[18px] mb-1.5 text-center" style={{ fontFamily: 'Montserrat' }}>Scan Qty</Text>
                <TextInput
                  className="w-20 bg-white border border-gray-200 rounded-lg px-3 py-3 text-center text-gray-800 text-[18px] shadow-sm"
                  style={{ fontFamily: 'Montserrat' }}
                  keyboardType="numeric"
                  value={scanQty}
                  onChangeText={setScanQty}
                />
              </View>
              <Pressable className="bg-red-500 px-4 py-3 rounded-lg flex-row items-center gap-2">
                <Ionicons name="scan" size={iconSize.md} color="white" />
                <Text className="text-white font-medium">Scan Logs</Text>
              </Pressable>
              <Pressable className="bg-gray-100 p-3 rounded-lg">
                <Ionicons name="settings-outline" size={iconSize.base} color={colors.textMedium} />
              </Pressable>
            </View>

            {/* Products Table */}
            <View className="border border-gray-200 rounded-lg overflow-hidden">
              {/* Table Header */}
              <View className="flex-row bg-gray-50 px-4 py-3 border-b border-gray-200" style={{ backgroundColor: colors.backgroundTertiary }}>
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
                  <Ionicons name="cart-outline" size={iconSize['5xl']} color={colors.borderMedium} />
                  <Text className="text-gray-400 text-lg mt-4">Nothing in cart!</Text>
                  <Pressable 
                    onPress={() => setShowSearchModal(true)}
                    className="mt-4 px-6 py-3 rounded-lg"
                    style={{ backgroundColor: colors.info }}
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
                          <Ionicons name="remove" size={iconSize.sm} color="white" />
                        </Pressable>
                        <Text className="w-8 text-center text-gray-800 font-medium">{product.quantity}</Text>
                        <Pressable
                          onPress={() => handleQuantityChange(product.id, 1)}
                          className="w-7 h-7 bg-green-500 rounded items-center justify-center"
                        >
                          <Ionicons name="add" size={iconSize.sm} color="white" />
                        </Pressable>
                      </View>
                      <Text className="w-20 text-gray-800 text-sm text-center font-medium">${product.total.toFixed(2)}</Text>
                      <View className="w-16 items-center">
                        <Pressable
                          onPress={() => removeProduct(product.id)}
                          className="p-2 bg-red-100 rounded-lg"
                        >
                          <Ionicons name="trash-outline" size={iconSize.sm} color={colors.error} />
                        </Pressable>
                      </View>
                    </View>
                  ))}
                </ScrollView>
              )}
            </View>
          </View>

          {/* RIGHT PANEL - Order Summary */}
            <View className={`bg-white border border-gray-200 rounded-xl p-4 shadow-sm ${isWideScreen ? "w-72" : ""}`}>
            <Text className="text-lg font-bold text-gray-800 mb-4">Order Summary</Text>

            {/* Order Type & Date */}
            <View className="flex-row gap-3 mb-4">
              <View className="flex-1">
                <Text className="text-[#5A5F66] text-[18px] mb-1.5" style={{ fontFamily: 'Montserrat' }}>Order Type</Text>
                <Pressable className="flex-row items-center bg-white border border-gray-200 rounded-xl px-3 py-3 shadow-sm">
                  <Text className="flex-1 text-gray-800 text-[18px]" style={{ fontFamily: 'Montserrat' }}>{orderType}</Text>
                  <Ionicons name="chevron-down" size={iconSize.base} color={colors.textTertiary} />
                </Pressable>
              </View>
              <View className="flex-1">
                <Text className="text-[#5A5F66] text-[18px] mb-1.5" style={{ fontFamily: 'Montserrat' }}>Order Date</Text>
                <View className="flex-row items-center bg-white border border-gray-200 rounded-xl px-3 py-3 shadow-sm">
                  <Text className="flex-1 text-gray-800 text-[18px]" style={{ fontFamily: 'Montserrat' }}>{orderDate}</Text>
                  <Ionicons name="calendar-outline" size={iconSize.base} color={colors.textTertiary} />
                </View>
              </View>
            </View>

            {/* Action Buttons */}
            <View className="gap-2 mb-4">
              <Pressable 
                onPress={emptyCart}
                className="bg-red-50 py-3 rounded-lg flex-row items-center justify-center gap-2"
              >
                <Ionicons name="trash-outline" size={iconSize.md} color={colors.primary} />
                <Text style={{ color: colors.primary }} className="font-medium">Empty Cart</Text>
              </Pressable>
              <Pressable className="bg-red-50 py-3 rounded-lg flex-row items-center justify-center gap-2">
                <Ionicons name="bookmark-outline" size={iconSize.md} color={colors.primary} />
                <Text style={{ color: colors.primary }} className="font-medium">Park Order</Text>
              </Pressable>
            </View>

            {/* Sale Order / Sale Return */}
            <View className="flex-row gap-4 mb-4">
              <Pressable 
                onPress={() => setIsSaleOrder(true)}
                className="flex-row items-center gap-2"
              >
                <View className={`w-5 h-5 rounded-full border-2 items-center justify-center ${isSaleOrder ? "border-primary" : "border-gray-300"}`} style={isSaleOrder ? { borderColor: colors.primary } : undefined}>
                  {isSaleOrder && <View className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: colors.primary }} />}
                </View>
                <Text className="text-gray-700">Sale Order</Text>
              </Pressable>
              <Pressable 
                onPress={() => setIsSaleOrder(false)}
                className="flex-row items-center gap-2"
              >
                <View className={`w-5 h-5 rounded-full border-2 items-center justify-center ${!isSaleOrder ? "border-primary" : "border-gray-300"}`} style={!isSaleOrder ? { borderColor: colors.primary } : undefined}>
                  {!isSaleOrder && <View className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: colors.primary }} />}
                </View>
                <Text className="text-gray-700">Sale Return</Text>
              </Pressable>
            </View>

            {/* Dispatch Date */}
            <View className="mb-4">
              <Text className="text-[#5A5F66] text-[18px] mb-1.5" style={{ fontFamily: 'Montserrat' }}>Dispatch Date</Text>
              <View className="flex-row items-center bg-white border border-gray-200 rounded-xl px-3 py-3 shadow-sm">
                <Text className="flex-1 text-gray-800 text-[18px]" style={{ fontFamily: 'Montserrat' }}>{dispatchDate}</Text>
                <Ionicons name="calendar-outline" size={iconSize.base} color={colors.textTertiary} />
              </View>
            </View>

            {/* Sales Rep */}
            <View className="mb-4">
              <Text className="text-[#5A5F66] text-[18px] mb-1.5" style={{ fontFamily: 'Montserrat' }}>Please select the Sales Rep</Text>
              <Pressable className="flex-row items-center bg-white border border-gray-200 rounded-xl px-3 py-3 shadow-sm">
                <Text className="flex-1 text-gray-400 text-[18px]" style={{ fontFamily: 'Montserrat' }}>Please Select</Text>
                <Ionicons name="chevron-down" size={iconSize.base} color={colors.textTertiary} />
              </Pressable>
            </View>

            {/* Additional Discount */}
            <View className="mb-4">
              <Text className="text-[#5A5F66] text-[18px] mb-1.5" style={{ fontFamily: 'Montserrat' }}>Additional Discount</Text>
              <View className="flex-row gap-2">
                <TextInput
                  className="flex-1 bg-white border border-gray-200 rounded-xl px-3 py-3 text-gray-800 text-[18px] shadow-sm"
                  style={{ fontFamily: 'Montserrat' }}
                  keyboardType="numeric"
                  value={additionalDiscount}
                  onChangeText={setAdditionalDiscount}
                />
                <Pressable className="flex-row items-center bg-white border border-gray-200 rounded-xl px-3 py-3 shadow-sm">
                  <Text className="text-gray-800 text-[18px]" style={{ fontFamily: 'Montserrat' }}>{discountType}</Text>
                  <Ionicons name="chevron-down" size={iconSize.base} color={colors.textTertiary} />
                </Pressable>
              </View>
            </View>

            {/* Delivery Charges */}
            <View className="mb-4">
              <Text className="text-[#5A5F66] text-[18px] mb-1.5" style={{ fontFamily: 'Montserrat' }}>Delivery Charges</Text>
              <TextInput
                className="bg-white border border-gray-200 rounded-xl px-3 py-3 text-gray-800 text-[18px] shadow-sm"
                style={{ fontFamily: 'Montserrat' }}
                placeholder="Enter Amount"
                placeholderTextColor={colors.textTertiary}
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
                <Text style={{ color: colors.primary }} className="font-medium">-${discount.toFixed(2)}</Text>
              </View>
              <View className="flex-row justify-between">
                <Text className="text-gray-600">Charges</Text>
                <Text className="text-gray-800 font-medium">${delivery.toFixed(2)}</Text>
              </View>
              <View className="flex-row justify-between pt-2 border-t border-gray-200 mt-2">
                <Text className="text-gray-800 font-bold text-lg">Grand Total</Text>
                <Text style={{ color: colors.primary }} className="font-bold text-lg">${grandTotal.toFixed(2)}</Text>
              </View>
            </View>

            {/* Preview Button */}
            <Pressable className="bg-gray-800 py-3 rounded-lg mt-4 flex-row items-center justify-center gap-2">
              <Ionicons name="eye-outline" size={iconSize.md} color="white" />
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
