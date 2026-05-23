import type { DashboardData } from "@/types/dashboard";
import { AppShell } from "@/components/layout/AppShell";
import { StatCard } from "@/components/dashboard/StatCard";
import { ProcessCard } from "@/components/dashboard/ProcessCard";
import { RecentRecords } from "@/components/dashboard/RecentRecords";
import { ActivityFeed } from "@/components/dashboard/ActivityFeed";
import { AlertPanel } from "@/components/dashboard/AlertPanel";

type DashboardViewProps = {
  data: DashboardData;
};

export function DashboardView({ data }: DashboardViewProps) {
  return (
    <AppShell>
      {/* KPI Section */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {data.kpis.map((kpi, index) => (
          <div key={kpi.id} className="stagger-item" style={{ animationDelay: `${index * 0.1}s` }}>
            <StatCard {...kpi} />
          </div>
        ))}
      </section>

      {/* Process Cards Section */}
      <section className="mt-8">
        <div className="mb-4">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Process Overview</h2>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            Track all business processes and workflow statuses
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {data.processCards.map((card, index) => (
            <div key={card.id} className="animate-slide-up" style={{ animationDelay: `${(index + data.kpis.length) * 0.1}s` }}>
              <ProcessCard {...card} />
            </div>
          ))}
        </div>
      </section>

      {/* Recent Activity and Alerts Grid */}
      <section className="mt-8 grid gap-6 xl:grid-cols-3">
        {/* Recent Records - Takes 2 columns on XL */}
        <div className="xl:col-span-2 animate-slide-up" style={{ animationDelay: '0.4s' }}>
          <RecentRecords records={data.recentRecords} />
        </div>

        {/* Alerts Panel */}
        <div className="animate-slide-up" style={{ animationDelay: '0.5s' }}>
          <AlertPanel alerts={data.alerts} />
        </div>
      </section>

      {/* Activity Feed Section */}
      <section className="mt-8 animate-slide-up" style={{ animationDelay: '0.6s' }}>
        <ActivityFeed items={data.activities} />
      </section>
    </AppShell>
  );
}
