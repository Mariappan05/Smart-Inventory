"use client";

import { useEffect, useState } from "react";
import { Loader2, Plus, Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import { SearchableSelect } from "@/components/ui/SearchableSelect";
import { formatDate, formatDateTime } from "@/utils/dateTimeFormat";

interface Component {
  id: string;
  name: string;
  itemCode: string | null;
  storeId: string;
}

interface Tool {
  id: string;
  toolName: string;
  itemId: string;
}

interface RequestItem {
  id: string;
  toolName: string;
  componentName: string;
  componentCode: string;
  productionQuantity: number;
  fromDate: string;
  toDate: string;
  machineNumber: string;
  machineCode: string;
  storeCode: string;
  storeName: string;
}

interface UserStore {
  id: string;
  code: string;
  name: string;
}

export function RequestView() {
  const [userStore, setUserStore] = useState<UserStore | null>(null);
  const [components, setComponents] = useState<Component[]>([]);
  const [tools, setTools] = useState<Tool[]>([]);
  const [requests, setRequests] = useState<RequestItem[]>([]);

  const [form, setForm] = useState({
    componentId: "",
    toolName: "",
    productionQuantity: 1,
    fromDate: "",
    toDate: "",
    machineNumber: "",
    machineCode: "",
  });

  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const today = new Date().toISOString().split("T")[0];

  useEffect(() => {
    fetchUserStore();
  }, []);

  useEffect(() => {
    if (userStore?.id) {
      fetchComponents();
      fetchRequests();
    }
  }, [userStore]);

  useEffect(() => {
    if (form.componentId) {
      fetchToolsForComponent(form.componentId);
    } else {
      setTools([]);
      setForm(prev => ({ ...prev, toolName: "" }));
    }
  }, [form.componentId]);

  const fetchUserStore = async () => {
    try {
      const res = await fetch("/api/auth/session?details=true");
      const data = await res.json();
      if (data.success && data.store) {
        setUserStore({
          id: data.store.id,
          code: data.store.code || "N/A",
          name: data.store.name || "N/A",
        });
      }
    } catch (error) {
      console.error("Error fetching user store:", error);
      toast.error("Failed to fetch user store");
    }
  };

  const fetchComponents = async () => {
    if (!userStore?.id) return;
    
    try {
      setLoading(true);
      const res = await fetch("/api/products");
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        const storeComponents = data.data.filter(
          (product: any) => product.storeId === userStore.id
        );
        setComponents(storeComponents);
      }
    } catch (error) {
      console.error("Error fetching components:", error);
      toast.error("Failed to fetch components");
    } finally {
      setLoading(false);
    }
  };

  const fetchToolsForComponent = async (componentId: string) => {
    try {
      console.log('Fetching tools for component:', componentId);
      const res = await fetch(`/api/tools?itemId=${componentId}`);
      const data = await res.json();
      console.log('Tools response:', data);
      if (data.success && Array.isArray(data.data)) {
        setTools(data.data);
        if (data.data.length === 0) {
          toast('No tools found for this component', { icon: 'ℹ️' });
        }
      }
    } catch (error) {
      console.error("Error fetching tools:", error);
      toast.error("Failed to fetch tools");
    }
  };

  const fetchRequests = async () => {
    try {
      const res = await fetch("/api/requests");
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setRequests(data.data);
      }
    } catch (error) {
      console.error("Error fetching requests:", error);
    }
  };

  const calculateWeeklyDates = (fromDate: string) => {
    const date = new Date(fromDate);
    const dayOfWeek = date.getDay();

    let mondayDate: Date;
    let saturdayDate: Date;

    if (dayOfWeek === 1) {
      mondayDate = new Date(date);
    } else {
      const daysUntilMonday = (8 - dayOfWeek) % 7 || 7;
      mondayDate = new Date(date);
      mondayDate.setDate(mondayDate.getDate() + daysUntilMonday);
    }

    saturdayDate = new Date(mondayDate);
    saturdayDate.setDate(saturdayDate.getDate() + 5);

    return {
      fromDate: mondayDate.toISOString().split("T")[0],
      toDate: saturdayDate.toISOString().split("T")[0],
    };
  };

  const handleFromDateChange = (value: string) => {
    setForm({
      ...form,
      fromDate: value,
    });

    if (value) {
      const weekDates = calculateWeeklyDates(value);
      setForm((prev) => ({
        ...prev,
        toDate: weekDates.toDate,
      }));
    }
  };

  const isValidRequestDay = (date: string): boolean => {
    const dateObj = new Date(date);
    const dayOfWeek = dateObj.getDay();
    return dayOfWeek >= 1 && dayOfWeek <= 6;
  };

  const handleAddRequest = async () => {
    if (!form.toolName || !form.componentId || !form.productionQuantity) {
      toast.error("Please fill in all required fields");
      return;
    }

    if (!form.fromDate || !form.toDate) {
      toast.error("Please select date range");
      return;
    }

    if (!form.machineNumber || !form.machineCode) {
      toast.error("Please enter machine details");
      return;
    }

    if (!isValidRequestDay(form.fromDate)) {
      toast.error("Request can only be created from Monday to Saturday");
      return;
    }

    const selectedComponent = components.find(c => c.id === form.componentId);
    if (!selectedComponent) {
      toast.error("Invalid component selected");
      return;
    }

    try {
      setSubmitting(true);
      const res = await fetch("/api/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          toolName: form.toolName,
          componentName: selectedComponent.name,
          componentCode: selectedComponent.itemCode || "",
          productionQuantity: form.productionQuantity,
          fromDate: form.fromDate,
          toDate: form.toDate,
          machineNumber: form.machineNumber,
          machineCode: form.machineCode,
          storeCode: userStore?.code || "",
          storeName: userStore?.name || "",
        }),
      });

      const data = await res.json();
      if (data.success) {
        toast.success("Request added successfully");
        fetchRequests();
        setForm({
          componentId: "",
          toolName: "",
          productionQuantity: 1,
          fromDate: "",
          toDate: "",
          machineNumber: "",
          machineCode: "",
        });
      } else {
        toast.error(data.error || "Failed to add request");
      }
    } catch (error) {
      console.error("Error adding request:", error);
      toast.error("Failed to add request");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteRequest = async (id: string) => {
    if (!confirm("Are you sure you want to delete this request?")) return;

    try {
      const res = await fetch(`/api/requests/${id}`, {
        method: "DELETE",
      });

      const data = await res.json();
      if (data.success) {
        toast.success("Request deleted successfully");
        fetchRequests();
      } else {
        toast.error(data.error || "Failed to delete request");
      }
    } catch (error) {
      console.error("Error deleting request:", error);
      toast.error("Failed to delete request");
    }
  };

  const componentOptions = components.map((c) => ({
    value: c.id,
    label: c.name,
    subtitle: `Code: ${c.itemCode || "N/A"}`,
  }));

  const toolOptions = tools.map((t) => ({
    value: t.toolName,
    label: t.toolName,
  }));

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-slate-200 bg-white/70 p-6 shadow-panel dark:border-slate-700 dark:bg-slate-900/70">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">
          Request Module
        </h1>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
          Submit and manage machine component requests
        </p>
      </div>

      {/* Form Section */}
      <div className="rounded-lg border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-800">
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {/* Store Code - Auto-populated */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Store Code
              </label>
              <input
                type="text"
                value={userStore?.code || ""}
                disabled
                className="w-full rounded-lg border border-slate-300 bg-slate-100 px-4 py-2 text-slate-900 dark:border-slate-600 dark:bg-slate-700 dark:text-white disabled:opacity-50"
              />
            </div>

            {/* Store Name - Auto-populated */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Store Name
              </label>
              <input
                type="text"
                value={userStore?.name || ""}
                disabled
                className="w-full rounded-lg border border-slate-300 bg-slate-100 px-4 py-2 text-slate-900 dark:border-slate-600 dark:bg-slate-700 dark:text-white disabled:opacity-50"
              />
            </div>

            {/* From Date */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                From Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                min={today}
                value={form.fromDate}
                onChange={(e) => handleFromDateChange(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2 text-slate-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
              />
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Request allowed Mon-Sat
              </p>
            </div>

            {/* To Date */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                To Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={form.toDate}
                disabled
                className="w-full rounded-lg border border-slate-300 bg-slate-100 px-4 py-2 text-slate-900 dark:border-slate-600 dark:bg-slate-700 dark:text-white disabled:opacity-50"
              />
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Auto-calculated (Saturday of selected week)
              </p>
            </div>

            {/* Component Name - SearchableSelect */}
            <SearchableSelect
              label="Component Name"
              required
              options={componentOptions}
              value={form.componentId}
              onChange={(value) => setForm({ ...form, componentId: value })}
              placeholder="Select component..."
              searchPlaceholder="Search components..."
              disabled={loading || !userStore}
            />

            {/* Component Code - Auto-filled */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Component Code
              </label>
              <input
                type="text"
                value={components.find(c => c.id === form.componentId)?.itemCode || ""}
                disabled
                className="w-full rounded-lg border border-slate-300 bg-slate-100 px-4 py-2 text-slate-900 dark:border-slate-600 dark:bg-slate-700 dark:text-white disabled:opacity-50"
              />
            </div>

            {/* Tool Name - SearchableSelect */}
            <SearchableSelect
              label="Tool Name"
              required
              options={toolOptions}
              value={form.toolName}
              onChange={(value) => setForm({ ...form, toolName: value })}
              placeholder={!form.componentId ? "Select component first..." : tools.length === 0 ? "No tools available" : "Select tool..."}
              searchPlaceholder="Search tools..."
              disabled={!form.componentId || tools.length === 0}
            />
            {form.componentId && tools.length === 0 && (
              <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                No tools created for this component yet. Please create tools first.
              </p>
            )}

            {/* Production Quantity */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Production Quantity <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                min="1"
                value={form.productionQuantity}
                onChange={(e) =>
                  setForm({
                    ...form,
                    productionQuantity: parseInt(e.target.value) || 1,
                  })
                }
                className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2 text-slate-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
              />
            </div>

            {/* Machine Number */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Machine Number <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={form.machineNumber}
                onChange={(e) =>
                  setForm({ ...form, machineNumber: e.target.value })
                }
                placeholder="Enter machine number"
                className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2 text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
              />
            </div>

            {/* Machine Code */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Machine Code <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={form.machineCode}
                onChange={(e) =>
                  setForm({ ...form, machineCode: e.target.value })
                }
                placeholder="Enter machine code"
                className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2 text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
              />
            </div>
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleAddRequest}
              disabled={submitting}
              className="inline-flex items-center gap-2 rounded-lg bg-black px-6 py-2 text-white hover:bg-gray-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              <Plus className="h-4 w-4" />
              Add Item
            </button>
            <button
              type="button"
              className="rounded-lg border border-slate-300 px-6 py-2 text-slate-700 hover:bg-slate-50 transition-colors dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700 font-medium"
            >
              Clear
            </button>
          </div>
        </div>
      </div>

      {/* Requests Table */}
      <div className="rounded-lg border border-slate-200 dark:border-slate-700 overflow-x-auto">
        <div className="border-b border-slate-200 bg-slate-50 px-6 py-3 dark:border-slate-700 dark:bg-slate-800/50">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
            Requests
          </h2>
        </div>
        <table className="w-full">
          <thead className="border-b border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800">
            <tr>
              <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900 dark:text-slate-100">
                Store
              </th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900 dark:text-slate-100">
                Tool Name
              </th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900 dark:text-slate-100">
                Component
              </th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900 dark:text-slate-100">
                Production Qty
              </th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900 dark:text-slate-100">
                Date Range
              </th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900 dark:text-slate-100">
                Machine
              </th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900 dark:text-slate-100">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
            {requests.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-8 text-center text-slate-500 dark:text-slate-400">
                  No requests submitted yet
                </td>
              </tr>
            ) : (
              requests.map((request) => (
                <tr key={request.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30">
                  <td className="px-6 py-3 text-sm text-slate-900 dark:text-slate-100">
                    {request.storeCode}
                  </td>
                  <td className="px-6 py-3 text-sm text-slate-900 dark:text-slate-100">
                    {request.toolName}
                  </td>
                  <td className="px-6 py-3 text-sm text-slate-900 dark:text-slate-100">
                    {request.componentName}
                  </td>
                  <td className="px-6 py-3 text-sm text-slate-900 dark:text-slate-100">
                    {request.productionQuantity}
                  </td>
                  <td className="px-6 py-3 text-sm text-slate-900 dark:text-slate-100">
                    {formatDate(request.fromDate)} to {formatDate(request.toDate)}
                  </td>
                  <td className="px-6 py-3 text-sm text-slate-900 dark:text-slate-100">
                    {request.machineNumber}
                  </td>
                  <td className="px-6 py-3 text-sm">
                    <button
                      onClick={() => handleDeleteRequest(request.id)}
                      className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
