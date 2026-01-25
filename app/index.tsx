import { FontAwesome5, Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect } from "react";
import { Alert, Platform, ScrollView, Text, TouchableOpacity, useWindowDimensions, View } from "react-native";
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
    <View className="flex-1">
      <ScrollView
        className="flex-1"
        contentContainerClassName="p-4"
        showsVerticalScrollIndicator={false}
      >
        {/* Header Section */}
        <Header
          title={`Welcome, ${user?.name || "User"}`}
          subtitle="Access sales, reporting, and system actions quickly and securely."
          badge={user?.role?.toUpperCase() || "USER"}
        />

        {/* Instructions when not clocked in */}
        {!isClockedIn && !selectedPosLine && (
          <View className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-4">
            <Text className="text-blue-700 text-sm">
              👆 Select a POS Line below, then press "Clock In" to start your shift.
            </Text>
          </View>
        )}

        {/* Selected POS Line indicator */}
        {!isClockedIn && selectedPosLine && (
          <View className="bg-green-50 border border-green-200 rounded-lg p-3 mt-4">
            <Text className="text-green-700 text-sm">
              ✓ POS Line {selectedPosLine} selected. Press "Clock In" and enter your ID.
            </Text>
          </View>
        )}

        {/* Clocked in - tap to open */}
        {isClockedIn && (
          <View className="bg-purple-50 border border-purple-200 rounded-lg p-3 mt-4">
            <Text className="text-purple-700 text-sm">
              ✓ You are clocked in on POS Line {selectedPosLine}. Tap it to open the sales screen.
            </Text>
          </View>
        )}

        {/* POS Lines Section */}
        <View className="mt-4">
          <Text className="text-gray-700 font-semibold text-lg mb-3">
            POS Lines
          </Text>
          <View className="flex-row flex-wrap gap-3">
            {[1, 2, 3, 4].map((num) => (
              <View
                key={num}
                style={{
                  width: isLandscape
                    ? (contentWidth - 44) / 4
                    : (contentWidth - 36) / 2,
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

        {/* Dashboard Stats - Only visible for admin */}
        {showAdminStats && (
          <View className="mt-6 gap-4">
            <Text className="text-gray-700 font-semibold text-lg">
              Dashboard Overview (All POS Lines)
            </Text>
            {/* First row: 3 stat cards */}
            <View className="flex-row gap-3 mb-3">
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
            <View className="flex-row gap-3">
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

      {/* TEST BUTTON - Floating for easy testing */}
      <TouchableOpacity
        onPress={handleTestPrint}
        style={{
          position: "absolute",
          bottom: 30,
          right: 20,
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
          zIndex: 999,
        }}
      >
        <Ionicons name="print" size={24} color="white" />
        <Text style={{ color: "white", fontWeight: "bold", fontSize: 16 }}>
          TEST PRINT
        </Text>
      </TouchableOpacity>
    </View>
  );
}
