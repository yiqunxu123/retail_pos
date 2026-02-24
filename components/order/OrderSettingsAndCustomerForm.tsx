/**
 * OrderSettingsAndCustomerForm - 订单设置与客户选择表单
 *
 * 用于 Add Note 弹窗，包含：
 * - Search for Customer by (Name/Business, ID/Number, Email/Phone)
 * - Payment Terms, Invoice Due Date, Order Number
 * - Shipping Type
 * - Notes (Internal), Notes (Print on Invoice)
 * - Add New Customer, Add Customer 按钮
 */

import { buttonSize, colors, iconSize } from "@/utils/theme";
import { Ionicons } from "@expo/vector-icons";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ComponentProps,
} from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import type { QuickCustomerResult } from "../AddQuickCustomerModal";
import { Dropdown } from "../Dropdown";
import type { CustomerEntity } from "../../utils/api/customers";
import { useCustomerSearch } from "../../utils/powersync/hooks";
import { toQuickCustomerResult } from "../SearchCustomerModal";

type SearchFieldKey =
  | "searchbyNameBusinessName"
  | "searchbyIdNumber"
  | "searchbyEmailAddressPhone";

type SearchInputState = Record<SearchFieldKey, string>;
type IoniconName = ComponentProps<typeof Ionicons>["name"];

const EMPTY_SEARCH_INPUTS: SearchInputState = {
  searchbyNameBusinessName: "",
  searchbyIdNumber: "",
  searchbyEmailAddressPhone: "",
};

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

const CUSTOMER_TYPE_LABELS: Record<number, string> = {
  1: "Walk In",
  2: "Online",
};

const TERM_DAY_MAP: Record<string, number> = {
  due_immediately: 0,
  net_15: 15,
  net_30: 30,
  net_45: 45,
  net_60: 60,
};

function formatBillingAddress(
  billing?: {
    address?: string;
    city?: string;
    county?: string;
    state?: string;
    country?: string;
  } | null
): string {
  if (!billing) return "";
  return [billing.address, billing.city, billing.county, billing.state, billing.country]
    .filter(Boolean)
    .join(", ");
}

function formatDueDate(value: Date): string {
  const day = String(value.getDate()).padStart(2, "0");
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const year = value.getFullYear();
  return `${day}/${month}/${year}`;
}

function calculateDueDate(paymentTerm: string): string {
  const days = TERM_DAY_MAP[paymentTerm] ?? 0;
  const base = new Date();
  const result = new Date(base);
  result.setDate(base.getDate() + days);
  return formatDueDate(result);
}

function normalizePaymentTerm(value: string): string {
  const lower = (value || "").trim().toLowerCase();
  if (!lower || lower === "due immediately") return "due_immediately";
  if (lower.includes("15")) return "net_15";
  if (lower.includes("30")) return "net_30";
  if (lower.includes("45")) return "net_45";
  if (lower.includes("60")) return "net_60";
  if (TERM_DAY_MAP[lower] != null) return lower;
  return "due_immediately";
}

function normalizeShippingType(value: string): string {
  const lower = (value || "").trim().toLowerCase();
  if (!lower || lower === "pick up") return "pickup";
  if (lower === "pickup") return "pickup";
  if (lower === "delivery") return "delivery";
  if (lower === "shipping") return "shipping";
  return "pickup";
}

function getCustomerTypeLabel(customerType: number | null | undefined): string {
  if (!customerType) return "N/A";
  return CUSTOMER_TYPE_LABELS[customerType] || "N/A";
}

function buildAutoOrderNumber(): string {
  const now = new Date();
  const yy = String(now.getFullYear()).slice(-2);
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  const hh = String(now.getHours()).padStart(2, "0");
  const min = String(now.getMinutes()).padStart(2, "0");
  return `SO-${yy}${mm}${dd}-${hh}${min}`;
}

