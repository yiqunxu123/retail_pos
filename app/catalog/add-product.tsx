/**
 * Add Product Screen
 * 
 * Form to add a new product to the catalog.
 * Based on kapp web UI design.
 */

import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
    Alert,
    Modal,
    Pressable,
    ScrollView,
    Switch,
    Text,
    TextInput,
    View,
} from "react-native";
import { PageHeader } from "../../components";

// Tab 配置
const TABS = [
  { key: "basic", label: "Basic" },
  { key: "pricing", label: "Pricing & Stock" },
  { key: "seo", label: "SEO" },
  { key: "variants", label: "Variants" },
  { key: "tax", label: "Tax Section" },
  { key: "promotions", label: "Promotions" },
];

// 表单输入组件
function FormInput({ 
  label, 
  placeholder, 
  value, 
  onChangeText, 
  info,
  required,
  disabled,
}: { 
  label: string; 
  placeholder?: string; 
  value: string; 
  onChangeText: (text: string) => void;
  info?: boolean;
  required?: boolean;
  disabled?: boolean;
}) {
  return (
    <View className="mb-4">
      <View className="flex-row items-center mb-2">
        <Text className="text-gray-700 text-sm font-medium">
          {label}
          {required && <Text className="text-red-500">*</Text>}
        </Text>
        {info && (
          <Ionicons name="information-circle-outline" size={16} color="#9CA3AF" style={{ marginLeft: 4 }} />
        )}
      </View>
      <TextInput
        className="bg-white border border-gray-200 rounded-lg px-4 py-3"
        placeholder={placeholder || label}
        placeholderTextColor="#9ca3af"
        value={value}
        onChangeText={onChangeText}
        editable={!disabled}
        style={disabled ? { backgroundColor: '#F3F4F6' } : {}}
      />
    </View>
  );
}

// 下拉选择组件（简化版）
function FormSelect({ 
  label, 
  placeholder,
  value,
  info,
}: { 
  label: string; 
  placeholder?: string;
  value?: string;
  info?: boolean;
}) {
  return (
    <View className="mb-4">
      <View className="flex-row items-center mb-2">
        <Text className="text-gray-700 text-sm font-medium">{label}</Text>
        {info && (
          <Ionicons name="information-circle-outline" size={16} color="#9CA3AF" style={{ marginLeft: 4 }} />
        )}
      </View>
      <Pressable className="bg-white border border-gray-200 rounded-lg px-4 py-3 flex-row justify-between items-center">
        <Text className={value ? "text-gray-800" : "text-gray-400"}>
          {value || placeholder || "Select"}
        </Text>
        <Ionicons name="chevron-down" size={16} color="#9CA3AF" />
      </Pressable>
    </View>
  );
}

// 开关组件
function FormSwitch({ 
  label, 
  value, 
  onValueChange 
}: { 
  label: string; 
  value: boolean; 
  onValueChange: (val: boolean) => void;
}) {
  return (
    <View className="flex-row items-center mr-6 mb-3">
      <Text className="text-gray-600 text-sm mr-2">{label}</Text>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: "#D1D5DB", true: "#EC1A52" }}
        thumbColor="white"
      />
    </View>
  );
}

