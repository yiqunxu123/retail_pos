import { ReportListScreen } from "../../components/ReportListScreen";

const REPORTS = [
  { id: "purchase-received-history", title: "Purchase Received History Report" },
  { id: "purchase-order-received-detailed", title: "Purchase Order Received Detailed Report" },
  { id: "purchase-order-tax", title: "Purchase Order Tax Report" },
];

export default function PurchaseReportsScreen() {
  return <ReportListScreen title="Purchase Order Reports" reports={REPORTS} />;
}
