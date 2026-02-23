import { buttonSize, colors } from '@/utils/theme';
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
  BackHandler,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { searchCustomers, type CustomerEntity } from "../utils/api/customers";
import { AddQuickCustomerModal, type QuickCustomerResult } from "./AddQuickCustomerModal";
import { Dropdown } from "./Dropdown";

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

export function toQuickCustomerResult(customer: CustomerEntity): QuickCustomerResult {
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
      className="border border-gray-200 rounded-lg px-3 py-2.5"
      style={({ pressed }) => ({
        backgroundColor: pressed ? "#f4f5f6" : colors.backgroundTertiary,
        opacity: customer.is_active === false ? 0.55 : 1,
      })}
    >
      <Text className="text-gray-900 text-sm font-semibold">
        {customer.business_name}
        {customer.name ? `, ${customer.name}` : ""}
      </Text>
      <Text className="text-gray-600 text-xs mt-1">
        Phone: {customer.business_phone_no || "N/A"}
      </Text>
      <Text className="text-gray-600 text-xs">Email: {customer.email || "N/A"}</Text>
      {formatBillingAddress(customer.customer_billing_details) !== "" && (
        <Text className="text-gray-600 text-xs">
          Address: {formatBillingAddress(customer.customer_billing_details)}
        </Text>
      )}
      <Text className="text-gray-600 text-xs">Customer No: {customer.no || "N/A"}</Text>
      <Text className="text-gray-600 text-xs">
        Customer Type: {getCustomerTypeLabel(customer.customer_type ?? null)}
      </Text>
      {customer.is_active === false && (
        <Text className="text-red-500 text-xs mt-0.5 font-medium">Inactive</Text>
      )}
    </Pressable>
  );
}

export interface SearchCustomerModalProps {
  visible: boolean;
  onClose: () => void;
  onSelectCustomer: (customer: QuickCustomerResult) => void;
  currentCustomer?: QuickCustomerResult | null;
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
}

