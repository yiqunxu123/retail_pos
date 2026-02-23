import { LinearGradient } from "expo-linear-gradient";
import React, { ReactNode } from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { fontSize, fontWeight, colors } from '@/utils/theme';

interface ActionCardProps {
  title: string;
  backgroundColor?: string;
  gradientColors?: readonly [string, string, ...string[]];
  disabledColor?: string;
  onPress?: () => void;
  disabled?: boolean;
  height?: number;
  badge?: number | string;
  icon?: ReactNode;
  /** Outline style: white bg with colored border + colored text */
  outline?: boolean;
  /** Gray mode for non-clocked in state */
  isGrayedOut?: boolean;
  /** Custom colors for gray mode */
  grayVariant?: "dark" | "light";
}

export function ActionCard({
  title,
  backgroundColor = colors.primary,
  gradientColors,
  disabledColor = "#848484",
  onPress,
  disabled = false,
  height = 180,
  badge,
  icon,
  outline = false,
  isGrayedOut = false,
  grayVariant = "dark",
}: ActionCardProps) {
  const finalDisabled = disabled || isGrayedOut;
  
  // Define gray mode colors
  const grayBg = grayVariant === "light" ? "#F2F2F2" : "#8E8E8E";
  const grayText = grayVariant === "light" ? "#666666" : "#FFFFFF";
  const grayIcon = grayVariant === "light" ? "#666666" : "#FFFFFF";

  const color = finalDisabled ? (isGrayedOut ? grayBg : disabledColor) : backgroundColor;
  const showGradient = !outline && !finalDisabled && gradientColors && gradientColors.length >= 2;

  const content = (
    <>
      {icon && (
        <View className="w-16 h-16 bg-white/20 rounded-xl items-center justify-center mb-1">
          {React.isValidElement(icon) 
            ? React.cloneElement(icon as any, { color: isGrayedOut ? grayIcon : (icon.props as any).color || (outline ? color : "#FFFFFF") })
            : icon}
        </View>
      )}
      <Text 
        style={{ 
          fontSize: fontSize['2xl'], 
          fontWeight: fontWeight.semibold,
          fontFamily: "Montserrat",
          color: isGrayedOut ? grayText : (outline ? color : "#FFFFFF"),
          textAlign: "center"
        }}
      >
        {title}
      </Text>
      {badge !== undefined && badge !== null && !isGrayedOut && (
        <View 
          className="absolute top-3 right-3 bg-white rounded-full px-2 py-1"
          style={{ minWidth: 24 }}
        >
          <Text className="text-purple-600 font-bold text-center">
            {badge}
          </Text>
        </View>
      )}
    </>
  );

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={finalDisabled}
      className="flex-1 rounded-xl overflow-hidden"
      style={{
        backgroundColor: isGrayedOut ? grayBg : (outline ? "#FFFFFF" : (showGradient ? undefined : color)),
        borderWidth: outline && !isGrayedOut ? 2 : 0,
        borderColor: outline && !isGrayedOut ? color : undefined,
        height: height,
        minHeight: height,
        shadowColor: "#989898",
        shadowOffset: { width: 4, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 4,
        opacity: finalDisabled ? (isGrayedOut ? 1 : 0.7) : 1,
      }}
    >
      {showGradient ? (
        <LinearGradient
          colors={gradientColors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ flex: 1, justifyContent: "center", alignItems: "center", padding: 16 }}
        >
          {content}
        </LinearGradient>
      ) : (
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center", padding: 16 }}>
          {content}
        </View>
      )}
    </TouchableOpacity>
  );
}
