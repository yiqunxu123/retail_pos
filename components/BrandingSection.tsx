import { Ionicons } from "@expo/vector-icons";
import { Image, Pressable, View } from "react-native";
import { iconSize, colors } from "@/utils/theme";
import { useAppNavigation } from "../hooks/useAppNavigation";
import { SidebarButton } from "./SidebarButton";

interface BrandingSectionProps {
  showGoBack?: boolean;
}

/**
 * BrandingSection - Unified branding placeholder component
 * Displays the K-HUB logo and an optional "Go Back Menu" button
 */
export function BrandingSection({ showGoBack = true }: BrandingSectionProps) {
  const { navigateTo, pathname } = useAppNavigation();

  // Check if we are NOT on the home page
  const isNotHomePage = pathname !== "/" && pathname !== "/index";

  return (
    <View style={{ gap: 12 }}>
      <Pressable
        onPress={() => navigateTo("/")}
        className="rounded-lg px-3 items-center justify-center active:opacity-70"
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
      </Pressable>

      {isNotHomePage && showGoBack && (
        <SidebarButton
          title="Go to Menu"
          icon={<Ionicons name="menu" size={iconSize['2xl']} />}
          onPress={() => navigateTo("/")}
          variant="outline"
        />
      )}
    </View>
  );
}
