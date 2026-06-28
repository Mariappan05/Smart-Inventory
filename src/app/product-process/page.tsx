'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AppShell } from '@/components/layout/AppShell';
import { ModernDropdown } from '@/components/ui/ModernDropdown';
import {
  Eye,
  EyeOff,
  Loader2,
  Package,
  Wrench,
  ClipboardList,
  Plus,
  Trash2,
  Edit2,
  Layers,
  Settings,
  AlertCircle,
  Cpu
} from 'lucide-react';
import toast from 'react-hot-toast';

interface ProductInfo {
  id: string;
  name: string;
  itemCode: string;
  description: string;
  lifeDuration: string; // Raw Material Type
}

interface Tool {
  id: string;
  itemId: string;
  toolName: string;
  toolType: string;
  supplierName: string;
  supplierCode: string;
  operations: any;
}

interface Machine {
  id: string;
  name: string;
  code: string;
}

interface ProductProcess {
  id: string;
  productId: string;
  partName: string;
  operation: string;
  machineType: string;
  holderType?: string;
  holderName?: string;
  collet?: string;
  colletType?: string;
  toolType: string;
  cutter?: string;
  toolId?: string;
  toolName?: string;
  consumableScrew?: string;
  consumable?: string;
  supplierName?: string;
  supplierCode?: string;
}

