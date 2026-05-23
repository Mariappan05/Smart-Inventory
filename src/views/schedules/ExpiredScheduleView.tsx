"use client";

import { useState, useEffect } from "react";
import { AlertTriangle, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import { fmtDate } from "@/utils/dateFormat";

type Schedule = {
  id: string;
  scheduleDate: string;
  supplier: { id: string; name: string; code: string };
  item: { id: string; name: string };
  Store: { id: string; name: string };
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  gstAmount: number;
  totalWithGst: number;
  orderDeliveryDate: string;
  status: string;
  notes?: string | null;
  createdAt: string;
};

export function ExpiredScheduleView() {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchSchedules();
  }, []);

  const fetchSchedules = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/schedules?status=EXPIRED");
      const data = await response.json();
      if (data.success) {
        setSchedules(data.data);
      }
    } catch (error) {
      toast.error("Failed to fetch expired schedules");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
          Schedule Management
        </p>
        <h1 className="text-3xl font-semibold text-slate-900 dark:text-slate-100">
          Expired Schedules
        </h1>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
          View all schedules past their delivery date
        </p>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-panel dark:border-slate-700 dark:bg-slate-900/70">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
          </div>
        ) : schedules.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 py-8 text-center text-slate-500 dark:border-slate-700 dark:text-slate-400">
            No expired schedules
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-700">
                  <th className="px-3 sm:px-4 py-3 text-left text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300">
                    Schedule Date
                  </th>
                  <th className="hidden sm:table-cell px-3 sm:px-4 py-3 text-left text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300">
                    Supplier
                  </th>
                  <th className="px-3 sm:px-4 py-3 text-left text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300">
                    Item
                  </th>
                  <th className="hidden md:table-cell px-3 sm:px-4 py-3 text-left text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300">
                    Store </th>
                  <th className="hidden lg:table-cell px-3 sm:px-4 py-3 text-right text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300">
                    Quantity
                  </th>
                  <th className="hidden xl:table-cell px-3 sm:px-4 py-3 text-left text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300">
                    Delivery Date
                  </th>
                  <th className="px-3 sm:px-4 py-3 text-left text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {schedules.map((schedule) => (
                  <tr
                    key={schedule.id}
                    className="border-b border-slate-200 transition hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800"
                  >
                    <td className="px-3 sm:px-4 py-3 text-xs sm:text-sm text-slate-900 dark:text-slate-100">
                      {fmtDate(schedule.scheduleDate)}
                    </td>
                    <td className="hidden sm:table-cell px-3 sm:px-4 py-3 text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                      {schedule.supplier.name}
                    </td>
                    <td className="px-3 sm:px-4 py-3 text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                      {schedule.item.name}
                    </td>
                    <td className="hidden md:table-cell px-3 sm:px-4 py-3 text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                      {schedule.Store.name}
                    </td>
                    <td className="hidden lg:table-cell px-3 sm:px-4 py-3 text-right text-xs sm:text-sm font-semibold text-slate-900 dark:text-slate-100">
                      {schedule.quantity}
                    </td>
                    <td className="hidden xl:table-cell px-3 sm:px-4 py-3">
                      <div className="flex items-center gap-1 sm:gap-2">
                        <AlertTriangle className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-red-500" />
                        <span className="text-xs sm:text-sm text-red-600 dark:text-red-400">
                          {fmtDate(schedule.orderDeliveryDate)}
                        </span>
                      </div>
                    </td>
                    <td className="px-3 sm:px-4 py-3">
                      <span className="inline-flex rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-semibold text-red-700 dark:bg-red-900/30 dark:text-red-400">
                        Expired
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
