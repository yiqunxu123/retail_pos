import { ReportListScreen } from "../../components/ReportListScreen";

const REPORTS = [
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

export default function FinancialReportsScreen() {
  return <ReportListScreen title="Financial Reports" reports={REPORTS} />;
}
