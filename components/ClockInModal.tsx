import { buttonSize, colors, iconSize } from '@/utils/theme';
import { Ionicons, MaterialCommunityIcons, MaterialIcons } from "@expo/vector-icons";
import { useEffect, useRef, useState } from "react";
import { Keyboard, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, Text, TextInput, TouchableOpacity, View } from "react-native";

interface ClockInModalProps {
  visible: boolean;
  onClose: () => void;
  onClockIn: (employeeId: string) => void;
}

// Mock users - replace with actual user list from API
const MOCK_USERS = [
  { id: "1", name: "John Smith" },
  { id: "2", name: "Jane Doe" },
  { id: "3", name: "Bob Wilson" },
];

/**
 * ClockInModal - PIN entry for clock in
 * Two modes: Touch (numeric keypad) and Keyboard (system keyboard)
 */
export function ClockInModal({ visible, onClose, onClockIn }: ClockInModalProps) {
  const [pin, setPin] = useState("");
  const [selectedUser, setSelectedUser] = useState(MOCK_USERS[0]);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  // "touch" = numeric keypad, "keyboard" = system keyboard input
  const [inputMode, setInputMode] = useState<"touch" | "keyboard">("touch");
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const MAX_PIN_LENGTH = 20; // Allow longer PIN for alphanumeric
  
  const pinInputRef = useRef<TextInput>(null);

  // Listen for keyboard show/hide
  useEffect(() => {
    const showListener = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow",
      () => setKeyboardVisible(true)
    );
    const hideListener = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide",
      () => setKeyboardVisible(false)
    );

    return () => {
      showListener.remove();
      hideListener.remove();
    };
  }, []);

  // Focus the input when switching to keyboard mode
  useEffect(() => {
    if (inputMode === "keyboard" && visible) {
      setTimeout(() => pinInputRef.current?.focus(), 100);
    }
  }, [inputMode, visible]);

  // Reset state when modal closes
  useEffect(() => {
    if (!visible) {
      setPin("");
      setShowUserDropdown(false);
      Keyboard.dismiss();
    }
  }, [visible]);

  const handleNumberPress = (num: string) => {
    if (pin.length < 6) {
      setPin((prev) => prev + num);
    }
  };

  const handleCancel = () => {
    setPin("");
    Keyboard.dismiss();
    onClose();
  };

  const handleCorrect = () => {
    setPin((prev) => prev.slice(0, -1));
  };

  const handleClockIn = () => {
    if (pin.length > 0) {
      Keyboard.dismiss();
      onClockIn(pin);
      setPin("");
    }
  };

  const toggleInputMode = () => {
    setPin(""); // Clear PIN when switching modes
    Keyboard.dismiss();
    setInputMode((prev) => (prev === "touch" ? "keyboard" : "touch"));
  };

  // Number button component
  const NumberButton = ({ num }: { num: string }) => (
    <TouchableOpacity
      onPress={() => handleNumberPress(num)}
      className="rounded-lg items-center justify-center"
      style={{
        width: 80,
        height: 60,
        backgroundColor: "#FFFFFF",
        borderWidth: 1,
        borderColor: "#C3C3C3",
      }}
    >
      <Text className="text-2xl font-bold" style={{ color: colors.text }}>{num}</Text>
    </TouchableOpacity>
  );

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleCancel}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
      >
        <Pressable
          className="flex-1 justify-center items-center"
          style={{ 
            backgroundColor: "rgba(0, 0, 0, 0.4)",
            paddingBottom: keyboardVisible ? 20 : 0,
          }}
          onPress={handleCancel}
        >
          {/* Modal content */}
          <Pressable
            className="bg-white rounded-xl overflow-hidden"
            style={{
              width: 500,
              maxWidth: "95%",
              shadowColor: "#000",
              shadowOffset: { width: 4, height: 4 },
              shadowOpacity: 0.25,
              shadowRadius: 4,
              elevation: 8,
              // Move modal up when keyboard is visible
              marginBottom: keyboardVisible ? 100 : 0,
            }}
            onPress={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <View className="p-4 border-b border-gray-200">
              <View className="flex-row justify-between items-center">
                <Text className="text-2xl font-semibold" style={{ color: colors.text }}>
                  Clock in to your Account
                </Text>
                <View className="flex-row items-center gap-3">
                  {/* Input mode toggle */}
                  <TouchableOpacity
                    onPress={toggleInputMode}
                    className="rounded-lg p-2 flex-row items-center gap-1"
                    style={{ backgroundColor: inputMode === "touch" ? colors.primary : "#F2F2F2" }}
                  >
                    <MaterialCommunityIcons
                      name={inputMode === "touch" ? "hand-pointing-up" : "keyboard"}
                      size={iconSize.lg}
                      color={inputMode === "touch" ? colors.textWhite : colors.text}
                    />
                  </TouchableOpacity>
                  {/* Close button */}
                  <TouchableOpacity onPress={handleCancel}>
                    <Ionicons name="close" size={iconSize.xl} color={colors.text} />
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            {/* Content */}
            <View className="p-4">
              {/* Select User - Own row */}
              <View className="mb-4">
                <Text className="text-lg font-semibold" style={{ color: colors.text, marginBottom: 6 }}>
                  Select User
                </Text>
                <TouchableOpacity
                  onPress={() => {
                    Keyboard.dismiss();
                    setShowUserDropdown(!showUserDropdown);
                  }}
                  className="flex-row justify-between items-center rounded-lg px-4"
                  style={{
                    backgroundColor: "#F2F2F2",
                    height: 50,
                    shadowColor: "#000",
                    shadowOffset: { width: -2, height: -2 },
                    shadowOpacity: 0.15,
                    shadowRadius: 4,
                  }}
                >
                  <Text className="text-xl font-medium" style={{ color: colors.text }}>
                    {selectedUser.name}
                  </Text>
                  <Ionicons name="chevron-down" size={iconSize.xl} color={colors.text} />
                </TouchableOpacity>

                {/* User Dropdown */}
                {showUserDropdown && (
                  <View
                    className="absolute top-full left-0 right-0 bg-white rounded-lg mt-1 z-10 shadow-lg"
                    style={{
                      top: 76,
                      shadowColor: "#000",
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: 0.25,
                      shadowRadius: 4,
                      elevation: 5,
                    }}
                  >
                    <ScrollView style={{ maxHeight: 200 }}>
                      {MOCK_USERS.map((user) => (
                        <TouchableOpacity
                          key={user.id}
                          onPress={() => {
                            setSelectedUser(user);
                            setShowUserDropdown(false);
                          }}
                          className="px-4 py-3 border-b border-gray-100"
                        >
                          <Text className="text-lg" style={{ color: colors.text }}>{user.name}</Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                )}
              </View>

              {/* User PIN - Own row */}
              <View className="mb-4">
                <Text className="text-lg font-semibold" style={{ color: colors.text, marginBottom: 6 }}>
                  User PIN
                </Text>
                
                {inputMode === "keyboard" ? (
                  // Keyboard mode: TextInput for system keyboard (alphanumeric)
                  <TextInput
                    ref={pinInputRef}
                    value={pin}
                    onChangeText={(text) => {
                      // Allow alphanumeric input
                      if (text.length <= MAX_PIN_LENGTH) {
                        setPin(text);
                      }
                    }}
                    secureTextEntry
                    autoCapitalize="none"
                    autoCorrect={false}
                    maxLength={MAX_PIN_LENGTH}
                    placeholder="Enter PIN"
                    placeholderTextColor="#999"
                    className="rounded-lg px-4"
                    className="text-2xl"
                    style={{
                      backgroundColor: "#F2F2F2",
                      height: 50,
                      letterSpacing: 4,
                      textAlign: "center",
                      shadowColor: "#000",
                      shadowOffset: { width: -2, height: -2 },
                      shadowOpacity: 0.15,
                      shadowRadius: 4,
                    }}
                  />
                ) : (
                  // Touch mode: Show PIN dots (max 6)
                  <View
                    className="flex-row justify-center items-center gap-4 rounded-lg"
                    style={{
                      backgroundColor: "#F2F2F2",
                      height: 50,
                      shadowColor: "#000",
                      shadowOffset: { width: -2, height: -2 },
                      shadowOpacity: 0.15,
                      shadowRadius: 4,
                    }}
                  >
                    {Array.from({ length: 6 }).map((_, index) => (
                      <View
                        key={index}
                        className="rounded-full"
                        style={{
                          width: 18,
                          height: 18,
                          backgroundColor: index < pin.length ? colors.text : "#D9D9D9",
                        }}
                      />
                    ))}
                  </View>
                )}
              </View>

              {/* Touch Mode: Show numeric keypad */}
              {inputMode === "touch" && (
                <View className="flex-row gap-4">
                  {/* Number Pad */}
                  <View className="gap-2">
                    {/* Row 1 */}
                    <View className="flex-row gap-2">
                      <NumberButton num="1" />
                      <NumberButton num="2" />
                      <NumberButton num="3" />
                    </View>
                    {/* Row 2 */}
                    <View className="flex-row gap-2">
                      <NumberButton num="4" />
                      <NumberButton num="5" />
                      <NumberButton num="6" />
                    </View>
                    {/* Row 3 */}
                    <View className="flex-row gap-2">
                      <NumberButton num="7" />
                      <NumberButton num="8" />
                      <NumberButton num="9" />
                    </View>
                    {/* Row 4 - 0 centered */}
                    <View className="flex-row justify-center">
                      <NumberButton num="0" />
                    </View>
                  </View>

                  {/* Action Buttons */}
                  <View className="flex-1 gap-2">
                    {/* Cancel Button */}
                    <TouchableOpacity
                      onPress={handleCancel}
                      className="rounded-lg items-center justify-center flex-row gap-2"
                      style={{
                        flex: 1,
                        height: buttonSize.lg.height,
                        backgroundColor: colors.error,
                        borderRadius: buttonSize.lg.borderRadius,
                      }}
                    >
                      <MaterialIcons name="cancel" size={iconSize.xl} color={colors.textWhite} />
                      <Text className="text-xl font-semibold" style={{ color: colors.textWhite }}>Cancel</Text>
                    </TouchableOpacity>

                    {/* Correct Button */}
                    <TouchableOpacity
                      onPress={handleCorrect}
                      className="rounded-lg items-center justify-center flex-row gap-2"
                      style={{
                        flex: 1,
                        backgroundColor: colors.textWhite,
                        borderWidth: 2,
                        borderColor: colors.primary,
                      }}
                    >
                      <MaterialIcons name="backspace" size={iconSize.lg} color={colors.primary} />
                      <Text className="text-lg font-semibold" style={{ color: colors.primary }}>Correct</Text>
                    </TouchableOpacity>

                    {/* Clock In Button */}
                    <TouchableOpacity
                      onPress={handleClockIn}
                      disabled={pin.length === 0}
                      className="rounded-lg items-center justify-center flex-row gap-2"
                      style={{
                        flex: 1,
                        backgroundColor: colors.primary,
                        opacity: pin.length === 0 ? 0.5 : 1,
                      }}
                    >
                      <Ionicons name="time-outline" size={iconSize.lg} color={colors.textWhite} />
                      <Text className="text-lg font-semibold" style={{ color: colors.textWhite }}>Clock In</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}

              {/* Keyboard Mode: Show action buttons only */}
              {inputMode === "keyboard" && (
                <View className="flex-row gap-3 mt-2">
                  {/* Cancel Button */}
                  <TouchableOpacity
                    onPress={handleCancel}
                    className="rounded-lg items-center justify-center flex-row gap-2"
                    style={{
                      flex: 1,
                      height: buttonSize.lg.height,
                      backgroundColor: colors.error,
                      borderRadius: buttonSize.lg.borderRadius,
                    }}
                  >
                    <MaterialIcons name="cancel" size={iconSize.xl} color={colors.textWhite} />
                    <Text className="text-xl font-semibold" style={{ color: colors.textWhite }}>Cancel</Text>
                  </TouchableOpacity>

                  {/* Clock In Button */}
                  <TouchableOpacity
                    onPress={handleClockIn}
                    disabled={pin.length === 0}
                    className="rounded-lg items-center justify-center flex-row gap-2"
                    style={{
                      flex: 2,
                      height: buttonSize.lg.height,
                      backgroundColor: colors.primary,
                      opacity: pin.length === 0 ? 0.5 : 1,
                      borderRadius: buttonSize.lg.borderRadius,
                    }}
                  >
                    <Ionicons name="time-outline" size={iconSize.xl} color={colors.textWhite} />
                    <Text className="text-xl font-semibold" style={{ color: colors.textWhite }}>Clock In</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </Pressable>
        </Pressable>
      </KeyboardAvoidingView>
    </Modal>
  );
}
