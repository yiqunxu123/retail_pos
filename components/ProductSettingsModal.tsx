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
import { fontSize, fontWeight, colors, iconSize } from '@/utils/theme';

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
    <View className="flex-row justify-between items-center py-3.5" style={{ borderBottomWidth: 1, borderBottomColor: colors.border }}>
      <Text 
        style={{ 
          fontFamily: 'Montserrat',
          fontSize: fontSize.lg,
          fontWeight: fontWeight.medium,
          color: colors.text
        }} 
        className="flex-1 mr-4" 
        numberOfLines={1}
      >
        {label}
      </Text>
      <Switch
        trackColor={{ false: colors.borderMedium, true: "#FBCFE8" }} 
        thumbColor={value ? colors.primary : colors.textWhite} 
        ios_backgroundColor={colors.borderMedium}
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
                  fontSize: fontSize['4xl'], 
                  fontWeight: fontWeight.bold, 
                  fontFamily: "Montserrat", 
                  color: colors.text,
                  letterSpacing: -0.5
                }}
              >
                Product Settings
              </Text>
              {product && (
                <Text 
                  style={{ 
                    fontFamily: 'Montserrat',
                    fontSize: fontSize.lg,
                    color: colors.textSecondary,
                    marginTop: 6
                  }} 
                  numberOfLines={1}
                >
                  {product.name}
                </Text>
              )}
            </View>
            <Pressable onPress={onClose} className="p-2">
              <Ionicons name="close" size={iconSize['3xl']} color={colors.text} />
            </Pressable>
          </View>

          <ScrollView className="px-10 py-8" showsVerticalScrollIndicator={false}>
            {/* General Settings */}
            <Text 
              style={{ 
                fontSize: fontSize['3xl'], 
                fontWeight: fontWeight.bold, 
                fontFamily: "Montserrat", 
                color: colors.text,
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
                fontSize: fontSize['3xl'], 
                fontWeight: fontWeight.bold, 
                fontFamily: "Montserrat", 
                color: colors.text,
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
              className="flex-1 bg-red-50 rounded-lg items-center justify-center border border-red-100"
              style={{ height: 40 }}
            >
              <Text 
                style={{ 
                  fontFamily: 'Montserrat',
                  fontSize: fontSize['2xl'],
                  fontWeight: fontWeight.semibold,
                  color: colors.error
                }}
              >
                Cancel
              </Text>
            </Pressable>
            <Pressable
              onPress={handleSave}
              className="flex-1 rounded-lg items-center justify-center shadow-xl"
              style={{ height: 40, backgroundColor: colors.primary }}
            >
              <Text 
                style={{ 
                  fontFamily: 'Montserrat',
                  fontSize: fontSize['2xl'],
                  fontWeight: fontWeight.semibold,
                  color: colors.textWhite
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
