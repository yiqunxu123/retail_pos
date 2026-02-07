import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { Alert, Modal, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { ParkedOrder } from "../contexts/ParkedOrderContext";

interface ParkedOrdersModalProps {
  visible: boolean;
  onClose: () => void;
  parkedOrders: ParkedOrder[];
  onResumeOrder: (id: string) => void | Promise<void>;
  onDeleteOrder: (id: string) => void | Promise<void>;
}

/**
 * ParkedOrdersModal - Display list of parked orders
 * Allows resuming or deleting parked orders
 */
export function ParkedOrdersModal({
  visible,
  onClose,
  parkedOrders,
  onResumeOrder,
  onDeleteOrder,
}: ParkedOrdersModalProps) {
  const formatTime = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleDelete = (id: string) => {
    Alert.alert(
      "Delete Parked Order",
      "Are you sure you want to delete this parked order? This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Delete", style: "destructive", onPress: () => onDeleteOrder(id) },
      ]
    );
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
          style={{ width: 600, maxHeight: "80%" }}
          activeOpacity={1}
          onPress={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <View className="flex-row justify-between items-center px-6 py-4 border-b border-gray-200">
            <View className="flex-row items-center gap-3">
              <View className="w-10 h-10 bg-yellow-100 rounded-full items-center justify-center">
                <Ionicons name="layers" size={24} color="#F59E0B" />
              </View>
              <View>
                <Text className="text-xl font-semibold text-gray-800">
                  Parked Orders
                </Text>
                <Text className="text-gray-500 text-sm">
                  {parkedOrders.length} order{parkedOrders.length !== 1 ? "s" : ""} parked
                </Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color="#6b7280" />
            </TouchableOpacity>
          </View>

          {/* Content */}
          {parkedOrders.length === 0 ? (
            <View className="py-16 items-center">
              <MaterialCommunityIcons name="clipboard-text-outline" size={64} color="#d1d5db" />
              <Text className="text-gray-500 mt-4 text-center">
                No parked orders{"\n"}
                Orders you park will appear here
              </Text>
            </View>
          ) : (
            <ScrollView className="max-h-96">
              {/* Table Header */}
              <View className="flex-row bg-gray-50 px-4 py-3 border-b border-gray-200">
                <Text className="w-24 text-gray-600 text-xs font-semibold">Order ID</Text>
                <Text className="flex-1 text-gray-600 text-xs font-semibold">Customer</Text>
                <Text className="w-16 text-gray-600 text-xs font-semibold text-center">Items</Text>
                <Text className="w-24 text-gray-600 text-xs font-semibold text-right">Total</Text>
                <Text className="w-32 text-gray-600 text-xs font-semibold text-center">Parked At</Text>
                <Text className="w-24 text-gray-600 text-xs font-semibold text-center">Actions</Text>
              </View>

              {/* Table Body */}
              {parkedOrders.map((order, index) => (
                <View
                  key={order.id}
                  className={`flex-row items-center px-4 py-3 border-b border-gray-100 ${
                    index % 2 === 0 ? "bg-white" : "bg-gray-50"
                  }`}
                >
                  <View className="w-24">
                    <Text className="text-red-500 text-sm font-medium">{order.id}</Text>
                    {order.note && (
                      <Text className="text-gray-400 text-xs" numberOfLines={1}>
                        {order.note}
                      </Text>
                    )}
                  </View>
                  <Text className="flex-1 text-gray-800 text-sm">{order.customerName}</Text>
                  <Text className="w-16 text-gray-800 text-sm text-center">
                    {order.products.length}
                  </Text>
                  <Text className="w-24 text-red-500 text-sm font-medium text-right">
                    ${order.total.toFixed(2)}
                  </Text>
                  <Text className="w-32 text-gray-600 text-xs text-center">
                    {formatTime(order.parkedAt)}
                  </Text>
                  <View className="w-24 flex-row justify-center gap-2">
                    <TouchableOpacity
                      onPress={() => onResumeOrder(order.id)}
                      className="bg-green-500 px-3 py-1.5 rounded"
                    >
                      <Text className="text-white text-xs font-medium">Resume</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => handleDelete(order.id)}
                      className="bg-red-100 px-2 py-1.5 rounded"
                    >
                      <Ionicons name="trash-outline" size={14} color="#EF4444" />
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </ScrollView>
          )}

          {/* Footer */}
          <View className="px-6 py-4 border-t border-gray-200">
            <TouchableOpacity
              onPress={onClose}
              className="bg-gray-100 rounded-lg py-3 items-center"
            >
              <Text className="text-gray-700 font-medium">Close</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}
