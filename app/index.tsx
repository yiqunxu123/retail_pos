import { FontAwesome5, Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect } from "react";
import { Alert, ScrollView, Text, TouchableOpacity, useWindowDimensions, View } from "react-native";
import {
  Header,
  POSLineCard,
  SIDEBAR_WIDTH,
  StatCard,
} from "../components";
import { useAuth } from "../contexts/AuthContext";
import { useClock } from "../contexts/ClockContext";
import { addPrintJob, isPrinterAvailable, printQueue, setPrinterConfig } from "../utils/PrintQueue";

// Printer configuration for test
const PRINTER_IP = "192.168.1.100";
const PRINTER_PORT = 9100;

export default function Dashboard() {
  const { width, height } = useWindowDimensions();
  const router = useRouter();
  const { user, isAdmin } = useAuth();
  const { isClockedIn, selectedPosLine, selectPosLine, clockIn } = useClock();
  
  // Check if user is admin
  const showAdminStats = isAdmin();

  // Test receipt content
  const buildTestReceipt = (): string => {
    return `
<CB>ITITANS STORE</CB>
<C>123 Main Street</C>
<C>City, State 12345</C>
<C>================================</C>

TEST PRINT RECEIPT
Date: ${new Date().toLocaleString()}

Coffee Latte          x2    $8.00
Sandwich              x1   $12.50
Cookies               x3    $6.00

<C>--------------------------------</C>
<CB>TOTAL: $26.50</CB>
<C>--------------------------------</C>

<C>Thank you for shopping!</C>
<C>Please come again</C>

`;
  };

  // Initialize printer config and listen to queue (only alert on failure)
  useEffect(() => {
    setPrinterConfig({ ip: PRINTER_IP, port: PRINTER_PORT });
    
    const unsubscribe = printQueue.addListener((status, job) => {
      if (status === 'failed') {
        Alert.alert("Print Error", "Failed to print receipt.");
      }
    });

    return () => unsubscribe();
  }, []);

  // Test print function - directly print via Ethernet
  const handleTestPrint = () => {
    // First, clock in programmatically if not already
    if (!isClockedIn) {
      clockIn("TEST-001", 1);
      Alert.alert("Clock In", "Clocked in as TEST-001 on POS Line 1");
    }

    // Check if Ethernet printer is available
    if (!isPrinterAvailable('ethernet')) {
      Alert.alert(
        "Printer Not Available",
        "Thermal printer requires a development build.\n\nReceipt Preview:\n" + buildTestReceipt().substring(0, 200) + "...",
        [{ text: "OK" }]
      );
      return;
    }

    try {
      const receipt = buildTestReceipt();
      addPrintJob('ethernet', receipt);
      // No alert on success - only alert on error
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      Alert.alert("Print Error", msg);
    }
  };


  // Determine layout orientation
  const isLandscape = width > height;

  // Calculate available content width (excluding sidebar in landscape)
  const contentWidth = isLandscape ? width - SIDEBAR_WIDTH : width;

  // Handle POS Line selection
  const handlePosLinePress = (lineNumber: number) => {
    if (isClockedIn) {
      // Already clocked in - navigate to POS line screen
      if (selectedPosLine === lineNumber) {
        router.push("/pos-line");
      } else {
        Alert.alert(
          "Different POS Line",
          "You are assigned to POS Line " + selectedPosLine + ". Clock out first to switch."
        );
      }
      return;
    }

    // Toggle selection
    if (selectedPosLine === lineNumber) {
      selectPosLine(null);
    } else {
      selectPosLine(lineNumber);
    }
  };

  return (
    <View className="flex-1 bg-gray-50">
      <ScrollView
        className="flex-1"
        contentContainerClassName="p-4"
        showsVerticalScrollIndicator={false}
      >
        {/* ===== HEADER GROUP: Welcome + Status Alert ===== */}
        <View className="bg-white rounded-xl p-4 border border-gray-100">
          <Header
            title={`Welcome, ${user?.name || "User"}`}
            subtitle="Access sales, reporting, and system actions quickly and securely."
            badge={user?.role?.toUpperCase() || "USER"}
          />

          {/* Status Alert - grouped with header */}
          {!isClockedIn && !selectedPosLine && (
            <View className="bg-blue-50/70 border border-blue-100 rounded-lg p-3 mt-3">
              <Text className="text-blue-600 text-sm">
                👆 Select a POS Line below, then press "Clock In" to start your shift.
              </Text>
            </View>
          )}

          {!isClockedIn && selectedPosLine && (
            <View className="bg-emerald-50/70 border border-emerald-100 rounded-lg p-3 mt-3">
              <Text className="text-emerald-600 text-sm">
                ✓ POS Line {selectedPosLine} selected. Press "Clock In" and enter your ID.
              </Text>
            </View>
          )}

          {isClockedIn && (
            <View className="bg-violet-50/70 border border-violet-100 rounded-lg p-3 mt-3">
              <Text className="text-violet-600 text-sm">
                ✓ You are clocked in on POS Line {selectedPosLine}. Tap it to open the sales screen.
              </Text>
            </View>
          )}
        </View>

        {/* ===== POS LINES SECTION ===== */}
        <View className="mt-4 bg-white rounded-xl p-4 border border-gray-100">
          <Text className="text-gray-700 font-semibold text-lg mb-3">
            POS Lines
          </Text>
          <View className="flex-row flex-wrap gap-3">
            {[1, 2, 3, 4].map((num) => (
              <View
                key={num}
                style={{
                  width: isLandscape
                    ? (contentWidth - 56) / 4
                    : (contentWidth - 48) / 2,
                }}
              >
                <POSLineCard
                  lineNumber={num}
                  isActive={isClockedIn && selectedPosLine === num}
                  isSelected={!isClockedIn && selectedPosLine === num}
                  itemCount={isClockedIn && selectedPosLine === num ? 3 : 0}
                  total={isClockedIn && selectedPosLine === num ? "$45.50" : "$0.00"}
                  onPress={() => handlePosLinePress(num)}
                />
              </View>
            ))}
          </View>
        </View>

        {/* ===== NAVIGATION GROUP ===== */}
        <View className="mt-4 bg-white rounded-xl p-4 border border-gray-100">
          <Text className="text-gray-700 font-semibold text-lg mb-3">
            Quick Actions
          </Text>
          <View className="flex-row flex-wrap gap-2">
            <TouchableOpacity
              onPress={() => router.push("/catalog/products")}
              className="flex-1 min-w-[140px] bg-blue-400 rounded-lg p-3 flex-row items-center justify-center gap-2"
            >
              <Ionicons name="cube-outline" size={20} color="white" />
              <Text className="text-white font-medium text-sm">Product Catalog</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => router.push("/inventory/stocks")}
              className="flex-1 min-w-[140px] bg-emerald-400 rounded-lg p-3 flex-row items-center justify-center gap-2"
            >
              <Ionicons name="layers-outline" size={20} color="white" />
              <Text className="text-white font-medium text-sm">Inventory</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => router.push("/sale/customers")}
              className="flex-1 min-w-[140px] bg-violet-400 rounded-lg p-3 flex-row items-center justify-center gap-2"
            >
              <Ionicons name="cart-outline" size={20} color="white" />
              <Text className="text-white font-medium text-sm">Sales</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => router.push("/report")}
              className="flex-1 min-w-[140px] bg-amber-400 rounded-lg p-3 flex-row items-center justify-center gap-2"
            >
              <Ionicons name="bar-chart-outline" size={20} color="white" />
              <Text className="text-white font-medium text-sm">Report</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ===== DASHBOARD OVERVIEW GROUP ===== */}
        {showAdminStats && (
          <View className="mt-4 bg-white rounded-xl p-4 border border-gray-100">
            <Text className="text-gray-700 font-semibold text-lg mb-3">
              Dashboard Overview
            </Text>
            {/* First row: 3 stat cards */}
            <View className="flex-row gap-2 mb-2">
              <StatCard
                title="Total Sale/Revenue"
                value="$233.92K"
                subtitle="$100.92K • 70.5%"
                icon={<Ionicons name="pricetag" size={20} color="white" />}
                variant="green"
              />
              <StatCard
                title="Paid Amount"
                value="$8.25"
                subtitle="$4,000.00 • 70.5%"
                icon={<FontAwesome5 name="coins" size={18} color="white" />}
                variant="yellow"
              />
              <StatCard
                title="Payable Amount"
                value="$0.00"
                icon={<Ionicons name="cart" size={20} color="white" />}
                variant="purple"
              />
            </View>

            {/* Second row: 3 stat cards */}
            <View className="flex-row gap-2">
              <StatCard
                title="Receivable Amount"
                value="$203.50K"
                icon={<MaterialCommunityIcons name="cash-multiple" size={20} color="white" />}
                variant="red"
              />
              <StatCard
                title="Total Extended Stock"
                value="$12,7,831.82"
                icon={<MaterialCommunityIcons name="package-variant" size={20} color="white" />}
                variant="yellow"
              />
              <StatCard
                title="Delivery Orders"
                value="0"
                icon={<MaterialCommunityIcons name="clipboard-list-outline" size={20} color="white" />}
                variant="orange"
              />
            </View>
          </View>
        )}
      </ScrollView>

      {/* Test Buttons - Floating for easy testing */}
      <View
        style={{
          position: "absolute",
          bottom: 30,
          right: 20,
          gap: 12,
          zIndex: 999,
        }}
      >
        {/* Sync Test Button */}
        <TouchableOpacity
          onPress={() => router.push("/test-sync")}
          style={{
            backgroundColor: "#3B82F6",
            paddingVertical: 16,
            paddingHorizontal: 24,
            borderRadius: 12,
            flexDirection: "row",
            alignItems: "center",
            gap: 8,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 4,
            elevation: 8,
          }}
        >
          <Ionicons name="sync" size={24} color="white" />
          <Text style={{ color: "white", fontWeight: "bold", fontSize: 16 }}>
            TEST SYNC
          </Text>
        </TouchableOpacity>

        {/* Print Test Button */}
        <TouchableOpacity
          onPress={handleTestPrint}
          style={{
            backgroundColor: "#ef4444",
            paddingVertical: 16,
            paddingHorizontal: 24,
            borderRadius: 12,
            flexDirection: "row",
            alignItems: "center",
            gap: 8,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 4,
            elevation: 8,
          }}
        >
          <Ionicons name="print" size={24} color="white" />
          <Text style={{ color: "white", fontWeight: "bold", fontSize: 16 }}>
            TEST PRINT
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
