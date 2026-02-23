import { ReportListScreen } from "../../components/ReportListScreen";

const REPORTS = [
  { id: "brand-velocity", title: "Brand Velocity Report", route: "/report/brand-velocity" },
  { id: "category-velocity", title: "Category Velocity Report", route: "/report/category-velocity" },
  { id: "customer-category-sales", title: "Customer Category Sales Report", route: "/report/customer-category-sales" },
  { id: "customer-velocity-yoy", title: "Customer Velocity Report (Year on Year)", route: "/report/customer-velocity-yoy" },
  { id: "customer-brand-velocity", title: "Customer Brand Velocity Report" },
  { id: "customer-product-velocity", title: "Customer Product Velocity Report" },
  { id: "customer-performance", title: "Customer Performance Report" },
  { id: "county-velocity", title: "County Velocity Report" },
  { id: "detail-sale", title: "Detail Sale Report" },
  { id: "item-velocity", title: "Item Velocity Report" },
  { id: "item-velocity-wow", title: "Item Velocity Report (Week on Week)" },
  { id: "item-velocity-mom", title: "Item Velocity Report (Month on Month)" },
  { id: "lost-sale", title: "Lost Sale Report" },
  { id: "sales-summary", title: "Sales Summary Report" },
  { id: "sales-rep-category", title: "Sales Rep Category Report" },
  { id: "sales-rep-product", title: "Sales Rep Product Report" },
  { id: "sales-rep-brand", title: "Sales Rep Brand Report" },
];

export default function SalesReportsScreen() {
  return <ReportListScreen title="Sales Reports" reports={REPORTS} />;
}
