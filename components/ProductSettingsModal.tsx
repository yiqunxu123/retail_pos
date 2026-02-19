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
    <View className="flex-row justify-between items-center py-3.5 border-b border-[#E5E7EB]">
      <Text 
        style={{ 
          fontFamily: 'Montserrat',
          fontSize: 16,
          fontWeight: "500",
          color: "#1A1A1A"
        }} 
        className="flex-1 mr-4" 
        numberOfLines={1}
      >
        {label}
      </Text>
      <Switch
        trackColor={{ false: "#D1D5DB", true: "#FBCFE8" }} 
        thumbColor={value ? "#EC1A52" : "#FFFFFF"} 
        ios_backgroundColor="#D1D5DB"
        onValueChange={onValueChange}
        value={value}
      />
    </View>
  );

  const handleSave = () => {
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
  };

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
          className="w-[850px] max-h-[90%] bg-white rounded-2xl shadow-2xl overflow-hidden"
        >
          {/* Header */}
          <View className="flex-row justify-between items-center px-10 py-8 border-b border-gray-100">
            <View>
              <Text 
                style={{ 
                  fontSize: 36, 
                  fontWeight: "700", 
                  fontFamily: "Montserrat", 
                  color: "#1A1A1A",
                  letterSpacing: -0.5
                }}
              >
                Product Settings
              </Text>
              {product && (
                <Text 
                  style={{ 
                    fontFamily: 'Montserrat',
                    fontSize: 16,
                    color: "#6B7280",
                    marginTop: 6
                  }} 
                  numberOfLines={1}
                >
                  {product.name}
                </Text>
              )}
            </View>
            <Pressable onPress={onClose} className="p-2">
              <Ionicons name="close" size={36} color="#1A1A1A" />
            </Pressable>
          </View>

          <ScrollView className="px-10 py-8" showsVerticalScrollIndicator={false}>
            {/* General Settings */}
            <Text 
              style={{ 
                fontSize: 28, 
                fontWeight: "700", 
                fontFamily: "Montserrat", 
                color: "#1A1A1A",
                marginBottom: 24
              }}
            >
              General Settings
            </Text>
            
            <View className="flex-row gap-16 mb-12">
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
            <Text 
              style={{ 
                fontSize: 28, 
                fontWeight: "700", 
                fontFamily: "Montserrat", 
                color: "#1A1A1A",
                marginBottom: 24
              }}
            >
              Tax Settings
            </Text>
            <View className="flex-row gap-16 mb-8">
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
          <View className="flex-row justify-center gap-8 p-10 border-t border-gray-100">
            <Pressable
              onPress={onClose}
              className="flex-1 py-5 bg-red-50 rounded-2xl items-center justify-center border border-red-100"
            >
              <Text 
                style={{ 
                  fontFamily: 'Montserrat',
                  fontSize: 20,
                  fontWeight: "600",
                  color: "#EF4444"
                }}
              >
                Cancel
              </Text>
            </Pressable>
            <Pressable
              onPress={handleSave}
              className="flex-1 py-5 rounded-2xl items-center justify-center shadow-xl"
              style={{ backgroundColor: "#EC1A52" }}
            >
              <Text 
                style={{ 
                  fontFamily: 'Montserrat',
                  fontSize: 20,
                  fontWeight: "600",
                  color: "#FFFFFF"
                }}
              >
                Apply
              </Text>
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}
