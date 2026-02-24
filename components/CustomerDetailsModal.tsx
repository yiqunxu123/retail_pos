import { colors, iconSize, modalContent } from '@/utils/theme';
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import { CloseButton } from "./CloseButton";
import { CenteredModal } from "./CenteredModal";
import { ThemedButton } from "./ThemedButton";

interface CustomerOrder {
  id: string;
  orderNumber: string;
  date: string;
  total: number;
  status: "completed" | "pending" | "cancelled";
}

interface CustomerDetails {
  id: string;
  businessName: string;
  contactName?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  customerType: string;
  classOfTrades: string;
  balance: number;
  totalOrders: number;
  totalSpent: number;
  loyaltyPoints?: number;
  createdAt: string;
  recentOrders?: CustomerOrder[];
  notes?: string;
}

interface CustomerDetailsModalProps {
  visible: boolean;
  onClose: () => void;
  customer: CustomerDetails | null;
  onEdit?: () => void;
  onViewOrders?: () => void;
  onAddOrder?: () => void;
}

/**
 * CustomerDetailsModal - View complete customer information
 * Shows customer info, stats, recent orders, and actions
 */
export function CustomerDetailsModal({
  visible,
  onClose,
  customer,
  onEdit,
  onViewOrders,
  onAddOrder,
}: CustomerDetailsModalProps) {
  if (!customer) return null;

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <CenteredModal
      visible={visible}
      onClose={onClose}
      size="md"
      showCloseButton={false}
      scrollable={false}
      contentPadding={false}
      headerStyle={{ backgroundColor: colors.primary }}
      header={
        <View className="flex-row items-center gap-3 flex-1">
          <View className="h-12 bg-white rounded-full items-center justify-center" style={{ width: "12%" }}>
            <Ionicons name="person" size={iconSize['2xl']} color={colors.primary} />
          </View>
          <View>
            <Text className="text-xl font-semibold text-white">
              {customer.businessName}
            </Text>
            {customer.contactName && (
              <Text className="text-white/80">{customer.contactName}</Text>
            )}
          </View>
          <View className="ml-auto pr-2">
            <CloseButton onPress={onClose} variant="light" />
          </View>
        </View>
      }
      footer={
        <>
          <ThemedButton title="Close" variant="outline" onPress={onClose} fullWidth />
          {onEdit && (
            <ThemedButton
              title="Edit"
              icon="pencil-outline"
              variant="outline"
              onPress={onEdit}
              fullWidth
              style={{ flex: 1, borderColor: colors.primary, borderWidth: 1 }}
              textStyle={{ color: colors.primary }}
            />
          )}
          {onAddOrder && (
            <ThemedButton
              title="New Order"
              icon="add"
              onPress={onAddOrder}
              fullWidth
              style={{ flex: 1, backgroundColor: colors.primary }}
            />
          )}
        </>
      }
    >
      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
        {/* Stats Cards */}
        <View className="flex-row gap-4 py-4" style={{ paddingHorizontal: "5%" }}>
          <View className="flex-1 items-center" style={{ backgroundColor: "#EFF6FF", padding: modalContent.boxPaddingPct, borderRadius: modalContent.boxRadius, borderWidth: modalContent.boxBorderWidth, borderColor: modalContent.boxBorderColor }}>
            <MaterialCommunityIcons name="shopping" size={iconSize.xl} color={colors.info} />
            <Text className="mt-1" style={{ fontSize: modalContent.labelFontSize, color: modalContent.labelColor }}>Total Orders</Text>
            <Text className="font-bold" style={{ fontSize: modalContent.valueLargeFontSize, color: colors.info }}>{customer.totalOrders}</Text>
          </View>
          <View className="flex-1 items-center" style={{ backgroundColor: "#ECFDF5", padding: modalContent.boxPaddingPct, borderRadius: modalContent.boxRadius, borderWidth: modalContent.boxBorderWidth, borderColor: modalContent.boxBorderColor }}>
            <MaterialCommunityIcons name="cash-multiple" size={iconSize.xl} color={colors.success} />
            <Text className="mt-1" style={{ fontSize: modalContent.labelFontSize, color: modalContent.labelColor }}>Total Spent</Text>
            <Text className="font-bold" style={{ fontSize: modalContent.valueLargeFontSize, color: colors.success }}>
              ${customer.totalSpent.toFixed(2)}
            </Text>
          </View>
          <View className="flex-1 items-center" style={{ backgroundColor: "#F5F3FF", padding: modalContent.boxPaddingPct, borderRadius: modalContent.boxRadius, borderWidth: modalContent.boxBorderWidth, borderColor: modalContent.boxBorderColor }}>
            <MaterialCommunityIcons name="wallet" size={iconSize.xl} color={colors.purple} />
            <Text className="mt-1" style={{ fontSize: modalContent.labelFontSize, color: modalContent.labelColor }}>Balance</Text>
            <Text
              className="font-bold"
              style={{ fontSize: modalContent.valueLargeFontSize, color: customer.balance > 0 ? colors.error : colors.success }}
            >
              ${Math.abs(customer.balance).toFixed(2)}
            </Text>
          </View>
          {customer.loyaltyPoints !== undefined && (
            <View className="flex-1 items-center" style={{ backgroundColor: "#FFFBEB", padding: modalContent.boxPaddingPct, borderRadius: modalContent.boxRadius, borderWidth: modalContent.boxBorderWidth, borderColor: modalContent.boxBorderColor }}>
              <MaterialCommunityIcons name="star" size={iconSize.xl} color={colors.warning} />
              <Text className="mt-1" style={{ fontSize: modalContent.labelFontSize, color: modalContent.labelColor }}>Points</Text>
              <Text className="font-bold" style={{ fontSize: modalContent.valueLargeFontSize, color: colors.warning }}>
                {customer.loyaltyPoints}
              </Text>
            </View>
          )}
        </View>

        {/* Contact Information */}
        <View className="py-4 border-t border-gray-100" style={{ paddingHorizontal: "5%" }}>
          <Text className="mb-3" style={{ fontSize: modalContent.titleFontSize, fontWeight: modalContent.titleFontWeight, color: modalContent.titleColor }}>Contact Information</Text>
          <View className="gap-3 shadow-sm" style={{ backgroundColor: modalContent.boxBackground, padding: modalContent.boxPaddingPct, borderRadius: modalContent.boxRadius, borderWidth: modalContent.boxBorderWidth, borderColor: modalContent.boxBorderColor }}>
            {customer.email && (
              <View className="flex-row items-center gap-3">
                <View className="h-8 rounded-full items-center justify-center" style={{ width: "8%", backgroundColor: "#DBEAFE" }}>
                  <Ionicons name="mail-outline" size={iconSize.md} color={colors.info} />
                </View>
                <View>
                  <Text style={{ fontSize: modalContent.labelFontSize, color: modalContent.labelColor }}>Email</Text>
                  <Text style={{ fontSize: modalContent.valueFontSize, fontWeight: modalContent.valueFontWeight, color: modalContent.valueColor }}>{customer.email}</Text>
                </View>
              </View>
            )}
            {customer.phone && (
              <View className="flex-row items-center gap-3">
                <View className="h-8 rounded-full items-center justify-center" style={{ width: "8%", backgroundColor: "#D1FAE5" }}>
                  <Ionicons name="call-outline" size={iconSize.md} color={colors.success} />
                </View>
                <View>
                  <Text style={{ fontSize: modalContent.labelFontSize, color: modalContent.labelColor }}>Phone</Text>
                  <Text style={{ fontSize: modalContent.valueFontSize, fontWeight: modalContent.valueFontWeight, color: modalContent.valueColor }}>{customer.phone}</Text>
                </View>
              </View>
            )}
            {customer.address && (
              <View className="flex-row items-center gap-3">
                <View className="h-8 rounded-full items-center justify-center" style={{ width: "8%", backgroundColor: "#EDE9FE" }}>
                  <Ionicons name="location-outline" size={iconSize.md} color={colors.purple} />
                </View>
                <View className="flex-1">
                  <Text style={{ fontSize: modalContent.labelFontSize, color: modalContent.labelColor }}>Address</Text>
                  <Text style={{ fontSize: modalContent.valueFontSize, fontWeight: modalContent.valueFontWeight, color: modalContent.valueColor }}>
                    {customer.address}
                    {customer.city && `, ${customer.city}`}
                    {customer.state && `, ${customer.state}`}
                    {customer.zipCode && ` ${customer.zipCode}`}
                  </Text>
                </View>
              </View>
            )}
          </View>
        </View>

        {/* Business Information */}
        <View className="py-4 border-t border-gray-100" style={{ paddingHorizontal: "5%" }}>
          <Text className="mb-3" style={{ fontSize: modalContent.titleFontSize, fontWeight: modalContent.titleFontWeight, color: modalContent.titleColor }}>Business Information</Text>
          <View className="flex-row gap-4">
            <View className="flex-1 shadow-sm" style={{ backgroundColor: modalContent.boxBackground, padding: modalContent.boxPadding, borderRadius: modalContent.boxRadius, borderWidth: modalContent.boxBorderWidth, borderColor: modalContent.boxBorderColor }}>
              <Text style={{ fontSize: modalContent.labelFontSize, color: modalContent.labelColor }}>Customer Type</Text>
              <Text style={{ fontSize: modalContent.valueFontSize, fontWeight: modalContent.valueFontWeight, color: modalContent.valueColor }}>{customer.customerType}</Text>
            </View>
            <View className="flex-1 shadow-sm" style={{ backgroundColor: modalContent.boxBackground, padding: modalContent.boxPadding, borderRadius: modalContent.boxRadius, borderWidth: modalContent.boxBorderWidth, borderColor: modalContent.boxBorderColor }}>
              <Text style={{ fontSize: modalContent.labelFontSize, color: modalContent.labelColor }}>Class of Trades</Text>
              <Text style={{ fontSize: modalContent.valueFontSize, fontWeight: modalContent.valueFontWeight, color: modalContent.valueColor }}>{customer.classOfTrades}</Text>
            </View>
            <View className="flex-1 shadow-sm" style={{ backgroundColor: modalContent.boxBackground, padding: modalContent.boxPadding, borderRadius: modalContent.boxRadius, borderWidth: modalContent.boxBorderWidth, borderColor: modalContent.boxBorderColor }}>
              <Text style={{ fontSize: modalContent.labelFontSize, color: modalContent.labelColor }}>Customer Since</Text>
              <Text style={{ fontSize: modalContent.valueFontSize, fontWeight: modalContent.valueFontWeight, color: modalContent.valueColor }}>{formatDate(customer.createdAt)}</Text>
            </View>
          </View>
        </View>

        {/* Recent Orders */}
        {customer.recentOrders && customer.recentOrders.length > 0 && (
          <View className="py-4 border-t border-gray-100" style={{ paddingHorizontal: "5%" }}>
            <View className="flex-row justify-between items-center mb-3">
              <Text style={{ fontSize: modalContent.titleFontSize, fontWeight: modalContent.titleFontWeight, color: modalContent.titleColor }}>Recent Orders</Text>
              {onViewOrders && (
                <TouchableOpacity onPress={onViewOrders}>
                  <Text className="font-medium" style={{ color: colors.primary }}>View All</Text>
                </TouchableOpacity>
              )}
            </View>
            <View className="gap-2">
              {customer.recentOrders.slice(0, 3).map((order) => (
                <View
                  key={order.id}
                  className="flex-row items-center py-3 shadow-sm"
                  style={{ backgroundColor: modalContent.boxBackground, paddingHorizontal: modalContent.boxPaddingPct, borderRadius: modalContent.boxRadius, borderWidth: modalContent.boxBorderWidth, borderColor: modalContent.boxBorderColor }}
                >
                  <View className="flex-1">
                    <Text style={{ fontSize: modalContent.valueFontSize, fontWeight: modalContent.valueFontWeight, color: modalContent.valueColor }}>#{order.orderNumber}</Text>
                    <Text style={{ fontSize: modalContent.labelFontSize, color: modalContent.labelColor }}>{formatDate(order.date)}</Text>
                  </View>
                  <View className="items-end">
                    <Text className="font-bold" style={{ fontSize: modalContent.valueFontSize, color: modalContent.valueColor }}>${order.total.toFixed(2)}</Text>
                    <View
                      className="px-2 py-0.5 rounded mt-1"
                      style={{
                        backgroundColor:
                          order.status === "completed"
                            ? "#DEF7EC"
                            : order.status === "pending"
                            ? "#FEF3C7"
                            : "#FEE2E2",
                      }}
                    >
                      <Text
                        className="text-sm font-medium"
                        style={{
                          color:
                            order.status === "completed"
                              ? "#03543F"
                              : order.status === "pending"
                              ? "#92400E"
                              : "#991B1B",
                        }}
                      >
                        {order.status.toUpperCase()}
                      </Text>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Notes */}
        {customer.notes && (
          <View className="py-4 border-t border-gray-100" style={{ paddingHorizontal: "5%" }}>
            <Text className="mb-2" style={{ fontSize: modalContent.titleFontSize, fontWeight: modalContent.titleFontWeight, color: modalContent.titleColor }}>Notes</Text>
            <View style={{ backgroundColor: "#FFFBEB", padding: modalContent.boxPadding, borderRadius: modalContent.boxRadius, borderWidth: modalContent.boxBorderWidth, borderColor: modalContent.boxBorderColor }}>
              <Text style={{ fontSize: modalContent.valueFontSize, fontWeight: modalContent.valueFontWeight, color: modalContent.valueColor }}>{customer.notes}</Text>
            </View>
          </View>
        )}
      </ScrollView>
    </CenteredModal>
  );
}