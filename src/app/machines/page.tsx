'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AppShell } from '@/components/layout/AppShell';
import { SearchableSelect } from '@/components/ui/SearchableSelect';
import { Eye, EyeOff, Edit2, Trash2 } from 'lucide-react';

interface Machine {
  id: string;
  name: string;
  code: string;
  storeId: string;
  store?: {
    name: string;
    code: string;
  };
  createdAt: string;
  updatedAt: string;
}

interface TemporaryMachine {
  id: string;
  storeName: string;
  storeCode: string;
  storeId: string;
  name: string;
  code: string;
}

interface Store {
  id: string;
  name: string;
  code: string;
}

interface ApiResponse {
  success: boolean;
  data?: {
    data: Machine[];
    total: number;
    page: number;
    pageSize: number;
  };
  error?: string;
  message?: string;
}

interface FormData {
  storeName: string;
  storeCode: string;
  storeId: string;
  machineName: string;
  machineCode: string;
}

export default function MachinesPage() {
  const router = useRouter();
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Temporary items (for current session)
  const [tempMachines, setTempMachines] = useState<TemporaryMachine[]>([]);
  const [editingTempId, setEditingTempId] = useState<string | null>(null);
  
  // Database machines (saved records)
  const [savedMachines, setSavedMachines] = useState<Machine[]>([]);
  const [showSavedTable, setShowSavedTable] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState<FormData>({
    storeName: '',
    storeCode: '',
    storeId: '',
    machineName: '',
    machineCode: '',
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    checkAuthAndLoadData();
  }, []);

  const checkAuthAndLoadData = async () => {
    try {
      const profileRes = await fetch('/api/profile');
      const profileData = await profileRes.json();

      if (!profileRes.ok || !profileData.success) {
        router.push('/login');
        return;
      }

      const userRole = profileData.data?.role;
      if (!['ADMIN', 'STORE_MANAGER'].includes(userRole)) {
        setError('You do not have permission to access this page');
        setLoading(false);
        return;
      }

      await Promise.all([loadStores(), fetchSavedMachines()]);
    } catch (err) {
      console.error('Auth check error:', err);
      setError('Failed to verify authorization');
      setLoading(false);
    }
  };

  const loadStores = async () => {
    try {
      const response = await fetch('/api/stores');
      const data = await response.json();
      if (data.success) {
        setStores(data.data || []);
      }
    } catch (err) {
      console.error('Error loading stores:', err);
    }
  };

  const fetchSavedMachines = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/machines?page=1&pageSize=50');
      const data: ApiResponse = await response.json();

      if (data.success && data.data) {
        setSavedMachines(data.data.data);
      } else {
        setError(data.error || 'Failed to fetch machines');
      }
    } catch (err) {
      console.error('Fetch error:', err);
      setError('Failed to fetch machines');
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
    if (!formData.storeId || !formData.machineName || !formData.machineCode) {
      setError('All fields are required');
      return;
    }

    const newItem: TemporaryMachine = {
      id: Date.now().toString(),
      storeName: formData.storeName,
      storeCode: formData.storeCode,
      storeId: formData.storeId,
      name: formData.machineName,
      code: formData.machineCode,
    };

    setTempMachines([...tempMachines, newItem]);
    setFormData({
      storeName: '',
      storeCode: '',
      storeId: '',
      machineName: '',
      machineCode: '',
    });
    setError(null);
  };

  const handleEditTemp = (id: string) => {
    const item = tempMachines.find(m => m.id === id);
    if (item) {
      setFormData({
        storeName: item.storeName,
        storeCode: item.storeCode,
        storeId: item.storeId,
        machineName: item.name,
        machineCode: item.code,
      });
      setEditingTempId(id);
    }
  };

  const handleSaveEdit = () => {
    if (editingTempId) {
      setTempMachines(tempMachines.map(m =>
        m.id === editingTempId
          ? {
              ...m,
              storeName: formData.storeName,
              storeCode: formData.storeCode,
              storeId: formData.storeId,
              name: formData.machineName,
              code: formData.machineCode,
            }
          : m
      ));
      setEditingTempId(null);
      setFormData({
        storeName: '',
        storeCode: '',
        storeId: '',
        machineName: '',
        machineCode: '',
      });
    }
  };

  const handleDeleteTemp = (id: string) => {
    setTempMachines(tempMachines.filter(m => m.id !== id));
  };

  const handleCreateMachines = async () => {
    if (tempMachines.length === 0) {
      setError('Add at least one machine before creating');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      const response = await fetch('/api/machines/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          machines: tempMachines.map(m => ({
            name: m.name,
            code: m.code,
            storeId: m.storeId,
          })),
        }),
      });

      const data = await response.json();

      if (data.success) {
        setSuccessMessage('All machines created successfully!');
        setTempMachines([]);
        setFormData({
          storeName: '',
          storeCode: '',
          storeId: '',
          machineName: '',
          machineCode: '',
        });
        await fetchSavedMachines();
        setTimeout(() => setSuccessMessage(null), 3000);
      } else {
        setError(data.error || 'Failed to create machines');
      }
    } catch (err) {
      console.error('Submit error:', err);
      setError('Failed to create machines');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteSaved = async (id: string) => {
    try {
      setDeleting(true);
      const response = await fetch(`/api/machines/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setSavedMachines(savedMachines.filter(m => m.id !== id));
        setDeleteId(null);
        setSuccessMessage('Machine deleted successfully!');
        setTimeout(() => setSuccessMessage(null), 3000);
      } else {
        setError('Failed to delete machine');
      }
    } catch (err) {
      console.error('Delete error:', err);
      setError('Failed to delete machine');
    } finally {
      setDeleting(false);
    }
  };

  const filteredSavedMachines = savedMachines.filter(machine =>
    machine.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    machine.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    machine.store?.name.toLowerCase().includes(searchTerm.toLowerCase())
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
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Machine Entry</h1>
          <p className="mt-2 text-slate-600 dark:text-slate-400">Add machines to the system</p>
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
          <h2 className="mb-6 text-lg font-semibold text-slate-900 dark:text-white">Add New Machine</h2>
          
          <div className="grid gap-4 sm:grid-cols-2 mb-6">
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
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
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
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Machine Name *
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
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Machine Code *
              </label>
              <input
                type="text"
                value={formData.machineCode}
                onChange={(e) => setFormData({...formData, machineCode: e.target.value})}
                placeholder="Enter machine code"
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
        {tempMachines.length > 0 && (
          <div className="mb-8">
            <h2 className="mb-4 text-lg font-semibold text-slate-900 dark:text-white">
              Items to Create ({tempMachines.length})
            </h2>
            <div className="overflow-hidden rounded-lg border border-slate-200 dark:border-slate-700">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800">
                    <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900 dark:text-white">
                      Store
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900 dark:text-white">
                      Machine Name
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900 dark:text-white">
                      Machine Code
                    </th>
                    <th className="px-6 py-3 text-right text-sm font-semibold text-slate-900 dark:text-white">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                  {tempMachines.map(machine => (
                    <tr
                      key={machine.id}
                      className={`hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors ${
                        editingTempId === machine.id ? 'bg-blue-50 dark:bg-blue-950' : ''
                      }`}
                    >
                      <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300">
                        {machine.storeName} ({machine.storeCode})
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-900 dark:text-white font-medium">
                        {machine.name}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300">
                        <code className="rounded bg-slate-100 px-2 py-1 dark:bg-slate-800">
                          {machine.code}
                        </code>
                      </td>
                      <td className="px-6 py-4 text-right text-sm space-x-2">
                        <button
                          onClick={() => handleEditTemp(machine.id)}
                          className="inline-flex items-center gap-1 rounded-lg border border-slate-300 px-3 py-1.5 text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700"
                        >
                          <Edit2 size={16} />
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteTemp(machine.id)}
                          className="inline-flex items-center gap-1 rounded-lg border border-red-300 px-3 py-1.5 text-red-700 hover:bg-red-50 dark:border-red-600 dark:text-red-300 dark:hover:bg-red-950"
                        >
                          <Trash2 size={16} />
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Create Button */}
            <div className="mt-6 flex gap-3">
              <button
                onClick={handleCreateMachines}
                disabled={isSubmitting}
                className="rounded-lg bg-black px-6 py-2.5 text-white font-medium hover:bg-slate-900 transition-colors disabled:opacity-50 dark:bg-slate-950 dark:hover:bg-black"
              >
                {isSubmitting ? 'Creating...' : 'Create Machine'}
              </button>
            </div>
          </div>
        )}

        {/* Saved Machines Section - Only show if machines exist */}
        {savedMachines.length > 0 && (
          <div className="space-y-4">
            {/* Hide/View Button */}
            <button
              onClick={() => setShowSavedTable(!showSavedTable)}
              className="mb-4 inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2.5 font-semibold text-slate-900 hover:bg-slate-50 transition-colors dark:border-slate-600 dark:bg-slate-800 dark:text-white dark:hover:bg-slate-700"
            >
              {showSavedTable ? <EyeOff size={20} /> : <Eye size={20} />}
              {showSavedTable ? 'Hide Saved Machines' : 'View Saved Machines'}
            </button>

            {showSavedTable && (
              <>
                {/* Search Input */}
                <input
                  type="text"
                  placeholder="Search by name, code, or store..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-slate-900 placeholder-slate-400 focus:border-slate-500 focus:ring-2 focus:ring-slate-500/20 dark:border-slate-600 dark:bg-slate-700 dark:text-white dark:focus:border-slate-400"
                />

                {/* Saved Machines Table */}
                <div className="overflow-hidden rounded-lg border border-slate-200 dark:border-slate-700">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800">
                        <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900 dark:text-white">
                          Store Name
                        </th>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900 dark:text-white">
                          Store Code
                        </th>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900 dark:text-white">
                          Machine Name
                        </th>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900 dark:text-white">
                          Machine Code
                        </th>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900 dark:text-white">
                          Created Date
                        </th>
                        <th className="px-6 py-3 text-right text-sm font-semibold text-slate-900 dark:text-white">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                      {filteredSavedMachines.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="px-6 py-8 text-center text-slate-500 dark:text-slate-400">
                            {searchTerm ? 'No machines match your search.' : 'No saved machines.'}
                          </td>
                        </tr>
                      ) : (
                        filteredSavedMachines.map(machine => (
                          <tr
                            key={machine.id}
                            className="hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                          >
                            <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300">
                              {machine.store?.name || 'Unknown'}
                            </td>
                            <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300">
                              <code className="rounded bg-slate-100 px-2 py-1 font-mono dark:bg-slate-800">
                                {machine.store?.code || 'N/A'}
                              </code>
                            </td>
                            <td className="px-6 py-4 text-sm font-medium text-slate-900 dark:text-white">
                              {machine.name}
                            </td>
                            <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300">
                              <code className="rounded bg-slate-100 px-2 py-1 font-mono dark:bg-slate-800">
                                {machine.code}
                              </code>
                            </td>
                            <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300">
                              {new Date(machine.createdAt).toLocaleDateString()}
                            </td>
                            <td className="px-6 py-4 text-right text-sm space-x-2">
                              <button
                                onClick={() => {
                                  setFormData({
                                    storeName: machine.store?.name || '',
                                    storeCode: machine.store?.code || '',
                                    storeId: machine.storeId || '',
                                    machineName: machine.name,
                                    machineCode: machine.code,
                                  });
                                  window.scrollTo({ top: 0, behavior: 'smooth' });
                                }}
                                className="inline-flex items-center gap-1 rounded-lg border border-blue-300 px-3 py-1.5 text-blue-700 hover:bg-blue-50 dark:border-blue-600 dark:text-blue-300 dark:hover:bg-blue-950"
                              >
                                <Edit2 size={16} />
                                Edit
                              </button>
                              <button
                                onClick={() => setDeleteId(machine.id)}
                                className="inline-flex items-center gap-1 rounded-lg border border-red-300 px-3 py-1.5 text-red-700 hover:bg-red-50 dark:border-red-600 dark:text-red-300 dark:hover:bg-red-950"
                              >
                                <Trash2 size={16} />
                                Delete
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Results Count */}
                <div className="text-sm text-slate-600 dark:text-slate-400">
                  Showing {filteredSavedMachines.length} of {savedMachines.length} saved machines
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
                Delete Machine
              </h3>
              <p className="mb-6 text-slate-600 dark:text-slate-300">
                Are you sure you want to delete this machine? This action cannot be undone.
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
