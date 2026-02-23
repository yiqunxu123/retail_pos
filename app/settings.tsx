import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { iconSize } from '@/utils/theme';
import { useEffect, useState } from "react";
import { Alert, Modal, ScrollView, Switch, Text, TextInput, TouchableOpacity, View } from "react-native";
import { PageHeader } from "../components";
import {
    addPrinter,
    getPrinters,
    PrinterConfig,
    PrinterState,
    PrinterType,
    removePrinter,
    setPrinterEnabled,
    updatePrinter
} from "../utils/PrinterPoolManager";

// Storage key for printers
const PRINTERS_STORAGE_KEY = "printer_pool_config";

// Printer type options
const PRINTER_TYPES: { value: PrinterType; label: string; icon: string }[] = [
  { value: "ethernet", label: "Network Printer", icon: "wifi" },
  { value: "usb", label: "USB Printer", icon: "hardware-chip" },
  { value: "bluetooth", label: "Bluetooth Printer", icon: "bluetooth" },
];

export default function SettingsScreen() {
  const [printers, setPrinters] = useState<PrinterState[]>([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingPrinter, setEditingPrinter] = useState<PrinterState | null>(null);
  
  // Form state
  const [formName, setFormName] = useState("");
  const [formType, setFormType] = useState<PrinterType>("ethernet");
  const [formIp, setFormIp] = useState("");
  const [formPort, setFormPort] = useState("9100");
  const [formVendorId, setFormVendorId] = useState("");
  const [formProductId, setFormProductId] = useState("");
  const [formMacAddress, setFormMacAddress] = useState("");
  const [formPrintWidth, setFormPrintWidth] = useState("576");

  // Print format setting: "receipt" or "a4"
  const [printFormat, setPrintFormat] = useState<"receipt" | "a4">("receipt");
  const [showPrintFormatPicker, setShowPrintFormatPicker] = useState(false);

  // Load printers and print format on mount
  useEffect(() => {
    loadPrinters();
    loadPrintFormat();
  }, []);

  // Load printers from storage and register to pool
  const loadPrinters = async () => {
    try {
      console.log("🖨️ [Settings] Loading printers...");
      
      // Get current printer list directly from pool for display
      // Pool was already loaded from storage when Dashboard started
      const poolPrinters = getPrinters();
      console.log("🖨️ [Settings] Pool has:", poolPrinters.length, "printers");
      poolPrinters.forEach(p => console.log("   -", p.id, p.name, p.ip, p.status));
      
      setPrinters(poolPrinters);
    } catch (e) {
      console.log("🖨️ [Settings] Failed to load printers:", e);
    }
  };

  // Save printers to storage
  const savePrinters = async (printerList: PrinterState[]) => {
    try {
      const configs: PrinterConfig[] = printerList.map(p => ({
        id: p.id,
        name: p.name,
        type: p.type,
        ip: p.ip,
        port: p.port,
        vendorId: p.vendorId,
        productId: p.productId,
        macAddress: p.macAddress,
        enabled: p.enabled,
        printWidth: p.printWidth,
      }));
      const jsonData = JSON.stringify(configs);
      console.log("🖨️ [Settings] Saving printers:", jsonData);
      await AsyncStorage.setItem(PRINTERS_STORAGE_KEY, jsonData);
      
      // Verify save was successful
      const verify = await AsyncStorage.getItem(PRINTERS_STORAGE_KEY);
      console.log("🖨️ [Settings] Verify saved:", verify === jsonData ? "✅ OK" : "❌ MISMATCH");
    } catch (e) {
      console.log("🖨️ [Settings] Failed to save printers:", e);
    }
  };

  // Open modal for adding new printer
  const handleAddPrinter = () => {
    setEditingPrinter(null);
    resetForm();
    setIsModalVisible(true);
  };

  // Open modal for editing printer
  const handleEditPrinter = (printer: PrinterState) => {
    setEditingPrinter(printer);
    setFormName(printer.name);
    setFormType(printer.type);
    setFormIp(printer.ip || "");
    setFormPort(String(printer.port || 9100));
    setFormVendorId(printer.vendorId ? String(printer.vendorId) : "");
    setFormProductId(printer.productId ? String(printer.productId) : "");
    setFormMacAddress(printer.macAddress || "");
    setFormPrintWidth(String(printer.printWidth || 576));
    setIsModalVisible(true);
  };

  // Reset form
  const resetForm = () => {
    setFormName("");
    setFormType("ethernet");
    setFormIp("");
    setFormPort("9100");
    setFormVendorId("");
    setFormProductId("");
    setFormMacAddress("");
    setFormPrintWidth("576");
  };

  // Validate form
  const validateForm = (): string | null => {
    if (!formName.trim()) return "Please enter printer name";
    
    if (formType === "ethernet") {
      if (!formIp.trim()) return "Please enter IP address";
      const ipRegex = /^(\d{1,3}\.){3}\d{1,3}$/;
      if (!ipRegex.test(formIp)) return "Invalid IP address format";
    }
    
    if (formType === "usb") {
      if (!formVendorId.trim() || !formProductId.trim()) {
        return "Please enter Vendor ID and Product ID";
      }
    }
    
    if (formType === "bluetooth") {
      if (!formMacAddress.trim()) return "Please enter Bluetooth MAC address";
    }
    
    return null;
  };

  // Save printer (add or update)
  const handleSavePrinter = () => {
    const error = validateForm();
    if (error) {
      Alert.alert("Validation Error", error);
      return;
    }

    const config: PrinterConfig = {
      id: editingPrinter?.id || `printer_${Date.now()}`,
      name: formName.trim(),
      type: formType,
      enabled: editingPrinter?.enabled ?? true,
      printWidth: parseInt(formPrintWidth, 10) || 576,
    };

    if (formType === "ethernet") {
      config.ip = formIp.trim();
      config.port = parseInt(formPort, 10) || 9100;
    } else if (formType === "usb") {
      config.vendorId = parseInt(formVendorId, 16) || parseInt(formVendorId, 10);
      config.productId = parseInt(formProductId, 16) || parseInt(formProductId, 10);
    } else if (formType === "bluetooth") {
      config.macAddress = formMacAddress.trim();
    }

    console.log("🖨️ [Settings] Saving printer:", editingPrinter ? "UPDATE" : "ADD", config.id, config.name);
    
    if (editingPrinter) {
      updatePrinter(editingPrinter.id, config);
    } else {
      const success = addPrinter(config);
      console.log("🖨️ [Settings] addPrinter result:", success);
    }

    const updatedPrinters = getPrinters();
    console.log("🖨️ [Settings] Pool after save:", updatedPrinters.length, "printers");
    updatedPrinters.forEach(p => console.log("   -", p.id, p.name));
    
    setPrinters(updatedPrinters);
    savePrinters(updatedPrinters);
    setIsModalVisible(false);
    resetForm();
  };

  // Delete printer
  const handleDeletePrinter = (printer: PrinterState) => {
    Alert.alert(
      "Delete Printer",
      `Are you sure you want to delete "${printer.name}"?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            removePrinter(printer.id);
            const updatedPrinters = getPrinters();
            setPrinters(updatedPrinters);
            savePrinters(updatedPrinters);
          },
        },
      ]
    );
  };

  // Toggle printer enabled
  const handleToggleEnabled = (printer: PrinterState) => {
    setPrinterEnabled(printer.id, !printer.enabled);
    const updatedPrinters = getPrinters();
    setPrinters(updatedPrinters);
    savePrinters(updatedPrinters);
  };

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case "idle": return "#22c55e";
      case "busy": return "#f59e0b";
      case "offline": return "#6b7280";
      case "error": return "#ef4444";
      default: return "#6b7280";
    }
  };

  // Get status text
  const getStatusText = (status: string) => {
    switch (status) {
      case "idle": return "Idle";
      case "busy": return "Printing";
      case "offline": return "Offline";
      case "error": return "Error";
      default: return status;
    }
  };

  // Load print format from storage
  const loadPrintFormat = async () => {
    try {
      const stored = await AsyncStorage.getItem("print_format");
      if (stored === "a4" || stored === "receipt") {
        setPrintFormat(stored);
      }
    } catch (e) {
      console.log("Failed to load print format:", e);
    }
  };

  // Save print format to storage
  const savePrintFormat = async (format: "receipt" | "a4") => {
    try {
      setPrintFormat(format);
      await AsyncStorage.setItem("print_format", format);
      console.log("🖨️ [Settings] Print format saved:", format);
    } catch (e) {
      console.log("Failed to save print format:", e);
    }
  };

  // Render print format picker modal
  const PRINT_FORMAT_OPTIONS: { value: "receipt" | "a4"; label: string; desc: string; icon: string }[] = [
    { value: "receipt", label: "Receipt", desc: "Thermal printer receipt format, for 58mm/80mm paper", icon: "receipt-outline" },
    { value: "a4", label: "A4 Invoice", desc: "A4 paper invoice format, for standard printers", icon: "document-text-outline" },
  ];

  const renderPrintFormatPicker = () => (
    <Modal
      visible={showPrintFormatPicker}
      transparent
      animationType="fade"
      onRequestClose={() => setShowPrintFormatPicker(false)}
    >
      <TouchableOpacity
        className="flex-1 bg-black/50 justify-center items-center"
        activeOpacity={1}
        onPress={() => setShowPrintFormatPicker(false)}
      >
        <View
          className="bg-white rounded-2xl overflow-hidden"
          style={{ width: 400 }}
          onStartShouldSetResponder={() => true}
        >
          {/* Header */}
          <View className="flex-row justify-between items-center px-6 py-4 border-b border-gray-200 bg-gray-50">
            <View className="flex-row items-center gap-3">
              <View className="w-10 h-10 bg-blue-100 rounded-full items-center justify-center">
                <Ionicons name="print-outline" size={iconSize.xl} color="#3b82f6" />
              </View>
              <Text className="text-xl font-semibold text-gray-800">Print Format</Text>
            </View>
            <TouchableOpacity onPress={() => setShowPrintFormatPicker(false)}>
              <Ionicons name="close" size={iconSize.xl} color="#6b7280" />
            </TouchableOpacity>
          </View>

          {/* Options */}
          <View className="p-4">
            {PRINT_FORMAT_OPTIONS.map((opt) => {
              const isSelected = opt.value === printFormat;
              return (
                <TouchableOpacity
                  key={opt.value}
                  onPress={() => {
                    savePrintFormat(opt.value);
                    setShowPrintFormatPicker(false);
                  }}
                  className={`flex-row items-center px-4 py-4 rounded-xl mb-2 ${
                    isSelected ? 'bg-blue-50 border-2 border-blue-500' : 'bg-white border-2 border-gray-200'
                  }`}
                >
                  <View className={`w-12 h-12 rounded-xl items-center justify-center mr-4 ${
                    isSelected ? 'bg-blue-100' : 'bg-gray-100'
                  }`}>
                    <Ionicons
                      name={opt.icon as any}
                      size={iconSize.xl}
                      color={isSelected ? "#3b82f6" : "#6b7280"}
                    />
                  </View>
                  <View className="flex-1">
                    <Text
                      className={`text-base font-semibold ${
                        isSelected ? 'text-blue-700' : 'text-gray-700'
                      }`}
                    >
                      {opt.label}
                    </Text>
                    <Text className="text-gray-400 text-xs mt-0.5">{opt.desc}</Text>
                  </View>
                  {isSelected && (
                    <Ionicons name="checkmark-circle" size={iconSize.lg} color="#3b82f6" />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </TouchableOpacity>
    </Modal>
  );

  // Get printer type icon
  const getPrinterTypeIcon = (type: PrinterType) => {
    switch (type) {
      case "ethernet": return "wifi";
      case "usb": return "hardware-chip";
      case "bluetooth": return "bluetooth";
      default: return "print";
    }
  };

  // Render printer card
  const renderPrinterCard = (printer: PrinterState) => (
    <View 
      key={printer.id} 
      className={`bg-white rounded-xl border ${printer.enabled ? 'border-gray-200' : 'border-gray-100 opacity-60'} p-4 mb-3`}
    >
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center gap-3 flex-1">
          <View className={`w-12 h-12 rounded-xl items-center justify-center ${printer.enabled ? 'bg-blue-100' : 'bg-gray-100'}`}>
            <Ionicons 
              name={getPrinterTypeIcon(printer.type) as any} 
              size={iconSize.xl} 
              color={printer.enabled ? "#3b82f6" : "#9ca3af"} 
            />
          </View>
          <View className="flex-1">
            <Text className="text-gray-800 font-semibold text-base">{printer.name}</Text>
            <Text className="text-gray-500 text-sm">
              {printer.type === "ethernet" && `${printer.ip}:${printer.port}`}
              {printer.type === "usb" && `VID: ${printer.vendorId?.toString(16)} PID: ${printer.productId?.toString(16)}`}
              {printer.type === "bluetooth" && printer.macAddress}
            </Text>
            <View className="flex-row items-center gap-2 mt-1">
              <View 
                className="w-2 h-2 rounded-full" 
                style={{ backgroundColor: getStatusColor(printer.status) }}
              />
              <Text className="text-gray-400 text-xs">
                {getStatusText(printer.status)} · Completed {printer.jobsCompleted} jobs
              </Text>
            </View>
          </View>
        </View>

        <View className="flex-row items-center gap-2">
          <Switch
            value={printer.enabled}
            onValueChange={() => handleToggleEnabled(printer)}
            trackColor={{ false: "#d1d5db", true: "#3b82f6" }}
            thumbColor="#ffffff"
          />
          <TouchableOpacity 
            onPress={() => handleEditPrinter(printer)}
            className="p-2"
          >
            <Ionicons name="pencil" size={iconSize.base} color="#6b7280" />
          </TouchableOpacity>
          <TouchableOpacity 
            onPress={() => handleDeletePrinter(printer)}
            className="p-2"
          >
            <Ionicons name="trash-outline" size={iconSize.base} color="#ef4444" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  // Render add/edit modal
  const renderModal = () => (
    <Modal
      visible={isModalVisible}
      transparent
      animationType="fade"
      onRequestClose={() => setIsModalVisible(false)}
    >
      <TouchableOpacity 
        className="flex-1 bg-black/50 justify-center items-center"
        activeOpacity={1}
        onPress={() => setIsModalVisible(false)}
      >
        <View 
          className="bg-white rounded-2xl overflow-hidden"
          style={{ width: 500, maxHeight: "90%" }}
          onStartShouldSetResponder={() => true}
        >
          {/* Modal Header */}
          <View className="flex-row justify-between items-center px-6 py-4 border-b border-gray-200 bg-gray-50">
            <View className="flex-row items-center gap-3">
              <View className="w-10 h-10 bg-blue-100 rounded-full items-center justify-center">
                <Ionicons name={editingPrinter ? "pencil" : "add"} size={iconSize.xl} color="#3b82f6" />
              </View>
              <Text className="text-xl font-semibold text-gray-800">
                {editingPrinter ? "Edit Printer" : "Add Printer"}
              </Text>
            </View>
            <TouchableOpacity onPress={() => setIsModalVisible(false)}>
              <Ionicons name="close" size={iconSize.xl} color="#6b7280" />
            </TouchableOpacity>
          </View>

          <ScrollView className="p-6">
            {/* Printer Name */}
            <View className="mb-5">
              <Text className="text-gray-700 font-medium mb-2">Printer Name *</Text>
              <TextInput
                className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-base"
                placeholder="e.g., Cashier Printer"
                placeholderTextColor="#9ca3af"
                value={formName}
                onChangeText={setFormName}
              />
            </View>

            {/* Printer Type */}
            <View className="mb-5">
              <Text className="text-gray-700 font-medium mb-2">Printer Type *</Text>
              <View className="flex-row gap-3">
                {PRINTER_TYPES.map(type => (
                  <TouchableOpacity
                    key={type.value}
                    onPress={() => setFormType(type.value)}
                    className={`flex-1 p-4 rounded-xl border-2 items-center ${
                      formType === type.value 
                        ? 'border-blue-500 bg-blue-50' 
                        : 'border-gray-200 bg-white'
                    }`}
                  >
                    <Ionicons 
                      name={type.icon as any} 
                      size={iconSize.xl} 
                      color={formType === type.value ? "#3b82f6" : "#6b7280"} 
                    />
                    <Text className={`mt-2 text-sm font-medium ${
                      formType === type.value ? 'text-blue-600' : 'text-gray-600'
                    }`}>
                      {type.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Ethernet Config */}
            {formType === "ethernet" && (
              <>
                <View className="mb-5">
                  <Text className="text-gray-700 font-medium mb-2">IP Address *</Text>
                  <TextInput
                    className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-base"
                    placeholder="e.g., 192.168.1.100"
                    placeholderTextColor="#9ca3af"
                    value={formIp}
                    onChangeText={setFormIp}
                    keyboardType="numeric"
                  />
                </View>
                <View className="mb-5">
                  <Text className="text-gray-700 font-medium mb-2">Port</Text>
                  <TextInput
                    className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-base"
                    placeholder="Default 9100"
                    placeholderTextColor="#9ca3af"
                    value={formPort}
                    onChangeText={setFormPort}
                    keyboardType="number-pad"
                  />
                </View>
              </>
            )}

            {/* USB Config */}
            {formType === "usb" && (
              <>
                <View className="mb-5">
                  <Text className="text-gray-700 font-medium mb-2">Vendor ID *</Text>
                  <TextInput
                    className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-base"
                    placeholder="e.g., 0x0483 or 1155"
                    placeholderTextColor="#9ca3af"
                    value={formVendorId}
                    onChangeText={setFormVendorId}
                  />
                </View>
                <View className="mb-5">
                  <Text className="text-gray-700 font-medium mb-2">Product ID *</Text>
                  <TextInput
                    className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-base"
                    placeholder="e.g., 0x5740 or 22336"
                    placeholderTextColor="#9ca3af"
                    value={formProductId}
                    onChangeText={setFormProductId}
                  />
                </View>
                <View className="bg-amber-50 rounded-xl p-4 mb-5 flex-row items-start gap-3">
                  <Ionicons name="information-circle" size={iconSize.base} color="#f59e0b" />
                  <Text className="text-amber-700 text-sm flex-1">
                    USB printers are only supported on Android devices. You can get the IDs by viewing the device list after connecting the printer.
                  </Text>
                </View>
              </>
            )}

            {/* Bluetooth Config */}
            {formType === "bluetooth" && (
              <>
                <View className="mb-5">
                  <Text className="text-gray-700 font-medium mb-2">MAC Address *</Text>
                  <TextInput
                    className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-base"
                    placeholder="e.g., 00:11:22:33:44:55"
                    placeholderTextColor="#9ca3af"
                    value={formMacAddress}
                    onChangeText={setFormMacAddress}
                    autoCapitalize="characters"
                  />
                </View>
                <View className="bg-blue-50 rounded-xl p-4 mb-5 flex-row items-start gap-3">
                  <Ionicons name="information-circle" size={iconSize.base} color="#3b82f6" />
                  <Text className="text-blue-700 text-sm flex-1">
                    Please pair the Bluetooth printer in system settings first, then enter the printer MAC address.
                  </Text>
                </View>
              </>
            )}

            {/* Print Width (dots) — applies to all printer types */}
            <View className="mb-5">
              <Text className="text-gray-700 font-medium mb-2">Print Width (dots)</Text>
              <TextInput
                className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-base"
                placeholder="576"
                placeholderTextColor="#9ca3af"
                value={formPrintWidth}
                onChangeText={setFormPrintWidth}
                keyboardType="number-pad"
              />
              <Text className="text-gray-400 text-xs mt-1">
                58mm paper ≈ 384, 80mm paper ≈ 576. Check printer self-test page for exact value.
              </Text>
            </View>
          </ScrollView>

          {/* Modal Footer */}
          <View className="flex-row gap-3 px-6 py-4 border-t border-gray-200">
            <TouchableOpacity
              onPress={() => setIsModalVisible(false)}
              className="flex-1 border border-gray-300 rounded-xl py-3 items-center"
            >
              <Text className="text-gray-700 font-medium">Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleSavePrinter}
              className="flex-1 bg-blue-500 rounded-xl py-3 items-center"
            >
              <Text className="text-white font-medium">
                {editingPrinter ? "Save Changes" : "Add Printer"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    </Modal>
  );

  return (
    <View className="flex-1 bg-[#F7F7F9]">
      <PageHeader title="Settings" showBack={false} />

      <ScrollView className="flex-1" contentContainerClassName="p-5">
        {/* Printer Pool Card */}
        <View className="bg-white rounded-xl border border-gray-200 overflow-hidden mb-5">
          {/* Card Header */}
          <View className="bg-gray-50 px-5 py-4 border-b border-gray-200 flex-row items-center justify-between">
            <View className="flex-row items-center gap-3">
              <View className="bg-blue-100 p-2 rounded-lg">
                <Ionicons name="print" size={iconSize.xl} color="#3b82f6" />
              </View>
              <View>
                <Text className="text-lg font-semibold text-gray-800">Printer Management</Text>
                <Text className="text-gray-500 text-sm">
                  {printers.length} printers configured, {printers.filter(p => p.enabled).length} enabled
                </Text>
              </View>
            </View>
            <TouchableOpacity
              onPress={handleAddPrinter}
              className="bg-blue-500 px-4 py-2 rounded-lg flex-row items-center gap-2"
            >
              <Ionicons name="add" size={iconSize.base} color="white" />
              <Text className="text-white font-medium">Add Printer</Text>
            </TouchableOpacity>
          </View>

          {/* Printer List */}
          <View className="p-4">
            {printers.length === 0 ? (
              <View className="items-center py-10">
                <Ionicons name="print-outline" size={iconSize['4xl']} color="#d1d5db" />
                <Text className="text-gray-400 mt-3 text-base">No printers yet</Text>
                <Text className="text-gray-400 text-sm">Click the button above to add a printer</Text>
              </View>
            ) : (
              printers.map(renderPrinterCard)
            )}
          </View>

          {/* Pool Status */}
          {printers.length > 0 && (
            <View className="px-4 pb-4">
              <View className="bg-gray-50 rounded-xl p-4">
                <Text className="text-gray-600 font-medium mb-2">Printer Pool Status</Text>
                <View className="flex-row flex-wrap gap-4">
                  <View className="flex-row items-center gap-2">
                    <View className="w-3 h-3 rounded-full bg-green-500" />
                    <Text className="text-gray-600 text-sm">
                      Idle: {printers.filter(p => p.enabled && p.status === 'idle').length}
                    </Text>
                  </View>
                  <View className="flex-row items-center gap-2">
                    <View className="w-3 h-3 rounded-full bg-amber-500" />
                    <Text className="text-gray-600 text-sm">
                      Printing: {printers.filter(p => p.status === 'busy').length}
                    </Text>
                  </View>
                  <View className="flex-row items-center gap-2">
                    <View className="w-3 h-3 rounded-full bg-gray-400" />
                    <Text className="text-gray-600 text-sm">
                      Disabled: {printers.filter(p => !p.enabled).length}
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          )}
        </View>

        {/* App Settings Card */}
        <View className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <View className="bg-gray-50 px-5 py-4 border-b border-gray-200 flex-row items-center gap-3">
            <View className="bg-purple-100 p-2 rounded-lg">
              <Ionicons name="apps" size={iconSize.xl} color="#9333ea" />
            </View>
            <View>
              <Text className="text-lg font-semibold text-gray-800">App Settings</Text>
              <Text className="text-gray-500 text-sm">General application preferences</Text>
            </View>
          </View>

          <View className="p-5">
            {/* Print Format Setting */}
            <TouchableOpacity
              onPress={() => setShowPrintFormatPicker(true)}
              className="flex-row items-center justify-between py-4 border-b border-gray-100"
            >
              <View className="flex-row items-center gap-3">
                <Ionicons name="print-outline" size={iconSize.xl} color="#3b82f6" />
                <View>
                  <Text className="text-gray-700 text-base">Print Format</Text>
                  <Text className="text-gray-400 text-xs mt-0.5">Select A4 Invoice or Receipt format</Text>
                </View>
              </View>
              <View className="flex-row items-center gap-2">
                <Text className="text-blue-600 text-sm font-medium">
                  {printFormat === "a4" ? "A4 Invoice" : "Receipt"}
                </Text>
                <Ionicons name="chevron-forward" size={iconSize.md} color="#9ca3af" />
              </View>
            </TouchableOpacity>

            <View className="flex-row items-center justify-between py-4 border-b border-gray-100">
              <View className="flex-row items-center gap-3">
                <Ionicons name="information-circle-outline" size={iconSize.xl} color="#6b7280" />
                <Text className="text-gray-700 text-base">App Version</Text>
              </View>
              <Text className="text-gray-500 text-base">1.0.0</Text>
            </View>

            <View className="flex-row items-center justify-between py-4">
              <View className="flex-row items-center gap-3">
                <Ionicons name="code-slash-outline" size={iconSize.xl} color="#6b7280" />
                <Text className="text-gray-700 text-base">Build Number</Text>
              </View>
              <Text className="text-gray-500 text-base">2026.01.26</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {renderModal()}
      {renderPrintFormatPicker()}
    </View>
  );
}
