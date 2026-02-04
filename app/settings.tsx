import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useState } from "react";
import { Alert, Modal, Pressable, ScrollView, Switch, Text, TextInput, TouchableOpacity, View } from "react-native";
import { PageHeader } from "../components";
import { 
  printerPool, 
  addPrinter, 
  removePrinter, 
  updatePrinter,
  setPrinterEnabled, 
  getPrinters,
  PrinterConfig,
  PrinterState,
  PrinterType,
} from "../utils/PrinterPoolManager";

// Storage key for printers
const PRINTERS_STORAGE_KEY = "printer_pool_config";

// Printer type options
const PRINTER_TYPES: { value: PrinterType; label: string; icon: string }[] = [
  { value: "ethernet", label: "网络打印机", icon: "wifi" },
  { value: "usb", label: "USB 打印机", icon: "hardware-chip" },
  { value: "bluetooth", label: "蓝牙打印机", icon: "bluetooth" },
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

  // Load printers on mount
  useEffect(() => {
    loadPrinters();
  }, []);

  // Load printers from storage and register to pool
  const loadPrinters = async () => {
    try {
      const saved = await AsyncStorage.getItem(PRINTERS_STORAGE_KEY);
      if (saved) {
        const configs: PrinterConfig[] = JSON.parse(saved);
        const existingIds = new Set(getPrinters().map(p => p.id));
        const newIds = new Set(configs.map(c => c.id));
        
        // 先添加/更新配置中的打印机
        configs.forEach(config => {
          if (!existingIds.has(config.id)) {
            addPrinter(config);
          } else {
            updatePrinter(config.id, config);
          }
        });
        
        // 再删除配置中不存在的打印机
        getPrinters().forEach(p => {
          if (!newIds.has(p.id)) {
            removePrinter(p.id);
          }
        });
      }
      setPrinters(getPrinters());
    } catch (e) {
      console.log("Failed to load printers:", e);
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
      }));
      await AsyncStorage.setItem(PRINTERS_STORAGE_KEY, JSON.stringify(configs));
    } catch (e) {
      console.log("Failed to save printers:", e);
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
  };

  // Validate form
  const validateForm = (): string | null => {
    if (!formName.trim()) return "请输入打印机名称";
    
    if (formType === "ethernet") {
      if (!formIp.trim()) return "请输入 IP 地址";
      const ipRegex = /^(\d{1,3}\.){3}\d{1,3}$/;
      if (!ipRegex.test(formIp)) return "IP 地址格式不正确";
    }
    
    if (formType === "usb") {
      if (!formVendorId.trim() || !formProductId.trim()) {
        return "请输入 Vendor ID 和 Product ID";
      }
    }
    
    if (formType === "bluetooth") {
      if (!formMacAddress.trim()) return "请输入蓝牙 MAC 地址";
    }
    
    return null;
  };

  // Save printer (add or update)
  const handleSavePrinter = () => {
    const error = validateForm();
    if (error) {
      Alert.alert("验证错误", error);
      return;
    }

    const config: PrinterConfig = {
      id: editingPrinter?.id || `printer_${Date.now()}`,
      name: formName.trim(),
      type: formType,
      enabled: editingPrinter?.enabled ?? true,
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

    if (editingPrinter) {
      updatePrinter(editingPrinter.id, config);
    } else {
      addPrinter(config);
    }

    const updatedPrinters = getPrinters();
    setPrinters(updatedPrinters);
    savePrinters(updatedPrinters);
    setIsModalVisible(false);
    resetForm();
  };

  // Delete printer
  const handleDeletePrinter = (printer: PrinterState) => {
    Alert.alert(
      "删除打印机",
      `确定要删除 "${printer.name}" 吗？`,
      [
        { text: "取消", style: "cancel" },
        {
          text: "删除",
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
      case "idle": return "空闲";
      case "busy": return "打印中";
      case "offline": return "离线";
      case "error": return "错误";
      default: return status;
    }
  };

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
              size={24} 
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
                {getStatusText(printer.status)} · 已完成 {printer.jobsCompleted} 个任务
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
            <Ionicons name="pencil" size={20} color="#6b7280" />
          </TouchableOpacity>
          <TouchableOpacity 
            onPress={() => handleDeletePrinter(printer)}
            className="p-2"
          >
            <Ionicons name="trash-outline" size={20} color="#ef4444" />
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
                <Ionicons name={editingPrinter ? "pencil" : "add"} size={24} color="#3b82f6" />
              </View>
              <Text className="text-xl font-semibold text-gray-800">
                {editingPrinter ? "编辑打印机" : "添加打印机"}
              </Text>
            </View>
            <TouchableOpacity onPress={() => setIsModalVisible(false)}>
              <Ionicons name="close" size={24} color="#6b7280" />
            </TouchableOpacity>
          </View>

          <ScrollView className="p-6">
            {/* Printer Name */}
            <View className="mb-5">
              <Text className="text-gray-700 font-medium mb-2">打印机名称 *</Text>
              <TextInput
                className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-base"
                placeholder="例如：收银台打印机"
                placeholderTextColor="#9ca3af"
                value={formName}
                onChangeText={setFormName}
              />
            </View>

            {/* Printer Type */}
            <View className="mb-5">
              <Text className="text-gray-700 font-medium mb-2">打印机类型 *</Text>
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
                      size={24} 
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
                  <Text className="text-gray-700 font-medium mb-2">IP 地址 *</Text>
                  <TextInput
                    className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-base"
                    placeholder="例如：192.168.1.100"
                    placeholderTextColor="#9ca3af"
                    value={formIp}
                    onChangeText={setFormIp}
                    keyboardType="numeric"
                  />
                </View>
                <View className="mb-5">
                  <Text className="text-gray-700 font-medium mb-2">端口</Text>
                  <TextInput
                    className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-base"
                    placeholder="默认 9100"
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
                    placeholder="例如：0x0483 或 1155"
                    placeholderTextColor="#9ca3af"
                    value={formVendorId}
                    onChangeText={setFormVendorId}
                  />
                </View>
                <View className="mb-5">
                  <Text className="text-gray-700 font-medium mb-2">Product ID *</Text>
                  <TextInput
                    className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-base"
                    placeholder="例如：0x5740 或 22336"
                    placeholderTextColor="#9ca3af"
                    value={formProductId}
                    onChangeText={setFormProductId}
                  />
                </View>
                <View className="bg-amber-50 rounded-xl p-4 mb-5 flex-row items-start gap-3">
                  <Ionicons name="information-circle" size={20} color="#f59e0b" />
                  <Text className="text-amber-700 text-sm flex-1">
                    USB 打印机仅支持 Android 设备。可以通过连接打印机后查看设备列表获取 ID。
                  </Text>
                </View>
              </>
            )}

            {/* Bluetooth Config */}
            {formType === "bluetooth" && (
              <>
                <View className="mb-5">
                  <Text className="text-gray-700 font-medium mb-2">MAC 地址 *</Text>
                  <TextInput
                    className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-base"
                    placeholder="例如：00:11:22:33:44:55"
                    placeholderTextColor="#9ca3af"
                    value={formMacAddress}
                    onChangeText={setFormMacAddress}
                    autoCapitalize="characters"
                  />
                </View>
                <View className="bg-blue-50 rounded-xl p-4 mb-5 flex-row items-start gap-3">
                  <Ionicons name="information-circle" size={20} color="#3b82f6" />
                  <Text className="text-blue-700 text-sm flex-1">
                    请先在系统设置中配对蓝牙打印机，然后输入打印机的 MAC 地址。
                  </Text>
                </View>
              </>
            )}
          </ScrollView>

          {/* Modal Footer */}
          <View className="flex-row gap-3 px-6 py-4 border-t border-gray-200">
            <TouchableOpacity
              onPress={() => setIsModalVisible(false)}
              className="flex-1 border border-gray-300 rounded-xl py-3 items-center"
            >
              <Text className="text-gray-700 font-medium">取消</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleSavePrinter}
              className="flex-1 bg-blue-500 rounded-xl py-3 items-center"
            >
              <Text className="text-white font-medium">
                {editingPrinter ? "保存修改" : "添加打印机"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    </Modal>
  );

  return (
    <View className="flex-1 bg-gray-50">
      <PageHeader title="Settings" />

      <ScrollView className="flex-1" contentContainerClassName="p-5">
        {/* Printer Pool Card */}
        <View className="bg-white rounded-xl border border-gray-200 overflow-hidden mb-5">
          {/* Card Header */}
          <View className="bg-gray-50 px-5 py-4 border-b border-gray-200 flex-row items-center justify-between">
            <View className="flex-row items-center gap-3">
              <View className="bg-blue-100 p-2 rounded-lg">
                <Ionicons name="print" size={24} color="#3b82f6" />
              </View>
              <View>
                <Text className="text-lg font-semibold text-gray-800">打印机管理</Text>
                <Text className="text-gray-500 text-sm">
                  已配置 {printers.length} 台打印机，{printers.filter(p => p.enabled).length} 台启用
                </Text>
              </View>
            </View>
            <TouchableOpacity
              onPress={handleAddPrinter}
              className="bg-blue-500 px-4 py-2 rounded-lg flex-row items-center gap-2"
            >
              <Ionicons name="add" size={20} color="white" />
              <Text className="text-white font-medium">添加打印机</Text>
            </TouchableOpacity>
          </View>

          {/* Printer List */}
          <View className="p-4">
            {printers.length === 0 ? (
              <View className="items-center py-10">
                <Ionicons name="print-outline" size={48} color="#d1d5db" />
                <Text className="text-gray-400 mt-3 text-base">暂无打印机</Text>
                <Text className="text-gray-400 text-sm">点击上方按钮添加打印机</Text>
              </View>
            ) : (
              printers.map(renderPrinterCard)
            )}
          </View>

          {/* Pool Status */}
          {printers.length > 0 && (
            <View className="px-4 pb-4">
              <View className="bg-gray-50 rounded-xl p-4">
                <Text className="text-gray-600 font-medium mb-2">打印机池状态</Text>
                <View className="flex-row flex-wrap gap-4">
                  <View className="flex-row items-center gap-2">
                    <View className="w-3 h-3 rounded-full bg-green-500" />
                    <Text className="text-gray-600 text-sm">
                      空闲: {printers.filter(p => p.enabled && p.status === 'idle').length}
                    </Text>
                  </View>
                  <View className="flex-row items-center gap-2">
                    <View className="w-3 h-3 rounded-full bg-amber-500" />
                    <Text className="text-gray-600 text-sm">
                      打印中: {printers.filter(p => p.status === 'busy').length}
                    </Text>
                  </View>
                  <View className="flex-row items-center gap-2">
                    <View className="w-3 h-3 rounded-full bg-gray-400" />
                    <Text className="text-gray-600 text-sm">
                      禁用: {printers.filter(p => !p.enabled).length}
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
              <Ionicons name="apps" size={24} color="#9333ea" />
            </View>
            <View>
              <Text className="text-lg font-semibold text-gray-800">App Settings</Text>
              <Text className="text-gray-500 text-sm">General application preferences</Text>
            </View>
          </View>

          <View className="p-5">
            <View className="flex-row items-center justify-between py-4 border-b border-gray-100">
              <View className="flex-row items-center gap-3">
                <Ionicons name="information-circle-outline" size={24} color="#6b7280" />
                <Text className="text-gray-700 text-base">App Version</Text>
              </View>
              <Text className="text-gray-500 text-base">1.0.0</Text>
            </View>

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

      {renderModal()}
    </View>
  );
}
