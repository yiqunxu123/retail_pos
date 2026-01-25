import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { ScrollView, View, Text, Pressable, TextInput, Switch } from "react-native";
import { useOrder } from "../../contexts/OrderContext";
import { StepNavigation } from "../../components/StepNavigation";
import { Dropdown } from "../../components/Dropdown";
import { AddQuickCustomerModal } from "../../components/AddQuickCustomerModal";

// Dropdown options
const PAYMENT_TERMS_OPTIONS = [
  { value: "due_immediately", label: "Due Immediately" },
  { value: "net_15", label: "Net 15" },
  { value: "net_30", label: "Net 30" },
  { value: "net_45", label: "Net 45" },
  { value: "net_60", label: "Net 60" },
];

const SHIPPING_TYPE_OPTIONS = [
  { value: "pickup", label: "Pick up" },
  { value: "delivery", label: "Delivery" },
  { value: "shipping", label: "Shipping" },
];

/**
 * AddCustomerScreen - Step 1: Customer information
 */
export default function AddCustomerScreen() {
  const { order, updateOrder } = useOrder();
  const [showQuickCustomerModal, setShowQuickCustomerModal] = useState(false);
  const [autoGenerate, setAutoGenerate] = useState(true);
  const [skipMsaCheck, setSkipMsaCheck] = useState(false);
  const [paymentTerms, setPaymentTerms] = useState("due_immediately");
  const [shippingType, setShippingType] = useState("pickup");

  const handleSaveQuickCustomer = (customer: {
    businessName: string;
    email: string;
    phone: string;
    classOfTrades: string;
    customerType: string;
    salesRep: string;
  }) => {
    updateOrder({
      customerName: customer.businessName,
      customerId: `QC-${Date.now()}`,
    });
    setShowQuickCustomerModal(false);
  };

  return (
    <View className="flex-1">
      <ScrollView className="flex-1" contentContainerClassName="p-4">
        <View className="bg-white rounded-lg border border-red-200 overflow-hidden">
          <View className="flex-row">
            {/* Left Column - Customer Search & Form */}
            <View className="flex-1 p-4 border-r border-gray-100">
              {/* Search by Name */}
              <View className="flex-row items-center bg-gray-50 border border-gray-200 rounded-lg px-3 py-3 mb-3">
                <Ionicons name="person-outline" size={20} color="#9ca3af" />
                <TextInput
                  className="flex-1 ml-3 text-gray-800"
                  placeholder="Search by Customer Name/ Business Name"
                  placeholderTextColor="#9ca3af"
                />
              </View>

              {/* Search by ID */}
              <View className="flex-row items-center bg-gray-50 border border-gray-200 rounded-lg px-3 py-3 mb-3">
                <Ionicons name="id-card-outline" size={20} color="#9ca3af" />
                <TextInput
                  className="flex-1 ml-3 text-gray-800"
                  placeholder="Search by Customer Number ID/ Number"
                  placeholderTextColor="#9ca3af"
                />
              </View>

              {/* Search by Email */}
              <View className="flex-row items-center bg-gray-50 border border-gray-200 rounded-lg px-3 py-3 mb-4">
                <Ionicons name="mail-outline" size={20} color="#9ca3af" />
                <TextInput
                  className="flex-1 ml-3 text-gray-800"
                  placeholder="Search by Customer Email Address"
                  placeholderTextColor="#9ca3af"
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>

              {/* Payment Terms & Invoice Due Date */}
              <View className="flex-row gap-4 mb-4">
                <View className="flex-1">
                  <Dropdown
                    label="Payment Terms:"
                    options={PAYMENT_TERMS_OPTIONS}
                    value={paymentTerms}
                    onChange={setPaymentTerms}
                  />
                </View>
                <View className="flex-1">
                  <Text className="text-gray-600 text-sm mb-1.5">Invoice Due Date</Text>
                  <Pressable className="flex-row items-center justify-between bg-white border border-gray-200 rounded-lg px-3 py-2.5">
                    <Text className="text-gray-400">{order.invoiceDueDate}</Text>
                    <Ionicons name="calendar-outline" size={18} color="#9ca3af" />
                  </Pressable>
                </View>
              </View>

              {/* Order Number */}
              <View className="mb-4">
                <Text className="text-gray-600 text-sm mb-1.5">Order Number:</Text>
                <TextInput
                  className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2.5 text-gray-800 mb-2"
                  placeholder="Enter Order Number"
                  placeholderTextColor="#9ca3af"
                  value={order.orderNumber}
                  onChangeText={(v) => updateOrder({ orderNumber: v })}
                  editable={!autoGenerate}
                />
                <Pressable
                  className="flex-row items-center gap-2"
                  onPress={() => setAutoGenerate(!autoGenerate)}
                >
                  <View
                    className={`w-5 h-5 rounded border-2 items-center justify-center ${
                      autoGenerate ? "border-red-500 bg-red-500" : "border-gray-300"
                    }`}
                  >
                    {autoGenerate && (
                      <Ionicons name="checkmark" size={14} color="white" />
                    )}
                  </View>
                  <Text className="text-gray-700">Auto Generate</Text>
                </Pressable>
              </View>

              {/* Shipping Type */}
              <View className="mb-4">
                <Dropdown
                  label="Shipping Type"
                  options={SHIPPING_TYPE_OPTIONS}
                  value={shippingType}
                  onChange={setShippingType}
                />
              </View>

              {/* Skip MSA Eligibility check */}
              <View className="flex-row items-center gap-3 mb-4">
                <Text className="text-gray-600 text-sm">Skip MSA Eligibility check</Text>
                <Switch
                  value={skipMsaCheck}
                  onValueChange={setSkipMsaCheck}
                  trackColor={{ false: "#d1d5db", true: "#fca5a5" }}
                  thumbColor={skipMsaCheck ? "#ef4444" : "#f4f4f5"}
                />
              </View>

              {/* Notes */}
              <View className="flex-row gap-4">
                <View className="flex-1">
                  <Text className="text-gray-600 text-sm mb-1.5">Notes (Internal)</Text>
                  <TextInput
                    className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2.5 text-gray-800 min-h-[80px]"
                    placeholder="Notes"
                    placeholderTextColor="#9ca3af"
                    value={order.notesInternal}
                    onChangeText={(v) => updateOrder({ notesInternal: v })}
                    multiline
                    textAlignVertical="top"
                  />
                </View>
                <View className="flex-1">
                  <Text className="text-gray-600 text-sm mb-1.5">Notes (Print on Invoice)</Text>
                  <TextInput
                    className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2.5 text-gray-800 min-h-[80px]"
                    placeholder="Notes"
                    placeholderTextColor="#9ca3af"
                    value={order.notesInvoice}
                    onChangeText={(v) => updateOrder({ notesInvoice: v })}
                    multiline
                    textAlignVertical="top"
                  />
                </View>
              </View>
            </View>

            {/* Right Column - Selected Customer */}
            <View className="w-72 p-4 bg-gray-50">
              <Text className="text-gray-500 text-sm text-center mb-1">Current Status:</Text>
              <Text className="text-gray-800 text-xl font-bold text-center mb-4">
                {order.customerName}
              </Text>

              {/* Add Quick Customer Button */}
              <Pressable
                onPress={() => setShowQuickCustomerModal(true)}
                className="bg-red-500 rounded-lg py-3 flex-row items-center justify-center gap-2"
                style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1 })}
              >
                <Ionicons name="add" size={20} color="white" />
                <Text className="text-white font-semibold">Add Quick Customer</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Bottom Navigation */}
      <StepNavigation />

      {/* Add Quick Customer Modal */}
      <AddQuickCustomerModal
        visible={showQuickCustomerModal}
        onClose={() => setShowQuickCustomerModal(false)}
        onSave={handleSaveQuickCustomer}
      />
    </View>
  );
}
