import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useState } from "react";
import { Alert, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { PageHeader } from "../components";
import { setPrinterConfig } from "../utils/PrintQueue";

// Default printer configuration
const DEFAULT_PRINTER_IP = "192.168.1.100";
const DEFAULT_PRINTER_PORT = "9100";

export default function SettingsScreen() {
  // Printer settings state
  const [printerIp, setPrinterIp] = useState(DEFAULT_PRINTER_IP);
  const [printerPort, setPrinterPort] = useState(DEFAULT_PRINTER_PORT);
  const [isSaving, setIsSaving] = useState(false);

  // Load saved settings on mount
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const savedIp = await AsyncStorage.getItem("printer_ip");
        const savedPort = await AsyncStorage.getItem("printer_port");
        if (savedIp) setPrinterIp(savedIp);
        if (savedPort) setPrinterPort(savedPort);
      } catch (e) {
        console.log("Failed to load settings");
      }
    };
    loadSettings();
  }, []);

  // Save settings
  const handleSave = async () => {
    setIsSaving(true);
    try {
      await AsyncStorage.setItem("printer_ip", printerIp);
      await AsyncStorage.setItem("printer_port", printerPort);
      setPrinterConfig({ ip: printerIp, port: parseInt(printerPort, 10) || 9100 });
      Alert.alert("Success", "Settings saved successfully!");
    } catch (e) {
      Alert.alert("Error", "Failed to save settings");
    } finally {
      setIsSaving(false);
    }
  };

  // Reset to defaults
  const handleReset = () => {
    Alert.alert(
      "Reset Settings",
      "Are you sure you want to reset to default values?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Reset",
          style: "destructive",
          onPress: () => {
            setPrinterIp(DEFAULT_PRINTER_IP);
            setPrinterPort(DEFAULT_PRINTER_PORT);
          },
        },
      ]
    );
  };

  return (
    <View className="flex-1 bg-gray-50">
      <PageHeader title="Settings" />

      <ScrollView className="flex-1" contentContainerClassName="p-5">
        {/* Printer Configuration Card */}
        <View className="bg-white rounded-xl border border-gray-200 overflow-hidden mb-5">
          {/* Card Header */}
          <View className="bg-gray-50 px-5 py-4 border-b border-gray-200 flex-row items-center gap-3">
            <View className="bg-blue-100 p-2 rounded-lg">
              <Ionicons name="print" size={24} color="#3b82f6" />
            </View>
            <View>
              <Text className="text-lg font-semibold text-gray-800">Printer Configuration</Text>
              <Text className="text-gray-500 text-sm">Configure your thermal printer connection</Text>
            </View>
          </View>

          {/* Card Body */}
          <View className="p-5">
            {/* Printer IP Address */}
            <View className="mb-5">
              <Text className="text-gray-700 font-medium mb-2">Printer IP Address</Text>
              <TextInput
                className="bg-gray-50 border border-gray-200 rounded-xl px-5 py-4 text-lg"
                placeholder="e.g. 192.168.1.100"
                placeholderTextColor="#9ca3af"
                value={printerIp}
                onChangeText={setPrinterIp}
                keyboardType="numeric"
                autoCapitalize="none"
                autoCorrect={false}
              />
              <Text className="text-gray-400 text-sm mt-2">
                Enter the IP address of your thermal printer
              </Text>
            </View>

            {/* Printer Port */}
            <View className="mb-5">
              <Text className="text-gray-700 font-medium mb-2">Printer Port</Text>
              <TextInput
                className="bg-gray-50 border border-gray-200 rounded-xl px-5 py-4 text-lg"
                placeholder="e.g. 9100"
                placeholderTextColor="#9ca3af"
                value={printerPort}
                onChangeText={setPrinterPort}
                keyboardType="number-pad"
              />
              <Text className="text-gray-400 text-sm mt-2">
                Default port for most thermal printers is 9100
              </Text>
            </View>

            {/* Current Configuration Display */}
            <View className="bg-blue-50 rounded-xl p-4 mb-5 flex-row items-center gap-3">
              <Ionicons name="information-circle" size={24} color="#3b82f6" />
              <View className="flex-1">
                <Text className="text-blue-700 text-sm font-medium">Current Configuration</Text>
                <Text className="text-blue-600 text-lg font-bold">{printerIp}:{printerPort}</Text>
              </View>
            </View>

            {/* Action Buttons */}
            <View className="flex-row gap-4">
              <Pressable
                onPress={handleReset}
                className="flex-1 bg-gray-100 py-4 rounded-xl flex-row items-center justify-center gap-2 active:bg-gray-200"
              >
                <Ionicons name="refresh" size={20} color="#6b7280" />
                <Text className="text-gray-600 font-semibold text-base">Reset</Text>
              </Pressable>
              <Pressable
                onPress={handleSave}
                disabled={isSaving}
                className={`flex-1 py-4 rounded-xl flex-row items-center justify-center gap-2 ${
                  isSaving ? "bg-blue-300" : "bg-blue-500 active:bg-blue-600"
                }`}
              >
                <Ionicons name="save" size={20} color="white" />
                <Text className="text-white font-semibold text-base">
                  {isSaving ? "Saving..." : "Save Settings"}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>

        {/* Additional Settings Card (placeholder for future settings) */}
        <View className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          {/* Card Header */}
          <View className="bg-gray-50 px-5 py-4 border-b border-gray-200 flex-row items-center gap-3">
            <View className="bg-purple-100 p-2 rounded-lg">
              <Ionicons name="apps" size={24} color="#9333ea" />
            </View>
            <View>
              <Text className="text-lg font-semibold text-gray-800">App Settings</Text>
              <Text className="text-gray-500 text-sm">General application preferences</Text>
            </View>
          </View>

          {/* Card Body */}
          <View className="p-5">
            {/* App Version */}
            <View className="flex-row items-center justify-between py-4 border-b border-gray-100">
              <View className="flex-row items-center gap-3">
                <Ionicons name="information-circle-outline" size={24} color="#6b7280" />
                <Text className="text-gray-700 text-base">App Version</Text>
              </View>
              <Text className="text-gray-500 text-base">1.0.0</Text>
            </View>

            {/* Build Number */}
            <View className="flex-row items-center justify-between py-4">
              <View className="flex-row items-center gap-3">
                <Ionicons name="code-slash-outline" size={24} color="#6b7280" />
                <Text className="text-gray-700 text-base">Build Number</Text>
              </View>
              <Text className="text-gray-500 text-base">2026.01.26</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
