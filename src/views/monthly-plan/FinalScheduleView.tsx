"use client";

import { useEffect, useState } from "react";
import { Loader2, Edit2, CheckCircle, Trash2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

interface Schedule {
  id: string;
  customerName: string;
  componentName: string;
  componentCode: string;
  quantity: number;
  createdAt: string;
  scheduleType: string;
  status: string;
}

interface FinalScheduleViewProps {
  refreshKey: number;
}

export function FinalScheduleView({ refreshKey }: FinalScheduleViewProps) {
  const { toast } = useToast();
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<Schedule>>({});

  const fetchSchedules = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/monthly-schedule?type=TENTATIVE_MONTHLY");
      if (!response.ok) throw new Error("Failed to fetch schedules");
      const data = await response.json();
      setSchedules(data.schedules || []);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch schedules",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSchedules();
  }, [refreshKey]);

  const handleEdit = (schedule: Schedule) => {
    setEditingId(schedule.id);
    setEditForm(schedule);
  };

  const handleSaveEdit = async () => {
    if (!editingId) return;

    try {
      const response = await fetch(`/api/monthly-schedule/${editingId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName: editForm.customerName,
          componentName: editForm.componentName,
          componentCode: editForm.componentCode,
          quantity: editForm.quantity,
        }),
      });

      if (!response.ok) throw new Error("Failed to update schedule");

      toast({
        title: "Success",
        description: "Schedule updated successfully",
      });

      setEditingId(null);
      fetchSchedules();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update schedule",
        variant: "destructive",
      });
    }
  };

  const handleCloseSchedule = async (id: string) => {
    try {
      const response = await fetch(`/api/monthly-schedule/${id}/close`, {
        method: "POST",
      });

      if (!response.ok) throw new Error("Failed to close schedule");

      toast({
        title: "Success",
        description: "Schedule closed successfully",
      });

      fetchSchedules();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to close schedule",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this schedule?")) return;

    try {
      const response = await fetch(`/api/monthly-schedule/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to delete schedule");

      toast({
        title: "Success",
        description: "Schedule deleted successfully",
      });

      fetchSchedules();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete schedule",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-slate-200 bg-white/50 p-4 dark:border-slate-700 dark:bg-slate-900/50">
        <p className="text-sm text-slate-600 dark:text-slate-400">
          {schedules.length === 0
            ? "No tentative schedules available. Create schedules in the Tentative Schedule tab first."
            : `${schedules.length} schedule(s) ready for final processing`}
        </p>
      </div>

      {/* Schedules Table */}
      <div className="rounded-lg border border-slate-200 dark:border-slate-700 overflow-x-auto">
        <table className="w-full">
          <thead className="border-b border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800/50">
            <tr>
              <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900 dark:text-slate-100">
                Customer Name
              </th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900 dark:text-slate-100">
                Component Name
              </th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900 dark:text-slate-100">
                Component Code
              </th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900 dark:text-slate-100">
                Quantity
              </th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900 dark:text-slate-100">
                Status
              </th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900 dark:text-slate-100">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
            {schedules.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-slate-500 dark:text-slate-400">
                  No schedules available
                </td>
              </tr>
            ) : (
              schedules.map((schedule) => (
                <tr key={schedule.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                  {editingId === schedule.id ? (
                    <>
                      <td className="px-6 py-4">
                        <input
                          type="text"
                          value={editForm.customerName || ""}
                          onChange={(e) => setEditForm({ ...editForm, customerName: e.target.value })}
                          className="w-full rounded border border-slate-300 bg-white px-2 py-1 text-sm dark:border-slate-600 dark:bg-slate-800"
                        />
                      </td>
                      <td className="px-6 py-4">
                        <input
                          type="text"
                          value={editForm.componentName || ""}
                          onChange={(e) => setEditForm({ ...editForm, componentName: e.target.value })}
                          className="w-full rounded border border-slate-300 bg-white px-2 py-1 text-sm dark:border-slate-600 dark:bg-slate-800"
                        />
                      </td>
                      <td className="px-6 py-4">
                        <input
                          type="text"
                          value={editForm.componentCode || ""}
                          onChange={(e) => setEditForm({ ...editForm, componentCode: e.target.value })}
                          className="w-full rounded border border-slate-300 bg-white px-2 py-1 text-sm dark:border-slate-600 dark:bg-slate-800"
                        />
                      </td>
                      <td className="px-6 py-4">
                        <input
                          type="number"
                          value={editForm.quantity || ""}
                          onChange={(e) => setEditForm({ ...editForm, quantity: parseInt(e.target.value) })}
                          className="w-full rounded border border-slate-300 bg-white px-2 py-1 text-sm dark:border-slate-600 dark:bg-slate-800"
                        />
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <span className="inline-block rounded-full bg-yellow-100 px-3 py-1 text-xs font-medium text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                          Editing
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <div className="flex gap-2">
                          <button
                            onClick={handleSaveEdit}
                            className="text-green-600 hover:text-green-700 dark:text-green-400"
                          >
                            Save
                          </button>
                          <button
                            onClick={() => setEditingId(null)}
                            className="text-slate-600 hover:text-slate-700 dark:text-slate-400"
                          >
                            Cancel
                          </button>
                        </div>
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="px-6 py-4 text-sm text-slate-900 dark:text-slate-100">
                        {schedule.customerName}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-900 dark:text-slate-100">
                        {schedule.componentName}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">
                        {schedule.componentCode}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-900 dark:text-slate-100">
                        {schedule.quantity}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <span className="inline-block rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                          {schedule.status || "TENTATIVE"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEdit(schedule)}
                            title="Edit"
                            className="text-blue-600 hover:text-blue-700 dark:text-blue-400"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleCloseSchedule(schedule.id)}
                            title="Close Schedule"
                            className="text-green-600 hover:text-green-700 dark:text-green-400"
                          >
                            <CheckCircle className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(schedule.id)}
                            title="Delete"
                            className="text-red-600 hover:text-red-700 dark:text-red-400"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
