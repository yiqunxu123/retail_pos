import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { Modal, View, Text, Pressable, TextInput, ScrollView } from "react-native";
import { Dropdown } from "./Dropdown";

interface QuickCustomerData {
  businessName: string;
  email: string;
  phone: string;
  classOfTrades: string;
  customerType: string;
  salesRep: string;
}

interface AddQuickCustomerModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (customer: QuickCustomerData) => void;
}

const CLASS_OF_TRADES_OPTIONS = [
  { value: "retailer", label: "Retailer" },
  { value: "wholesaler", label: "Wholesaler" },
  { value: "distributor", label: "Distributor" },
  { value: "manufacturer", label: "Manufacturer" },
];

const CUSTOMER_TYPE_OPTIONS = [
  { value: "retailer", label: "Retailer" },
  { value: "wholesale", label: "Wholesale" },
  { value: "individual", label: "Individual" },
  { value: "corporate", label: "Corporate" },
];

const SALES_REP_OPTIONS = [
  { value: "retailer", label: "Retailer" },
  { value: "john_doe", label: "John Doe" },
  { value: "jane_smith", label: "Jane Smith" },
  { value: "mike_johnson", label: "Mike Johnson" },
];

const initialData: QuickCustomerData = {
  businessName: "",
  email: "",
  phone: "",
  classOfTrades: "retailer",
  customerType: "retailer",
  salesRep: "retailer",
};

/**
 * AddQuickCustomerModal - Modal for quickly adding a new customer
 * Reusable across different flows (order, POS, etc.)
 */
export function AddQuickCustomerModal({
  visible,
  onClose,
  onSave,
}: AddQuickCustomerModalProps) {
  const [data, setData] = useState<QuickCustomerData>(initialData);

  const updateField = (field: keyof QuickCustomerData, value: string) => {
    setData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    if (!data.businessName.trim()) {
      return; // Business name is required
    }
    onSave(data);
    setData(initialData);
  };

  const handleClose = () => {
    setData(initialData);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
    >
      <Pressable
        className="flex-1 bg-black/50 justify-center items-center"
        onPress={handleClose}
      >
        {/* Modal Content */}
        <Pressable
          className="bg-white rounded-xl overflow-hidden"
          style={{ width: 500, maxHeight: "90%" }}
          onPress={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <View className="flex-row justify-between items-center px-6 py-4 border-b border-gray-200">
            <Text className="text-xl font-semibold text-gray-800">
              Add Quick Customer
            </Text>
            <Pressable
              onPress={handleClose}
              className="p-1"
              style={({ pressed }) => ({ opacity: pressed ? 0.5 : 1 })}
            >
              <Ionicons name="close" size={24} color="#6b7280" />
            </Pressable>
          </View>

          {/* Form Content */}
          <ScrollView className="px-6 py-4">
            {/* Row 1: Business Name & Email */}
            <View className="flex-row gap-4 mb-4">
              <View className="flex-1">
                <Text className="text-gray-700 text-sm mb-1.5">
                  Business Name <Text className="text-red-500">*</Text>
                </Text>
                <TextInput
                  className="bg-white border border-gray-200 rounded-lg px-3 py-2.5 text-gray-800"
                  placeholder="Enter Order Number"
                  placeholderTextColor="#9ca3af"
                  value={data.businessName}
                  onChangeText={(v) => updateField("businessName", v)}
                />
              </View>
              <View className="flex-1">
                <Text className="text-gray-700 text-sm mb-1.5">Email Address</Text>
                <TextInput
                  className="bg-white border border-gray-200 rounded-lg px-3 py-2.5 text-gray-800"
                  placeholder="Email"
                  placeholderTextColor="#9ca3af"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  value={data.email}
                  onChangeText={(v) => updateField("email", v)}
                />
              </View>
            </View>

            {/* Row 2: Phone & Class of Trades */}
            <View className="flex-row gap-4 mb-4">
              <View className="flex-1">
                <Text className="text-gray-700 text-sm mb-1.5">Business Phone Number</Text>
                <TextInput
                  className="bg-white border border-gray-200 rounded-lg px-3 py-2.5 text-gray-800"
                  placeholder="+123 456 789"
                  placeholderTextColor="#9ca3af"
                  keyboardType="phone-pad"
                  value={data.phone}
                  onChangeText={(v) => updateField("phone", v)}
                />
              </View>
              <View className="flex-1">
                <Dropdown
                  label="Class of Trades"
                  options={CLASS_OF_TRADES_OPTIONS}
                  value={data.classOfTrades}
                  onChange={(v) => updateField("classOfTrades", v)}
                />
              </View>
            </View>

            {/* Row 3: Customer Type & Sales Rep */}
            <View className="flex-row gap-4 mb-6">
              <View className="flex-1">
                <Dropdown
                  label="Customer Type"
                  options={CUSTOMER_TYPE_OPTIONS}
                  value={data.customerType}
                  onChange={(v) => updateField("customerType", v)}
                />
              </View>
              <View className="flex-1">
                <Dropdown
                  label="Sales Rep"
                  options={SALES_REP_OPTIONS}
                  value={data.salesRep}
                  onChange={(v) => updateField("salesRep", v)}
                />
              </View>
            </View>
          </ScrollView>

          {/* Footer Actions */}
          <View className="flex-row gap-4 px-6 py-4 border-t border-gray-200">
            <Pressable
              onPress={handleClose}
              className="flex-1 border border-red-500 py-3 rounded-lg items-center"
              style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
            >
              <Text className="text-red-500 font-semibold">Cancel</Text>
            </Pressable>
            <Pressable
              onPress={handleSave}
              className={`flex-1 py-3 rounded-lg items-center ${
                data.businessName.trim() ? "bg-red-500" : "bg-gray-300"
              }`}
              style={({ pressed }) => ({
                opacity: pressed && data.businessName.trim() ? 0.8 : 1,
              })}
              disabled={!data.businessName.trim()}
            >
              <Text
                className={`font-semibold ${
                  data.businessName.trim() ? "text-white" : "text-gray-500"
                }`}
              >
                Save
              </Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
