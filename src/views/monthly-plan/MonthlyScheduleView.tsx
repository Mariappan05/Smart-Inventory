"use client";

import { useState } from "react";
import { TentativeScheduleView } from "./TentativeScheduleView";
import { FinalScheduleView } from "./FinalScheduleView";

export function MonthlyScheduleView() {
  const [activeTab, setActiveTab] = useState<"tentative" | "final">("tentative");
  const [refreshKey, setRefreshKey] = useState(0);

  const handleScheduleCreated = () => {
    setRefreshKey(prev => prev + 1);
  };

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-slate-200 bg-white/70 p-6 shadow-panel dark:border-slate-700 dark:bg-slate-900/70">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">
          Monthly Plan Management
        </h1>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
          Create and manage tentative and final plans for the month
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-2 border-b border-slate-200 dark:border-slate-700">
        <button
          onClick={() => setActiveTab("tentative")}
          className={`px-4 py-3 font-medium transition-colors ${
            activeTab === "tentative"
              ? "border-b-2 border-blue-500 text-blue-600 dark:text-blue-400"
              : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
          }`}
        >
          Tentative Plan
        </button>
        <button
          onClick={() => setActiveTab("final")}
          className={`px-4 py-3 font-medium transition-colors ${
            activeTab === "final"
              ? "border-b-2 border-blue-500 text-blue-600 dark:text-blue-400"
              : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
          }`}
        >
          Final Plan
        </button>
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === "tentative" && (
          <TentativeScheduleView onScheduleCreated={handleScheduleCreated} />
        )}
        {activeTab === "final" && (
          <FinalScheduleView refreshKey={refreshKey} />
        )}
      </div>
    </div>
  );
}
