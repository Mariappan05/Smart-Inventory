"use client";

import { Pencil, Trash2 } from "lucide-react";
import { MachineItem } from "@/hooks/useMachineForm";

interface MachineTableProps {
  items: MachineItem[];
  onEdit: (id: string, item: MachineItem) => void;
  onDelete: (id: string) => void;
}

export function MachineTable({ items, onEdit, onDelete }: MachineTableProps) {
  return (
    <div className="overflow-x-auto rounded-lg border border-slate-300 dark:border-slate-600">
      <table className="w-full">
        <thead className="bg-slate-100 dark:bg-slate-700">
          <tr>
            <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900 dark:text-slate-100">
              Store Name
            </th>
            <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900 dark:text-slate-100">
              Store Code
            </th>
            <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900 dark:text-slate-100">
              Machine Name
            </th>
            <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900 dark:text-slate-100">
              Machine Code
            </th>
            <th className="px-6 py-3 text-center text-sm font-semibold text-slate-900 dark:text-slate-100">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-300 dark:divide-slate-600">
          {items.map((item) => (
            <tr
              key={item.id}
              className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
            >
              <td className="px-6 py-4 text-sm text-slate-900 dark:text-slate-100">
                {item.storeName}
              </td>
              <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">
                {item.storeCode}
              </td>
              <td className="px-6 py-4 text-sm text-slate-900 dark:text-slate-100">
                {item.name}
              </td>
              <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">
                {item.code}
              </td>
              <td className="px-6 py-4 text-center">
                <div className="flex items-center justify-center gap-2">
                  <button
                    onClick={() => onEdit(item.id || "", item)}
                    className="inline-flex items-center justify-center rounded-lg border border-slate-300 p-2 hover:bg-slate-100 transition-colors dark:border-slate-600 dark:hover:bg-slate-700"
                    title="Edit"
                  >
                    <Pencil className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                  </button>
                  <button
                    onClick={() => onDelete(item.id || "")}
                    className="inline-flex items-center justify-center rounded-lg border border-red-300 p-2 hover:bg-red-50 transition-colors dark:border-red-700 dark:hover:bg-red-900/20"
                    title="Delete"
                  >
                    <Trash2 className="h-4 w-4 text-red-600 dark:text-red-400" />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
