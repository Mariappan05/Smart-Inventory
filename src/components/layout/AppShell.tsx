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
      <div className="flex w-full gap-6 px-4 py-6 sm:px-6 lg:px-8">
        <Sidebar />
        <div className="flex min-w-0 flex-1 flex-col gap-6">
          <Suspense fallback={null}>
            <Topbar />
          </Suspense>
          {children}
        </div>
      </div>
    </div>
  );
}
