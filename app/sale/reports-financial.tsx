import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Pressable, ScrollView, Text, View } from "react-native";

const FINANCIAL_REPORTS = [
  { id: "customer-account-receivable", title: "Customer Account Receivable Report", route: "/sale/reports/customer-account-receivable" },
  { id: "customer-payment-logs", title: "Customer Payment Logs Report", route: "/sale/reports/customer-payment-logs" },
  { id: "customer-invoice-aging", title: "Customer Invoice Aging Report", route: "/sale/reports/customer-invoice-aging" },
  { id: "daily-summary", title: "Daily Summary Report", route: "/sale/reports/daily-summary" },
  { id: "invoice-history-by-customer", title: "Invoice History By Customer", route: "/sale/reports/invoice-history-by-customer" },
  { id: "payment-received", title: "Payment Received Report", route: "/sale/reports/payment-received" },
  { id: "profit-margin-accrual", title: "Profit Margin Report (Accrual Basis)", route: "/sale/reports/profit-margin-accrual" },
  { id: "profit-margin-cash", title: "Profit Margin Report (Cash Basis)", route: "/sale/reports/profit-margin-cash" },
  { id: "supplier-account-payable", title: "Supplier Account Payable Report", route: "/sale/reports/supplier-account-payable" },
  { id: "sale-agent-commission", title: "Sale Agent Commission Report", route: "/sale/reports/sale-agent-commission" },
  { id: "supplier-payment-logs", title: "Supplier Payment Logs Report", route: "/sale/reports/supplier-payment-logs" },
];

interface ReportItemProps {
  title: string;
  onPress: () => void;
}

interface ReportConfig {
  id: string;
  title: string;
  route: string;
}

function ReportItem({ title, onPress }: ReportItemProps) {
  return (
    <Pressable
      onPress={onPress}
      className="flex-row items-center justify-between px-4 py-4 rounded-lg border-2 mb-3"
      style={{ borderColor: "#EC1A52" }}
    >
      <Text className="text-gray-800 font-medium">{title}</Text>
      <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
    </Pressable>
  );
}

export default function FinancialReportsScreen() {
  const handleReportPress = (route: string) => {
    router.push(route as any);
  };

  const leftColumn = FINANCIAL_REPORTS.filter((_, i) => i % 2 === 0);
  const rightColumn = FINANCIAL_REPORTS.filter((_, i) => i % 2 === 1);

  return (
    <View className="flex-1 bg-white">
      <View className="px-6 py-4 flex-row items-center">
        <Pressable onPress={() => router.back()} className="mr-4">
          <Ionicons name="arrow-back" size={24} color="#1A1A1A" />
        </Pressable>
        <Text className="text-2xl font-bold text-gray-900">Financial Reports</Text>
      </View>

      <ScrollView className="flex-1 px-6">
        <View className="flex-row gap-4">
          <View className="flex-1">
            {leftColumn.map((report: ReportConfig) => (
              <ReportItem
                key={report.id}
                title={report.title}
                onPress={() => handleReportPress(report.route)}
              />
            ))}
          </View>
          <View className="flex-1">
            {rightColumn.map((report: ReportConfig) => (
              <ReportItem
                key={report.id}
                title={report.title}
                onPress={() => handleReportPress(report.route)}
              />
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
