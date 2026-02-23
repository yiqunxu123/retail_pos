import { Ionicons } from "@expo/vector-icons";
import { Pressable, Text, TextInput, View } from "react-native";

interface FormInputProps {
  label: string;
  value: string;
  onChangeText?: (text: string) => void;
  placeholder?: string;
  isDropdown?: boolean;
  onDropdownPress?: () => void;
  isDatePicker?: boolean;
  editable?: boolean;
  multiline?: boolean;
}

/**
 * FormInput - Reusable form input component
 * Supports text input, dropdown, and date picker styles
 */
export function FormInput({
  label,
  value,
  onChangeText,
  placeholder,
  isDropdown,
  onDropdownPress,
  isDatePicker,
  editable = true,
  multiline,
}: FormInputProps) {
  const InputWrapper = isDropdown || isDatePicker ? Pressable : View;
  const disabled = !editable;

  return (
    <View className="mb-4">
      <Text className="text-[#5A5F66] text-lg mb-1.5">{label}</Text>
      <InputWrapper
        onPress={isDropdown || isDatePicker ? onDropdownPress : undefined}
        className={`flex-row items-center border border-gray-200 rounded-xl px-3 py-3 shadow-sm ${disabled ? "bg-gray-100 border-gray-300" : "bg-white"}`}
      >
        {isDropdown || isDatePicker ? (
          <>
            <Text className={`flex-1 text-lg ${value ? "text-gray-800" : "text-gray-400"}`}>
              {value || placeholder}
            </Text>
            <Ionicons
              name={isDatePicker ? "calendar-outline" : "chevron-down"}
              size={20}
              color="#9ca3af"
            />
          </>
        ) : (
          <TextInput
            className={`flex-1 text-lg ${disabled ? "text-gray-400" : "text-gray-800"}`}
            value={value}
            onChangeText={onChangeText}
            placeholder={placeholder}
            placeholderTextColor={disabled ? "#b8bec8" : "#9ca3af"}
            editable={editable}
            multiline={multiline}
            numberOfLines={multiline ? 3 : 1}
          />
        )}
      </InputWrapper>
    </View>
  );
}
