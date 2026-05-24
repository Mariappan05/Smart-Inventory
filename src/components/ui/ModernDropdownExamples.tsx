/**
 * ModernDropdown Usage Examples
 * 
 * This file demonstrates how to use the ModernDropdown component
 * across different scenarios in the application.
 */

import { ModernDropdown } from "@/components/ui/ModernDropdown";
import { useState, useEffect } from "react";

// ============================================
// Example 1: Basic Single Select Dropdown
// ============================================
export function BasicSingleSelectExample() {
  const [selectedStore, setSelectedStore] = useState("");

  const storeOptions = [
    { value: "1", label: "Store A", subtitle: "Code: ST-001" },
    { value: "2", label: "Store B", subtitle: "Code: ST-002" },
    { value: "3", label: "Store C", subtitle: "Code: ST-003" },
  ];

  return (
    <ModernDropdown
      label="Store"
      required
      options={storeOptions}
      value={selectedStore}
      onChange={(value) => setSelectedStore(value as string)}
      placeholder="Select a store..."
      searchPlaceholder="Search stores..."
    />
  );
}

// ============================================
// Example 2: Multiple Select Dropdown
// ============================================
export function MultipleSelectExample() {
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);

  const userOptions = [
    { value: "1", label: "John Doe", subtitle: "john@example.com" },
    { value: "2", label: "Jane Smith", subtitle: "jane@example.com" },
    { value: "3", label: "Bob Johnson", subtitle: "bob@example.com" },
  ];

  return (
    <ModernDropdown
      label="Assign Users"
      mode="multiple"
      options={userOptions}
      value={selectedUsers}
      onChange={(value) => setSelectedUsers(value as string[])}
      placeholder="Select users..."
      searchPlaceholder="Search users..."
    />
  );
}

// ============================================
// Example 3: Dropdown with Loading State
// ============================================
export function LoadingStateExample() {
  const [selectedComponent, setSelectedComponent] = useState("");
  const [loading, setLoading] = useState(true);
  const [options, setOptions] = useState([]);

  // Simulate API call
  useEffect(() => {
    fetchComponents();
  }, []);

  const fetchComponents = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/products");
      const data = await res.json();
      if (data.success) {
        const componentOptions = data.data.map((item: any) => ({
          value: item.id,
          label: item.name,
          subtitle: `Code: ${item.itemCode || "N/A"}`,
        }));
        setOptions(componentOptions);
      }
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ModernDropdown
      label="Component"
      required
      loading={loading}
      options={options}
      value={selectedComponent}
      onChange={(value) => setSelectedComponent(value as string)}
      placeholder="Select component..."
      searchPlaceholder="Search components..."
    />
  );
}

// ============================================
// Example 4: Dropdown with Error State
// ============================================
export function ErrorStateExample() {
  const [selectedSupplier, setSelectedSupplier] = useState("");
  const [error, setError] = useState("");

  const supplierOptions = [
    { value: "1", label: "Supplier A", subtitle: "Code: SUP-001" },
    { value: "2", label: "Supplier B", subtitle: "Code: SUP-002" },
  ];

  const handleChange = (value: string | string[]) => {
    setSelectedSupplier(value as string);
    if (value) {
      setError(""); // Clear error when value is selected
    }
  };

  const handleSubmit = () => {
    if (!selectedSupplier) {
      setError("Please select a supplier");
    }
  };

  return (
    <div>
      <ModernDropdown
        label="Supplier"
        required
        options={supplierOptions}
        value={selectedSupplier}
        onChange={handleChange}
        placeholder="Select supplier..."
        error={error}
      />
      <button onClick={handleSubmit}>Submit</button>
    </div>
  );
}

// ============================================
// Example 5: Disabled Dropdown
// ============================================
export function DisabledDropdownExample() {
  const [selectedMachine, setSelectedMachine] = useState("");

  const machineOptions = [
    { value: "1", label: "Machine A", subtitle: "Code: MCH-001" },
    { value: "2", label: "Machine B", subtitle: "Code: MCH-002" },
  ];

  return (
    <ModernDropdown
      label="Machine"
      disabled
      options={machineOptions}
      value={selectedMachine}
      onChange={(value) => setSelectedMachine(value as string)}
      placeholder="Select machine..."
    />
  );
}

