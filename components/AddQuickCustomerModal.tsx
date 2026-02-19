import { Ionicons } from "@expo/vector-icons";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import {
  createQuickCustomer,
  fetchSalesReps,
  getCustomerById,
  parseCustomerApiError,
  searchCustomers,
  updateCustomer,
  type CustomerEntity,
  type QuickCustomerPayload,
  type SaleAgent,
} from "../utils/api/customers";
import { Dropdown } from "./Dropdown";

export interface QuickCustomerResult {
  id: number;
  no?: string;
  business_name: string;
  name?: string;
  email: string | null;
  business_phone_no: string | null;
  class_of_trades: string;
  customer_type: number | null;
  is_active?: boolean;
  customer_billing_details?: {
    address?: string;
    city?: string;
    county?: string;
    state?: string;
    country?: string;
  } | null;
  sale_agent_obj: { label: string; value: number | null };
}

interface AddQuickCustomerModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (customer: QuickCustomerResult) => void;
  customerId?: number | null;
}

const CLASS_OF_TRADES_OPTIONS = [
  { value: "Retailer", label: "Retailer" },
  { value: "Distributor", label: "Distributor" },
  { value: "other", label: "Other" },
];

const CUSTOMER_TYPE_OPTIONS = [
  { value: "", label: "Select Customer Type" },
  { value: "1", label: "Walk In" },
  { value: "2", label: "Online" },
];

interface FormErrors {
  business_name?: string;
  email?: string;
  business_phone_no?: string;
  class_of_trades?: string;
}

const INITIAL_DATA: QuickCustomerPayload = {
  business_name: "",
  email: null,
  business_phone_no: null,
  class_of_trades: "Retailer",
  customer_type: null,
  sale_agent_obj: { label: "Please Select", value: null, key: null },
  is_active: true,
  balance_limit_check: false,
  invoice_aging: 0,
  allow_ecom: "N",
};

function validate(data: QuickCustomerPayload): FormErrors {
  const errors: FormErrors = {};

  if (!data.business_name.trim()) {
    errors.business_name = "Business Name is required";
  } else if (data.business_name.length > 100) {
    errors.business_name = "Business Name must be at most 100 characters";
  }

  if (data.email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.email)) {
      errors.email = "Invalid email address";
    }
  }

  if (data.business_phone_no) {
    const digits = data.business_phone_no.replace(/\D/g, "");
    if (digits.length > 0 && digits.length < 7) {
      errors.business_phone_no = "Business Phone Number must contain at least 7 digits";
    }
  }

  if (!data.class_of_trades) {
    errors.class_of_trades = "Class of Trades is required";
  }

  return errors;
}

function mapCustomerToResult(
  customer: CustomerEntity,
  fallbackSaleAgent?: { label: string; value: number | null }
): QuickCustomerResult {
  const derivedSaleAgent = {
    label: customer.tenant_users
      ? `${customer.tenant_users.first_name} ${customer.tenant_users.last_name}`
      : "Please Select",
    value: customer.tenant_users?.id ?? null,
  };

  return {
    id: customer.id,
    no: customer.no ?? undefined,
    business_name: customer.business_name || "",
    name: customer.name ?? undefined,
    email: customer.email ?? null,
    business_phone_no: customer.business_phone_no ?? null,
    class_of_trades: customer.class_of_trades ?? "Retailer",
    customer_type: customer.customer_type ?? null,
    is_active: customer.is_active,
    customer_billing_details: customer.customer_billing_details ?? null,
    sale_agent_obj: fallbackSaleAgent ?? derivedSaleAgent,
  };
}

