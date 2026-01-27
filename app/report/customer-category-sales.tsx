import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  FlatList,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";

interface CustomerCategorySale {
  id: string;
  invoiceDate: string;
  saleOrderNumber: string;
  dateShipped: string;
  customerName: string;
  address: string;
  city: string;
  county: string;
  tea: number;
  milk: number;
  scale: number;
  alaska: number;
  butane: number;
  etc: number;
}

const SAMPLE_DATA: CustomerCategorySale[] = [
  { id: "1", invoiceDate: "01/26/2026", saleOrderNumber: "SO-260126-05915", dateShipped: "01/26/2026", customerName: "ALASKA TAX CUSTOMER", address: "123 Main St", city: "Anchorage", county: "Anchorage", tea: 125.50, milk: 45.00, scale: 0, alaska: 89.99, butane: 0, etc: 34.50 },
  { id: "2", invoiceDate: "01/26/2026", saleOrderNumber: "SO-260126-05914", dateShipped: "01/26/2026", customerName: "Quick Mart LLC", address: "456 Oak Ave", city: "Nashville", county: "Davidson", tea: 0, milk: 78.25, scale: 150.00, alaska: 0, butane: 45.00, etc: 22.00 },
  { id: "3", invoiceDate: "01/25/2026", saleOrderNumber: "SO-260125-05910", dateShipped: "01/25/2026", customerName: "Spirit Wholesale", address: "789 Pine Rd", city: "Memphis", county: "Shelby", tea: 234.00, milk: 0, scale: 0, alaska: 0, butane: 89.50, etc: 156.75 },
  { id: "4", invoiceDate: "01/25/2026", saleOrderNumber: "SO-260125-05908", dateShipped: "01/25/2026", customerName: "Geneshay Namh Inc", address: "321 Elm Blvd", city: "Knoxville", county: "Knox", tea: 67.00, milk: 125.50, scale: 78.00, alaska: 45.00, butane: 0, etc: 89.00 },
  { id: "5", invoiceDate: "01/24/2026", saleOrderNumber: "SO-260124-05900", dateShipped: "01/24/2026", customerName: "Sams Grocery Store", address: "654 Maple Dr", city: "Chattanooga", county: "Hamilton", tea: 0, milk: 0, scale: 245.00, alaska: 0, butane: 167.50, etc: 45.25 },
  { id: "6", invoiceDate: "01/24/2026", saleOrderNumber: "SO-260124-05898", dateShipped: "01/24/2026", customerName: "ABC Retail Store", address: "987 Cedar Ln", city: "Nashville", county: "Davidson", tea: 189.00, milk: 56.75, scale: 0, alaska: 234.00, butane: 0, etc: 78.50 },
  { id: "7", invoiceDate: "01/23/2026", saleOrderNumber: "SO-260123-05890", dateShipped: "01/23/2026", customerName: "Downtown Convenience", address: "147 Oak St", city: "Franklin", county: "Williamson", tea: 45.00, milk: 89.00, scale: 123.00, alaska: 0, butane: 56.00, etc: 0 },
  { id: "8", invoiceDate: "01/23/2026", saleOrderNumber: "SO-260123-05885", dateShipped: "01/23/2026", customerName: "Highway Stop Shop", address: "258 Highway 65", city: "Murfreesboro", county: "Rutherford", tea: 0, milk: 167.00, scale: 0, alaska: 89.00, butane: 234.00, etc: 45.00 },
  { id: "9", invoiceDate: "01/22/2026", saleOrderNumber: "SO-260122-05880", dateShipped: "01/22/2026", customerName: "Corner Market", address: "369 Center Ave", city: "Clarksville", county: "Montgomery", tea: 278.50, milk: 0, scale: 56.00, alaska: 0, butane: 0, etc: 123.75 },
  { id: "10", invoiceDate: "01/22/2026", saleOrderNumber: "SO-260122-05875", dateShipped: "01/22/2026", customerName: "Valley Foods", address: "741 Valley Rd", city: "Jackson", county: "Madison", tea: 0, milk: 234.50, scale: 178.00, alaska: 156.00, butane: 89.00, etc: 0 },
];

