import { Modal, View, Text, Pressable, TouchableOpacity, ScrollView, TextInput, KeyboardAvoidingView, Platform, Keyboard } from "react-native";
import { Ionicons, MaterialIcons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useState, useRef, useEffect } from "react";

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
      <Text style={{ fontSize: 24, fontWeight: "700", color: "#1A1A1A" }}>{num}</Text>
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
                <Text style={{ fontSize: 22, fontWeight: "600", color: "#1A1A1A" }}>
                  Clock in to your Account
                </Text>
                <View className="flex-row items-center gap-3">
                  {/* Input mode toggle */}
                  <TouchableOpacity
                    onPress={toggleInputMode}
                    className="rounded-lg p-2 flex-row items-center gap-1"
                    style={{ backgroundColor: inputMode === "touch" ? "#EC1A52" : "#F2F2F2" }}
                  >
                    <MaterialCommunityIcons
                      name={inputMode === "touch" ? "hand-pointing-up" : "keyboard"}
                      size={22}
                      color={inputMode === "touch" ? "#FFFFFF" : "#1A1A1A"}
                    />
                  </TouchableOpacity>
                  {/* Close button */}
                  <TouchableOpacity onPress={handleCancel}>
                    <Ionicons name="close" size={26} color="#1A1A1A" />
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            {/* Content */}
            <View className="p-4">
              {/* Select User - Own row */}
              <View className="mb-4">
                <Text style={{ fontSize: 16, fontWeight: "600", color: "#1A1A1A", marginBottom: 6 }}>
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
                  <Text style={{ fontSize: 18, fontWeight: "500", color: "#1A1A1A" }}>
                    {selectedUser.name}
                  </Text>
                  <Ionicons name="chevron-down" size={24} color="#1A1A1A" />
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
                          <Text style={{ fontSize: 16, color: "#1A1A1A" }}>{user.name}</Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                )}
              </View>

              {/* User PIN - Own row */}
              <View className="mb-4">
                <Text style={{ fontSize: 16, fontWeight: "600", color: "#1A1A1A", marginBottom: 6 }}>
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
                    style={{
                      backgroundColor: "#F2F2F2",
                      height: 50,
                      fontSize: 20,
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
                          backgroundColor: index < pin.length ? "#1A1A1A" : "#D9D9D9",
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
                        backgroundColor: "#E43A00",
                      }}
                    >
                      <MaterialIcons name="cancel" size={22} color="#FFFFFF" />
                      <Text style={{ fontSize: 16, fontWeight: "600", color: "#FFFFFF" }}>Cancel</Text>
                    </TouchableOpacity>

                    {/* Correct Button */}
                    <TouchableOpacity
                      onPress={handleCorrect}
                      className="rounded-lg items-center justify-center flex-row gap-2"
                      style={{
                        flex: 1,
                        backgroundColor: "#FFFFFF",
                        borderWidth: 2,
                        borderColor: "#EC1A52",
                      }}
                    >
                      <MaterialIcons name="backspace" size={22} color="#EC1A52" />
                      <Text style={{ fontSize: 16, fontWeight: "600", color: "#EC1A52" }}>Correct</Text>
                    </TouchableOpacity>

                    {/* Clock In Button */}
                    <TouchableOpacity
                      onPress={handleClockIn}
                      disabled={pin.length === 0}
                      className="rounded-lg items-center justify-center flex-row gap-2"
                      style={{
                        flex: 1,
                        backgroundColor: "#EC1A52",
                        opacity: pin.length === 0 ? 0.5 : 1,
                      }}
                    >
                      <Ionicons name="time-outline" size={22} color="#FFFFFF" />
                      <Text style={{ fontSize: 16, fontWeight: "600", color: "#FFFFFF" }}>Clock In</Text>
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
                    className="rounded-lg items-center justify-center flex-row gap-2 py-4"
                    style={{
                      flex: 1,
                      backgroundColor: "#E43A00",
                    }}
                  >
                    <MaterialIcons name="cancel" size={22} color="#FFFFFF" />
                    <Text style={{ fontSize: 16, fontWeight: "600", color: "#FFFFFF" }}>Cancel</Text>
                  </TouchableOpacity>

                  {/* Clock In Button */}
                  <TouchableOpacity
                    onPress={handleClockIn}
                    disabled={pin.length === 0}
                    className="rounded-lg items-center justify-center flex-row gap-2 py-4"
                    style={{
                      flex: 2,
                      backgroundColor: "#EC1A52",
                      opacity: pin.length === 0 ? 0.5 : 1,
                    }}
                  >
                    <Ionicons name="time-outline" size={22} color="#FFFFFF" />
                    <Text style={{ fontSize: 16, fontWeight: "600", color: "#FFFFFF" }}>Clock In</Text>
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