export function AddQuickCustomerModal({
  visible,
  onClose,
  onSave,
  customerId,
}: AddQuickCustomerModalProps) {
  const [data, setData] = useState<QuickCustomerPayload>({ ...INITIAL_DATA });
  const [errors, setErrors] = useState<FormErrors>({});
  const [serverErrors, setServerErrors] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [salesReps, setSalesReps] = useState<SaleAgent[]>([]);

  const [nameSearchResults, setNameSearchResults] = useState<CustomerEntity[]>([]);
  const [nameSearchLoading, setNameSearchLoading] = useState(false);
  const [showNameDropdown, setShowNameDropdown] = useState(false);

  const nameSearchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isEditMode = !!customerId;

  const resetFormState = useCallback(() => {
    setData({ ...INITIAL_DATA });
    setErrors({});
    setServerErrors([]);
    setNameSearchResults([]);
    setNameSearchLoading(false);
    setShowNameDropdown(false);
  }, []);

  const updateField = useCallback(
    (field: keyof QuickCustomerPayload, value: unknown) => {
      setData((prev) => ({ ...prev, [field]: value }));
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    },
    []
  );

  const handleNameChange = useCallback(
    (text: string) => {
      updateField("business_name", text);

      if (nameSearchTimer.current) {
        clearTimeout(nameSearchTimer.current);
      }

      if (!text.trim() || text.trim().length < 2 || isEditMode) {
        setNameSearchResults([]);
        setShowNameDropdown(false);
        setNameSearchLoading(false);
        return;
      }

      setNameSearchLoading(true);
      setShowNameDropdown(true);

      nameSearchTimer.current = setTimeout(async () => {
        try {
          const res = await searchCustomers({
            searchbyNameBusinessName: text,
            isActive: 1,
          });
          setNameSearchResults(res.data.entities || []);
        } catch (err: any) {
          console.warn("[AddQuickCustomer] Name search error:", err?.message || err);
          setNameSearchResults([]);
        } finally {
          setNameSearchLoading(false);
        }
      }, 500);
    },
    [isEditMode, updateField]
  );

  const handleClose = useCallback(() => {
    if (nameSearchTimer.current) {
      clearTimeout(nameSearchTimer.current);
    }
    resetFormState();
    onClose();
  }, [onClose, resetFormState]);

  const handleSelectExistingCustomer = useCallback(
    (customer: CustomerEntity) => {
      if (customer.is_active === false) {
        Alert.alert(
          "Inactive Customer",
          "The customer is currently inactive. Please use an active customer."
        );
        return;
      }
      onSave(mapCustomerToResult(customer));
      resetFormState();
    },
    [onSave, resetFormState]
  );

  useEffect(() => {
    if (!visible) return;
    fetchSalesReps()
      .then((res) => setSalesReps(res.data.entities || []))
      .catch((err) =>
        console.warn("[AddQuickCustomer] Sales reps fetch failed:", err?.message || err)
      );
  }, [visible]);

  useEffect(() => {
    if (!visible || !customerId) return;
    setIsLoading(true);
    getCustomerById(customerId)
      .then((res) => {
        const entity = res.data.entity;
        setData({
          business_name: entity.business_name || "",
          email: entity.email || null,
          business_phone_no: entity.business_phone_no || null,
          class_of_trades: entity.class_of_trades || "Retailer",
          customer_type: entity.customer_type ?? null,
          sale_agent_obj: {
            label: entity.tenant_users
              ? `${entity.tenant_users.first_name} ${entity.tenant_users.last_name}`
              : "Please Select",
            value: entity.tenant_users?.id ?? null,
          },
          is_active: entity.is_active ?? true,
          balance_limit_check: false,
          invoice_aging: entity.invoice_aging ?? 0,
          allow_ecom: entity.allow_ecom || "N",
        });
      })
      .catch((err) => console.error("Error loading customer:", err))
      .finally(() => setIsLoading(false));
  }, [visible, customerId]);

  useEffect(() => {
    return () => {
      if (nameSearchTimer.current) {
        clearTimeout(nameSearchTimer.current);
      }
    };
  }, []);

  const salesRepOptions = [
    { value: "", label: "Please Select" },
    ...salesReps.map((user) => ({
      value: String(user.id),
      label: `${user.first_name} ${user.last_name}`,
    })),
  ];

  const handleSave = async () => {
    const validationErrors = validate(data);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setIsLoading(true);
    setServerErrors([]);

    try {
      let entity: CustomerEntity;

      if (isEditMode && customerId) {
        const res = await updateCustomer(
          data as Partial<QuickCustomerPayload> & Record<string, unknown>,
          customerId
        );
        entity = res.data.entity;
      } else {
        const res = await createQuickCustomer(data);
        entity = res.data.entity;
      }

      onSave(
        mapCustomerToResult(entity, {
          label: data.sale_agent_obj.label,
          value: data.sale_agent_obj.value,
        })
      );

      resetFormState();
    } catch (error: unknown) {
      const msgs = parseCustomerApiError(error as any);
      setServerErrors(msgs);
    } finally {
      setIsLoading(false);
    }
  };

  const canSave = data.business_name.trim().length > 0 && !isLoading;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose}>
      <View className="flex-1 bg-black/45 items-center justify-center px-4">
        <Pressable
          className="bg-[#F8F8F9] border border-[#E6E8EE] rounded-xl overflow-hidden"
          style={{ width: "74%", maxWidth: 980 }}
          onPress={() => {}}
        >
          <View className="flex-row items-center justify-between px-6 py-4 border-b border-[#ECEFF3]">
            <Text className="text-[#24262B] text-[36px] leading-[38px] font-semibold">
              {isEditMode ? "Edit Customer" : "Add New Customer"}
            </Text>
            <Pressable
              onPress={handleClose}
              className="w-8 h-8 items-center justify-center"
              style={({ pressed }) => ({ opacity: pressed ? 0.55 : 1 })}
            >
              <Ionicons name="close" size={22} color="#4B5563" />
            </Pressable>
          </View>

          {serverErrors.length > 0 && (
            <View className="mx-6 mt-4 bg-red-50 border border-red-200 rounded-lg p-3">
              {serverErrors.map((msg, i) => (
                <Text key={i} className="text-red-600 text-sm">
                  {msg}
                </Text>
              ))}
            </View>
          )}

          {isLoading && (
            <View className="absolute inset-0 bg-white/70 z-10 items-center justify-center">
              <ActivityIndicator size="large" color="#E11D48" />
            </View>
          )}

          <ScrollView
            className="px-6 py-4"
            contentContainerStyle={{ paddingBottom: 10 }}
            style={{ maxHeight: 470 }}
          >
            <View className="flex-row gap-3 mb-3">
              <View className="flex-1">
                <Text className="text-[#5A5F66] text-[18px] mb-1.5" style={{ fontFamily: 'Montserrat' }}>
                  Business Name <Text className="text-red-500">*</Text>
                </Text>
                <TextInput
                  className={`bg-white border rounded-xl px-3 py-3 text-gray-800 text-[18px] shadow-sm ${
                    errors.business_name ? "border-red-400" : "border-gray-200"
                  }`}
                  style={{ fontFamily: 'Montserrat' }}
                  placeholder="Business Name"
                  placeholderTextColor="#9CA3AF"
                  value={data.business_name}
                  onChangeText={handleNameChange}
                  autoFocus={!isEditMode}
                  maxLength={100}
                />
                {errors.business_name && (
                  <Text className="text-red-500 text-[14px] mt-1" style={{ fontFamily: 'Montserrat' }}>{errors.business_name}</Text>
                )}
              </View>

              <View className="flex-1">
                <Text className="text-[#5A5F66] text-[18px] mb-1.5" style={{ fontFamily: 'Montserrat' }}>Email Address</Text>
                <TextInput
                  className={`bg-white border rounded-xl px-3 py-3 text-gray-800 text-[18px] shadow-sm ${
                    errors.email ? "border-red-400" : "border-gray-200"
                  }`}
                  style={{ fontFamily: 'Montserrat' }}
                  placeholder="Email"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  value={data.email || ""}
                  onChangeText={(value) => updateField("email", value || null)}
                />
                {errors.email && <Text className="text-red-500 text-[14px] mt-1" style={{ fontFamily: 'Montserrat' }}>{errors.email}</Text>}
              </View>
            </View>

            {showNameDropdown && !isEditMode && (
              <View className="border border-[#E5E7EB] rounded-lg bg-white overflow-hidden mb-3">
                {nameSearchLoading ? (
                  <View style={{ paddingVertical: 12, alignItems: "center" }}>
                    <ActivityIndicator size="small" color="#E11D48" />
                  </View>
                ) : nameSearchResults.length > 0 ? (
                  <ScrollView nestedScrollEnabled style={{ maxHeight: 170 }}>
                    {nameSearchResults.map((customer) => (
                      <Pressable
                        key={customer.id}
                        onPress={() => handleSelectExistingCustomer(customer)}
                        style={({ pressed }) => ({
                          paddingHorizontal: 12,
                          paddingVertical: 10,
                          borderBottomWidth: 1,
                          borderBottomColor: "#F1F3F5",
                          opacity: customer.is_active === false ? 0.55 : pressed ? 0.75 : 1,
                        })}
                      >
                        <Text className="text-gray-800 text-sm font-semibold">
                          {customer.business_name}
                          {customer.name ? `, ${customer.name}` : ""}
                        </Text>
                        <Text className="text-gray-600 text-xs mt-0.5">
                          Phone: {customer.business_phone_no || "N/A"} | Email: {customer.email || "N/A"}
                        </Text>
                        {customer.no && (
                          <Text className="text-gray-600 text-xs">Customer No: {customer.no}</Text>
                        )}
                        {customer.is_active === false && (
                          <Text className="text-red-500 text-xs font-medium mt-0.5">Inactive</Text>
                        )}
                      </Pressable>
                    ))}
                  </ScrollView>
                ) : (
                  <View style={{ paddingVertical: 12, alignItems: "center" }}>
                    <Text className="text-gray-400 text-xs italic">No existing customer found</Text>
                  </View>
                )}
              </View>
            )}

            <View className="flex-row gap-3 mb-3">
              <View className="flex-1">
                <Text className="text-[#5A5F66] text-[18px] mb-1.5" style={{ fontFamily: 'Montserrat' }}>Business Phone Number</Text>
                <TextInput
                  className={`bg-white border rounded-xl px-3 py-3 text-gray-800 text-[18px] shadow-sm ${
                    errors.business_phone_no ? "border-red-400" : "border-gray-200"
                  }`}
                  style={{ fontFamily: 'Montserrat' }}
                  placeholder="+123 456 789"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="phone-pad"
                  value={data.business_phone_no || ""}
                  onChangeText={(value) => updateField("business_phone_no", value || null)}
                />
                {errors.business_phone_no && (
                  <Text className="text-red-500 text-[14px] mt-1" style={{ fontFamily: 'Montserrat' }}>{errors.business_phone_no}</Text>
                )}
              </View>
              <View className="flex-1">
                <Dropdown
                  label="Class of Trades"
                  options={CLASS_OF_TRADES_OPTIONS}
                  value={data.class_of_trades}
                  onChange={(value) => updateField("class_of_trades", value)}
                />
                {errors.class_of_trades && (
                  <Text className="text-red-500 text-[14px] mt-1" style={{ fontFamily: 'Montserrat' }}>{errors.class_of_trades}</Text>
                )}
              </View>
            </View>

            <View className="flex-row gap-3">
              <View className="flex-1">
                <Dropdown
                  label="Customer Type"
                  options={CUSTOMER_TYPE_OPTIONS}
                  value={data.customer_type != null ? String(data.customer_type) : ""}
                  onChange={(value) => updateField("customer_type", value ? Number(value) : null)}
                />
              </View>
              <View className="flex-1">
                <Dropdown
                  label="Sales Rep"
                  options={salesRepOptions}
                  value={data.sale_agent_obj.value != null ? String(data.sale_agent_obj.value) : ""}
                  onChange={(value) => {
                    const numericValue = value ? Number(value) : null;
                    const selectedRep = salesReps.find((rep) => rep.id === numericValue);
                    updateField("sale_agent_obj", {
                      value: numericValue,
                      key: numericValue,
                      label: selectedRep
                        ? `${selectedRep.first_name} ${selectedRep.last_name}`
                        : "Please Select",
                    });
                  }}
                />
              </View>
            </View>
          </ScrollView>

          <View className="flex-row gap-3 px-6 py-4 border-t border-[#ECEFF3]">
            <Pressable
              onPress={handleClose}
              disabled={isLoading}
              className="flex-1 bg-[#F8E7EA] rounded-lg h-12 items-center justify-center"
              style={({ pressed }) => ({ opacity: pressed ? 0.75 : 1 })}
            >
              <Text className="text-[#CC4A66] text-xl font-semibold">Cancel</Text>
            </Pressable>
            <Pressable
              onPress={handleSave}
              disabled={!canSave}
              className={`flex-1 rounded-lg h-12 items-center justify-center ${
                canSave ? "bg-[#DF2E58]" : "bg-[#DF2E58]"
              }`}
              style={({ pressed }) => ({ opacity: pressed && canSave ? 0.82 : 1 })}
            >
              <Text className={canSave ? "text-white text-xl font-semibold" : "text-white font-semibold"}>
                Save
              </Text>
            </Pressable>
          </View>
        </Pressable>
      </View>
    </Modal>
  );
}
