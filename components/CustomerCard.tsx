import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { AddQuickCustomerModal, type QuickCustomerResult } from "./AddQuickCustomerModal";

interface CustomerCardProps {
  customerName?: string;
  /** Pass a customer ID to enable edit mode in the modal */
  customerId?: number | null;
  onCustomerAdded?: (customer: QuickCustomerResult) => void;
}

/**
 * CustomerCard - Shows current customer status with add quick customer
 * Integrates AddQuickCustomerModal for easy customer creation
 */
export function CustomerCard({ customerName, customerId, onCustomerAdded }: CustomerCardProps) {
  const [showModal, setShowModal] = useState(false);
  const [currentCustomer, setCurrentCustomer] = useState(customerName || "Guest Customer");

  const handleSaveCustomer = (customer: QuickCustomerResult) => {
    setCurrentCustomer(customer.business_name);
    setShowModal(false);
    onCustomerAdded?.(customer);
  };

  return (
    <>
      <View className="bg-white rounded-lg p-4 w-48">
        {/* Current Status */}
        <View className="items-center mb-3">
          <Text className="text-red-500 text-xs font-medium">Current Status:</Text>
          <Text className="text-gray-800 text-lg font-bold mt-1">
            {currentCustomer}
          </Text>
        </View>

        {/* Add Customer Button */}
        <Pressable
          onPress={() => setShowModal(true)}
          className="bg-red-500 rounded-lg py-3 items-center"
          style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1 })}
        >
          <Ionicons name="add" size={24} color="white" />
          <Text className="text-white font-medium mt-1">Add Quick Customer</Text>
        </Pressable>
      </View>

      {/* Quick Customer Modal */}
      <AddQuickCustomerModal
        visible={showModal}
        onClose={() => setShowModal(false)}
        onSave={handleSaveCustomer}
        customerId={customerId}
      />
    </>
  );
}
