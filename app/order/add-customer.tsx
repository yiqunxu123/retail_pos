import { Ionicons } from "@expo/vector-icons";
import { useCallback, useRef, useState } from "react";
import {
    ActivityIndicator,
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
import { StepNavigation } from "../../components/StepNavigation";
import { useOrder } from "../../contexts/OrderContext";
import {
    searchCustomers,
    type CustomerEntity,
} from "../../utils/api/customers";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatBillingAddress(
  billing?: { address?: string; city?: string; county?: string; state?: string; country?: string } | null
): string {
  if (!billing) return "";
  return [billing.address, billing.city, billing.county, billing.state, billing.country]
    .filter(Boolean)
    .join(", ");
}

// ---------------------------------------------------------------------------
// Search result row
// ---------------------------------------------------------------------------

function CustomerSearchRow({
  customer,
  onSelect,
}: {
  customer: CustomerEntity;
  onSelect: (c: CustomerEntity) => void;
}) {
  return (
    <Pressable
      onPress={() => onSelect(customer)}
      className="border border-gray-200 rounded-lg p-3 mb-2"
      style={({ pressed }) => ({
        backgroundColor: pressed ? "#f3f4f6" : "#fff",
        opacity: customer.is_active === false ? 0.5 : 1,
      })}
    >
      <Text className="text-gray-900 font-semibold">
        {customer.business_name}
        {customer.name ? `, ${customer.name}` : ""}
      </Text>
      <Text className="text-gray-500 text-xs mt-1">
        Phone: {customer.business_phone_no || "N/A"}
      </Text>
      <Text className="text-gray-500 text-xs">
        Email: {customer.email || "N/A"}
      </Text>
      {formatBillingAddress(customer.customer_billing_details) !== "" && (
        <Text className="text-gray-500 text-xs">
          Address: {formatBillingAddress(customer.customer_billing_details)}
        </Text>
      )}
      <Text className="text-gray-500 text-xs">
        Customer No: {customer.no || "N/A"}
      </Text>
      <Text className="text-gray-500 text-xs">
        Customer Type:{" "}
        {customer.customer_type
          ? CUSTOMER_TYPE_LABELS[customer.customer_type] || "N/A"
          : "N/A"}
      </Text>
      {customer.is_active === false && (
        <Text className="text-red-500 text-xs font-medium mt-1">Inactive</Text>
      )}
    </Pressable>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function AddCustomerScreen() {
  const { order, updateOrder } = useOrder();
  const [showQuickCustomerModal, setShowQuickCustomerModal] = useState(false);
  const [autoGenerate, setAutoGenerate] = useState(true);
  const [skipMsaCheck, setSkipMsaCheck] = useState(false);
  const [paymentTerms, setPaymentTerms] = useState("due_immediately");
  const [shippingType, setShippingType] = useState("pickup");

  // --- Customer search state ---
  const [searchResults, setSearchResults] = useState<CustomerEntity[]>([]);
  const [activeSearchField, setActiveSearchField] = useState<string | null>(null);
  const [searchLoading, setSearchLoading] = useState<string | null>(null);
  const debounceTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  // Debounced search – mirrors web's 500ms debounce
  const handleSearch = useCallback(
    (text: string, fieldKey: string) => {
      // Clear previous timer for this field
      if (debounceTimers.current[fieldKey]) {
        clearTimeout(debounceTimers.current[fieldKey]);
      }

      if (!text.trim()) {
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
            [fieldKey]: text,
            isActive: 1,
          });
          setSearchResults(res.data.entities || []);
        } catch (err) {
          console.warn("[CustomerSearch] API error:", err);
          setSearchResults([]);
        } finally {
          setSearchLoading(null);
        }
      }, 500);
    },
    []
  );

  const handleSelectCustomer = useCallback(
    (customer: CustomerEntity) => {
      if (customer.is_active === false) return;
      updateOrder({
        customerName: customer.business_name,
        customerId: String(customer.id),
      });
      setSearchResults([]);
      setActiveSearchField(null);
    },
    [updateOrder]
  );

  const handleSaveQuickCustomer = (customer: QuickCustomerResult) => {
    updateOrder({
      customerName: customer.business_name,
      customerId: String(customer.id),
    });
    setShowQuickCustomerModal(false);
  };

  return (
    <View className="flex-1">
      <ScrollView className="flex-1" contentContainerClassName="p-5">
        <View className="bg-white rounded-lg border border-red-200">
          <View className="flex-row">
            {/* Left Column - Customer Search & Form */}
            <View className="flex-1 p-5 border-r border-gray-100">
              {/* Search by Name */}
              <View style={{ zIndex: 30, marginBottom: 12 }}>
                <View className="flex-row items-center bg-gray-50 border border-gray-200 rounded-lg px-3 py-3">
                  <Ionicons name="person-outline" size={20} color="#9ca3af" />
                  <TextInput
                    className="flex-1 ml-3 text-gray-800"
                    placeholder="Search by Customer Name/ Business Name"
                    placeholderTextColor="#9ca3af"
                    onChangeText={(v) =>
                      handleSearch(v, "searchbyNameBusinessName")
                    }
                  />
                  {searchLoading === "searchbyNameBusinessName" && (
                    <ActivityIndicator size="small" color="#9ca3af" />
                  )}
                </View>
                {activeSearchField === "searchbyNameBusinessName" && (
                  <View
                    className="border border-gray-200 rounded-lg mt-1"
                    style={{ maxHeight: 260, zIndex: 31, backgroundColor: "#fff" }}
                  >
                    {searchLoading === "searchbyNameBusinessName" ? (
                      <View style={{ padding: 16, alignItems: "center" }}>
                        <ActivityIndicator size="small" color="#ef4444" />
                      </View>
                    ) : searchResults.length > 0 ? (
                      <ScrollView nestedScrollEnabled>
                        {searchResults.map((c) => (
                          <CustomerSearchRow
                            key={c.id}
                            customer={c}
                            onSelect={handleSelectCustomer}
                          />
                        ))}
                      </ScrollView>
                    ) : (
                      <Text style={{ padding: 12, color: "#9ca3af", fontStyle: "italic", textAlign: "center" }}>
                        No Data Found
                      </Text>
                    )}
                  </View>
                )}
              </View>

              {/* Search by ID */}
              <View style={{ zIndex: 20, marginBottom: 12 }}>
                <View className="flex-row items-center bg-gray-50 border border-gray-200 rounded-lg px-3 py-3">
                  <Ionicons name="id-card-outline" size={20} color="#9ca3af" />
                  <TextInput
                    className="flex-1 ml-3 text-gray-800"
                    placeholder="Search by Customer Number ID/ Number"
                    placeholderTextColor="#9ca3af"
                    onChangeText={(v) =>
                      handleSearch(v, "searchbyIdNumber")
                    }
                  />
                  {searchLoading === "searchbyIdNumber" && (
                    <ActivityIndicator size="small" color="#9ca3af" />
                  )}
                </View>
                {activeSearchField === "searchbyIdNumber" && (
                  <View
                    className="border border-gray-200 rounded-lg mt-1"
                    style={{ maxHeight: 260, zIndex: 21, backgroundColor: "#fff" }}
                  >
                    {searchLoading === "searchbyIdNumber" ? (
                      <View style={{ padding: 16, alignItems: "center" }}>
                        <ActivityIndicator size="small" color="#ef4444" />
                      </View>
                    ) : searchResults.length > 0 ? (
                      <ScrollView nestedScrollEnabled>
                        {searchResults.map((c) => (
                          <CustomerSearchRow
                            key={c.id}
                            customer={c}
                            onSelect={handleSelectCustomer}
                          />
                        ))}
                      </ScrollView>
                    ) : (
                      <Text style={{ padding: 12, color: "#9ca3af", fontStyle: "italic", textAlign: "center" }}>
                        No Data Found
                      </Text>
                    )}
                  </View>
                )}
              </View>

              {/* Search by Email */}
              <View style={{ zIndex: 10, marginBottom: 16 }}>
                <View className="flex-row items-center bg-gray-50 border border-gray-200 rounded-lg px-3 py-3">
                  <Ionicons name="mail-outline" size={20} color="#9ca3af" />
                  <TextInput
                    className="flex-1 ml-3 text-gray-800"
                    placeholder="Search by Customer Email Address"
                    placeholderTextColor="#9ca3af"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    onChangeText={(v) =>
                      handleSearch(v, "searchbyEmailAddressPhone")
                    }
                  />
                  {searchLoading === "searchbyEmailAddressPhone" && (
                    <ActivityIndicator size="small" color="#9ca3af" />
                  )}
                </View>
                {activeSearchField === "searchbyEmailAddressPhone" && (
                  <View
                    className="border border-gray-200 rounded-lg mt-1"
                    style={{ maxHeight: 260, zIndex: 11, backgroundColor: "#fff" }}
                  >
                    {searchLoading === "searchbyEmailAddressPhone" ? (
                      <View style={{ padding: 16, alignItems: "center" }}>
                        <ActivityIndicator size="small" color="#ef4444" />
                      </View>
                    ) : searchResults.length > 0 ? (
                      <ScrollView nestedScrollEnabled>
                        {searchResults.map((c) => (
                          <CustomerSearchRow
                            key={c.id}
                            customer={c}
                            onSelect={handleSelectCustomer}
                          />
                        ))}
                      </ScrollView>
                    ) : (
                      <Text style={{ padding: 12, color: "#9ca3af", fontStyle: "italic", textAlign: "center" }}>
                        No Data Found
                      </Text>
                    )}
                  </View>
                )}
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
                  <Text className="text-gray-600 text-sm mb-1.5">
                    Invoice Due Date
                  </Text>
                  <Pressable className="flex-row items-center justify-between bg-white border border-gray-200 rounded-lg px-3 py-2.5">
                    <Text className="text-gray-400">
                      {order.invoiceDueDate}
                    </Text>
                    <Ionicons
                      name="calendar-outline"
                      size={18}
                      color="#9ca3af"
                    />
                  </Pressable>
                </View>
              </View>

              {/* Order Number */}
              <View className="mb-4">
                <Text className="text-gray-600 text-sm mb-1.5">
                  Order Number:
                </Text>
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
                      autoGenerate
                        ? "border-red-500 bg-red-500"
                        : "border-gray-300"
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
                <Text className="text-gray-600 text-sm">
                  Skip MSA Eligibility check
                </Text>
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
                  <Text className="text-gray-600 text-sm mb-1.5">
                    Notes (Internal)
                  </Text>
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
                  <Text className="text-gray-600 text-sm mb-1.5">
                    Notes (Print on Invoice)
                  </Text>
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
            <View className="w-72 p-5 bg-gray-50">
              <Text className="text-gray-500 text-sm text-center mb-1">
                Current Status:
              </Text>
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
                <Text className="text-white font-semibold">
                  Add Quick Customer
                </Text>
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
