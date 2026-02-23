import React from "react";
import { TextInput } from "react-native";

interface HiddenScannerInputProps {
  inputRef: React.RefObject<TextInput | null>;
  onChangeText: (text: string) => void;
  onSubmitEditing: () => void;
  onFocus?: () => void;
  onBlur: () => void;
}

function HiddenScannerInputComponent({
  inputRef,
  onChangeText,
  onSubmitEditing,
  onFocus,
  onBlur,
}: HiddenScannerInputProps) {
  return (
    <TextInput
      ref={inputRef}
      defaultValue=""
      style={{
        position: "absolute",
        width: 1,
        height: 1,
        opacity: 0.01,
        top: -1000,
        left: -1000,
      }}
      autoFocus={false}
      blurOnSubmit={false}
      returnKeyType="done"
      onChangeText={onChangeText}
      onSubmitEditing={onSubmitEditing}
      onFocus={onFocus}
      onBlur={onBlur}
      showSoftInputOnFocus={false}
      caretHidden
    />
  );
}

export const HiddenScannerInput = React.memo(HiddenScannerInputComponent);
HiddenScannerInput.displayName = "HiddenScannerInput";
