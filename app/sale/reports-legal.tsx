import { ReportListScreen } from "../../components/ReportListScreen";

const REPORTS = [
  { id: "california-cigarette-receiving", title: "California Cigarette Receiving Report" },
  { id: "kentucky-cigarette-tax", title: "Kentucky Cigarette Tax Report" },
  { id: "kentucky-tobacco-tax", title: "Kentucky Tobacco Tax Report" },
  { id: "ldr", title: "LDR Report" },
  { id: "rap", title: "RAP Report" },
  { id: "rcr", title: "RCR Report" },
];

export default function LegalReportsScreen() {
  return <ReportListScreen title="Legal Reports" reports={REPORTS} />;
}
