import { AppShell } from "@/components/layout/AppShell";
import { ReportViews } from "@/views/reports/ReportViews";

export const metadata = {
  title: "Reports - Smart Inventory",
  description: "Machine, movement, security and employee activity reports",
};

export default function ReportsPage() {
  return (
    <AppShell>
      <div className="space-y-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Analytics</p>
          <h1 className="text-3xl font-semibold text-slate-900">Reports & Export</h1>
        </div>
        <ReportViews />
      </div>
    </AppShell>
  );
}
