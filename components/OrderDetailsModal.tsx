import { buttonSize, colors, iconSize } from '@/utils/theme';
import { ThemedButton } from './ThemedButton';
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useState } from "react";
import { Modal, Pressable, ScrollView, Text, TouchableOpacity, View } from "react-native";

interface OrderItem {
  id: string;
  srNo: number;
  name: string;
  sku: string;
  upc?: string;
  orderedQty: number;
  unit: string;
  deliveredQty: number;
  remainingQty: number;
  salePrice: number;
  discount: number;
}

interface PaymentRecord {
  id: string;
  method: string;
  amount: number;
  date: string;
  status: "completed" | "pending" | "refunded";
}

interface OrderDetails {
  id: string;
  orderNumber: string;
  date: string;
  status: "completed" | "pending" | "cancelled" | "refunded";
  orderType?: string;
  shippingType?: string;
  channelName?: string;
  invoiceStatus?: "Paid" | "Unpaid" | "Partial";
  customer: {
    name: string;
    email?: string;
    phone?: string;
  };
  cashier?: string;
  items: OrderItem[];
  payments: PaymentRecord[];
  subTotal: number;
  discount: number;
  tax: number;
  total: number;
  amountPaid?: number;
  note?: string;
  createdBy: string;
}

interface OrderDetailsModalProps {
  visible: boolean;
  onClose: () => void;
  order: OrderDetails | null;
  onPrintReceipt?: () => void;
  onRefund?: () => void;
}

// Tab options
const TABS = ["Order Details", "Shipments", "Payment History", "Invoice Activity", "Notes"] as const;
type TabType = typeof TABS[number];

/**
 * OrderDetailsModal - View complete order information
 * Matches Figma design with info cards, tabs, and detailed table
 */
