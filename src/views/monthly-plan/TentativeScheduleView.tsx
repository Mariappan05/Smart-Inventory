"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { X, Plus, Loader2, ChevronDown } from "lucide-react";
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
  item: {
    id: string;
    name: string;
  };
};

type SelectedComponent = {
  selectionId: string; // Unique ID for this selection instance
  id: string;
  name: string;
  itemCode: string | null;
  quantity: number;
  customerName: string;
  tools: {
    toolId: string;
    operationIndex: number;
    toolName: string;
    supplierName: string;
    supplierCode: string;
    rate: number;
    operations: Operation[];
    selectedOperation: Operation | null;
    quantity: number;
    displayName: string;
  }[];
};

type Schedule = {
  id: string;
  customerName: string;
  items: any[];
  createdAt: string;
};

export function TentativeScheduleView({ onScheduleCreated }: { onScheduleCreated: () => void }) {
  const [customerNames, setCustomerNames] = useState<string[]>([]);
  const [components, setComponents] = useState<Component[]>([]);
  const [componentsByCustomer, setComponentsByCustomer] = useState<Map<string, Component[]>>(new Map());
  const [allTools, setAllTools] = useState<Tool[]>([]);
  const [schedules, setSchedules] = useState<Schedule[]>([]);

  const [selectedCustomers, setSelectedCustomers] = useState<string[]>([]);
  const [selectedComponents, setSelectedComponents] = useState<SelectedComponent[]>([]);
  const [componentSearch, setComponentSearch] = useState("");
  const [customerSearch, setCustomerSearch] = useState("");
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const [showComponentDropdown, setShowComponentDropdown] = useState(false);

  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);

  // Track which component IDs we've already fetched tools for to prevent infinite loops
  const fetchedComponentIdsRef = useRef<Set<string>>(new Set());
  const isFetchingRef = useRef(false);

  // Memoize component IDs to use as stable dependency
  const componentIdString = useMemo(() => {
    return selectedComponents.map((c) => c.id).sort().join(',');
  }, [selectedComponents]);
  useEffect(() => {
    fetchCustomerNames();
    fetchSchedules();
  }, []);

  // Fetch components when customers are selected
  useEffect(() => {
    if (selectedCustomers.length > 0) {
      fetchComponentsForAllCustomers(selectedCustomers);
    } else {
      setComponents([]);
    }
  }, [selectedCustomers]);

  // Fetch tools when components are selected - with loop prevention
  useEffect(() => {
    if (selectedComponents.length > 0 && !isFetchingRef.current) {
      const componentIds = selectedComponents.map((c) => c.id);
      
      // Check if we've already fetched tools for these exact components
      const allAlreadyFetched = componentIds.every((id) => 
        fetchedComponentIdsRef.current.has(id)
      );
      
      if (!allAlreadyFetched) {
        isFetchingRef.current = true;
        fetchToolsForComponents(componentIds).finally(() => {
          isFetchingRef.current = false;
          // Mark these component IDs as fetched
          componentIds.forEach((id) => fetchedComponentIdsRef.current.add(id));
        });
      }
    } else if (selectedComponents.length === 0) {
      // Clear fetched IDs when all components are removed
      fetchedComponentIdsRef.current.clear();
    }
  }, [componentIdString]);

  // Make fetchToolsForComponents async-safe
  const fetchToolsForComponents = async (componentIds: string[]) => {
    try {
      const params = new URLSearchParams();
      params.append("action", "tools");
      componentIds.forEach((id) => params.append("componentIds", id));
      
      const res = await fetch(`/api/monthly-schedule/data?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setAllTools(data.data);
        // Auto-populate tools for each component
        updateComponentsWithTools(data.data);
      }
    } catch (error) {
      console.error("Error fetching tools:", error);
    }
  };

  const fetchCustomerNames = async () => {
    try {
      console.log("[TentativeScheduleView] Fetching customer names...");
      const res = await fetch("/api/monthly-schedule/data?action=customer-names");
      const data = await res.json();
      console.log("[TentativeScheduleView] Customer names response:", data);
      if (data.success) {
        setCustomerNames(data.data);
        console.log("[TentativeScheduleView] Customer names set:", data.data);
        if (data.data.length === 0) {
          console.warn("[TentativeScheduleView] No customer names found. Please create products first.");
        }
      } else {
        console.error("[TentativeScheduleView] Failed to fetch customer names:", data.error);
        toast.error(data.error || "Failed to fetch customer names");
      }
    } catch (error) {
      console.error("[TentativeScheduleView] Error fetching customer names:", error);
      toast.error("Failed to fetch customer names");
    }
  };

  const fetchComponents = async (customerName: string) => {
    try {
      const res = await fetch(
        `/api/monthly-schedule/data?action=components&customerName=${encodeURIComponent(customerName)}`
      );
      const data = await res.json();
      if (data.success) {
        return data.data as Component[];
      }
      return [];
    } catch (error) {
      console.error("Error fetching components:", error);
      return [];
    }
  };

  const fetchComponentsForAllCustomers = async (customers: string[]) => {
    try {
      setLoading(true);
      const componentMap = new Map<string, Component[]>();
      const allComponentsList: Component[] = [];

      // Fetch components for each customer
      for (const customer of customers) {
        const comps = await fetchComponents(customer);
        componentMap.set(customer, comps);
        // Add to merged list but avoid duplicates by ID + customer
        comps.forEach((comp) => {
          if (!allComponentsList.some((c) => c.id === comp.id && c.description === comp.description)) {
            allComponentsList.push(comp);
          }
        });
      }

      setComponentsByCustomer(componentMap);
      setComponents(allComponentsList);
    } catch (error) {
      console.error("Error fetching components:", error);
      toast.error("Failed to fetch components");
    } finally {
      setLoading(false);
    }
  };

  const updateComponentsWithTools = (tools: Tool[]) => {
    setSelectedComponents((prev) =>
      prev.map((component) => {
        // For each tool, create separate entries for each operation
        const toolEntries = tools
          .filter((tool) => tool.itemId === component.id)
          .flatMap((tool) => {
            // Split each tool by its operations
            return tool.operations.map((operation, opIndex) => ({
              toolId: tool.id,
              operationIndex: opIndex,
              toolName: tool.toolName,
              supplierName: tool.supplierName,
              supplierCode: tool.supplierCode,
              rate: tool.rate,
              operations: tool.operations,
              selectedOperation: operation,
              quantity: Math.ceil(component.quantity / operation.lifeSpan),
              displayName: `${tool.toolName} → ${operation.name}`,
            }));
          });

        return {
          ...component,
          tools: toolEntries,
        };
      })
    );
  };

  // Helper function to group tools by supplier
  const groupToolsBySupplier = (tools: SelectedComponent["tools"]) => {
    const groupedBySupplier = new Map<string, typeof tools>();
    tools.forEach((tool) => {
      if (!groupedBySupplier.has(tool.supplierName)) {
        groupedBySupplier.set(tool.supplierName, []);
      }
      groupedBySupplier.get(tool.supplierName)!.push(tool);
    });
    return groupedBySupplier;
  };

  const fetchSchedules = async () => {
    try {
      const res = await fetch("/api/monthly-schedule/tentative");
      const data = await res.json();
      if (data.success) {
        setSchedules(data.data);
      }
    } catch (error) {
      console.error("Error fetching schedules:", error);
    }
  };

  const handleAddComponent = (component: Component, customerName: string) => {
    const selectionId = `${component.id}-${customerName}-${Date.now()}-${Math.random()}`;
    setSelectedComponents([
      ...selectedComponents,
      {
        selectionId,
        id: component.id,
        name: component.name,
        itemCode: component.itemCode,
        quantity: 1,
        customerName,
        tools: [],
      },
    ]);
    setComponentSearch("");
  };

  const handleRemoveComponent = (selectionId: string) => {
    setSelectedComponents(selectedComponents.filter((c) => c.selectionId !== selectionId));
  };

  const handleRemoveCustomer = (customerName: string) => {
    // Remove all components associated with this customer
    setSelectedComponents(
      selectedComponents.filter((c) => c.customerName !== customerName)
    );
    // Remove the customer from selected customers
    setSelectedCustomers(selectedCustomers.filter((c) => c !== customerName));
  };

  const handleUpdateQuantity = (selectionId: string, quantity: number) => {
    setSelectedComponents((prev) =>
      prev.map((c) =>
        c.selectionId === selectionId
          ? {
              ...c,
              quantity,
              tools: c.tools.map((t) => ({ 
                ...t, 
                quantity: t.selectedOperation ? Math.ceil(quantity / t.selectedOperation.lifeSpan) : 0
              })),
            }
          : c
      )
    );
  };

  const handleUpdateOperation = (selectionId: string, toolId: string, operation: Operation) => {
    setSelectedComponents((prev) =>
      prev.map((c) =>
        c.selectionId === selectionId
          ? {
              ...c,
              tools: c.tools.map((t) =>
                t.toolId === toolId 
                  ? { ...t, selectedOperation: operation, quantity: Math.ceil(c.quantity / operation.lifeSpan) } 
                  : t
              ),
            }
          : c
      )
    );
  };

  const handleCreateSchedule = async () => {
    if (selectedCustomers.length === 0) {
      toast.error("At least one customer is required");
      return;
    }

    if (selectedComponents.length === 0) {
      toast.error("At least one component is required");
      return;
    }

    for (const component of selectedComponents) {
      if (component.quantity < 1) {
        toast.error(`${component.name} must have quantity >= 1`);
        return;
      }
      if (component.tools.length === 0) {
        toast.error(`${component.name} must have at least one tool`);
        return;
      }
    }

    try {
      setSubmitting(true);
      
      // Group components by customer
      const schedulesByCustomer = selectedCustomers.map((customerName) => ({
        customerName,
        items: selectedComponents
          .filter((c) => c.customerName === customerName)
          .map((c) => ({
            componentId: c.id,
            quantity: c.quantity,
            tools: c.tools.map((t) => ({
              toolId: t.toolId,
              quantity: t.quantity,
              selectedOperation: t.selectedOperation,
            })),
          })),
      }));

      // Create schedule for each customer
      for (const schedule of schedulesByCustomer) {
        if (schedule.items.length === 0) continue;
        
        const res = await fetch("/api/monthly-schedule/tentative", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(schedule),
        });

        const data = await res.json();

        if (!data.success) {
          throw new Error(data.error || `Failed to create schedule for ${schedule.customerName}`);
        }
      }

      toast.success("Tentative schedules created successfully");
      setSelectedCustomers([]);
      setSelectedComponents([]);
      setComponentSearch("");
      setShowForm(false);
      fetchSchedules();
      onScheduleCreated();
    } catch (error: any) {
      console.error("Error creating schedule:", error);
      toast.error(error.message || "Failed to create schedule");
    } finally {
      setSubmitting(false);
    }
  };

  const filteredCustomers = customerNames.filter((name) =>
    name.toLowerCase().includes(customerSearch.toLowerCase())
  );

  const filteredComponents = components.filter((c) =>
    c.name.toLowerCase().includes(componentSearch.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Create Button */}
      <button
        onClick={() => setShowForm(!showForm)}
        className="inline-flex items-center gap-2 rounded-lg bg-black px-4 py-2 text-white hover:bg-gray-900 transition-colors font-medium"
      >
        <Plus className="h-4 w-4" />
        Create Tentative Monthly Schedule
      </button>

      {/* Form */}
      {showForm && (
        <div className="rounded-lg border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-800">
          <h2 className="mb-6 text-lg font-semibold text-slate-900 dark:text-slate-100">
            Create New Tentative Monthly Schedule
          </h2>

          <div className="space-y-6">
            {/* Customer Name Selection */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Customer Names <span className="text-red-500">*</span>
              </label>
              <div className="relative mb-2">
                <button
                  type="button"
                  onClick={() => setShowCustomerDropdown(!showCustomerDropdown)}
                  className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2 text-left text-slate-900 focus:border-slate-500 focus:ring-1 focus:ring-slate-500 dark:border-slate-600 dark:bg-slate-700 dark:text-white flex justify-between items-center"
                >
                  {selectedCustomers.length === 0
                    ? "Select customers..."
                    : `${selectedCustomers.length} customer${selectedCustomers.length !== 1 ? "s" : ""} selected`}
                  <ChevronDown className="h-4 w-4" />
                </button>

                {showCustomerDropdown && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg shadow-lg z-10">
                    <input
                      type="text"
                      placeholder="Search customer..."
                      value={customerSearch}
                      onChange={(e) => setCustomerSearch(e.target.value)}
                      className="w-full px-4 py-2 border-b border-slate-300 dark:border-slate-600 focus:outline-none text-slate-900 dark:text-white bg-white dark:bg-slate-700"
                    />
                    <div className="max-h-48 overflow-y-auto">
                      {customerNames.length === 0 ? (
                        <div className="px-4 py-8 text-center text-slate-500 dark:text-slate-400">
                          <p className="text-sm font-medium">No customer names found</p>
                          <p className="text-xs mt-1">Please create products first on the Products page</p>
                        </div>
                      ) : filteredCustomers.length === 0 ? (
                        <div className="px-4 py-4 text-center text-slate-500 dark:text-slate-400">
                          <p className="text-sm">No matching customers found</p>
                        </div>
                      ) : (
                        filteredCustomers.map((name) => (
                          <button
                            key={name}
                            type="button"
                            onClick={() => {
                              if (selectedCustomers.includes(name)) {
                                setSelectedCustomers(selectedCustomers.filter((c) => c !== name));
                              } else {
                                setSelectedCustomers([...selectedCustomers, name]);
                              }
                            }}
                            className={`w-full text-left px-4 py-2 text-slate-900 dark:text-white ${
                              selectedCustomers.includes(name)
                                ? "bg-blue-100 dark:bg-blue-900/30"
                                : "hover:bg-slate-100 dark:hover:bg-slate-600"
                            }`}
                          >
                            {selectedCustomers.includes(name) && (
                              <span className="mr-2">✓</span>
                            )}
                            {name}
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
              {selectedCustomers.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {selectedCustomers.map((name) => (
                    <div
                      key={name}
                      className="inline-flex items-center gap-2 bg-blue-100 dark:bg-blue-900/30 text-blue-900 dark:text-blue-200 px-3 py-1 rounded-full text-sm"
                    >
                      {name}
                      <button
                        type="button"
                        onClick={() =>
                          handleRemoveCustomer(name)
                        }
                        className="hover:text-blue-700 dark:hover:text-blue-100 font-bold"
                        title="Remove customer and all associated components/tools"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Component Selection */}
            {selectedCustomers.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Components <span className="text-red-500">*</span>
                </label>
                <div className="relative mb-4">
                  <button
                    type="button"
                    onClick={() => setShowComponentDropdown(!showComponentDropdown)}
                    disabled={loading}
                    className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2 text-left text-slate-900 focus:border-slate-500 focus:ring-1 focus:ring-slate-500 dark:border-slate-600 dark:bg-slate-700 dark:text-white flex justify-between items-center disabled:opacity-50"
                  >
                    {loading ? "Loading..." : "Select components..."}
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
                        {filteredComponents.map((component) => (
                          <div key={component.id}>
                            {selectedCustomers.map((customerName) => {
                              const componentForCustomer = componentsByCustomer
                                .get(customerName)
                                ?.find((c) => c.id === component.id);
                              if (!componentForCustomer) return null;

                              return (
                                <button
                                  key={`${customerName}-${component.id}`}
                                  type="button"
                                  onClick={() => {
                                    handleAddComponent(component, customerName);
                                    setShowComponentDropdown(false);
                                  }}
                                  className="w-full text-left px-4 py-2 text-slate-900 dark:text-white hover:bg-slate-100 dark:hover:bg-slate-600"
                                >
                                  <span className="text-xs text-slate-500 dark:text-slate-400">
                                    {customerName}
                                  </span>
                                  <div>{component.name} ({component.itemCode || "N/A"})</div>
                                </button>
                              );
                            })}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Selected Components */}
                <div className="space-y-4">
                  {selectedComponents.map((component) => (
                    <div
                      key={component.selectionId}
                      className="rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-700/50"
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">
                            Customer: {component.customerName}
                          </p>
                          <h3 className="font-medium text-slate-900 dark:text-white">
                            {component.name}
                          </h3>
                          <p className="text-sm text-slate-600 dark:text-slate-400">
                            Code: {component.itemCode || "N/A"}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveComponent(component.selectionId)}
                          className="rounded-lg bg-red-50 p-2 text-red-600 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/30"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>

                      {/* Component Quantity */}
                      <div className="mb-4">
                        <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                          Component Quantity
                        </label>
                        <input
                          type="number"
                          min="1"
                          value={component.quantity}
                          onChange={(e) =>
                            handleUpdateQuantity(component.selectionId, parseInt(e.target.value) || 1)
                          }
                          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 focus:border-slate-500 focus:ring-1 focus:ring-slate-500 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
                        />
                      </div>

                      {/* Tools for Component - Supplier-wise Split View */}
                      <div>
                        <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-2">
                          Tools
                        </label>
                        {component.tools.length === 0 ? (
                          <p className="text-sm text-slate-500 dark:text-slate-400">
                            No tools available for this component
                          </p>
                        ) : (
                          <div className="space-y-3">
                            {Array.from(groupToolsBySupplier(component.tools).entries()).map(
                              ([supplierName, supplierTools]) => (
                                <div
                                  key={supplierName}
                                  className="border border-slate-300 dark:border-slate-500 rounded-lg overflow-hidden"
                                >
                                  {/* Supplier Header */}
                                  <div className="bg-slate-200 dark:bg-slate-500 px-3 py-2 flex items-center justify-between">
                                    <h4 className="text-xs font-semibold text-slate-900 dark:text-white">
                                      {supplierName}
                                    </h4>
                                    <span className="text-xs bg-slate-300 dark:bg-slate-600 text-slate-800 dark:text-slate-100 px-2 py-0.5 rounded">
                                      {supplierTools.length} item{supplierTools.length !== 1 ? "s" : ""}
                                    </span>
                                  </div>

                                  {/* Supplier Tools */}
                                  <div className="space-y-2 p-2">
                                    {supplierTools.map((tool) => (
                                      <div
                                        key={`${tool.toolId}-${tool.operationIndex}`}
                                        className="flex gap-2 items-start bg-white dark:bg-slate-600 p-3 rounded border border-slate-200 dark:border-slate-500"
                                      >
                                        <div className="flex-1">
                                          <p className="text-sm font-medium text-slate-900 dark:text-white">
                                            {tool.displayName}
                                          </p>
                                          <p className="text-xs text-slate-600 dark:text-slate-400">
                                            Code: {tool.supplierCode} | Rate: ₹{tool.rate}
                                          </p>
                                        </div>
                                        <div className="flex flex-col items-end gap-1">
                                          <label className="text-xs text-slate-600 dark:text-slate-400">Qty</label>
                                          <div className="flex gap-1 items-center">
                                            <input
                                              type="number"
                                              min="1"
                                              value={tool.quantity}
                                              onChange={(e) => {
                                                const newQty = parseInt(e.target.value) || 1;
                                                setSelectedComponents((prev) =>
                                                  prev.map((c) =>
                                                    c.selectionId === component.selectionId
                                                      ? {
                                                          ...c,
                                                          tools: c.tools.map((t) =>
                                                            t.toolId === tool.toolId && t.operationIndex === tool.operationIndex
                                                              ? { ...t, quantity: newQty }
                                                              : t
                                                          ),
                                                        }
                                                      : c
                                                  )
                                                );
                                              }}
                                              className="w-20 rounded border border-slate-300 bg-white px-2 py-1 text-sm text-slate-900 focus:border-slate-500 focus:ring-1 focus:ring-slate-500 dark:border-slate-600 dark:bg-slate-700 dark:text-white text-center"
                                            />
                                            <button
                                              type="button"
                                              onClick={() => {
                                                setSelectedComponents((prev) =>
                                                  prev.map((c) =>
                                                    c.selectionId === component.selectionId
                                                      ? {
                                                          ...c,
                                                          tools: c.tools.filter(
                                                            (t) =>
                                                              !(
                                                                t.toolId === tool.toolId &&
                                                                t.operationIndex === tool.operationIndex
                                                              )
                                                          ),
                                                        }
                                                      : c
                                                  )
                                                );
                                              }}
                                              className="rounded bg-red-50 p-1 text-red-600 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/30"
                                            >
                                              <X className="h-3 w-3" />
                                            </button>
                                          </div>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleCreateSchedule}
                disabled={submitting || selectedComponents.length === 0}
                className="flex items-center gap-2 rounded-lg bg-black px-6 py-2 text-white hover:bg-gray-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                Create Schedule
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setSelectedCustomers([]);
                  setSelectedComponents([]);
                  setComponentSearch("");
                }}
                className="rounded-lg border border-slate-300 px-6 py-2 text-slate-700 hover:bg-slate-50 transition-colors dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700 font-medium"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Schedules List */}
      <div className="rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="border-b border-slate-200 bg-slate-50 px-6 py-3 dark:border-slate-700 dark:bg-slate-800/50">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
            Tentative Monthly Schedules
          </h2>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-700">
          <table className="w-full text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-700/50">
              <tr>
                <th className="px-3 sm:px-6 py-3 text-left text-xs sm:text-sm font-semibold text-slate-900 dark:text-slate-100">
                  Customer
                </th>
                <th className="hidden sm:table-cell px-3 sm:px-6 py-3 text-left text-xs sm:text-sm font-semibold text-slate-900 dark:text-slate-100">
                  Components
                </th>
                <th className="hidden md:table-cell px-3 sm:px-6 py-3 text-left text-xs sm:text-sm font-semibold text-slate-900 dark:text-slate-100">
                  Tools
                </th>
                <th className="hidden lg:table-cell px-3 sm:px-6 py-3 text-left text-xs sm:text-sm font-semibold text-slate-900 dark:text-slate-100">
                  Created Date
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
              {schedules.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-3 sm:px-6 py-6 sm:py-8 text-center text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                    No tentative schedules created yet
                  </td>
                </tr>
              ) : (
                schedules.map((schedule) => (
                  <tr key={schedule.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30">
                    <td className="px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-medium text-slate-900 dark:text-slate-100">
                      {schedule.customerName}
                    </td>
                    <td className="hidden sm:table-cell px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm text-slate-900 dark:text-slate-100">
                      {schedule.items.length}
                    </td>
                    <td className="hidden md:table-cell px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm text-slate-900 dark:text-slate-100">
                      {schedule.items.reduce((sum, item) => sum + item.tools.length, 0)}
                    </td>
                    <td className="hidden lg:table-cell px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                      {new Date(schedule.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
