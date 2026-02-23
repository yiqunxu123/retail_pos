import { ReactNode } from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { fontSize } from '@/utils/theme';

interface StatCardHorizontalProps {
  title: string;
  count: number | string;
  color: string;
  onPress?: () => void;
  icon?: ReactNode;
  minHeight?: number;
}

export function StatCardHorizontal({
  title,
  count,
  color,
  onPress,
  icon,
  minHeight = 120,
}: StatCardHorizontalProps) {
  const CardContent = (
    <View 
      className="flex-1 rounded-xl justify-center items-center px-4 py-4"
      style={{ 
        backgroundColor: color,
        minHeight,
        shadowColor: "#989898",
        shadowOffset: { width: 4, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 4,
      }}
    >
      {icon && <View className="mb-2">{icon}</View>}
      <Text className="text-white font-medium text-center mb-1" style={{ fontSize: fontSize.base }}>
        {title}
      </Text>
      <Text className="text-white font-bold" style={{ fontSize: fontSize['3xl'] }}>
        {count}
      </Text>
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity 
        className="flex-1"
        onPress={onPress}
        activeOpacity={0.7}
      >
        {CardContent}
      </TouchableOpacity>
    );
  }

  return CardContent;
}
