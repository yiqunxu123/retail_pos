import { View, Text, TextInput, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";

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

  return (
    <View className="mb-4">
      <Text className="text-[#5A5F66] text-[18px] mb-1.5" style={{ fontFamily: 'Montserrat' }}>{label}</Text>
      <InputWrapper
        onPress={isDropdown || isDatePicker ? onDropdownPress : undefined}
        className="flex-row items-center bg-white border border-gray-200 rounded-xl px-3 py-3 shadow-sm"
      >
        {isDropdown || isDatePicker ? (
          <>
            <Text className={`flex-1 text-[18px] ${value ? "text-gray-800" : "text-gray-400"}`} style={{ fontFamily: 'Montserrat' }}>
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
            className="flex-1 text-gray-800 text-[18px]"
            style={{ fontFamily: 'Montserrat' }}
            value={value}
            onChangeText={onChangeText}
            placeholder={placeholder}
            placeholderTextColor="#9ca3af"
            editable={editable}
            multiline={multiline}
            numberOfLines={multiline ? 3 : 1}
          />
        )}
      </InputWrapper>
    </View>
  );
}
