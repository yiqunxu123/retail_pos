import { LinearGradient } from "expo-linear-gradient";
import { View, Text } from "react-native";

export interface StatsBarItem {
  label: string;
  value: string;
}

interface StatsBarProps {
  items: StatsBarItem[];
}

/**
 * StatsBar - Bottom statistics bar component with gradient background
 * Used for displaying time, date, clock-in info, sales stats, etc.
 * Features a floating card design with rounded corners and white border
 */
export function StatsBar({ items }: StatsBarProps) {
  return (
    <View className="px-5 py-4 bg-transparent">
      <View className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100">
        <LinearGradient
          colors={["#120509", "#560F22"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          className="flex-row items-center gap-3 p-3"
          style={{ height: 140 }}
        >
          {items.map((item, index) => (
            <View
              key={index}
              className="flex-1 rounded-xl px-2 border-2 border-white/40 items-center justify-center bg-black/10 shadow-sm"
              style={{ height: 115 }}
            >
              <Text
                style={{
                  color: "rgba(255,255,255,0.9)",
                  fontSize: 20,
                  fontWeight: "600",
                  fontFamily: "Montserrat",
                  letterSpacing: -0.4,
                  lineHeight: 24,
                }}
              >
                {item.label}
              </Text>
              <Text
                style={{
                  color: "white",
                  fontSize: 32,
                  fontWeight: "700",
                  fontFamily: "Montserrat",
                  lineHeight: 36,
                  marginTop: 4,
                }}
              >
                {item.value}
              </Text>
            </View>
          ))}
        </LinearGradient>
      </View>
    </View>
  );
}
