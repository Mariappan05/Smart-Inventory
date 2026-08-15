"use client";

import { useState, useEffect } from "react";
import { Plus, Loader2, Edit2, Trash2, Eye, EyeOff, X, Check, Printer } from "lucide-react";
import toast from "react-hot-toast";
import { ModernDropdown } from "@/components/ui/ModernDropdown";

type Operation = {
  name: string;
  lifeSpan: number;
};

type Component = {
  id: string;
  name: string;
  itemCode: string | null;
  description: string;
};

type Tool = {
  id: string;
  toolName: string;
  operations: Operation[];
  supplierName: string;
  supplierCode: string;
  rate: number;
  itemId: string;
};

type CalculatedToolOperation = {
  toolId: string;
  toolName: string;
  supplierName: string;
  supplierCode: string;
  rate: number;
  operationName: string;
  lifeSpan: number;
  calculatedQuantity: number;
};

type PendingPlanItem = {
  tempId: string;
  customerName: string;
  componentId: string;
  componentName: string;
  componentCode: string | null;
  componentQuantity: number;
  tools: Array<{
    toolId: string;
    toolName: string;
    supplierName: string;
    supplierCode: string;
    rate: number;
    operationName: string;
    lifeSpan: number;
    calculatedQuantity: number;
  }>;
};

type CreatedSchedule = {
  id: string;
  customerName: string;
  items: any[];
  createdAt: string;
};

const groupToolsBySupplier = (schedule: any) => {
  if (!schedule || !schedule.items) return {};
  const grouped: Record<string, { supplierName: string; supplierCode: string; tools: any[] }> = {};
  
  schedule.items.forEach((item: any) => {
    if (!item.tools) return;
    item.tools.forEach((itemTool: any) => {
      const tool = itemTool.tool;
      if (!tool) return;
      const code = tool.supplierCode || "UNKNOWN";
      if (!grouped[code]) {
        grouped[code] = {
          supplierName: tool.supplierName || "Unknown Supplier",
          supplierCode: code,
          tools: [],
        };
      }
      
      const existingTool = grouped[code].tools.find(t => t.toolName === tool.toolName);
      if (existingTool) {
        existingTool.quantity += itemTool.quantity;
      } else {
        grouped[code].tools.push({
          toolName: tool.toolName,
          rate: tool.rate || 0,
          quantity: itemTool.quantity,
          componentName: item.component?.name || "N/A",
          componentCode: item.component?.itemCode || "N/A",
        });
      }
    });
  });
  return grouped;
};