export default function ProductProcessPage() {
  const router = useRouter();

  // Navigation tabs
  const [activeTab, setActiveTab] = useState<'config' | 'history'>('config');

  // Loading states
  const [pageLoading, setPageLoading] = useState(true);
  const [fetchingConfig, setFetchingConfig] = useState(false);
  const [submittingConfig, setSubmittingConfig] = useState(false);

  // Lists from DB
  const [products, setProducts] = useState<ProductInfo[]>([]);
  const [tools, setTools] = useState<Tool[]>([]);
  const [machines, setMachines] = useState<Machine[]>([]);
  const [processes, setProcesses] = useState<ProductProcess[]>([]);

  // Selection state
  const [selectedProductId, setSelectedProductId] = useState<string>('');

  // History search state (old view)
  const [historyComponentCode, setHistoryComponentCode] = useState('');
  const [historyData, setHistoryData] = useState<any>(null);
  const [historyLoading, setHistoryLoading] = useState(false);

  // Form State for Process Config
  const [editingProcessId, setEditingProcessId] = useState<string | null>(null);
  const [processForm, setProcessForm] = useState({
    partName: '', // Holds product component name
    operation: '',
    machineType: '',
    holderType: '',
    holderName: '',
    collet: '',
    colletType: '',
    toolType: '',
    cutter: '',
    toolId: '',
    toolName: '',
    consumableScrew: '',
    consumable: '',
    supplierName: '',
    supplierCode: ''
  });

  useEffect(() => {
    (async () => {
      try {
        // Authenticate
        const profileRes = await fetch('/api/profile');
        if (!profileRes.ok) { router.push('/login'); return; }

        // Load all dropdown lists
        await Promise.all([
          loadProducts(),
          loadTools(),
          loadMachines()
        ]);
      } catch (err) {
        console.error('Initialization error:', err);
      } finally {
        setPageLoading(false);
      }
    })();
  }, [router]);

  // Load configured processes whenever product selection changes
  useEffect(() => {
    if (selectedProductId) {
      fetchProcesses(selectedProductId);
      // Auto-set the history component code when product changes
      const prod = products.find(p => p.id === selectedProductId);
      if (prod) {
        setHistoryComponentCode(prod.itemCode);
      }
    } else {
      setProcesses([]);
    }
  }, [selectedProductId, products]);

  const loadProducts = async () => {
    const res = await fetch('/api/products');
    const data = await res.json();
    if (data.success && Array.isArray(data.data)) {
      setProducts(data.data);
    }
  };

  const loadTools = async () => {
    const res = await fetch('/api/tools');
    const data = await res.json();
    if (data.success && Array.isArray(data.data)) {
      setTools(data.data);
    }
  };

  const loadMachines = async () => {
    const res = await fetch('/api/machines');
    const data = await res.json();
    if (data.success && Array.isArray(data.data)) {
      setMachines(data.data);
    }
  };

  const fetchProcesses = async (prodId: string) => {
    setFetchingConfig(true);
    try {
      const res = await fetch(`/api/product-process?productId=${prodId}`);
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setProcesses(data.data);
      }
    } catch {
      toast.error('Failed to fetch product processes');
    } finally {
      setFetchingConfig(false);
    }
  };

  // Fetch production history (old view)
  const handleFetchHistory = async () => {
    if (!historyComponentCode) return;
    setHistoryLoading(true);
    try {
      const res = await fetch(`/api/product-process?componentCode=${encodeURIComponent(historyComponentCode)}`);
      const data = await res.json();
      if (data.success) {
        setHistoryData(data.data);
      } else {
        toast.error(data.error || 'Failed to fetch history');
      }
    } catch {
      toast.error('Failed to fetch production history');
    } finally {
      setHistoryLoading(false);
    }
  };

  /* ────────────────────── Cascading Option Resolvers ────────────────────── */

  // 1. Part Name change
  const handlePartNameChange = (productId: string) => {
    const matchedProduct = products.find(p => p.id === productId);
    if (matchedProduct) {
      setSelectedProductId(productId);
      setProcessForm(prev => ({
        ...prev,
        partName: matchedProduct.name,
        // Reset dependent fields
        operation: '',
        machineType: '',
        toolType: '',
        toolId: '',
        toolName: '',
        supplierName: '',
        supplierCode: ''
      }));
    }
  };

  // 2. Operation dropdown options based on selected product (Part Name)
  const getOperationOptions = () => {
    if (!selectedProductId) return [];
    // Find tools associated with the selected product component
    const filteredTools = tools.filter(t => t.itemId === selectedProductId);
    const opsSet = new Set<string>();
    filteredTools.forEach(t => {
      try {
        const ops = typeof t.operations === 'string' ? JSON.parse(t.operations) : t.operations;
        if (Array.isArray(ops)) {
          ops.forEach(op => {
            if (op && op.name) opsSet.add(op.name);
          });
        }
      } catch (err) {
        console.error(err);
      }
    });
    return Array.from(opsSet).map(name => ({ value: name, label: name }));
  };

  // Handle operation change
  const handleOperationChange = (operation: string) => {
    setProcessForm(prev => ({
      ...prev,
      operation,
      // Reset downstream selections
      machineType: '',
      toolType: '',
      toolId: '',
      toolName: '',
      supplierName: '',
      supplierCode: ''
    }));
  };

  // 3. Machine Type dropdown options based on selected Operation
  const getMachineTypeOptions = () => {
    if (!processForm.operation) return [];
    // Fetch unique Raw Material Type (lifeDuration) column values from the products database
    const types = Array.from(new Set(
      products.map(p => p.lifeDuration).filter(Boolean)
    ));
    return types.map(t => ({ value: t, label: t }));
  };

  // Handle machine type change
  const handleMachineTypeChange = (machineType: string) => {
    setProcessForm(prev => ({
      ...prev,
      machineType,
      // Reset downstream selections
      toolType: '',
      toolId: '',
      toolName: '',
      supplierName: '',
      supplierCode: ''
    }));
  };

  // 4. Tool Type dropdown options based on selected Machine Type
  const getToolTypeOptions = () => {
    if (!processForm.machineType) return [];
    // Extract unique tool types from database
    const types = Array.from(new Set(
      tools.map(t => t.toolType).filter(Boolean)
    ));
    return types.map(t => ({ value: t, label: t }));
  };

  // Handle tool type change
  const handleToolTypeChange = (toolType: string) => {
    setProcessForm(prev => ({
      ...prev,
      toolType,
      toolId: '',
      toolName: '',
      supplierName: '',
      supplierCode: ''
    }));
  };

  // 5. Tool dropdown options based on selected Tool Type
  const getToolOptions = () => {
    if (!processForm.toolType) return [];
    const matched = tools.filter(t => t.toolType === processForm.toolType);
    return matched.map(t => ({
      value: t.id,
      label: t.toolName,
      subtitle: `Code: ${t.supplierCode}`
    }));
  };

  // Handle Tool choice selection
  const handleToolSelectionChange = (toolId: string) => {
    const selectedTool = tools.find(t => t.id === toolId);
    if (selectedTool) {
      setProcessForm(prev => ({
        ...prev,
        toolId,
        toolName: selectedTool.toolName,
        supplierName: selectedTool.supplierName,
        supplierCode: selectedTool.supplierCode
      }));
    } else {
      setProcessForm(prev => ({
        ...prev,
        toolId: '',
        toolName: '',
        supplierName: '',
        supplierCode: ''
      }));
    }
  };

  // 6. Tool Supplier dropdown options based on selected Tool Type
  const getSupplierOptions = () => {
    if (!processForm.toolType) return [];
    const suppliers = Array.from(new Set(
      tools.filter(t => t.toolType === processForm.toolType).map(t => t.supplierName).filter(Boolean)
    ));
    return suppliers.map(s => ({ value: s, label: s }));
  };

  // Handle Tool Supplier selection
  const handleSupplierSelectionChange = (supplierName: string) => {
    // Find matched tool of this type and supplier to resolve Supplier Code
    const matchedTool = tools.find(
      t => t.toolType === processForm.toolType && t.supplierName === supplierName
    );
    setProcessForm(prev => ({
      ...prev,
      supplierName,
      supplierCode: matchedTool ? (matchedTool.supplierCode || '') : ''
    }));
  };

  /* ────────────────────── Form Actions ────────────────────── */

  // Submit process config
  const handleSaveProcess = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProductId) {
      toast.error('Please select a product component (Part Name) first');
      return;
    }
    if (!processForm.partName || !processForm.operation || !processForm.machineType || !processForm.toolType) {
      toast.error('Part Name, Operation, Machine Type, and Tool Type are required');
      return;
    }

    setSubmittingConfig(true);
    try {
      const url = editingProcessId ? `/api/product-process/${editingProcessId}` : '/api/product-process';
      const method = editingProcessId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...processForm,
          productId: selectedProductId
        })
      });

      const data = await res.json();
      if (data.success) {
        toast.success(editingProcessId ? 'Process updated successfully' : 'Process added successfully');
        resetProcessForm();
        fetchProcesses(selectedProductId);
      } else {
        toast.error(data.error || 'Failed to save process config');
      }
    } catch {
      toast.error('Network error saving process config');
    } finally {
      setSubmittingConfig(false);
    }
  };

  const handleEditProcess = (p: ProductProcess) => {
    setEditingProcessId(p.id);
    setSelectedProductId(p.productId);
    setProcessForm({
      partName: p.partName || '',
      operation: p.operation || '',
      machineType: p.machineType || '',
      holderType: p.holderType || '',
      holderName: p.holderName || '',
      collet: p.collet || '',
      colletType: p.colletType || '',
      toolType: p.toolType || '',
      cutter: p.cutter || '',
      toolId: p.toolId || '',
      toolName: p.toolName || '',
      consumableScrew: p.consumableScrew || '',
      consumable: p.consumable || '',
      supplierName: p.supplierName || '',
      supplierCode: p.supplierCode || ''
    });
  };

  const handleDeleteProcess = async (id: string) => {
    if (!confirm('Are you sure you want to delete this process configuration?')) return;
    try {
      const res = await fetch(`/api/product-process/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        toast.success('Process deleted successfully');
        fetchProcesses(selectedProductId);
      } else {
        toast.error(data.error || 'Failed to delete process');
      }
    } catch {
      toast.error('Network error deleting process');
    }
  };

  const resetProcessForm = () => {
    setEditingProcessId(null);
    setProcessForm({
      partName: '',
      operation: '',
      machineType: '',
      holderType: '',
      holderName: '',
      collet: '',
      colletType: '',
      toolType: '',
      cutter: '',
      toolId: '',
      toolName: '',
      consumableScrew: '',
      consumable: '',
      supplierName: '',
      supplierCode: ''
    });
  };

  if (pageLoading) {
    return (
      <AppShell>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="w-full space-y-6 px-4 py-8 sm:px-6 lg:px-8">
        
        {/* Header section */}
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-panel dark:border-slate-700 dark:bg-slate-900/70">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
            Operations & Specifications
          </p>
          <h1 className="mt-1 text-3xl font-bold text-slate-900 dark:text-white">
            Product Process Specifications
          </h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            Define multi-process steps, cascading operations, tooling, collets, and consumables for each component.
          </p>

          {/* Navigation tabs */}
          <div className="mt-6 flex border-b border-slate-200 dark:border-slate-700">
            <button
              onClick={() => setActiveTab('config')}
              className={`pb-3 text-sm font-semibold border-b-2 mr-6 flex items-center gap-1.5 transition-colors ${
                activeTab === 'config'
                  ? 'border-black text-black dark:border-white dark:text-white'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              <Settings className="h-4 w-4" />
              Configure Processes
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`pb-3 text-sm font-semibold border-b-2 flex items-center gap-1.5 transition-colors ${
                activeTab === 'history'
                  ? 'border-black text-black dark:border-white dark:text-white'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              <ClipboardList className="h-4 w-4" />
              Production Logs History
            </button>
          </div>
        </div>

        {activeTab === 'config' ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Form Column */}
            <div className="lg:col-span-1 space-y-6">
              
              {/* Configuration Form Card */}
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-panel dark:border-slate-700 dark:bg-slate-900/70">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">
                  {editingProcessId ? 'Edit Process Step' : 'Configure Process Step'}
                </h3>
                
                <form onSubmit={handleSaveProcess} className="space-y-4">
                  
                  {/* PART NAME (Fetch Component Names from Products) */}
                  <ModernDropdown
                    label="Part Name"
                    required
                    options={products.map((p) => ({
                      value: p.id,
                      label: p.name,
                      subtitle: `Code: ${p.itemCode}`,
                    }))}
                    value={selectedProductId}
                    onChange={(v) => handlePartNameChange(String(v))}
                    placeholder="Select Component Part..."
                    searchPlaceholder="Search components..."
                    searchable
                  />

                  {/* OPERATION (Populate based on selected Part Name) */}
                  <ModernDropdown
                    label="Operation"
                    required
                    disabled={!selectedProductId}
                    options={getOperationOptions()}
                    value={processForm.operation}
                    onChange={(v) => handleOperationChange(String(v))}
                    placeholder={selectedProductId ? "Select Operation..." : "Choose Part Name first..."}
                  />

                  {/* MACHINE TYPE (Populate based on selected Operation - Fetch Raw Material Type from DB) */}
                  <ModernDropdown
                    label="Machine Type"
                    required
                    disabled={!processForm.operation}
                    options={getMachineTypeOptions()}
                    value={processForm.machineType}
                    onChange={(v) => handleMachineTypeChange(String(v))}
                    placeholder={processForm.operation ? "Select Machine..." : "Choose Operation first..."}
                  />

                  {/* HOLDER TYPE (Manual Entry) */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Holder Type
                    </label>
                    <input
                      type="text"
                      value={processForm.holderType}
                      onChange={(e) => setProcessForm({ ...processForm, holderType: e.target.value })}
                      placeholder="Enter holder type..."
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
                    />
                  </div>

                  {/* HOLDER NAME (Manual Entry) */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Holder Name
                    </label>
                    <input
                      type="text"
                      value={processForm.holderName}
                      onChange={(e) => setProcessForm({ ...processForm, holderName: e.target.value })}
                      placeholder="Enter holder name..."
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
                    />
                  </div>

                  {/* COLLET (Manual Entry) */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Collet
                    </label>
                    <input
                      type="text"
                      value={processForm.collet}
                      onChange={(e) => setProcessForm({ ...processForm, collet: e.target.value })}
                      placeholder="Enter collet..."
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
                    />
                  </div>

                  {/* COLLET TYPE (Manual Entry) */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Collet Type
                    </label>
                    <input
                      type="text"
                      value={processForm.colletType}
                      onChange={(e) => setProcessForm({ ...processForm, colletType: e.target.value })}
                      placeholder="Enter collet type..."
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
                    />
                  </div>

                  {/* TOOL TYPE (Dropdown, populate based on Machine Type) */}
                  <ModernDropdown
                    label="Tool Type"
                    required
                    disabled={!processForm.machineType}
                    options={getToolTypeOptions()}
                    value={processForm.toolType}
                    onChange={(v) => handleToolTypeChange(String(v))}
                    placeholder={processForm.machineType ? "Select Tool Type..." : "Choose Machine Type first..."}
                  />

                  {/* CUTTER (Manual Entry) */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Cutter
                    </label>
                    <input
                      type="text"
                      value={processForm.cutter}
                      onChange={(e) => setProcessForm({ ...processForm, cutter: e.target.value })}
                      placeholder="Enter cutter specification..."
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
                    />
                  </div>

                  {/* TOOL (Dropdown, populate based on Tool Type) */}
                  <ModernDropdown
                    label="Tool"
                    disabled={!processForm.toolType}
                    options={getToolOptions()}
                    value={processForm.toolId}
                    onChange={(v) => handleToolSelectionChange(String(v))}
                    placeholder={processForm.toolType ? "Select Registered Tool..." : "Choose Tool Type first..."}
                  />

                  {/* CONSUMABLE SCREW (Manual Entry) */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Consumable Screw
                    </label>
                    <input
                      type="text"
                      value={processForm.consumableScrew}
                      onChange={(e) => setProcessForm({ ...processForm, consumableScrew: e.target.value })}
                      placeholder="Enter consumable screw..."
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
                    />
                  </div>

                  {/* CONSUMABLE (Manual Entry) */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Consumable
                    </label>
                    <input
                      type="text"
                      value={processForm.consumable}
                      onChange={(e) => setProcessForm({ ...processForm, consumable: e.target.value })}
                      placeholder="Enter consumable..."
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
                    />
                  </div>

                  {/* TOOL SUPPLIER NAME (Dropdown, populate based on selected Tool Type) */}
                  <ModernDropdown
                    label="Tool Supplier Name"
                    disabled={!processForm.toolType}
                    options={getSupplierOptions()}
                    value={processForm.supplierName}
                    onChange={(v) => handleSupplierSelectionChange(String(v))}
                    placeholder={processForm.toolType ? "Select Supplier..." : "Choose Tool Type first..."}
                  />

                  {/* SUPPLIER CODE (Auto-populated, non-editable) */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Supplier Code
                    </label>
                    <input
                      type="text"
                      readOnly
                      disabled
                      value={processForm.supplierCode || "N/A"}
                      className="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-500 cursor-not-allowed font-mono dark:border-slate-600 dark:bg-slate-800"
                    />
                  </div>

                  <div className="flex gap-2 pt-2">
                    <button
                      type="submit"
                      disabled={submittingConfig || !selectedProductId}
                      className="flex-1 inline-flex justify-center items-center gap-2 rounded-lg bg-black text-white py-2 text-sm font-semibold hover:bg-slate-900 disabled:opacity-50 transition-colors"
                    >
                      {submittingConfig && <Loader2 className="h-4 w-4 animate-spin" />}
                      Save Config
                    </button>
                    <button
                      type="button"
                      onClick={resetProcessForm}
                      className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-800"
                    >
                      Reset
                    </button>
                  </div>
                </form>
              </div>
            </div>

            {/* List Column */}
            <div className="lg:col-span-2">
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-panel dark:border-slate-700 dark:bg-slate-900/70 h-full min-h-[500px]">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                  <Layers className="h-5 w-5 text-slate-400" />
                  Active Configured Processes ({processes.length})
                </h3>

                {!selectedProductId ? (
                  <div className="flex flex-col items-center justify-center py-20 text-center text-slate-400 dark:text-slate-500">
                    <Package className="h-12 w-12 mb-3 text-slate-300" />
                    <p className="font-semibold text-sm">No Component Product Selected</p>
                    <p className="text-xs max-w-xs mt-1">Select a component product as Part Name from the form dropdown to configure or view its operational processes.</p>
                  </div>
                ) : fetchingConfig ? (
                  <div className="flex items-center justify-center py-20">
                    <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
                  </div>
                ) : processes.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 text-center text-slate-400 dark:text-slate-500">
                    <AlertCircle className="h-10 w-10 mb-3 text-slate-300" />
                    <p className="font-semibold text-sm">No Process Steps Configured Yet</p>
                    <p className="text-xs max-w-xs mt-1">Configure options on the left to add process steps for this product component.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold uppercase tracking-wider">
                        <tr className="border-b border-slate-200 dark:border-slate-700">
                          <th className="px-4 py-3">Part Name</th>
                          <th className="px-4 py-3">Operation</th>
                          <th className="px-4 py-3">Machine</th>
                          <th className="px-4 py-3">Tool Details</th>
                          <th className="px-4 py-3">Holder/Collet</th>
                          <th className="px-4 py-3">Consumables</th>
                          <th className="px-4 py-3 text-center">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-800 dark:text-slate-200">
                        {processes.map((p) => (
                          <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                            <td className="px-4 py-3 font-semibold">{p.partName}</td>
                            <td className="px-4 py-3">{p.operation}</td>
                            <td className="px-4 py-3 font-mono">{p.machineType}</td>
                            <td className="px-4 py-3">
                              <div><span className="font-medium">Type:</span> {p.toolType}</div>
                              {p.toolName && <div><span className="font-medium">Tool:</span> {p.toolName}</div>}
                              {p.cutter && <div><span className="font-medium">Cutter:</span> {p.cutter}</div>}
                            </td>
                            <td className="px-4 py-3">
                              {p.holderType && <div><span className="font-medium">Holder:</span> {p.holderType} ({p.holderName})</div>}
                              {p.collet && <div><span className="font-medium">Collet:</span> {p.collet} ({p.colletType})</div>}
                            </td>
                            <td className="px-4 py-3">
                              {p.consumableScrew && <div>Screw: {p.consumableScrew}</div>}
                              {p.consumable && <div>Cons: {p.consumable}</div>}
                            </td>
                            <td className="px-4 py-3 text-center">
                              <div className="flex gap-2 justify-center">
                                <button
                                  onClick={() => handleEditProcess(p)}
                                  className="p-1 hover:bg-slate-200 rounded text-blue-600 hover:text-blue-700"
                                  title="Edit Step"
                                >
                                  <Edit2 className="h-3.5 w-3.5" />
                                </button>
                                <button
                                  onClick={() => handleDeleteProcess(p.id)}
                                  className="p-1 hover:bg-slate-200 rounded text-red-600 hover:text-red-700"
                                  title="Delete Step"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>

          </div>
        ) : (
          <div className="space-y-6">
            
            {/* Filter / Search Card (Old View) */}
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-panel dark:border-slate-700 dark:bg-slate-900/70">
              <h2 className="mb-5 text-base font-semibold text-slate-900 dark:text-white">
                View Component Process & Production Logs
              </h2>

              <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
                <div className="flex-1">
                  <ModernDropdown
                    label="Component Code"
                    required
                    options={products.map((p) => ({
                      value: p.itemCode,
                      label: `${p.itemCode} - ${p.name}`,
                    }))}
                    value={historyComponentCode}
                    onChange={(v) => setHistoryComponentCode(String(v))}
                    placeholder="Select or search component..."
                    searchable
                  />
                </div>

                <button
                  onClick={handleFetchHistory}
                  disabled={historyLoading || !historyComponentCode}
                  className="inline-flex items-center gap-2 rounded-xl bg-black px-6 py-2.5 text-sm font-semibold text-white transition-all hover:bg-slate-800 disabled:opacity-50 dark:bg-slate-950 dark:hover:bg-black"
                >
                  {historyLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <ClipboardList className="h-4 w-4" />
                  )}
                  {historyLoading ? 'Loading...' : 'View History'}
                </button>
              </div>
            </div>

            {/* History Results View */}
            {historyData && (
              <div className="space-y-6">
                
                {/* Product details card */}
                {historyData.productInfo && (
                  <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-panel dark:border-slate-700 dark:bg-slate-900/70">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Product Info</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                      <div>
                        <div className="text-xs font-semibold text-slate-400">Code</div>
                        <div className="text-sm font-bold mt-0.5">{historyData.productInfo.itemCode}</div>
                      </div>
                      <div>
                        <div className="text-xs font-semibold text-slate-400">Name</div>
                        <div className="text-sm font-bold mt-0.5">{historyData.productInfo.name}</div>
                      </div>
                      <div>
                        <div className="text-xs font-semibold text-slate-400">Store</div>
                        <div className="text-sm font-bold mt-0.5">{historyData.productInfo.store?.name}</div>
                      </div>
                      <div>
                        <div className="text-xs font-semibold text-slate-400">Description</div>
                        <div className="text-sm font-bold mt-0.5">{historyData.productInfo.description}</div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Tools card */}
                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-panel dark:border-slate-700 dark:bg-slate-900/70">
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Associated Tools</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left">
                      <thead>
                        <tr className="border-b border-slate-200 text-slate-400">
                          <th className="py-2">Tool Type</th>
                          <th className="py-2">Tool Name</th>
                          <th className="py-2">Supplier Name</th>
                          <th className="py-2">Supplier Code</th>
                        </tr>
                      </thead>
                      <tbody>
                        {historyData.tools.map((t: any) => (
                          <tr key={t.id} className="border-b border-slate-100 hover:bg-slate-50/50">
                            <td className="py-2">{t.toolType}</td>
                            <td className="py-2 font-semibold">{t.toolName}</td>
                            <td className="py-2">{t.supplierName}</td>
                            <td className="py-2 font-mono">{t.supplierCode}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Production card */}
                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-panel dark:border-slate-700 dark:bg-slate-900/70">
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Production Entry Records</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left">
                      <thead>
                        <tr className="border-b border-slate-200 text-slate-400">
                          <th className="py-2">Date</th>
                          <th className="py-2">Machine Code</th>
                          <th className="py-2">Operation</th>
                          <th className="py-2">Tool Scanned</th>
                          <th className="py-2">Qty Produced</th>
                        </tr>
                      </thead>
                      <tbody>
                        {historyData.productions.map((p: any) => (
                          <tr key={p.id} className="border-b border-slate-100 hover:bg-slate-50/50">
                            <td className="py-2">{new Date(p.date).toLocaleDateString()}</td>
                            <td className="py-2 font-mono">{p.machineCode}</td>
                            <td className="py-2">{p.operation}</td>
                            <td className="py-2">{p.toolName}</td>
                            <td className="py-2 font-bold">{p.productionQuantity}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

              </div>
            )}
            
          </div>
        )}

      </div>
    </AppShell>
  );
}
