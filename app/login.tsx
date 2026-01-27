import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";
import { useAuth } from "../contexts/AuthContext";
import { usePowerSync } from "../utils/powersync/PowerSyncProvider";

/**
 * LoginScreen - Authentication screen
 * Connects to KHUB backend for user authentication
 */
export default function LoginScreen() {
  const { login, isLoading: authLoading, error: authError, clearError } = useAuth();
  const { reconnect } = usePowerSync();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

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

    setIsSubmitting(true);

    try {
      const result = await login(username, password);

      if (!result.success) {
        // Error is handled by the useEffect above via authError
        setIsSubmitting(false);
      } else {
        // Login successful - connect to PowerSync for real-time sync
        console.log("[Login] Connecting to PowerSync...");
        try {
          await reconnect();
          console.log("[Login] PowerSync connected");
        } catch (syncError) {
          console.log("[Login] PowerSync connection failed:", syncError);
          // Don't block login if PowerSync fails
        }
      }
      // If login succeeds, isAuthenticated state change will automatically
      // trigger _layout.tsx to show the main content instead of login screen
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

  return (
    <View className="flex-1 bg-gray-50">
      {/* Background Stripes Pattern */}
      <View className="absolute inset-0 flex-row">
        {Array.from({ length: 20 }).map((_, i) => (
          <View
            key={i}
            className="flex-1"
            style={{
              backgroundColor: i % 2 === 0 ? "#f9fafb" : "#f3f4f6",
            }}
          />
        ))}
      </View>

      {/* Content */}
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1 justify-center items-center px-6"
      >
        <View className="w-full max-w-md">
          {/* Header */}
          <View className="items-center mb-8">
            <Text className="text-3xl font-bold text-gray-800 mb-2">
              Login to Your Account
            </Text>
            <Text className="text-gray-500">
              Enter your username and password
            </Text>
          </View>

          {/* Form */}
          <View className="bg-white/80 rounded-xl p-6">
            {/* Username Input */}
            <View className="mb-4">
              <Text className="text-gray-600 text-sm mb-2">Username or Email</Text>
              <TextInput
                className="bg-white border border-gray-200 rounded-lg px-4 py-3 text-gray-800"
                placeholder="Enter your username or email"
                placeholderTextColor="#9ca3af"
                value={username}
                onChangeText={setUsername}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                editable={!isLoading}
              />
            </View>

            {/* Password Input */}
            <View className="mb-2">
              <Text className="text-gray-600 text-sm mb-2">Password</Text>
              <View className="flex-row items-center bg-white border border-gray-200 rounded-lg">
                <TextInput
                  className="flex-1 px-4 py-3 text-gray-800"
                  placeholder="Enter your password"
                  placeholderTextColor="#9ca3af"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  editable={!isLoading}
                  onSubmitEditing={handleLogin}
                />
                <Pressable
                  onPress={() => setShowPassword(!showPassword)}
                  className="px-4 py-3"
                  style={({ pressed }) => ({ opacity: pressed ? 0.5 : 1 })}
                  disabled={isLoading}
                >
                  <Ionicons
                    name={showPassword ? "eye-outline" : "eye-off-outline"}
                    size={20}
                    color="#9ca3af"
                  />
                </Pressable>
              </View>
            </View>

            {/* Forgot Password */}
            <Pressable
              onPress={handleForgotPassword}
              className="self-end mb-6"
              style={({ pressed }) => ({ opacity: pressed ? 0.5 : 1 })}
              disabled={isLoading}
            >
              <Text className="text-red-500 text-sm">Forgot your password?</Text>
            </Pressable>

            {/* Login Button */}
            <Pressable
              onPress={handleLogin}
              disabled={isLoading || !username || !password}
              className={`py-4 rounded-full items-center flex-row justify-center ${
                isLoading || !username || !password ? "bg-red-300" : "bg-red-500"
              }`}
              style={({ pressed }) => ({
                opacity: pressed && !isLoading ? 0.8 : 1,
              })}
            >
              {isLoading ? (
                <>
                  <ActivityIndicator size="small" color="#ffffff" />
                  <Text className="text-white font-semibold text-lg ml-2">
                    Logging in...
                  </Text>
                </>
              ) : (
                <Text className="text-white font-semibold text-lg">Login</Text>
              )}
            </Pressable>
          </View>

          {/* Server Info */}
          <View className="mt-6 bg-gray-100 rounded-lg p-4">
            <Text className="text-gray-500 text-xs text-center">
              Connected to KHUB Backend
            </Text>
            <Text className="text-gray-400 text-xs text-center mt-1">
              {process.env.EXPO_PUBLIC_KHUB_API_URL || "http://localhost:5002"}
            </Text>
          </View>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}
