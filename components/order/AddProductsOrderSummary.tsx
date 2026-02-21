import React from "react";
import { Text, View } from "react-native";
import { useRenderTrace } from "../../utils/debug/useRenderTrace";

interface AddProductsOrderSummaryProps {
  productsCount: number;
  totalQuantity: number;
  subTotal: number;
  tax: number;
  total: number;
  additionalDiscount: number;
  discountType: 1 | 2;
}

function AddProductsOrderSummaryComponent({
  productsCount,
  totalQuantity,
  subTotal,
  tax,
  total,
  additionalDiscount,
  discountType,
}: AddProductsOrderSummaryProps) {
  useRenderTrace(
    "AddProductsOrderSummary",
    {
      productsCount,
      totalQuantity,
      subTotal,
      tax,
      total,
      additionalDiscount,
      discountType,
    },
    { throttleMs: 100 }
  );

  return (
    <View className="flex-1 bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
      <View className="flex-row">
        <View className="flex-1 border-r border-gray-100">
          <View className="flex-row justify-between px-5 py-4 border-b border-gray-100">
            <Text className="text-[#5A5F66] text-[16px] font-Montserrat font-medium">
              Total Products
            </Text>
            <Text className="text-[#1A1A1A] text-[18px] font-Montserrat font-bold">{productsCount}</Text>
          </View>
          <View className="flex-row justify-between px-5 py-4 border-b border-gray-100">
            <Text className="text-[#5A5F66] text-[16px] font-Montserrat font-medium">
              Total Quantity
            </Text>
            <Text className="text-[#1A1A1A] text-[18px] font-Montserrat font-bold">{totalQuantity}</Text>
          </View>
          <View className="flex-row justify-between px-5 py-4 border-b border-gray-100">
            <Text className="text-[#5A5F66] text-[16px] font-Montserrat font-medium">Sub Total</Text>
            <Text className="text-[#1A1A1A] text-[18px] font-Montserrat font-bold">
              ${subTotal.toFixed(2)}
            </Text>
          </View>
          <View className="flex-row justify-between px-5 py-4">
            <Text className="text-[#5A5F66] text-[16px] font-Montserrat font-medium">
              Loyalty Credit
            </Text>
            <Text className="text-[#1A1A1A] text-[18px] font-Montserrat font-bold">-$10.00</Text>
          </View>
        </View>

        <View className="flex-1">
          <View className="flex-row justify-between px-5 py-4 border-b border-gray-100">
            <Text className="text-[#5A5F66] text-[16px] font-Montserrat font-medium">
              Additional Discount
            </Text>
            <Text className="text-[#1A1A1A] text-[18px] font-Montserrat font-bold">
              {discountType === 2 ? `${additionalDiscount}%` : `$${additionalDiscount.toFixed(2)}`}
            </Text>
          </View>
          <View className="flex-row justify-between px-5 py-4 border-b border-gray-100">
            <Text className="text-[#5A5F66] text-[16px] font-Montserrat font-medium">
              Delivery Charges
            </Text>
            <Text className="text-[#1A1A1A] text-[18px] font-Montserrat font-bold">$0.00</Text>
          </View>
          <View className="flex-row justify-between px-5 py-4 border-b border-gray-100">
            <Text className="text-[#5A5F66] text-[16px] font-Montserrat font-medium">Tax</Text>
            <Text className="text-[#1A1A1A] text-[18px] font-Montserrat font-bold">
              ${tax.toFixed(2)}
            </Text>
          </View>
          <View className="flex-row justify-between px-5 py-4">
            <Text className="text-[#5A5F66] text-[16px] font-Montserrat font-medium">
              Loyalty Earned
            </Text>
            <Text className="text-[#1A1A1A] text-[18px] font-Montserrat font-bold">120</Text>
          </View>
        </View>
      </View>

      <View className="flex-row justify-between items-center bg-[#FFF0F3] border-t border-[#FEE2E2] px-6 py-4">
        <Text className="text-[#EC1A52] text-[24px] font-Montserrat font-bold">Total</Text>
        <Text className="text-[#EC1A52] text-[32px] font-Montserrat font-bold">${total.toFixed(2)}</Text>
      </View>
    </View>
  );
}

export const AddProductsOrderSummary = React.memo(AddProductsOrderSummaryComponent);
AddProductsOrderSummary.displayName = "AddProductsOrderSummary";
