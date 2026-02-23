import { colors, iconSize } from "@/utils/theme";
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

interface FilterDropdownBaseProps {
  label: string;
  placeholder?: string;
  allowClear?: boolean;
  width?: number;
  variant?: "default" | "primary" | "danger";
  options: FilterOption[];
}

type FilterDropdownProps =
  | (FilterDropdownBaseProps & {
      multiple?: false;
      value: string | null;
      onChange: (value: string | null) => void;
    })
  | (FilterDropdownBaseProps & {
      multiple: true;
      value: string[] | null;
      onChange: (value: string[] | null) => void;
    });

function hasAllOption(options: FilterOption[]) {
  return options.some((opt) => opt.value === "all");
}

// ============================================================================
// Component
// ============================================================================

export function FilterDropdown(props: FilterDropdownProps) {
  const {
    label,
    value,
    options,
    placeholder = "Select...",
    allowClear = true,
    width,
    variant = "default",
  } = props;
  const multiple = props.multiple === true;
  const [isOpen, setIsOpen] = useState(false);

  const selectedValues = multiple
    ? (Array.isArray(value) ? value : ([] as string[]))
    : (typeof value === "string" && value ? [value] : []);
  const selectedOptions = options.filter((opt) => selectedValues.includes(opt.value));
  const displayText = multiple
    ? (selectedOptions.length === 0
      ? placeholder
      : selectedOptions.map((option) => option.label).join(", "))
    : (options.find((opt) => opt.value === value)?.label || placeholder);
  const hasValue = selectedValues.length > 0;

  const handleSelect = (optionValue: string) => {
    if (multiple) {
      const hasAll = hasAllOption(options);
      const exists = selectedValues.includes(optionValue);
      let nextValues: string[];

      if (hasAll) {
        if (optionValue === "all") {
          nextValues = exists ? [] : ["all"];
        } else if (exists) {
          nextValues = selectedValues.filter((v) => v !== optionValue);
        } else {
          nextValues = [...selectedValues.filter((v) => v !== "all"), optionValue];
        }
      } else {
        nextValues = exists
          ? selectedValues.filter((v) => v !== optionValue)
          : [...selectedValues, optionValue];
      }

      props.onChange(nextValues.length > 0 ? nextValues : null);
      return;
    }
    props.onChange(optionValue);
    setIsOpen(false);
  };

  const handleClear = () => {
    if (multiple) {
      props.onChange(null);
      return;
    }
    props.onChange(null);
  };

  // Variant styles — use theme colors
  const getContainerStyle = () => {
    if (variant === "primary") return { backgroundColor: colors.info };
    if (variant === "danger") return { backgroundColor: colors.error };
    return undefined;
  };
  const containerClass = variant === "default" ? "bg-[#F7F7F9] border border-gray-200 shadow-sm" : "border-0";

  const textStyles = {
    default: hasValue ? "text-gray-800" : "text-gray-400",
    primary: "text-white",
    danger: "text-white",
  };

  const iconColor = {
    default: colors.textTertiary,
    primary: colors.textWhite,
    danger: colors.textWhite,
  };

  return (
    <View style={width ? { width } : undefined} className={!width ? "flex-1" : ""}>
      {label && <Text className="text-[#5A5F66] text-base mb-1">{label}</Text>}
      
      <Pressable
        onPress={() => setIsOpen(true)}
        style={getContainerStyle()}
        className={`${containerClass} rounded-xl px-3 py-2.5 flex-row items-center justify-between`}
      >
        <Text className={`${textStyles[variant]} flex-1 text-base`} numberOfLines={1}>
          {displayText}
        </Text>
        {allowClear && hasValue && variant === "default" ? (
          <Pressable onPress={handleClear} hitSlop={8}>
            <Ionicons name="close" size={iconSize.xs} color={iconColor[variant]} />
          </Pressable>
        ) : (
          <Ionicons name="chevron-down" size={iconSize.xs} color={iconColor[variant]} />
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
                    handleClear();
                    setIsOpen(false);
                  }}
                  className="px-4 py-3 border-b border-gray-100 flex-row items-center"
                >
                  <Text className="text-gray-500 italic">Clear selection</Text>
                </Pressable>
              )}
              {options.map((option) => {
                const isSelected = selectedValues.includes(option.value);
                return (
                  <Pressable
                    key={option.value}
                    onPress={() => handleSelect(option.value)}
                    style={isSelected ? { backgroundColor: colors.primaryLight } : undefined}
                    className="px-4 py-3 border-b border-gray-100 flex-row items-center justify-between"
                  >
                    <Text className={isSelected ? "font-medium" : ""} style={{ color: isSelected ? colors.primary : colors.text }}>
                      {option.label}
                    </Text>
                    {isSelected && (
                      <Ionicons name="checkmark" size={iconSize.md} color={colors.primary} />
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
