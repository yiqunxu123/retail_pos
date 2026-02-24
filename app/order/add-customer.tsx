import { colors, iconSize } from '@/utils/theme';
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";
import {
  AddQuickCustomerModal,
  type QuickCustomerResult,
} from "../../components/AddQuickCustomerModal";
import { Dropdown } from "../../components/Dropdown";
import { EditableStateInput } from "../../components/EditableStateInput";
import { SearchCustomerTemplate } from "../../components/SearchCustomerTemplate";
import { ThemedButton } from "../../components/ThemedButton";
import { useOrder } from "../../contexts/OrderContext";
import {
  getCustomerById,
  searchCustomers,
  type CustomerEntity,
} from "../../utils/api/customers";

const SEARCH_DEBOUNCE_MS = 500;

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

function toQuickCustomerResult(customer: CustomerEntity): QuickCustomerResult {
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
    sale_agent_obj: {
      label: customer.tenant_users
        ? `${customer.tenant_users.first_name} ${customer.tenant_users.last_name}`
        : "Please Select",
      value: customer.tenant_users?.id ?? null,
    },
  };
}

export default function AddCustomerScreen() {
  const router = useRouter();
  const { mode } = useLocalSearchParams<{ mode?: string | string[] }>();
  const { order, updateOrder } = useOrder();
  const routeMode = Array.isArray(mode) ? mode[0] : mode;
  const isChangeMode = routeMode === "change";

  const [showQuickCustomerModal, setShowQuickCustomerModal] = useState(false);
  const [quickModalCustomerId, setQuickModalCustomerId] = useState<number | null>(
    null
  );
  const [autoGenerate, setAutoGenerate] = useState(true);
  const [skipMsaCheck, setSkipMsaCheck] = useState(false);
  const [selectedCustomerData, setSelectedCustomerData] =
    useState<QuickCustomerResult | null>(null);
  const [isCustomerDetailsLoading, setIsCustomerDetailsLoading] = useState(false);
  const [customerDetailsError, setCustomerDetailsError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [searchResults, setSearchResults] = useState<CustomerEntity[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const modeInitRef = useRef(false);

  const paymentTermValue = useMemo(
    () => normalizePaymentTerm(order.paymentTerms),
    [order.paymentTerms]
  );
  const shippingTypeValue = useMemo(
    () => normalizeShippingType(order.shippingType),
    [order.shippingType]
  );

  const activeCustomer = selectedCustomerData;

  useEffect(() => {
    if (modeInitRef.current) return;
    modeInitRef.current = true;

    if (!isChangeMode && (order.customerId || order.customerName !== "Guest Customer")) {
      updateOrder({ customerName: "Guest Customer", customerId: null });
      setSelectedCustomerData(null);
      setIsCustomerDetailsLoading(false);
      setCustomerDetailsError(null);
    }
  }, [isChangeMode, order.customerId, order.customerName, updateOrder]);

  useEffect(() => {
    const updates: Partial<typeof order> = {};
    const normalizedTerm = normalizePaymentTerm(order.paymentTerms);
    const normalizedShipping = normalizeShippingType(order.shippingType);

    if (order.paymentTerms !== normalizedTerm) {
      updates.paymentTerms = normalizedTerm;
    }

    if (order.shippingType !== normalizedShipping) {
      updates.shippingType = normalizedShipping;
    }

    if (!order.invoiceDueDate || order.invoiceDueDate === "DD/MM/YYYY") {
      updates.invoiceDueDate = calculateDueDate(normalizedTerm);
    }

    if (Object.keys(updates).length > 0) {
      updateOrder(updates);
    }
  }, [order, updateOrder]);

  useEffect(() => {
    if (!autoGenerate || order.orderNumber) return;
    updateOrder({ orderNumber: buildAutoOrderNumber() });
  }, [autoGenerate, order.orderNumber, updateOrder]);

  useEffect(() => {
    if (!order.customerId) {
      setSelectedCustomerData(null);
      setIsCustomerDetailsLoading(false);
      setCustomerDetailsError(null);
      return;
    }

    if (!isChangeMode) {
      setIsCustomerDetailsLoading(false);
      setCustomerDetailsError(null);
      return;
    }

    const customerId = Number(order.customerId);
    if (Number.isNaN(customerId)) {
      setSelectedCustomerData(null);
      setIsCustomerDetailsLoading(false);
      setCustomerDetailsError("Invalid customer ID");
      return;
    }
    if (selectedCustomerData?.id === customerId) {
      setIsCustomerDetailsLoading(false);
      setCustomerDetailsError(null);
      return;
    }

    let cancelled = false;
    setSelectedCustomerData(null);
    setIsCustomerDetailsLoading(true);
    setCustomerDetailsError(null);

    getCustomerById(customerId)
      .then((res) => {
        if (!cancelled) {
          setSelectedCustomerData(toQuickCustomerResult(res.data.entity));
          setIsCustomerDetailsLoading(false);
          setCustomerDetailsError(null);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setSelectedCustomerData(null);
          setIsCustomerDetailsLoading(false);
          setCustomerDetailsError("Unable to load customer details");
        }
      });

    return () => {
      cancelled = true;
    };
  }, [isChangeMode, order.customerId, selectedCustomerData?.id]);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(searchQuery), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [searchQuery]);

  useEffect(() => {
    const trimmed = debouncedQuery.trim();
    if (!trimmed) {
      setSearchResults([]);
      setSearchLoading(false);
      return;
    }
    setSearchLoading(true);
    searchCustomers({
      searchbyNameBusinessName: trimmed,
      searchbyIdNumber: trimmed,
      searchbyEmailAddressPhone: trimmed,
      isActive: 1,
      sort_by: "id:asc",
    })
      .then((res) => setSearchResults(res.data.entities || []))
      .catch((err) => {
        console.warn("[AddCustomer] Search failed:", err);
        setSearchResults([]);
      })
      .finally(() => setSearchLoading(false));
  }, [debouncedQuery]);

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
      setSelectedCustomerData(mapped);
      setIsCustomerDetailsLoading(false);
      setCustomerDetailsError(null);
      updateOrder({
        customerName: mapped.business_name,
        customerId: String(mapped.id),
      });
      setSearchResults([]);
      setSearchQuery("");
    },
    [updateOrder]
  );

  const handleSaveQuickCustomer = useCallback(
    (customer: QuickCustomerResult) => {
      setSelectedCustomerData(customer);
      setIsCustomerDetailsLoading(false);
      setCustomerDetailsError(null);
      updateOrder({
        customerName: customer.business_name,
        customerId: String(customer.id),
      });
      setQuickModalCustomerId(null);
      setShowQuickCustomerModal(false);
    },
    [updateOrder]
  );

  const handleRemoveCustomer = useCallback(() => {
    setSelectedCustomerData(null);
    setIsCustomerDetailsLoading(false);
    setCustomerDetailsError(null);
    updateOrder({ customerName: "Guest Customer", customerId: null });
  }, [updateOrder]);

  const handlePaymentTermChange = useCallback(
    (value: string) => {
      const normalized = normalizePaymentTerm(value);
      updateOrder({
        paymentTerms: normalized,
        invoiceDueDate: calculateDueDate(normalized),
      });
    },
    [updateOrder]
  );

  const handleShippingTypeChange = useCallback(
    (value: string) => {
      updateOrder({ shippingType: normalizeShippingType(value) });
    },
    [updateOrder]
  );

  const handleToggleAutoGenerate = useCallback(() => {
    const next = !autoGenerate;
    setAutoGenerate(next);
    if (next) {
      updateOrder({ orderNumber: buildAutoOrderNumber() });
    }
  }, [autoGenerate, updateOrder]);

  return (
    <View className="flex-1 bg-[#F7F7F9] flex-row">
      <Pressable
        onPress={() => {}}
        className="bg-[#F7F7F9] h-full border-r border-gray-200"
        style={{ width: "50%" }}
      >
        <SearchCustomerTemplate
          title="Search for Customer by:"
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          searchPlaceholder="Customer Name / Business Name / ID / Email / Phone"
          customers={searchResults}
          isLoading={searchLoading}
          onSelectCustomer={handleSelectCustomer}
          emptyMessage="No customers found"
          rightContent={
            <ThemedButton
              title="Save"
              onPress={() => router.back()}
              size="md"
              style={{ backgroundColor: colors.primary }}
            />
          }
          listMaxHeight={280}
        />
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 12, paddingBottom: 18 }}
        >
            {!order.customerId && (
              <ThemedButton
                title="Add New Customer"
                icon="add"
                onPress={() => {
                  setQuickModalCustomerId(null);
                  setShowQuickCustomerModal(true);
                }}
                style={{ marginBottom: 16, backgroundColor: colors.primaryLight, borderWidth: 1, borderColor: colors.primary }}
                textStyle={{ color: colors.primary }}
              />
            )}

            <View className="bg-[#FFF8FA] border border-[#F5D4DF] rounded-xl px-4 py-3 mb-4">
              <Text className="text-[#C88A98] text-lg mb-0.5">Current Status:</Text>
              <Text className="text-[#1F2937] text-2xl font-bold mb-2">
                {activeCustomer?.business_name ||
                  (isCustomerDetailsLoading
                    ? "Loading customer..."
                    : isChangeMode && order.customerId
                      ? "Customer not available"
                      : "No customer selected")}
              </Text>

              {isCustomerDetailsLoading ? (
                <View className="py-2">
                  <ActivityIndicator size="small" color="#D71E55" />
                </View>
              ) : activeCustomer ? (
                <>
                  <Text className="text-[#5A5F66] text-sm">
                    Phone: {activeCustomer.business_phone_no || "N/A"}
                  </Text>
                  <Text className="text-[#5A5F66] text-sm">
                    Email: {activeCustomer.email || "N/A"}
                  </Text>
                  <Text className="text-[#5A5F66] text-sm">
                    Address: {formatBillingAddress(activeCustomer.customer_billing_details) || "N/A"}
                  </Text>
                  <Text className="text-[#5A5F66] text-sm">
                    Customer No: {activeCustomer.no || "N/A"}
                  </Text>
                  <Text className="text-[#5A5F66] text-sm mb-3">
                    Customer Type: {getCustomerTypeLabel(activeCustomer.customer_type)}
                  </Text>

                  <View className="flex-row gap-2">
                    <ThemedButton
                      title="Change Customer"
                      onPress={() => {
                        setQuickModalCustomerId(activeCustomer.id);
                        setShowQuickCustomerModal(true);
                      }}
                      fullWidth
                      style={{ flex: 1, backgroundColor: colors.primary }}
                    />
                    <ThemedButton
                      title="Remove Customer"
                      onPress={handleRemoveCustomer}
                      fullWidth
                      style={{ flex: 1, backgroundColor: colors.primary }}
                    />
                  </View>
                </>
              ) : customerDetailsError ? (
                <Text className="text-red-500 text-sm">{customerDetailsError}</Text>
              ) : (
                <Text className="text-[#6B7280] text-sm">
                  No customer selected.
                </Text>
              )}
            </View>

            <View className="mb-3">
              <Dropdown
                label="Payment Terms:"
                options={PAYMENT_TERMS_OPTIONS}
                value={paymentTermValue}
                onChange={handlePaymentTermChange}
              />
            </View>

            <View className="mb-3">
              <Text className="text-[#5A5F66] text-lg mb-1.5">Invoice Due Date</Text>
              <View className="flex-row items-center justify-between bg-[#F7F7F8] border border-[#E5E7EB] rounded-xl px-3 py-3">
                <Text className="text-[#9CA3AF] text-lg flex-1">{order.invoiceDueDate || "DD/MM/YYYY"}</Text>
                <Ionicons name="calendar-outline" size={iconSize.md} color={colors.textTertiary} />
              </View>
            </View>

            <View className="mb-3">
              <Text className="text-[#5A5F66] text-lg mb-1.5">Order Number:</Text>
              <EditableStateInput
                containerClassName="rounded-xl mb-2"
                containerStyle={{ backgroundColor: "#F7F7F8" }}
                inputClassName="px-3 py-3 text-lg"
                placeholder="Enter Order Number"
                value={order.orderNumber}
                editable={!autoGenerate}
                onChangeText={(value) => updateOrder({ orderNumber: value })}
              />
              <Pressable
                className="flex-row items-center gap-2"
                onPress={handleToggleAutoGenerate}
              >
                <View
                  className="w-5 h-5 rounded border-2 items-center justify-center"
                  style={{
                    borderColor: autoGenerate ? colors.primary : colors.border,
                    backgroundColor: autoGenerate ? colors.primary : "transparent",
                  }}
                >
                  {autoGenerate && <Ionicons name="checkmark" size={iconSize.xs} color="white" />}
                </View>
                <Text className="text-gray-700 text-lg">Auto Generate</Text>
              </Pressable>
            </View>

            <View className="mb-3">
              <Dropdown
                label="Shipping Type"
                options={SHIPPING_TYPE_OPTIONS}
                value={shippingTypeValue}
                onChange={handleShippingTypeChange}
              />
            </View>

            <View className="flex-row items-center gap-2 mb-3">
              <Text className="text-gray-700 text-lg">Skip MSA Eligibility check</Text>
              <Switch
                value={skipMsaCheck}
                onValueChange={setSkipMsaCheck}
                trackColor={{ false: colors.borderMedium, true: colors.primaryLight }}
                thumbColor={skipMsaCheck ? colors.primary : colors.background}
              />
            </View>

            <View className="mb-3">
              <Text className="text-[#5A5F66] text-lg mb-1.5">Notes (Internal)</Text>
              <TextInput
                className="bg-[#F7F7F8] border border-[#E5E7EB] rounded-xl px-3 py-3 text-gray-800 text-lg min-h-[100px]"
                placeholder="Notes"
                placeholderTextColor={colors.textTertiary}
                value={order.notesInternal}
                onChangeText={(value) => updateOrder({ notesInternal: value })}
                multiline
                textAlignVertical="top"
              />
            </View>

            <View className="mb-4">
              <Text className="text-[#5A5F66] text-lg mb-1.5">Notes (Print on Invoice)</Text>
              <TextInput
                className="bg-[#F7F7F8] border border-[#E5E7EB] rounded-xl px-3 py-3 text-gray-800 text-lg min-h-[100px]"
                placeholder="Notes"
                placeholderTextColor={colors.textTertiary}
                value={order.notesInvoice}
                onChangeText={(value) => updateOrder({ notesInvoice: value })}
                multiline
                textAlignVertical="top"
              />
            </View>

        </ScrollView>
      </Pressable>

      <Pressable className="flex-1" onPress={() => router.back()} />

      <AddQuickCustomerModal
        visible={showQuickCustomerModal}
        onClose={() => {
          setQuickModalCustomerId(null);
          setShowQuickCustomerModal(false);
        }}
        onSave={handleSaveQuickCustomer}
        customerId={quickModalCustomerId}
      />
    </View>
  );
}
