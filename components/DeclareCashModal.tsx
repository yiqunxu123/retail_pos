import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { Modal, View, Text, TouchableOpacity } from "react-native";

interface CashSummary {
  openingBalance: number;
  totalSales: number;
  totalRefunds: number;
  expectedCash: number;
}

interface DeclareCashModalProps {
  visible: boolean;
  onClose: () => void;
  onContinue: () => void;
  cashSummary: CashSummary;
}

/**
 * DeclareCashModal - Shows cash summary before declaring actual cash
 * Displays opening balance, sales, refunds, and expected cash
 */
export function DeclareCashModal({
  visible,
  onClose,
  onContinue,
  cashSummary,
}: DeclareCashModalProps) {
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
          style={{ width: 450 }}
          activeOpacity={1}
          onPress={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <View className="flex-row justify-between items-center px-6 py-4 border-b border-gray-200">
            <View className="flex-row items-center gap-3">
              <View className="w-10 h-10 bg-green-100 rounded-full items-center justify-center">
                <MaterialCommunityIcons name="cash-register" size={24} color="#10B981" />
              </View>
              <Text className="text-xl font-semibold text-gray-800">
                Declare Cash
              </Text>
            </View>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color="#6b7280" />
            </TouchableOpacity>
          </View>

          {/* Content */}
          <View className="px-6 py-5">
            <Text className="text-gray-600 text-center mb-6">
              Review the cash summary for your shift before declaring actual cash.
            </Text>

            {/* Cash Summary Cards */}
            <View className="gap-3 mb-6">
              {/* Opening Balance */}
              <View className="bg-blue-50 rounded-lg p-4 flex-row justify-between items-center">
                <View className="flex-row items-center gap-3">
                  <View className="w-8 h-8 bg-blue-100 rounded-full items-center justify-center">
                    <Ionicons name="wallet-outline" size={18} color="#3B82F6" />
                  </View>
                  <Text className="text-gray-700">Opening Balance</Text>
                </View>
                <Text className="text-blue-600 font-bold text-lg">
                  ${cashSummary.openingBalance.toFixed(2)}
                </Text>
              </View>

              {/* Total Sales */}
              <View className="bg-green-50 rounded-lg p-4 flex-row justify-between items-center">
                <View className="flex-row items-center gap-3">
                  <View className="w-8 h-8 bg-green-100 rounded-full items-center justify-center">
                    <Ionicons name="trending-up" size={18} color="#10B981" />
                  </View>
                  <Text className="text-gray-700">Total Cash Sales</Text>
                </View>
                <Text className="text-green-600 font-bold text-lg">
                  +${cashSummary.totalSales.toFixed(2)}
                </Text>
              </View>

              {/* Total Refunds */}
              <View className="bg-red-50 rounded-lg p-4 flex-row justify-between items-center">
                <View className="flex-row items-center gap-3">
                  <View className="w-8 h-8 bg-red-100 rounded-full items-center justify-center">
                    <Ionicons name="trending-down" size={18} color="#EF4444" />
                  </View>
                  <Text className="text-gray-700">Total Cash Refunds</Text>
                </View>
                <Text className="text-red-500 font-bold text-lg">
                  -${cashSummary.totalRefunds.toFixed(2)}
                </Text>
              </View>

              {/* Divider */}
              <View className="border-t border-gray-200 my-1" />

              {/* Expected Cash */}
              <View className="bg-purple-50 rounded-lg p-4 flex-row justify-between items-center">
                <View className="flex-row items-center gap-3">
                  <View className="w-8 h-8 bg-purple-100 rounded-full items-center justify-center">
                    <MaterialCommunityIcons name="cash-check" size={18} color="#8B5CF6" />
                  </View>
                  <Text className="text-gray-800 font-medium">Expected Cash in Drawer</Text>
                </View>
                <Text className="text-purple-600 font-bold text-xl">
                  ${cashSummary.expectedCash.toFixed(2)}
                </Text>
              </View>
            </View>

            {/* Action Buttons */}
            <View className="flex-row gap-3">
              <TouchableOpacity
                onPress={onClose}
                className="flex-1 border border-gray-300 rounded-lg py-3 items-center"
              >
                <Text className="text-gray-700 font-medium">Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={onContinue}
                className="flex-1 bg-green-500 rounded-lg py-3 items-center"
              >
                <Text className="text-white font-medium">Enter Actual Cash</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}