export function TentativeScheduleView({ onScheduleCreated }: { onScheduleCreated: () => void }) {
  const [customerNames, setCustomerNames] = useState<string[]>([]);
  const [components, setComponents] = useState<Component[]>([]);
  const [schedules, setSchedules] = useState<CreatedSchedule[]>([]);

  // Form state
  const [form, setForm] = useState({
    selectedCustomer: "",
    selectedComponent: "",
    componentQuantity: "",
  });

  const [pendingItems, setPendingItems] = useState<PendingPlanItem[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [calculatedTools, setCalculatedTools] = useState<CalculatedToolOperation[]>([]);

  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [showCreatedPlans, setShowCreatedPlans] = useState(false);
  const [previewSchedule, setPreviewSchedule] = useState<any | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [activeSupplierTab, setActiveSupplierTab] = useState<string>("");

  useEffect(() => {
    fetchCustomerNames();
    fetchSchedules();
  }, []);

  // Fetch components when customer is selected
  useEffect(() => {
    if (form.selectedCustomer) {
      fetchComponentsForCustomer(form.selectedCustomer);
    } else {
      setComponents([]);
      setCalculatedTools([]);
      setForm({ ...form, selectedComponent: "", componentQuantity: "" });
    }
  }, [form.selectedCustomer]);

  // Fetch and calculate tools when component is selected
  useEffect(() => {
    if (form.selectedComponent && form.componentQuantity) {
      fetchToolsAndCalculate(form.selectedComponent, parseFloat(form.componentQuantity));
    } else {
      setCalculatedTools([]);
    }
  }, [form.selectedComponent, form.componentQuantity]);

  const fetchCustomerNames = async () => {
    try {
      const res = await fetch("/api/monthly-schedule/data?action=customer-names");
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setCustomerNames(data.data);
      }
    } catch (error) {
      console.error("Error fetching customer names:", error);
      toast.error("Failed to fetch customer names");
    }
  };

  const fetchComponentsForCustomer = async (customerName: string) => {
    try {
      const res = await fetch(`/api/monthly-schedule/data?action=components&customerName=${encodeURIComponent(customerName)}`);
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setComponents(data.data);
      }
    } catch (error) {
      console.error("Error fetching components:", error);
      toast.error("Failed to fetch components");
    }
  };

  const fetchToolsAndCalculate = async (componentId: string, quantity: number) => {
    try {
      const res = await fetch(`/api/monthly-schedule/data?action=tools&componentIds=${componentId}`);
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        const tools = data.data as Tool[];
        const expandedOperations: CalculatedToolOperation[] = [];

        tools.forEach((tool) => {
          // Parse operations if it's a string (from JSON in database)
          const operations = typeof tool.operations === 'string' 
            ? JSON.parse(tool.operations) 
            : tool.operations;

          if (operations && Array.isArray(operations) && operations.length > 0) {
            operations.forEach((operation: Operation) => {
              expandedOperations.push({
                toolId: tool.id,
                toolName: tool.toolName,
                supplierName: tool.supplierName,
                supplierCode: tool.supplierCode,
                rate: tool.rate,
                operationName: operation.name,
                lifeSpan: operation.lifeSpan,
                calculatedQuantity: Math.ceil(quantity / (operation.lifeSpan > 0 ? operation.lifeSpan : 1)),
              });
            });
          }
        });

        setCalculatedTools(expandedOperations);
      }
    } catch (error) {
      console.error("Error fetching tools:", error);
      toast.error("Failed to fetch tools");
    }
  };

  const fetchSchedules = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/monthly-schedule/tentative");
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setSchedules(data.data);
      } else if (Array.isArray(data)) {
        setSchedules(data);
      }
    } catch (error) {
      console.error("Error fetching schedules:", error);
    } finally {
      setLoading(false);
    }
  };

  const getSelectedComponentName = () => {
    const component = components.find((c) => c.id === form.selectedComponent);
    return component ? component.name : "";
  };

  const handleAddItem = () => {
    if (!form.selectedCustomer.trim()) {
      toast.error("Please select a customer");
      return;
    }

    if (!form.selectedComponent.trim()) {
      toast.error("Please select a component");
      return;
    }

    if (!form.componentQuantity || parseFloat(form.componentQuantity) <= 0) {
      toast.error("Please enter a valid quantity");
      return;
    }

    if (calculatedTools.length === 0) {
      toast.error("No tools available for this component");
      return;
    }

    const component = components.find((c) => c.id === form.selectedComponent);
    const newQuantity = parseFloat(form.componentQuantity);

    // Check for duplicate component when not editing
    if (!editingId) {
      const existingItem = pendingItems.find(
        (item) => item.componentId === form.selectedComponent
      );

      if (existingItem) {
        // Update existing item's quantity and recalculate tool quantities
        const updatedItems = pendingItems.map((item) => {
          if (item.componentId === form.selectedComponent) {
            const newTotalQuantity = item.componentQuantity + newQuantity;
            return {
              ...item,
              componentQuantity: newTotalQuantity,
              tools: calculatedTools.map((tool) => ({
                ...tool,
                calculatedQuantity: Math.ceil(newTotalQuantity / (tool.lifeSpan > 0 ? tool.lifeSpan : 1)),
              })),
            };
          }
          return item;
        });
        setPendingItems(updatedItems);
        toast.success("This Component already exists. Quantity updated.");

        // Reset form
        setForm({ selectedCustomer: "", selectedComponent: "", componentQuantity: "" });
        setCalculatedTools([]);
        setShowForm(false);
        return;
      }
    }

    const newItem: PendingPlanItem = {
      tempId: editingId || `temp-${Date.now()}`,
      customerName: form.selectedCustomer,
      componentId: form.selectedComponent,
      componentName: component?.name || "",
      componentCode: component?.itemCode || null,
      componentQuantity: newQuantity,
      tools: calculatedTools.map((tool) => ({
        toolId: tool.toolId,
        toolName: tool.toolName,
        supplierName: tool.supplierName,
        supplierCode: tool.supplierCode,
        rate: tool.rate,
        operationName: tool.operationName,
        lifeSpan: tool.lifeSpan,
        calculatedQuantity: tool.calculatedQuantity,
      })),
    };

    if (editingId) {
      setPendingItems(
        pendingItems.map((item) =>
          item.tempId === editingId ? newItem : item
        )
      );
      setEditingId(null);
      toast.success("Plan item updated");
    } else {
      setPendingItems([...pendingItems, newItem]);
      toast.success("Item added to plan");
    }

    // Reset form
    setForm({ selectedCustomer: "", selectedComponent: "", componentQuantity: "" });
    setCalculatedTools([]);
    setShowForm(false);
  };

  const handleEditItem = (item: PendingPlanItem) => {
    setForm({
      selectedCustomer: item.customerName,
      selectedComponent: item.componentId,
      componentQuantity: item.componentQuantity.toString(),
    });
    setEditingId(item.tempId);
    setShowForm(true);
  };

  const handleDeleteItem = (tempId: string) => {
    setPendingItems(pendingItems.filter((item) => item.tempId !== tempId));
    if (editingId === tempId) {
      setEditingId(null);
      setForm({ selectedCustomer: "", selectedComponent: "", componentQuantity: "" });
      setCalculatedTools([]);
      setShowForm(false);
    }
    toast.success("Item removed");
  };

  const handleCreatePlan = async () => {
    if (pendingItems.length === 0) {
      toast.error("Please add at least one item to the plan");
      return;
    }

    try {
      setSubmitting(true);
      const res = await fetch("/api/monthly-schedule/tentative", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: pendingItems.map((item) => ({
            customerName: item.customerName,
            componentId: item.componentId,
            componentName: item.componentName,
            componentCode: item.componentCode,
            quantity: item.componentQuantity,
            componentQuantity: item.componentQuantity,
            tools: item.tools.map((tool) => ({
              toolId: tool.toolId,
              toolName: tool.toolName,
              quantity: tool.calculatedQuantity,
            })),
          })),
        }),
      });

      const data = await res.json();
      if (data.success) {
        toast.success("Plan draft saved. Please preview and confirm.");
        setPendingItems([]);
        fetchSchedules();
        onScheduleCreated();
        
        // Open the bill preview modal
        setPreviewSchedule(data.data);
        const grouped = groupToolsBySupplier(data.data);
        const codes = Object.keys(grouped);
        if (codes.length > 0) {
          setActiveSupplierTab(codes[0]);
        }
      } else {
        toast.error(data.error || "Failed to create plan");
      }
    } catch (error) {
      console.error("Error creating plan:", error);
      toast.error("Failed to create plan");
    } finally {
      setSubmitting(false);
    }
  };

  const handleConfirmSchedule = async () => {
    if (!previewSchedule) return;
    try {
      setConfirming(true);
      const res = await fetch("/api/monthly-schedule/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: previewSchedule.id }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Schedule finalized and moved to Final Plan!");
        setPreviewSchedule(null);
        fetchSchedules();
        onScheduleCreated();
      } else {
        toast.error(data.error || "Failed to confirm schedule");
      }
    } catch (error) {
      console.error("Error confirming schedule:", error);
      toast.error("Failed to confirm schedule");
    } finally {
      setConfirming(false);
    }
  };

  const handleDeleteSchedule = async (id: string) => {
    if (!confirm("Are you sure you want to delete this tentative plan?")) return;
    try {
      const res = await fetch(`/api/monthly-schedule/tentative?id=${id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Tentative plan deleted");
        fetchSchedules();
      } else {
        toast.error(data.error || "Failed to delete plan");
      }
    } catch (error) {
      console.error("Error deleting schedule:", error);
      toast.error("Failed to delete plan");
    }
  };

  const handleViewPreview = (schedule: any) => {
    setPreviewSchedule(schedule);
    const grouped = groupToolsBySupplier(schedule);
    const codes = Object.keys(grouped);
    if (codes.length > 0) {
      setActiveSupplierTab(codes[0]);
    }
  };

  const customerOptions = customerNames.map((name) => ({
    value: name,
    label: name,
  }));

  const componentOptions = components.map((comp) => ({
    value: comp.id,
    label: comp.name,
    subtitle: `Code: ${comp.itemCode || "N/A"}`,
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-lg border border-slate-200 bg-white/70 p-6 dark:border-slate-700 dark:bg-slate-900/70">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
          Tentative Plan
        </h2>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
          Create and manage tentative plans by selecting customers and components
        </p>
      </div>

      {/* Initial State: Show Create Plan Button */}
      {!showForm && pendingItems.length === 0 && (
        <button
          onClick={() => {
            setShowForm(true);
            setForm({ selectedCustomer: "", selectedComponent: "", componentQuantity: "" });
            setComponents([]);
            setCalculatedTools([]);
          }}
          className="inline-flex items-center gap-2 rounded-lg bg-black px-6 py-2 text-white hover:bg-gray-900 transition-colors font-medium dark:bg-slate-950 dark:hover:bg-black"
        >
          <Plus className="h-4 w-4" />
          Create Plan
        </button>
      )}

      {/* Form Section */}
      {showForm && (
        <div className="rounded-lg border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-800">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-6">
            {editingId ? "Edit Plan Item" : "Add New Plan Item"}
          </h3>

          <div className="space-y-6">
            {/* Customer Selection */}
            <ModernDropdown
              label="Customer Name"
              required
              options={customerOptions}
              value={form.selectedCustomer}
              onChange={(value) => {
                setForm({ 
                  ...form, 
                  selectedCustomer: value as string, 
                  selectedComponent: "", 
                  componentQuantity: "" 
                });
                setComponents([]);
                setCalculatedTools([]);
              }}
              placeholder="Select customer..."
              searchPlaceholder="Search customers..."
            />

            {/* Component Selection */}
            {form.selectedCustomer && (
              <ModernDropdown
                label="Component Name"
                required
                options={componentOptions}
                value={form.selectedComponent}
                onChange={(value) => setForm({ ...form, selectedComponent: value as string })}
                placeholder="Select component..."
                searchPlaceholder="Search components..."
              />
            )}

            {/* Quantity Input */}
            {form.selectedComponent && (
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Quantity <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min="1"
                  placeholder="Enter quantity"
                  value={form.componentQuantity}
                  onChange={(e) => setForm({ ...form, componentQuantity: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2 text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
                />
              </div>
            )}

            {/* Calculated Tools Display */}
            {calculatedTools.length > 0 && (
              <div className="border-t border-slate-200 dark:border-slate-700 pt-6">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-4">
                  Calculated Tool Quantities
                </label>
                <div className="space-y-2">
                  {calculatedTools.map((tool, idx) => (
                    <div key={`${tool.toolId}-${tool.operationName}-${idx}`} className="flex items-center justify-between p-3 rounded-lg border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700/50">
                      <div>
                        <p className="font-medium text-slate-900 dark:text-slate-100 text-sm">
                          {tool.toolName} → {tool.operationName}
                        </p>
                        <p className="text-xs text-slate-600 dark:text-slate-400">
                          {tool.supplierName} ({tool.supplierCode}) | Life Span: {tool.lifeSpan}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-blue-600 dark:text-blue-400">
                          Qty: {tool.calculatedQuantity}
                        </p>
                        <p className="text-xs text-slate-600 dark:text-slate-400">
                          ({form.componentQuantity} ÷ {tool.lifeSpan})
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Buttons */}
            <div className="flex gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
              <button
                type="button"
                onClick={handleAddItem}
                className="inline-flex items-center gap-2 rounded-lg bg-black px-6 py-2 text-white hover:bg-gray-900 transition-colors font-medium dark:bg-slate-950 dark:hover:bg-black"
              >
                <Plus className="h-4 w-4" />
                {editingId ? "Update Item" : "Add Item"}
              </button>
              {editingId && (
                <button
                  type="button"
                  onClick={() => {
                    setEditingId(null);
                    setForm({ selectedCustomer: "", selectedComponent: "", componentQuantity: "" });
                    setCalculatedTools([]);
                    setShowForm(false);
                  }}
                  className="rounded-lg border border-slate-300 px-6 py-2 text-slate-700 hover:bg-slate-50 transition-colors dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700 font-medium"
                >
                  Cancel
                </button>
              )}
              {!editingId && (
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setForm({ selectedCustomer: "", selectedComponent: "", componentQuantity: "" });
                    setCalculatedTools([]);
                  }}
                  className="rounded-lg border border-slate-300 px-6 py-2 text-slate-700 hover:bg-slate-50 transition-colors dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700 font-medium"
                >
                  Close Form
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Add More Item Button */}
      {!showForm && pendingItems.length > 0 && (
        <button
          onClick={() => {
            setShowForm(true);
            setForm({ selectedCustomer: "", selectedComponent: "", componentQuantity: "" });
            setComponents([]);
            setCalculatedTools([]);
            setEditingId(null);
          }}
          className="inline-flex items-center gap-2 rounded-lg bg-black px-6 py-2 text-white hover:bg-gray-900 transition-colors font-medium dark:bg-slate-950 dark:hover:bg-black"
        >
          <Plus className="h-4 w-4" />
          Add More Item
        </button>
      )}

      {/* Pending Items Table */}
      {pendingItems.length > 0 && (
        <div className="rounded-lg border border-slate-200 dark:border-slate-700 overflow-x-auto">
          <div className="border-b border-slate-200 bg-slate-50 px-6 py-3 dark:border-slate-700 dark:bg-slate-800/50">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
              Plan Items to Create (Details)
            </h2>
          </div>
          <table className="w-full text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800">
              <tr>
                <th className="px-3 py-3 text-left font-semibold text-slate-900 dark:text-slate-100">
                  Customer
                </th>
                <th className="px-3 py-3 text-left font-semibold text-slate-900 dark:text-slate-100">
                  Component
                </th>
                <th className="px-3 py-3 text-left font-semibold text-slate-900 dark:text-slate-100">
                  Code
                </th>
                <th className="px-3 py-3 text-left font-semibold text-slate-900 dark:text-slate-100">
                  Tool Name
                </th>
                <th className="px-3 py-3 text-left font-semibold text-slate-900 dark:text-slate-100">
                  Operation
                </th>
                <th className="px-3 py-3 text-center font-semibold text-slate-900 dark:text-slate-100">
                  Life Span
                </th>
                <th className="px-3 py-3 text-center font-semibold text-slate-900 dark:text-slate-100">
                  Comp. Qty
                </th>
                <th className="px-3 py-3 text-center font-semibold text-slate-900 dark:text-slate-100">
                  Tool Qty
                </th>
                <th className="px-3 py-3 text-center font-semibold text-slate-900 dark:text-slate-100">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
              {pendingItems.flatMap((item) =>
                item.tools.map((tool, toolIdx) => (
                  <tr
                    key={`${item.tempId}-${tool.toolId}-${tool.operationName}-${toolIdx}`}
                    className="hover:bg-slate-50 dark:hover:bg-slate-700/30"
                  >
                    <td className="px-3 py-3 text-slate-900 dark:text-slate-100">
                      {item.customerName}
                    </td>
                    <td className="px-3 py-3 text-slate-900 dark:text-slate-100">
                      {item.componentName}
                    </td>
                    <td className="px-3 py-3 text-slate-600 dark:text-slate-400">
                      {item.componentCode || "N/A"}
                    </td>
                    <td className="px-3 py-3 text-slate-900 dark:text-slate-100">
                      {tool.toolName}
                    </td>
                    <td className="px-3 py-3 text-slate-900 dark:text-slate-100">
                      {tool.operationName}
                    </td>
                    <td className="px-3 py-3 text-center text-slate-600 dark:text-slate-400">
                      {tool.lifeSpan}
                    </td>
                    <td className="px-3 py-3 text-center text-slate-600 dark:text-slate-400">
                      {item.componentQuantity}
                    </td>
                    <td className="px-3 py-3 text-center">
                      <span className="inline-flex items-center px-2 py-1 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs font-semibold">
                        {tool.calculatedQuantity}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => handleEditItem(item)}
                          className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300"
                          title="Edit component"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteItem(item.tempId)}
                          className="p-1 rounded hover:bg-red-200 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400"
                          title="Delete component"
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
          <div className="p-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 flex justify-between items-center">
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Ready to create {pendingItems.length} component{pendingItems.length > 1 ? "s" : ""} with {pendingItems.reduce((sum, item) => sum + item.tools.length, 0)} tool operation{pendingItems.reduce((sum, item) => sum + item.tools.length, 0) > 1 ? "s" : ""}
            </p>
            <button
              onClick={handleCreatePlan}
              disabled={submitting}
              className="inline-flex items-center gap-2 rounded-lg bg-black px-6 py-2 text-white hover:bg-gray-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium dark:bg-slate-950 dark:hover:bg-black"
            >
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              Create Plan
            </button>
          </div>
        </div>
      )}

      {/* Created Schedules List */}
      <div className="rounded-lg border border-slate-200 dark:border-slate-700 overflow-x-auto">
        <div className="border-b border-slate-200 bg-slate-50 px-6 py-3 dark:border-slate-700 dark:bg-slate-800/50 flex justify-between items-center">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
            Created Plans ({schedules.length})
          </h2>
          <button
            onClick={() => setShowCreatedPlans(!showCreatedPlans)}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 text-sm font-medium transition-colors"
            title={showCreatedPlans ? "Hide Created Plans" : "View Created Plans"}
          >
            {showCreatedPlans ? (
              <>
                <EyeOff className="h-4 w-4" />
                Hide Created Plans
              </>
            ) : (
              <>
                <Eye className="h-4 w-4" />
                View Created Plans
              </>
            )}
          </button>
        </div>
        {showCreatedPlans && (
          <table className="w-full">
            <thead className="border-b border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900 dark:text-slate-100">
                  Customer
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900 dark:text-slate-100">
                  Items
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900 dark:text-slate-100">
                  Created At
                </th>
                <th className="px-6 py-3 text-center text-sm font-semibold text-slate-900 dark:text-slate-100 w-32">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-slate-500 dark:text-slate-400">
                    <div className="flex items-center justify-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Loading plans...
                    </div>
                  </td>
                </tr>
              ) : schedules.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-slate-500 dark:text-slate-400">
                    No plans created yet
                  </td>
                </tr>
              ) : (
                schedules.map((schedule) => (
                  <tr key={schedule.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30">
                    <td className="px-6 py-4 text-sm text-slate-900 dark:text-slate-100">
                      {schedule.customerName}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">
                      {schedule.items?.length || 0} item{schedule.items?.length !== 1 ? "s" : ""}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">
                      {new Date(schedule.createdAt).toLocaleDateString("en-GB", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                      })}
                    </td>
                    <td className="px-6 py-4 text-sm text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleViewPreview(schedule)}
                          className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-blue-600 dark:text-blue-400"
                          title="Preview bill/schedule"
                        >
                          <Eye className="h-4.5 w-4.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteSchedule(schedule.id)}
                          className="p-1 rounded hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400"
                          title="Delete tentative plan"
                        >
                          <Trash2 className="h-4.5 w-4.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
        {!showCreatedPlans && (
          <div className="px-6 py-8 text-center text-slate-500 dark:text-slate-400">
            Click 'View Created Plans' to see all plans
          </div>
        )}
      </div>

      {previewSchedule && (
        <BillPreviewModal
          schedule={previewSchedule}
          onClose={() => setPreviewSchedule(null)}
          onConfirm={handleConfirmSchedule}
          confirming={confirming}
          activeSupplierTab={activeSupplierTab}
          setActiveSupplierTab={setActiveSupplierTab}
        />
      )}
    </div>
  );
}

interface BillPreviewModalProps {
  schedule: any;
  onClose: () => void;
  onConfirm: () => void;
  confirming: boolean;
  activeSupplierTab: string;
  setActiveSupplierTab: (tab: string) => void;
}

function BillPreviewModal({
  schedule,
  onClose,
  onConfirm,
  confirming,
  activeSupplierTab,
  setActiveSupplierTab,
}: BillPreviewModalProps) {
  const grouped = groupToolsBySupplier(schedule);
  const supplierCodes = Object.keys(grouped);

  if (supplierCodes.length === 0) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
        <div className="bg-white dark:bg-slate-800 rounded-lg p-6 max-w-md w-full shadow-2xl">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">No Tools Calculated</h3>
          <p className="text-slate-600 dark:text-slate-400 mb-6">
            There are no tools associated with the components in this schedule.
          </p>
          <div className="flex justify-end">
            <button
              onClick={onClose}
              className="bg-black text-white px-4 py-2 rounded-lg hover:bg-slate-800 dark:bg-slate-750 dark:hover:bg-black font-medium"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  const activeSupplierCode = activeSupplierTab || supplierCodes[0];
  const activeSupplier = grouped[activeSupplierCode] || grouped[supplierCodes[0]];

  // Calculate pricing values for the summary card
  const pricingDetails = activeSupplier.tools.map((t: any) => {
    const subtotal = t.rate * t.quantity;
    const gst = subtotal * 0.18;
    const total = subtotal + gst;
    return { subtotal, gst, total };
  });

  const subtotalSum = pricingDetails.reduce((sum, d) => sum + d.subtotal, 0);
  const gstSum = pricingDetails.reduce((sum, d) => sum + d.gst, 0);
  const grandTotalSum = pricingDetails.reduce((sum, d) => sum + d.total, 0);

  const monthYearStr = (() => {
    try {
      const d = new Date(schedule.createdAt);
      return `${d.toLocaleString('default', { month: 'short' }).toUpperCase()}'${d.getFullYear().toString().slice(-2)}`;
    } catch {
      return "MAY'26";
    }
  })();

  const fullMonthStr = (() => {
    try {
      return new Date(schedule.createdAt).toLocaleString('default', { month: 'long' }).toUpperCase();
    } catch {
      return "MAY";
    }
  })();

  const yearStr = (() => {
    try {
      return new Date(schedule.createdAt).getFullYear();
    } catch {
      return 2026;
    }
  })();

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-slate-900/60 backdrop-blur-sm overflow-y-auto p-4 md:p-6">
      <div className="bg-white dark:bg-slate-900 rounded-xl max-w-[900px] w-full mx-auto shadow-2xl flex flex-col min-h-[90vh]">
        {/* Modal Header */}
        <div className="flex justify-between items-center px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900">
          <div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">Schedule / Bill Preview</h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
              Verify the schedule format and values before finalizing.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-6 p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          {/* Supplier Tabs Selection */}
          <div className="md:col-span-1 border-r border-slate-200 dark:border-slate-800 pr-4 space-y-2">
            <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Suppliers</h4>
            {supplierCodes.map((code) => (
              <button
                key={code}
                onClick={() => setActiveSupplierTab(code)}
                className={`w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  activeSupplierCode === code
                    ? "bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"
                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                }`}
              >
                {grouped[code].supplierName}
                <span className="block text-[10px] text-slate-400 dark:text-slate-500 mt-0.5 font-mono">
                  Code: {code}
                </span>
              </button>
            ))}
          </div>

          {/* PDF Preview Content */}
          <div className="md:col-span-3 flex flex-col space-y-6">
            {/* The PDF Sheet Layout */}
            <div className="border border-slate-300 dark:border-slate-700 bg-white text-slate-800 p-8 shadow-sm text-[12px] leading-relaxed max-w-[700px] w-full mx-auto select-none">
              
              {/* Autotech Letterhead */}
              <div className="flex justify-between border-b border-slate-300 pb-4 mb-6">
                <div className="space-y-1">
                  <p className="text-[10px] text-slate-500 font-mono">PM/SCH/{yearStr - 1}-{yearStr}</p>
                  <p className="text-[11px] font-semibold text-slate-700">GSTIN: 33AABCA9902B1Z9</p>
                  <p className="text-[11px] font-semibold text-slate-700">CIN: U29309TN1997PTC039348</p>
                </div>
                <div className="text-right text-slate-900 dark:text-slate-900">
                  <h2 className="text-[13px] font-bold tracking-wide uppercase font-sans">
                    AUTOTECH INDUSTRIES (INDIA) PRIVATE LIMITED
                  </h2>
                  <p className="text-[11px] text-slate-600">SP114,</p>
                  <p className="text-[11px] text-slate-600">AMBATTUR INDUSTRIAL ESTATE</p>
                  <p className="text-[11px] text-slate-600">CHENNAI</p>
                  <p className="text-[11px] text-slate-600">Phone:2688 0151, 2688 0329</p>
                  <p className="text-[10px] text-blue-600 font-mono tracking-wider">WWW.AUTOTECHINDUSTRIES.COM</p>
                </div>
              </div>

              {/* Recipient and Meta Info */}
              <div className="grid grid-cols-2 gap-4 mb-6 text-slate-900">
                <div>
                  <p className="font-bold text-slate-900 uppercase">TO</p>
                  <p className="font-bold text-slate-800 text-[12px]">M/s. {activeSupplier.supplierName},</p>
                  <p className="text-slate-600 uppercase">DP NO.120A,(SP),,</p>
                  <p className="text-slate-600 uppercase">AMBATTUR INDUSTRIAL ESTATE,,</p>
                  <p className="text-slate-600 uppercase">CHENNAI-600058,</p>
                  <p className="text-slate-600 font-mono">600058</p>
                </div>
                <div className="text-right space-y-1">
                  <p className="text-slate-750"><span className="font-bold">P.O. Ref. :</span> -1500007</p>
                  <p className="text-slate-750">
                    <span className="font-bold">Schedule No. :</span> SH-SP114-{schedule.id.substring(schedule.id.length - 7).toUpperCase()}
                  </p>
                  <p className="text-slate-750">
                    <span className="font-bold">Date :</span> {new Date(schedule.createdAt).toLocaleDateString("en-GB")}
                  </p>
                  <p className="text-slate-750"><span className="font-bold">Date :</span> {new Date(schedule.createdAt).toLocaleDateString("en-GB")}</p>
                </div>
              </div>

              {/* Subject */}
              <div className="border-y border-slate-300 py-2.5 mb-6 text-center font-bold text-slate-900 uppercase tracking-wider bg-slate-50/55">
                SUB : SCHEDULE FOR THE MONTH OF {monthYearStr}
              </div>

              <p className="mb-4 text-slate-800 font-sans">Dear Sir,</p>
              <p className="mb-6 text-slate-800 font-sans">
                WE GIVE BELOW OUR SCHEDULE FOR THE MONTH OF {fullMonthStr} &nbsp;&nbsp;&nbsp;&nbsp; PLEASE STRICTLY ADHERE THE CONDITION MENTIONED BELOW
              </p>

              <h3 className="text-center font-bold text-slate-900 tracking-wider mb-4 uppercase">
                CONFIRMED SCHEDULE
              </h3>

              {/* Table */}
              <table className="w-full border-collapse border border-slate-400 text-[11px] mb-8 text-slate-900">
                <thead>
                  <tr className="bg-slate-55/60">
                    <th className="border border-slate-400 px-3 py-2 text-center w-16 font-bold">S.NO</th>
                    <th className="border border-slate-400 px-4 py-2 text-left font-bold">ITEM</th>
                    <th className="border border-slate-400 px-4 py-2 text-center w-32 font-bold">{monthYearStr}</th>
                  </tr>
                </thead>
                <tbody>
                  {activeSupplier.tools.map((t: any, idx: number) => (
                    <tr key={idx} className="hover:bg-slate-50/30">
                      <td className="border border-slate-400 px-3 py-2.5 text-center font-mono">{idx + 1}</td>
                      <td className="border border-slate-400 px-4 py-2.5 font-mono">{t.toolName}</td>
                      <td className="border border-slate-400 px-4 py-2.5 text-center font-bold font-mono">{t.quantity} NOS</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Signatures and Standard Notes */}
              <div className="space-y-4 text-[10px] text-slate-600 leading-relaxed border-t border-slate-200 pt-4">
                <p className="font-bold text-slate-800 uppercase tracking-wide">
                  THIS SCHEDULE SUPERCEDES ALL THE EARLIER SCHEDULES. Kindly note to FOLLOW the DATES of delivery STRICTLY.
                </p>
                <p>
                  <span className="font-bold text-slate-800">NOTE :</span> Kindly complete the scheduled work before &nbsp;
                  <span className="font-bold text-slate-800">30 {fullMonthStr} {yearStr}</span>&nbsp; of every month. We will appreciate your confirmation by return fax and look forward to receive despatch plan at the earliest.
                </p>
                <p>
                  Kindly note to submit your bills and materials at our &nbsp;
                  <span className="font-bold text-slate-800">F5, AMBATTUR INDUSTRIAL ESTATE AMBATTUR CHENNAI 600058</span>.
                </p>
                <p>
                  Bills should be in the name of Autotech Industries(India) Pvt. Ltd., SP-114, Ambattur Industrial Estate, Chennai-600 058.
                </p>
                <div className="flex justify-between pt-8 items-end">
                  <div>
                    <p className="font-bold text-slate-800 uppercase text-[9px]">REGARDS,</p>
                    <p className="h-10"></p>
                    <p className="font-bold text-slate-800 uppercase text-[9px]">SIGNATURE</p>
                  </div>
                </div>
              </div>

              {/* Running metadata */}
              <div className="flex justify-between border-t border-slate-200 mt-8 pt-2 text-[9px] text-slate-400 font-mono">
                <p>POM4255 Run By : MURALI</p>
                <p>Page 1 of 1</p>
                <p>Run On : {new Date(schedule.createdAt).toLocaleDateString("en-GB")} {new Date(schedule.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</p>
              </div>
            </div>

            {/* Calculations Card */}
            <div className="bg-slate-50 dark:bg-slate-800/50 p-5 rounded-lg border border-slate-200 dark:border-slate-700">
              <h4 className="font-semibold text-slate-900 dark:text-white text-sm mb-3">
                Calculated Billing Summary ({activeSupplier.supplierName})
              </h4>
              <div className="space-y-3">
                <div className="max-h-[150px] overflow-y-auto space-y-2 pr-2">
                  {activeSupplier.tools.map((t: any, idx: number) => (
                    <div key={idx} className="flex justify-between text-xs font-mono text-slate-600 dark:text-slate-400">
                      <span>
                        {t.toolName} ({t.quantity} NOS &times; ₹{t.rate.toFixed(2)})
                      </span>
                      <span>₹{(t.rate * t.quantity).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
                <div className="border-t border-slate-200 dark:border-slate-700 pt-3 space-y-1.5 text-sm">
                  <div className="flex justify-between text-slate-600 dark:text-slate-400">
                    <span>Subtotal</span>
                    <span className="font-mono">₹{subtotalSum.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-slate-600 dark:text-slate-400">
                    <span>GST (18%)</span>
                    <span className="font-mono">₹{gstSum.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-base text-blue-600 dark:text-blue-400 pt-2 border-t border-dashed border-slate-200 dark:border-slate-700">
                    <span>Grand Total (incl. GST)</span>
                    <span className="font-mono">₹{grandTotalSum.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 flex justify-between gap-3 rounded-b-xl">
          <p className="text-xs text-slate-500 dark:text-slate-400 self-center">
            Finalizing creates a schedule in the final plan and deletes this tentative plan.
          </p>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="rounded-lg border border-slate-300 px-5 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700 font-medium"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              disabled={confirming}
              className="inline-flex items-center gap-2 rounded-lg bg-black px-6 py-2 text-sm text-white hover:bg-gray-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium dark:bg-slate-950 dark:hover:bg-black"
            >
              {confirming ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Moving to Final Plan...
                </>
              ) : (
                <>
                  <Check className="h-4 w-4" />
                  Confirm & Move to Final Plan
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
