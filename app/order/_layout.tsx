import { Stack } from "expo-router";
import { View } from "react-native";
import { OrderProvider } from "../../contexts/OrderContext";

/**
 * Order Flow Layout - Wraps order screens with OrderProvider
 */
export default function OrderLayout() {
  return (
    <OrderProvider>
      <View className="flex-1 bg-gray-100">
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen
            name="add-customer"
            options={{
              presentation: "transparentModal",
              animation: "fade",
              contentStyle: { backgroundColor: "transparent" },
            }}
          />
          <Stack.Screen name="add-products" />
          <Stack.Screen name="checkout" />
        </Stack>
      </View>
    </OrderProvider>
  );
}
