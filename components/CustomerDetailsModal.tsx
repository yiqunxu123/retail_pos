import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { Modal, View, Text, TouchableOpacity, ScrollView } from "react-native";

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
            style={{ backgroundColor: "#EC1A52" }}
          >
            <View className="flex-row items-center gap-3">
              <View className="w-12 h-12 bg-white rounded-full items-center justify-center">
                <Ionicons name="person" size={28} color="#EC1A52" />
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
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color="white" />
            </TouchableOpacity>
          </View>

          <ScrollView className="flex-1">
            {/* Stats Cards */}
            <View className="flex-row gap-3 px-6 py-4">
              <View className="flex-1 bg-blue-50 rounded-lg p-4 items-center">
                <MaterialCommunityIcons name="shopping" size={24} color="#3B82F6" />
                <Text className="text-gray-600 text-sm mt-1">Total Orders</Text>
                <Text className="text-blue-600 font-bold text-xl">{customer.totalOrders}</Text>
              </View>
              <View className="flex-1 bg-green-50 rounded-lg p-4 items-center">
                <MaterialCommunityIcons name="cash-multiple" size={24} color="#10B981" />
                <Text className="text-gray-600 text-sm mt-1">Total Spent</Text>
                <Text className="text-green-600 font-bold text-xl">
                  ${customer.totalSpent.toFixed(2)}
                </Text>
              </View>
              <View className="flex-1 bg-purple-50 rounded-lg p-4 items-center">
                <MaterialCommunityIcons name="wallet" size={24} color="#8B5CF6" />
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
                  <MaterialCommunityIcons name="star" size={24} color="#F59E0B" />
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
              <View className="bg-gray-50 rounded-lg p-4 gap-3">
                {customer.email && (
                  <View className="flex-row items-center gap-3">
                    <View className="w-8 h-8 bg-blue-100 rounded-full items-center justify-center">
                      <Ionicons name="mail-outline" size={16} color="#3B82F6" />
                    </View>
                    <View>
                      <Text className="text-gray-500 text-xs">Email</Text>
                      <Text className="text-gray-800">{customer.email}</Text>
                    </View>
                  </View>
                )}
                {customer.phone && (
                  <View className="flex-row items-center gap-3">
                    <View className="w-8 h-8 bg-green-100 rounded-full items-center justify-center">
                      <Ionicons name="call-outline" size={16} color="#10B981" />
                    </View>
                    <View>
                      <Text className="text-gray-500 text-xs">Phone</Text>
                      <Text className="text-gray-800">{customer.phone}</Text>
                    </View>
                  </View>
                )}
                {customer.address && (
                  <View className="flex-row items-center gap-3">
                    <View className="w-8 h-8 bg-purple-100 rounded-full items-center justify-center">
                      <Ionicons name="location-outline" size={16} color="#8B5CF6" />
                    </View>
                    <View className="flex-1">
                      <Text className="text-gray-500 text-xs">Address</Text>
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
                <View className="flex-1 bg-gray-50 rounded-lg p-3">
                  <Text className="text-gray-500 text-xs">Customer Type</Text>
                  <Text className="text-gray-800 font-medium">{customer.customerType}</Text>
                </View>
                <View className="flex-1 bg-gray-50 rounded-lg p-3">
                  <Text className="text-gray-500 text-xs">Class of Trades</Text>
                  <Text className="text-gray-800 font-medium">{customer.classOfTrades}</Text>
                </View>
                <View className="flex-1 bg-gray-50 rounded-lg p-3">
                  <Text className="text-gray-500 text-xs">Customer Since</Text>
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
                      className="flex-row items-center bg-gray-50 rounded-lg px-4 py-3"
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
                            className="text-xs font-medium"
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
          <View className="flex-row gap-3 px-6 py-4 border-t border-gray-200">
            <TouchableOpacity
              onPress={onClose}
              className="flex-1 border border-gray-300 rounded-lg py-3 items-center"
            >
              <Text className="text-gray-700 font-medium">Close</Text>
            </TouchableOpacity>
            {onEdit && (
              <TouchableOpacity
                onPress={onEdit}
                className="flex-1 border border-red-500 rounded-lg py-3 flex-row items-center justify-center gap-2"
              >
                <Ionicons name="pencil-outline" size={18} color="#EC1A52" />
                <Text className="text-red-500 font-medium">Edit</Text>
              </TouchableOpacity>
            )}
            {onAddOrder && (
              <TouchableOpacity
                onPress={onAddOrder}
                className="flex-1 bg-red-500 rounded-lg py-3 flex-row items-center justify-center gap-2"
              >
                <Ionicons name="add" size={18} color="white" />
                <Text className="text-white font-medium">New Order</Text>
              </TouchableOpacity>
            )}
          </View>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}
