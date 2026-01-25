import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { Alert, KeyboardAvoidingView, Platform, Pressable, Text, TextInput, View } from "react-native";
import { useAuth } from "../contexts/AuthContext";

/**
 * LoginScreen - Authentication screen
 * Supports different user roles: admin, cashier, manager, supervisor
 */
export default function LoginScreen() {
  const { login } = useAuth();
  const [email, setEmail] = useState("admin@ititans.com");
  const [password, setPassword] = useState("admin123");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Error", "Please enter email and password");
      return;
    }

    setIsLoading(true);

    try {
      const success = await login(email, password);
      
      if (!success) {
        Alert.alert(
          "Login Failed",
          "Invalid email or password.\n\nTest accounts:\n• admin@ititans.com / admin123\n• cashier@ititans.com / cashier123\n• manager@ititans.com / manager123"
        );
        setIsLoading(false);
      }
      // If login succeeds, isAuthenticated state change will automatically
      // trigger _layout.tsx to show the main content instead of login screen
    } catch (error) {
      Alert.alert("Error", "An error occurred during login");
      setIsLoading(false);
    }
  };

  const handleForgotPassword = () => {
    // TODO: Navigate to forgot password screen
    console.log("Forgot password pressed");
  };

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
            {/* Email Input */}
            <View className="mb-4">
              <Text className="text-gray-600 text-sm mb-2">Email Address</Text>
              <TextInput
                className="bg-white border border-gray-200 rounded-lg px-4 py-3 text-gray-800"
                placeholder="Enter your email"
                placeholderTextColor="#9ca3af"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
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
                />
                <Pressable
                  onPress={() => setShowPassword(!showPassword)}
                  className="px-4 py-3"
                  style={({ pressed }) => ({ opacity: pressed ? 0.5 : 1 })}
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
            >
              <Text className="text-red-500 text-sm">Forgot your password?</Text>
            </Pressable>

            {/* Login Button */}
            <Pressable
              onPress={handleLogin}
              disabled={isLoading || !email || !password}
              className={`py-4 rounded-full items-center ${
                isLoading || !email || !password ? "bg-red-300" : "bg-red-500"
              }`}
              style={({ pressed }) => ({
                opacity: pressed && !isLoading ? 0.8 : 1,
              })}
            >
              <Text className="text-white font-semibold text-lg">
                {isLoading ? "Logging in..." : "Login"}
              </Text>
            </Pressable>
          </View>

          {/* Test Accounts Info */}
          <View className="mt-6 bg-blue-50 rounded-lg p-4">
            <Text className="text-blue-700 font-semibold mb-2">Test Accounts:</Text>
            <View className="gap-1">
              <Text className="text-blue-600 text-sm">
                • Admin: admin@ititans.com / admin123
              </Text>
              <Text className="text-blue-600 text-sm">
                • Cashier: cashier@ititans.com / cashier123
              </Text>
              <Text className="text-blue-600 text-sm">
                • Manager: manager@ititans.com / manager123
              </Text>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}
