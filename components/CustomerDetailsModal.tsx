import { buttonSize, colors, iconSize } from '@/utils/theme';
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { Modal, Pressable, ScrollView, Text, TouchableOpacity, View } from "react-native";
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
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableOpacity
        className="flex-1 bg-black/50 justify-center items-center"
        activeOpacity={1}
        onPress={onClose}
      >
        <TouchableOpacity
          className="bg-white rounded-xl overflow-hidden"
          style={{ width: 600, maxHeight: "85%" }}
          activeOpacity={1}
          onPress={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <View className="flex-row justify-between items-center px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-red-500 to-red-600"
            style={{ backgroundColor: colors.primary }}
          >
            <View className="flex-row items-center gap-3">
              <View className="w-12 h-12 bg-white rounded-full items-center justify-center">
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
            </View>
            <Pressable onPress={onClose} style={{ width: buttonSize.md.height, height: buttonSize.md.height, alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons name="close" size={iconSize.xl} color="white" />
            </Pressable>
          </View>

          <ScrollView className="flex-1">
            {/* Stats Cards */}
            <View className="flex-row gap-4 px-6 py-4">
              <View className="flex-1 bg-blue-50 rounded-lg p-4 items-center">
                <MaterialCommunityIcons name="shopping" size={iconSize.xl} color={colors.info} />
                <Text className="text-gray-600 text-sm mt-1">Total Orders</Text>
                <Text className="text-blue-600 font-bold text-xl">{customer.totalOrders}</Text>
              </View>
              <View className="flex-1 bg-green-50 rounded-lg p-4 items-center">
                <MaterialCommunityIcons name="cash-multiple" size={iconSize.xl} color={colors.success} />
                <Text className="text-gray-600 text-sm mt-1">Total Spent</Text>
                <Text className="text-green-600 font-bold text-xl">
                  ${customer.totalSpent.toFixed(2)}
                </Text>
              </View>
              <View className="flex-1 bg-purple-50 rounded-lg p-4 items-center">
                <MaterialCommunityIcons name="wallet" size={iconSize.xl} color={colors.purple} />
                <Text className="text-gray-600 text-sm mt-1">Balance</Text>
                <Text
                  className={`font-bold text-xl ${
                    customer.balance > 0 ? "text-red-500" : "text-green-600"
                  }`}
                >
                  ${Math.abs(customer.balance).toFixed(2)}
                </Text>
              </View>
              {customer.loyaltyPoints !== undefined && (
                <View className="flex-1 bg-yellow-50 rounded-lg p-4 items-center">
                  <MaterialCommunityIcons name="star" size={iconSize.xl} color={colors.warning} />
                  <Text className="text-gray-600 text-sm mt-1">Points</Text>
                  <Text className="text-yellow-600 font-bold text-xl">
                    {customer.loyaltyPoints}
                  </Text>
                </View>
              )}
            </View>

            {/* Contact Information */}
            <View className="px-6 py-4 border-t border-gray-100">
              <Text className="text-gray-800 font-semibold mb-3">Contact Information</Text>
              <View className="rounded-lg p-4 gap-3 shadow-sm" style={{ backgroundColor: colors.backgroundTertiary }}>
                {customer.email && (
                  <View className="flex-row items-center gap-3">
                    <View className="w-8 h-8 bg-blue-100 rounded-full items-center justify-center">
                      <Ionicons name="mail-outline" size={iconSize.md} color={colors.info} />
                    </View>
                    <View>
                      <Text className="text-gray-500 text-sm">Email</Text>
                      <Text className="text-gray-800">{customer.email}</Text>
                    </View>
                  </View>
                )}
                {customer.phone && (
                  <View className="flex-row items-center gap-3">
                    <View className="w-8 h-8 bg-green-100 rounded-full items-center justify-center">
                      <Ionicons name="call-outline" size={iconSize.md} color={colors.success} />
                    </View>
                    <View>
                      <Text className="text-gray-500 text-sm">Phone</Text>
                      <Text className="text-gray-800">{customer.phone}</Text>
                    </View>
                  </View>
                )}
                {customer.address && (
                  <View className="flex-row items-center gap-3">
                    <View className="w-8 h-8 bg-purple-100 rounded-full items-center justify-center">
                      <Ionicons name="location-outline" size={iconSize.md} color={colors.purple} />
                    </View>
                    <View className="flex-1">
                      <Text className="text-gray-500 text-sm">Address</Text>
                      <Text className="text-gray-800">
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
            <View className="px-6 py-4 border-t border-gray-100">
              <Text className="text-gray-800 font-semibold mb-3">Business Information</Text>
              <View className="flex-row gap-4">
                <View className="flex-1 rounded-lg p-3 shadow-sm" style={{ backgroundColor: colors.backgroundTertiary }}>
                  <Text className="text-gray-500 text-sm">Customer Type</Text>
                  <Text className="text-gray-800 font-medium">{customer.customerType}</Text>
                </View>
                <View className="flex-1 rounded-lg p-3 shadow-sm" style={{ backgroundColor: colors.backgroundTertiary }}>
                  <Text className="text-gray-500 text-sm">Class of Trades</Text>
                  <Text className="text-gray-800 font-medium">{customer.classOfTrades}</Text>
                </View>
                <View className="flex-1 rounded-lg p-3 shadow-sm" style={{ backgroundColor: colors.backgroundTertiary }}>
                  <Text className="text-gray-500 text-sm">Customer Since</Text>
                  <Text className="text-gray-800 font-medium">{formatDate(customer.createdAt)}</Text>
                </View>
              </View>
            </View>

            {/* Recent Orders */}
            {customer.recentOrders && customer.recentOrders.length > 0 && (
              <View className="px-6 py-4 border-t border-gray-100">
                <View className="flex-row justify-between items-center mb-3">
                  <Text className="text-gray-800 font-semibold">Recent Orders</Text>
                  {onViewOrders && (
                    <TouchableOpacity onPress={onViewOrders}>
                      <Text className="text-red-500 font-medium">View All</Text>
                    </TouchableOpacity>
                  )}
                </View>
                <View className="gap-2">
                  {customer.recentOrders.slice(0, 3).map((order) => (
                    <View
                      key={order.id}
                      className="flex-row items-center rounded-lg px-4 py-3 shadow-sm"
                      style={{ backgroundColor: colors.backgroundTertiary }}
                    >
                      <View className="flex-1">
                        <Text className="text-gray-800 font-medium">#{order.orderNumber}</Text>
                        <Text className="text-gray-500 text-sm">{formatDate(order.date)}</Text>
                      </View>
                      <View className="items-end">
                        <Text className="text-gray-800 font-bold">${order.total.toFixed(2)}</Text>
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
              <View className="px-6 py-4 border-t border-gray-100">
                <Text className="text-gray-800 font-semibold mb-2">Notes</Text>
                <View className="bg-yellow-50 rounded-lg p-3">
                  <Text className="text-gray-700">{customer.notes}</Text>
                </View>
              </View>
            )}
          </ScrollView>

          {/* Footer Actions */}
          <View className="flex-row gap-4 px-6 py-4 border-t border-gray-200">
            <ThemedButton
              title="Close"
              variant="outline"
              onPress={onClose}
              fullWidth
            />
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
          </View>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}
