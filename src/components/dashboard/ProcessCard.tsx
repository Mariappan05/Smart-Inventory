import type { ProcessCard as ProcessCardType } from "@/types/dashboard";

type ProcessCardProps = ProcessCardType;

const colorStyles: Record<string, string> = {
  blue: "border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/30",
  indigo: "border-indigo-200 bg-indigo-50 dark:border-indigo-800 dark:bg-indigo-900/30",
  amber: "border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-900/30",
  green: "border-emerald-200 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-900/30",
  purple: "border-purple-200 bg-purple-50 dark:border-purple-800 dark:bg-purple-900/30",
  rose: "border-rose-200 bg-rose-50 dark:border-rose-800 dark:bg-rose-900/30",
};

const progressBarColor: Record<string, string> = {
  blue: "bg-blue-500",
  indigo: "bg-indigo-500",
  amber: "bg-amber-500",
  green: "bg-emerald-500",
  purple: "bg-purple-500",
  rose: "bg-rose-500",
};

export function ProcessCard({ name, total, completed, pending, color = "blue" }: ProcessCardProps) {
  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

  return (
    <div className={`rounded-2xl border p-4 ${colorStyles[color] || colorStyles.blue}`}>
      <div className="mb-3 flex items-start justify-between">
        <div>
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">{name}</p>
        </div>
        <span className="text-lg font-bold text-slate-900 dark:text-slate-100">{total}</span>
      </div>
      
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-600 dark:text-slate-400">
            Completed: <span className="font-semibold text-slate-900 dark:text-slate-100">{completed}</span>
          </span>
          <span className="text-slate-600 dark:text-slate-400">
            {percentage}%
          </span>
        </div>
        
        <div className="h-2 w-full overflow-hidden rounded-full bg-white/50 dark:bg-slate-800/50">
          <div
            className={`h-full ${progressBarColor[color] || progressBarColor.blue}`}
            style={{ width: `${percentage}%` }}
          />
        </div>

        {pending > 0 && (
          <p className="text-xs text-slate-600 dark:text-slate-400">
            Pending: <span className="font-semibold">{pending}</span>
          </p>
        )}
      </div>
    </div>
  );
}