function SearchResultCard({
  customer,
  onSelect,
}: {
  customer: CustomerEntity;
  onSelect: (customer: CustomerEntity) => void;
}) {
  return (
    <Pressable
      onPress={() => onSelect(customer)}
      className="border border-gray-200 rounded-xl px-3 py-3"
      style={({ pressed }) => ({
        backgroundColor: pressed ? "#f4f5f6" : colors.backgroundTertiary,
        opacity: customer.is_active === false ? 0.55 : 1,
      })}
    >
      <Text className="text-gray-900 text-sm font-semibold">
        {customer.business_name}
        {customer.name ? `, ${customer.name}` : ""}
      </Text>
      <Text className="text-gray-600 text-sm mt-1">
        Phone: {customer.business_phone_no || "N/A"}
      </Text>
      <Text className="text-gray-600 text-sm">Email: {customer.email || "N/A"}</Text>
      {formatBillingAddress(customer.customer_billing_details) !== "" && (
        <Text className="text-gray-600 text-sm">
          Address: {formatBillingAddress(customer.customer_billing_details)}
        </Text>
      )}
      <Text className="text-gray-600 text-sm">Customer No: {customer.no || "N/A"}</Text>
      <Text className="text-gray-600 text-sm">
        Customer Type: {getCustomerTypeLabel(customer.customer_type ?? null)}
      </Text>
      {customer.is_active === false && (
        <Text className="text-red-500 text-sm mt-0.5 font-medium">Inactive</Text>
      )}
    </Pressable>
  );
}

export interface OrderSettingsAndCustomerFormProps {
  orderSettings?: {
    paymentTerms?: string;
    shippingType?: string;
    orderNumber?: string;
    invoiceDueDate?: string;
    notesInternal?: string;
    notesInvoice?: string;
  };
  onOrderSettingsChange?: (settings: {
    paymentTerms?: string;
    shippingType?: string;
    orderNumber?: string;
    invoiceDueDate?: string;
    notesInternal?: string;
    notesInvoice?: string;
  }) => void;
  onSelectCustomer: (customer: QuickCustomerResult) => void;
  onDismiss: () => void;
  /** 点击 Add New Customer 时调用，由父级打开 AddQuickCustomerModal */
  onOpenAddQuickCustomer?: () => void;
}

const searchFields: {
  key: SearchFieldKey;
  placeholder: string;
  icon: IoniconName;
  zIndex: number;
}[] = [
  {
    key: "searchbyNameBusinessName",
    placeholder: "Customer Name/ Business Name",
    icon: "person-outline",
    zIndex: 30,
  },
  {
    key: "searchbyIdNumber",
    placeholder: "Customer Number ID/ Number",
    icon: "id-card-outline",
    zIndex: 20,
  },
  {
    key: "searchbyEmailAddressPhone",
    placeholder: "Customer Email Address",
    icon: "mail-outline",
    zIndex: 10,
  },
];

