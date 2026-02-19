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
  height?: number;
}

// Gradient color pairs for each variant [start, end]
const gradientColors: Record<StatCardVariant, [string, string]> = {
  green: ["#4CAF50", "#388E3C"],    // Total Revenue
  yellow: ["#FF9800", "#F57C00"],   // Payable Amount
  purple: ["#9C27B0", "#7B1FA2"],   // Pickup Orders
  red: ["#E91E63", "#C2185B"],      // Delivery Orders
  orange: ["#FB8C00", "#EF6C00"],   // General orange
  dark: ["#2c3e50", "#1a252f"],     // Dark
  teal: ["#00BCD4", "#0097A7"],     // Paid Amount
  pink: ["#E91E63", "#C2185B"],     // Same as red for delivery in design
  blue: ["#2196F3", "#1976D2"],     // Receivable Amount
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
  height = 180,
}: StatCardProps) {
  return (
    <Pressable
      onPress={onPress}
      className="flex-1 rounded-xl overflow-hidden"
      style={({ pressed }) => ({ 
        opacity: pressed ? 0.8 : 1,
        height: height,
        minHeight: height,
      })}
    >
      <LinearGradient
        colors={gradientColors[variant]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ height: height, padding: 16 }}
      >
        {/* Icon positioned top-left - Increased container size for more internal margin */}
        {icon && (
          <View className="w-16 h-16 bg-white/20 rounded-xl items-center justify-center mb-2">
            {icon}
          </View>
        )}

        {/* Value and subtitle group - Centered vertically on the right */}
        <View 
          className="absolute right-4 top-0 bottom-0 justify-center items-end"
          style={{ height: height }}
        >
          <Text 
            style={{ 
              fontSize: 32, 
              fontWeight: "600",
              fontFamily: "Montserrat",
              color: "#FFFFFF"
            }}
          >
            {value}
          </Text>
          {subtitle && (
            <Text 
              style={{ 
                fontSize: 16, 
                fontWeight: "500",
                fontFamily: "Montserrat",
                color: "rgba(255, 255, 255, 0.8)",
                marginTop: 2
              }}
            >
              {subtitle}
            </Text>
          )}
        </View>

        {/* Title at bottom-left */}
        <View className="mt-auto">
          <Text 
            style={{ 
              fontSize: 22, // Increased for better balance with 32px value
              fontWeight: "600",
              fontFamily: "Montserrat",
              color: "#FFFFFF"
            }}
          >
            {title}
          </Text>
        </View>
      </LinearGradient>
    </Pressable>
  );
}
