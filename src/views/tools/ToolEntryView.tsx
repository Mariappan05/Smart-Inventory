"use client";

import { useState, useEffect } from "react";
import { X, Plus, Loader2, Edit2, Trash2, Eye, EyeOff } from "lucide-react";
import { toast } from "react-hot-toast";
import { SearchableSelect } from "@/components/ui/SearchableSelect";
import { ModernDropdown } from "@/components/ui/ModernDropdown";

type Item = {
  id: string;
  name: string;
  itemCode: string | null;
  variant: string | null;
  description: string;
  storeId: string | null;
  supplier: { id: string; name: string } | null;
};

type Operation = {
  name: string;
  lifeSpan: number;
};

type Tool = {
  id: string;
  itemId: string;
  toolType?: string;
  toolName: string;
  operations: Operation[];
  supplierName: string;
  supplierCode: string;
  rate: number;
  createdAt: string;
  storeId: string;
  item?: {
    id: string;
    name: string;
    itemCode: string | null;
  };
  store?: {
    id: string;
    name: string;
    code: string;
  };
};

type Supplier = {
  id: string;
  name: string;
  code: string;
  contactEmail?: string;
  contactPhone?: string;
};

type ToolFormData = {
  itemId: string;
  toolType: string;
  toolName: string;
  operation: Operation;
  supplierId: string;
  supplierName: string;
  supplierCode: string;
  rate: string;
};

type Props = {
  items: Item[];
};

interface Store {
  id: string;
  code: string;
  name: string;
}

interface PendingTool {
  tempId: string;
  storeId: string;
  storeName: string;
  itemId: string;
  itemName: string;
  toolType: string;
  toolName: string;
  operation: Operation;
  supplierName: string;
  supplierCode: string;
  rate: number;
}

