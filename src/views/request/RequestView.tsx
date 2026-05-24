"use client";

import { useEffect, useState } from "react";
import { Loader2, Plus, Trash2, Edit2, X, ChevronDown } from "lucide-react";
import toast from "react-hot-toast";

interface Component {
  id: string;
  name: string;
  itemCode: string | null;
}

interface Tool {
  id: string;
  toolName: string;
  itemId: string;
  item: {
    id: string;
    name: string;
    itemCode?: string;
  };
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
  code: string;
  name: string;
}

export function RequestView() {
  const [userStore, setUserStore] = useState<UserStore | null>(null);
  const [components, setComponents] = useState<Component[]>([]);
  const [tools, setTools] = useState<Tool[]>([]);
  const [requests, setRequests] = useState<RequestItem[]>([]);

  const [form, setForm] = useState({
    toolName: "",
    componentName: "",
    componentCode: "",
    productionQuantity: 1,
    fromDate: "",
    toDate: "",
    machineNumber: "",
    machineCode: "",
  });

  const [showComponentDropdown, setShowComponentDropdown] = useState(false);
  const [componentSearch, setComponentSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Get today's date as minimum
  const today = new Date().toISOString().split("T")[0];

  useEffect(() => {
    fetchUserStore();
    fetchComponents();
    fetchRequests();
  }, []);

  const fetchUserStore = async () => {
    try {
      const res = await fetch("/api/auth/session");
      const data = await res.json();
      if (data.success && data.store) {
        setUserStore({
          code: data.store.code || "N/A",
          name: data.store.name || "N/A",
        });
      }
    } catch (error) {
      console.error("Error fetching user store:", error);
    }
  };

  const fetchComponents = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/products");
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        // Extract unique components from products
        const uniqueComponents = data.data.map((product: any) => ({
          id: product.id,
          name: product.name,
          itemCode: product.itemCode,
        }));
        setComponents(uniqueComponents);
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
      const res = await fetch(`/api/tools?componentId=${componentId}`);
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setTools(data.data);
      }
    } catch (error) {
      console.error("Error fetching tools:", error);
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

  const handleComponentSelect = (component: Component) => {
    setForm({
      ...form,
      componentName: component.name,
      componentCode: component.itemCode || "",
    });
    setShowComponentDropdown(false);
    setComponentSearch("");
    fetchToolsForComponent(component.id);
  };

  const handleToolSelect = (tool: Tool) => {
    setForm({
      ...form,
      toolName: tool.toolName,
    });
  };

  const calculateWeeklyDates = (fromDate: string) => {
    const date = new Date(fromDate);
    const dayOfWeek = date.getDay();

    let mondayDate: Date;
    let saturdayDate: Date;

    // If Monday (1), use that week; otherwise use next week's Monday
    if (dayOfWeek === 1) {
      mondayDate = new Date(date);
    } else {
      // Calculate days until next Monday
      const daysUntilMonday = (8 - dayOfWeek) % 7 || 7;
      mondayDate = new Date(date);
      mondayDate.setDate(mondayDate.getDate() + daysUntilMonday);
    }

    // Saturday is 5 days after Monday
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

    // Auto-calculate toDate based on weekly logic
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
    // 1 = Monday, 6 = Saturday
    return dayOfWeek >= 1 && dayOfWeek <= 6;
  };

  const handleAddRequest = async () => {
    // Validation
    if (!form.toolName || !form.componentName || !form.productionQuantity) {
      toast.error("Please fill in all required fields");
      return;
    }

    if (!form.fromDate || !form.toDate) {
      toast.error("Please select date range");
      return;
    }

    if (!isValidRequestDay(form.fromDate)) {
      toast.error("Request can only be created from Monday to Saturday");
      return;
    }

    const newRequest: RequestItem = {
      id: `req-${Date.now()}`,
      toolName: form.toolName,
      componentName: form.componentName,
      componentCode: form.componentCode,
      productionQuantity: form.productionQuantity,
      fromDate: form.fromDate,
      toDate: form.toDate,
      machineNumber: form.machineNumber,
      machineCode: form.machineCode,
      storeCode: userStore?.code || "",
      storeName: userStore?.name || "",
    };

    try {
      setSubmitting(true);
      const res = await fetch("/api/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newRequest),
      });

      const data = await res.json();
      if (data.success) {
        toast.success("Request added successfully");
        setRequests([...requests, newRequest]);
        setForm({
          toolName: "",
          componentName: "",
          componentCode: "",
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
        setRequests(requests.filter((r) => r.id !== id));
      } else {
        toast.error(data.error || "Failed to delete request");
      }
    } catch (error) {
      console.error("Error deleting request:", error);
      toast.error("Failed to delete request");
    }
  };

  const filteredComponents = components.filter((c) =>
    c.name.toLowerCase().includes(componentSearch.toLowerCase())
  );

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

            {/* Component Name - Dropdown with Search */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Component Name <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowComponentDropdown(!showComponentDropdown)}
                  disabled={loading}
                  className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2 text-left text-slate-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:border-slate-600 dark:bg-slate-700 dark:text-white flex justify-between items-center disabled:opacity-50"
                >
                  {form.componentName || "Select component..."}
                  <ChevronDown className="h-4 w-4" />
                </button>

                {showComponentDropdown && !loading && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg shadow-lg z-10">
                    <input
                      type="text"
                      placeholder="Search component..."
                      value={componentSearch}
                      onChange={(e) => setComponentSearch(e.target.value)}
                      className="w-full px-4 py-2 border-b border-slate-300 dark:border-slate-600 focus:outline-none text-slate-900 dark:text-white bg-white dark:bg-slate-700"
                    />
                    <div className="max-h-48 overflow-y-auto">
                      {filteredComponents.length === 0 ? (
                        <div className="px-4 py-4 text-center text-slate-500 dark:text-slate-400 text-sm">
                          No components found
                        </div>
                      ) : (
                        filteredComponents.map((comp) => (
                          <button
                            key={comp.id}
                            type="button"
                            onClick={() => handleComponentSelect(comp)}
                            className="w-full text-left px-4 py-2 text-slate-900 dark:text-white hover:bg-slate-100 dark:hover:bg-slate-600"
                          >
                            <div className="font-medium">{comp.name}</div>
                            <div className="text-xs text-slate-500 dark:text-slate-400">
                              Code: {comp.itemCode || "N/A"}
                            </div>
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Component Code - Auto-filled */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Component Code
              </label>
              <input
                type="text"
                value={form.componentCode}
                disabled
                className="w-full rounded-lg border border-slate-300 bg-slate-100 px-4 py-2 text-slate-900 dark:border-slate-600 dark:bg-slate-700 dark:text-white disabled:opacity-50"
              />
            </div>

            {/* Tool Name - Related to component */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Tool Name <span className="text-red-500">*</span>
              </label>
              <select
                value={form.toolName}
                onChange={(e) => handleToolSelect(tools.find((t) => t.toolName === e.target.value) || {} as Tool)}
                className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2 text-slate-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
              >
                <option value="">Select tool...</option>
                {tools.map((tool) => (
                  <option key={tool.id} value={tool.toolName}>
                    {tool.toolName}
                  </option>
                ))}
              </select>
            </div>

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
                    {request.fromDate} to {request.toDate}
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
