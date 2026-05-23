"use client";

import { useState, useEffect } from "react";
import { X, Plus, Loader2, Edit2, Trash2 } from "lucide-react";
import { toast } from "react-hot-toast";

type Item = {
  id: string;
  name: string;
  itemCode: string | null;
  variant: string | null;
  description: string;
  supplier: { id: string; name: string } | null;
};

type Operation = {
  name: string;
  lifeSpan: number;
};

type Tool = {
  id: string;
  itemId: string;
  toolName: string;
  operations: Operation[];
  supplierName: string;
  supplierCode: string;
  rate: number;
  createdAt: string;
  item?: {
    id: string;
    name: string;
    itemCode: string | null;
  };
};

type ToolFormData = {
  itemId: string;
  toolName: string;
  operations: Operation[];
  supplierName: string;
  supplierCode: string;
  rate: string;
};

type Props = {
  items: Item[];
};

export function ToolEntryView({ items }: Props) {
  const [form, setForm] = useState<ToolFormData>({
    itemId: "",
    toolName: "",
    operations: [{ name: "", lifeSpan: 0 }],
    supplierName: "",
    supplierCode: "",
    rate: "",
  });

  const [tools, setTools] = useState<Tool[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [selectedProductTools, setSelectedProductTools] = useState<Tool[]>([]);
  const [editingToolId, setEditingToolId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<ToolFormData & { id?: string }>({
    id: undefined,
    itemId: "",
    toolName: "",
    operations: [{ name: "", lifeSpan: 0 }],
    supplierName: "",
    supplierCode: "",
    rate: "",
  });
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);

  // Fetch tools
  useEffect(() => {
    fetchTools();
  }, []);

  // Fetch tools for selected item
  useEffect(() => {
    if (form.itemId) {
      const filtered = tools.filter((tool) => tool.itemId === form.itemId);
      setSelectedProductTools(filtered);
    } else {
      setSelectedProductTools([]);
    }
  }, [form.itemId, tools]);

  const fetchTools = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/tools");
      const data = await res.json();

      if (data.success) {
        setTools(data.data);
      } else {
        toast.error("Failed to fetch tools");
      }
    } catch (error) {
      console.error("Error fetching tools:", error);
      toast.error("Failed to fetch tools");
    } finally {
      setLoading(false);
    }
  };

  const addOperation = () => {
    setForm({
      ...form,
      operations: [...form.operations, { name: "", lifeSpan: 0 }],
    });
  };

  const removeOperation = (index: number) => {
    setForm({
      ...form,
      operations: form.operations.filter((_, i) => i !== index),
    });
  };

  const updateOperation = (index: number, field: "name" | "lifeSpan", value: string | number) => {
    const newOperations = [...form.operations];
    if (field === "name") {
      newOperations[index] = { ...newOperations[index], name: value as string };
    } else {
      newOperations[index] = { ...newOperations[index], lifeSpan: parseFloat(value as string) || 0 };
    }
    setForm({
      ...form,
      operations: newOperations,
    });
  };

  const handleRateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Allow only numbers and decimal point
    const value = e.target.value.replace(/[^\d.]/g, "");
    setForm({ ...form, rate: value });
  };

  const handleEditOpen = (tool: Tool) => {
    setEditingToolId(tool.id);
    setEditForm({
      id: tool.id,
      itemId: tool.itemId,
      toolName: tool.toolName,
      operations: [...tool.operations],
      supplierName: tool.supplierName,
      supplierCode: tool.supplierCode,
      rate: tool.rate.toString(),
    });
  };

  const handleEditCancel = () => {
    setEditingToolId(null);
    setEditForm({
      id: undefined,
      itemId: "",
      toolName: "",
      operations: [{ name: "", lifeSpan: 0 }],
      supplierName: "",
      supplierCode: "",
      rate: "",
    });
  };

  const updateEditOperation = (index: number, field: "name" | "lifeSpan", value: string | number) => {
    const newOperations = [...editForm.operations];
    if (field === "name") {
      newOperations[index] = { ...newOperations[index], name: value as string };
    } else {
      newOperations[index] = { ...newOperations[index], lifeSpan: parseFloat(value as string) || 0 };
    }
    setEditForm({
      ...editForm,
      operations: newOperations,
    });
  };

  const removeEditOperation = (index: number) => {
    setEditForm({
      ...editForm,
      operations: editForm.operations.filter((_, i) => i !== index),
    });
  };

  const addEditOperation = () => {
    setEditForm({
      ...editForm,
      operations: [...editForm.operations, { name: "", lifeSpan: 0 }],
    });
  };

  const handleEditRateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^\d.]/g, "");
    setEditForm({ ...editForm, rate: value });
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!editForm.id) return;

    if (!editForm.toolName.trim()) {
      toast.error("Tool name is required");
      return;
    }

    const validOperations = editForm.operations.filter((op) => op.name.trim() && op.lifeSpan > 0);
    if (validOperations.length === 0) {
      toast.error("At least one operation with name and life span is required");
      return;
    }

    if (!editForm.supplierName.trim()) {
      toast.error("Supplier name is required");
      return;
    }

    if (!editForm.supplierCode.trim()) {
      toast.error("Supplier code is required");
      return;
    }

    if (!editForm.rate || isNaN(parseFloat(editForm.rate))) {
      toast.error("Valid rate is required");
      return;
    }

    try {
      setSubmitting(true);
      const res = await fetch(`/api/tools/${editForm.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          toolName: editForm.toolName.trim(),
          operations: validOperations,
          supplierName: editForm.supplierName.trim(),
          supplierCode: editForm.supplierCode.trim(),
          rate: parseFloat(editForm.rate),
        }),
      });

      const data = await res.json();

      if (data.success) {
        toast.success("Tool updated successfully");
        handleEditCancel();
        fetchTools();
      } else {
        toast.error(data.error || "Failed to update tool");
      }
    } catch (error) {
      console.error("Error updating tool:", error);
      toast.error("Failed to update tool");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (toolId: string) => {
    try {
      setSubmitting(true);
      const res = await fetch(`/api/tools/${toolId}`, {
        method: "DELETE",
      });

      const data = await res.json();

      if (data.success) {
        toast.success("Tool deleted successfully");
        setShowDeleteConfirm(null);
        fetchTools();
      } else {
        toast.error(data.error || "Failed to delete tool");
      }
    } catch (error) {
      console.error("Error deleting tool:", error);
      toast.error("Failed to delete tool");
    } finally {
      setSubmitting(false);
    }
  };

  const handleBulkDelete = async () => {
    try {
      setSubmitting(true);
      const deletePromises = Array.from(selectedIds).map(id =>
        fetch(`/api/tools/${id}`, { method: "DELETE" })
      );
      
      const results = await Promise.all(deletePromises);
      const successCount = results.filter(r => r.ok).length;
      
      if (successCount > 0) {
        toast.success(`${successCount} tool(s) deleted successfully`);
        setSelectedIds(new Set());
        fetchTools();
      }
      
      if (successCount < selectedIds.size) {
        toast.error(`Failed to delete ${selectedIds.size - successCount} tool(s)`);
      }
      
      setShowBulkDeleteConfirm(false);
    } catch (error) {
      console.error("Error deleting tools:", error);
      toast.error("Failed to delete tools");
    } finally {
      setSubmitting(false);
    }
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === tools.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(tools.map(tool => tool.id)));
    }
  };

  const toggleSelect = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };



  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.itemId.trim()) {
      toast.error("Component is required");
      return;
    }

    if (!form.toolName.trim()) {
      toast.error("Tool name is required");
      return;
    }

    const validOperations = form.operations.filter((op) => op.name.trim() && op.lifeSpan > 0);
    if (validOperations.length === 0) {
      toast.error("At least one operation with name and life span is required");
      return;
    }

    if (!form.supplierName.trim()) {
      toast.error("Supplier name is required");
      return;
    }

    if (!form.supplierCode.trim()) {
      toast.error("Supplier code is required");
      return;
    }

    if (!form.rate || isNaN(parseFloat(form.rate))) {
      toast.error("Valid rate is required");
      return;
    }

    try {
      setSubmitting(true);
      const res = await fetch("/api/tools", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          itemId: form.itemId.trim(),
          toolName: form.toolName.trim(),
          operations: validOperations,
          supplierName: form.supplierName.trim(),
          supplierCode: form.supplierCode.trim(),
          rate: parseFloat(form.rate),
        }),
      });

      const data = await res.json();

      if (data.success) {
        toast.success("Tool created successfully");
        setForm({
          itemId: form.itemId,
          toolName: "",
          operations: [{ name: "", lifeSpan: 0 }],
          supplierName: "",
          supplierCode: "",
          rate: "",
        });
        fetchTools();
      } else {
        toast.error(data.error || "Failed to create tool");
      }
    } catch (error) {
      console.error("Error creating tool:", error);
      toast.error("Failed to create tool");
    } finally {
      setSubmitting(false);
    }
  };

  const getItemName = (itemId: string) => {
    const item = items.find((i) => i.id === itemId);
    return item ? item.name : "Unknown";
  };

  return (
    <div className="space-y-6 p-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
          Tool Entry
        </h1>
        <p className="mt-2 text-slate-600 dark:text-slate-400">
          Add and manage tools for products
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Form Section */}
        <div className="lg:col-span-2">
          <div className="rounded-lg border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-800">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Product Selection */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Component <span className="text-red-500">*</span>
                </label>
                <select
                  value={form.itemId}
                  onChange={(e) =>
                    setForm({ ...form, itemId: e.target.value })
                  }
                  className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2 text-slate-900 placeholder-slate-400 focus:border-slate-500 focus:ring-1 focus:ring-slate-500 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
                >
                  <option value="">Select a component</option>
                  {items.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name} ({item.itemCode || "N/A"})
                    </option>
                  ))}
                </select>
              </div>

              {/* Tool Name */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Tool Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Enter tool name"
                  value={form.toolName}
                  onChange={(e) =>
                    setForm({ ...form, toolName: e.target.value })
                  }
                  className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2 text-slate-900 placeholder-slate-400 focus:border-slate-500 focus:ring-1 focus:ring-slate-500 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
                />
              </div>

              {/* Operations */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Operations <span className="text-red-500">*</span>
                </label>
                <div className="space-y-3">
                  {form.operations.map((operation, index) => (
                    <div key={index} className="flex gap-2">
                      <div className="flex-1">
                        <input
                          type="text"
                          placeholder={`Operation ${index + 1} (e.g., Roughing)`}
                          value={operation.name}
                          onChange={(e) => updateOperation(index, "name", e.target.value)}
                          className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2 text-slate-900 placeholder-slate-400 focus:border-slate-500 focus:ring-1 focus:ring-slate-500 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
                        />
                      </div>
                      <div className="flex-1">
                        <input
                          type="text"
                          inputMode="decimal"
                          placeholder="Life Span"
                          value={operation.lifeSpan > 0 ? operation.lifeSpan : ""}
                          onChange={(e) => {
                            const val = e.target.value.replace(/[^\d.]/g, "");
                            updateOperation(index, "lifeSpan", val);
                          }}
                          className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2 text-slate-900 placeholder-slate-400 focus:border-slate-500 focus:ring-1 focus:ring-slate-500 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
                        />
                      </div>
                      {form.operations.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeOperation(index)}
                          className="rounded-lg bg-red-50 p-2 text-red-600 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/30"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={addOperation}
                    className="flex items-center gap-2 mt-2 px-4 py-2 rounded-lg bg-black text-white hover:bg-gray-900 transition-colors font-medium"
                  >
                    <Plus className="h-4 w-4" />
                    Add Operation
                  </button>
                </div>
              </div>

              {/* Supplier Name */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Supplier Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Enter supplier name"
                  value={form.supplierName}
                  onChange={(e) =>
                    setForm({ ...form, supplierName: e.target.value })
                  }
                  className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2 text-slate-900 placeholder-slate-400 focus:border-slate-500 focus:ring-1 focus:ring-slate-500 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
                />
              </div>

              {/* Supplier Code */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Supplier Code <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Enter supplier code"
                  value={form.supplierCode}
                  onChange={(e) =>
                    setForm({ ...form, supplierCode: e.target.value })
                  }
                  className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2 text-slate-900 placeholder-slate-400 focus:border-slate-500 focus:ring-1 focus:ring-slate-500 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
                />
              </div>

              {/* Rate */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Rate <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  inputMode="decimal"
                  placeholder="Enter rate (numbers only)"
                  value={form.rate}
                  onChange={handleRateChange}
                  className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2 text-slate-900 placeholder-slate-400 focus:border-slate-500 focus:ring-1 focus:ring-slate-500 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={submitting}
                className="w-full rounded-lg bg-black px-6 py-2 text-white hover:bg-gray-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-medium"
              >
                {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                Create Tool
              </button>
            </form>
          </div>
        </div>

        {/* Tools List for Selected Component */}
        <div className="lg:col-span-1">
          <div className="rounded-lg border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-800 h-full">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
              Tools for Selected Component
            </h2>

            {!form.itemId ? (
              <p className="text-slate-500 dark:text-slate-400 text-sm">
                Select a component above to see related tools
              </p>
            ) : loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
              </div>
            ) : selectedProductTools.length === 0 ? (
              <p className="text-slate-500 dark:text-slate-400 text-sm">
                No tools created for this product yet
              </p>
            ) : (
              <div className="space-y-3">
                {selectedProductTools.map((tool) => (
                  <div
                    key={tool.id}
                    className="rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-700/50"
                  >
                    <h3 className="font-medium text-slate-900 dark:text-white text-sm">
                      {tool.toolName}
                    </h3>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                      <span className="font-semibold">Supplier:</span> {tool.supplierName}
                    </p>
                    <p className="text-xs text-slate-600 dark:text-slate-400">
                      <span className="font-semibold">Code:</span> {tool.supplierCode}
                    </p>
                    <p className="text-xs text-slate-600 dark:text-slate-400">
                      <span className="font-semibold">Rate:</span> ${tool.rate.toFixed(2)}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-1">
                      {tool.operations.map((op, idx) => (
                        <span
                          key={idx}
                          className="inline-block bg-slate-200 dark:bg-slate-600 text-slate-700 dark:text-slate-300 text-xs px-2 py-1 rounded"
                        >
                          {op.name} (LS: {op.lifeSpan})
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* All Tools Table */}
      <div className="rounded-lg border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800 overflow-hidden">
        <div className="border-b border-slate-200 bg-slate-50 px-6 py-3 dark:border-slate-700 dark:bg-slate-800/50">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
            All Tools
          </h2>
        </div>

        {selectedIds.size > 0 && (
          <div className="bg-blue-50 dark:bg-blue-900/20 px-6 py-3 flex items-center justify-between">
            <span className="text-sm text-slate-700 dark:text-slate-300">
              {selectedIds.size} tool(s) selected
            </span>
            <button
              onClick={() => setShowBulkDeleteConfirm(true)}
              disabled={submitting}
              className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition text-sm disabled:opacity-50"
            >
              <Trash2 className="h-4 w-4" />
              Delete Selected
            </button>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-700/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 dark:text-slate-300">
                  <input
                    type="checkbox"
                    checked={tools.length > 0 && selectedIds.size === tools.length}
                    onChange={toggleSelectAll}
                    className="rounded border-slate-300 dark:border-slate-600"
                  />
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Product
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Tool Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Supplier
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Code
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Rate
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Operations
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-6 py-8 text-center text-slate-500 dark:text-slate-400">
                    <div className="flex items-center justify-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Loading tools...
                    </div>
                  </td>
                </tr>
              ) : tools.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-8 text-center text-slate-500 dark:text-slate-400">
                    No tools created yet
                  </td>
                </tr>
              ) : (
                tools.map((tool) => (
                  <tr key={tool.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50">
                    <td className="px-6 py-4">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(tool.id)}
                        onChange={() => toggleSelect(tool.id)}
                        className="rounded border-slate-300 dark:border-slate-600"
                      />
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-900 dark:text-slate-100">
                      {getItemName(tool.itemId)}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-900 dark:text-slate-100">
                      {tool.toolName}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-900 dark:text-slate-100">
                      {tool.supplierName}
                    </td>
                    <td className="px-6 py-4 text-sm font-mono text-slate-900 dark:text-slate-100">
                      {tool.supplierCode}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-900 dark:text-slate-100">
                      ${tool.rate.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <div className="flex flex-wrap gap-1">
                        {tool.operations.map((op, idx) => (
                          <span
                            key={idx}
                            className="inline-block bg-slate-200 dark:bg-slate-600 text-slate-700 dark:text-slate-300 px-2 py-1 rounded text-xs font-medium"
                          >
                            {op.name} (LS: {op.lifeSpan})
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEditOpen(tool)}
                          className="p-1 text-blue-600 hover:bg-blue-50 rounded dark:text-blue-400 dark:hover:bg-blue-900/20"
                          title="Edit tool"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => setShowDeleteConfirm(tool.id)}
                          className="p-1 text-red-600 hover:bg-red-50 rounded dark:text-red-400 dark:hover:bg-red-900/20"
                          title="Delete tool"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Tool Modal */}
      {editingToolId && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 p-6">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Edit Tool</h3>
              <button
                onClick={handleEditCancel}
                className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="p-6 space-y-6">
              {/* Tool Name */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Tool Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Enter tool name"
                  value={editForm.toolName}
                  onChange={(e) =>
                    setEditForm({ ...editForm, toolName: e.target.value })
                  }
                  className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2 text-slate-900 placeholder-slate-400 focus:border-slate-500 focus:ring-1 focus:ring-slate-500 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
                />
              </div>

              {/* Operations */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Operations <span className="text-red-500">*</span>
                </label>
                <div className="space-y-3">
                  {editForm.operations.map((operation, index) => (
                    <div key={index} className="flex gap-2">
                      <div className="flex-1">
                        <input
                          type="text"
                          placeholder={`Operation ${index + 1} (e.g., Roughing)`}
                          value={operation.name}
                          onChange={(e) => updateEditOperation(index, "name", e.target.value)}
                          className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2 text-slate-900 placeholder-slate-400 focus:border-slate-500 focus:ring-1 focus:ring-slate-500 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
                        />
                      </div>
                      <div className="flex-1">
                        <input
                          type="text"
                          inputMode="decimal"
                          placeholder="Life Span"
                          value={operation.lifeSpan > 0 ? operation.lifeSpan : ""}
                          onChange={(e) => {
                            const val = e.target.value.replace(/[^\d.]/g, "");
                            updateEditOperation(index, "lifeSpan", val);
                          }}
                          className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2 text-slate-900 placeholder-slate-400 focus:border-slate-500 focus:ring-1 focus:ring-slate-500 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
                        />
                      </div>
                      {editForm.operations.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeEditOperation(index)}
                          className="rounded-lg bg-red-50 p-2 text-red-600 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/30"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={addEditOperation}
                    className="flex items-center gap-2 mt-2 px-4 py-2 rounded-lg bg-black text-white hover:bg-gray-900 transition-colors font-medium"
                  >
                    <Plus className="h-4 w-4" />
                    Add Operation
                  </button>
                </div>
              </div>

              {/* Supplier Name */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Supplier Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Enter supplier name"
                  value={editForm.supplierName}
                  onChange={(e) =>
                    setEditForm({ ...editForm, supplierName: e.target.value })
                  }
                  className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2 text-slate-900 placeholder-slate-400 focus:border-slate-500 focus:ring-1 focus:ring-slate-500 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
                />
              </div>

              {/* Supplier Code */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Supplier Code <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Enter supplier code"
                  value={editForm.supplierCode}
                  onChange={(e) =>
                    setEditForm({ ...editForm, supplierCode: e.target.value })
                  }
                  className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2 text-slate-900 placeholder-slate-400 focus:border-slate-500 focus:ring-1 focus:ring-slate-500 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
                />
              </div>

              {/* Rate */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Rate <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  inputMode="decimal"
                  placeholder="Enter rate (numbers only)"
                  value={editForm.rate}
                  onChange={handleEditRateChange}
                  className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2 text-slate-900 placeholder-slate-400 focus:border-slate-500 focus:ring-1 focus:ring-slate-500 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
                />
              </div>

              {/* Form Actions */}
              <div className="flex gap-3 justify-end pt-4 border-t border-slate-200 dark:border-slate-700">
                <button
                  type="button"
                  onClick={handleEditCancel}
                  disabled={submitting}
                  className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 rounded-lg bg-black text-white hover:bg-slate-900 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 dark:bg-slate-950 dark:hover:bg-black"
                >
                  {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                  Update Tool
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-lg max-w-sm w-full">
            <div className="border-b border-slate-200 dark:border-slate-700 p-6">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Delete Tool</h3>
            </div>

            <div className="p-6">
              <p className="text-slate-600 dark:text-slate-400 mb-6">
                Are you sure you want to delete this tool? This action cannot be undone.
              </p>

              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setShowDeleteConfirm(null)}
                  disabled={submitting}
                  className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDelete(showDeleteConfirm)}
                  disabled={submitting}
                  className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                  Delete Tool
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Bulk Delete Confirmation Modal */}
      {showBulkDeleteConfirm && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-lg max-w-sm w-full">
            <div className="border-b border-slate-200 dark:border-slate-700 p-6">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Delete {selectedIds.size} Tool(s)</h3>
            </div>

            <div className="p-6">
              <p className="text-slate-600 dark:text-slate-400 mb-6">
                Are you sure you want to delete {selectedIds.size} selected tool(s)? This action cannot be undone.
              </p>

              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setShowBulkDeleteConfirm(false)}
                  disabled={submitting}
                  className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleBulkDelete}
                  disabled={submitting}
                  className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                  Delete All
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
