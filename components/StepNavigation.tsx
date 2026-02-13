import { Ionicons } from "@expo/vector-icons";
import { useRouter, usePathname } from "expo-router";
import { View, Text, Pressable } from "react-native";

type Step = "customer" | "products" | "checkout";

interface StepNavigationProps {
  onConfirm?: () => void;
  showConfirm?: boolean;
}

const steps: { key: Step; label: string; route: string }[] = [
  { key: "customer", label: "Add Customer", route: "/order/add-customer?mode=change" },
  { key: "products", label: "Add Products", route: "/order/add-products" },
  { key: "checkout", label: "Checkout", route: "/order/checkout" },
];

/**
 * StepNavigation - Bottom navigation for order flow
 * Shows Back button, step indicators, and optional Confirm button
 */
export function StepNavigation({ onConfirm, showConfirm }: StepNavigationProps) {
  const router = useRouter();
  const pathname = usePathname();

  const currentStepIndex = steps.findIndex((s) => pathname.includes(s.key));

  const handleBack = () => {
    if (currentStepIndex > 0) {
      router.push(steps[currentStepIndex - 1].route as any);
    } else {
      router.back();
    }
  };

  const handleStepPress = (route: string) => {
    router.push(route as any);
  };

  return (
    <View className="flex-row items-center justify-between bg-white border-t border-gray-200 px-4 py-3">
      {/* Back Button */}
      <Pressable
        onPress={handleBack}
        className="bg-red-500 px-6 py-3 rounded-lg flex-row items-center gap-2"
        style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1 })}
      >
        <Ionicons name="arrow-back" size={18} color="white" />
        <Text className="text-white font-semibold">Back</Text>
      </Pressable>

      {/* Step Indicators */}
      <View className="flex-row items-center gap-2">
        {steps.map((step, index) => {
          const isActive = pathname.includes(step.key);
          const isCompleted = index < currentStepIndex;

          return (
            <Pressable
              key={step.key}
              onPress={() => handleStepPress(step.route)}
              className="flex-row items-center gap-2"
              style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
            >
              {/* Step Circle */}
              <View
                className={`w-8 h-8 rounded-full items-center justify-center ${
                  isActive
                    ? "bg-red-500"
                    : isCompleted
                    ? "bg-green-500"
                    : "bg-gray-300"
                }`}
              >
                {isCompleted ? (
                  <Ionicons name="checkmark" size={16} color="white" />
                ) : (
                  <Text className="text-white font-bold text-sm">{index + 1}</Text>
                )}
              </View>
              {/* Step Label */}
              <Text
                className={`text-sm font-medium ${
                  isActive ? "text-red-500" : "text-gray-600"
                }`}
              >
                {step.label}
              </Text>
              {/* Connector Line */}
              {index < steps.length - 1 && (
                <View className="w-8 h-0.5 bg-gray-300 mx-2" />
              )}
            </Pressable>
          );
        })}
      </View>

      {/* Confirm Button (Checkout only) */}
      {showConfirm ? (
        <Pressable
          onPress={onConfirm}
          className="bg-red-500 px-6 py-3 rounded-lg"
          style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1 })}
        >
          <Text className="text-white font-semibold">Confirm</Text>
        </Pressable>
      ) : (
        <View className="w-24" />
      )}
    </View>
  );
}