export default function AddProductScreen() {
  const router = useRouter();
  
  // Active Tab
  const [activeTab, setActiveTab] = useState("basic");

  // Form state - Basic
  const [productName, setProductName] = useState("");
  const [alias, setAlias] = useState("");
  const [productEcomName, setProductEcomName] = useState("");
  const [sku, setSku] = useState("");
  const [autoGenerateSku, setAutoGenerateSku] = useState(true);
  const [weight, setWeight] = useState("");
  const [upc, setUpc] = useState("");
  const [autoFetchImage, setAutoFetchImage] = useState(true);
  const [retailUpc1, setRetailUpc1] = useState("");
  const [retailUpc2, setRetailUpc2] = useState("");
  const [binCode, setBinCode] = useState("");
  const [zone, setZone] = useState("");
  const [aisle, setAisle] = useState("");
  const [tags, setTags] = useState("");
  const [productNote, setProductNote] = useState("");
  
  // Switches - Basic
  const [isMsa, setIsMsa] = useState(false);
  const [enableBoProduct, setEnableBoProduct] = useState(false);
  const [isTaxApplicable, setIsTaxApplicable] = useState(false);
  
  // Switches - Ecommerce
  const [isOnline, setIsOnline] = useState(false);
  const [isFeatured, setIsFeatured] = useState(false);
  const [isHotSeller, setIsHotSeller] = useState(false);
  
  // Add Category Modal
  const [showAddCategoryModal, setShowAddCategoryModal] = useState(false);
  const [categoryName, setCategoryName] = useState("");
  const [categoryMsaCode, setCategoryMsaCode] = useState("");
  const [categoryIsMsa, setCategoryIsMsa] = useState(false);
  const [categoryIsFeature, setCategoryIsFeature] = useState(false);
  const [categoryParent, setCategoryParent] = useState("");
  
  // Pricing & Stock Tab state
  const [measuredBy, setMeasuredBy] = useState("Count");
  const [soldBy, setSoldBy] = useState("Piece");
  const [boughtBy, setBoughtBy] = useState("Piece");
  
  // Unit of Measurement data
  const [unitData, setUnitData] = useState([
    { unit: "Piece", qty: "1", upc: "" },
    { unit: "Pack", qty: "", qtyLabel: "pieces", upc: "" },
    { unit: "Case", qty: "", qtyLabel: "packs", upc: "" },
    { unit: "Pallet", qty: "", qtyLabel: "cases", upc: "" },
  ]);
  
  // Pricing data
  const [pricingData, setPricingData] = useState([
    { unit: "Piece", qty: "1", baseCost: "", netCost: "", salePrice: "", margin: "", msrp: "", lowestPrice: "", ecomPrice: "", tier1: "", tier2: "", tier3: "", tier4: "", tier5: "" },
    { unit: "Pack", qty: "", qtyLabel: "Pieces", baseCost: "", netCost: "", salePrice: "", margin: "", msrp: "", lowestPrice: "", ecomPrice: "", tier1: "", tier2: "", tier3: "", tier4: "", tier5: "" },
    { unit: "Case", qty: "", qtyLabel: "Packs", baseCost: "", netCost: "", salePrice: "", margin: "", msrp: "", lowestPrice: "", ecomPrice: "", tier1: "", tier2: "", tier3: "", tier4: "", tier5: "" },
    { unit: "Pallet", qty: "", qtyLabel: "Cases", baseCost: "", netCost: "", salePrice: "", margin: "", msrp: "", lowestPrice: "", ecomPrice: "", tier1: "", tier2: "", tier3: "", tier4: "", tier5: "" },
  ]);
  
  // Stock data
  const [stockData, setStockData] = useState([
    { srNo: "1", warehouse: "Primary", availableQty: "0", onHoldQty: "0", damagedQty: "0", backOrderQty: "", comingSoonQty: "" },
  ]);
  
  // Collapsible sections
  const [measurementExpanded, setMeasurementExpanded] = useState(true);
  const [pricingExpanded, setPricingExpanded] = useState(true);
  const [stockExpanded, setStockExpanded] = useState(true);
  
  // SEO Tab state
  const [seoSlug, setSeoSlug] = useState("");
  const [metaTitle, setMetaTitle] = useState("");
  const [metaDescription, setMetaDescription] = useState("");
  const [isNewArrival, setIsNewArrival] = useState(false);
  const [enableBoOnline, setEnableBoOnline] = useState(false);
  
  // Youtube
  const [youtubeLink, setYoutubeLink] = useState("");

  // Status
  const [status, setStatus] = useState("active");

  const handleSave = () => {
    if (!productName.trim()) {
      Alert.alert("Error", "Product name is required");
      return;
    }
    
    Alert.alert("Success", "Product added successfully", [
      { text: "OK", onPress: () => router.back() }
    ]);
  };

  // Render Basic Tab Content
  const renderBasicTab = () => (
    <View className="flex-1 flex-row">
      {/* Left Sidebar - Category */}
      <View className="w-56 bg-white border-r border-gray-200 p-4">
        <View className="flex-row items-center justify-between mb-4">
          <Text className="text-gray-800 font-medium">Select Category</Text>
          <Pressable 
            className="w-6 h-6 rounded-full bg-red-50 items-center justify-center"
            onPress={() => setShowAddCategoryModal(true)}
          >
            <Ionicons name="add" size={16} color="#EC1A52" />
          </Pressable>
        </View>
        <View className="flex-row items-center py-3">
          <Text className="text-gray-500 text-sm flex-1">No Category Found</Text>
          <Ionicons name="information-circle-outline" size={18} color="#9CA3AF" />
        </View>
      </View>

      {/* Middle - Form */}
      <ScrollView className="flex-1 p-6" showsVerticalScrollIndicator={false}>
        {/* General Information */}
        <Text className="text-lg font-semibold text-gray-800 mb-6">General Information</Text>

        {/* Row 1: Product Name, Alias, Product Ecom Name */}
        <View className="flex-row gap-4">
          <View className="flex-1">
            <FormInput
              label="Product Name"
              required
              info
              placeholder="Product Name"
              value={productName}
              onChangeText={setProductName}
            />
          </View>
          <View className="flex-1">
            <FormInput
              label="Alias"
              info
              placeholder="Alias Name"
              value={alias}
              onChangeText={setAlias}
            />
          </View>
          <View className="flex-1">
            <FormInput
              label="Product Ecom Name"
              placeholder="Product Ecom Name"
              value={productEcomName}
              onChangeText={setProductEcomName}
            />
          </View>
        </View>

        {/* Row 2: SKU, Weight, Select Brand */}
        <View className="flex-row gap-4">
          <View className="flex-1">
            <FormInput
              label="SKU"
              info
              placeholder="SKU"
              value={sku}
              onChangeText={setSku}
              disabled={autoGenerateSku}
            />
            <Pressable 
              className="flex-row items-center mt-1"
              onPress={() => setAutoGenerateSku(!autoGenerateSku)}
            >
              <View className={`w-4 h-4 rounded border mr-2 items-center justify-center ${autoGenerateSku ? 'bg-red-500 border-red-500' : 'border-gray-300'}`}>
                {autoGenerateSku && <Ionicons name="checkmark" size={12} color="white" />}
              </View>
              <Text className="text-gray-600 text-sm">Auto generated SKU</Text>
            </Pressable>
          </View>
          <View className="flex-1">
            <View className="mb-4">
              <Text className="text-gray-700 text-sm font-medium mb-2">Weight</Text>
              <View className="flex-row">
                <TextInput
                  className="flex-1 bg-white border border-gray-200 rounded-l-lg px-4 py-3"
                  placeholder="Enter Weight"
                  placeholderTextColor="#9ca3af"
                  value={weight}
                  onChangeText={setWeight}
                  keyboardType="decimal-pad"
                />
                <Pressable className="bg-gray-100 border border-l-0 border-gray-200 rounded-r-lg px-3 flex-row items-center">
                  <Text className="text-gray-600 mr-1">lb</Text>
                  <Ionicons name="chevron-down" size={14} color="#6B7280" />
                </Pressable>
              </View>
            </View>
          </View>
          <View className="flex-1">
            <FormSelect label="Select Brand" placeholder="Select" />
          </View>
        </View>

        {/* Row 3: UPC, Retail UPC 1, Retail UPC 2 */}
        <View className="flex-row gap-4">
          <View className="flex-1">
            <FormInput
              label="UPC"
              info
              placeholder="Enter UPC"
              value={upc}
              onChangeText={setUpc}
            />
            <Pressable 
              className="flex-row items-center mt-1"
              onPress={() => setAutoFetchImage(!autoFetchImage)}
            >
              <View className={`w-4 h-4 rounded border mr-2 items-center justify-center ${autoFetchImage ? 'bg-red-500 border-red-500' : 'border-gray-300'}`}>
                {autoFetchImage && <Ionicons name="checkmark" size={12} color="white" />}
              </View>
              <Text className="text-gray-600 text-sm">Auto fetch image</Text>
            </Pressable>
          </View>
          <View className="flex-1">
            <FormInput
              label="Retail UPC 1"
              placeholder="Retail UPC 1"
              value={retailUpc1}
              onChangeText={setRetailUpc1}
            />
          </View>
          <View className="flex-1">
            <FormInput
              label="Retail UPC 2"
              placeholder="Retail UPC 2"
              value={retailUpc2}
              onChangeText={setRetailUpc2}
            />
          </View>
        </View>

        {/* Row 4: Bin Code, Zone, Aisle */}
        <View className="flex-row gap-4">
          <View className="flex-1">
            <FormInput
              label="Bin Code"
              info
              placeholder="Bin Code"
              value={binCode}
              onChangeText={setBinCode}
            />
          </View>
          <View className="flex-1">
            <FormInput
              label="Zone"
              placeholder="Enter Zone"
              value={zone}
              onChangeText={setZone}
            />
          </View>
          <View className="flex-1">
            <FormInput
              label="Aisle"
              placeholder="Enter Aisle"
              value={aisle}
              onChangeText={setAisle}
            />
          </View>
        </View>

        {/* Row 5: Manufacturer, Select Suppliers, Select Main Category */}
        <View className="flex-row gap-4">
          <View className="flex-1">
            <FormSelect label="Manufacturer" placeholder="Select" />
          </View>
          <View className="flex-1">
            <FormSelect label="Select Suppliers" placeholder="Select" />
          </View>
          <View className="flex-1">
            <FormSelect label="Select Main Category" placeholder="Select" />
          </View>
        </View>

        {/* Row 6: Tags, Product Note */}
        <View className="flex-row gap-4">
          <View className="flex-1">
            <FormInput
              label="Tags"
              info
              placeholder="Tags"
              value={tags}
              onChangeText={setTags}
            />
          </View>
          <View className="flex-[2]">
            <View className="mb-4">
              <Text className="text-gray-700 text-sm font-medium mb-2">Product Note</Text>
              <TextInput
                className="bg-white border border-gray-200 rounded-lg px-4 py-3"
                placeholder="Place note here"
                placeholderTextColor="#9ca3af"
                value={productNote}
                onChangeText={setProductNote}
                multiline
                numberOfLines={3}
                style={{ minHeight: 80, textAlignVertical: 'top' }}
              />
            </View>
          </View>
        </View>

        {/* Switches Row */}
        <View className="flex-row flex-wrap mb-6">
          <FormSwitch label="Is MSA" value={isMsa} onValueChange={setIsMsa} />
          <FormSwitch label="Enable BO product" value={enableBoProduct} onValueChange={setEnableBoProduct} />
          <FormSwitch label="Is Tax Applicable" value={isTaxApplicable} onValueChange={setIsTaxApplicable} />
        </View>

        {/* Ecommerce Section */}
        <Text className="text-lg font-semibold text-gray-800 mb-4">Ecommerce</Text>
        <View className="flex-row flex-wrap mb-4">
          <FormSwitch label="Online" value={isOnline} onValueChange={setIsOnline} />
          <FormSwitch label="Featured" value={isFeatured} onValueChange={setIsFeatured} />
          <FormSwitch label="Is Hot Seller" value={isHotSeller} onValueChange={setIsHotSeller} />
          <FormSwitch label="New Arrival" value={isNewArrival} onValueChange={setIsNewArrival} />
        </View>
        <View className="mb-6">
          <FormSwitch label="Enable BO for Online site" value={enableBoOnline} onValueChange={setEnableBoOnline} />
        </View>

        {/* Detail Product Description */}
        <View className="flex-row items-center justify-between mb-4">
          <Text className="text-lg font-semibold text-gray-800">Detail Product Description</Text>
          <Pressable className="border border-gray-300 rounded-lg px-4 py-2">
            <Text className="text-gray-600">Generate Description</Text>
          </Pressable>
        </View>
        <TextInput
          className="bg-white border border-gray-200 rounded-lg px-4 py-3 mb-6"
          placeholder="Enter product description..."
          placeholderTextColor="#9ca3af"
          multiline
          numberOfLines={5}
          style={{ minHeight: 120, textAlignVertical: 'top' }}
        />

        {/* Bottom spacing */}
        <View className="h-20" />
      </ScrollView>

      {/* Right Sidebar - Status & Image */}
      <View className="w-64 bg-white border-l border-gray-200 p-4">
        {/* Status Dropdown */}
        <Pressable className="bg-gray-800 rounded-lg px-4 py-3 flex-row justify-between items-center mb-6">
          <Text className="text-white font-medium">ACTIVE</Text>
          <Ionicons name="chevron-down" size={16} color="white" />
        </Pressable>

        {/* Image Upload */}
        <View className="bg-gray-100 rounded-lg p-6 items-center mb-6">
          <View className="w-16 h-16 bg-white rounded-full items-center justify-center mb-4 border-2 border-dashed border-gray-300">
            <Ionicons name="cloud-upload-outline" size={28} color="#9CA3AF" />
          </View>
          <Text className="text-gray-500 text-sm text-center">Upload up to 5 images</Text>
          <Text className="text-gray-400 text-xs text-center mt-1">Image size should be 400 x 400 px</Text>
        </View>

        {/* Youtube Link */}
        <Pressable 
          className="rounded-lg py-3 items-center mb-4"
          style={{ backgroundColor: "#EC1A52" }}
        >
          <Text className="text-white font-medium">Youtube Link</Text>
        </Pressable>
        <TextInput
          className="bg-white border border-gray-200 rounded-lg px-4 py-3"
          placeholder="Enter youtube link"
          placeholderTextColor="#9ca3af"
          value={youtubeLink}
          onChangeText={setYoutubeLink}
        />
      </View>
    </View>
  );

  // Render Pricing & Stock Tab Content
  const renderPricingTab = () => (
    <ScrollView className="flex-1 bg-gray-50" showsVerticalScrollIndicator={false}>
      {/* Define Unit of Measurement Section */}
      <View className="bg-white m-4 rounded-lg border border-gray-200">
        <Pressable 
          className="flex-row items-center justify-between p-4 border-b border-gray-100"
          onPress={() => setMeasurementExpanded(!measurementExpanded)}
        >
          <Text className="text-lg font-semibold text-gray-800">Define Unit of Measurement</Text>
          <Ionicons name={measurementExpanded ? "chevron-up" : "chevron-down"} size={20} color="#9CA3AF" />
        </Pressable>
        
        {measurementExpanded && (
          <View className="p-4">
            {/* Measured By */}
            <View className="mb-4">
              <Text className="text-gray-700 text-sm mb-2">
                This product is measured by<Text className="text-red-500">*</Text>
              </Text>
              <Pressable className="bg-white border border-gray-200 rounded-lg px-4 py-3 flex-row justify-between items-center w-48">
                <Text className="text-gray-800">{measuredBy}</Text>
                <Ionicons name="chevron-down" size={16} color="#9CA3AF" />
              </Pressable>
            </View>

            {/* Units Table */}
            <View>
              {/* Header */}
              <View className="flex-row py-2 border-b border-gray-200">
                <Text className="w-20 text-gray-600 text-sm font-medium">Unit</Text>
                <Text className="w-40 text-gray-600 text-sm font-medium">Packaging Quantity</Text>
                <Text className="flex-1 text-gray-600 text-sm font-medium">UPC*</Text>
              </View>
              
              {/* Rows */}
              {unitData.map((item, index) => (
                <View key={item.unit} className="flex-row items-center py-3 border-b border-gray-100">
                  <Text className="w-20 text-gray-700">{item.unit}</Text>
                  <View className="w-40 flex-row items-center">
                    <TextInput
                      className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 w-20"
                      placeholder={index === 0 ? "1" : "Enter Q..."}
                      placeholderTextColor="#9ca3af"
                      value={item.qty}
                      onChangeText={(text) => {
                        const newData = [...unitData];
                        newData[index].qty = text;
                        setUnitData(newData);
                      }}
                      editable={index !== 0}
                      keyboardType="numeric"
                    />
                    {item.qtyLabel && (
                      <Text className="text-gray-500 text-sm ml-2">= {item.qtyLabel}</Text>
                    )}
                  </View>
                  <TextInput
                    className="flex-1 bg-white border border-gray-200 rounded-lg px-3 py-2 ml-4"
                    placeholder="UPC"
                    placeholderTextColor="#9ca3af"
                    value={item.upc}
                    onChangeText={(text) => {
                      const newData = [...unitData];
                      newData[index].upc = text;
                      setUnitData(newData);
                    }}
                  />
                </View>
              ))}
            </View>
          </View>
        )}
      </View>

      {/* Define Pricing Section */}
      <View className="bg-white mx-4 mb-4 rounded-lg border border-gray-200">
        <Pressable 
          className="flex-row items-center justify-between p-4 border-b border-gray-100"
          onPress={() => setPricingExpanded(!pricingExpanded)}
        >
          <Text className="text-lg font-semibold text-gray-800">Define Pricing</Text>
          <Ionicons name={pricingExpanded ? "chevron-up" : "chevron-down"} size={20} color="#9CA3AF" />
        </Pressable>
        
        {pricingExpanded && (
          <View className="p-4">
            {/* Primary Tab */}
            <View className="mb-4">
              <Text className="text-red-500 font-medium pb-2 border-b-2 border-red-500 w-16">Primary</Text>
            </View>

            {/* Sold By & Bought By */}
            <View className="flex-row gap-4 mb-4">
              <View className="flex-1">
                <Text className="text-gray-700 text-sm mb-2">
                  This product is sold by<Text className="text-red-500">*</Text>
                </Text>
                <Pressable className="bg-white border border-gray-200 rounded-lg px-4 py-3 flex-row justify-between items-center">
                  <Text className="text-gray-800">{soldBy}</Text>
                  <Ionicons name="chevron-down" size={16} color="#9CA3AF" />
                </Pressable>
              </View>
              <View className="flex-1">
                <Text className="text-gray-700 text-sm mb-2">
                  This product is bought by<Text className="text-red-500">*</Text>
                </Text>
                <Pressable className="bg-white border border-gray-200 rounded-lg px-4 py-3 flex-row justify-between items-center">
                  <Text className="text-gray-800">{boughtBy}</Text>
                  <Ionicons name="chevron-down" size={16} color="#9CA3AF" />
                </Pressable>
              </View>
              <View className="flex-1 justify-end">
                <Pressable 
                  className="flex-row items-center justify-center px-4 py-3 rounded-lg"
                  style={{ backgroundColor: "#8B5CF6" }}
                >
                  <Ionicons name="calculator-outline" size={18} color="white" />
                  <Text className="text-white font-medium ml-2">Calculate Prices</Text>
                </Pressable>
              </View>
            </View>

            {/* Pricing Table */}
            <ScrollView horizontal showsHorizontalScrollIndicator={true}>
              <View>
                {/* Header */}
                <View className="flex-row py-3 border-b border-gray-200 bg-gray-50">
                  <Text className="w-16 text-gray-600 text-xs font-medium">Unit</Text>
                  <Text className="w-28 text-gray-600 text-xs font-medium">Packaging Quantity</Text>
                  <Text className="w-24 text-gray-600 text-xs font-medium">Base Cost Price* ($)</Text>
                  <Text className="w-24 text-gray-600 text-xs font-medium">Net Cost Price* ($)</Text>
                  <Text className="w-20 text-gray-600 text-xs font-medium">Sale Price* ($)</Text>
                  <Text className="w-20 text-gray-600 text-xs font-medium">Margin* ($)</Text>
                  <Text className="w-16 text-gray-600 text-xs font-medium">MSRP</Text>
                  <Text className="w-20 text-gray-600 text-xs font-medium">Lowest Selling Price</Text>
                  <Text className="w-20 text-gray-600 text-xs font-medium">Ecom Price</Text>
                  <Text className="w-20 text-gray-600 text-xs font-medium">Tier 1 SP ($)</Text>
                  <Text className="w-20 text-gray-600 text-xs font-medium">Tier 2 SP ($)</Text>
                  <Text className="w-20 text-gray-600 text-xs font-medium">Tier 3 SP ($)</Text>
                  <Text className="w-20 text-gray-600 text-xs font-medium">Tier 4 SP ($)</Text>
                  <Text className="w-20 text-gray-600 text-xs font-medium">Tier 5 SP ($)</Text>
                </View>
                
                {/* Rows */}
                {pricingData.map((item, index) => (
                  <View key={item.unit} className="flex-row items-center py-2 border-b border-gray-100">
                    <Text className="w-16 text-gray-700 text-sm">{item.unit}</Text>
                    <View className="w-28 flex-row items-center">
                      <TextInput
                        className="bg-gray-100 border border-gray-200 rounded px-2 py-1.5 w-12 text-sm"
                        placeholder={index === 0 ? "1" : "Qty"}
                        placeholderTextColor="#9ca3af"
                        value={item.qty}
                        editable={index !== 0}
                        keyboardType="numeric"
                      />
                      {item.qtyLabel && (
                        <Text className="text-gray-400 text-xs ml-1">= {item.qtyLabel}</Text>
                      )}
                    </View>
                    <TextInput className="w-24 bg-white border border-gray-200 rounded px-2 py-1.5 text-sm" placeholder="Base ..." placeholderTextColor="#d1d5db" />
                    <TextInput className="w-24 bg-white border border-gray-200 rounded px-2 py-1.5 text-sm ml-1" placeholder="Net c..." placeholderTextColor="#d1d5db" />
                    <TextInput className="w-20 bg-white border border-gray-200 rounded px-2 py-1.5 text-sm ml-1" placeholder="Price" placeholderTextColor="#d1d5db" />
                    <View className="w-20 flex-row items-center ml-1">
                      <TextInput className="flex-1 bg-white border border-gray-200 rounded-l px-2 py-1.5 text-sm" placeholder="Margin" placeholderTextColor="#d1d5db" />
                      <Pressable className="bg-gray-100 border border-l-0 border-gray-200 rounded-r px-1 py-1.5">
                        <Text className="text-gray-500 text-xs">$</Text>
                      </Pressable>
                    </View>
                    <TextInput className="w-16 bg-white border border-gray-200 rounded px-2 py-1.5 text-sm ml-1" placeholder="MSRP" placeholderTextColor="#d1d5db" />
                    <TextInput className="w-20 bg-white border border-gray-200 rounded px-2 py-1.5 text-sm ml-1" placeholder="Lowest..." placeholderTextColor="#d1d5db" />
                    <TextInput className="w-20 bg-white border border-gray-200 rounded px-2 py-1.5 text-sm ml-1" placeholder="Ecom ..." placeholderTextColor="#d1d5db" />
                    <TextInput className="w-20 bg-gray-50 border border-gray-200 rounded px-2 py-1.5 text-sm ml-1" placeholder="Tier 1" placeholderTextColor="#d1d5db" />
                    <TextInput className="w-20 bg-gray-50 border border-gray-200 rounded px-2 py-1.5 text-sm ml-1" placeholder="Tier 2" placeholderTextColor="#d1d5db" />
                    <TextInput className="w-20 bg-gray-50 border border-gray-200 rounded px-2 py-1.5 text-sm ml-1" placeholder="Tier 3" placeholderTextColor="#d1d5db" />
                    <TextInput className="w-20 bg-gray-50 border border-gray-200 rounded px-2 py-1.5 text-sm ml-1" placeholder="Tier 4" placeholderTextColor="#d1d5db" />
                    <TextInput className="w-20 bg-gray-50 border border-gray-200 rounded px-2 py-1.5 text-sm ml-1" placeholder="Tier 5" placeholderTextColor="#d1d5db" />
                  </View>
                ))}
              </View>
            </ScrollView>
          </View>
        )}
      </View>

      {/* Stock Information Section */}
      <View className="bg-white mx-4 mb-4 rounded-lg border border-gray-200">
        <Pressable 
          className="flex-row items-center justify-between p-4 border-b border-gray-100"
          onPress={() => setStockExpanded(!stockExpanded)}
        >
          <View className="flex-row items-center">
            <Text className="text-lg font-semibold text-gray-800">Stock Information</Text>
            <Ionicons name="information-circle-outline" size={18} color="#9CA3AF" style={{ marginLeft: 8 }} />
          </View>
          <Ionicons name={stockExpanded ? "chevron-up" : "chevron-down"} size={20} color="#9CA3AF" />
        </Pressable>
        
        {stockExpanded && (
          <View className="p-4">
            <ScrollView horizontal showsHorizontalScrollIndicator={true}>
              <View>
                {/* Header */}
                <View className="flex-row py-3 border-b border-gray-200 bg-gray-50">
                  <Text className="w-16 text-gray-600 text-xs font-medium">Sr no.</Text>
                  <Text className="w-40 text-gray-600 text-xs font-medium">Warehouses/Storefront</Text>
                  <Text className="w-24 text-gray-600 text-xs font-medium">Available Qty</Text>
                  <Text className="w-24 text-gray-600 text-xs font-medium">On hold Qty</Text>
                  <Text className="w-24 text-gray-600 text-xs font-medium">Damaged Qty</Text>
                  <Text className="w-24 text-gray-600 text-xs font-medium">Back Order Qty</Text>
                  <Text className="w-28 text-gray-600 text-xs font-medium">Coming Soon Qty</Text>
                </View>
                
                {/* Rows */}
                {stockData.map((item, index) => (
                  <View key={index} className="flex-row items-center py-3 border-b border-gray-100">
                    <Text className="w-16 text-gray-700 text-sm">{item.srNo}</Text>
                    <View className="w-40">
                      <TextInput
                        className="bg-gray-100 border border-gray-200 rounded px-3 py-2 text-sm"
                        value={item.warehouse}
                        editable={false}
                      />
                    </View>
                    <TextInput
                      className="w-24 bg-white border border-gray-200 rounded px-3 py-2 text-sm ml-1"
                      placeholder="0"
                      placeholderTextColor="#9ca3af"
                      value={item.availableQty}
                      keyboardType="numeric"
                      onChangeText={(text) => {
                        const newData = [...stockData];
                        newData[index].availableQty = text;
                        setStockData(newData);
                      }}
                    />
                    <TextInput
                      className="w-24 bg-gray-100 border border-gray-200 rounded px-3 py-2 text-sm ml-1"
                      placeholder="0"
                      placeholderTextColor="#9ca3af"
                      value={item.onHoldQty}
                      editable={false}
                    />
                    <TextInput
                      className="w-24 bg-white border border-gray-200 rounded px-3 py-2 text-sm ml-1"
                      placeholder="0"
                      placeholderTextColor="#9ca3af"
                      value={item.damagedQty}
                      keyboardType="numeric"
                      onChangeText={(text) => {
                        const newData = [...stockData];
                        newData[index].damagedQty = text;
                        setStockData(newData);
                      }}
                    />
                    <TextInput
                      className="w-24 bg-gray-100 border border-gray-200 rounded px-3 py-2 text-sm ml-1"
                      placeholder="Back Order"
                      placeholderTextColor="#d1d5db"
                      editable={false}
                    />
                    <TextInput
                      className="w-28 bg-gray-100 border border-gray-200 rounded px-3 py-2 text-sm ml-1"
                      placeholder="Coming Soon"
                      placeholderTextColor="#d1d5db"
                      editable={false}
                    />
                  </View>
                ))}
              </View>
            </ScrollView>
          </View>
        )}
      </View>

      {/* Bottom spacing */}
      <View className="h-10" />
    </ScrollView>
  );

  // Render SEO Tab Content
  const renderSeoTab = () => (
    <ScrollView className="flex-1 bg-gray-50 p-6" showsVerticalScrollIndicator={false}>
      <View className="bg-white rounded-lg border border-gray-200 p-6">
        {/* Slug */}
        <View className="mb-6">
          <View className="flex-row items-center mb-2">
            <Text className="text-gray-700 text-sm font-medium">Slug</Text>
            <Ionicons name="information-circle-outline" size={16} color="#9CA3AF" style={{ marginLeft: 4 }} />
          </View>
          <TextInput
            className="bg-white border border-gray-200 rounded-lg px-4 py-3"
            placeholder="Enter Product Slug"
            placeholderTextColor="#d1d5db"
            value={seoSlug}
            onChangeText={setSeoSlug}
          />
          <Text className="text-gray-400 text-xs mt-1 text-right">{seoSlug.length} character(s)</Text>
        </View>

        {/* Meta Title */}
        <View className="mb-6">
          <Text className="text-gray-700 text-sm font-medium mb-2">Meta Title</Text>
          <TextInput
            className="bg-white border border-gray-200 rounded-lg px-4 py-3"
            placeholder="Enter Meta Title for Product"
            placeholderTextColor="#d1d5db"
            value={metaTitle}
            onChangeText={setMetaTitle}
            multiline
            numberOfLines={3}
            style={{ minHeight: 80, textAlignVertical: 'top' }}
          />
          <Text className="text-gray-400 text-xs mt-1 text-right">{metaTitle.length} character(s)</Text>
        </View>

        {/* Meta Description */}
        <View className="mb-2">
          <Text className="text-gray-700 text-sm font-medium mb-2">Meta Description</Text>
          <TextInput
            className="bg-white border border-gray-200 rounded-lg px-4 py-3"
            placeholder="Enter Meta Description for Product"
            placeholderTextColor="#d1d5db"
            value={metaDescription}
            onChangeText={setMetaDescription}
            multiline
            numberOfLines={3}
            style={{ minHeight: 80, textAlignVertical: 'top' }}
          />
          <Text className="text-gray-400 text-xs mt-1 text-right">{metaDescription.length} character(s)</Text>
        </View>
      </View>
    </ScrollView>
  );

  // Render placeholder for other tabs
  const renderPlaceholderTab = (tabName: string) => (
    <View className="flex-1 items-center justify-center">
      <Ionicons name="construct-outline" size={48} color="#D1D5DB" />
      <Text className="text-gray-400 mt-4 text-lg">{tabName} - Coming Soon</Text>
    </View>
  );

  return (
    <View className="flex-1 bg-gray-50">
      <PageHeader title="Add Product" />

      {/* Tab Navigation */}
      <View className="bg-white border-b border-gray-200">
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 16 }}
        >
          {TABS.map((tab) => (
            <Pressable
              key={tab.key}
              onPress={() => setActiveTab(tab.key)}
              className="px-5 py-4"
            >
              <Text
                className={`text-sm font-medium ${
                  activeTab === tab.key ? "text-red-500" : "text-gray-500"
                }`}
              >
                {tab.label}
              </Text>
              {activeTab === tab.key && (
                <View 
                  className="absolute bottom-0 left-0 right-0 h-0.5"
                  style={{ backgroundColor: "#EC1A52" }}
                />
              )}
            </Pressable>
          ))}
        </ScrollView>
      </View>

      {/* Tab Content */}
      <View className="flex-1">
        {activeTab === "basic" && renderBasicTab()}
        {activeTab === "pricing" && renderPricingTab()}
        {activeTab === "seo" && renderSeoTab()}
        {activeTab === "variants" && renderPlaceholderTab("Variants")}
        {activeTab === "tax" && renderPlaceholderTab("Tax Section")}
        {activeTab === "promotions" && renderPlaceholderTab("Promotions")}
      </View>

      {/* Add Category Modal */}
      <Modal
        visible={showAddCategoryModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowAddCategoryModal(false)}
      >
        <View className="flex-1 bg-black/50 justify-center items-center">
          <View className="bg-white rounded-xl w-[600px] max-w-[90%]">
            {/* Header */}
            <View className="flex-row items-center justify-between p-6 border-b border-gray-200">
              <Text className="text-xl font-semibold text-gray-800">Add Category</Text>
              <Pressable onPress={() => setShowAddCategoryModal(false)}>
                <Ionicons name="close" size={24} color="#9CA3AF" />
              </Pressable>
            </View>

            {/* Content */}
            <View className="p-6">
              {/* Row 1: Category Name, MSA Code, Is MSA, Is Feature */}
              <View className="flex-row gap-4 mb-4">
                <View className="flex-1">
                  <Text className="text-gray-700 text-sm font-medium mb-2">
                    Category Name<Text className="text-red-500">*</Text>
                  </Text>
                  <TextInput
                    className="bg-white border border-gray-200 rounded-lg px-4 py-3"
                    placeholder="Enter Category Name"
                    placeholderTextColor="#9ca3af"
                    value={categoryName}
                    onChangeText={setCategoryName}
                  />
                </View>
                <View className="flex-1">
                  <Text className="text-gray-700 text-sm font-medium mb-2">MSA Code</Text>
                  <Pressable className="bg-white border border-gray-200 rounded-lg px-4 py-3 flex-row justify-between items-center">
                    <Text className="text-gray-400">Please select Msa Code</Text>
                    <Ionicons name="chevron-down" size={16} color="#9CA3AF" />
                  </Pressable>
                </View>
                <View className="items-center">
                  <Text className="text-gray-700 text-sm font-medium mb-2">Is MSA</Text>
                  <Switch
                    value={categoryIsMsa}
                    onValueChange={setCategoryIsMsa}
                    trackColor={{ false: "#D1D5DB", true: "#EC1A52" }}
                    thumbColor="white"
                  />
                </View>
                <View className="items-center">
                  <Text className="text-gray-700 text-sm font-medium mb-2">Is Feature</Text>
                  <Switch
                    value={categoryIsFeature}
                    onValueChange={setCategoryIsFeature}
                    trackColor={{ false: "#D1D5DB", true: "#EC1A52" }}
                    thumbColor="white"
                  />
                </View>
              </View>

              {/* Row 2: Parent Category */}
              <View className="mb-6">
                <Text className="text-gray-700 text-sm font-medium mb-2">Parent Category</Text>
                <Pressable className="bg-white border border-gray-200 rounded-lg px-4 py-3 flex-row justify-between items-center w-64">
                  <Text className="text-gray-400">Please Select</Text>
                  <Ionicons name="chevron-down" size={16} color="#9CA3AF" />
                </Pressable>
              </View>

              {/* Image Upload Area */}
              <Pressable className="bg-gray-50 rounded-lg py-10 items-center mb-6">
                <Text className="text-gray-600 text-base font-medium">Click to upload.</Text>
                <Text className="text-gray-400 text-sm mt-1">Please Upload Image</Text>
              </Pressable>
            </View>

            {/* Footer */}
            <View className="flex-row justify-end gap-3 p-6 border-t border-gray-200">
              <Pressable
                className="px-6 py-3 rounded-lg"
                style={{ backgroundColor: "#3B82F6" }}
                onPress={() => setShowAddCategoryModal(false)}
              >
                <Text className="text-white font-medium">Close</Text>
              </Pressable>
              <Pressable
                className="px-6 py-3 rounded-lg"
                style={{ backgroundColor: "#8B5CF6" }}
                onPress={() => {
                  if (!categoryName.trim()) {
                    Alert.alert("Error", "Category name is required");
                    return;
                  }
                  Alert.alert("Success", "Category added successfully");
                  setCategoryName("");
                  setCategoryIsMsa(false);
                  setCategoryIsFeature(false);
                  setShowAddCategoryModal(false);
                }}
              >
                <Text className="text-white font-medium">Save</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
