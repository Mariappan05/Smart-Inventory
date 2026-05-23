import { AppShell } from "@/components/layout/AppShell";
import { AlertViews } from "@/views/alerts/AlertViews";

export const metadata = {
  title: "Security Alerts - Smart Inventory",
  description: "Realtime security monitoring and alert history",
};

export default function AlertsPage() {
  return (
    <AppShell>
      <div className="space-y-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Security</p>
          <h1 className="text-3xl font-semibold text-slate-900 dark:text-slate-100">Realtime Alerts</h1>
        </div>
        <AlertViews />
      </div>
    </AppShell>
  );
}
