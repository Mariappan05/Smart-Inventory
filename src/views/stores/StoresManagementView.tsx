"use client";

import { useState } from "react";
import { Plus, Trash2, Edit2, Loader2 } from "lucide-react";
import toast from "react-hot-toast";

interface Store {
  id: string;
  name: string;
  code: string;
  createdAt: Date;
  updatedAt: Date;
  users: Array<{ id: string; name: string }>;
  products: Array<{ id: string }>;
}

interface StoresManagementViewProps {
  stores: Store[];
  userRole: string | null;
  initialStoreCode: string;
}

export function StoresManagementView({ stores: initialStores, userRole, initialStoreCode }: StoresManagementViewProps) {
  const [stores, setStores] = useState<Store[]>(initialStores);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: "",
    code: initialStoreCode,
  });

  const resetForm = () => {
    setForm({
      name: "",
      code: initialStoreCode,
    });
    setEditingId(null);
    setShowForm(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (!form.name || !form.code) {
        throw new Error("Please fill in all required fields");
      }

      if (editingId) {
        // Update store
        const response = await fetch(`/api/plants/${editingId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: form.name,
          }),
        });

        const result = await response.json();

        if (!response.ok || !result.success) {
          throw new Error(result.message || "Failed to update store");
        }

        setStores(stores.map(s => s.id === editingId ? { ...s, name: form.name } : s));
        toast.success("Store updated successfully");
      } else {
        // Create store
        const response = await fetch("/api/plants", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: form.name,
            code: form.code,
          }),
        });

        const result = await response.json();

        if (!response.ok || !result.success) {
          throw new Error(result.message || "Failed to create store");
        }

        setStores([...stores, result.data]);
        toast.success("Store created successfully");
      }

      resetForm();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to save store");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (store: Store) => {
    setForm({
      name: store.name,
      code: store.code,
    });
    setEditingId(store.id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this store? This action cannot be undone.")) return;

    setDeleting(id);
    try {
      const res = await fetch(`/api/plants/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.message || "Failed to delete store");
      }

      toast.success("Store deleted successfully");
      setStores((prev) => prev.filter((s) => s.id !== id));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to delete store");
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Manage</p>
          <h1 className="text-3xl font-semibold text-slate-900 dark:text-slate-100">Stores</h1>
        </div>
        {userRole && ["ADMIN", "STORE_MANAGER"].includes(userRole) && !showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-black px-6 py-2 text-white hover:bg-slate-900 transition-colors dark:bg-slate-950 dark:hover:bg-black"
          >
            <Plus className="h-4 w-4" />
            New Store
          </button>
        )}
      </div>

      {/* Add/Edit Store Form */}
      {showForm && userRole && ["ADMIN", "STORE_MANAGER"].includes(userRole) && (
        <div className="rounded-lg border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-800">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-4">
            {editingId ? "Edit Store" : "Add New Store"}
          </h2>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              {/* Store Name */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Store Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Enter store name"
                  required
                  className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2 text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:border-slate-600 dark:bg-slate-700 dark:text-white dark:placeholder-slate-500"
                />
              </div>

              {/* Store Code */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Store Code <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.code}
                  readOnly={!editingId}
                  className="w-full rounded-lg border border-slate-300 bg-slate-100 px-4 py-2 text-slate-900 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-400 cursor-not-allowed"
                />
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  {editingId ? "Code cannot be changed" : "Auto-generated"}
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                type="submit"
                disabled={loading}
                className="rounded-lg bg-black px-6 py-2 text-white hover:bg-slate-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-2 dark:bg-slate-950 dark:hover:bg-black"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {editingId ? "Updating..." : "Creating..."}
                  </>
                ) : (
                  editingId ? "Update Store" : "Create Store"
                )}
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="rounded-lg border border-slate-300 px-6 py-2 text-slate-700 hover:bg-slate-50 transition-colors dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Stores Table */}
      {stores.length === 0 ? (
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-8 text-center dark:border-slate-700 dark:bg-slate-800">
          <p className="text-slate-600 dark:text-slate-400">No stores created yet</p>
          {userRole && ["ADMIN", "STORE_MANAGER"].includes(userRole) && !showForm && (
            <button
              onClick={() => setShowForm(true)}
              className="mt-4 inline-block text-black hover:text-slate-700 dark:text-slate-300 dark:hover:text-slate-100 font-medium"
            >
              Create the first store →
            </button>
          )}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-700">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800">
                <th className="px-3 sm:px-6 py-3 text-left text-xs sm:text-sm font-semibold text-slate-900 dark:text-slate-100">Code</th>
                <th className="px-3 sm:px-6 py-3 text-left text-xs sm:text-sm font-semibold text-slate-900 dark:text-slate-100">Name</th>
                <th className="hidden sm:table-cell px-3 sm:px-6 py-3 text-center text-xs sm:text-sm font-semibold text-slate-900 dark:text-slate-100">Users</th>
                <th className="hidden md:table-cell px-3 sm:px-6 py-3 text-center text-xs sm:text-sm font-semibold text-slate-900 dark:text-slate-100">Products</th>
                <th className="px-3 sm:px-6 py-3 text-center text-xs sm:text-sm font-semibold text-slate-900 dark:text-slate-100">Actions</th>
              </tr>
            </thead>
            <tbody>
              {stores.map((store) => (
                <tr
                  key={store.id}
                  className="border-b border-slate-200 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800/50"
                >
                  <td className="px-3 sm:px-6 py-4 text-xs sm:text-sm font-medium text-slate-900 dark:text-slate-100">{store.code}</td>
                  <td className="px-3 sm:px-6 py-4 text-xs sm:text-sm text-slate-700 dark:text-slate-300">{store.name}</td>
                  <td className="hidden sm:table-cell px-3 sm:px-6 py-4 text-center text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                    <span className="inline-block rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-semibold text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                      {store.users.length}
                    </span>
                  </td>
                  <td className="hidden md:table-cell px-3 sm:px-6 py-4 text-center text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                    <span className="inline-block rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-semibold text-green-800 dark:bg-green-900/30 dark:text-green-400">
                      {store.products.length}
                    </span>
                  </td>
                  <td className="px-3 sm:px-6 py-4 text-center text-xs sm:text-sm">
                    <div className="flex items-center justify-center gap-1 sm:gap-2">
                      {userRole && ["ADMIN", "STORE_MANAGER"].includes(userRole) && (
                        <>
                          <button
                            onClick={() => handleEdit(store)}
                            className="p-1.5 sm:p-2 text-slate-600 hover:bg-slate-100 rounded transition-colors dark:text-slate-400 dark:hover:bg-slate-700"
                            title="Edit store"
                          >
                            <Edit2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(store.id)}
                            disabled={deleting === store.id}
                            className="p-1.5 sm:p-2 text-slate-600 hover:bg-red-100 hover:text-red-600 rounded transition-colors disabled:opacity-50 dark:text-slate-400 dark:hover:bg-red-900/20 dark:hover:text-red-400"
                            title="Delete store"
                          >
                            {deleting === store.id ? (
                              <Loader2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 animate-spin" />
                            ) : (
                              <Trash2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                            )}
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
