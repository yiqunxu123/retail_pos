import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import { KeyboardAvoidingView, Modal, Platform, ScrollView, Switch, Text, TextInput, TouchableOpacity, View } from "react-native";
import { Dropdown } from "./Dropdown";

interface NewCustomerData {
  businessName: string;
  contactName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  customerType: string;
  classOfTrades: string;
  salesRep: string;
  taxExempt: boolean;
  taxId: string;
  creditLimit: string;
  notes: string;
}

interface NewCustomerModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (customer: NewCustomerData) => void;
  initialData?: Partial<NewCustomerData>;
  isEditing?: boolean;
}

const CUSTOMER_TYPE_OPTIONS = [
  { value: "retailer", label: "Retailer" },
  { value: "wholesale", label: "Wholesale" },
  { value: "distributor", label: "Distributor" },
  { value: "end_user", label: "End User" },
];

const CLASS_OF_TRADES_OPTIONS = [
  { value: "convenience_store", label: "Convenience Store" },
  { value: "grocery", label: "Grocery" },
  { value: "vape_shop", label: "Vape Shop" },
  { value: "tobacco_shop", label: "Tobacco Shop" },
  { value: "gas_station", label: "Gas Station" },
  { value: "other", label: "Other" },
];

const SALES_REP_OPTIONS = [
  { value: "rep1", label: "John Smith" },
  { value: "rep2", label: "Jane Doe" },
  { value: "rep3", label: "Mike Johnson" },
  { value: "unassigned", label: "Unassigned" },
];

const STATE_OPTIONS = [
  { value: "AL", label: "Alabama" },
  { value: "AK", label: "Alaska" },
  { value: "AZ", label: "Arizona" },
  { value: "CA", label: "California" },
  { value: "CO", label: "Colorado" },
  { value: "FL", label: "Florida" },
  { value: "GA", label: "Georgia" },
  { value: "NC", label: "North Carolina" },
  { value: "NY", label: "New York" },
  { value: "TN", label: "Tennessee" },
  { value: "TX", label: "Texas" },
  // Add more states as needed
];

const initialFormData: NewCustomerData = {
  businessName: "",
  contactName: "",
  email: "",
  phone: "",
  address: "",
  city: "",
  state: "",
  zipCode: "",
  country: "USA",
  customerType: "",
  classOfTrades: "",
  salesRep: "",
  taxExempt: false,
  taxId: "",
  creditLimit: "",
  notes: "",
};

/**
 * NewCustomerModal - Full customer creation/edit form
 * Comprehensive form with all customer fields
 */
