import { Slot } from "expo-router";
import { View } from "react-native";
import { OrderProvider } from "../../contexts/OrderContext";

/**
 * Order Flow Layout - Wraps order screens with OrderProvider
 */
export default function OrderLayout() {
  return (
    <OrderProvider>
      <View className="flex-1 bg-gray-100">
        <Slot />
      </View>
    </OrderProvider>
  );
}
