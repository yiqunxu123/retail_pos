import { ReactNode } from "react";
import { Text, TouchableOpacity, View } from "react-native";

interface ActionCardProps {
  title: string;
  backgroundColor: string;
  disabledColor?: string;
  onPress?: () => void;
  disabled?: boolean;
  minHeight?: number;
  badge?: number | string;
  icon?: ReactNode;
  /** Outline style: white bg with colored border + colored text */
  outline?: boolean;
}

export function ActionCard({
  title,
  backgroundColor,
  disabledColor = "#848484",
  onPress,
  disabled = false,
  minHeight = 160,
  badge,
  icon,
  outline = false,
}: ActionCardProps) {
  const color = disabled ? disabledColor : backgroundColor;

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      className="flex-1 rounded-xl justify-center items-center gap-2"
      style={{
        backgroundColor: outline ? "#FFFFFF" : color,
        borderWidth: outline ? 2 : 0,
        borderColor: outline ? color : undefined,
        minHeight,
        shadowColor: "#989898",
        shadowOffset: { width: 4, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 4,
        opacity: disabled ? 0.7 : 1,
      }}
    >
      {icon && icon}
      <Text 
        className="font-medium text-center"
        style={{ fontSize: 26, letterSpacing: -0.5, color: outline ? color : "#FFFFFF" }}
      >
        {title}
      </Text>
      {badge !== undefined && badge !== null && (
        <View 
          className="absolute top-3 right-3 bg-white rounded-full px-2 py-1"
          style={{ minWidth: 24 }}
        >
          <Text className="text-purple-600 font-bold text-center">
            {badge}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
}