export function OrderDetailsModal({
  visible,
  onClose,
  order,
  onPrintReceipt,
}: OrderDetailsModalProps) {
  const [activeTab, setActiveTab] = useState<TabType>("Order Details");
  
  if (!order) {
    return null;
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString("en-US", {
      month: "2-digit",
      day: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  // Info card component
  const InfoCard = ({ label, value, valueColor = colors.primary, bgColor }: { 
    label: string; 
    value: string; 
    valueColor?: string;
    bgColor?: string;
  }) => (
    <View 
      className="flex-1 border border-gray-200 rounded-lg p-3 min-w-[120px] shadow-sm"
      style={bgColor ? { backgroundColor: bgColor } : { backgroundColor: colors.backgroundTertiary }}
    >
      <Text className="text-gray-600 text-sm mb-1">{label}</Text>
      <Text className="text-base font-medium" style={{ color: valueColor }} numberOfLines={1}>
        {value}
      </Text>
    </View>
  );

  // Invoice status badge
  const InvoiceStatusBadge = ({ status }: { status: string }) => {
      const colors_map: Record<string, { bg: string; text: string }> = {
      Paid: { bg: colors.success, text: colors.textWhite },
      Unpaid: { bg: colors.error, text: colors.textWhite },
      Partial: { bg: colors.warning, text: colors.textWhite },
    };
    const color = colors_map[status] || colors_map.Unpaid;
    return (
      <View className="px-3 py-1 rounded" style={{ backgroundColor: color.bg }}>
        <Text className="text-sm font-semibold" style={{ color: color.text }}>{status}</Text>
      </View>
    );
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-black/50 justify-center items-center">
        <View
          className="bg-white rounded-xl overflow-hidden"
          style={{ width: 800, maxHeight: "90%" }}
        >
          {/* Header */}
          <View className="flex-row justify-between items-center px-6 py-4 border-b border-gray-200">
            <Text className="text-xl font-bold text-gray-800">Order Details</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={iconSize.xl} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Divider line */}
          <View className="h-[1px] bg-gray-200 mx-6" />

          <ScrollView style={{ maxHeight: 600 }} showsVerticalScrollIndicator={false}>
            {/* Info Cards Row 1 */}
            <View className="px-6 pt-4 pb-2">
              <View className="flex-row gap-4">
                <InfoCard 
                  label="Customer Name" 
                  value={order.customer.name} 
                />
                <InfoCard 
                  label="Cashier" 
                  value={order.cashier || order.createdBy || "Cashier 1"} 
                />
                <InfoCard 
                  label="Order Type" 
                  value={order.orderType || "Walk In"} 
                  valueColor={colors.text}
                />
                <InfoCard 
                  label="Order Number" 
                  value={order.orderNumber} 
                />
                <InfoCard 
                  label="Order Date/Time" 
                  value={formatDate(order.date)} 
                />
                <InfoCard 
                  label="Shipping Type" 
                  value={order.shippingType || "Pickup"} 
                />
              </View>
            </View>

            {/* Info Cards Row 2 */}
            <View className="px-6 pb-4">
              <View className="flex-row gap-4">
                <InfoCard 
                  label="Chanel Name" 
                  value={order.channelName || "Primary"} 
                />
                <InfoCard 
                  label="Sub Total" 
                  value={`$${order.subTotal.toFixed(2)}`} 
                  valueColor={colors.text}
                />
                <InfoCard 
                  label="Discount" 
                  value={`$${order.discount.toFixed(2)}`} 
                  valueColor={colors.text}
                />
                <View 
                  className="flex-1 border border-gray-200 rounded-lg p-3 min-w-[120px]"
                  style={{ backgroundColor: "#FEF08A" }}
                >
                  <Text className="text-gray-600 text-sm mb-1">Total</Text>
                  <Text className="text-base font-bold" style={{ color: colors.success }}>
                    ${order.total.toFixed(2)}
                  </Text>
                </View>
                <View className="flex-1 border border-gray-200 rounded-lg p-3 min-w-[120px]" style={{ backgroundColor: colors.backgroundTertiary }}>
                  <Text className="text-gray-600 text-sm mb-1">Invoice Status</Text>
                  <InvoiceStatusBadge status={order.invoiceStatus || "Paid"} />
                </View>
                <InfoCard 
                  label="Amount Paid" 
                  value={`$${(order.amountPaid ?? order.total).toFixed(2)}`} 
                />
              </View>
            </View>

            {/* Tabs */}
            <View className="px-6 border-b border-gray-200">
              <View className="flex-row">
                {TABS.map((tab) => {
                  const isActive = activeTab === tab;
                  return (
                    <Pressable
                      key={tab}
                      onPress={() => setActiveTab(tab)}
                      className="mr-6 pb-3"
                      style={isActive ? { borderBottomWidth: 2, borderBottomColor: colors.text } : undefined}
                    >
                      <Text 
                        style={{ 
                          color: isActive ? colors.text : colors.textTertiary, 
                          fontWeight: isActive ? '600' : '400',
                          fontSize: 16,
                        }}
                      >
                        {tab}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            {/* Tab Content */}
            <View className="px-6 py-4">
              {activeTab === "Order Details" && (
                <>
                  {order.items.length === 0 ? (
                    <View className="rounded-lg p-8 items-center shadow-sm" style={{ backgroundColor: colors.backgroundTertiary }}>
                      <Ionicons name="cube-outline" size={iconSize['4xl']} color={colors.textTertiary} />
                      <Text className="text-gray-500 mt-3 text-lg">No items in this order</Text>
                      <Text className="text-gray-400 text-sm mt-1">
                        Order items will be shown here when loaded from database
                      </Text>
                    </View>
                  ) : (
                    <>
                      {/* Table Header */}
                      <View className="flex-row px-3 py-3 rounded-t-lg border border-gray-200 shadow-sm" style={{ backgroundColor: colors.backgroundTertiary }}>
                        <Text className="w-12 text-gray-600 text-sm font-semibold">Sr No</Text>
                        <Text className="flex-1 text-gray-600 text-sm font-semibold">Product Name</Text>
                        <Text className="w-24 text-gray-600 text-sm font-semibold">SKU/UPC</Text>
                        <Text className="w-20 text-gray-600 text-sm font-semibold text-center">Ordered Qty</Text>
                        <Text className="w-16 text-gray-600 text-sm font-semibold text-center">Unit</Text>
                        <Text className="w-20 text-gray-600 text-sm font-semibold text-center">Delivered Qty</Text>
                        <Text className="w-20 text-gray-600 text-sm font-semibold text-center">Remaining Qty</Text>
                        <Text className="w-20 text-gray-600 text-sm font-semibold text-right">Sale Price</Text>
                        <Text className="w-16 text-gray-600 text-sm font-semibold text-right">Discount</Text>
                      </View>

                      {/* Table Body */}
                      {order.items.map((item, index) => (
                        <View
                          key={item.id}
                          className={`flex-row items-center px-3 py-3 border-l border-r border-b border-gray-200 ${
                            index === order.items.length - 1 ? "rounded-b-lg" : ""
                          }`}
                        >
                          <Text className="w-12 text-gray-800 text-sm">{item.srNo || index + 1}</Text>
                          <Text className="flex-1 text-gray-800 text-sm" numberOfLines={1}>
                            {item.name}
                          </Text>
                          <Text className="w-24 text-blue-600 text-sm">{item.sku}{item.upc ? ` / ${item.upc}` : ""}</Text>
                          <Text className="w-20 text-gray-800 text-sm text-center">{item.orderedQty}</Text>
                          <Text className="w-16 text-sm text-center" style={{ color: colors.primary }}>{item.unit}</Text>
                          <Text className="w-20 text-gray-800 text-sm text-center">{item.deliveredQty}</Text>
                          <Text className="w-20 text-gray-800 text-sm text-center">{item.remainingQty}</Text>
                          <Text className="w-20 text-sm text-right" style={{ color: colors.primary }}>${item.salePrice.toFixed(2)}</Text>
                          <Text className="w-16 text-gray-800 text-sm text-right">${item.discount}</Text>
                        </View>
                      ))}
                    </>
                  )}
                </>
              )}

              {activeTab === "Shipments" && (
                <View className="rounded-lg p-8 items-center shadow-sm" style={{ backgroundColor: colors.backgroundTertiary }}>
                  <MaterialCommunityIcons name="truck-delivery-outline" size={iconSize['4xl']} color={colors.textTertiary} />
                  <Text className="text-gray-500 mt-3 text-lg">No shipment records</Text>
                  <Text className="text-gray-400 text-sm mt-1">Shipment details will appear here</Text>
                </View>
              )}

              {activeTab === "Payment History" && (
                <>
                  {order.payments.length === 0 ? (
                    <View className="rounded-lg p-8 items-center shadow-sm" style={{ backgroundColor: colors.backgroundTertiary }}>
                      <MaterialCommunityIcons name="cash-multiple" size={iconSize['4xl']} color={colors.textTertiary} />
                      <Text className="text-gray-500 mt-3 text-lg">No payment records</Text>
                      <Text className="text-gray-400 text-sm mt-1">Payment history will appear here</Text>
                    </View>
                  ) : (
                    <View className="gap-2">
                      {order.payments.map((payment) => (
                        <View
                          key={payment.id}
                          className="flex-row items-center rounded-lg px-4 py-3 shadow-sm"
                          style={{ backgroundColor: colors.backgroundTertiary }}
                        >
                          <View className="w-10 h-10 bg-green-100 rounded-full items-center justify-center mr-3">
                            <MaterialCommunityIcons
                              name={payment.method === "cash" ? "cash" : "credit-card"}
                              size={iconSize.base}
                              color={colors.success}
                            />
                          </View>
                          <View className="flex-1">
                            <Text className="text-gray-800 font-medium">
                              {payment.method.charAt(0).toUpperCase() + payment.method.slice(1)} Payment
                            </Text>
                            <Text className="text-gray-500 text-sm">{formatDate(payment.date)}</Text>
                          </View>
                          <Text className="text-green-600 font-bold text-lg">
                            ${payment.amount.toFixed(2)}
                          </Text>
                        </View>
                      ))}
                    </View>
                  )}
                </>
              )}

              {activeTab === "Invoice Activity" && (
                <View className="rounded-lg p-8 items-center shadow-sm" style={{ backgroundColor: colors.backgroundTertiary }}>
                  <Ionicons name="document-text-outline" size={iconSize['4xl']} color={colors.textTertiary} />
                  <Text className="text-gray-500 mt-3 text-lg">No invoice activity</Text>
                  <Text className="text-gray-400 text-sm mt-1">Invoice activity will appear here</Text>
                </View>
              )}

              {activeTab === "Notes" && (
                <>
                  {order.note ? (
                    <View className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
                      <Text className="text-gray-700">{order.note}</Text>
                    </View>
                  ) : (
                    <View className="rounded-lg p-8 items-center shadow-sm" style={{ backgroundColor: colors.backgroundTertiary }}>
                      <Ionicons name="chatbubble-outline" size={iconSize['4xl']} color={colors.textTertiary} />
                      <Text className="text-gray-500 mt-3 text-lg">No notes</Text>
                      <Text className="text-gray-400 text-sm mt-1">Order notes will appear here</Text>
                    </View>
                  )}
                </>
              )}
            </View>
          </ScrollView>

          {/* Footer Actions */}
          <View className="flex-row gap-4 px-6 py-4 border-t border-gray-200 justify-end">
            <ThemedButton
              title="Close"
              variant="outline"
              onPress={onClose}
            />
            {onPrintReceipt && (
              <ThemedButton
                title="Print"
                icon="print"
                onPress={onPrintReceipt}
                style={{ backgroundColor: colors.warning }}
                textStyle={{ color: colors.text }}
              />
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
}
