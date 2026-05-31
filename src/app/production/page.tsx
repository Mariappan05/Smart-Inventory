'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AppShell } from '@/components/layout/AppShell';
import { SearchableSelect } from '@/components/ui/SearchableSelect';
import { Eye, EyeOff, Edit2, Trash2 } from 'lucide-react';

interface Store {
  id: string;
  name: string;
  code: string;
}

interface Production {
  id: string;
  date: string;
  storeId?: string;
  store?: {
    id: string;
    name: string;
    code: string;
  };
  machineName: string;
  machineCode: string;
  componentName: string;
  componentCode: string;
  operation: string;
  toolName: string;
  productionQuantity: number;
  createdAt: string;
  updatedAt: string;
}

interface TemporaryProduction {
  id: string;
  date: string;
  storeId: string;
  storeName: string;
  storeCode: string;
  machineName: string;
  machineCode: string;
  componentName: string;
  componentCode: string;
  operation: string;
  toolName: string;
  productionQuantity: number;
}

interface ApiResponse {
  success: boolean;
  data?: {
    data: Production[];
    total: number;
    page: number;
    pageSize: number;
  };
  error?: string;
  message?: string;
}


interface FormData {
  date: string;
  storeId: string;
  storeName: string;
  storeCode: string;
  machineName: string;
  machineCode: string;
  componentName: string;
  componentCode: string;
  operation: string;
  toolName: string;
  productionQuantity: string;
}

