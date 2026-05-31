"use client";

import { useEffect, useState } from "react";
import { ModernDropdown } from "./ModernDropdown";

interface StoreOption {
  value: string;
  label: string;
  subtitle: string;
}

interface MachineEntryFormProps {
  storeName: string;
  storeCode: string;
  machineName: string;
  machineCode: string;
  onStoreChange: (storeName: string, storeCode: string, storeId: string) => void;
  onMachineNameChange: (value: string) => void;
  onMachineCodeChange: (value: string) => void;
  onAddItem: () => void;
  isLoading?: boolean;
  error?: string | null;
}

export function MachineEntryForm({
  storeName,
  storeCode,
  machineName,
  machineCode,
  onStoreChange,
  onMachineNameChange,
  onMachineCodeChange,
  onAddItem,
  isLoading = false,
  error,
}: MachineEntryFormProps) {
  const [storeOptions, setStoreOptions] = useState<StoreOption[]>([]);
  const [loadingStores, setLoadingStores] = useState(true);
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
      onStoreChange(selectedStore.label, storeCode, selectedStore.value);
    }
  };

  const isFormValid =
    storeName && machineName && machineCode && storeCode;

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
        {/* Store Name */}
        <div>
          <ModernDropdown
            label="Store Name"
            required
            options={storeOptions}
            value={storeName}
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
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
            Machine Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={machineName}
            onChange={(e) => onMachineNameChange(e.target.value)}
            placeholder="Enter machine name"
            className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-slate-900 placeholder-slate-400 focus:border-slate-500 focus:ring-2 focus:ring-slate-500/20 dark:border-slate-600 dark:bg-slate-700 dark:text-white dark:focus:border-slate-400"
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
            onChange={(e) => onMachineCodeChange(e.target.value)}
            placeholder="Enter machine code"
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
