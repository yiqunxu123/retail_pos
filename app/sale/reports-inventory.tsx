import { ReportListScreen } from "../../components/ReportListScreen";

const REPORTS = [
  { id: "back-order", title: "Back Order Report" },
  { id: "inventory-valuation", title: "Inventory Valuation Report" },
  { id: "inventory-spot-check", title: "Inventory Spot Check Report" },
  { id: "inventory-adjustment", title: "Inventory Adjustment Report" },
  { id: "on-hold", title: "On Hold Report" },
  { id: "partially-fulfilled", title: "Partially Fulfilled Report" },
];

export default function InventoryReportsScreen() {
  return <ReportListScreen title="Inventory Reports" reports={REPORTS} showBack={false} />;
}
