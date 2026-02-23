import { ReportListScreen } from "../../components/ReportListScreen";

const REPORTS = [
  { id: "mas-sales", title: "MAS Sales Report" },
  { id: "mas-inventory", title: "MAS Inventory Report" },
  { id: "mas-compliance", title: "MAS Compliance Report" },
  { id: "mas-transaction", title: "MAS Transaction Report" },
  { id: "mas-summary", title: "MAS Summary Report" },
  { id: "mas-audit", title: "MAS Audit Report" },
];

export default function MASReportsScreen() {
  return <ReportListScreen title="MAS Reports" reports={REPORTS} />;
}
