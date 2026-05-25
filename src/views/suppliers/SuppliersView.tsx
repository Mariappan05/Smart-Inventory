"use client";

import { useState } from "react";
import { Plus, X, Loader2, Eye, EyeOff } from "lucide-react";
import toast from "react-hot-toast";
import { useUserRole } from "@/hooks/useUserRole";
import { formatDate } from "@/utils/dateTimeFormat";

type Supplier = {
  id: string;
  name: string;
  code: string;
  contactEmail: string | null;
  contactPhone: string | null;
  address: string | null;
  createdAt: Date | string;
  _count: { products: number };
};

export function SuppliersView({ initialSuppliers }: { initialSuppliers: Supplier[] }) {
  const { isAdmin } = useUserRole();
  const [suppliers, setSuppliers] = useState<Supplier[]>(initialSuppliers);
  const [showSuppliers, setShowSuppliers] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: "", code: "", contactEmail: "", contactPhone: "", address: "" });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch("/api/suppliers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Failed to create supplier");
      }

      toast.success("Supplier created successfully");
      setSuppliers([{ ...result.data, _count: { products: 0 } }, ...suppliers]);
      setShowModal(false);
      setForm({ name: "", code: "", contactEmail: "", contactPhone: "", address: "" });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to create supplier");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Directory</p>
            <h1 className="text-3xl font-semibold text-slate-900 dark:text-slate-100">Suppliers</h1>
          </div>
          {isAdmin && (
            <button
              type="button"
              onClick={() => setShowModal(true)}
              className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              <Plus className="h-4 w-4" />
              Add Supplier
            </button>
          )}
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900">
          <div className="border-b border-slate-200 bg-slate-50 px-3 sm:px-6 py-3 dark:border-slate-700 dark:bg-slate-800/50 flex justify-between items-center">
            <h2 className="text-base sm:text-lg font-semibold text-slate-900 dark:text-white">
              All Suppliers
            </h2>
            <button
              onClick={() => setShowSuppliers(!showSuppliers)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-900 text-white hover:bg-slate-800 transition-colors text-sm font-medium dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200"
            >
              {showSuppliers ? (
                <>
                  <EyeOff className="h-4 w-4" />
                  Hide Suppliers
                </>
              ) : (
                <>
                  <Eye className="h-4 w-4" />
                  View Suppliers
                </>
              )}
            </button>
          </div>

          {!showSuppliers ? (
            <div className="px-6 py-8 text-center text-slate-500 dark:text-slate-400">
              <p className="text-sm">Click "View Suppliers" to see all suppliers</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800">
                    <th className="px-3 sm:px-4 py-3 text-left text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300">Name</th>
                    <th className="hidden sm:table-cell px-3 sm:px-4 py-3 text-left text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300">Code</th>
                    <th className="hidden md:table-cell px-3 sm:px-4 py-3 text-left text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300">Contact</th>
                    <th className="hidden lg:table-cell px-3 sm:px-4 py-3 text-left text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300">Created Date</th>
                    <th className="hidden lg:table-cell px-3 sm:px-4 py-3 text-left text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300">Products</th>
                  </tr>
                </thead>
                <tbody>
                  {suppliers.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-3 sm:px-4 py-8 text-center text-xs sm:text-sm text-slate-500 dark:text-slate-400">No suppliers found</td>
                    </tr>
                  ) : (
                    suppliers.map((supplier) => (
                      <tr key={supplier.id} className="border-b border-slate-200 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800">
                        <td className="px-3 sm:px-4 py-3 font-medium text-xs sm:text-sm text-slate-900 dark:text-slate-100">{supplier.name}</td>
                        <td className="hidden sm:table-cell px-3 sm:px-4 py-3 text-xs sm:text-sm text-slate-600 dark:text-slate-400">{supplier.code}</td>
                        <td className="hidden md:table-cell px-3 sm:px-4 py-3 text-xs sm:text-sm text-slate-600 dark:text-slate-400">{supplier.contactEmail || supplier.contactPhone || "-"}</td>
                        <td className="hidden lg:table-cell px-3 sm:px-4 py-3 text-xs sm:text-sm text-slate-600 dark:text-slate-400">{formatDate(new Date(supplier.createdAt))}</td>
                        <td className="hidden lg:table-cell px-3 sm:px-4 py-3 text-xs sm:text-sm text-slate-600 dark:text-slate-400">{supplier._count.products}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-700 dark:bg-slate-900">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Add New Supplier</h2>
              <button type="button" onClick={() => setShowModal(false)} className="rounded-lg p-1 hover:bg-slate-100 dark:hover:bg-slate-800">
                <X className="h-5 w-5 text-slate-600 dark:text-slate-400" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Name <span className="text-rose-500">*</span></label>
                <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Atlas Industrial" required className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:focus:border-slate-400" />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Code <span className="text-rose-500">*</span></label>
                <input type="text" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} placeholder="ATLAS" required className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:focus:border-slate-400" />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Contact Email</label>
                <input type="email" value={form.contactEmail} onChange={(e) => setForm({ ...form, contactEmail: e.target.value })} placeholder="support@atlas.com" className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:focus:border-slate-400" />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Contact Phone</label>
                <input type="tel" value={form.contactPhone} onChange={(e) => setForm({ ...form, contactPhone: e.target.value })} placeholder="+1-555-0182" className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:focus:border-slate-400" />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Address</label>
                <textarea value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="4100 Foundry Ave, Detroit, MI" rows={2} className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:focus:border-slate-400" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 rounded-2xl border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800">Cancel</button>
                <button type="submit" disabled={loading} className="flex-1 rounded-2xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-50 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white">
                  {loading ? <span className="flex items-center justify-center gap-2"><Loader2 className="h-4 w-4 animate-spin" />Creating...</span> : "Create Supplier"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
