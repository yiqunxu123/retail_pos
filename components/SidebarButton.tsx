import { Text, TouchableOpacity, View } from "react-native";
import { ReactNode } from "react";

interface SidebarButtonProps {
  title: string;
  icon?: ReactNode;
  onPress?: () => void;
  isActive?: boolean;
  fullWidth?: boolean;
}

// Consistent text style for all button states
const TEXT_STYLE = {
  fontSize: 14,
  fontWeight: "500" as const,
};

/**
 * SidebarButton - Unified button component for all sidebars
 * Matches the StaffButton design with active/inactive states
 */
export function SidebarButton({
  title,
  icon,
  onPress,
  isActive = true,
  fullWidth = true,
}: SidebarButtonProps) {
  const textColor = isActive ? "#EC1A52" : "#848484";

  // Inactive style (gray bg, gray border, gray text, disabled look)
  if (!isActive) {
    return (
      <View
        className={`${fullWidth ? "w-full" : "flex-1"} rounded-lg justify-center items-center py-3`}
        style={{
          backgroundColor: "#F2F2F2",
          borderWidth: 1,
          borderColor: "#848484",
          opacity: 0.5,
        }}
      >
        {icon}
        <Text style={{ ...TEXT_STYLE, color: textColor, textAlign: "center", marginTop: 4 }}>
          {title}
        </Text>
      </View>
    );
  }

  // Active style (white bg, red border, red text)
  return (
    <TouchableOpacity
      onPress={onPress}
      className={`${fullWidth ? "w-full" : "flex-1"} rounded-lg justify-center items-center py-3`}
      style={{
        backgroundColor: "#FFFFFF",
        borderWidth: 1,
        borderColor: "#EC1A52",
        shadowColor: "#000",
        shadowOffset: { width: 1, height: 1 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 2,
      }}
    >
      {icon}
      <Text style={{ ...TEXT_STYLE, color: textColor, textAlign: "center", marginTop: 4 }}>
        {title}
      </Text>
    </TouchableOpacity>
  );
}
