import { View, Text } from "react-native";

interface OrderSummaryProps {
  totalProducts: number;
  totalQuantity: number;
  subTotal: number;
  additionalDiscount: number;
  deliveryCharges: number;
  tax: number;
  total: number;
}

/**
 * OrderSummary - Displays order totals and charges
 * Shows itemized breakdown of the current order
 */
export function OrderSummary({
  totalProducts,
  totalQuantity,
  subTotal,
  additionalDiscount,
  deliveryCharges,
  tax,
  total,
}: OrderSummaryProps) {
  return (
    <View className="bg-[#F7F7F9] rounded-lg p-4 flex-1">
      {/* Left Column */}
      <View className="flex-row">
        <View className="flex-1">
          <SummaryRow label="Total Products" value={totalProducts.toString().padStart(2, "0")} />
          <SummaryRow label="Total Quantity" value={totalQuantity.toString().padStart(2, "0")} />
          <SummaryRow label="Sub Total" value={`$${subTotal.toFixed(2)}`} />
        </View>

        {/* Right Column */}
        <View className="flex-1">
          <SummaryRow label="Additional Discount" value={`$${additionalDiscount.toFixed(2)}`} isRight />
          <SummaryRow label="Delivery Charges" value={`$${deliveryCharges.toFixed(2)}`} isRight />
          <SummaryRow label="Tax" value={`$${tax.toFixed(2)}`} isRight />
        </View>
      </View>

      {/* Total Row */}
      <View className="flex-row justify-between items-center mt-3 pt-3 border-t border-gray-200">
        <Text className="text-red-500 text-lg font-bold">Total</Text>
        <Text className="text-red-500 text-xl font-bold">${total.toFixed(2)}</Text>
      </View>
    </View>
  );
}

// Helper component for summary rows
function SummaryRow({
  label,
  value,
  isRight = false,
}: {
  label: string;
  value: string;
  isRight?: boolean;
}) {
  return (
    <View className={`flex-row justify-between py-1.5 ${isRight ? "pl-4" : "pr-4"}`}>
      <Text className="text-gray-600 text-sm">{label}</Text>
      <Text className="text-gray-800 text-sm font-medium">{value}</Text>
    </View>
  );
}
