import { Text, View } from "react-native";

/**
 * BrandingSection - Unified branding placeholder component
 * Used across sidebars to display consistent branding area
 */
export function BrandingSection() {
  return (
    <View
      className="rounded-lg py-2 px-3 items-center justify-center"
      style={{
        backgroundColor: "#D9D9D9",
        borderWidth: 1,
        borderColor: "#1A1A1A",
        borderStyle: "dashed",
      }}
    >
      <Text style={{ fontSize: 12, color: "#1A1A1A", fontWeight: "500" }}>
        Branding
      </Text>
    </View>
  );
}
