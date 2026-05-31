"use client";

import { useState, useCallback } from "react";

export interface ProductionItem {
  id?: string;
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
}

interface UseProductionFormReturn {
  items: ProductionItem[];
  formValues: ProductionItem;
  isLoading: boolean;
  error: string | null;
  showItems: boolean;
  
  // Form operations
  setFormValue: (field: keyof ProductionItem, value: string | number) => void;
  resetForm: () => void;
  addItem: () => boolean;
  updateItem: (id: string, item: ProductionItem) => void;
  deleteItem: (id: string) => void;
  toggleShowItems: () => void;
  submitProductions: () => Promise<boolean>;
}

const initialFormValues: ProductionItem = {
  date: "",
  storeName: "",
  storeCode: "",
  storeId: "",
  machineName: "",
  machineCode: "",
  machineId: "",
  componentName: "",
  componentCode: "",
  operation: "",
  toolName: "",
  productionQuantity: 0,
};

export function useProductionForm(): UseProductionFormReturn {
  const [items, setItems] = useState<ProductionItem[]>([]);
  const [formValues, setFormValues] = useState<ProductionItem>(initialFormValues);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showItems, setShowItems] = useState(false);

  const setFormValue = useCallback(
    (field: keyof ProductionItem, value: string | number) => {
      setFormValues((prev) => ({ ...prev, [field]: value }));
    },
    []
  );

  const resetForm = useCallback(() => {
    setFormValues(initialFormValues);
    setError(null);
  }, []);

  const addItem = useCallback((): boolean => {
    // Validate all fields
    const {
      date,
      storeName,
      storeCode,
      machineName,
      machineCode,
      componentName,
      componentCode,
      operation,
      toolName,
      productionQuantity,
    } = formValues;

    if (
      !date ||
      !storeName ||
      !storeCode ||
      !machineName ||
      !machineCode ||
      !componentName ||
      !componentCode ||
      !operation ||
      !toolName ||
      productionQuantity <= 0
    ) {
      setError("All fields are mandatory and quantity must be greater than 0");
      return false;
    }

    // Add item to list with temporary ID
    const newItem: ProductionItem = {
      id: Date.now().toString(),
      ...formValues,
    };

    setItems((prev) => [...prev, newItem]);
    resetForm();
    setError(null);
    return true;
  }, [formValues, resetForm]);

  const updateItem = useCallback((id: string, item: ProductionItem) => {
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

  const submitProductions = useCallback(async (): Promise<boolean> => {
    if (items.length === 0) {
      setError("Please add at least one production record");
      return false;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/production/batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productions: items.map((item) => ({
            date: item.date,
            storeId: item.storeId,
            machineId: item.machineId,
            componentName: item.componentName,
            componentCode: item.componentCode,
            operation: item.operation,
            toolName: item.toolName,
            productionQuantity: item.productionQuantity,
          })),
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        setError(data.error || "Failed to create production records");
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
    submitProductions,
  };
}
