import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Image,
    Keyboard,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    ScrollView,
    Text,
    TextInput,
    TouchableWithoutFeedback,
    View,
    useWindowDimensions,
} from "react-native";
import { useAuth } from "../contexts/AuthContext";
import { usePowerSync } from "../utils/powersync/PowerSyncProvider";
import { fontSize, fontWeight, colors, iconSize, spacing, radius } from '@/utils/theme';

/**
 * LoginScreen - Authentication screen with split layout
 * Left panel: Branding with logo and POS description
 * Right panel: Login form
 */
export default function LoginScreen() {
  const { login, isLoading: authLoading, error: authError, clearError } = useAuth();
  const { reconnect } = usePowerSync();
  const { width, height } = useWindowDimensions();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isWideScreen = width >= 768;

  // Show error alert when authError changes
  useEffect(() => {
    if (authError) {
      Alert.alert("Login Failed", authError, [
        {
          text: "OK",
          onPress: () => clearError(),
        },
      ]);
    }
  }, [authError, clearError]);

  const handleLogin = async () => {
    if (!username || !password) {
      Alert.alert("Error", "Please enter username and password");
      return;
    }

    Keyboard.dismiss();
    setIsSubmitting(true);

    try {
      const result = await login(username, password);

      if (!result.success) {
        setIsSubmitting(false);
      } else {
        // Login successful - connect to PowerSync for real-time sync
        console.log("[Login] Connecting to PowerSync...");
        try {
          await reconnect();
          console.log("[Login] PowerSync connected");
        } catch (syncError) {
          console.log("[Login] PowerSync connection failed:", syncError);
        }
      }
    } catch (error) {
      Alert.alert("Error", "An unexpected error occurred during login");
      setIsSubmitting(false);
    }
  };

  const handleForgotPassword = () => {
    Alert.alert(
      "Forgot Password",
      "Please contact your administrator to reset your password.",
      [{ text: "OK" }]
    );
  };

  const isLoading = isSubmitting || authLoading;
  const isButtonDisabled = isLoading || !username || !password;

  // For wide screens (tablet/desktop), show split layout
  if (isWideScreen) {
    return (
      <View className="flex-1 flex-row bg-[#F7F7F9]">
        {/* Left Panel - Branding */}
        <View style={{ width: "35%", minWidth: 420, maxWidth: 600 }}>
          <View className="flex-1 relative">
            {/* Background Image */}
            <Image
              source={require("../assets/images/login-bg.png")}
              className="absolute inset-0 w-full h-full"
              resizeMode="cover"
            />
            {/* Red Overlay */}
            <View 
              className="absolute inset-0"
              style={{ backgroundColor: "rgba(236, 26, 82, 0.85)" }}
            />
            
            {/* Content */}
            <View className="flex-1 p-8 justify-between z-10">
              {/* Top: Logo and Title */}
              <View>
                {/* Logo */}
                <View 
                  className="bg-white rounded-xl px-5 py-3 self-start mb-16"
                  style={{ 
                    shadowColor: "#000",
                    shadowOffset: { width: 4, height: 4 },
                    shadowOpacity: 0.25,
                    shadowRadius: 4,
                    elevation: 8,
                  }}
                >
                  <Image
                    source={require("../assets/images/khub-logo.png")}
                    style={{ width: 100, height: 38 }}
                    resizeMode="contain"
                  />
                </View>

                {/* POS System Title */}
                <View className="mt-4">
                  <Text 
                    className="text-white font-bold mb-4"
                    style={{ fontSize: 40, lineHeight: 44, letterSpacing: -0.5 }}
                  >
                    POS System
                  </Text>
                  <Text 
                    className="text-white font-medium"
                    style={{ fontSize: fontSize.base, lineHeight: 20 }}
                  >
                    A unified interface for managing customers, items, payments, and loyalty during checkout.
                  </Text>
                </View>
              </View>

              {/* Bottom: Footer Links - Wrap to prevent overflow */}
              <View className="flex-row flex-wrap items-center" style={{ gap: 12 }}>
                <Text className="text-white font-bold" style={{ fontSize: fontSize.base }}>
                  © 2026 Kommerce Hub
                </Text>
                <Text className="text-white font-medium" style={{ fontSize: fontSize.base }}>
                  Privacy
                </Text>
                <Text className="text-white font-medium" style={{ fontSize: fontSize.base }}>
                  Legal
                </Text>
                <Text className="text-white font-medium" style={{ fontSize: fontSize.base }}>
                  Contact
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Right Panel - Login Form */}
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          className="flex-1 bg-[#F7F7F9]"
          keyboardVerticalOffset={0}
        >
          <ScrollView 
            contentContainerStyle={{ flexGrow: 1, justifyContent: "center", paddingHorizontal: 24 }}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
              <View className="w-full max-w-md self-center py-8">
                {/* Header */}
                <View className="items-center mb-8">
                  <Text 
                    className="text-gray-800 font-semibold mb-2 text-center"
                    style={{ fontSize: fontSize['3xl'], lineHeight: 40, letterSpacing: -0.5 }}
                  >
                    Login to Your Account
                  </Text>
                  <Text className="text-gray-500 text-center" style={{ fontSize: fontSize.lg }}>
                    Enter your username and password
                  </Text>
                </View>

                {/* Form */}
                <View style={{ gap: 20 }}>
                  {/* Email/Username Input */}
                  <View>
                    <Text 
                      className="text-gray-600 font-medium mb-2"
                      style={{ fontSize: fontSize.lg }}
                    >
                      Email Address
                    </Text>
                    <View
                      className="rounded-lg"
                      style={{
                        backgroundColor: isLoading ? colors.backgroundSecondary : colors.background,
                        borderWidth: 1,
                        borderColor: isLoading ? colors.borderMedium : "#D9D9D9",
                        shadowColor: "#3F3C3D",
                        shadowOffset: { width: 0, height: 4 },
                        shadowOpacity: 0.08,
                        shadowRadius: 24,
                        elevation: 2,
                      }}
                    >
                      <TextInput
                        className={`px-4 py-4 ${isLoading ? "text-gray-400" : "text-gray-800"}`}
                        style={{ fontSize: fontSize.lg }}
                        placeholder="Enter your email address"
                        placeholderTextColor={isLoading ? "#B8BEC8" : colors.textTertiary}
                        value={username}
                        onChangeText={setUsername}
                        keyboardType="email-address"
                        autoCapitalize="none"
                        autoCorrect={false}
                        editable={!isLoading}
                        returnKeyType="next"
                      />
                    </View>
                  </View>

                  {/* Password Input */}
                  <View>
                    <Text 
                      className="text-gray-600 font-medium mb-2"
                      style={{ fontSize: fontSize.lg }}
                    >
                      Password
                    </Text>
                    <View
                      className="flex-row items-center rounded-lg"
                      style={{
                        backgroundColor: isLoading ? colors.backgroundSecondary : colors.background,
                        borderWidth: 1,
                        borderColor: isLoading ? colors.borderMedium : "#D9D9D9",
                        shadowColor: "#3F3C3D",
                        shadowOffset: { width: 0, height: 4 },
                        shadowOpacity: 0.08,
                        shadowRadius: 24,
                        elevation: 2,
                      }}
                    >
                      <TextInput
                        className={`flex-1 px-4 py-4 ${isLoading ? "text-gray-400" : "text-gray-800"}`}
                        style={{ fontSize: fontSize.lg }}
                        placeholder="Enter your password"
                        placeholderTextColor={isLoading ? "#B8BEC8" : colors.textTertiary}
                        value={password}
                        onChangeText={setPassword}
                        secureTextEntry={!showPassword}
                        autoCapitalize="none"
                        editable={!isLoading}
                        onSubmitEditing={handleLogin}
                        returnKeyType="done"
                      />
                      <Pressable
                        onPress={() => setShowPassword(!showPassword)}
                        className="px-4 py-4"
                        style={({ pressed }) => ({ opacity: pressed ? 0.5 : 1 })}
                        disabled={isLoading}
                      >
                        <Ionicons
                          name={showPassword ? "eye-outline" : "eye-off-outline"}
                          size={iconSize.lg}
                          color={colors.textTertiary}
                        />
                      </Pressable>
                    </View>

                    {/* Forgot Password */}
                    <Pressable
                      onPress={handleForgotPassword}
                      className="self-end mt-3"
                      style={({ pressed }) => ({ opacity: pressed ? 0.5 : 1 })}
                      disabled={isLoading}
                    >
                      <Text 
                        className="font-semibold"
                        style={{ fontSize: fontSize.lg, color: "#EA1E51" }}
                      >
                        Forgot your password?
                      </Text>
                    </Pressable>
                  </View>

                  {/* Login Button */}
                  <Pressable
                    onPress={handleLogin}
                    disabled={isButtonDisabled}
                    className="py-4 rounded-lg items-center flex-row justify-center mt-4"
                    style={{
                      backgroundColor: isButtonDisabled ? "#F48BA3" : colors.primary,
                      shadowColor: "#000",
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: 0.15,
                      shadowRadius: 4,
                      elevation: 4,
                    }}
                  >
                    {isLoading ? (
                      <>
                        <ActivityIndicator size="small" color="#ffffff" />
                        <Text className="text-white font-semibold ml-2" style={{ fontSize: fontSize.xl }}>
                          Logging in...
                        </Text>
                      </>
                    ) : (
                      <Text className="text-white font-semibold" style={{ fontSize: fontSize.xl }}>
                        Login
                      </Text>
                    )}
                  </Pressable>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </ScrollView>
        </KeyboardAvoidingView>
      </View>
    );
  }

  // For narrow screens (phone), show stacked layout
  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      className="flex-1 bg-[#F7F7F9]"
      keyboardVerticalOffset={0}
    >
      {/* Compact header for mobile */}
      <View 
        className="px-6 py-6"
        style={{ backgroundColor: colors.primary }}
      >
        <Image
          source={require("../assets/images/khub-logo.png")}
          style={{ width: 100, height: 38 }}
          resizeMode="contain"
        />
        <Text className="text-white font-bold mt-3" style={{ fontSize: fontSize['2xl'] }}>
          POS System
        </Text>
      </View>

      {/* Login Form */}
      <ScrollView 
        contentContainerStyle={{ flexGrow: 1, justifyContent: "center", paddingHorizontal: 24 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View className="w-full py-6">
            {/* Header */}
            <View className="items-center mb-6">
              <Text 
                className="text-gray-800 font-semibold mb-2 text-center"
                style={{ fontSize: 28, lineHeight: 34 }}
              >
                Login to Your Account
              </Text>
              <Text className="text-gray-500 text-center" style={{ fontSize: fontSize.base }}>
                Enter your username and password
              </Text>
            </View>

            {/* Form */}
            <View style={{ gap: 16 }}>
              {/* Email/Username Input */}
              <View>
                <Text className="text-gray-600 font-medium mb-2" style={{ fontSize: fontSize.base }}>
                  Email Address
                </Text>
                <View
                  className="rounded-lg"
                  style={{
                    backgroundColor: isLoading ? colors.backgroundSecondary : colors.background,
                    borderWidth: 1,
                    borderColor: isLoading ? colors.borderMedium : "#D9D9D9",
                  }}
                >
                  <TextInput
                    className={`px-4 py-3 ${isLoading ? "text-gray-400" : "text-gray-800"}`}
                    style={{ fontSize: fontSize.lg }}
                    placeholder="Enter your email address"
                    placeholderTextColor={isLoading ? "#B8BEC8" : colors.textTertiary}
                    value={username}
                    onChangeText={setUsername}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    editable={!isLoading}
                    returnKeyType="next"
                  />
                </View>
              </View>

              {/* Password Input */}
              <View>
                <Text className="text-gray-600 font-medium mb-2" style={{ fontSize: fontSize.base }}>
                  Password
                </Text>
                <View
                  className="flex-row items-center rounded-lg"
                  style={{
                    backgroundColor: isLoading ? colors.backgroundSecondary : colors.background,
                    borderWidth: 1,
                    borderColor: isLoading ? colors.borderMedium : "#D9D9D9",
                  }}
                >
                  <TextInput
                    className={`flex-1 px-4 py-3 ${isLoading ? "text-gray-400" : "text-gray-800"}`}
                    style={{ fontSize: fontSize.lg }}
                    placeholder="Enter your password"
                    placeholderTextColor={isLoading ? "#B8BEC8" : colors.textTertiary}
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                    editable={!isLoading}
                    onSubmitEditing={handleLogin}
                    returnKeyType="done"
                  />
                  <Pressable
                    onPress={() => setShowPassword(!showPassword)}
                    className="px-4 py-3"
                    disabled={isLoading}
                  >
                    <Ionicons
                      name={showPassword ? "eye-outline" : "eye-off-outline"}
                      size={iconSize.base}
                      color={colors.textTertiary}
                    />
                  </Pressable>
                </View>

                {/* Forgot Password */}
                <Pressable
                  onPress={handleForgotPassword}
                  className="self-end mt-2"
                  disabled={isLoading}
                >
                  <Text 
                    className="font-semibold"
                    style={{ fontSize: fontSize.base, color: "#EA1E51" }}
                  >
                    Forgot your password?
                  </Text>
                </Pressable>
              </View>

              {/* Login Button */}
              <Pressable
                onPress={handleLogin}
                disabled={isButtonDisabled}
                className="py-4 rounded-lg items-center flex-row justify-center mt-2"
                style={{
                  backgroundColor: isButtonDisabled ? "#F48BA3" : colors.primary,
                  shadowColor: colors.black,
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.15,
                  shadowRadius: 4,
                  elevation: 4,
                }}
              >
                {isLoading ? (
                  <>
                    <ActivityIndicator size="small" color="#ffffff" />
                    <Text className="text-white font-semibold ml-2" style={{ fontSize: fontSize.lg }}>
                      Logging in...
                    </Text>
                  </>
                ) : (
                  <Text className="text-white font-semibold" style={{ fontSize: fontSize.lg }}>
                    Login
                  </Text>
                )}
              </Pressable>
            </View>

            {/* Server Info */}
            <View className="mt-6 bg-gray-200 rounded-lg p-3">
              <Text className="text-gray-500 text-xs text-center">
                Connected to KHUB Backend
              </Text>
              <Text className="text-gray-400 text-xs text-center mt-1">
                {process.env.EXPO_PUBLIC_KHUB_API_URL || "http://localhost:5002"}
              </Text>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