export default function CustomerCategorySalesReportScreen() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [reports] = useState<CustomerCategorySale[]>(SAMPLE_DATA);
  const [startDate] = useState("2026-01-20");
  const [endDate] = useState("2026-01-26");

  const filteredReports = reports.filter(
    (r) => 
      r.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.saleOrderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.city.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Calculate totals
  const totalTea = filteredReports.reduce((sum, r) => sum + r.tea, 0);
  const totalMilk = filteredReports.reduce((sum, r) => sum + r.milk, 0);
  const totalScale = filteredReports.reduce((sum, r) => sum + r.scale, 0);
  const totalAlaska = filteredReports.reduce((sum, r) => sum + r.alaska, 0);
  const totalButane = filteredReports.reduce((sum, r) => sum + r.butane, 0);
  const totalEtc = filteredReports.reduce((sum, r) => sum + r.etc, 0);

  const formatCurrency = (value: number) => {
    if (value === 0) return "-";
    return "$" + value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const renderReport = ({ item }: { item: CustomerCategorySale }) => (
    <View className="flex-row items-center py-3 px-4 border-b border-gray-100 bg-white">
      <Text className="w-24 text-gray-600 text-sm">{item.invoiceDate}</Text>
      <Text className="w-36 text-blue-600 text-sm font-medium">{item.saleOrderNumber}</Text>
      <Text className="w-24 text-gray-600 text-sm">{item.dateShipped}</Text>
      <Text className="w-44 text-gray-800 text-sm font-medium" numberOfLines={1}>{item.customerName}</Text>
      <Text className="w-32 text-gray-600 text-sm" numberOfLines={1}>{item.address}</Text>
      <Text className="w-28 text-gray-600 text-sm">{item.city}</Text>
      <Text className="w-28 text-gray-600 text-sm">{item.county}</Text>
      <Text className="w-20 text-gray-800 text-sm text-right">{formatCurrency(item.tea)}</Text>
      <Text className="w-20 text-gray-800 text-sm text-right">{formatCurrency(item.milk)}</Text>
      <Text className="w-20 text-gray-800 text-sm text-right">{formatCurrency(item.scale)}</Text>
      <Text className="w-20 text-gray-800 text-sm text-right">{formatCurrency(item.alaska)}</Text>
      <Text className="w-20 text-gray-800 text-sm text-right">{formatCurrency(item.butane)}</Text>
      <Text className="w-20 text-gray-800 text-sm text-right">{formatCurrency(item.etc)}</Text>
    </View>
  );

  return (
    <View className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-white px-4 py-4 border-b border-gray-200 flex-row items-center justify-between">
        <Text className="text-2xl font-bold text-gray-800">Customer Category Sales Report</Text>
        <View className="flex-row gap-3">
          <Pressable className="bg-emerald-500 px-5 py-2.5 rounded-lg flex-row items-center gap-2">
            <Text className="text-white font-medium">Export</Text>
            <Ionicons name="cloud-download" size={18} color="white" />
          </Pressable>
          <Pressable 
            onPress={() => router.back()}
            className="border border-red-400 px-5 py-2.5 rounded-lg"
          >
            <Text className="text-red-500 font-medium">Back</Text>
          </Pressable>
        </View>
      </View>

      {/* Search & Filters */}
      <View className="bg-white px-4 py-4 border-b border-gray-200">
        <View className="flex-row items-end gap-4 mb-4">
          <View className="flex-1 max-w-md">
            <Text className="text-gray-600 text-sm mb-1.5">Search by Customer, Order No, City</Text>
            <TextInput
              className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-3"
              placeholder="Search"
              placeholderTextColor="#9ca3af"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
          <Pressable className="bg-white border border-gray-300 px-4 py-3 rounded-lg flex-row items-center gap-2">
            <Ionicons name="filter" size={16} color="#374151" />
            <Text className="text-gray-700 font-medium">Advance Filters</Text>
          </Pressable>
          <View className="flex-1" />
          <Pressable className="bg-white border border-gray-300 px-4 py-3 rounded-lg flex-row items-center gap-2">
            <Ionicons name="lock-closed" size={16} color="#374151" />
            <Text className="text-gray-700 font-medium">Freeze Columns</Text>
          </Pressable>
          <Pressable className="bg-white border border-gray-300 px-4 py-3 rounded-lg flex-row items-center gap-2">
            <Ionicons name="grid" size={16} color="#374151" />
            <Text className="text-gray-700">Columns</Text>
          </Pressable>
        </View>

        {/* Applied Filters */}
        <View className="flex-row items-center">
          <Text className="text-gray-600 text-sm">Applied Filters: </Text>
          <Text className="text-red-500 font-medium text-sm">Start Date </Text>
          <Text className="text-gray-600 text-sm">{startDate} to {endDate}</Text>
        </View>
      </View>

      {/* Table */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={{ minWidth: 1400 }}>
          {/* Table Header */}
          <View className="flex-row bg-gray-50 py-3 px-4 border-b border-gray-200">
            <Text className="w-24 text-gray-700 text-sm font-semibold">Invoice Date</Text>
            <Text className="w-36 text-gray-700 text-sm font-semibold">Sale Order No</Text>
            <Text className="w-24 text-gray-700 text-sm font-semibold">Date Shipped</Text>
            <Text className="w-44 text-gray-700 text-sm font-semibold">Customer Name</Text>
            <Text className="w-32 text-gray-700 text-sm font-semibold">Address</Text>
            <Text className="w-28 text-gray-700 text-sm font-semibold">City</Text>
            <Text className="w-28 text-gray-700 text-sm font-semibold">County</Text>
            <Text className="w-20 text-gray-700 text-sm font-semibold text-right">TEA</Text>
            <Text className="w-20 text-gray-700 text-sm font-semibold text-right">Milk</Text>
            <Text className="w-20 text-gray-700 text-sm font-semibold text-right">Scale</Text>
            <Text className="w-20 text-gray-700 text-sm font-semibold text-right">Alaska</Text>
            <Text className="w-20 text-gray-700 text-sm font-semibold text-right">Butane</Text>
            <Text className="w-20 text-gray-700 text-sm font-semibold text-right">ETC</Text>
          </View>

          {/* List */}
          <FlatList
            data={filteredReports}
            keyExtractor={(item) => item.id}
            renderItem={renderReport}
            showsVerticalScrollIndicator={false}
            ListFooterComponent={() => (
              <View className="flex-row items-center py-3 px-4 bg-gray-100 border-t-2 border-gray-300">
                <Text className="w-24 text-gray-800 font-bold">TOTAL</Text>
                <Text className="w-36 text-gray-800 font-bold"></Text>
                <Text className="w-24 text-gray-800 font-bold"></Text>
                <Text className="w-44 text-gray-800 font-bold"></Text>
                <Text className="w-32 text-gray-800 font-bold"></Text>
                <Text className="w-28 text-gray-800 font-bold"></Text>
                <Text className="w-28 text-gray-800 font-bold"></Text>
                <Text className="w-20 text-green-600 text-sm font-bold text-right">{formatCurrency(totalTea)}</Text>
                <Text className="w-20 text-green-600 text-sm font-bold text-right">{formatCurrency(totalMilk)}</Text>
                <Text className="w-20 text-green-600 text-sm font-bold text-right">{formatCurrency(totalScale)}</Text>
                <Text className="w-20 text-green-600 text-sm font-bold text-right">{formatCurrency(totalAlaska)}</Text>
                <Text className="w-20 text-green-600 text-sm font-bold text-right">{formatCurrency(totalButane)}</Text>
                <Text className="w-20 text-green-600 text-sm font-bold text-right">{formatCurrency(totalEtc)}</Text>
              </View>
            )}
          />
        </View>
      </ScrollView>
    </View>
  );
}
