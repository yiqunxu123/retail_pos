import { buttonSize, colors, iconSize, modalContent } from '@/utils/theme';
import { ThemedButton } from './ThemedButton';
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useMemo, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { CenteredModal } from "./CenteredModal";
import { PAYMENT_TYPE, useInvoiceWithPayments, useSaleOrderDetails } from "@/utils/powersync/hooks";

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
  /** When set, fetches real items and payments from PowerSync (invoice-linked) */
  saleOrderId?: string | null;
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
  saleOrderId,
  onPrintReceipt,
}: OrderDetailsModalProps) {
  const [activeTab, setActiveTab] = useState<TabType>("Order Details");

  const { items: detailItems } = useSaleOrderDetails(saleOrderId ?? null);
  const { payments: invoicePayments } = useInvoiceWithPayments(saleOrderId ?? null);

  const mergedOrder = useMemo<OrderDetails | null>(() => {
    if (!order) return null;
    const items = detailItems.length > 0 ? detailItems.map((it) => ({ ...it })) : order.items;
    const payments: PaymentRecord[] = invoicePayments.length > 0
      ? invoicePayments.map((p) => ({
          id: p.id,
          method: PAYMENT_TYPE[p.paymentType as keyof typeof PAYMENT_TYPE] || "Other",
          amount: p.amount,
          date: p.paymentDate || p.createdAt,
          status: p.status === 1 ? "completed" : p.status === 3 ? "refunded" : "pending",
        }))
      : order.payments;
    return { ...order, items, payments };
  }, [order, detailItems, invoicePayments]);

  if (!mergedOrder) {
    return null;
  }

  const orderToShow = mergedOrder;

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
      className="flex-1 shadow-sm"
      style={[
        bgColor ? { backgroundColor: bgColor } : { backgroundColor: modalContent.boxBackground },
        { minWidth: "12%", padding: modalContent.boxPadding, borderRadius: modalContent.boxRadius, borderWidth: modalContent.boxBorderWidth, borderColor: modalContent.boxBorderColor },
      ]}
    >
      <Text className="mb-1" style={{ fontSize: modalContent.labelFontSize, color: modalContent.labelColor }}>{label}</Text>
      <Text style={{ fontSize: modalContent.valueFontSize, fontWeight: modalContent.valueFontWeight, color: valueColor }} numberOfLines={1}>
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
    <CenteredModal
      visible={visible}
      onClose={onClose}
      size="md"
      title="Order Details"
      scrollable={false}
      contentPadding={false}
      footer={
        <>
          <ThemedButton title="Close" variant="outline" onPress={onClose} />
          {onPrintReceipt && (
            <ThemedButton
              title="Print"
              icon="print"
              onPress={onPrintReceipt}
              style={{ backgroundColor: colors.warning }}
              textStyle={{ color: colors.text }}
            />
          )}
        </>
      }
    >
      <View className="rounded-xl overflow-hidden flex-1">
        <View className="h-[1px] bg-gray-200" style={{ marginHorizontal: "5%" }} />
        <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
            {/* Info Cards Row 1 */}
            <View style={{ paddingHorizontal: "5%", paddingTop: 16, paddingBottom: 8 }}>
              <View className="flex-row gap-4">
                <InfoCard 
                  label="Customer Name" 
                  value={orderToShow.customer.name} 
                />
                <InfoCard 
                  label="Cashier" 
                  value={orderToShow.cashier || orderToShow.createdBy || "Cashier 1"} 
                />
                <InfoCard 
                  label="Order Type" 
                  value={orderToShow.orderType || "Walk In"} 
                  valueColor={colors.text}
                />
                <InfoCard 
                  label="Order Number" 
                  value={orderToShow.orderNumber} 
                />
                <InfoCard 
                  label="Order Date/Time" 
                  value={formatDate(orderToShow.date)} 
                />
                <InfoCard 
                  label="Shipping Type" 
                  value={orderToShow.shippingType || "Pickup"} 
                />
              </View>
            </View>

            {/* Info Cards Row 2 */}
            <View style={{ paddingHorizontal: "5%", paddingBottom: 16 }}>
              <View className="flex-row gap-4">
                <InfoCard 
                  label="Chanel Name" 
                  value={orderToShow.channelName || "Primary"} 
                />
                <InfoCard 
                  label="Sub Total" 
                  value={`$${orderToShow.subTotal.toFixed(2)}`} 
                  valueColor={colors.text}
                />
                <InfoCard 
                  label="Discount" 
                  value={`$${orderToShow.discount.toFixed(2)}`} 
                  valueColor={colors.text}
                />
                <View 
                  className="flex-1"
                  style={{ backgroundColor: "#FEF08A", minWidth: "12%", padding: modalContent.boxPadding, borderRadius: modalContent.boxRadius, borderWidth: modalContent.boxBorderWidth, borderColor: modalContent.boxBorderColor }}
                >
                  <Text className="mb-1" style={{ fontSize: modalContent.labelFontSize, color: modalContent.labelColor }}>Total</Text>
                  <Text className="text-base font-bold" style={{ color: colors.success }}>
                    ${orderToShow.total.toFixed(2)}
                  </Text>
                </View>
                <View className="flex-1" style={{ backgroundColor: modalContent.boxBackground, minWidth: "12%", padding: modalContent.boxPadding, borderRadius: modalContent.boxRadius, borderWidth: modalContent.boxBorderWidth, borderColor: modalContent.boxBorderColor }}>
                  <Text className="mb-1" style={{ fontSize: modalContent.labelFontSize, color: modalContent.labelColor }}>Invoice Status</Text>
                  <InvoiceStatusBadge status={orderToShow.invoiceStatus || "Paid"} />
                </View>
                <InfoCard 
                  label="Amount Paid" 
                  value={`$${(orderToShow.amountPaid ?? orderToShow.total).toFixed(2)}`} 
                />
              </View>
            </View>

            {/* Tabs */}
            <View style={{ paddingHorizontal: "5%" }} className="border-b border-gray-200">
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
            <View style={{ paddingHorizontal: "5%", paddingVertical: 16 }}>
              {activeTab === "Order Details" && (
                <>
                  {orderToShow.items.length === 0 ? (
                    <View className="rounded-lg items-center shadow-sm" style={{ backgroundColor: colors.backgroundTertiary, padding: "8%" }}>
                      <Ionicons name="cube-outline" size={iconSize['4xl']} color={colors.textTertiary} />
                      <Text className="text-gray-500 mt-3 text-lg">No items in this order</Text>
                      <Text className="text-gray-400 text-sm mt-1">
                        Order items will be shown here when loaded from database
                      </Text>
                    </View>
                  ) : (
                    <>
                      {/* Table Header */}
                      <View className="flex-row py-3 rounded-t-lg border border-gray-200 shadow-sm" style={{ backgroundColor: colors.backgroundTertiary, paddingHorizontal: "3%" }}>
                        <Text style={{ width: "6%", color: colors.textSecondary, fontSize: 14, fontWeight: "600" }}>Sr No</Text>
                        <Text className="flex-1 text-gray-600 text-sm font-semibold">Product Name</Text>
                        <Text style={{ width: "16%", color: colors.textSecondary, fontSize: 14, fontWeight: "600" }}>SKU/UPC</Text>
                        <Text style={{ width: "12%", color: colors.textSecondary, fontSize: 14, fontWeight: "600", textAlign: "center" }}>Ordered Qty</Text>
                        <Text style={{ width: "8%", color: colors.textSecondary, fontSize: 14, fontWeight: "600", textAlign: "center" }}>Unit</Text>
                        <Text style={{ width: "12%", color: colors.textSecondary, fontSize: 14, fontWeight: "600", textAlign: "center" }}>Delivered Qty</Text>
                        <Text style={{ width: "12%", color: colors.textSecondary, fontSize: 14, fontWeight: "600", textAlign: "center" }}>Remaining Qty</Text>
                        <Text style={{ width: "12%", color: colors.textSecondary, fontSize: 14, fontWeight: "600", textAlign: "right" }}>Sale Price</Text>
                        <Text style={{ width: "10%", color: colors.textSecondary, fontSize: 14, fontWeight: "600", textAlign: "right" }}>Discount</Text>
                      </View>

                      {/* Table Body */}
                      {orderToShow.items.map((item, index) => (
                        <View
                          key={item.id}
                          style={{ paddingHorizontal: "3%", paddingVertical: 12 }}
                          className={`flex-row items-center border-l border-r border-b border-gray-200 ${
                            index === orderToShow.items.length - 1 ? "rounded-b-lg" : ""
                          }`}
                        >
                          <Text style={{ width: "6%", color: colors.textDark, fontSize: 14 }}>{item.srNo || index + 1}</Text>
                          <Text className="flex-1 text-gray-800 text-sm" numberOfLines={1}>
                            {item.name}
                          </Text>
                          <Text style={{ width: "16%", color: colors.info, fontSize: 14 }}>{item.sku}{item.upc ? ` / ${item.upc}` : ""}</Text>
                          <Text style={{ width: "12%", color: colors.textDark, fontSize: 14, textAlign: "center" }}>{item.orderedQty}</Text>
                          <Text style={{ width: "8%", fontSize: 14, textAlign: "center", color: colors.primary }}>{item.unit}</Text>
                          <Text style={{ width: "12%", color: colors.textDark, fontSize: 14, textAlign: "center" }}>{item.deliveredQty}</Text>
                          <Text style={{ width: "12%", color: colors.textDark, fontSize: 14, textAlign: "center" }}>{item.remainingQty}</Text>
                          <Text style={{ width: "12%", fontSize: 14, textAlign: "right", color: colors.primary }}>${item.salePrice.toFixed(2)}</Text>
                          <Text style={{ width: "10%", color: colors.textDark, fontSize: 14, textAlign: "right" }}>${item.discount}</Text>
                        </View>
                      ))}
                    </>
                  )}
                </>
              )}

              {activeTab === "Shipments" && (
                <View className="rounded-lg items-center shadow-sm" style={{ backgroundColor: colors.backgroundTertiary, padding: "8%" }}>
                  <MaterialCommunityIcons name="truck-delivery-outline" size={iconSize['4xl']} color={colors.textTertiary} />
                  <Text className="text-gray-500 mt-3 text-lg">No shipment records</Text>
                  <Text className="text-gray-400 text-sm mt-1">Shipment details will appear here</Text>
                </View>
              )}

              {activeTab === "Payment History" && (
                <>
                  {orderToShow.payments.length === 0 ? (
                    <View className="rounded-lg items-center shadow-sm" style={{ backgroundColor: colors.backgroundTertiary, padding: "8%" }}>
                      <MaterialCommunityIcons name="cash-multiple" size={iconSize['4xl']} color={colors.textTertiary} />
                      <Text className="text-gray-500 mt-3 text-lg">No payment records</Text>
                      <Text className="text-gray-400 text-sm mt-1">Payment history will appear here</Text>
                    </View>
                  ) : (
                    <View className="gap-2">
                      {orderToShow.payments.map((payment) => (
                        <View
                          key={payment.id}
                          className="flex-row items-center rounded-lg py-3 shadow-sm"
                          style={{ backgroundColor: colors.backgroundTertiary, paddingHorizontal: "3%" }}
                        >
                          <View className="h-10 bg-green-100 rounded-full items-center justify-center mr-3" style={{ width: "10%" }}>
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
                <View className="rounded-lg items-center shadow-sm" style={{ backgroundColor: colors.backgroundTertiary, padding: "8%" }}>
                  <Ionicons name="document-text-outline" size={iconSize['4xl']} color={colors.textTertiary} />
                  <Text className="text-gray-500 mt-3 text-lg">No invoice activity</Text>
                  <Text className="text-gray-400 text-sm mt-1">Invoice activity will appear here</Text>
                </View>
              )}

              {activeTab === "Notes" && (
                <>
                  {orderToShow.note ? (
                    <View className="bg-yellow-50 rounded-lg border border-yellow-200" style={{ padding: "4%" }}>
                      <Text className="text-gray-700">{orderToShow.note}</Text>
                    </View>
                  ) : (
                    <View className="rounded-lg items-center shadow-sm" style={{ backgroundColor: colors.backgroundTertiary, padding: "8%" }}>
                      <Ionicons name="chatbubble-outline" size={iconSize['4xl']} color={colors.textTertiary} />
                      <Text className="text-gray-500 mt-3 text-lg">No notes</Text>
                      <Text className="text-gray-400 text-sm mt-1">Order notes will appear here</Text>
                    </View>
                  )}
                </>
              )}
            </View>
        </ScrollView>
      </View>
    </CenteredModal>
  );
}
