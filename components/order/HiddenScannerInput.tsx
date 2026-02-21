import React from "react";
import { TextInput } from "react-native";
import { useRenderTrace } from "../../utils/debug/useRenderTrace";

interface HiddenScannerInputProps {
  inputRef: React.RefObject<TextInput>;
  onChangeText: (text: string) => void;
  onSubmitEditing: () => void;
  onBlur: () => void;
}

function HiddenScannerInputComponent({
  inputRef,
  onChangeText,
  onSubmitEditing,
  onBlur,
}: HiddenScannerInputProps) {
  useRenderTrace(
    "HiddenScannerInput",
    {
      onChangeText,
      onSubmitEditing,
      onBlur,
    },
    { throttleMs: 100 }
  );

  return (
    <TextInput
      ref={inputRef}
      style={{
        position: "absolute",
        width: 1,
        height: 1,
        opacity: 0,
        top: 0,
        left: 0,
      }}
      autoFocus
      blurOnSubmit={false}
      returnKeyType="done"
      onChangeText={onChangeText}
      onSubmitEditing={onSubmitEditing}
      onBlur={onBlur}
      showSoftInputOnFocus={false}
      caretHidden
    />
  );
}

export const HiddenScannerInput = React.memo(HiddenScannerInputComponent);
HiddenScannerInput.displayName = "HiddenScannerInput";
