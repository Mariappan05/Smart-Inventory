import { AppShell } from "@/components/layout/AppShell";
import { MachineIOView } from "@/views/machine-io/ScanViews";

export const metadata = {
  title: "Product IN/OUT - Smart Inventory",
  description: "Scan QR codes and track consumable product movement in real time",
};

export default function MachineIOPage() {
  return (
    <AppShell>
      <div className="space-y-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Operations</p>
          <h1 className="text-3xl font-semibold text-slate-900 dark:text-slate-100">Product IN/OUT</h1>
        </div>
        <MachineIOView />
      </div>
    </AppShell>
  );
}
