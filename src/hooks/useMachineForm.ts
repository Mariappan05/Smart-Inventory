"use client";

import { useState, useCallback } from "react";

export interface MachineItem {
  id?: string;
  name: string;
  code: string;
  storeId: string;
  storeName?: string;
  storeCode?: string;
}

interface UseMachineFormReturn {
  items: MachineItem[];
  formValues: {
    storeName: string;
    storeCode: string;
    storeId: string;
    machineName: string;
    machineCode: string;
  };
  isLoading: boolean;
  error: string | null;
  showItems: boolean;
  
  // Form operations
  setFormValue: (field: string, value: string) => void;
  resetForm: () => void;
  addItem: () => boolean;
  updateItem: (id: string, item: MachineItem) => void;
  deleteItem: (id: string) => void;
  toggleShowItems: () => void;
  submitMachines: () => Promise<boolean>;
}

export function useMachineForm(): UseMachineFormReturn {
  const [items, setItems] = useState<MachineItem[]>([]);
  const [formValues, setFormValues] = useState({
    storeName: "",
    storeCode: "",
    storeId: "",
    machineName: "",
    machineCode: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showItems, setShowItems] = useState(false);

  const setFormValue = useCallback((field: string, value: string) => {
    setFormValues((prev) => ({ ...prev, [field]: value }));
  }, []);

  const resetForm = useCallback(() => {
    setFormValues({
      storeName: "",
      storeCode: "",
      storeId: "",
      machineName: "",
      machineCode: "",
    });
    setError(null);
  }, []);

  const addItem = useCallback((): boolean => {
    const { storeName, storeCode, storeId, machineName, machineCode } = formValues;

    // Validate all fields
    if (!storeName || !storeCode || !storeId || !machineName || !machineCode) {
      setError("All fields are mandatory");
      return false;
    }

    // Add item to list with temporary ID
    const newItem: MachineItem = {
      id: Date.now().toString(),
      name: machineName,
      code: machineCode,
      storeId: storeId,
      storeName,
      storeCode,
    };

    setItems((prev) => [...prev, newItem]);
    resetForm();
    setError(null);
    return true;
  }, [formValues, resetForm]);

  const updateItem = useCallback((id: string, item: MachineItem) => {
    setItems((prev) =>
      prev.map((existingItem) => (existingItem.id === id ? item : existingItem))
    );
  }, []);

  const deleteItem = useCallback((id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const toggleShowItems = useCallback(() => {
    setShowItems((prev) => !prev);
  }, []);

  const submitMachines = useCallback(async (): Promise<boolean> => {
    if (items.length === 0) {
      setError("Please add at least one machine");
      return false;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/machines/batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          machines: items.map((item) => ({
            name: item.name,
            code: item.code,
            storeId: item.storeId,
          })),
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        setError(data.error || "Failed to create machines");
        return false;
      }

      // Clear items after successful submission
      setItems([]);
      setShowItems(false);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [items]);

  return {
    items,
    formValues,
    isLoading,
    error,
    showItems,
    setFormValue,
    resetForm,
    addItem,
    updateItem,
    deleteItem,
    toggleShowItems,
    submitMachines,
  };
}
