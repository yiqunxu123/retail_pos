import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Alert, ScrollView, View, Text, Pressable, TextInput } from "react-native";
import { useOrder } from "../../contexts/OrderContext";
import { StepNavigation } from "../../components/StepNavigation";
import { FormInput } from "../../components/FormInput";

/**
 * CheckoutScreen - Step 3: Review and confirm order
 */
export default function CheckoutScreen() {
  const router = useRouter();
  const { order, updateOrder, getOrderSummary, clearOrder } = useOrder();
  const summary = getOrderSummary();

  const handleConfirm = () => {
    Alert.alert(
      "Order Confirmed",
      "Your order has been successfully placed!",
      [
        {
          text: "OK",
          onPress: () => {
            clearOrder();
            router.replace("/");
          },
        },
      ]
    );
  };

  return (
    <View className="flex-1">
      <ScrollView className="flex-1" contentContainerClassName="p-5">
        <View className="flex-row gap-4">
          {/* Left Column - Order Details */}
          <View className="flex-1 bg-white rounded-lg p-5">
            <View className="flex-row gap-4">
              {/* Order Type */}
              <View className="flex-1">
                <FormInput
                  label="Order Type"
                  value="Walk In"
                  isDropdown
                  onDropdownPress={() => {}}
                />
              </View>
              {/* Order Date */}
              <View className="flex-1">
                <FormInput
                  label="Order Date"
                  value={order.orderDate}
                  isDatePicker
                  onDropdownPress={() => {}}
                />
              </View>
            </View>

            <View className="flex-row gap-4">
              {/* Dispatch Date */}
              <View className="flex-1">
                <FormInput
                  label="Dispatch Date"
                  value={order.dispatchDate}
                  isDatePicker
                  onDropdownPress={() => {}}
                />
              </View>
              {/* Sales Rep */}
              <View className="flex-1">
                <FormInput
                  label="Please Select the Sales Rep"
                  value={order.salesRep}
                  isDropdown
                  placeholder="Please Select"
                  onDropdownPress={() => {}}
                />
              </View>
            </View>

            <View className="flex-row gap-4">
              {/* Additional Discount */}
              <View className="flex-1">
                <Text className="text-gray-600 text-sm mb-1.5">Additional Discount</Text>
                <View className="flex-row items-center gap-2">
                  <View className="flex-row items-center bg-white border border-gray-200 rounded-lg overflow-hidden">
                    <Pressable className="bg-red-500 px-3 py-2.5">
                      <Text className="text-white font-medium">$</Text>
                    </Pressable>
                    <TextInput
                      className="flex-1 px-3 py-2.5 text-gray-800"
                      keyboardType="numeric"
                      value={order.additionalDiscount.toString()}
                      onChangeText={(v) => updateOrder({ additionalDiscount: parseFloat(v) || 0 })}
                    />
                  </View>
                </View>
              </View>
              {/* Shipping Charges */}
              <View className="flex-1">
                <Text className="text-gray-600 text-sm mb-1.5">Shipping Charges</Text>
                <View className="flex-row items-center gap-2">
                  <View className="flex-row items-center bg-white border border-gray-200 rounded-lg overflow-hidden">
                    <Pressable className="bg-red-500 px-3 py-2.5">
                      <Text className="text-white font-medium">$</Text>
                    </Pressable>
                    <TextInput
                      className="flex-1 px-3 py-2.5 text-gray-800"
                      keyboardType="numeric"
                      value={order.shippingCharges.toString()}
                      onChangeText={(v) => updateOrder({ shippingCharges: parseFloat(v) || 0 })}
                    />
                  </View>
                </View>
              </View>
            </View>
          </View>

          {/* Right Column - Order Summary */}
          <View className="w-80 bg-white rounded-lg p-4">
            <SummaryRow label="Total Products" value={summary.totalProducts.toString().padStart(2, "0")} />
            <SummaryRow label="Total Quantity" value={summary.totalQuantity.toString()} />
            <SummaryRow label="Sub Total" value={`$${summary.subTotal.toFixed(2)}`} highlight />
            <SummaryRow label="Additional Discount" value={`$${order.additionalDiscount.toFixed(2)}`} />
            <SummaryRow label="Delivery Charges" value={`$${order.shippingCharges.toFixed(2)}`} />
            <SummaryRow label="Tax ⓘ" value={`$${summary.tax.toFixed(2)}`} />

            {/* Total */}
            <View className="flex-row justify-between items-center mt-4 pt-4 border-t border-gray-200">
              <Text className="text-red-500 text-lg font-bold">Total</Text>
              <Text className="text-red-500 text-2xl font-bold">${summary.total.toFixed(2)}</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Bottom Navigation with Confirm */}
      <StepNavigation showConfirm onConfirm={handleConfirm} />
    </View>
  );
}

// Helper component
function SummaryRow({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <View className="flex-row justify-between py-2">
      <Text className="text-gray-600">{label}</Text>
      <Text className={`font-medium ${highlight ? "text-gray-800" : "text-gray-800"}`}>
        {value}
      </Text>
    </View>
  );
}