function SearchCustomerModalImpl({
  visible,
  onClose,
  onSelectCustomer,
  currentCustomer,
  orderSettings,
  onOrderSettingsChange,
}: SearchCustomerModalProps) {
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const panelWidth = Math.max(1, Math.min(650, Math.round(width * 0.45)));
  const safeAreaPadding = useMemo(
    () =>
      Platform.OS === "android"
        ? {
            paddingTop: insets.top,
            paddingBottom: insets.bottom,
            paddingLeft: insets.left,
            paddingRight: insets.right,
          }
        : null,
    [insets.bottom, insets.left, insets.right, insets.top]
  );
  const [showQuickCustomerModal, setShowQuickCustomerModal] = useState(false);
  const [quickModalCustomerId, setQuickModalCustomerId] = useState<number | null>(null);
  const [autoGenerate, setAutoGenerate] = useState(true);
  const [skipMsaCheck, setSkipMsaCheck] = useState(true);

  const [searchInputs, setSearchInputs] = useState<SearchInputState>(EMPTY_SEARCH_INPUTS);
  const [searchResults, setSearchResults] = useState<CustomerEntity[]>([]);
  const [activeSearchField, setActiveSearchField] = useState<SearchFieldKey | null>(null);
  const [searchLoading, setSearchLoading] = useState<SearchFieldKey | null>(null);
  const debounceTimers = useRef<Partial<Record<SearchFieldKey, ReturnType<typeof setTimeout>>>>({});

  const paymentTermValue = useMemo(
    () => normalizePaymentTerm(orderSettings?.paymentTerms || ""),
    [orderSettings?.paymentTerms]
  );
  const shippingTypeValue = useMemo(
    () => normalizeShippingType(orderSettings?.shippingType || ""),
    [orderSettings?.shippingType]
  );

  useEffect(() => {
    if (!visible) {
      setSearchInputs(EMPTY_SEARCH_INPUTS);
      setSearchResults([]);
      setActiveSearchField(null);
      setSearchLoading(null);
    }
  }, [visible]);

  useEffect(() => {
    const timers = debounceTimers.current;
    return () => {
      Object.values(timers).forEach((timer) => {
        if (timer) clearTimeout(timer);
      });
    };
  }, []);

  useEffect(() => {
    if (!visible) return;
    const subscription = BackHandler.addEventListener("hardwareBackPress", () => {
      onClose();
      return true;
    });
    return () => subscription.remove();
  }, [onClose, visible]);

  const handleSearch = useCallback((text: string, fieldKey: SearchFieldKey) => {
    setSearchInputs((prev) => ({ ...prev, [fieldKey]: text }));

    const existingTimer = debounceTimers.current[fieldKey];
    if (existingTimer) clearTimeout(existingTimer);

    const trimmed = text.trim();
    if (!trimmed) {
      setSearchResults([]);
      setActiveSearchField(null);
      setSearchLoading(null);
      return;
    }

    setActiveSearchField(fieldKey);
    setSearchLoading(fieldKey);

    debounceTimers.current[fieldKey] = setTimeout(async () => {
      try {
        const res = await searchCustomers({
          [fieldKey]: trimmed,
          isActive: 1,
          sort_by: "id:asc",
        });
        setSearchResults(res.data.entities || []);
      } catch (error) {
        console.warn("[SearchCustomerModal] Search failed:", error);
        setSearchResults([]);
      } finally {
        setSearchLoading((prev) => (prev === fieldKey ? null : prev));
      }
    }, 500);
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
      setSearchResults([]);
      setActiveSearchField(null);
      setSearchLoading(null);
      setSearchInputs(EMPTY_SEARCH_INPUTS);
    },
    [onSelectCustomer]
  );

  const handleSaveQuickCustomer = useCallback(
    (customer: QuickCustomerResult) => {
      onSelectCustomer(customer);
      setQuickModalCustomerId(null);
      setShowQuickCustomerModal(false);
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

  const handleDismiss = useCallback(() => {
    onClose();
  }, [onClose]);

  return (
    <View pointerEvents="box-none" style={styles.rootContainer}>
      <View
        pointerEvents="none"
        style={[styles.backdrop, { opacity: visible ? 0.35 : 0 }]}
      />

      <View pointerEvents={visible ? "auto" : "none"} style={styles.touchGate}>
        <View
          style={[
            styles.panelHost,
            { width: panelWidth, transform: [{ translateX: visible ? 0 : -panelWidth }] },
          ]}
        >
          <View
            className="bg-white h-full border-r border-gray-200 rounded-tr-3xl rounded-br-3xl"
            style={[styles.panel, { width: panelWidth }, safeAreaPadding]}
          >
            <View className="px-6 pt-8 pb-4">
              <Text
                style={{ fontFamily: "Montserrat", fontSize: 24, fontWeight: "700", color: colors.primary }}
              >
                Add Customer
              </Text>

              <TouchableOpacity
                onPress={handleDismiss}
                style={{
                  position: "absolute",
                  top: 24,
                  right: 24,
                  width: buttonSize.md.height,
                  height: buttonSize.md.height,
                  borderRadius: 16,
                  backgroundColor: colors.primary,
                  alignItems: "center",
                  justifyContent: "center",
                  zIndex: 999,
                  elevation: 5,
                }}
                hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
                activeOpacity={0.7}
              >
                <Ionicons name="close" size={20} color="white" />
              </TouchableOpacity>

              <Text
                style={{ fontFamily: "Montserrat", fontSize: 16, fontWeight: "600", color: colors.text, marginTop: 12 }}
              >
                Search for Customer by:
              </Text>
            </View>

            <ScrollView
              className="flex-1"
              contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 300 }}
              showsVerticalScrollIndicator={false}
            >
              {searchFields.map((field) => {
                const isActive = activeSearchField === field.key;
                const isLoading = searchLoading === field.key;
                const showDropdown = isActive && !!searchInputs[field.key].trim();

                return (
                  <View key={field.key} style={{ zIndex: field.zIndex, marginBottom: 14 }}>
                    <View className="flex-row items-center bg-white rounded-lg px-3 py-3 shadow-sm" style={{ borderWidth: 1, borderColor: colors.border }}>
                      <Ionicons name={field.icon} size={22} color={colors.textTertiary} />
                      <TextInput
                        className="flex-1 ml-3 text-gray-800 text-[16px]"
                        style={{ fontFamily: "Montserrat", fontWeight: "500" }}
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
                        className="absolute top-[52px] left-0 right-0 rounded-lg bg-white shadow-xl z-[100] overflow-hidden"
                        style={{ maxHeight: 240, borderWidth: 1, borderColor: colors.border }}
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
                              fontFamily: "Montserrat",
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
                <Text style={{ fontFamily: "Montserrat", fontSize: 14, fontWeight: "600", color: colors.text, marginBottom: 8 }}>
                  Payment Terms:
                </Text>
                <Dropdown
                  options={PAYMENT_TERMS_OPTIONS}
                  value={paymentTermValue}
                  onChange={handlePaymentTermChange}
                />
              </View>

              <View className="mb-4">
                <Text style={{ fontFamily: "Montserrat", fontSize: 14, fontWeight: "600", color: colors.text, marginBottom: 8 }}>
                  Invoice Due Date
                </Text>
                <View className="flex-row items-center justify-between bg-white rounded-lg px-3 h-12 shadow-sm" style={{ borderWidth: 1, borderColor: colors.border }}>
                  <Text style={{ fontFamily: "Montserrat", color: colors.text, fontSize: 16 }}>
                    {orderSettings?.invoiceDueDate || "DD/MM/YYYY"}
                  </Text>
                  <Ionicons name="calendar-outline" size={20} color={colors.textTertiary} />
                </View>
              </View>

              <View className="mb-4">
                <Text style={{ fontFamily: "Montserrat", fontSize: 14, fontWeight: "600", color: colors.text, marginBottom: 8 }}>
                  Order Number:
                </Text>
                <TextInput
                  className="bg-white rounded-lg px-3 h-12 text-gray-800 shadow-sm mb-3 text-[16px]"
                  style={{ fontFamily: "Montserrat", borderWidth: 1, borderColor: colors.border }}
                  placeholder="Enter Order Number"
                  placeholderTextColor={colors.borderMedium}
                  value={orderSettings?.orderNumber || ""}
                  editable={!autoGenerate}
                  onChangeText={(value) =>
                    onOrderSettingsChange?.({ ...orderSettings, orderNumber: value })
                  }
                />
                <Pressable
                  className="flex-row items-center gap-2"
                  onPress={handleToggleAutoGenerate}
                >
                  <View
                    className={`w-5 h-5 rounded border items-center justify-center ${
                      autoGenerate ? "" : "border-gray-300"
                    }`}
                    style={autoGenerate ? { borderColor: colors.primary, backgroundColor: colors.primary } : undefined}
                  >
                    {autoGenerate && <Ionicons name="checkmark" size={14} color="white" />}
                  </View>
                  <Text style={{ fontFamily: "Montserrat", color: colors.text, fontSize: 14, fontWeight: "500" }}>
                    Auto Generate
                  </Text>
                </Pressable>
              </View>

              <View className="mb-4">
                <Text style={{ fontFamily: "Montserrat", fontSize: 14, fontWeight: "600", color: colors.text, marginBottom: 8 }}>
                  Shipping Type
                </Text>
                <Dropdown
                  options={SHIPPING_TYPE_OPTIONS}
                  value={shippingTypeValue}
                  onChange={handleShippingTypeChange}
                />
              </View>

              <View className="flex-row items-center justify-between mb-4">
                <View className="flex-row items-center gap-2">
                  <Text style={{ fontFamily: "Montserrat", color: colors.text, fontSize: 14, fontWeight: "600" }}>
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
                <Text style={{ fontFamily: "Montserrat", fontSize: 14, fontWeight: "600", color: colors.text, marginBottom: 8 }}>
                  Notes (Internal)
                </Text>
                <TextInput
                  className="bg-white rounded-lg px-3 py-3 text-gray-800 min-h-[100px] shadow-sm"
                  style={{ fontFamily: "Montserrat", textAlignVertical: "top", borderWidth: 1, borderColor: colors.border }}
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
                <Text style={{ fontFamily: "Montserrat", fontSize: 14, fontWeight: "600", color: colors.text, marginBottom: 8 }}>
                  Notes (Print on Invoice)
                </Text>
                <TextInput
                  className="bg-white rounded-lg px-3 py-3 text-gray-800 min-h-[100px] shadow-sm"
                  style={{ fontFamily: "Montserrat", textAlignVertical: "top", borderWidth: 1, borderColor: colors.border }}
                  placeholder="Notes"
                  placeholderTextColor={colors.borderMedium}
                  value={orderSettings?.notesInvoice || ""}
                  onChangeText={(value) =>
                    onOrderSettingsChange?.({ ...orderSettings, notesInvoice: value })
                  }
                  multiline
                />
              </View>
            </ScrollView>

            <View
              className="absolute bottom-0 left-0 right-0 flex-row gap-4 px-6 py-6 bg-white border-t border-gray-100 rounded-br-3xl"
              style={{ zIndex: 10, elevation: 10 }}
            >
              <TouchableOpacity
                onPress={() => {
                  setQuickModalCustomerId(null);
                  setShowQuickCustomerModal(true);
                }}
                className="flex-1 rounded-xl h-[208px] items-center justify-center flex-row gap-3"
                style={{ backgroundColor: colors.primaryLight }}
                activeOpacity={0.7}
              >
                <Ionicons name="add" size={40} color={colors.primary} />
                <Text style={{ fontFamily: "Montserrat", color: colors.primary, fontSize: 20, fontWeight: "700" }}>
                  Add New Customer
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleDismiss}
                className="flex-1 rounded-xl h-[208px] items-center justify-center shadow-lg"
                style={{ backgroundColor: colors.primary }}
                activeOpacity={0.8}
              >
                <Text style={{ fontFamily: "Montserrat", color: "white", fontSize: 20, fontWeight: "700" }}>
                  Add Customer
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <Pressable style={styles.backdropPressArea} onPress={handleDismiss} />
      </View>

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

const styles = StyleSheet.create({
  rootContainer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1000,
    elevation: 1000,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#000000",
  },
  touchGate: {
    ...StyleSheet.absoluteFillObject,
    flexDirection: "row",
  },
  panelHost: {
    height: "100%",
  },
  panel: {
    height: "100%",
    shadowColor: "#000000",
    shadowOpacity: 0.12,
    shadowRadius: 8,
    shadowOffset: { width: 2, height: 0 },
    elevation: 8,
  },
  backdropPressArea: {
    flex: 1,
  },
});

function areSearchCustomerModalPropsEqual(
  prev: SearchCustomerModalProps,
  next: SearchCustomerModalProps
): boolean {
  if (!prev.visible && !next.visible) return true;

  return (
    prev.visible === next.visible &&
    prev.onClose === next.onClose &&
    prev.onSelectCustomer === next.onSelectCustomer &&
    prev.currentCustomer === next.currentCustomer &&
    prev.orderSettings === next.orderSettings &&
    prev.onOrderSettingsChange === next.onOrderSettingsChange
  );
}

export const SearchCustomerModal = React.memo(
  SearchCustomerModalImpl,
  areSearchCustomerModalPropsEqual
);
SearchCustomerModal.displayName = "SearchCustomerModal";
