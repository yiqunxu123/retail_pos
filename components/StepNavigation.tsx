import { colors, iconSize } from '@/utils/theme';
import { Ionicons } from "@expo/vector-icons";
import { usePathname, useRouter } from "expo-router";
import { Pressable, Text, View } from "react-native";

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
    <View className="flex-row items-center justify-between border-t border-gray-200 px-4 py-3" style={{ backgroundColor: colors.backgroundTertiary }}>
      {/* Back Button */}
      <Pressable
        onPress={handleBack}
        className="px-6 py-3 rounded-lg flex-row items-center gap-2 shadow-sm"
        style={({ pressed }) => ({ backgroundColor: colors.primary, opacity: pressed ? 0.8 : 1 })}
      >
        <Ionicons name="menu" size={iconSize.md} color="white" />
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
                className="w-8 h-8 rounded-full items-center justify-center"
                style={{ backgroundColor: isActive ? colors.primary : isCompleted ? colors.success : colors.borderMedium }}
              >
                {isCompleted ? (
                  <Ionicons name="checkmark" size={iconSize.sm} color="white" />
                ) : (
                  <Text className="text-white font-bold text-sm">{index + 1}</Text>
                )}
              </View>
              {/* Step Label */}
              <Text
                className="text-sm font-medium"
                style={{ color: isActive ? colors.primary : colors.textSecondary }}
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
          className="px-6 py-3 rounded-lg"
          style={({ pressed }) => ({ backgroundColor: colors.primary, opacity: pressed ? 0.8 : 1, borderRadius: 8 })}
        >
          <Text className="text-white font-semibold">Confirm</Text>
        </Pressable>
      ) : (
        <View className="w-24" />
      )}
    </View>
  );
}
