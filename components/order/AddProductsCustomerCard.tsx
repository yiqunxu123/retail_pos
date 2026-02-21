import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Text, TouchableOpacity, View } from "react-native";
import type { QuickCustomerResult } from "../AddQuickCustomerModal";
import { useRenderTrace } from "../../utils/debug/useRenderTrace";

interface AddProductsCustomerCardProps {
  customer: QuickCustomerResult | null;
  onOpenCustomerModal: () => void;
  onRemoveCustomer: () => void;
}

function AddProductsCustomerCardComponent({
  customer,
  onOpenCustomerModal,
  onRemoveCustomer,
}: AddProductsCustomerCardProps) {
  useRenderTrace(
    "AddProductsCustomerCard",
    {
      customerId: customer?.id ?? null,
      customerName: customer?.business_name ?? null,
      onOpenCustomerModal,
      onRemoveCustomer,
    },
    { throttleMs: 100 }
  );

  return (
    <View
      className="bg-[#FFC0D1] border border-[#FFB5C5] rounded-xl p-4 shadow-sm"
      style={{ width: 280, justifyContent: "center" }}
    >
      {customer ? (
        <View>
          <Text className="text-[#EC1A52] text-[14px] font-Montserrat font-medium mb-1 text-center">
            Current Status:
          </Text>
          <Text className="text-[#1A1A1A] font-Montserrat font-bold text-[22px] mb-3 text-center">
            {customer.business_name}
          </Text>

          <View className="items-center mb-4">
            <View className="bg-[#FFF0F3] border border-[#FECACA] rounded-full px-4 py-1.5 mb-2">
              <Text className="text-[#EC1A52] text-[12px] font-Montserrat font-semibold">
                Loyalty Member
              </Text>
            </View>
            <View className="bg-[#20232A] rounded-full px-4 py-1.5">
              <Text className="text-white text-[12px] font-Montserrat">Loyalty Points: 760</Text>
            </View>
          </View>

          <View className="flex-row gap-2">
            <TouchableOpacity
              onPress={onOpenCustomerModal}
              className="flex-1 bg-[#EC1A52] rounded-lg py-3 items-center shadow-sm"
            >
              <Text className="text-white text-[13px] font-Montserrat font-semibold text-center">
                Change{"\n"}Customer
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={onRemoveCustomer}
              className="flex-1 bg-[#FEE2E2] rounded-lg py-3 items-center border border-[#FECACA]"
            >
              <Text className="text-[#EC1A52] text-[13px] font-Montserrat font-semibold text-center">
                Remove{"\n"}Customer
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <View className="items-center">
          <Text className="text-[#EC1A52] text-[16px] font-Montserrat font-medium mb-1">
            Current Status:
          </Text>
          <Text className="text-[#1A1A1A] font-Montserrat font-bold text-[24px] mb-6">
            Guest Customer
          </Text>
          <TouchableOpacity
            onPress={onOpenCustomerModal}
            className="w-full bg-[#EC1A52] rounded-xl py-4 items-center justify-center shadow-md"
          >
            <View className="items-center">
              <Ionicons name="add" size={32} color="white" />
              <Text className="text-white font-Montserrat font-bold text-[18px] mt-1">
                Add Quick Customer
              </Text>
            </View>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

export const AddProductsCustomerCard = React.memo(AddProductsCustomerCardComponent);
AddProductsCustomerCard.displayName = "AddProductsCustomerCard";
