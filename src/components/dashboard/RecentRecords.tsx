import type { RecentRecord } from "@/types/dashboard";

type RecentRecordsProps = {
  records: RecentRecord[];
};

const typeStyles: Record<string, string> = {
  Schedule: "bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-200",
  Tool: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/50 dark:text-indigo-200",
  Product: "bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-200",
  Movement: "bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-200",
  "Inward": "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-200",
  "Outward": "bg-rose-100 text-rose-800 dark:bg-rose-900/50 dark:text-rose-200",
};

export function RecentRecords({ records }: RecentRecordsProps) {
  return (
    <div className="rounded-3xl border border-slate-200/70 bg-white/80 p-5 shadow-panel dark:border-slate-700 dark:bg-slate-900/70">
      <div className="mb-4">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
          Latest Updates
        </p>
        <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Latest Created Records</h3>
      </div>

      <div className="space-y-3">
        {records.length === 0 ? (
          <p className="text-center text-sm text-slate-500 dark:text-slate-400 py-8">
            No recent records
          </p>
        ) : (
          records.map((record) => (
            <div
              key={record.id}
              className="rounded-2xl border border-slate-100 bg-white p-3 dark:border-slate-700 dark:bg-slate-800/50"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-900 truncate dark:text-slate-100">
                    {record.title}
                  </p>
                  <p className="mt-1 text-xs text-slate-600 dark:text-slate-400 line-clamp-2">
                    {record.description}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-2 flex-shrink-0">
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-semibold whitespace-nowrap ${
                      typeStyles[record.type] || "bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-100"
                    }`}
                  >
                    {record.type}
                  </span>
                  <span className="text-xs text-slate-500 dark:text-slate-400">{record.timestamp}</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