export function OrderSettingsAndCustomerForm({
  orderSettings,
  onOrderSettingsChange,
  onSelectCustomer,
  onDismiss,
  onOpenAddQuickCustomer,
}: OrderSettingsAndCustomerFormProps) {
  const [autoGenerate, setAutoGenerate] = useState(true);
  const [skipMsaCheck, setSkipMsaCheck] = useState(true);

  const [searchInputs, setSearchInputs] = useState<SearchInputState>(EMPTY_SEARCH_INPUTS);
  const [debouncedQuery, setDebouncedQuery] = useState("");

  const effectiveQuery = useMemo(
    () =>
      searchInputs.searchbyNameBusinessName.trim() ||
      searchInputs.searchbyIdNumber.trim() ||
      searchInputs.searchbyEmailAddressPhone.trim(),
    [searchInputs]
  );

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(effectiveQuery), 500);
    return () => clearTimeout(t);
  }, [effectiveQuery]);

  const { entities: searchResults, isLoading: searchLoading } = useCustomerSearch(debouncedQuery);

  const activeSearchField = useMemo<SearchFieldKey | null>(() => {
    if (searchInputs.searchbyNameBusinessName.trim()) return "searchbyNameBusinessName";
    if (searchInputs.searchbyIdNumber.trim()) return "searchbyIdNumber";
    if (searchInputs.searchbyEmailAddressPhone.trim()) return "searchbyEmailAddressPhone";
    return null;
  }, [searchInputs]);

  const paymentTermValue = useMemo(
    () => normalizePaymentTerm(orderSettings?.paymentTerms || ""),
    [orderSettings?.paymentTerms]
  );
  const shippingTypeValue = useMemo(
    () => normalizeShippingType(orderSettings?.shippingType || ""),
    [orderSettings?.shippingType]
  );

  const handleSearch = useCallback((text: string, fieldKey: SearchFieldKey) => {
    setSearchInputs((prev) => ({ ...prev, [fieldKey]: text }));
  }, []);

  const handleSelectCustomer = useCallback(
    (customer: CustomerEntity) => {
      if (customer.is_active === false) {
        Alert.alert(
          "Inactive Customer",
          "The customer is currently inactive. Please use an active customer."
        );
        return;
      }

      const mapped = toQuickCustomerResult(customer);
      onSelectCustomer(mapped);
      setSearchInputs(EMPTY_SEARCH_INPUTS);
    },
    [onSelectCustomer]
  );

  const handlePaymentTermChange = useCallback(
    (value: string) => {
      const normalized = normalizePaymentTerm(value);
      onOrderSettingsChange?.({
        ...orderSettings,
        paymentTerms: normalized,
        invoiceDueDate: calculateDueDate(normalized),
      });
    },
    [orderSettings, onOrderSettingsChange]
  );

  const handleShippingTypeChange = useCallback(
    (value: string) => {
      onOrderSettingsChange?.({
        ...orderSettings,
        shippingType: normalizeShippingType(value),
      });
    },
    [orderSettings, onOrderSettingsChange]
  );

  const handleToggleAutoGenerate = useCallback(() => {
    setAutoGenerate((prev) => {
      const next = !prev;
      if (next) {
        onOrderSettingsChange?.({
          ...orderSettings,
          orderNumber: buildAutoOrderNumber(),
        });
      }
      return next;
    });
  }, [orderSettings, onOrderSettingsChange]);

  return (
    <View style={formStyles.container}>
      <ScrollView
        style={formStyles.scrollView}
        contentContainerStyle={formStyles.scrollContent}
        showsVerticalScrollIndicator={true}
        keyboardShouldPersistTaps="handled"
      >
        <Text
          className="text-[#5A5F66] text-lg mb-1.5"
        >
          Search for Customer by:
        </Text>

        {searchFields.map((field) => {
          const isActive = activeSearchField === field.key;
          const isLoading = searchLoading;
          const showDropdown = isActive && !!searchInputs[field.key].trim();

          return (
            <View key={field.key} style={{ zIndex: field.zIndex, marginBottom: 14 }}>
              <View
                className="flex-row items-center bg-white border border-gray-200 rounded-xl px-3 py-3 shadow-sm"
                style={{ minHeight: buttonSize.md.height }}
              >
                <Ionicons name={field.icon} size={iconSize.base} color={colors.textTertiary} />
                <TextInput
                  className="flex-1 ml-3 text-gray-800 text-lg"
                  style={{ fontWeight: "500" }}
                  placeholder={field.placeholder}
                  placeholderTextColor={colors.borderMedium}
                  value={searchInputs[field.key]}
                  keyboardType="default"
                  autoCapitalize="none"
                  onFocus={() => {
                    if (searchInputs[field.key].trim()) {
                      setActiveSearchField(field.key);
                    }
                  }}
                  onChangeText={(text) => handleSearch(text, field.key)}
                />
                {isLoading && <ActivityIndicator size="small" color={colors.primary} />}
              </View>

              {showDropdown && (
                <View
                  className="absolute left-0 right-0 rounded-xl bg-white shadow-xl z-[100] overflow-hidden"
                  style={{ top: buttonSize.md.height + 8, maxHeight: 240, borderWidth: 1, borderColor: colors.border }}
                  >
                  {isLoading ? (
                    <View style={{ paddingVertical: 16, alignItems: "center" }}>
                      <ActivityIndicator size="small" color={colors.primary} />
                    </View>
                  ) : searchResults.length > 0 ? (
                    <ScrollView nestedScrollEnabled>
                      <View className="p-2 gap-2">
                        {searchResults.map((customer) => (
                          <SearchResultCard
                            key={customer.id}
                            customer={customer}
                            onSelect={handleSelectCustomer}
                          />
                        ))}
                      </View>
                    </ScrollView>
                  ) : (
                    <Text
                      style={{
                        padding: 12,
                        color: colors.textTertiary,
                        fontStyle: "italic",
                        textAlign: "center",
                      }}
                    >
                      No Data Found
                    </Text>
                  )}
                </View>
              )}
            </View>
          );
        })}

        <View className="mb-4">
          <Text className="text-[#5A5F66] text-lg mb-1.5">Payment Terms:</Text>
          <Dropdown
            options={PAYMENT_TERMS_OPTIONS}
            value={paymentTermValue}
            onChange={handlePaymentTermChange}
          />
        </View>

        <View className="mb-4">
          <Text className="text-[#5A5F66] text-lg mb-1.5">Invoice Due Date</Text>
          <View
            className="flex-row items-center justify-between bg-white border border-gray-200 rounded-xl px-3 py-3 shadow-sm"
          >
            <Text className="text-lg flex-1" style={{ color: colors.text }}>
              {orderSettings?.invoiceDueDate || "DD/MM/YYYY"}
            </Text>
            <Ionicons name="calendar-outline" size={iconSize.base} color={colors.textTertiary} />
          </View>
        </View>

        <View className="mb-4">
          <Text className="text-[#5A5F66] text-lg mb-1.5">Order Number:</Text>
          <TextInput
            className="bg-white border border-gray-200 rounded-xl px-3 py-3 text-gray-800 text-lg shadow-sm mb-3"
            placeholder="Enter Order Number"
            placeholderTextColor={colors.borderMedium}
            value={orderSettings?.orderNumber || ""}
            editable={!autoGenerate}
            onChangeText={(value) =>
              onOrderSettingsChange?.({ ...orderSettings, orderNumber: value })
            }
          />
          <Pressable className="flex-row items-center gap-2" onPress={handleToggleAutoGenerate}>
            <View
              className={`w-5 h-5 rounded border items-center justify-center ${
                autoGenerate ? "" : "border-gray-300"
              }`}
              style={
                autoGenerate
                  ? { borderColor: colors.primary, backgroundColor: colors.primary }
                  : undefined
              }
            >
              {autoGenerate && <Ionicons name="checkmark" size={14} color="white" />}
            </View>
            <Text className="text-sm font-medium" style={{ color: colors.text }}>
              Auto Generate
            </Text>
          </Pressable>
        </View>

        <View className="mb-4">
          <Text className="text-[#5A5F66] text-lg mb-1.5">Shipping Type</Text>
          <Dropdown
            options={SHIPPING_TYPE_OPTIONS}
            value={shippingTypeValue}
            onChange={handleShippingTypeChange}
          />
        </View>

        <View className="flex-row items-center justify-between mb-4">
          <View className="flex-row items-center gap-2">
            <Text className="text-lg font-medium" style={{ color: colors.text }}>
              Skip MSA Eligibility check
            </Text>
            <Switch
              value={skipMsaCheck}
              onValueChange={setSkipMsaCheck}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor="white"
            />
          </View>
        </View>

        <View className="mb-4">
          <Text className="text-[#5A5F66] text-lg mb-1.5">Notes (Internal)</Text>
          <TextInput
            className="bg-white border border-gray-200 rounded-xl px-3 py-3 text-gray-800 text-lg min-h-[100px] shadow-sm"
            style={{ textAlignVertical: "top" }}
            placeholder="Notes"
            placeholderTextColor={colors.borderMedium}
            value={orderSettings?.notesInternal || ""}
            onChangeText={(value) =>
              onOrderSettingsChange?.({ ...orderSettings, notesInternal: value })
            }
            multiline
          />
        </View>

        <View className="mb-4">
          <Text className="text-[#5A5F66] text-lg mb-1.5">Notes (Print on Invoice)</Text>
          <TextInput
            className="bg-white border border-gray-200 rounded-xl px-3 py-3 text-gray-800 text-lg min-h-[100px] shadow-sm"
            style={{ textAlignVertical: "top" }}
            placeholder="Notes"
            placeholderTextColor={colors.borderMedium}
            value={orderSettings?.notesInvoice || ""}
            onChangeText={(value) =>
              onOrderSettingsChange?.({ ...orderSettings, notesInvoice: value })
            }
            multiline
          />
        </View>

        {/* Add New Customer | Add Customer - 与页面内容融为一体 */}
        <View className="flex-row gap-3 mt-4 mb-8">
          <TouchableOpacity
            onPress={() => onOpenAddQuickCustomer?.()}
            className="flex-1 flex-row items-center justify-center gap-2 rounded-lg"
            style={[
              formStyles.btnOutline,
              { height: buttonSize.md.height },
            ]}
            activeOpacity={0.7}
          >
            <Ionicons name="add" size={iconSize.base} color={colors.primary} />
            <Text style={formStyles.btnOutlineText}>Add New Customer</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={onDismiss}
            className="flex-1 flex-row items-center justify-center rounded-lg"
            style={[
              formStyles.btnPrimary,
              { height: buttonSize.md.height },
            ]}
            activeOpacity={0.8}
          >
            <Text style={formStyles.btnPrimaryText}>Add Customer</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const formStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  btnPrimary: {
    backgroundColor: colors.primary,
    borderRadius: buttonSize.md.borderRadius,
  },
  btnPrimaryText: {
    color: colors.textWhite,
    fontSize: buttonSize.md.fontSize,
    fontWeight: "600",
  },
  btnOutline: {
    backgroundColor: colors.primaryLight,
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: buttonSize.md.borderRadius,
  },
  btnOutlineText: {
    color: colors.primary,
    fontSize: buttonSize.md.fontSize,
    fontWeight: "600",
  },
});
