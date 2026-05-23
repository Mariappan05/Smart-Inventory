import type { ActivityItem } from "@/types/dashboard";
import { User } from "lucide-react";

type ActivityFeedProps = {
  items: ActivityItem[];
};

export function ActivityFeed({ items }: ActivityFeedProps) {
  return (
    <div className="rounded-3xl border border-slate-200/70 bg-white/80 p-5 shadow-panel dark:border-slate-700 dark:bg-slate-900/70">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
          Operations
        </p>
        <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Recent Activity</h3>
      </div>
      <ul className="mt-4 space-y-3">
        {items.map((item) => (
          <li key={item.id} className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-white px-4 py-3 dark:border-slate-700 dark:bg-slate-800/50">
            {item.imageUrl ? (
              <img
                src={item.imageUrl}
                alt={item.title}
                className="h-12 w-12 flex-shrink-0 rounded-xl object-cover border border-slate-100 dark:border-slate-700"
              />
            ) : (
              <div className="h-12 w-12 flex-shrink-0 rounded-xl bg-slate-100 dark:bg-slate-700" />
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-slate-900 truncate dark:text-slate-100">{item.title}</p>
              <div className="mt-1 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                {item.movedBy ? (
                  <div className="flex items-center gap-2">
                    <div className="h-6 w-6 overflow-hidden rounded-full border border-slate-200 bg-slate-100 dark:border-slate-700 dark:bg-slate-800">
                      {item.movedByImageUrl ? (
                        <img
                          src={item.movedByImageUrl}
                          alt={item.movedBy}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-slate-900 to-slate-700 text-white dark:from-slate-100 dark:to-slate-300 dark:text-slate-900">
                          <User className="h-3 w-3" />
                        </div>
                      )}
                    </div>
                    <span>By: {item.movedBy}</span>
                  </div>
                ) : (
                  <span>{item.timestamp}</span>
                )}
                <span className="rounded-full bg-slate-100 px-3 py-1 font-semibold text-slate-600 dark:bg-slate-700 dark:text-slate-300">
                  {item.tag}
                </span>
              </div>
              {item.movedBy && <p className="text-xs text-slate-400 dark:text-slate-500">{item.timestamp}</p>}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
