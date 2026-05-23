import type { AlertItem } from "@/types/dashboard";

type AlertPanelProps = {
  alerts: AlertItem[];
};

const severityStyles: Record<AlertItem["severity"], string> = {
  low: "border-emerald-200 bg-emerald-50 text-emerald-800",
  medium: "border-amber-200 bg-amber-50 text-amber-800",
  high: "border-rose-200 bg-rose-50 text-rose-800",
};

export function AlertPanel({ alerts }: AlertPanelProps) {
  return (
    <div className="rounded-3xl border border-slate-200/70 bg-white/80 p-5 shadow-panel dark:border-slate-700 dark:bg-slate-900/70">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
          Risk Center
        </p>
        <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Active Alerts</h3>
      </div>
      <div className="mt-4 space-y-3">
        {alerts.map((alert) => (
          <div
            key={alert.id}
            className={`rounded-2xl border px-4 py-3 text-sm ${
              severityStyles[alert.severity]
            }`}
          >
            <p className="font-semibold">{alert.title}</p>
            <p className="mt-1 text-xs">{alert.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
