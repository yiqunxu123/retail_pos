import { Pressable, Text, View } from "react-native";

interface RadioOption {
  value: string;
  label: string;
}

interface RadioGroupProps {
  label: string;
  options: RadioOption[];
  value: string;
  onChange: (value: string) => void;
}

/**
 * RadioGroup - Radio button group component
 */
export function RadioGroup({ label, options, value, onChange }: RadioGroupProps) {
  return (
    <View className="mb-4">
      <Text className="text-gray-600 text-sm mb-2">{label}</Text>
      <View className="flex-row gap-6">
        {options.map((option) => (
          <Pressable
            key={option.value}
            onPress={() => onChange(option.value)}
            className="flex-row items-center gap-2"
          >
            <View
              className={`w-5 h-5 rounded-full border-2 items-center justify-center ${
                value === option.value ? "border-red-500" : "border-gray-300"
              }`}
            >
              {value === option.value && (
                <View className="w-2.5 h-2.5 rounded-full bg-red-500" />
              )}
            </View>
            <Text className="text-gray-700">{option.label}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}
