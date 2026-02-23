import React from "react";
import {
    StyleSheet,
    TextInput,
    View,
    type StyleProp,
    type TextInputProps,
    type TextStyle,
    type ViewStyle,
} from "react-native";

interface EditableStateInputProps extends Omit<TextInputProps, "style"> {
  containerClassName?: string;
  inputClassName?: string;
  containerStyle?: StyleProp<ViewStyle>;
  inputStyle?: StyleProp<TextStyle>;
}

export function EditableStateInput({
  editable = true,
  containerClassName,
  inputClassName,
  containerStyle,
  inputStyle,
  placeholderTextColor,
  ...inputProps
}: EditableStateInputProps) {
  const disabled = !editable;

  return (
    <View
      className={containerClassName}
      style={[styles.container, disabled && styles.containerDisabled, containerStyle]}
    >
      <TextInput
        {...inputProps}
        editable={editable}
        className={inputClassName}
        placeholderTextColor={
          disabled ? "#B8BEC8" : (placeholderTextColor ?? "#9CA3AF")
        }
        style={[styles.input, disabled && styles.inputDisabled, inputStyle]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#FFFFFF",
    borderColor: "#E5E7EB",
    borderWidth: 1,
    borderRadius: 8,
  },
  containerDisabled: {
    backgroundColor: "#F3F4F6",
    borderColor: "#D1D5DB",
  },
  input: {
    color: "#1F2937",
  },
  inputDisabled: {
    color: "#9CA3AF",
  },
});
