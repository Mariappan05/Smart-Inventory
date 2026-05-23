export function PageSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-20 rounded-3xl border border-slate-200 bg-white/70 dark:border-slate-700 dark:bg-slate-900/60" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="h-28 rounded-3xl border border-slate-200 bg-white/70 dark:border-slate-700 dark:bg-slate-900/60" />
        ))}
      </div>
      <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
        <div className="h-[420px] rounded-3xl border border-slate-200 bg-white/70 dark:border-slate-700 dark:bg-slate-900/60" />
        <div className="space-y-6">
          <div className="h-[200px] rounded-3xl border border-slate-200 bg-white/70 dark:border-slate-700 dark:bg-slate-900/60" />
          <div className="h-[200px] rounded-3xl border border-slate-200 bg-white/70 dark:border-slate-700 dark:bg-slate-900/60" />
        </div>
      </div>
    </div>
  );
}
