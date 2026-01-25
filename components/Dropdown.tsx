import { Ionicons } from "@expo/vector-icons";
import { useState, useRef } from "react";
import { View, Text, Pressable, Modal, ScrollView, LayoutRectangle } from "react-native";

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
        <Text className="text-gray-600 text-sm mb-1.5">{label}</Text>
      )}

      {/* Trigger Button */}
      <Pressable
        ref={buttonRef}
        onPress={measureButton}
        disabled={disabled}
        className={`flex-row items-center justify-between bg-white border border-gray-200 rounded-lg px-3 py-2.5 ${
          disabled ? "opacity-50" : ""
        }`}
        style={({ pressed }) => ({ opacity: disabled ? 0.5 : pressed ? 0.7 : 1 })}
      >
        <Text
          className={selectedOption ? "text-gray-800" : "text-gray-400"}
          numberOfLines={1}
        >
          {selectedOption?.label || placeholder}
        </Text>
        <Ionicons
          name={isOpen ? "chevron-up" : "chevron-down"}
          size={18}
          color="#9ca3af"
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
                        className={`${
                          option.value === value ? "text-red-500 font-medium" : "text-gray-700"
                        }`}
                      >
                        {option.label}
                      </Text>
                      {option.value === value && (
                        <Ionicons name="checkmark" size={18} color="#ef4444" />
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
