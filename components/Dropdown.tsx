import { colors, iconSize } from "@/utils/theme";
import { Ionicons } from "@expo/vector-icons";
import { useRef, useState } from "react";
import { LayoutRectangle, Modal, Pressable, ScrollView, Text, View } from "react-native";

export interface DropdownOption {
  value: string;
  label: string;
}

interface DropdownProps {
  label?: string;
  placeholder?: string;
  options: DropdownOption[];
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

/**
 * Dropdown - Reusable dropdown select component
 * Opens a modal with scrollable options list
 */
export function Dropdown({
  label,
  placeholder = "Select...",
  options,
  value,
  onChange,
  disabled = false,
}: DropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [buttonLayout, setButtonLayout] = useState<LayoutRectangle | null>(null);
  const buttonRef = useRef<View>(null);

  const selectedOption = options.find((opt) => opt.value === value);

  const handleSelect = (optionValue: string) => {
    onChange(optionValue);
    setIsOpen(false);
  };

  const measureButton = () => {
    buttonRef.current?.measureInWindow((x, y, width, height) => {
      setButtonLayout({ x, y, width, height });
      setIsOpen(true);
    });
  };

  return (
    <View>
      {/* Label */}
      {label && (
        <Text className="text-[#5A5F66] text-[18px] mb-1.5" style={{ fontFamily: 'Montserrat' }}>{label}</Text>
      )}

      {/* Trigger Button */}
      <Pressable
        ref={buttonRef}
        onPress={measureButton}
        disabled={disabled}
        className={`flex-row items-center justify-between bg-white border border-gray-200 rounded-xl px-3 py-3 shadow-sm ${
          disabled ? "opacity-50" : ""
        }`}
        style={({ pressed }) => ({ opacity: disabled ? 0.5 : pressed ? 0.7 : 1 })}
      >
        <Text
          className={`text-[18px] ${selectedOption ? "text-gray-800" : "text-gray-400"}`}
          style={{ fontFamily: 'Montserrat' }}
          numberOfLines={1}
        >
          {selectedOption?.label || placeholder}
        </Text>
        <Ionicons
          name={isOpen ? "chevron-up" : "chevron-down"}
          size={iconSize.base}
          color={colors.textTertiary}
        />
      </Pressable>

      {/* Dropdown Modal */}
      <Modal
        visible={isOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsOpen(false)}
      >
        <Pressable
          className="flex-1"
          onPress={() => setIsOpen(false)}
        >
          {buttonLayout && (
            <View
              className="absolute bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden"
              style={{
                top: buttonLayout.y + buttonLayout.height + 4,
                left: buttonLayout.x,
                width: buttonLayout.width,
                maxHeight: 250,
              }}
            >
              <ScrollView>
                {options.map((option, index) => (
                  <Pressable
                    key={option.value}
                    onPress={() => handleSelect(option.value)}
                    className={`px-4 py-3 ${
                      index < options.length - 1 ? "border-b border-gray-100" : ""
                    } ${option.value === value ? "bg-red-50" : ""}`}
                    style={({ pressed }) => ({
                      backgroundColor:
                        pressed ? "#f3f4f6" : option.value === value ? "#fef2f2" : "white",
                    })}
                  >
                    <View className="flex-row items-center justify-between">
                      <Text
                        className={`text-[18px] ${
                          option.value === value ? "text-red-500 font-medium" : "text-gray-700"
                        }`}
                        style={{ fontFamily: 'Montserrat' }}
                      >
                        {option.label}
                      </Text>
                      {option.value === value && (
                        <Ionicons name="checkmark" size={iconSize.base} color={colors.error} />
                      )}
                    </View>
                  </Pressable>
                ))}
              </ScrollView>
            </View>
          )}
        </Pressable>
      </Modal>
    </View>
  );
}
