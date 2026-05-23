"use client";

import { useState } from "react";
import { Calendar, ListTodo, AlertTriangle, CheckCircle2 } from "lucide-react";
import { TentativeScheduleView } from "./TentativeScheduleView";
import { FinalScheduleView } from "./FinalScheduleView";
import { ExpiredScheduleView } from "./ExpiredScheduleView";
import { CompletedScheduleView } from "./CompletedScheduleView";

type Supplier = { id: string; name: string; code: string };
type Type = { id: string; name: string; supplierId: string | null };
type Item = { 
  id: string; 
  name: string;
  variant: string | null;
  itemCode: string | null;
  description: string;
  imagesJson: string | null;
  unitPrice: number | null;
  supplierId: string | null; 
  typeId: string | null;
  stockQuantity: number;
  minimumQuantity: number;
  reorderQuantity: number;
};
type Store = { id: string; name: string };

type Tab = "tentative" | "final" | "expired" | "completed";

type Props = {
  suppliers: Supplier[];
  types: Type[];
  items: Item[];
  stores: Store[];
};

export function ScheduleHubView({ suppliers, types, items, stores }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>("tentative");

  const tabs: Array<{ id: Tab; label: string; icon: React.ReactNode; description: string }> = [
    {
      id: "tentative",
      label: "Tentative Schedule",
      icon: <Calendar className="h-4 w-4" />,
      description: "Create and manage tentative monthly schedules",
    },
    {
      id: "final",
      label: "Final Schedule",
      icon: <ListTodo className="h-4 w-4" />,
      description: "Manage and complete active schedules",
    },
    {
      id: "expired",
      label: "Expired Schedules",
      icon: <AlertTriangle className="h-4 w-4" />,
      description: "View all expired schedules",
    },
    {
      id: "completed",
      label: "Completed Schedules",
      icon: <CheckCircle2 className="h-4 w-4" />,
      description: "View all completed orders",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
          Admin Panel
        </p>
        <h1 className="text-3xl font-semibold text-slate-900 dark:text-slate-100">
          Schedule Management
        </h1>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
          Create, manage, and track supplier order schedules
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 rounded-2xl px-4 py-3 transition-all duration-200 sm:px-6 ${
              activeTab === tab.id
                ? "bg-slate-900 text-white shadow-lg dark:bg-slate-100 dark:text-slate-900"
                : "border border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:shadow-md dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
            }`}
          >
            {tab.icon}
            <span className="font-semibold">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Tab Information */}
      <div className="rounded-2xl border border-slate-200 bg-gradient-to-r from-slate-50 to-slate-100 p-4 dark:border-slate-700 dark:from-slate-800 dark:to-slate-800/50">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 text-slate-600 dark:text-slate-400">
            {tabs.find((t) => t.id === activeTab)?.icon}
          </div>
          <div>
            <h3 className="font-semibold text-slate-900 dark:text-slate-100">
              {tabs.find((t) => t.id === activeTab)?.label}
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              {tabs.find((t) => t.id === activeTab)?.description}
            </p>
          </div>
        </div>
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === "tentative" && (
          <TentativeScheduleView
            suppliers={suppliers}
            types={types}
            items={items}
            stores={stores}
          />
        )}

        {activeTab === "final" && (
          <FinalScheduleView
            suppliers={suppliers}
            types={types}
            items={items}
            stores={stores}
          />
        )}

        {activeTab === "expired" && <ExpiredScheduleView />}
        {activeTab === "completed" && <CompletedScheduleView />}
      </div>
    </div>
  );
}
