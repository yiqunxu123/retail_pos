import { colors, iconSize } from "@/utils/theme";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { useRenderTrace } from "../../utils/debug/useRenderTrace";
import type { QuickCustomerResult } from "../AddQuickCustomerModal";

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
          <Text style={{ color: colors.primary }} className="text-sm font-medium mb-1 text-center">
            Current Status:
          </Text>
          <Text style={{ color: colors.text }} className="font-bold text-xl mb-3 text-center">
            {customer.business_name}
          </Text>

          <View className="items-center mb-4">
            <View style={{ backgroundColor: colors.primaryLight }} className="border border-[#FECACA] rounded-full px-4 py-1.5 mb-2">
              <Text style={{ color: colors.primary }} className="text-sm font-semibold">
                Loyalty Member
              </Text>
            </View>
            <View className="bg-[#20232A] rounded-full px-4 py-1.5">
              <Text className="text-white text-sm">Loyalty Points: 760</Text>
            </View>
          </View>

          <View className="flex-row gap-2">
            <TouchableOpacity
              onPress={onOpenCustomerModal}
              className="flex-1 rounded-lg py-3 items-center shadow-sm"
              style={{ backgroundColor: colors.primary }}
            >
              <Text className="text-white text-sm font-semibold text-center">
                Change{"\n"}Customer
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={onRemoveCustomer}
              className="flex-1 bg-[#FEE2E2] rounded-lg py-3 items-center border border-[#FECACA]"
            >
              <Text style={{ color: colors.primary }} className="text-sm font-semibold text-center">
                Remove{"\n"}Customer
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <View className="items-center">
          <Text style={{ color: colors.primary }} className="text-base font-medium mb-1">
            Current Status:
          </Text>
          <Text style={{ color: colors.text }} className="font-bold text-2xl mb-6">
            Guest Customer
          </Text>
          <TouchableOpacity
            onPress={onOpenCustomerModal}
            className="w-full rounded-xl py-4 items-center justify-center shadow-md"
            style={{ backgroundColor: colors.primary }}
          >
            <View className="items-center">
              <Ionicons name="add" size={iconSize['2xl']} color="white" />
              <Text className="text-white font-bold text-lg mt-1">
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
