"use client";

import { useState, useEffect } from "react";
import { Plus, Loader2, Edit2, Trash2 } from "lucide-react";
import toast from "react-hot-toast";

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
  const [customerSearch, setCustomerSearch] = useState("");
  const [componentSearch, setComponentSearch] = useState("");
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const [showComponentDropdown, setShowComponentDropdown] = useState(false);

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
                calculatedQuantity: Math.ceil(quantity / operation.lifeSpan),
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
      const res = await fetch("/api/monthly-schedule");
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
                calculatedQuantity: Math.ceil(newTotalQuantity / tool.lifeSpan),
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
        toast.success("Plan created successfully!");
        setPendingItems([]);
        fetchSchedules();
        onScheduleCreated();
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

  const filteredCustomers = customerNames.filter((name) =>
    name.toLowerCase().includes(customerSearch.toLowerCase())
  );

  const filteredComponents = components.filter((comp) =>
    comp.name.toLowerCase().includes(componentSearch.toLowerCase())
  );

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
            setCustomerSearch("");
            setComponentSearch("");
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
            <div className="relative">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Customer Name <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search and select customer..."
                  value={showCustomerDropdown ? customerSearch : form.selectedCustomer}
                  onChange={(e) => {
                    if (showCustomerDropdown) {
                      setCustomerSearch(e.target.value);
                    }
                  }}
                  onFocus={() => {
                    setShowCustomerDropdown(true);
                    setComponentSearch("");
                    setShowComponentDropdown(false);
                  }}
                  className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2 text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
                />
                {showCustomerDropdown && (
                  <div className="absolute top-full left-0 right-0 mt-1 max-h-48 overflow-y-auto rounded-lg border border-slate-300 bg-white dark:border-slate-600 dark:bg-slate-700 shadow-lg z-10">
                    {filteredCustomers.map((customer) => (
                      <button
                        key={customer}
                        type="button"
                        onClick={() => {
                          setForm({ 
                            ...form, 
                            selectedCustomer: customer, 
                            selectedComponent: "", 
                            componentQuantity: "" 
                          });
                          setShowCustomerDropdown(false);
                          setCustomerSearch("");
                          setComponents([]);
                          setCalculatedTools([]);
                          setComponentSearch("");
                        }}
                        className="w-full text-left px-4 py-2 hover:bg-slate-100 dark:hover:bg-slate-600 text-slate-900 dark:text-slate-100"
                      >
                        {customer}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Component Selection */}
            {form.selectedCustomer && (
              <div className="relative">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Component Name <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search and select component..."
                    value={showComponentDropdown ? componentSearch : getSelectedComponentName()}
                    onChange={(e) => {
                      if (showComponentDropdown) {
                        setComponentSearch(e.target.value);
                      }
                    }}
                    onFocus={() => {
                      setShowComponentDropdown(true);
                      setComponentSearch("");
                    }}
                    className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2 text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
                  />
                  {showComponentDropdown && (
                    <div className="absolute top-full left-0 right-0 mt-1 max-h-48 overflow-y-auto rounded-lg border border-slate-300 bg-white dark:border-slate-600 dark:bg-slate-700 shadow-lg z-10">
                      {filteredComponents.map((component) => (
                        <button
                          key={component.id}
                          type="button"
                          onClick={() => {
                            setForm({ ...form, selectedComponent: component.id });
                            setShowComponentDropdown(false);
                            setComponentSearch("");
                          }}
                          className="w-full text-left px-4 py-2 hover:bg-slate-100 dark:hover:bg-slate-600 text-slate-900 dark:text-slate-100"
                        >
                          {component.name} ({component.itemCode || "N/A"})
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
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
            setCustomerSearch("");
            setComponentSearch("");
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
        <div className="border-b border-slate-200 bg-slate-50 px-6 py-3 dark:border-slate-700 dark:bg-slate-800/50">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
            Created Plans ({schedules.length})
          </h2>
        </div>
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
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
            {loading ? (
              <tr>
                <td colSpan={3} className="px-6 py-8 text-center text-slate-500 dark:text-slate-400">
                  <div className="flex items-center justify-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Loading plans...
                  </div>
                </td>
              </tr>
            ) : schedules.length === 0 ? (
              <tr>
                <td colSpan={3} className="px-6 py-8 text-center text-slate-500 dark:text-slate-400">
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
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
