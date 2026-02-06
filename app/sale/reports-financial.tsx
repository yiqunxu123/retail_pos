import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Pressable, ScrollView, Text, View } from "react-native";
import { PageHeader } from "../../components";

const FINANCIAL_REPORTS = [
  { id: "customer-account-receivable", title: "Customer Account Receivable Report" },
  { id: "customer-payment-logs", title: "Customer Payment Logs Report" },
  { id: "customer-invoice-aging", title: "Customer Invoice Aging Report" },
  { id: "daily-summary", title: "Daily Summary Report" },
  { id: "invoice-history-by-customer", title: "Invoice History By Customer" },
  { id: "payment-received", title: "Payment Received Report" },
  { id: "profit-margin-accrual", title: "Profit Margin Report (Accrual Basis)" },
  { id: "profit-margin-cash", title: "Profit Margin Report (Cash Basis)" },
  { id: "supplier-account-payable", title: "Supplier Account Payable Report" },
  { id: "sale-agent-commission", title: "Sale Agent Commission Report" },
  { id: "supplier-payment-logs", title: "Supplier Payment Logs Report" },
];

interface ReportItemProps {
  title: string;
  onPress: () => void;
}

interface ReportConfig {
  id: string;
  title: string;
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
  const handleReportPress = (title: string) => {
    router.push({ pathname: "/sale/report-page", params: { title } } as any);
  };

  const leftColumn = FINANCIAL_REPORTS.filter((_, i) => i % 2 === 0);
  const rightColumn = FINANCIAL_REPORTS.filter((_, i) => i % 2 === 1);

  return (
    <View className="flex-1 bg-white">
      <PageHeader title="Financial Reports" />

      <ScrollView className="flex-1 px-6">
        <View className="flex-row gap-4">
          <View className="flex-1">
            {leftColumn.map((report: ReportConfig) => (
              <ReportItem
                key={report.id}
                title={report.title}
                onPress={() => handleReportPress(report.title)}
              />
            ))}
          </View>
          <View className="flex-1">
            {rightColumn.map((report: ReportConfig) => (
              <ReportItem
                key={report.id}
                title={report.title}
                onPress={() => handleReportPress(report.title)}
              />
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