// ============================================
// Example 6: Dropdown with API Search
// ============================================
export function ApiSearchExample() {
  const [selectedTool, setSelectedTool] = useState("");
  const [toolOptions, setToolOptions] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleSearch = async (searchTerm: string) => {
    if (!searchTerm) return;
    
    setLoading(true);
    try {
      const res = await fetch(`/api/tools?search=${searchTerm}`);
      const data = await res.json();
      if (data.success) {
        const options = data.data.map((tool: any) => ({
          value: tool.id,
          label: tool.toolName,
          subtitle: `Supplier: ${tool.supplierName}`,
        }));
        setToolOptions(options);
      }
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ModernDropdown
      label="Tool"
      required
      loading={loading}
      options={toolOptions}
      value={selectedTool}
      onChange={(value) => setSelectedTool(value as string)}
      placeholder="Select tool..."
      searchPlaceholder="Search tools..."
      onSearch={handleSearch}
    />
  );
}

// ============================================
// Example 7: Non-Searchable Dropdown
// ============================================
export function NonSearchableExample() {
  const [selectedStatus, setSelectedStatus] = useState("");

  const statusOptions = [
    { value: "active", label: "Active" },
    { value: "inactive", label: "Inactive" },
    { value: "pending", label: "Pending" },
  ];

  return (
    <ModernDropdown
      label="Status"
      searchable={false}
      options={statusOptions}
      value={selectedStatus}
      onChange={(value) => setSelectedStatus(value as string)}
      placeholder="Select status..."
    />
  );
}

// ============================================
// Example 8: Non-Clearable Dropdown
// ============================================
export function NonClearableExample() {
  const [selectedRole, setSelectedRole] = useState("");

  const roleOptions = [
    { value: "admin", label: "Administrator" },
    { value: "employee", label: "Employee" },
    { value: "viewer", label: "Viewer" },
  ];

  return (
    <ModernDropdown
      label="Role"
      required
      clearable={false}
      options={roleOptions}
      value={selectedRole}
      onChange={(value) => setSelectedRole(value as string)}
      placeholder="Select role..."
    />
  );
}

// ============================================
// Example 9: Dropdown with Disabled Options
// ============================================
export function DisabledOptionsExample() {
  const [selectedCustomer, setSelectedCustomer] = useState("");

  const customerOptions = [
    { value: "1", label: "Customer A", subtitle: "Active" },
    { value: "2", label: "Customer B", subtitle: "Inactive", disabled: true },
    { value: "3", label: "Customer C", subtitle: "Active" },
  ];

  return (
    <ModernDropdown
      label="Customer"
      options={customerOptions}
      value={selectedCustomer}
      onChange={(value) => setSelectedCustomer(value as string)}
      placeholder="Select customer..."
    />
  );
}

// ============================================
// Example 10: Dropdown with Custom Max Height
// ============================================
export function CustomMaxHeightExample() {
  const [selectedItem, setSelectedItem] = useState("");

  const items = Array.from({ length: 50 }, (_, i) => ({
    value: `${i + 1}`,
    label: `Item ${i + 1}`,
    subtitle: `Description for item ${i + 1}`,
  }));

  return (
    <ModernDropdown
      label="Items"
      options={items}
      value={selectedItem}
      onChange={(value) => setSelectedItem(value as string)}
      placeholder="Select item..."
      maxHeight="400px"
    />
  );
}

// ============================================
// Example 11: Dropdown with Callbacks
// ============================================
export function CallbacksExample() {
  const [selectedOption, setSelectedOption] = useState("");

  const options = [
    { value: "1", label: "Option 1" },
    { value: "2", label: "Option 2" },
    { value: "3", label: "Option 3" },
  ];

  return (
    <ModernDropdown
      label="Options"
      options={options}
      value={selectedOption}
      onChange={(value) => {
        setSelectedOption(value as string);
        console.log("Selected:", value);
      }}
      onOpen={() => console.log("Dropdown opened")}
      onClose={() => console.log("Dropdown closed")}
      placeholder="Select option..."
    />
  );
}

// ============================================
// Example 12: Store-Based Component Filtering
// ============================================
export function StoreBasedFilteringExample() {
  const [selectedStore, setSelectedStore] = useState("");
  const [selectedComponent, setSelectedComponent] = useState("");
  const [componentOptions, setComponentOptions] = useState([]);

  const storeOptions = [
    { value: "1", label: "Store A", subtitle: "Code: ST-001" },
    { value: "2", label: "Store B", subtitle: "Code: ST-002" },
  ];

  useEffect(() => {
    if (selectedStore) {
      fetchComponentsForStore(selectedStore);
    } else {
      setComponentOptions([]);
      setSelectedComponent("");
    }
  }, [selectedStore]);

  const fetchComponentsForStore = async (storeId: string) => {
    try {
      const res = await fetch(`/api/products?storeId=${storeId}`);
      const data = await res.json();
      if (data.success) {
        const options = data.data.map((item: any) => ({
          value: item.id,
          label: item.name,
          subtitle: `Code: ${item.itemCode || "N/A"}`,
        }));
        setComponentOptions(options);
      }
    } catch (error) {
      console.error("Error:", error);
    }
  };

  return (
    <div className="space-y-4">
      <ModernDropdown
        label="Store"
        required
        options={storeOptions}
        value={selectedStore}
        onChange={(value) => setSelectedStore(value as string)}
        placeholder="Select store..."
      />

      <ModernDropdown
        label="Component"
        required
        disabled={!selectedStore}
        options={componentOptions}
        value={selectedComponent}
        onChange={(value) => setSelectedComponent(value as string)}
        placeholder={
          !selectedStore
            ? "Select store first..."
            : componentOptions.length === 0
            ? "No components available"
            : "Select component..."
        }
        emptyMessage="No components found for this store"
      />
    </div>
  );
}
