import { Ionicons } from "@expo/vector-icons";
import { Image, View } from "react-native";
import { iconSize, colors } from "@/utils/theme";
import { useAppNavigation } from "../hooks/useAppNavigation";
import { SidebarButton } from "./SidebarButton";

interface BrandingSectionProps {
  showGoBack?: boolean;
}

/**
 * BrandingSection - Unified branding placeholder component
 * Displays the K-HUB logo and an optional "Go Back Menu" button.
 * Go to Menu: uses safeGoBack — third-level pages go to previous page,
 * second-level pages go to dashboard.
 */
export function BrandingSection({ showGoBack = true }: BrandingSectionProps) {
  const { safeGoBack, pathname } = useAppNavigation();

  // Check if we are NOT on the home page
  const isNotHomePage = pathname !== "/" && pathname !== "/index";

  return (
    <View style={{ gap: 12 }}>
      <View
        className="rounded-lg px-3 items-center justify-center"
        style={{
          height: 122,
          backgroundColor: colors.text, // Dark background to match design/logo
        }}
      >
        <Image 
          source={require("../assets/images/khub-white-logo.png")}
          style={{ width: "80%", height: 60 }}
          resizeMode="contain"
        />
      </View>

      {isNotHomePage && showGoBack && (
        <SidebarButton
          title="Go to Menu"
          icon={<Ionicons name="menu" size={iconSize['2xl']} />}
          onPress={safeGoBack}
          variant="outline"
        />
      )}
    </View>
  );
}
