import type { ReactNode } from "react";
import { Suspense } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";

type AppShellProps = {
  children: ReactNode;
};

export function AppShell({ children }: AppShellProps) {
  return (
    <div className="min-h-screen bg-[var(--color-background)] text-slate-900 transition-colors dark:bg-slate-950 dark:text-slate-100">
      <div className="absolute inset-0 -z-10 bg-dashboard-pattern" />
      <div className="flex w-full flex-col lg:flex-row gap-3 sm:gap-4 lg:gap-6 px-3 sm:px-4 lg:px-6 py-3 sm:py-4 lg:py-6">
        <Sidebar />
        <div className="flex min-w-0 flex-1 flex-col gap-3 sm:gap-4 lg:gap-6 pb-6 sm:pb-8 lg:pb-0">
          <Suspense fallback={null}>
            <Topbar />
          </Suspense>
          <div className="flex-1">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
