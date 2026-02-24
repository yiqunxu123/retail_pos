/**
 * NewCustomerForm - 客户创建/编辑表单内容
 * 可嵌入 SlidePanelModal 或 LeftSlidePanel，与 Add Note、Search Product 共用弹窗模板
 */

import { colors } from "@/utils/theme";
import React, {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import { ScrollView, Switch, Text, TextInput, View } from "react-native";
import { Dropdown } from "./Dropdown";

export interface NewCustomerData {
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

export interface NewCustomerFormRef {
  submit: () => boolean;
}

export interface NewCustomerFormProps {
  initialData?: Partial<NewCustomerData>;
  isEditing?: boolean;
  onSave: (customer: NewCustomerData) => void;
  /** 是否在 Panel 内使用（无外层 ScrollView） */
  embedded?: boolean;
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

function FormField({
  label,
  required,
  children,
  error,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
  error?: string;
}) {
  return (
    <View className="mb-4">
      <Text className="text-[#5A5F66] text-lg mb-1.5">
        {label}
        {required && <Text className="text-red-500"> *</Text>}
      </Text>
      {children}
      {error && <Text className="text-red-500 text-sm mt-1">{error}</Text>}
    </View>
  );
}

const NewCustomerFormInner = forwardRef<
  NewCustomerFormRef,
  NewCustomerFormProps & { resetKey?: number }
>(function NewCustomerFormInner(
  { initialData, isEditing = false, onSave, embedded = false, resetKey },
  ref
) {
  const [formData, setFormData] = useState<NewCustomerData>(
    initialData ? { ...initialFormData, ...initialData } : initialFormData
  );
  const [errors, setErrors] = useState<
    Partial<Record<keyof NewCustomerData, string>>
  >({});

  useEffect(() => {
    setFormData(
      initialData ? { ...initialFormData, ...initialData } : initialFormData
    );
    setErrors({});
  }, [initialData, resetKey]);

  const updateField = useCallback(
    (field: keyof NewCustomerData, value: string | boolean) => {
      setFormData((prev) => ({ ...prev, [field]: value }));
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    },
    []
  );

  const validate = useCallback((): boolean => {
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
  }, [formData]);

  const submit = useCallback((): boolean => {
    if (!validate()) return false;
    onSave(formData);
    return true;
  }, [formData, onSave, validate]);

  useImperativeHandle(
    ref,
    () => ({
      submit,
    }),
    [submit]
  );

  const formContent = (
    <>
      <Text className="text-gray-800 font-semibold mb-2 text-base">
        Basic Information
      </Text>
      <View className="flex-row gap-4">
        <View className="flex-1">
          <FormField label="Business Name" required error={errors.businessName}>
            <TextInput
              className={`bg-white border rounded-xl px-3 py-3 text-lg shadow-sm ${
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
              className="bg-white border border-gray-200 rounded-xl px-3 py-3 text-lg shadow-sm"
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
              className={`bg-white border rounded-xl px-3 py-3 text-lg shadow-sm ${
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
              className={`bg-white border rounded-xl px-3 py-3 text-lg shadow-sm ${
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

      <Text className="text-gray-800 font-semibold mb-2 mt-3 text-base">
        Address
      </Text>
      <FormField label="Street Address">
        <TextInput
          className="bg-white border border-gray-200 rounded-xl px-3 py-3 text-lg shadow-sm"
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
              className="bg-white border border-gray-200 rounded-xl px-3 py-3 text-lg shadow-sm"
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
              className="bg-white border border-gray-200 rounded-xl px-3 py-3 text-lg shadow-sm"
              placeholder="ZIP"
              placeholderTextColor="#9ca3af"
              keyboardType="number-pad"
              value={formData.zipCode}
              onChangeText={(text) => updateField("zipCode", text)}
            />
          </FormField>
        </View>
      </View>

      <Text className="text-gray-800 font-semibold mb-2 mt-3 text-base">
        Business Details
      </Text>
      <View className="flex-row gap-4">
        <View className="flex-1">
          <FormField label="Customer Type" required error={errors.customerType}>
            <Dropdown
              value={formData.customerType}
              options={CUSTOMER_TYPE_OPTIONS}
              onChange={(value) => updateField("customerType", value)}
              placeholder="Select type"
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

      <Text className="text-gray-800 font-semibold mb-2 mt-3 text-base">
        Tax & Credit
      </Text>
      <View className="flex-row gap-4 items-start">
        <View className="flex-1">
          <View className="flex-row items-center justify-between bg-white border border-gray-200 rounded-xl px-3 py-3 shadow-sm">
            <Text className="text-gray-700">Tax Exempt</Text>
            <Switch
              value={formData.taxExempt}
              onValueChange={(value) => updateField("taxExempt", value)}
              trackColor={{ false: colors.borderMedium, true: colors.primary }}
              thumbColor="#ffffff"
            />
          </View>
        </View>
        <View className="flex-1">
          <FormField label="Tax ID">
            <TextInput
              className={`border rounded-xl px-3 py-3 text-lg shadow-sm ${
                formData.taxExempt
                  ? "bg-white border-gray-200 text-gray-800"
                  : "bg-gray-100 border-gray-300 text-gray-400"
              }`}
              placeholder="Tax ID number"
              placeholderTextColor={
                formData.taxExempt ? "#9ca3af" : "#B8BEC8"
              }
              value={formData.taxId}
              onChangeText={(text) => updateField("taxId", text)}
              editable={formData.taxExempt}
            />
          </FormField>
        </View>
        <View className="flex-1">
          <FormField label="Credit Limit">
            <View className="flex-row items-center bg-white border border-gray-200 rounded-xl px-3 py-3 shadow-sm">
              <Text className="text-gray-500 text-lg mr-1">$</Text>
              <TextInput
                className="flex-1 text-lg"
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

      <Text className="text-gray-800 font-semibold mb-2 mt-3 text-base">
        Notes
      </Text>
      <FormField label="Internal Notes">
        <TextInput
          className="bg-white border border-gray-200 rounded-xl px-3 py-3 text-lg shadow-sm"
          placeholder="Add any notes about this customer..."
          placeholderTextColor="#9ca3af"
          multiline
          numberOfLines={2}
          textAlignVertical="top"
          value={formData.notes}
          onChangeText={(text) => updateField("notes", text)}
        />
      </FormField>
    </>
  );

  if (embedded) {
    return (
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 24 }}
        showsVerticalScrollIndicator
        keyboardShouldPersistTaps="handled"
      >
        {formContent}
      </ScrollView>
    );
  }

  return <View>{formContent}</View>;
});

export const NewCustomerForm = React.memo(NewCustomerFormInner);
NewCustomerForm.displayName = "NewCustomerForm";
