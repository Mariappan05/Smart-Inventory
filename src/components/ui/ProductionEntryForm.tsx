"use client";

import { useEffect, useState } from "react";
import { ModernDropdown } from "./ModernDropdown";

interface StoreOption {
  value: string;
  label: string;
  subtitle: string;
}

interface MachineOption {
  value: string;
  label: string;
  subtitle: string;
}

interface ProductionEntryFormProps {
  date: string;
  storeName: string;
  storeCode: string;
  storeId: string;
  machineName: string;
  machineCode: string;
  machineId: string;
  componentName: string;
  componentCode: string;
  operation: string;
  toolName: string;
  productionQuantity: number;
  
  onDateChange: (value: string) => void;
  onStoreChange: (storeName: string, storeCode: string, storeId: string) => void;
  onMachineChange: (machineName: string, machineCode: string, machineId: string) => void;
  onComponentNameChange: (value: string) => void;
  onComponentCodeChange: (value: string) => void;
  onOperationChange: (value: string) => void;
  onToolNameChange: (value: string) => void;
  onQuantityChange: (value: number) => void;
  onAddItem: () => void;
  isLoading?: boolean;
  error?: string | null;
}

export function ProductionEntryForm({
  date,
  storeName,
  storeCode,
  storeId,
  machineName,
  machineCode,
  machineId,
  componentName,
  componentCode,
  operation,
  toolName,
  productionQuantity,
  onDateChange,
  onStoreChange,
  onMachineChange,
  onComponentNameChange,
  onComponentCodeChange,
  onOperationChange,
  onToolNameChange,
  onQuantityChange,
  onAddItem,
  isLoading = false,
  error,
}: ProductionEntryFormProps) {
  const [storeOptions, setStoreOptions] = useState<StoreOption[]>([]);
  const [machineOptions, setMachineOptions] = useState<MachineOption[]>([]);
  const [loadingStores, setLoadingStores] = useState(true);
  const [loadingMachines, setLoadingMachines] = useState(false);
  const [storesError, setStoresError] = useState<string | null>(null);

  // Fetch stores
  useEffect(() => {
    const fetchStores = async () => {
      setLoadingStores(true);
      setStoresError(null);
      try {
        const response = await fetch("/api/stores");
        const data = await response.json();

        if (data.success && Array.isArray(data.data)) {
          const options: StoreOption[] = data.data.map(
            (store: { id: string; name: string; code: string }) => ({
              value: store.id,
              label: store.name,
              subtitle: `Code: ${store.code}`,
            })
          );
          setStoreOptions(options);
        } else {
          setStoresError("Failed to load stores");
        }
      } catch (err) {
        setStoresError(err instanceof Error ? err.message : "Failed to load stores");
      } finally {
        setLoadingStores(false);
      }
    };

    fetchStores();
  }, []);

  const handleStoreSelect = (storeId: string) => {
    const selectedStore = storeOptions.find((s) => s.value === storeId);
    if (selectedStore) {
      const storeCode = selectedStore.subtitle.replace("Code: ", "");
      onStoreChange(selectedStore.label, storeCode, storeId);
      // Reset machine selection when store changes
      onMachineChange("", "", "");
      setMachineOptions([]);
    }
  };

  // Fetch machines when store is selected
  useEffect(() => {
    if (!storeName) {
      setMachineOptions([]);
      return;
    }

    const fetchMachines = async () => {
      setLoadingMachines(true);
      try {
        const response = await fetch("/api/machines");
        const data = await response.json();

        if (data.success && Array.isArray(data.data)) {
          // Filter machines by selected store
          const options: MachineOption[] = data.data
            .filter(
              (machine: any) =>
                machine.store?.name === storeName || machine.storeId === storeName
            )
            .map((machine: any) => ({
              value: machine.id,
              label: machine.name,
              subtitle: `Code: ${machine.code}`,
            }));
          setMachineOptions(options);
        }
      } catch (err) {
        console.error("Failed to load machines:", err);
      } finally {
        setLoadingMachines(false);
      }
    };

    fetchMachines();
  }, [storeName]);

  const handleMachineSelect = (machineId: string) => {
    // Get machine details from the API or from local state
    // For now, we'll extract from machineOptions
    const selectedMachine = machineOptions.find((m) => m.value === machineId);
    if (selectedMachine) {
      const machineCode = selectedMachine.subtitle.replace("Code: ", "");
      onMachineChange(selectedMachine.label, machineCode, machineId);
    }
  };

  const isFormValid =
    date &&
    storeName &&
    storeCode &&
    machineName &&
    machineCode &&
    componentName &&
    componentCode &&
    operation &&
    toolName &&
    productionQuantity > 0;

  return (
    <div className="space-y-4">
      {error && (
        <div className="rounded-lg border border-red-300 bg-red-50 p-4 dark:border-red-900 dark:bg-red-950">
          <p className="text-sm font-medium text-red-800 dark:text-red-200">
            {error}
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* Date */}
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
            Date <span className="text-red-500">*</span>
          </label>
          <input
            type="date"
            value={date}
            onChange={(e) => onDateChange(e.target.value)}
            className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-slate-900 focus:border-slate-500 focus:ring-2 focus:ring-slate-500/20 dark:border-slate-600 dark:bg-slate-700 dark:text-white dark:focus:border-slate-400"
          />
        </div>

        {/* Store Name */}
        <div>
          <ModernDropdown
            label="Store Name"
            required
            options={storeOptions}
            value={storeId}
            onChange={(value) => handleStoreSelect(value as string)}
            placeholder="Select a store..."
            searchPlaceholder="Search stores..."
            loading={loadingStores}
            searchable
            clearable
          />
          {storesError && (
            <p className="mt-1 text-xs text-red-600 dark:text-red-400">
              {storesError}
            </p>
          )}
        </div>

        {/* Store Code */}
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
            Store Code <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={storeCode}
            disabled
            placeholder="Auto-filled"
            className="w-full rounded-lg border border-slate-300 bg-slate-50 px-4 py-2.5 text-slate-900 cursor-not-allowed dark:border-slate-600 dark:bg-slate-700 dark:text-slate-400"
          />
        </div>

        {/* Machine Name */}
        <div>
          <ModernDropdown
            label="Machine Name"
            required
            options={machineOptions}
            value={machineId}
            onChange={(value) => handleMachineSelect(value as string)}
            placeholder="Select a machine..."
            searchPlaceholder="Search machines..."
            loading={loadingMachines}
            searchable
            clearable
            disabled={!storeName}
          />
        </div>

        {/* Machine Code */}
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
            Machine Code <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={machineCode}
            disabled
            placeholder="Auto-filled"
            className="w-full rounded-lg border border-slate-300 bg-slate-50 px-4 py-2.5 text-slate-900 cursor-not-allowed dark:border-slate-600 dark:bg-slate-700 dark:text-slate-400"
          />
        </div>

        {/* Component Name */}
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
            Component Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={componentName}
            onChange={(e) => onComponentNameChange(e.target.value)}
            placeholder="Enter component name"
            className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-slate-900 placeholder-slate-400 focus:border-slate-500 focus:ring-2 focus:ring-slate-500/20 dark:border-slate-600 dark:bg-slate-700 dark:text-white dark:focus:border-slate-400"
          />
        </div>

        {/* Component Code */}
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
            Component Code <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={componentCode}
            onChange={(e) => onComponentCodeChange(e.target.value)}
            placeholder="Enter component code"
            className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-slate-900 placeholder-slate-400 focus:border-slate-500 focus:ring-2 focus:ring-slate-500/20 dark:border-slate-600 dark:bg-slate-700 dark:text-white dark:focus:border-slate-400"
          />
        </div>

        {/* Operation */}
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
            Operation <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={operation}
            onChange={(e) => onOperationChange(e.target.value)}
            placeholder="Enter operation"
            className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-slate-900 placeholder-slate-400 focus:border-slate-500 focus:ring-2 focus:ring-slate-500/20 dark:border-slate-600 dark:bg-slate-700 dark:text-white dark:focus:border-slate-400"
          />
        </div>

        {/* Tool Name */}
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
            Tool Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={toolName}
            onChange={(e) => onToolNameChange(e.target.value)}
            placeholder="Enter tool name"
            className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-slate-900 placeholder-slate-400 focus:border-slate-500 focus:ring-2 focus:ring-slate-500/20 dark:border-slate-600 dark:bg-slate-700 dark:text-white dark:focus:border-slate-400"
          />
        </div>

        {/* Production Quantity */}
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
            Production Quantity <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            min="1"
            value={productionQuantity || ""}
            onChange={(e) => onQuantityChange(parseInt(e.target.value) || 0)}
            placeholder="Enter quantity"
            className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-slate-900 placeholder-slate-400 focus:border-slate-500 focus:ring-2 focus:ring-slate-500/20 dark:border-slate-600 dark:bg-slate-700 dark:text-white dark:focus:border-slate-400"
          />
        </div>
      </div>

      <button
        type="button"
        onClick={onAddItem}
        disabled={!isFormValid || isLoading}
        className="rounded-lg bg-black px-6 py-2.5 text-white font-medium hover:bg-slate-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed dark:bg-slate-950 dark:hover:bg-black"
      >
        Add Item
      </button>
    </div>
  );
}
