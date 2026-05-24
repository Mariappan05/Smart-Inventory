"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { Loader2, Plus, Trash2, Edit2, Check } from "lucide-react";
import toast from "react-hot-toast";

interface Store {
  id: string;
  code: string;
  name: string;
}

interface ProductItem {
  tempId: string;
  storeName: string;
  storeId: string;
  customerName: string;
  componentName: string;
  componentCode: string;
}

interface CreatedProduct {
  id: string;
  name: string;
  itemCode: string;
  storeId: string;
  description: string;
  customerName: string;
  createdAt: string;
}

export default function NewProductPage() {
  const router = useRouter();
  const [userRole, setUserRole] = useState<string | null>(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [stores, setStores] = useState<Store[]>([]);
  const [products, setProducts] = useState<CreatedProduct[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [editProductForm, setEditProductForm] = useState({
    customerName: "",
    name: "",
    itemCode: "",
  });
  
  const [form, setForm] = useState({
    storeId: "",
    storeName: "",
    customerName: "",
    componentName: "",
    componentCode: "",
  });

  const [pendingProducts, setPendingProducts] = useState<ProductItem[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch("/api/auth/check-role");
        const data = await response.json();
        
        if (!response.ok || !data.success) {
          router.push("/login");
          return;
        }

        const role = data.role;
        if (!role || !["ADMIN", "STORE_MANAGER"].includes(role)) {
          router.push("/");
          return;
        }

        setUserRole(role);
        fetchStores();
        fetchProducts();
      } catch (error) {
        router.push("/login");
      } finally {
        setIsCheckingAuth(false);
      }
    };

    checkAuth();
  }, [router]);

  const fetchStores = async () => {
    try {
      const res = await fetch("/api/plants");
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setStores(data.data);
      }
    } catch (error) {
      console.error("Error fetching stores:", error);
      toast.error("Failed to fetch stores");
    }
  };

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/products");
      const data = await res.json();
      
      if (data.success && Array.isArray(data.data)) {
        const productsWithStore = data.data.map((p: any) => {
          const store = stores.find(s => s.id === p.storeId);
          // Extract customer name from description (format: PRODUCT_CustomerName)
          const customerName = p.description?.startsWith("PRODUCT_") 
            ? p.description.substring(8) 
            : "";
          return {
            ...p,
            storeName: store?.name || "Unknown Store",
            customerName
          };
        });
        setProducts(productsWithStore);
      }
    } catch (error) {
      console.error("Error fetching products:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectProduct = (productId: string) => {
    setSelectedProducts(prev => 
      prev.includes(productId) 
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );
  };

  const handleSelectAllProducts = () => {
    if (selectedProducts.length === products.length) {
      setSelectedProducts([]);
    } else {
      setSelectedProducts(products.map(p => p.id));
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    if (!confirm("Are you sure you want to delete this product?")) return;

    try {
      setDeleting(true);
      const res = await fetch(`/api/products/${productId}`, {
        method: "DELETE",
      });

      const data = await res.json();
      if (data.success) {
        toast.success("Product deleted successfully");
        await fetchProducts();
      } else {
        toast.error(data.error || "Failed to delete product");
      }
    } catch (error) {
      console.error("Error deleting product:", error);
      toast.error("Failed to delete product");
    } finally {
      setDeleting(false);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedProducts.length === 0) {
      toast.error("Please select products to delete");
      return;
    }

    if (!confirm(`Are you sure you want to delete ${selectedProducts.length} product(s)?`)) return;

    try {
      setDeleting(true);
      let successCount = 0;

      for (const productId of selectedProducts) {
        try {
          const res = await fetch(`/api/products/${productId}`, {
            method: "DELETE",
          });
          const data = await res.json();
          if (data.success) successCount++;
        } catch (err) {
          console.error("Error deleting product:", err);
        }
      }

      if (successCount === selectedProducts.length) {
        toast.success(`Successfully deleted ${successCount} product(s)`);
      } else {
        toast.success(`Deleted ${successCount} of ${selectedProducts.length} product(s)`);
      }

      setSelectedProducts([]);
      await fetchProducts();
    } catch (error) {
      console.error("Error in bulk delete:", error);
      toast.error("Failed to delete products");
    } finally {
      setDeleting(false);
    }
  };

  const handleEditProduct = (product: CreatedProduct) => {
    setEditingProductId(product.id);
    setEditProductForm({
      customerName: product.customerName,
      name: product.name,
      itemCode: product.itemCode,
    });
  };

  const handleUpdateProduct = async (productId: string) => {
    if (!editProductForm.customerName.trim() || !editProductForm.name.trim() || !editProductForm.itemCode.trim()) {
      toast.error("All fields are required");
      return;
    }

    try {
      const res = await fetch(`/api/products/${productId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName: editProductForm.customerName,
          name: editProductForm.name,
          itemCode: editProductForm.itemCode,
        }),
      });

      const data = await res.json();
      if (data.success) {
        toast.success("Product updated successfully");
        setEditingProductId(null);
        await fetchProducts();
      } else {
        toast.error(data.error || "Failed to update product");
      }
    } catch (error) {
      console.error("Error updating product:", error);
      toast.error("Failed to update product");
    }
  };

  const handleStoreSelect = (storeId: string) => {
    const selectedStore = stores.find((s) => s.id === storeId);
    if (selectedStore) {
      setForm({
        ...form,
        storeId,
        storeName: selectedStore.name,
      });
    }
  };

  const validateForm = (): boolean => {
    if (!form.storeId.trim()) {
      toast.error("Please select a store");
      return false;
    }
    if (!form.customerName.trim()) {
      toast.error("Customer name is required");
      return false;
    }
    if (!form.componentName.trim()) {
      toast.error("Component name is required");
      return false;
    }
    if (!form.componentCode.trim()) {
      toast.error("Component code is required");
      return false;
    }
    return true;
  };

  const handleAddItem = () => {
    if (!validateForm()) return;

    // Check for duplicates in pending products
    const isDuplicate = pendingProducts.some(
      (p) => p.componentCode.toLowerCase() === form.componentCode.toLowerCase() && p.storeId === form.storeId
    );

    if (isDuplicate) {
      toast.error("This component code already exists in this store's list");
      return;
    }

    const newProduct: ProductItem = {
      tempId: `temp-${Date.now()}`,
      storeId: form.storeId,
      storeName: form.storeName,
      customerName: form.customerName,
      componentName: form.componentName,
      componentCode: form.componentCode,
    };

    if (editingId) {
      // Update existing item
      setPendingProducts(
        pendingProducts.map((p) =>
          p.tempId === editingId ? { ...newProduct, tempId: editingId } : p
        )
      );
      setEditingId(null);
      toast.success("Item updated");
    } else {
      // Add new item
      setPendingProducts([...pendingProducts, newProduct]);
      toast.success("Item added to list");
    }

    // Reset form
    setForm({
      storeId: "",
      storeName: "",
      customerName: "",
      componentName: "",
      componentCode: "",
    });
  };

  const handleEditItem = (item: ProductItem) => {
    setForm({
      storeId: item.storeId,
      storeName: item.storeName,
      customerName: item.customerName,
      componentName: item.componentName,
      componentCode: item.componentCode,
    });
    setEditingId(item.tempId);
  };

  const handleDeleteItem = (tempId: string) => {
    setPendingProducts(pendingProducts.filter((p) => p.tempId !== tempId));
    if (editingId === tempId) {
      setEditingId(null);
      setForm({
        storeId: "",
        storeName: "",
        customerName: "",
        componentName: "",
        componentCode: "",
      });
    }
    toast.success("Item removed");
  };

  const handleCreateAllProducts = async () => {
    if (pendingProducts.length === 0) {
      toast.error("Please add at least one product");
      return;
    }

    try {
      setSubmitting(true);
      let successCount = 0;
      const failedProducts: string[] = [];

      for (const product of pendingProducts) {
        try {
          const res = await fetch("/api/products", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              customerName: product.customerName,
              componentName: product.componentName,
              componentCode: product.componentCode,
              storeId: product.storeId,
            }),
          });

          const data = await res.json();
          if (data.success) {
            successCount++;
          } else {
            failedProducts.push(`${product.componentName} (${data.error})`);
          }
        } catch (err) {
          failedProducts.push(product.componentName);
        }
      }

      // Refresh products list
      await fetchProducts();

      // Show results
      if (successCount === pendingProducts.length) {
        toast.success(`✓ Successfully created ${successCount} product${successCount > 1 ? "s" : ""}!`);
      } else if (successCount > 0) {
        toast.success(
          `Created ${successCount} product${successCount > 1 ? "s" : ""}. ${failedProducts.length} failed.`
        );
      } else {
        toast.error("Failed to create products. " + failedProducts.join(", "));
      }

      // Clear pending products
      setPendingProducts([]);
    } catch (error) {
      console.error("Error creating products:", error);
      toast.error("Failed to create products");
    } finally {
      setSubmitting(false);
    }
  };

  if (isCheckingAuth) {
    return (
      <AppShell>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
        </div>
      </AppShell>
    );
  }

  if (!userRole) {
    return (
      <AppShell>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-center">
            <h2 className="text-lg font-semibold text-red-900">Access Denied</h2>
            <p className="mt-2 text-sm text-red-800">
              You do not have permission to access the Product Entry page.
            </p>
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="rounded-lg border border-slate-200 bg-white/70 p-6 shadow-panel dark:border-slate-700 dark:bg-slate-900/70">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">
            Product Entry
          </h1>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
            Add products for specific stores. Products will only be visible to users of their assigned store.
          </p>
        </div>

        {/* Form Section */}
        <div className="rounded-lg border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-800">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-6">
            {editingId ? "Edit Product" : "Add New Product"}
          </h2>

          <div className="space-y-6">
            {/* Store Selection */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Store <span className="text-red-500">*</span>
              </label>
              <select
                value={form.storeId}
                onChange={(e) => handleStoreSelect(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2 text-slate-900 placeholder-slate-400 focus:border-slate-500 focus:ring-1 focus:ring-slate-500 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
              >
                <option value="">Select a store...</option>
                {stores.map((store) => (
                  <option key={store.id} value={store.id}>
                    {store.name} ({store.code})
                  </option>
                ))}
              </select>
              {form.storeId && (
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                  Selected: <span className="font-semibold">{form.storeName}</span>
                </p>
              )}
            </div>

            {/* Customer Name */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Customer Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder="Enter customer name"
                value={form.customerName}
                onChange={(e) => setForm({ ...form, customerName: e.target.value })}
                className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2 text-slate-900 placeholder-slate-400 focus:border-slate-500 focus:ring-1 focus:ring-slate-500 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
              />
            </div>

            {/* Component Name */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Component Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder="Enter component name"
                value={form.componentName}
                onChange={(e) => setForm({ ...form, componentName: e.target.value })}
                className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2 text-slate-900 placeholder-slate-400 focus:border-slate-500 focus:ring-1 focus:ring-slate-500 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
              />
            </div>

            {/* Component Code */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Component Code <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder="Enter component code"
                value={form.componentCode}
                onChange={(e) => setForm({ ...form, componentCode: e.target.value })}
                className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2 text-slate-900 placeholder-slate-400 focus:border-slate-500 focus:ring-1 focus:ring-slate-500 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
              />
            </div>

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
                    setForm({
                      storeId: "",
                      storeName: "",
                      customerName: "",
                      componentName: "",
                      componentCode: "",
                    });
                  }}
                  className="rounded-lg border border-slate-300 px-6 py-2 text-slate-700 hover:bg-slate-50 transition-colors dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700 font-medium"
                >
                  Cancel
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Pending Products Table */}
        {pendingProducts.length > 0 && (
          <div className="rounded-lg border border-slate-200 dark:border-slate-700 overflow-x-auto">
            <div className="border-b border-slate-200 bg-slate-50 px-6 py-3 dark:border-slate-700 dark:bg-slate-800/50">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                Products to Create ({pendingProducts.length})
              </h2>
            </div>
            <table className="w-full">
              <thead className="border-b border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900 dark:text-slate-100">
                    Store
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900 dark:text-slate-100">
                    Customer Name
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900 dark:text-slate-100">
                    Component Name
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900 dark:text-slate-100">
                    Component Code
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900 dark:text-slate-100">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                {pendingProducts.map((product) => (
                  <tr key={product.tempId} className="hover:bg-slate-50 dark:hover:bg-slate-700/30">
                    <td className="px-6 py-4 text-sm text-slate-900 dark:text-slate-100">
                      {product.storeName}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-900 dark:text-slate-100">
                      {product.customerName}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-900 dark:text-slate-100">
                      {product.componentName}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">
                      {product.componentCode}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleEditItem(product)}
                          className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteItem(product.tempId)}
                          className="p-1 rounded hover:bg-red-200 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="p-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 flex justify-between items-center">
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Ready to create {pendingProducts.length} product{pendingProducts.length > 1 ? "s" : ""}
              </p>
              <button
                onClick={handleCreateAllProducts}
                disabled={submitting}
                className="inline-flex items-center gap-2 rounded-lg bg-black px-6 py-2 text-white hover:bg-gray-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium dark:bg-slate-950 dark:hover:bg-black"
              >
                {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                Create Products
              </button>
            </div>
          </div>
        )}

        {/* Created Products Table */}
        <div className="rounded-lg border border-slate-200 dark:border-slate-700 overflow-x-auto">
          <div className="border-b border-slate-200 bg-slate-50 px-6 py-3 dark:border-slate-700 dark:bg-slate-800/50 flex justify-between items-center">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
              Created Products ({products.length})
            </h2>
            {selectedProducts.length > 0 && (
              <button
                onClick={handleBulkDelete}
                disabled={deleting}
                className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm text-white hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                {deleting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
                Delete Selected ({selectedProducts.length})
              </button>
            )}
          </div>
          <table className="w-full">
            <thead className="border-b border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800">
              <tr>
                <th className="px-6 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={products.length > 0 && selectedProducts.length === products.length}
                    onChange={handleSelectAllProducts}
                    className="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-500"
                  />
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900 dark:text-slate-100">
                  Store
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900 dark:text-slate-100">
                  Customer Name
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900 dark:text-slate-100">
                  Product Name
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900 dark:text-slate-100">
                  Product Code
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900 dark:text-slate-100">
                  Created At
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900 dark:text-slate-100">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-slate-500 dark:text-slate-400">
                    <div className="flex items-center justify-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Loading products...
                    </div>
                  </td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-slate-500 dark:text-slate-400">
                    No products created yet
                  </td>
                </tr>
              ) : (
                products.map((product) => (
                  <tr key={product.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30">
                    <td className="px-6 py-4">
                      <input
                        type="checkbox"
                        checked={selectedProducts.includes(product.id)}
                        onChange={() => handleSelectProduct(product.id)}
                        className="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-500"
                      />
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-900 dark:text-slate-100">
                      {stores.find(s => s.id === product.storeId)?.name || "Unknown"}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-900 dark:text-slate-100">
                      {editingProductId === product.id ? (
                        <input
                          type="text"
                          value={editProductForm.customerName}
                          onChange={(e) => setEditProductForm({ ...editProductForm, customerName: e.target.value })}
                          className="w-full rounded border border-slate-300 px-2 py-1 text-sm dark:border-slate-600 dark:bg-slate-700"
                        />
                      ) : (
                        product.customerName
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-900 dark:text-slate-100">
                      {editingProductId === product.id ? (
                        <input
                          type="text"
                          value={editProductForm.name}
                          onChange={(e) => setEditProductForm({ ...editProductForm, name: e.target.value })}
                          className="w-full rounded border border-slate-300 px-2 py-1 text-sm dark:border-slate-600 dark:bg-slate-700"
                        />
                      ) : (
                        product.name
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">
                      {editingProductId === product.id ? (
                        <input
                          type="text"
                          value={editProductForm.itemCode}
                          onChange={(e) => setEditProductForm({ ...editProductForm, itemCode: e.target.value })}
                          className="w-full rounded border border-slate-300 px-2 py-1 text-sm dark:border-slate-600 dark:bg-slate-700"
                        />
                      ) : (
                        product.itemCode
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">
                      {new Date(product.createdAt).toLocaleDateString("en-GB", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                      })}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <div className="flex items-center gap-2">
                        {editingProductId === product.id ? (
                          <>
                            <button
                              onClick={() => handleUpdateProduct(product.id)}
                              className="p-1 rounded hover:bg-green-100 dark:hover:bg-green-900/30 text-green-600 dark:text-green-400"
                              title="Save"
                            >
                              <Check className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => setEditingProductId(null)}
                              className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400"
                              title="Cancel"
                            >
                              ✕
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => handleEditProduct(product)}
                              className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300"
                              title="Edit"
                            >
                              <Edit2 className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteProduct(product.id)}
                              disabled={deleting}
                              className="p-1 rounded hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 disabled:opacity-50"
                              title="Delete"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </AppShell>
  );
}