export function ToolEntryView({ items }: Props) {
  const [stores, setStores] = useState<Store[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [form, setForm] = useState<ToolFormData & { storeId: string; storeName: string }>({
    storeId: "",
    storeName: "",
    itemId: "",
    toolType: "",
    toolName: "",
    operation: { name: "", lifeSpan: 0 },
    supplierId: "",
    supplierName: "",
    supplierCode: "",
    rate: "",
  });

  const [pendingTools, setPendingTools] = useState<PendingTool[]>([]);
  const [editingPendingId, setEditingPendingId] = useState<string | null>(null);
  const [selectedPendingIds, setSelectedPendingIds] = useState<Set<string>>(new Set());

  const [tools, setTools] = useState<Tool[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [selectedProductTools, setSelectedProductTools] = useState<Tool[]>([]);
  const [editingToolId, setEditingToolId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<ToolFormData & { id?: string }>({
    id: undefined,
    itemId: "",
    toolType: "",
    toolName: "",
    operation: { name: "", lifeSpan: 0 },
    supplierId: "",
    supplierName: "",
    supplierCode: "",
    rate: "",
  });
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);
  const [showCreatedTools, setShowCreatedTools] = useState(false);

  // Fetch tools, stores and suppliers
  useEffect(() => {
    fetchTools();
    fetchStores();
    fetchSuppliers();
  }, []);

  const fetchStores = async () => {
    try {
      const res = await fetch("/api/plants");
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setStores(data.data);
      }
    } catch (error) {
      console.error("Error fetching stores:", error);
      toast.error("Failed to fetch stores");
    }
  };

  const fetchSuppliers = async () => {
    try {
      const res = await fetch("/api/suppliers");
      const data = await res.json();
      if (Array.isArray(data)) {
        setSuppliers(data);
      }
    } catch (error) {
      console.error("Error fetching suppliers:", error);
      toast.error("Failed to fetch suppliers");
    }
  };

  // Fetch tools for selected item
  useEffect(() => {
    if (form.itemId) {
      const filtered = tools.filter((tool) => tool.itemId === form.itemId);
      setSelectedProductTools(filtered);
    } else {
      setSelectedProductTools([]);
    }
  }, [form.itemId, tools]);

  // Filter items by selected store
  const filteredItems = form.storeId 
    ? items.filter(item => item.storeId === form.storeId)
    : [];

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

  // Handle supplier selection and auto-fill code
  const handleSupplierChange = (supplierId: string) => {
    const selectedSupplier = suppliers.find(s => s.id === supplierId);
    if (selectedSupplier) {
      setForm({
        ...form,
        supplierId,
        supplierName: selectedSupplier.name,
        supplierCode: selectedSupplier.code,
      });
    }
  };

  const handleOperationChange = (field: "name" | "lifeSpan", value: string | number) => {
    if (field === "name") {
      setForm({
        ...form,
        operation: { ...form.operation, name: value as string },
      });
    } else {
      const numValue = parseFloat(value as string) || 0;
      setForm({
        ...form,
        operation: { ...form.operation, lifeSpan: numValue },
      });
    }
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
      toolType: tool.toolType || "",
      toolName: tool.toolName,
      operation: tool.operations[0] || { name: "", lifeSpan: 0 },
      supplierId: "",
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
      toolType: "",
      toolName: "",
      operation: { name: "", lifeSpan: 0 },
      supplierId: "",
      supplierName: "",
      supplierCode: "",
      rate: "",
    });
  };

  const updateEditOperation = (field: "name" | "lifeSpan", value: string | number) => {
    if (field === "name") {
      setEditForm({
        ...editForm,
        operation: { ...editForm.operation, name: value as string },
      });
    } else {
      const numValue = parseFloat(value as string) || 0;
      setEditForm({
        ...editForm,
        operation: { ...editForm.operation, lifeSpan: numValue },
      });
    }
  };

  const handleEditRateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^\d.]/g, "");
    setEditForm({ ...editForm, rate: value });
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!editForm.id) return;

    if (!editForm.toolType.trim()) {
      toast.error("Tool type is required");
      return;
    }

    if (!editForm.toolName.trim()) {
      toast.error("Tool name is required");
      return;
    }

    if (!editForm.operation.name.trim() || editForm.operation.lifeSpan <= 0) {
      toast.error("Operation name and life span are required");
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
          toolType: editForm.toolType.trim(),
          toolName: editForm.toolName.trim(),
          operations: [editForm.operation],
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

    if (!form.storeId.trim()) {
      toast.error("Store is required");
      return;
    }

    if (!form.itemId.trim()) {
      toast.error("Component is required");
      return;
    }

    if (!form.toolType.trim()) {
      toast.error("Tool type is required");
      return;
    }

    if (!form.toolName.trim()) {
      toast.error("Tool name is required");
      return;
    }

    if (!form.operation.name.trim() || form.operation.lifeSpan <= 0) {
      toast.error("Operation name and life span are required");
      return;
    }

    if (!form.supplierId) {
      toast.error("Supplier is required");
      return;
    }

    if (!form.rate || isNaN(parseFloat(form.rate))) {
      toast.error("Valid rate is required");
      return;
    }

    const selectedItem = items.find(i => i.id === form.itemId);
    const newTool: PendingTool = {
      tempId: `temp-${Date.now()}`,
      storeId: form.storeId,
      storeName: form.storeName,
      itemId: form.itemId,
      itemName: selectedItem?.name || "Unknown",
      toolType: form.toolType,
      toolName: form.toolName.trim(),
      operation: form.operation,
      supplierName: form.supplierName,
      supplierCode: form.supplierCode,
      rate: parseFloat(form.rate),
    };

    if (editingPendingId) {
      setPendingTools(pendingTools.map(t => 
        t.tempId === editingPendingId ? { ...newTool, tempId: editingPendingId } : t
      ));
      setEditingPendingId(null);
      toast.success("Tool updated in list");
    } else {
      setPendingTools([...pendingTools, newTool]);
      toast.success("Tool added to list");
    }

    // Reset form but keep store selection
    setForm({
      storeId: form.storeId,
      storeName: form.storeName,
      itemId: "",
      toolType: "",
      toolName: "",
      operation: { name: "", lifeSpan: 0 },
      supplierId: "",
      supplierName: "",
      supplierCode: "",
      rate: "",
    });
  };

  const handleCreateAllTools = async () => {
    if (pendingTools.length === 0) {
      toast.error("Please add at least one tool");
      return;
    }

    try {
      setSubmitting(true);
      let successCount = 0;
      const failedTools: string[] = [];

      for (const tool of pendingTools) {
        try {
          const res = await fetch("/api/tools", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              storeId: tool.storeId,
              itemId: tool.itemId,
              toolType: tool.toolType,
              toolName: tool.toolName,
              operations: [tool.operation],
              supplierName: tool.supplierName,
              supplierCode: tool.supplierCode,
              rate: tool.rate,
            }),
          });

          const data = await res.json();
          if (data.success) {
            successCount++;
          } else {
            failedTools.push(`${tool.toolName} (${data.error})`);
          }
        } catch (err) {
          failedTools.push(tool.toolName);
        }
      }

      await fetchTools();

      if (successCount === pendingTools.length) {
        toast.success(`✓ Successfully created ${successCount} tool${successCount > 1 ? "s" : ""}!`);
      } else if (successCount > 0) {
        toast.success(`Created ${successCount} tool${successCount > 1 ? "s" : ""}. ${failedTools.length} failed.`);
      } else {
        toast.error("Failed to create tools. " + failedTools.join(", "));
      }

      setPendingTools([]);
    } catch (error) {
      console.error("Error creating tools:", error);
      toast.error("Failed to create tools");
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditPendingTool = (tool: PendingTool) => {
    setForm({
      storeId: tool.storeId,
      storeName: tool.storeName,
      itemId: tool.itemId,
      toolType: tool.toolType,
      toolName: tool.toolName,
      operation: tool.operation,
      supplierId: suppliers.find(s => s.name === tool.supplierName)?.id || "",
      supplierName: tool.supplierName,
      supplierCode: tool.supplierCode,
      rate: tool.rate.toString(),
    });
    setEditingPendingId(tool.tempId);
  };

  const handleDeletePendingTool = (tempId: string) => {
    setPendingTools(pendingTools.filter(t => t.tempId !== tempId));
    if (editingPendingId === tempId) {
      setEditingPendingId(null);
    }
    toast.success("Tool removed from list");
  };

  const handleBulkDeletePending = () => {
    setPendingTools(pendingTools.filter(t => !selectedPendingIds.has(t.tempId)));
    setSelectedPendingIds(new Set());
    toast.success(`${selectedPendingIds.size} tool(s) removed from list`);
  };

  const toggleSelectPending = (tempId: string) => {
    const newSelected = new Set(selectedPendingIds);
    if (newSelected.has(tempId)) {
      newSelected.delete(tempId);
    } else {
      newSelected.add(tempId);
    }
    setSelectedPendingIds(newSelected);
  };

  const toggleSelectAllPending = () => {
    if (selectedPendingIds.size === pendingTools.length) {
      setSelectedPendingIds(new Set());
    } else {
      setSelectedPendingIds(new Set(pendingTools.map(t => t.tempId)));
    }
  };

  const storeOptions = stores.map((store) => ({
    value: store.id,
    label: store.name,
    subtitle: `Code: ${store.code}`,
  }));

  const supplierOptions = suppliers.map((supplier) => ({
    value: supplier.id,
    label: supplier.name,
    subtitle: `Code: ${supplier.code}`,
  }));

  const displayedTools = showCreatedTools ? tools : [];

  const getStoreName = (tool: Tool) => {
    if (tool.store) {
      return tool.store.name;
    }
    // Fallback: find store from items
    const item = items.find((i) => i.id === tool.itemId);
    if (item?.storeId) {
      const store = stores.find((s) => s.id === item.storeId);
      return store?.name || "Unknown";
    }
    return "Unknown";
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
              {/* Store Selection */}
              <SearchableSelect
                label="Store"
                required
                options={storeOptions}
                value={form.storeId}
                onChange={(value) => {
                  const selectedStore = stores.find((s) => s.id === value);
                  setForm({
                    ...form,
                    storeId: value,
                    storeName: selectedStore?.name || "",
                  });
                }}
                placeholder="Select a store..."
                searchPlaceholder="Search stores..."
              />

              {/* Component Selection */}
              <ModernDropdown
                label="Component"
                required
                options={filteredItems.map((item) => ({
                  value: item.id,
                  label: item.name,
                  subtitle: item.itemCode ? `Code: ${item.itemCode}` : undefined,
                }))}
                value={form.itemId}
                onChange={(value) => setForm({ ...form, itemId: value as string })}
                placeholder={!form.storeId ? "Select a store first..." : "Select a component..."}
                searchPlaceholder="Search components..."
                disabled={!form.storeId}
                emptyMessage={form.storeId && filteredItems.length === 0 ? "No components available for this store" : undefined}
              />

              {/* Tool Type */}
              <ModernDropdown
                label="Tool Type"
                required
                options={[
                  { value: "Holder", label: "Holder" },
                  { value: "COLLET", label: "COLLET" },
                  { value: "Centre Drill", label: "Centre Drill" },
                  { value: "Drill", label: "Drill" },
                  { value: "Drill / Cutter", label: "Drill / Cutter" },
                  { value: "Insert", label: "Insert" },
                  { value: "Reamer", label: "Reamer" },
                  { value: "Endmill", label: "Endmill" },
                  { value: "Step Drill", label: "Step Drill" },
                  { value: "Tap", label: "Tap" },
                  { value: "Chamfer Tool", label: "Chamfer Tool" },
                ]}
                value={form.toolType}
                onChange={(value) => setForm({ ...form, toolType: value as string })}
                placeholder="Select tool type..."
                searchPlaceholder="Search tool types..."
              />

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
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Operation <span className="text-red-500">*</span>
                </label>
                <div className="flex gap-2">
                  <div className="flex-1">
                    <input
                      type="text"
                      placeholder="Operation name (e.g., Roughing)"
                      value={form.operation.name}
                      onChange={(e) => handleOperationChange("name", e.target.value)}
                      className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2 text-slate-900 placeholder-slate-400 focus:border-slate-500 focus:ring-1 focus:ring-slate-500 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
                    />
                  </div>
                  <div className="flex-1">
                    <input
                      type="text"
                      inputMode="decimal"
                      placeholder="Life Span"
                      value={form.operation.lifeSpan > 0 ? form.operation.lifeSpan : ""}
                      onChange={(e) => {
                        const val = e.target.value.replace(/[^\d.]/g, "");
                        handleOperationChange("lifeSpan", val);
                      }}
                      className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2 text-slate-900 placeholder-slate-400 focus:border-slate-500 focus:ring-1 focus:ring-slate-500 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
                    />
                  </div>
                </div>
              </div>

              {/* Supplier Name - Dropdown */}
              <ModernDropdown
                label="Supplier"
                required
                options={supplierOptions}
                value={form.supplierId}
                onChange={(value) => handleSupplierChange(value as string)}
                placeholder="Select supplier..."
                searchPlaceholder="Search suppliers..."
                emptyMessage={suppliers.length === 0 ? "No suppliers available" : undefined}
              />

              {/* Supplier Code - Auto-filled */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Supplier Code <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Auto-filled from supplier selection"
                  value={form.supplierCode}
                  disabled
                  className="w-full rounded-lg border border-slate-300 bg-slate-50 px-4 py-2 text-slate-700 placeholder-slate-400 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-400 cursor-not-allowed"
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
                {editingPendingId ? "Update Item" : "Add Item"}
              </button>
              {editingPendingId && (
                <button
                  type="button"
                  onClick={() => {
                    setEditingPendingId(null);
                    setForm({
                      storeId: form.storeId,
                      storeName: form.storeName,
                      itemId: "",
                      toolType: "",
                      toolName: "",
                      operation: { name: "", lifeSpan: 0 },
                      supplierId: "",
                      supplierName: "",
                      supplierCode: "",
                      rate: "",
                    });
                  }}
                  className="w-full rounded-lg border border-slate-300 px-6 py-2 text-slate-700 hover:bg-slate-50 transition-colors dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700 font-medium"
                >
                  Cancel
                </button>
              )}
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
                      {Array.isArray(tool.operations) && tool.operations.map((op, idx) => (
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

      {/* Pending Tools Table */}
      {pendingTools.length > 0 && (
        <div className="rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
          <div className="border-b border-slate-200 bg-slate-50 px-6 py-3 dark:border-slate-700 dark:bg-slate-800/50 flex justify-between items-center">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
              Tools to Create ({pendingTools.length})
            </h2>
            {selectedPendingIds.size > 0 && (
              <button
                onClick={handleBulkDeletePending}
                className="inline-flex items-center gap-2 rounded-lg bg-black px-4 py-2 text-sm text-white hover:bg-slate-900 transition-colors font-medium dark:bg-slate-950 dark:hover:bg-black"
              >
                <Trash2 className="h-4 w-4" />
                Delete Selected ({selectedPendingIds.size})
              </button>
            )}
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800">
                <tr>
                  <th className="px-6 py-3 text-left">
                    <input
                      type="checkbox"
                      checked={pendingTools.length > 0 && selectedPendingIds.size === pendingTools.length}
                      onChange={toggleSelectAllPending}
                      className="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-500"
                    />
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900 dark:text-slate-100">Store</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900 dark:text-slate-100">Component</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900 dark:text-slate-100">Tool Type</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900 dark:text-slate-100">Tool Name</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900 dark:text-slate-100">Operation</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900 dark:text-slate-100">Supplier</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900 dark:text-slate-100">Code</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900 dark:text-slate-100">Rate</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900 dark:text-slate-100">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                {pendingTools.map((tool) => (
                  <tr key={tool.tempId} className="hover:bg-slate-50 dark:hover:bg-slate-700/30">
                    <td className="px-6 py-4">
                      <input
                        type="checkbox"
                        checked={selectedPendingIds.has(tool.tempId)}
                        onChange={() => toggleSelectPending(tool.tempId)}
                        className="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-500"
                      />
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-900 dark:text-slate-100">{tool.storeName}</td>
                    <td className="px-6 py-4 text-sm text-slate-900 dark:text-slate-100">{tool.itemName}</td>
                    <td className="px-6 py-4 text-sm text-slate-900 dark:text-slate-100">{tool.toolType}</td>
                    <td className="px-6 py-4 text-sm text-slate-900 dark:text-slate-100">{tool.toolName}</td>
                    <td className="px-6 py-4 text-sm">
                      <span className="inline-block bg-slate-200 dark:bg-slate-600 text-slate-700 dark:text-slate-300 px-2 py-1 rounded text-xs">
                        {tool.operation.name} (LS: {tool.operation.lifeSpan})
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-900 dark:text-slate-100">{tool.supplierName}</td>
                    <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">{tool.supplierCode}</td>
                    <td className="px-6 py-4 text-sm text-slate-900 dark:text-slate-100">${tool.rate.toFixed(2)}</td>
                    <td className="px-6 py-4 text-sm">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleEditPendingTool(tool)}
                          className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300"
                          title="Edit"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeletePendingTool(tool.tempId)}
                          className="p-1 rounded hover:bg-red-200 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400"
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="p-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 flex justify-between items-center">
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Ready to create {pendingTools.length} tool{pendingTools.length > 1 ? "s" : ""}
            </p>
            <button
              onClick={handleCreateAllTools}
              disabled={submitting}
              className="inline-flex items-center gap-2 rounded-lg bg-black px-6 py-2 text-white hover:bg-gray-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium dark:bg-slate-950 dark:hover:bg-black"
            >
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              Create Tools
            </button>
          </div>
        </div>
      )}

      {/* All Tools Table with Hide/View Toggle */}
      <div className="rounded-lg border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800 overflow-hidden">
        <div className="border-b border-slate-200 bg-slate-50 px-3 sm:px-6 py-3 dark:border-slate-700 dark:bg-slate-800/50 flex justify-between items-center">
          <h2 className="text-base sm:text-lg font-semibold text-slate-900 dark:text-white">
            All Tools
          </h2>
          <button
            onClick={() => setShowCreatedTools(!showCreatedTools)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-900 text-white hover:bg-slate-800 transition-colors text-sm font-medium dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200"
          >
            {showCreatedTools ? (
              <>
                <EyeOff className="h-4 w-4" />
                Hide Created Tools
              </>
            ) : (
              <>
                <Eye className="h-4 w-4" />
                View Created Tools
              </>
            )}
          </button>
        </div>

        {selectedIds.size > 0 && (
          <div className="bg-blue-50 dark:bg-blue-900/20 px-3 sm:px-6 py-3 flex items-center justify-between">
            <span className="text-xs sm:text-sm text-slate-700 dark:text-slate-300">
              {selectedIds.size} tool(s) selected
            </span>
            <button
              onClick={() => setShowBulkDeleteConfirm(true)}
              disabled={submitting}
              className="inline-flex items-center gap-1 sm:gap-2 px-3 py-1.5 sm:px-4 sm:py-2 bg-black text-white rounded-lg hover:bg-slate-900 transition text-xs sm:text-sm disabled:opacity-50 dark:bg-slate-950 dark:hover:bg-black"
            >
              <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Delete Selected</span>
              <span className="sm:hidden">Delete</span>
            </button>
          </div>
        )}

        {!showCreatedTools ? (
          <div className="px-6 py-8 text-center text-slate-500 dark:text-slate-400">
            <p className="text-sm">Click "View Created Tools" to see all tools</p>
          </div>
        ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-700/50">
              <tr>
                <th className="hidden sm:table-cell px-3 py-3 text-left text-xs font-semibold text-slate-700 dark:text-slate-300">
                  <input
                    type="checkbox"
                    checked={tools.length > 0 && selectedIds.size === tools.length}
                    onChange={toggleSelectAll}
                    className="rounded border-slate-300 dark:border-slate-600"
                  />
                </th>
                <th className="px-3 py-3 text-left text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Store
                </th>
                <th className="px-3 py-3 text-left text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Product
                </th>
                <th className="hidden sm:table-cell px-3 py-3 text-left text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Tool Type
                </th>
                <th className="hidden sm:table-cell px-3 py-3 text-left text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Tool Name
                </th>
                <th className="hidden md:table-cell px-3 py-3 text-left text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Supplier
                </th>
                <th className="hidden lg:table-cell px-3 py-3 text-left text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Code
                </th>
                <th className="hidden lg:table-cell px-3 py-3 text-left text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Rate
                </th>
                <th className="hidden xl:table-cell px-3 py-3 text-left text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Operations
                </th>
                <th className="px-3 py-3 text-center text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={10} className="px-3 py-8 text-center text-slate-500 dark:text-slate-400">
                    <div className="flex items-center justify-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span className="text-sm">Loading tools...</span>
                    </div>
                  </td>
                </tr>
              ) : tools.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-3 py-8 text-center text-slate-500 dark:text-slate-400 text-sm">
                    No tools created yet
                  </td>
                </tr>
              ) : (
                tools.map((tool) => (
                  <tr key={tool.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50">
                    <td className="hidden sm:table-cell px-3 py-3">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(tool.id)}
                        onChange={() => toggleSelect(tool.id)}
                        className="rounded border-slate-300 dark:border-slate-600"
                      />
                    </td>
                    <td className="px-3 py-3 text-xs sm:text-sm text-slate-900 dark:text-slate-100 font-medium">
                      {getStoreName(tool)}
                    </td>
                    <td className="px-3 py-3 text-xs sm:text-sm text-slate-900 dark:text-slate-100">
                      {getItemName(tool.itemId)}
                    </td>
                    <td className="hidden sm:table-cell px-3 py-3 text-xs sm:text-sm text-slate-900 dark:text-slate-100">
                      {tool.toolType}
                    </td>
                    <td className="hidden sm:table-cell px-3 py-3 text-xs sm:text-sm text-slate-900 dark:text-slate-100">
                      {tool.toolName}
                    </td>
                    <td className="hidden md:table-cell px-3 py-3 text-xs text-slate-900 dark:text-slate-100">
                      {tool.supplierName}
                    </td>
                    <td className="hidden lg:table-cell px-3 py-3 text-xs font-mono text-slate-900 dark:text-slate-100">
                      {tool.supplierCode}
                    </td>
                    <td className="hidden lg:table-cell px-3 py-3 text-xs text-slate-900 dark:text-slate-100">
                      ${tool.rate.toFixed(2)}
                    </td>
                    <td className="hidden xl:table-cell px-3 py-3 text-xs">
                      <div className="flex flex-wrap gap-1">
                        {Array.isArray(tool.operations) && tool.operations.slice(0, 2).map((op, idx) => (
                          <span
                            key={idx}
                            className="inline-block bg-slate-200 dark:bg-slate-600 text-slate-700 dark:text-slate-300 px-1.5 py-0.5 rounded text-xs font-medium"
                          >
                            {op.name} (LS: {op.lifeSpan})
                          </span>
                        ))}
                        {Array.isArray(tool.operations) && tool.operations.length > 2 && (
                          <span className="inline-block bg-slate-200 dark:bg-slate-600 text-slate-700 dark:text-slate-300 px-1.5 py-0.5 rounded text-xs font-medium">
                            +{tool.operations.length - 2} more
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-3 py-3 text-center">
                      <div className="flex gap-1 items-center justify-center">
                        <button
                          onClick={() => handleEditOpen(tool)}
                          className="p-1 text-blue-600 hover:bg-blue-50 rounded dark:text-blue-400 dark:hover:bg-blue-900/20"
                          title="Edit tool"
                        >
                          <Edit2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                        </button>
                        <button
                          onClick={() => setShowDeleteConfirm(tool.id)}
                          className="p-1 text-red-600 hover:bg-red-50 rounded dark:text-red-400 dark:hover:bg-red-900/20"
                          title="Delete tool"
                        >
                          <Trash2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        )}
      </div>

      {/* Edit Tool Modal */}
      {editingToolId && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center p-3 sm:p-4">
          <div className="bg-white dark:bg-slate-800 rounded-t-3xl sm:rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 p-4 sm:p-6">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Edit Tool</h3>
              <button
                onClick={handleEditCancel}
                className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="p-4 sm:p-6 space-y-6">
              {/* Tool Type */}
              <ModernDropdown
                label="Tool Type"
                required
                options={[
                  { value: "Holder", label: "Holder" },
                  { value: "COLLET", label: "COLLET" },
                  { value: "Centre Drill", label: "Centre Drill" },
                  { value: "Drill", label: "Drill" },
                  { value: "Drill / Cutter", label: "Drill / Cutter" },
                  { value: "Insert", label: "Insert" },
                  { value: "Reamer", label: "Reamer" },
                  { value: "Endmill", label: "Endmill" },
                  { value: "Step Drill", label: "Step Drill" },
                  { value: "Tap", label: "Tap" },
                  { value: "Chamfer Tool", label: "Chamfer Tool" },
                ]}
                value={editForm.toolType}
                onChange={(value) => setEditForm({ ...editForm, toolType: value as string })}
                placeholder="Select tool type..."
                searchPlaceholder="Search tool types..."
              />

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
                  Operation <span className="text-red-500">*</span>
                </label>
                <div className="flex gap-2">
                  <div className="flex-1">
                    <input
                      type="text"
                      placeholder="Operation name (e.g., Roughing)"
                      value={editForm.operation.name}
                      onChange={(e) => updateEditOperation("name", e.target.value)}
                      className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2 text-slate-900 placeholder-slate-400 focus:border-slate-500 focus:ring-1 focus:ring-slate-500 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
                    />
                  </div>
                  <div className="flex-1">
                    <input
                      type="text"
                      inputMode="decimal"
                      placeholder="Life Span"
                      value={editForm.operation.lifeSpan > 0 ? editForm.operation.lifeSpan : ""}
                      onChange={(e) => {
                        const val = e.target.value.replace(/[^\d.]/g, "");
                        updateEditOperation("lifeSpan", val);
                      }}
                      className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2 text-slate-900 placeholder-slate-400 focus:border-slate-500 focus:ring-1 focus:ring-slate-500 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
                    />
                  </div>
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
                Are you sure you want to delete {selectedIds.size} tool(s)? This action cannot be undone.
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
                  Delete Tools
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
