import { buttonSize, colors, iconSize, modalContent } from "@/utils/theme";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { Alert, Pressable, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { CenteredModal } from "./CenteredModal";
import { ThemedButton } from "./ThemedButton";
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
    <CenteredModal
      visible={visible}
      onClose={onClose}
      size="md"
      header={
        <View className="flex-row items-center gap-3 flex-1">
          <View className="h-10 bg-yellow-100 rounded-full items-center justify-center" style={{ width: "10%" }}>
            <Ionicons name="layers" size={iconSize.xl} color={colors.warning} />
          </View>
          <View>
            <Text className="text-xl font-semibold" style={{ color: colors.textDark }}>
              Parked Orders
            </Text>
            <Text className="text-sm" style={{ color: colors.textSecondary }}>
              {parkedOrders.length} order{parkedOrders.length !== 1 ? "s" : ""} parked
            </Text>
          </View>
        </View>
      }
      scrollable={false}
      contentPadding={false}
      footer={
        <ThemedButton
          title="Close"
          variant="outline"
          onPress={onClose}
          fullWidth
          style={{ backgroundColor: colors.backgroundSecondary }}
        />
      }
    >
          {parkedOrders.length === 0 ? (
            <View className="py-16 items-center">
              <MaterialCommunityIcons name="clipboard-text-outline" size={iconSize['5xl']} color={colors.borderMedium} />
              <Text className="text-gray-500 mt-4 text-center">
                No parked orders{"\n"}
                Orders you park will appear here
              </Text>
            </View>
          ) : (
            <ScrollView style={{ flex: 1 }}>
              {/* Table Header */}
              <View className="flex-row bg-[#F7F7F9] py-3 border-b border-gray-200" style={{ paddingHorizontal: "3%" }}>
                <Text style={{ width: "12%", color: modalContent.labelColor, fontSize: modalContent.labelFontSize, fontWeight: modalContent.titleFontWeight }}>Order ID</Text>
                <Text className="flex-1 text-gray-600 text-sm font-semibold">Customer</Text>
                <Text style={{ width: "8%", color: colors.textSecondary, fontSize: 14, fontWeight: "600", textAlign: "center" }}>Items</Text>
                <Text style={{ width: "12%", color: colors.textSecondary, fontSize: 14, fontWeight: "600", textAlign: "right" }}>Total</Text>
                <Text style={{ width: "16%", color: colors.textSecondary, fontSize: 14, fontWeight: "600", textAlign: "center" }}>Parked At</Text>
                <Text style={{ width: "18%", color: colors.textSecondary, fontSize: 14, fontWeight: "600", textAlign: "center" }}>Actions</Text>
              </View>

              {/* Table Body */}
              {parkedOrders.map((order, index) => (
                <View
                  key={order.id}
                  style={{ paddingHorizontal: "3%", paddingVertical: 12 }}
                  className={`flex-row items-center border-b border-gray-100 ${
                    index % 2 === 0 ? "bg-[#F7F7F9]" : "bg-white"
                  }`}
                >
                  <View style={{ width: "12%" }}>
                    <Text className="text-red-500 text-sm font-medium">{order.id}</Text>
                    {order.note && (
                      <Text className="text-gray-400 text-sm" numberOfLines={1}>
                        {order.note}
                      </Text>
                    )}
                  </View>
                  <Text className="flex-1 text-gray-800 text-sm">{order.customerName}</Text>
                  <Text style={{ width: "8%", color: colors.textDark, fontSize: 14, textAlign: "center" }}>
                    {order.products.length}
                  </Text>
                  <Text style={{ width: "12%", color: colors.primary, fontSize: 14, fontWeight: "500", textAlign: "right" }}>
                    ${order.total.toFixed(2)}
                  </Text>
                  <Text style={{ width: "16%", color: colors.textSecondary, fontSize: 14, textAlign: "center" }}>
                    {formatTime(order.parkedAt)}
                  </Text>
                  <View className="flex-row justify-center gap-4" style={{ width: "18%", minWidth: "15%" }}>
                    <ThemedButton
                      title="Resume"
                      onPress={() => onResumeOrder(order.id)}
                      style={{ flex: 1, minWidth: "40%", backgroundColor: colors.success }}
                    />
                    <ThemedButton
                      icon="trash-outline"
                      onPress={() => handleDelete(order.id)}
                      variant="outline"
                      style={{ minWidth: buttonSize.md.height, borderColor: colors.error }}
                      textStyle={{ color: colors.error }}
                    />
                  </View>
                </View>
              ))}
            </ScrollView>
          )}
    </CenteredModal>
  );
}
