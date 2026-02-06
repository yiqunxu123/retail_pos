import { LinearGradient } from "expo-linear-gradient";
import { ReactNode } from "react";
import { Pressable, Text, View } from "react-native";

type StatCardVariant = "green" | "yellow" | "purple" | "red" | "orange" | "dark" | "teal" | "pink" | "blue";

interface StatCardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon?: ReactNode;
  variant: StatCardVariant;
  onPress?: () => void;
}

// Gradient color pairs for each variant [start, end]
const gradientColors: Record<StatCardVariant, [string, string]> = {
  green: ["#22c55e", "#16a34a"],    // emerald gradient
  yellow: ["#f5a623", "#e8961e"],   // orange-yellow (K Web Total Revenue)
  purple: ["#9b59b6", "#8e44ad"],   // purple (K Web Payable Amount)
  red: ["#ef4444", "#dc2626"],      // red gradient
  orange: ["#fb923c", "#f97316"],   // orange gradient
  dark: ["#2c3e50", "#1a252f"],     // dark (K Web Pickup Orders)
  teal: ["#1abc9c", "#16a085"],     // teal (K Web Paid Amount)
  pink: ["#e84393", "#d63384"],     // pink (K Web Delivery Orders)
  blue: ["#3498db", "#2980b9"],     // blue (K Web Receivable Amount)
};

/**
 * StatCard - Displays a single statistic metric with gradient background
 * Used for revenue, amounts, orders count, etc.
 */
export function StatCard({
  title,
  value,
  subtitle,
  icon,
  variant,
  onPress,
}: StatCardProps) {
  return (
    <Pressable
      onPress={onPress}
      className="flex-1 min-h-[100px] rounded-xl overflow-hidden"
      style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1 })}
    >
      <LinearGradient
        colors={gradientColors[variant]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ flex: 1, padding: 16 }}
      >
        {/* Icon positioned top-left */}
        {icon && (
          <View className="w-10 h-10 bg-white/20 rounded-lg items-center justify-center mb-2">
            {icon}
          </View>
        )}

        {/* Value and subtitle aligned top-right */}
        <View className="absolute top-4 right-4 items-end">
          <Text className="text-white text-2xl font-bold">{value}</Text>
          {subtitle && (
            <Text className="text-white/80 text-xs mt-1">{subtitle}</Text>
          )}
        </View>

        {/* Title at bottom-left */}
        <View className="mt-auto">
          <Text className="text-white font-semibold text-sm">{title}</Text>
        </View>
      </LinearGradient>
    </Pressable>
  );
}
