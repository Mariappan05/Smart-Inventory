import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";
import type { KpiCard } from "@/types/dashboard";

const trendIcons = {
  up: ArrowUpRight,
  down: ArrowDownRight,
  flat: Minus,
};

export function StatCard({ label, value, delta, trend }: KpiCard) {
  const Icon = trendIcons[trend];

  return (
    <div className="group flex flex-col gap-2 sm:gap-3 rounded-2xl sm:rounded-3xl border border-slate-200/70 bg-white/80 p-3 sm:p-5 shadow-panel transition-all duration-300 hover:scale-105 hover:border-slate-300 dark:border-slate-700 dark:bg-slate-900/70 dark:hover:border-slate-600">
      <div className="text-xs font-semibold uppercase tracking-[0.15em] sm:tracking-[0.2em] text-slate-500 transition-colors dark:text-slate-400">
        {label}
      </div>
      <div className="flex items-end justify-between">
        <div className="text-lg sm:text-2xl font-semibold text-slate-900 transition-all duration-300 group-hover:scale-110 dark:text-slate-100">{value}</div>
        <div className="flex items-center gap-0.5 sm:gap-1 text-xs font-semibold text-slate-600 transition-colors dark:text-slate-400">
          <Icon className="h-3 w-3 sm:h-4 sm:w-4 transition-transform group-hover:scale-125" />
          <span className="hidden sm:inline">{delta}</span>
        </div>
      </div>
    </div>
  );
}