export default function ProductionPage() {
  const router = useRouter();
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Temporary items (for current session)
  const [tempProductions, setTempProductions] = useState<TemporaryProduction[]>([]);
  const [editingTempId, setEditingTempId] = useState<string | null>(null);
  
  // Database records (saved)
  const [savedProductions, setSavedProductions] = useState<Production[]>([]);
  const [showSavedTable, setShowSavedTable] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState<FormData>({
    date: new Date().toISOString().split('T')[0],
    storeId: '',
    storeName: '',
    storeCode: '',
    machineName: '',
    machineCode: '',
    componentName: '',
    componentCode: '',
    operation: '',
    toolName: '',
    productionQuantity: '',
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    checkAuthAndLoadData();
  }, []);

  const checkAuthAndLoadData = async () => {
    try {
      const profileRes = await fetch('/api/profile');
      if (!profileRes.ok) {
        router.push('/login');
        return;
      }
      
      const profileText = await profileRes.text();
      let profileData;
      try {
        profileData = JSON.parse(profileText);
      } catch (parseErr) {
        console.error('Failed to parse profile response:', parseErr);
        router.push('/login');
        return;
      }

      if (!profileData.success) {
        router.push('/login');
        return;
      }

      const userRole = profileData.data?.role;
      if (!['SUB_STORE_LOGIN', 'ADMIN', 'STORE_MANAGER'].includes(userRole)) {
        setError('You do not have permission to access this page');
        setLoading(false);
        return;
      }

      await Promise.all([loadStores(), fetchSavedProductions()]);
    } catch (err) {
      console.error('Auth check error:', err);
      setError('Failed to verify authorization');
      setLoading(false);
    }
  };

  const loadStores = async () => {
    try {
      const response = await fetch('/api/stores');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const text = await response.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch (parseErr) {
        console.error('Failed to parse stores response:', parseErr);
        setError('Failed to parse stores data');
        return;
      }

      if (data.success && Array.isArray(data.data)) {
        setStores(data.data);
      }
    } catch (err) {
      console.error('Error loading stores:', err);
    }
  };

  const fetchSavedProductions = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/production?page=1&pageSize=50');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const text = await response.text();
      let data: ApiResponse;
      try {
        data = JSON.parse(text);
      } catch (parseErr) {
        console.error('Failed to parse production response:', parseErr);
        setError('Failed to fetch productions - invalid response format');
        return;
      }

      if (data.success && data.data) {
        setSavedProductions(data.data.data);
      } else {
        setError(data.error || 'Failed to fetch productions');
      }
    } catch (err) {
      console.error('Fetch error:', err);
      setError('Failed to fetch productions');
    } finally {
      setLoading(false);
    }
  };

  const handleStoreSelect = (storeId: string) => {
    const selectedStore = stores.find(s => s.id === storeId);
    if (selectedStore) {
      setFormData({
        ...formData,
        storeId: selectedStore.id,
        storeName: selectedStore.name,
        storeCode: selectedStore.code,
      });
    }
  };

  const handleAddItem = () => {
    if (!formData.storeId || !formData.machineName || !formData.componentName || 
        !formData.operation || !formData.toolName || !formData.productionQuantity) {
      setError('All fields are required');
      return;
    }

    const newItem: TemporaryProduction = {
      id: Date.now().toString(),
      date: formData.date,
      storeId: formData.storeId,
      storeName: formData.storeName,
      storeCode: formData.storeCode,
      machineName: formData.machineName,
      machineCode: formData.machineCode,
      componentName: formData.componentName,
      componentCode: formData.componentCode,
      operation: formData.operation,
      toolName: formData.toolName,
      productionQuantity: parseInt(formData.productionQuantity),
    };

    setTempProductions([...tempProductions, newItem]);
    setFormData({
      date: new Date().toISOString().split('T')[0],
      storeId: '',
      storeName: '',
      storeCode: '',
      machineName: '',
      machineCode: '',
      componentName: '',
      componentCode: '',
      operation: '',
      toolName: '',
      productionQuantity: '',
    });
    setError(null);
  };

  const handleEditTemp = (id: string) => {
    const item = tempProductions.find(p => p.id === id);
    if (item) {
      setFormData({
        date: item.date,
        storeId: item.storeId,
        storeName: item.storeName,
        storeCode: item.storeCode,
        machineName: item.machineName,
        machineCode: item.machineCode,
        componentName: item.componentName,
        componentCode: item.componentCode,
        operation: item.operation,
        toolName: item.toolName,
        productionQuantity: item.productionQuantity.toString(),
      });
      setEditingTempId(id);
    }
  };

  const handleSaveEdit = () => {
    if (editingTempId) {
      setTempProductions(tempProductions.map(p =>
        p.id === editingTempId
          ? {
              ...p,
              date: formData.date,
              storeId: formData.storeId,
              storeName: formData.storeName,
              storeCode: formData.storeCode,
              machineName: formData.machineName,
              machineCode: formData.machineCode,
              componentName: formData.componentName,
              componentCode: formData.componentCode,
              operation: formData.operation,
              toolName: formData.toolName,
              productionQuantity: parseInt(formData.productionQuantity),
            }
          : p
      ));
      setEditingTempId(null);
      setFormData({
        date: new Date().toISOString().split('T')[0],
        storeId: '',
        storeName: '',
        storeCode: '',
        machineName: '',
        machineCode: '',
        componentName: '',
        componentCode: '',
        operation: '',
        toolName: '',
        productionQuantity: '',
      });
    }
  };

  const handleDeleteTemp = (id: string) => {
    setTempProductions(tempProductions.filter(p => p.id !== id));
  };

  const handleCreateProductions = async () => {
    if (tempProductions.length === 0) {
      setError('Add at least one production record before creating');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      const response = await fetch('/api/production/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productions: tempProductions.map(p => ({
            date: p.date,
            storeId: p.storeId,
            machineName: p.machineName,
            machineCode: p.machineCode,
            componentName: p.componentName,
            componentCode: p.componentCode,
            operation: p.operation,
            toolName: p.toolName,
            productionQuantity: p.productionQuantity,
          })),
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const text = await response.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch (parseErr) {
        console.error('Failed to parse create response:', parseErr);
        setError('Failed to create production records - invalid response');
        return;
      }

      if (data.success) {
        setSuccessMessage('All production records created successfully!');
        setTempProductions([]);
        setFormData({
          date: new Date().toISOString().split('T')[0],
          storeId: '',
          storeName: '',
          storeCode: '',
          machineName: '',
          machineCode: '',
          componentName: '',
          componentCode: '',
          operation: '',
          toolName: '',
          productionQuantity: '',
        });
        await fetchSavedProductions();
        setTimeout(() => setSuccessMessage(null), 3000);
      } else {
        setError(data.error || 'Failed to create production records');
      }
    } catch (err) {
      console.error('Submit error:', err);
      setError('Failed to create production records');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteSaved = async (id: string) => {
    try {
      setDeleting(true);
      const response = await fetch(`/api/production/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setSavedProductions(savedProductions.filter(p => p.id !== id));
        setDeleteId(null);
        setSuccessMessage('Production record deleted successfully!');
        setTimeout(() => setSuccessMessage(null), 3000);
      } else {
        setError('Failed to delete production record');
      }
    } catch (err) {
      console.error('Delete error:', err);
      setError('Failed to delete production record');
    } finally {
      setDeleting(false);
    }
  };

  const filteredSavedProductions = savedProductions.filter(production =>
    (production.store?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    production.machineName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    production.componentName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <AppShell>
        <div className="flex items-center justify-center p-8">
          <div className="text-slate-600 dark:text-slate-400">Loading...</div>
        </div>
      </AppShell>
    );
  }

  if (error && error.includes('permission')) {
    return (
      <AppShell>
        <div className="p-8">
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-900 dark:bg-red-950">
            <p className="text-red-700 dark:text-red-200">{error}</p>
          </div>
        </div>
      </AppShell>
    );
  }

  const storeOptions = stores.map(store => ({
    value: store.id,
    label: store.name,
    subtitle: `Code: ${store.code}`,
  }));

  return (
    <AppShell>
      <div className="w-full px-4 py-8 sm:px-6 lg:px-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Production Entry</h1>
          <p className="mt-2 text-slate-600 dark:text-slate-400">Record production activities</p>
        </div>

        {/* Success Message */}
        {successMessage && (
          <div className="mb-6 rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-900 dark:bg-green-950">
            <p className="text-green-700 dark:text-green-200">✓ {successMessage}</p>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-900 dark:bg-red-950">
            <p className="text-red-700 dark:text-red-200">{error}</p>
          </div>
        )}

        {/* Form Section */}
        <div className="mb-8 rounded-lg border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-800">
          <h2 className="mb-6 text-lg font-semibold text-slate-900 dark:text-white">Add Production Record</h2>
          
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-6">
            {/* Date */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({...formData, date: e.target.value})}
                className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-slate-900 focus:border-slate-500 focus:ring-2 focus:ring-slate-500/20 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
              />
            </div>

            {/* Store Dropdown */}
            <SearchableSelect
              label="Store"
              required
              options={storeOptions}
              value={formData.storeId}
              onChange={(value) => handleStoreSelect(value)}
              placeholder="Select a store..."
              searchPlaceholder="Search stores..."
              disabled={stores.length === 0}
            />

            {/* Store Code (Auto-filled) */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Store Code
              </label>
              <input
                type="text"
                value={formData.storeCode}
                disabled
                className="w-full rounded-lg border border-slate-300 bg-slate-100 px-4 py-2.5 text-slate-600 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-400"
              />
            </div>

            {/* Machine Name */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Machine Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.machineName}
                onChange={(e) => setFormData({...formData, machineName: e.target.value})}
                placeholder="Enter machine name"
                className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-slate-900 placeholder-slate-400 focus:border-slate-500 focus:ring-2 focus:ring-slate-500/20 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
              />
            </div>

            {/* Machine Code */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Machine Code <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.machineCode}
                onChange={(e) => setFormData({...formData, machineCode: e.target.value})}
                placeholder="Enter machine code"
                className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-slate-900 placeholder-slate-400 focus:border-slate-500 focus:ring-2 focus:ring-slate-500/20 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
              />
            </div>

            {/* Component Name */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Component Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.componentName}
                onChange={(e) => setFormData({...formData, componentName: e.target.value})}
                placeholder="Enter component name"
                className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-slate-900 placeholder-slate-400 focus:border-slate-500 focus:ring-2 focus:ring-slate-500/20 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
              />
            </div>

            {/* Component Code */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Component Code <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.componentCode}
                onChange={(e) => setFormData({...formData, componentCode: e.target.value})}
                placeholder="Enter component code"
                className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-slate-900 placeholder-slate-400 focus:border-slate-500 focus:ring-2 focus:ring-slate-500/20 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
              />
            </div>

            {/* Operation */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Operation <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.operation}
                onChange={(e) => setFormData({...formData, operation: e.target.value})}
                placeholder="Enter operation"
                className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-slate-900 placeholder-slate-400 focus:border-slate-500 focus:ring-2 focus:ring-slate-500/20 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
              />
            </div>

            {/* Tool Name */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Tool Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.toolName}
                onChange={(e) => setFormData({...formData, toolName: e.target.value})}
                placeholder="Enter tool name"
                className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-slate-900 placeholder-slate-400 focus:border-slate-500 focus:ring-2 focus:ring-slate-500/20 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
              />
            </div>

            {/* Production Quantity */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Production Quantity <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                value={formData.productionQuantity}
                onChange={(e) => setFormData({...formData, productionQuantity: e.target.value})}
                placeholder="Enter quantity"
                className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-slate-900 placeholder-slate-400 focus:border-slate-500 focus:ring-2 focus:ring-slate-500/20 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
              />
            </div>
          </div>

          <button
            onClick={() => {
              if (editingTempId) {
                handleSaveEdit();
              } else {
                handleAddItem();
              }
            }}
            className="rounded-lg bg-black px-6 py-2.5 text-white font-medium hover:bg-slate-900 transition-colors dark:bg-slate-950 dark:hover:bg-black"
          >
            {editingTempId ? 'Save Item' : 'Add Item'}
          </button>
        </div>

        {/* Temporary Items Table */}
        {tempProductions.length > 0 && (
          <div className="mb-8">
            <h2 className="mb-4 text-lg font-semibold text-slate-900 dark:text-white">
              Items to Create ({tempProductions.length})
            </h2>
            <div className="overflow-x-auto">
              <div className="overflow-hidden rounded-lg border border-slate-200 dark:border-slate-700">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800">
                      <th className="px-4 py-3 text-left font-semibold text-slate-900 dark:text-white">Date</th>
                      <th className="px-4 py-3 text-left font-semibold text-slate-900 dark:text-white">Store</th>
                      <th className="px-4 py-3 text-left font-semibold text-slate-900 dark:text-white">Machine</th>
                      <th className="px-4 py-3 text-left font-semibold text-slate-900 dark:text-white">Component</th>
                      <th className="px-4 py-3 text-left font-semibold text-slate-900 dark:text-white">Operation</th>
                      <th className="px-4 py-3 text-left font-semibold text-slate-900 dark:text-white">Tool</th>
                      <th className="px-4 py-3 text-center font-semibold text-slate-900 dark:text-white">Qty</th>
                      <th className="px-4 py-3 text-right font-semibold text-slate-900 dark:text-white">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                    {tempProductions.map(prod => (
                      <tr
                        key={prod.id}
                        className={`hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors ${
                          editingTempId === prod.id ? 'bg-blue-50 dark:bg-blue-950' : ''
                        }`}
                      >
                        <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{prod.date}</td>
                        <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{prod.storeName} ({prod.storeCode})</td>
                        <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{prod.machineName}</td>
                        <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{prod.componentName}</td>
                        <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{prod.operation}</td>
                        <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{prod.toolName}</td>
                        <td className="px-4 py-3 text-center text-slate-600 dark:text-slate-300">{prod.productionQuantity}</td>
                        <td className="px-4 py-3 text-right space-x-2">
                          <button
                            onClick={() => handleEditTemp(prod.id)}
                            className="inline-flex items-center gap-1 rounded-lg border border-slate-300 px-2 py-1 text-xs text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700"
                          >
                            <Edit2 size={14} />
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteTemp(prod.id)}
                            className="inline-flex items-center gap-1 rounded-lg border border-red-300 px-2 py-1 text-xs text-red-700 hover:bg-red-50 dark:border-red-600 dark:text-red-300 dark:hover:bg-red-950"
                          >
                            <Trash2 size={14} />
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Create Button */}
            <div className="mt-6 flex gap-3">
              <button
                onClick={handleCreateProductions}
                disabled={isSubmitting}
                className="rounded-lg bg-black px-6 py-2.5 text-white font-medium hover:bg-slate-900 transition-colors disabled:opacity-50 dark:bg-slate-950 dark:hover:bg-black"
              >
                {isSubmitting ? 'Creating...' : 'Record Production'}
              </button>
            </div>
          </div>
        )}

        {/* Saved Productions Section - Only show if records exist */}
        {savedProductions.length > 0 && (
          <div className="space-y-4">
            {/* Hide/View Button */}
            <button
              onClick={() => setShowSavedTable(!showSavedTable)}
              className="mb-4 inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2.5 font-semibold text-slate-900 hover:bg-slate-50 transition-colors dark:border-slate-600 dark:bg-slate-800 dark:text-white dark:hover:bg-slate-700"
            >
              {showSavedTable ? <EyeOff size={20} /> : <Eye size={20} />}
              {showSavedTable ? 'Hide Saved Records' : 'View Saved Records'}
            </button>

            {showSavedTable && (
              <>
                {/* Search Input */}
                <input
                  type="text"
                  placeholder="Search by store, machine, or component..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-slate-900 placeholder-slate-400 focus:border-slate-500 focus:ring-2 focus:ring-slate-500/20 dark:border-slate-600 dark:bg-slate-700 dark:text-white dark:focus:border-slate-400"
                />

                {/* Saved Productions Table */}
                <div className="overflow-x-auto">
                  <div className="overflow-hidden rounded-lg border border-slate-200 dark:border-slate-700">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800">
                          <th className="px-4 py-3 text-left font-semibold text-slate-900 dark:text-white">Date</th>
                          <th className="px-4 py-3 text-left font-semibold text-slate-900 dark:text-white">Store Name</th>
                          <th className="px-4 py-3 text-left font-semibold text-slate-900 dark:text-white">Store Code</th>
                          <th className="px-4 py-3 text-left font-semibold text-slate-900 dark:text-white">Machine Name</th>
                          <th className="px-4 py-3 text-left font-semibold text-slate-900 dark:text-white">Machine Code</th>
                          <th className="px-4 py-3 text-left font-semibold text-slate-900 dark:text-white">Component Name</th>
                          <th className="px-4 py-3 text-left font-semibold text-slate-900 dark:text-white">Component Code</th>
                          <th className="px-4 py-3 text-left font-semibold text-slate-900 dark:text-white">Operation</th>
                          <th className="px-4 py-3 text-left font-semibold text-slate-900 dark:text-white">Tool Name</th>
                          <th className="px-4 py-3 text-center font-semibold text-slate-900 dark:text-white">Qty</th>
                          <th className="px-4 py-3 text-left font-semibold text-slate-900 dark:text-white">Created Date</th>
                          <th className="px-4 py-3 text-right font-semibold text-slate-900 dark:text-white">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                        {filteredSavedProductions.length === 0 ? (
                          <tr>
                            <td colSpan={12} className="px-4 py-8 text-center text-slate-500 dark:text-slate-400">
                              {searchTerm ? 'No records match your search.' : 'No saved records.'}
                            </td>
                          </tr>
                        ) : (
                          filteredSavedProductions.map(prod => (
                            <tr
                              key={prod.id}
                              className="hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                            >
                              <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{new Date(prod.date).toLocaleDateString()}</td>
                              <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{prod.store?.name || 'N/A'}</td>
                              <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                                <code className="rounded bg-slate-100 px-2 py-1 font-mono dark:bg-slate-800">
                                  {prod.store?.code || 'N/A'}
                                </code>
                              </td>
                              <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{prod.machineName}</td>
                              <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                                <code className="rounded bg-slate-100 px-2 py-1 font-mono dark:bg-slate-800">
                                  {prod.machineCode}
                                </code>
                              </td>
                              <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{prod.componentName}</td>
                              <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                                <code className="rounded bg-slate-100 px-2 py-1 font-mono dark:bg-slate-800">
                                  {prod.componentCode}
                                </code>
                              </td>
                              <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{prod.operation}</td>
                              <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{prod.toolName}</td>
                              <td className="px-4 py-3 text-center text-slate-600 dark:text-slate-300">{prod.productionQuantity}</td>
                              <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{new Date(prod.createdAt).toLocaleDateString()}</td>
                              <td className="px-4 py-3 text-right">
                                <div className="inline-flex items-center gap-2">
                                  <button
                                    onClick={() => {
                                      setFormData({
                                        date: prod.date,
                                        storeId: prod.storeId || '',
                                        storeName: prod.store?.name || '',
                                        storeCode: prod.store?.code || '',
                                        machineName: prod.machineName,
                                        machineCode: prod.machineCode,
                                        componentName: prod.componentName,
                                        componentCode: prod.componentCode,
                                        operation: prod.operation,
                                        toolName: prod.toolName,
                                        productionQuantity: prod.productionQuantity.toString(),
                                      });
                                      setShowSavedTable(false);
                                      window.scrollTo({ top: 0, behavior: 'smooth' });
                                    }}
                                    className="inline-flex items-center gap-1 rounded-lg border border-blue-300 px-2 py-1 text-xs text-blue-700 hover:bg-blue-50 dark:border-blue-600 dark:text-blue-300 dark:hover:bg-blue-950"
                                  >
                                    <Edit2 size={14} />
                                    Edit
                                  </button>
                                  <button
                                    onClick={() => setDeleteId(prod.id)}
                                    className="inline-flex items-center gap-1 rounded-lg border border-red-300 px-2 py-1 text-xs text-red-700 hover:bg-red-50 dark:border-red-600 dark:text-red-300 dark:hover:bg-red-950"
                                  >
                                    <Trash2 size={14} />
                                    Delete
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Results Count */}
                <div className="text-sm text-slate-600 dark:text-slate-400">
                  Showing {filteredSavedProductions.length} of {savedProductions.length} saved records
                </div>
              </>
            )}
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {deleteId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-lg dark:bg-slate-800">
              <h3 className="mb-2 text-lg font-semibold text-slate-900 dark:text-white">
                Delete Production Record
              </h3>
              <p className="mb-6 text-slate-600 dark:text-slate-300">
                Are you sure you want to delete this production record? This action cannot be undone.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setDeleteId(null)}
                  disabled={deleting}
                  className="flex-1 rounded-lg border border-slate-300 bg-white px-4 py-2 text-slate-900 font-medium hover:bg-slate-50 transition-colors disabled:opacity-50 dark:border-slate-600 dark:bg-slate-700 dark:text-white dark:hover:bg-slate-600"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDeleteSaved(deleteId)}
                  disabled={deleting}
                  className="flex-1 rounded-lg bg-red-600 px-4 py-2 text-white font-medium hover:bg-red-700 transition-colors disabled:opacity-50 dark:bg-red-700 dark:hover:bg-red-800"
                >
                  {deleting ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
