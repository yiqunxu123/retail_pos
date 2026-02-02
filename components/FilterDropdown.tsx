import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { Modal, Pressable, ScrollView, Text, View } from "react-native";

// ============================================================================
// Types
// ============================================================================

export interface FilterOption {
  label: string;
  value: string;
}

interface FilterDropdownProps {
  label: string;
  value: string | null;
  options: FilterOption[];
  onChange: (value: string | null) => void;
  placeholder?: string;
  allowClear?: boolean;
  width?: number;
  variant?: "default" | "primary" | "danger";
}

// ============================================================================
// Component
// ============================================================================

export function FilterDropdown({
  label,
  value,
  options,
  onChange,
  placeholder = "Select...",
  allowClear = true,
  width,
  variant = "default",
}: FilterDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);

  const selectedOption = options.find((opt) => opt.value === value);
  const displayText = selectedOption?.label || placeholder;

  const handleSelect = (optionValue: string) => {
    onChange(optionValue);
    setIsOpen(false);
  };

  const handleClear = () => {
    onChange(null);
  };

  // Variant styles
  const containerStyles = {
    default: "bg-gray-50 border border-gray-200",
    primary: "bg-blue-500",
    danger: "bg-red-500",
  };

  const textStyles = {
    default: value ? "text-gray-800" : "text-gray-400",
    primary: "text-white",
    danger: "text-white",
  };

  const iconColor = {
    default: "#9ca3af",
    primary: "white",
    danger: "white",
  };

  return (
    <View style={width ? { width } : undefined} className={!width ? "flex-1" : ""}>
      {label && <Text className="text-gray-500 text-xs mb-1">{label}</Text>}
      
      <Pressable
        onPress={() => setIsOpen(true)}
        className={`${containerStyles[variant]} rounded-lg px-3 py-2 flex-row items-center justify-between`}
      >
        <Text className={`${textStyles[variant]} flex-1`} numberOfLines={1}>
          {displayText}
        </Text>
        {allowClear && value && variant === "default" ? (
          <Pressable onPress={handleClear} hitSlop={8}>
            <Ionicons name="close" size={14} color={iconColor[variant]} />
          </Pressable>
        ) : (
          <Ionicons name="chevron-down" size={14} color={iconColor[variant]} />
        )}
      </Pressable>

      {/* Dropdown Modal */}
      <Modal
        visible={isOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsOpen(false)}
      >
        <Pressable
          className="flex-1 bg-black/30 justify-center items-center"
          onPress={() => setIsOpen(false)}
        >
          <View className="bg-white rounded-xl w-72 max-h-96 shadow-xl">
            {/* Header */}
            <View className="px-4 py-3 border-b border-gray-200">
              <Text className="text-gray-800 font-semibold">{label || "Select Option"}</Text>
            </View>

            {/* Options */}
            <ScrollView className="max-h-72">
              {allowClear && (
                <Pressable
                  onPress={() => {
                    onChange(null);
                    setIsOpen(false);
                  }}
                  className="px-4 py-3 border-b border-gray-100 flex-row items-center"
                >
                  <Text className="text-gray-500 italic">Clear selection</Text>
                </Pressable>
              )}
              {options.map((option) => {
                const isSelected = option.value === value;
                return (
                  <Pressable
                    key={option.value}
                    onPress={() => handleSelect(option.value)}
                    className={`px-4 py-3 border-b border-gray-100 flex-row items-center justify-between ${
                      isSelected ? "bg-blue-50" : ""
                    }`}
                  >
                    <Text className={isSelected ? "text-blue-600 font-medium" : "text-gray-800"}>
                      {option.label}
                    </Text>
                    {isSelected && (
                      <Ionicons name="checkmark" size={18} color="#2563eb" />
                    )}
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}