export function NewCustomerModal({
  visible,
  onClose,
  onSave,
  initialData,
  isEditing = false,
}: NewCustomerModalProps) {
  const [formData, setFormData] = useState<NewCustomerData>(initialFormData);
  const [errors, setErrors] = useState<Partial<Record<keyof NewCustomerData, string>>>({});

  useEffect(() => {
    if (visible) {
      setFormData(initialData ? { ...initialFormData, ...initialData } : initialFormData);
      setErrors({});
    }
  }, [visible, initialData]);

  const updateField = (field: keyof NewCustomerData, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof NewCustomerData, string>> = {};

    if (!formData.businessName.trim()) {
      newErrors.businessName = "Business name is required";
    }
    if (!formData.phone.trim()) {
      newErrors.phone = "Phone number is required";
    }
    if (formData.email && !/^\S+@\S+\.\S+$/.test(formData.email)) {
      newErrors.email = "Invalid email format";
    }
    if (!formData.customerType) {
      newErrors.customerType = "Customer type is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (validate()) {
      onSave(formData);
    }
  };

  const FormField = ({
    label,
    required,
    children,
    error,
  }: {
    label: string;
    required?: boolean;
    children: React.ReactNode;
    error?: string;
  }) => (
    <View className="mb-4">
      <Text className="text-gray-700 font-medium mb-1">
        {label}
        {required && <Text className="text-red-500"> *</Text>}
      </Text>
      {children}
      {error && <Text className="text-red-500 text-xs mt-1">{error}</Text>}
    </View>
  );

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <TouchableOpacity
          className="flex-1 bg-black/50 justify-center items-center"
          activeOpacity={1}
          onPress={onClose}
        >
          <View
            className="bg-white rounded-xl overflow-hidden"
            style={{ width: 650, height: 680, maxHeight: "90%" }}
          >
          {/* Header */}
          <View className="flex-row justify-between items-center px-6 py-4 border-b border-gray-200">
            <View className="flex-row items-center gap-3">
              <View className="w-10 h-10 bg-red-100 rounded-full items-center justify-center">
                <Ionicons name={isEditing ? "pencil" : "person-add"} size={24} color="#EC1A52" />
              </View>
              <Text className="text-xl font-semibold text-gray-800">
                {isEditing ? "Edit Customer" : "New Customer"}
              </Text>
            </View>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color="#6b7280" />
            </TouchableOpacity>
          </View>

          <ScrollView className="flex-1 px-6 py-4">
            {/* Basic Information */}
            <Text className="text-gray-800 font-semibold mb-3 text-lg">Basic Information</Text>
            <View className="flex-row gap-4">
              <View className="flex-1">
                <FormField label="Business Name" required error={errors.businessName}>
                  <TextInput
                    className={`bg-gray-50 border rounded-lg px-4 py-3 ${
                      errors.businessName ? "border-red-500" : "border-gray-200"
                    }`}
                    placeholder="Enter business name"
                    placeholderTextColor="#9ca3af"
                    value={formData.businessName}
                    onChangeText={(text) => updateField("businessName", text)}
                  />
                </FormField>
              </View>
              <View className="flex-1">
                <FormField label="Contact Name">
                  <TextInput
                    className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-3"
                    placeholder="Enter contact name"
                    placeholderTextColor="#9ca3af"
                    value={formData.contactName}
                    onChangeText={(text) => updateField("contactName", text)}
                  />
                </FormField>
              </View>
            </View>

            <View className="flex-row gap-4">
              <View className="flex-1">
                <FormField label="Email" error={errors.email}>
                  <TextInput
                    className={`bg-gray-50 border rounded-lg px-4 py-3 ${
                      errors.email ? "border-red-500" : "border-gray-200"
                    }`}
                    placeholder="email@example.com"
                    placeholderTextColor="#9ca3af"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    value={formData.email}
                    onChangeText={(text) => updateField("email", text)}
                  />
                </FormField>
              </View>
              <View className="flex-1">
                <FormField label="Phone" required error={errors.phone}>
                  <TextInput
                    className={`bg-gray-50 border rounded-lg px-4 py-3 ${
                      errors.phone ? "border-red-500" : "border-gray-200"
                    }`}
                    placeholder="(555) 555-5555"
                    placeholderTextColor="#9ca3af"
                    keyboardType="phone-pad"
                    value={formData.phone}
                    onChangeText={(text) => updateField("phone", text)}
                  />
                </FormField>
              </View>
            </View>

            {/* Address */}
            <Text className="text-gray-800 font-semibold mb-3 mt-4 text-lg">Address</Text>
            <FormField label="Street Address">
              <TextInput
                className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-3"
                placeholder="Enter street address"
                placeholderTextColor="#9ca3af"
                value={formData.address}
                onChangeText={(text) => updateField("address", text)}
              />
            </FormField>

            <View className="flex-row gap-4">
              <View className="flex-1">
                <FormField label="City">
                  <TextInput
                    className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-3"
                    placeholder="City"
                    placeholderTextColor="#9ca3af"
                    value={formData.city}
                    onChangeText={(text) => updateField("city", text)}
                  />
                </FormField>
              </View>
              <View style={{ width: 150 }}>
                <FormField label="State">
                  <Dropdown
                    value={formData.state}
                    options={STATE_OPTIONS}
                    onChange={(value) => updateField("state", value)}
                    placeholder="Select"
                  />
                </FormField>
              </View>
              <View style={{ width: 120 }}>
                <FormField label="ZIP Code">
                  <TextInput
                    className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-3"
                    placeholder="ZIP"
                    placeholderTextColor="#9ca3af"
                    keyboardType="number-pad"
                    value={formData.zipCode}
                    onChangeText={(text) => updateField("zipCode", text)}
                  />
                </FormField>
              </View>
            </View>

            {/* Business Details */}
            <Text className="text-gray-800 font-semibold mb-3 mt-4 text-lg">Business Details</Text>
            <View className="flex-row gap-4">
              <View className="flex-1">
                <FormField label="Customer Type" required error={errors.customerType}>
                  <Dropdown
                    value={formData.customerType}
                    options={CUSTOMER_TYPE_OPTIONS}
                    onChange={(value) => updateField("customerType", value)}
                    placeholder="Select type"
                    error={!!errors.customerType}
                  />
                </FormField>
              </View>
              <View className="flex-1">
                <FormField label="Class of Trades">
                  <Dropdown
                    value={formData.classOfTrades}
                    options={CLASS_OF_TRADES_OPTIONS}
                    onChange={(value) => updateField("classOfTrades", value)}
                    placeholder="Select class"
                  />
                </FormField>
              </View>
              <View className="flex-1">
                <FormField label="Sales Rep">
                  <Dropdown
                    value={formData.salesRep}
                    options={SALES_REP_OPTIONS}
                    onChange={(value) => updateField("salesRep", value)}
                    placeholder="Select rep"
                  />
                </FormField>
              </View>
            </View>

            {/* Tax & Credit */}
            <Text className="text-gray-800 font-semibold mb-3 mt-4 text-lg">Tax & Credit</Text>
            <View className="flex-row gap-4 items-start">
              <View className="flex-1">
                <View className="flex-row items-center justify-between bg-gray-50 border border-gray-200 rounded-lg px-4 py-3">
                  <Text className="text-gray-700">Tax Exempt</Text>
                  <Switch
                    value={formData.taxExempt}
                    onValueChange={(value) => updateField("taxExempt", value)}
                    trackColor={{ false: "#d1d5db", true: "#EC1A52" }}
                    thumbColor="#ffffff"
                  />
                </View>
              </View>
              <View className="flex-1">
                <FormField label="Tax ID">
                  <TextInput
                    className={`border rounded-lg px-4 py-3 ${formData.taxExempt ? "bg-gray-50 border-gray-200 text-gray-800" : "bg-gray-100 border-gray-300 text-gray-400"}`}
                    placeholder="Tax ID number"
                    placeholderTextColor={formData.taxExempt ? "#9ca3af" : "#B8BEC8"}
                    value={formData.taxId}
                    onChangeText={(text) => updateField("taxId", text)}
                    editable={formData.taxExempt}
                  />
                </FormField>
              </View>
              <View className="flex-1">
                <FormField label="Credit Limit">
                  <View className="flex-row items-center bg-gray-50 border border-gray-200 rounded-lg">
                    <Text className="pl-4 text-gray-500">$</Text>
                    <TextInput
                      className="flex-1 px-2 py-3"
                      placeholder="0.00"
                      placeholderTextColor="#9ca3af"
                      keyboardType="decimal-pad"
                      value={formData.creditLimit}
                      onChangeText={(text) => updateField("creditLimit", text)}
                    />
                  </View>
                </FormField>
              </View>
            </View>

            {/* Notes */}
            <Text className="text-gray-800 font-semibold mb-3 mt-4 text-lg">Notes</Text>
            <FormField label="Internal Notes">
              <TextInput
                className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-3"
                placeholder="Add any notes about this customer..."
                placeholderTextColor="#9ca3af"
                multiline
                numberOfLines={3}
                textAlignVertical="top"
                value={formData.notes}
                onChangeText={(text) => updateField("notes", text)}
              />
            </FormField>
          </ScrollView>

          {/* Footer */}
          <View className="flex-row gap-3 px-6 py-4 border-t border-gray-200">
            <TouchableOpacity
              onPress={onClose}
              className="flex-1 border border-gray-300 rounded-lg items-center justify-center"
              style={{ height: 40 }}
            >
              <Text className="text-gray-700 font-medium">Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleSave}
              className="flex-1 bg-red-500 rounded-lg items-center justify-center"
              style={{ height: 40 }}
            >
              <Text className="text-white font-medium">
                {isEditing ? "Save Changes" : "Create Customer"}
              </Text>
            </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </Modal>
  );
}
