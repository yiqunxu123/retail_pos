import { Ionicons } from "@expo/vector-icons";
import { useCallback, useEffect, useRef, useState } from "react";
import {
    ActivityIndicator,
    Modal,
    Pressable,
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
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

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface QuickCustomerResult {
  id: number;
  business_name: string;
  email: string | null;
  business_phone_no: string | null;
  class_of_trades: string;
  customer_type: number | null;
  sale_agent_obj: { label: string; value: number | null };
}

interface AddQuickCustomerModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (customer: QuickCustomerResult) => void;
  /** Pass a customer ID to enter edit mode */
  customerId?: number | null;
}

// ---------------------------------------------------------------------------
// Constants – aligned with web (kapp constants)
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

interface FormErrors {
  business_name?: string;
  email?: string;
  business_phone_no?: string;
  class_of_trades?: string;
}

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
      errors.business_phone_no = "Phone number must contain at least 7 digits";
    }
  }

  if (!data.class_of_trades) {
    errors.class_of_trades = "Class of Trades is required";
  }

  return errors;
}

// ---------------------------------------------------------------------------
// Initial form values – aligned with web
// ---------------------------------------------------------------------------

const INITIAL_DATA: QuickCustomerPayload = {
  business_name: "",
  email: null,
  business_phone_no: null,
  class_of_trades: "Retailer",
  customer_type: null,
  sale_agent_obj: { label: "Please Select", value: null, key: null },
  is_active: true,
  balance_limit_check: false,
  invoice_aging: 0, // DueImmediately
  allow_ecom: "N",
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * AddQuickCustomerModal - Modal for quickly adding/editing a customer.
 * Aligned with kapp web (saleQOrder / portal-v2) implementation.
 */
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

  const isEditMode = !!customerId;

  const updateField = useCallback(
    (field: keyof QuickCustomerPayload, value: unknown) => {
      setData((prev) => ({ ...prev, [field]: value }));
      // Clear field error on change
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    },
    []
  );

  // --- Customer name search (autocomplete) ---
  const [nameSearchResults, setNameSearchResults] = useState<CustomerEntity[]>([]);
  const [nameSearchLoading, setNameSearchLoading] = useState(false);
  const [showNameDropdown, setShowNameDropdown] = useState(false);
  const nameSearchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleNameChange = useCallback((text: string) => {
    updateField("business_name", text);

    if (nameSearchTimer.current) clearTimeout(nameSearchTimer.current);

    if (!text.trim() || text.trim().length < 2) {
      setNameSearchResults([]);
      setShowNameDropdown(false);
      setNameSearchLoading(false);
      return;
    }

    setNameSearchLoading(true);
    setShowNameDropdown(true);

    nameSearchTimer.current = setTimeout(async () => {
      try {
        const res = await searchCustomers({ searchbyNameBusinessName: text, isActive: 1 });
        setNameSearchResults(res.data.entities || []);
      } catch (err: any) {
        console.warn("[AddQuickCustomer] Name search error:", err?.message || err);
        setNameSearchResults([]);
      } finally {
        setNameSearchLoading(false);
      }
    }, 500);
  }, [updateField]);

  const handleSelectExistingCustomer = useCallback((customer: CustomerEntity) => {
    if (customer.is_active === false) return;
    // Directly return the selected customer — no need to create
    onSave({
      id: customer.id,
      business_name: customer.business_name,
      email: customer.email ?? null,
      business_phone_no: customer.business_phone_no ?? null,
      class_of_trades: customer.class_of_trades ?? "Retailer",
      customer_type: customer.customer_type ?? null,
      sale_agent_obj: {
        label: customer.tenant_users
          ? `${customer.tenant_users.first_name} ${customer.tenant_users.last_name}`
          : "Please Select",
        value: customer.tenant_users?.id ?? null,
      },
    });
    // Reset
    setData({ ...INITIAL_DATA });
    setErrors({});
    setServerErrors([]);
    setNameSearchResults([]);
    setShowNameDropdown(false);
  }, [onSave]);

  // Fetch sales reps on mount
  useEffect(() => {
    if (!visible) return;
    fetchSalesReps()
      .then((res) => setSalesReps(res.data.entities || []))
      .catch((err) => console.warn("[AddQuickCustomer] Sales reps fetch failed (non-blocking):", err?.message || err));
  }, [visible]);

  // Load existing customer data in edit mode
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

  // Build sales rep dropdown options dynamically
  const salesRepOptions = [
    { value: "", label: "Please Select" },
    ...salesReps.map((u) => ({
      value: String(u.id),
      label: `${u.first_name} ${u.last_name}`,
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
        const res = await updateCustomer(data, customerId);
        entity = res.data.entity;
      } else {
        const res = await createQuickCustomer(data);
        entity = res.data.entity;
      }

      onSave({
        id: entity.id,
        business_name: entity.business_name,
        email: entity.email ?? null,
        business_phone_no: entity.business_phone_no ?? null,
        class_of_trades: entity.class_of_trades ?? "Retailer",
        customer_type: entity.customer_type ?? null,
        sale_agent_obj: data.sale_agent_obj,
      });

      // Reset form
      setData({ ...INITIAL_DATA });
      setErrors({});
      setServerErrors([]);
    } catch (error: unknown) {
      const msgs = parseCustomerApiError(error as any);
      setServerErrors(msgs);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setData({ ...INITIAL_DATA });
    setErrors({});
    setServerErrors([]);
    onClose();
  };

  const canSave = data.business_name.trim().length > 0 && !isLoading;

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
              {isEditMode ? "Edit Customer" : "Add Quick Customer"}
            </Text>
            <Pressable
              onPress={handleClose}
              className="p-1"
              style={({ pressed }) => ({ opacity: pressed ? 0.5 : 1 })}
            >
              <Ionicons name="close" size={24} color="#6b7280" />
            </Pressable>
          </View>

          {/* Server Errors */}
          {serverErrors.length > 0 && (
            <View className="mx-6 mt-4 bg-red-50 border border-red-200 rounded-lg p-3">
              {serverErrors.map((msg, i) => (
                <Text key={i} className="text-red-600 text-sm">
                  {msg}
                </Text>
              ))}
            </View>
          )}

          {/* Loading overlay */}
          {isLoading && (
            <View className="absolute inset-0 bg-white/70 z-10 justify-center items-center">
              <ActivityIndicator size="large" color="#ef4444" />
            </View>
          )}

          {/* Form Content */}
          <ScrollView className="px-6 py-4">
            {/* Row 1: Business Name & Email */}
            <View className="flex-row gap-4 mb-4">
              <View className="flex-1">
                <Text className="text-gray-700 text-sm mb-1.5">
                  Business Name <Text className="text-red-500">*</Text>
                </Text>
                <TextInput
                  className={`bg-white border rounded-lg px-3 py-2.5 text-gray-800 ${
                    errors.business_name ? "border-red-400" : "border-gray-200"
                  }`}
                  placeholder="Business Name"
                  placeholderTextColor="#9ca3af"
                  value={data.business_name}
                  onChangeText={handleNameChange}
                  maxLength={100}
                  autoFocus={!isEditMode}
                />
                {errors.business_name && (
                  <Text className="text-red-500 text-xs mt-1">
                    {errors.business_name}
                  </Text>
                )}

              </View>
              <View className="flex-1">
                <Text className="text-gray-700 text-sm mb-1.5">Email</Text>
                <TextInput
                  className={`bg-white border rounded-lg px-3 py-2.5 text-gray-800 ${
                    errors.email ? "border-red-400" : "border-gray-200"
                  }`}
                  placeholder="Email"
                  placeholderTextColor="#9ca3af"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  value={data.email || ""}
                  onChangeText={(v) =>
                    updateField("email", v || null)
                  }
                />
                {errors.email && (
                  <Text className="text-red-500 text-xs mt-1">
                    {errors.email}
                  </Text>
                )}
              </View>
            </View>

            {/* Row 2: Phone & Class of Trades */}
            <View className="flex-row gap-4 mb-4">
              <View className="flex-1">
                <Text className="text-gray-700 text-sm mb-1.5">
                  Business Phone Number
                </Text>
                <TextInput
                  className={`bg-white border rounded-lg px-3 py-2.5 text-gray-800 ${
                    errors.business_phone_no
                      ? "border-red-400"
                      : "border-gray-200"
                  }`}
                  placeholder="+1 (234) 567-8900"
                  placeholderTextColor="#9ca3af"
                  keyboardType="phone-pad"
                  value={data.business_phone_no || ""}
                  onChangeText={(v) =>
                    updateField("business_phone_no", v || null)
                  }
                />
                {errors.business_phone_no && (
                  <Text className="text-red-500 text-xs mt-1">
                    {errors.business_phone_no}
                  </Text>
                )}
              </View>
              <View className="flex-1">
                <Dropdown
                  label="Class of Trades *"
                  options={CLASS_OF_TRADES_OPTIONS}
                  value={data.class_of_trades}
                  onChange={(v) => updateField("class_of_trades", v)}
                />
                {errors.class_of_trades && (
                  <Text className="text-red-500 text-xs mt-1">
                    {errors.class_of_trades}
                  </Text>
                )}
              </View>
            </View>

            {/* Row 3: Customer Type & Sales Rep */}
            <View className="flex-row gap-4 mb-6">
              <View className="flex-1">
                <Dropdown
                  label="Customer Type"
                  options={CUSTOMER_TYPE_OPTIONS}
                  value={data.customer_type != null ? String(data.customer_type) : ""}
                  onChange={(v) =>
                    updateField("customer_type", v ? Number(v) : null)
                  }
                />
              </View>
              <View className="flex-1">
                <Dropdown
                  label="Sales Rep"
                  options={salesRepOptions}
                  value={
                    data.sale_agent_obj.value != null
                      ? String(data.sale_agent_obj.value)
                      : ""
                  }
                  onChange={(v) => {
                    const numVal = v ? Number(v) : null;
                    const rep = salesReps.find((u) => u.id === numVal);
                    updateField("sale_agent_obj", {
                      value: numVal,
                      label: rep
                        ? `${rep.first_name} ${rep.last_name}`
                        : "Please Select",
                      key: numVal,
                    });
                  }}
                />
              </View>
            </View>
          </ScrollView>

          {/* Search results overlay — floats on top, doesn't affect layout */}
          {showNameDropdown && !isEditMode && (
            <View
              style={{
                position: "absolute",
                top: 130,
                left: 24,
                right: 24,
                maxHeight: 240,
                backgroundColor: "#fff",
                borderWidth: 1,
                borderColor: "#d1d5db",
                borderRadius: 10,
                zIndex: 100,
                elevation: 20,
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.2,
                shadowRadius: 8,
              }}
            >
              {nameSearchLoading ? (
                <View style={{ padding: 14, alignItems: "center" }}>
                  <ActivityIndicator size="small" color="#ef4444" />
                </View>
              ) : nameSearchResults.length > 0 ? (
                <ScrollView nestedScrollEnabled style={{ maxHeight: 240 }}>
                  {nameSearchResults.map((c) => (
                    <TouchableOpacity
                      key={c.id}
                      onPress={() => handleSelectExistingCustomer(c)}
                      style={{
                        padding: 12,
                        borderBottomWidth: 1,
                        borderBottomColor: "#f3f4f6",
                        opacity: c.is_active === false ? 0.5 : 1,
                      }}
                    >
                      <Text style={{ fontSize: 13, fontWeight: "600", color: "#1f2937" }}>
                        {c.business_name}{c.name ? `, ${c.name}` : ""}
                      </Text>
                      <Text style={{ fontSize: 11, color: "#6b7280", marginTop: 2 }}>
                        Phone: {c.business_phone_no || "N/A"} | Email: {c.email || "N/A"}
                      </Text>
                      {c.no && (
                        <Text style={{ fontSize: 11, color: "#6b7280" }}>No: {c.no}</Text>
                      )}
                      {c.is_active === false && (
                        <Text style={{ fontSize: 11, color: "#ef4444", fontWeight: "500" }}>Inactive</Text>
                      )}
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              ) : (
                <View style={{ padding: 14, alignItems: "center" }}>
                  <Text style={{ fontSize: 12, color: "#9ca3af", fontStyle: "italic" }}>
                    No existing customer found
                  </Text>
                </View>
              )}
            </View>
          )}

          {/* Footer Actions */}
          <View className="flex-row gap-4 px-6 py-4 border-t border-gray-200">
            <Pressable
              onPress={handleClose}
              className="flex-1 border border-red-500 py-3 rounded-lg items-center"
              style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
              disabled={isLoading}
            >
              <Text className="text-red-500 font-semibold">Cancel</Text>
            </Pressable>
            <Pressable
              onPress={handleSave}
              className={`flex-1 py-3 rounded-lg items-center ${
                canSave ? "bg-red-500" : "bg-gray-300"
              }`}
              style={({ pressed }) => ({
                opacity: pressed && canSave ? 0.8 : 1,
              })}
              disabled={!canSave}
            >
              <Text
                className={`font-semibold ${
                  canSave ? "text-white" : "text-gray-500"
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
