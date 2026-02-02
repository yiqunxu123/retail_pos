import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  Switch,
  Text,
  View,
  KeyboardAvoidingView,
  Platform,
} from "react-native";

interface ProductSettingsModalProps {
  visible: boolean;
  onClose: () => void;
  product?: any;
  onSave?: (settings: any) => void;
}

export function ProductSettingsModal({ visible, onClose, product, onSave }: ProductSettingsModalProps) {
  // General Settings
  const [showImage, setShowImage] = useState(false);
  const [showCategory, setShowCategory] = useState(false);
  const [showMSRP, setShowMSRP] = useState(false);
  const [showDiscount, setShowDiscount] = useState(false);
  const [cueTip, setCueTip] = useState(false);
  
  const [preserveLastSalePrice, setPreserveLastSalePrice] = useState(false);
  const [preserveLastSalePrice2, setPreserveLastSalePrice2] = useState(false); 
  const [showPricesOnDisplay, setShowPricesOnDisplay] = useState(false);
  const [displayTaxCriteria, setDisplayTaxCriteria] = useState(false);

  // Tax Settings
  const [alabamaPTax, setAlabamaPTax] = useState(false);
  const [alaskaStateTax, setAlaskaStateTax] = useState(false);
  const [cityTax, setCityTax] = useState(false);
  const [countyTax, setCountyTax] = useState(false);

  const SettingRow = ({ label, value, onValueChange }: { label: string, value: boolean, onValueChange: (val: boolean) => void }) => (
    <View className="flex-row justify-between items-center py-3 border-b border-gray-100">
      <Text className="text-gray-700 text-sm flex-1 mr-4" numberOfLines={1}>{label}</Text>
      <Switch
        trackColor={{ false: "#E5E7EB", true: "#FBCFE8" }} // Light pink for track
        thumbColor={value ? "#EC1A52" : "#f4f3f4"} // Red for thumb
        ios_backgroundColor="#E5E7EB"
        onValueChange={onValueChange}
        value={value}
      />
    </View>
  );

  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View className="flex-1 justify-center items-center bg-black/50">
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          className="w-[700px] max-h-[85%] bg-white rounded-xl shadow-lg overflow-hidden"
        >
          {/* Header */}
          <View className="flex-row justify-between items-center px-6 py-4 border-b border-gray-200">
            <View>
              <Text className="text-xl font-bold text-gray-900">Product Settings</Text>
              {product && (
                <Text className="text-gray-500 text-sm mt-1" numberOfLines={1}>
                  {product.name}
                </Text>
              )}
            </View>
            <Pressable onPress={onClose} className="p-1">
              <Ionicons name="close" size={24} color="#9CA3AF" />
            </Pressable>
          </View>

          <ScrollView className="p-6">
            {/* General Settings */}
            <Text className="text-lg font-bold text-gray-900 mb-4">General Settings</Text>
            
            <View className="flex-row gap-8 mb-6">
              {/* Left Column */}
              <View className="flex-1">
                <SettingRow label="Show Image" value={showImage} onValueChange={setShowImage} />
                <SettingRow label="Show Category" value={showCategory} onValueChange={setShowCategory} />
                <SettingRow label="Show MSRP" value={showMSRP} onValueChange={setShowMSRP} />
                <SettingRow label="Show Discount" value={showDiscount} onValueChange={setShowDiscount} />
                <SettingRow label="Cue Tip" value={cueTip} onValueChange={setCueTip} />
              </View>

              {/* Right Column */}
              <View className="flex-1">
                <SettingRow label="Preserve Last Sale Price" value={preserveLastSalePrice} onValueChange={setPreserveLastSalePrice} />
                <SettingRow label="Preserve Last Sale Price" value={preserveLastSalePrice2} onValueChange={setPreserveLastSalePrice2} />
                <SettingRow label="Show Prices on Customer Display" value={showPricesOnDisplay} onValueChange={setShowPricesOnDisplay} />
                <SettingRow label="Display Tax Criteria" value={displayTaxCriteria} onValueChange={setDisplayTaxCriteria} />
              </View>
            </View>

            {/* Tax Settings */}
            <Text className="text-lg font-bold text-gray-900 mb-4">Tax Settings</Text>
            <View className="flex-row gap-8">
               {/* Left Column */}
               <View className="flex-1">
                  <SettingRow label="Alabama P Tax" value={alabamaPTax} onValueChange={setAlabamaPTax} />
                  <SettingRow label="Alaska State Tax" value={alaskaStateTax} onValueChange={setAlaskaStateTax} />
               </View>
               {/* Right Column */}
               <View className="flex-1">
                  <SettingRow label="City Tax" value={cityTax} onValueChange={setCityTax} />
                  <SettingRow label="County Tax" value={countyTax} onValueChange={setCountyTax} />
               </View>
            </View>
          </ScrollView>

          {/* Footer */}
          <View className="flex-row justify-center gap-4 p-6 border-t border-gray-200">
            <Pressable
              onPress={onClose}
              className="flex-1 py-3 bg-red-50 rounded-lg items-center border border-red-100"
            >
              <Text className="text-red-500 font-semibold">Cancel</Text>
            </Pressable>
            <Pressable
              onPress={() => {
                // Handle save
                const settings = {
                  showImage,
                  showCategory,
                  showMSRP,
                  showDiscount,
                  cueTip,
                  preserveLastSalePrice,
                  showPricesOnDisplay,
                  displayTaxCriteria,
                  alabamaPTax,
                  alaskaStateTax,
                  cityTax,
                  countyTax,
                };
                onSave?.(settings);
                onClose();
              }}
              className="flex-1 py-3 rounded-lg items-center"
              style={{ backgroundColor: "#EC1A52" }}
            >
              <Text className="text-white font-semibold">Apply</Text>
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}
