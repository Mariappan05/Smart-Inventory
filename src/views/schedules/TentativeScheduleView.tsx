"use client";

import { useState, useEffect } from "react";
import { Calendar, Plus, Trash2, Loader2, X, Search } from "lucide-react";
import { Select } from "@/components/ui/Select";
import toast from "react-hot-toast";
import { fmtDate } from "@/utils/dateFormat";

const GST_RATE = 0.18;

type Supplier = { id: string; name: string; code: string };
type Type = { id: string; name: string; supplierId: string | null };
type Item = {
  id: string;
  name: string;
  variant: string | null;
  itemCode: string | null;
  description: string;
  imagesJson: string | null;
  unitPrice: number | null;
  supplierId: string | null;
  typeId: string | null;
  stockQuantity: number;
  minimumQuantity: number;
  reorderQuantity: number;
};
type Store = { id: string; name: string };

type Schedule = {
  id: string;
  scheduleDate: string;
  supplier: Supplier;
  type: Type;
  item: Item;
  store: Store;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  gstAmount: number;
  totalWithGst: number;
  orderDeliveryDate: string;
  status: string;
  createdAt: string;
  notes?: string | null;
};

type SelectedProductItem = {
  item: Item;
  quantity: number;
};

type Props = {
  suppliers: Supplier[];
  types: Type[];
  items: Item[];
  stores: Store[];
};

export function TentativeScheduleView({ suppliers, types, items, stores }: Props) {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form with Company Name and Product Search
  const [form, setForm] = useState({
    supplierId: "",
    productSearch: "",
  });

  // Selected products with quantities
  const [selectedProducts, setSelectedProducts] = useState<SelectedProductItem[]>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  
  // Helper to get first image from imagesJson
  const getItemImage = (item: Item) => {
    if (!item.imagesJson) return null;
    try {
      const images = JSON.parse(item.imagesJson);
      return Array.isArray(images) && images.length > 0 ? images[0] : null;
    } catch {
      return null;
    }
  };

  // Get products filtered by supplier and search term
  const getFilteredProducts = () => {
    let filtered = items;
    
    if (form.supplierId) {
      filtered = filtered.filter((i) => i.supplierId === form.supplierId);
    }
    
    if (form.productSearch.trim()) {
      const searchLower = form.productSearch.toLowerCase();
      filtered = filtered.filter((i) =>
        i.name.toLowerCase().includes(searchLower)
      );
    }
    
    return filtered;
  };

  const filteredProducts = getFilteredProducts();
  
  // Auto-populate from selected item
  const getOrderDeliveryDate = () => {
    const today = new Date();
    today.setDate(today.getDate() + 14); // 14 days from today
    return today.toISOString().split("T")[0];
  };

  const selectedSupplier = form.supplierId ? suppliers.find((s) => s.id === form.supplierId) : null;
  const selectedStore = stores.length > 0 ? stores[0] : null;

  // Calculate totals for all selected products
  const totalCalculations = selectedProducts.reduce(
    (acc, { item, quantity }) => {
      const unitPrice = item.unitPrice || 0;
      const basePrice = quantity * unitPrice;
      const gst = basePrice * GST_RATE;
      return {
        baseTotal: acc.baseTotal + basePrice,
        gstTotal: acc.gstTotal + gst,
        totalWithGst: acc.totalWithGst + basePrice + gst,
      };
    },
    { baseTotal: 0, gstTotal: 0, totalWithGst: 0 }
  );

  useEffect(() => {
    fetchSchedules();
  }, []);

  const fetchSchedules = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/schedules?status=TENTATIVE");
      const data = await response.json();
      if (data.success) {
        setSchedules(data.data);
      }
    } catch (error) {
      toast.error("Failed to fetch schedules");
    } finally {
      setLoading(false);
    }
  };

  const handleAddProduct = (item: Item) => {
    // Check if product is already selected
    const existingProduct = selectedProducts.find((p) => p.item.id === item.id);
    if (existingProduct) {
      toast.error("This product is already selected");
      return;
    }
    
    // Add product with default quantity of 1
    setSelectedProducts([...selectedProducts, { item, quantity: 1 }]);
    setForm({ ...form, productSearch: "" });
    setShowSearchResults(false);
    toast.success(`${item.name} added`);
  };

  const handleRemoveProduct = (itemId: string) => {
    setSelectedProducts(selectedProducts.filter((p) => p.item.id !== itemId));
  };

  const handleQuantityChange = (itemId: string, newQuantity: number) => {
    if (newQuantity < 1) return;
    setSelectedProducts(
      selectedProducts.map((p) =>
        p.item.id === itemId ? { ...p, quantity: newQuantity } : p
      )
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!form.supplierId) {
      toast.error("Please select a company");
      return;
    }

    if (selectedProducts.length === 0) {
      toast.error("Please select at least one product");
      return;
    }

    if (!selectedStore) {
      toast.error("No Store available");
      return;
    }

    setSubmitting(true);

    try {
      const today = new Date();
      const deliveryDate = new Date(today);
      deliveryDate.setDate(deliveryDate.getDate() + 14);

      // Prepare products data with details
      const productsData = selectedProducts.map(({ item, quantity }) => ({
        itemId: item.id,
        name: item.name,
        variant: item.variant,
        itemCode: item.itemCode,
        quantity: quantity,
        unitPrice: item.unitPrice || 0,
        totalPrice: quantity * (item.unitPrice || 0),
      }));

      // Calculate overall totals
      const overallTotal = productsData.reduce((sum, p) => sum + p.totalPrice, 0);
      const overallGst = overallTotal * GST_RATE;
      const overallTotalWithGst = overallTotal + overallGst;

      // Use first product's item for the main schedule record
      const firstProduct = selectedProducts[0];
      
      const response = await fetch("/api/schedules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scheduleDate: today.toISOString(),
          supplierId: form.supplierId,
          typeId: firstProduct.item.typeId || null,
          itemId: firstProduct.item.id,
          storeId: selectedStore.id,
          quantity: selectedProducts.reduce((sum, p) => sum + p.quantity, 0),
          unitPrice: overallTotal / selectedProducts.reduce((sum, p) => sum + p.quantity, 0),
          orderDeliveryDate: deliveryDate.toISOString(),
          notes: JSON.stringify({ products: productsData }),
        }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message);
      }

      toast.success(`Schedule created with ${selectedProducts.length} product(s)`);
      setForm({ supplierId: "", productSearch: "" });
      setSelectedProducts([]);
      fetchSchedules();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to create schedule");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this schedule?")) return;

    try {
      const response = await fetch(`/api/schedules/${id}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message);
      }

      toast.success("Schedule deleted");
      fetchSchedules();
    } catch (error) {
      toast.error("Failed to delete schedule");
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
          Schedule Management
        </p>
        <h1 className="text-3xl font-semibold text-slate-900 dark:text-slate-100">
          Tentative Schedule
        </h1>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
          Create monthly order schedules for suppliers
        </p>
      </div>

      {/* Order Form */}
      <form onSubmit={handleSubmit} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-panel dark:border-slate-700 dark:bg-slate-900/70">
        <div className="mb-5 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900">
            <Calendar className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
              Create Order Schedule
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Fill in the details to create a tentative schedule
            </p>
          </div>
        </div>

        {/* Company Name Dropdown */}
        <div className="mb-4">
          <Select
            label="Company Name"
            value={form.supplierId}
            onChange={(e) => setForm({ ...form, supplierId: e.target.value })}
            placeholder="Select a company"
            options={suppliers.map((s) => ({
              value: s.id,
              label: s.name,
            }))}
            error={!form.supplierId && submitting ? "Required" : ""}
          />
        </div>

        {/* Product Name Search Field */}
        {form.supplierId && (
          <div className="mb-4 relative">
            <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
              Product Name <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={form.productSearch}
                onChange={(e) => {
                  setForm({ ...form, productSearch: e.target.value });
                  setShowSearchResults(true);
                }}
                onFocus={() => setShowSearchResults(true)}
                placeholder="Search for products (e.g., roller tappet injector)"
                className="w-full rounded-xl border border-slate-300 pl-10 pr-4 py-3 text-sm shadow-sm outline-none transition-all duration-200 hover:border-slate-400 hover:shadow-md focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
              />
            </div>

            {/* Search Results Dropdown */}
            {showSearchResults && form.productSearch && filteredProducts.length > 0 && (
              <div className="absolute top-full z-10 mt-1 max-h-96 w-full overflow-y-auto rounded-lg border border-slate-200 bg-white shadow-lg dark:border-slate-600 dark:bg-slate-800">
                {filteredProducts.map((item) => {
                  const itemType = types.find((t) => t.id === item.typeId);
                  const itemImage = getItemImage(item);
                  const productType = item.variant?.split(" - ")[0] || "-";
                  const diameter = item.variant?.split(" - ")[1] || "-";
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleAddProduct(item)}
                      className="w-full border-b border-slate-100 px-4 py-3 text-left transition-colors hover:bg-blue-50 dark:border-slate-700 dark:hover:bg-blue-950"
                    >
                      <div className="flex gap-3">
                        {/* Product Image */}
                        <div className="flex-shrink-0">
                          {itemImage ? (
                            <img
                              src={itemImage}
                              alt={item.name}
                              className="h-16 w-16 rounded-lg border border-slate-200 object-cover dark:border-slate-600"
                            />
                          ) : (
                            <div className="flex h-16 w-16 items-center justify-center rounded-lg border border-slate-200 bg-slate-100 text-slate-400 dark:border-slate-600 dark:bg-slate-700">
                              <span className="text-xs">No Image</span>
                            </div>
                          )}
                        </div>
                        {/* Product Details */}
                        <div className="flex-1 space-y-1">
                          <p className="font-semibold text-slate-900 dark:text-slate-100">{item.name}</p>
                          <div className="grid grid-cols-2 gap-x-4 gap-y-0.5 text-xs text-slate-600 dark:text-slate-400">
                            <p><span className="font-medium">Type:</span> {productType}</p>
                            <p><span className="font-medium">Diameter:</span> {diameter}</p>
                            <p><span className="font-medium">Code:</span> {item.itemCode || "-"}</p>
                            <p><span className="font-medium">Price:</span> ₹{item.unitPrice || 0}</p>
                            <p><span className="font-medium">Stock:</span> {item.stockQuantity}</p>
                            <p><span className="font-medium">Min:</span> {item.minimumQuantity}</p>
                          </div>
                          {item.description && (
                            <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1">
                              {item.description}
                            </p>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            {showSearchResults && form.productSearch && filteredProducts.length === 0 && (
              <div className="absolute top-full z-10 mt-1 w-full rounded-lg border border-slate-200 bg-white p-3 text-center text-sm text-slate-500 shadow-lg dark:border-slate-600 dark:bg-slate-800 dark:text-slate-400">
                No matching products found
              </div>
            )}
          </div>
        )}

        {/* Selected Products List */}
        {selectedProducts.length > 0 && (
          <div className="mb-6 space-y-3">
            <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              Selected Products ({selectedProducts.length})
            </h3>
            <div className="space-y-2 rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-950/30">
              {selectedProducts.map(({ item, quantity }) => {
                const selectedType = types.find((t) => t.id === item.typeId);
                const itemImage = getItemImage(item);
                const productType = item.variant?.split(" - ")[0] || "-";
                const diameter = item.variant?.split(" - ")[1] || "-";
                const unitPrice = item.unitPrice || 0;
                const totalPrice = quantity * unitPrice;
                const gstAmount = totalPrice * GST_RATE;
                const totalWithGst = totalPrice + gstAmount;
                return (
                  <div
                    key={item.id}
                    className="flex items-start gap-3 rounded-lg border border-blue-200 bg-white p-3 dark:border-blue-700 dark:bg-slate-800"
                  >
                    {/* Product Image */}
                    <div className="flex-shrink-0">
                      {itemImage ? (
                        <img
                          src={itemImage}
                          alt={item.name}
                          className="h-16 w-16 rounded-lg border border-slate-200 object-cover dark:border-slate-600"
                        />
                      ) : (
                        <div className="flex h-16 w-16 items-center justify-center rounded-lg border border-slate-200 bg-slate-100 text-slate-400 dark:border-slate-600 dark:bg-slate-700">
                          <span className="text-xs">No Image</span>
                        </div>
                      )}
                    </div>
                    {/* Product Details */}
                    <div className="flex-1">
                      <p className="font-medium text-slate-900 dark:text-slate-100">{item.name}</p>
                      <div className="mt-1 grid grid-cols-2 gap-x-3 text-xs text-slate-600 dark:text-slate-400">
                        <p>Type: {productType}</p>
                        <p>Diameter: {diameter}</p>
                        <p>Code: {item.itemCode || "-"}</p>
                        <p>Unit Price: ₹{unitPrice}</p>
                        <p>Stock: {item.stockQuantity}</p>
                        <p>Min: {item.minimumQuantity}</p>
                      </div>
                      <div className="mt-2 rounded bg-slate-100 p-2 dark:bg-slate-700">
                        <div className="grid grid-cols-3 gap-2 text-xs">
                          <div>
                            <p className="text-slate-500 dark:text-slate-400">Total</p>
                            <p className="font-semibold text-slate-900 dark:text-slate-100">₹{totalPrice.toFixed(2)}</p>
                          </div>
                          <div>
                            <p className="text-slate-500 dark:text-slate-400">GST (18%)</p>
                            <p className="font-semibold text-orange-600 dark:text-orange-400">₹{gstAmount.toFixed(2)}</p>
                          </div>
                          <div>
                            <p className="text-slate-500 dark:text-slate-400">With GST</p>
                            <p className="font-semibold text-green-600 dark:text-green-400">₹{totalWithGst.toFixed(2)}</p>
                          </div>
                        </div>
                      </div>
                      {item.description && (
                        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 line-clamp-1">
                          {item.description}
                        </p>
                      )}
                    </div>
                    {/* Quantity and Remove */}
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="1"
                        value={quantity}
                        onChange={(e) =>
                          handleQuantityChange(item.id, parseInt(e.target.value) || 1)
                        }
                        className="w-16 rounded-lg border border-slate-300 px-2 py-1.5 text-sm dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveProduct(item.id)}
                        className="inline-flex items-center gap-1 rounded-lg border border-red-200 px-2.5 py-1.5 text-red-600 transition-all duration-200 hover:bg-red-50 dark:border-red-900 dark:text-red-400 dark:hover:bg-red-950"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Product Details Summary */}
        {selectedProducts.length > 0 && (
          <div className="space-y-4">
            {/* Auto-Populated Details */}
            <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-950/30">
              <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                ℹ Schedule Information
              </p>

              <div className="grid gap-3 text-sm sm:grid-cols-2">
                <div>
                  <p className="text-slate-600 dark:text-slate-400">Company</p>
                  <p className="font-semibold text-slate-900 dark:text-slate-100">
                    {selectedSupplier?.name || "-"}
                  </p>
                </div>
                <div>
                  <p className="text-slate-600 dark:text-slate-400">Schedule Store </p>
                  <p className="font-semibold text-slate-900 dark:text-slate-100">
                    {selectedStore?.name || "-"}
                  </p>
                </div>
                <div>
                  <p className="text-slate-600 dark:text-slate-400">Schedule Date</p>
                  <p className="font-semibold text-slate-900 dark:text-slate-100">
                    {fmtDate(new Date().toISOString())}
                  </p>
                </div>
                <div>
                  <p className="text-slate-600 dark:text-slate-400">Expected Delivery</p>
                  <p className="font-semibold text-slate-900 dark:text-slate-100">
                    {fmtDate(getOrderDeliveryDate())}
                  </p>
                </div>
              </div>
            </div>

            {/* Price Summary */}
            <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-950/30">
              <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                Overall Price Summary
              </p>
              <div className="grid gap-2 text-sm sm:grid-cols-4">
                <div>
                  <p className="text-slate-600 dark:text-slate-400">Total Items</p>
                  <p className="font-semibold text-slate-900 dark:text-slate-100">
                    {selectedProducts.reduce((sum, p) => sum + p.quantity, 0)} units
                  </p>
                </div>
                <div>
                  <p className="text-slate-600 dark:text-slate-400">Base Total</p>
                  <p className="font-semibold text-slate-900 dark:text-slate-100">
                    ₹{totalCalculations.baseTotal.toFixed(2)}
                  </p>
                </div>
                <div>
                  <p className="text-slate-600 dark:text-slate-400">GST (18%)</p>
                  <p className="font-semibold text-orange-600 dark:text-orange-400">
                    ₹{totalCalculations.gstTotal.toFixed(2)}
                  </p>
                </div>
                <div>
                  <p className="text-slate-600 dark:text-slate-400">Total with GST</p>
                  <p className="font-semibold text-blue-700 dark:text-blue-400">
                    ₹{totalCalculations.totalWithGst.toFixed(2)}
                  </p>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div>
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white shadow-lg transition-all duration-200 hover:scale-105 hover:bg-slate-800 hover:shadow-xl disabled:scale-100 disabled:opacity-50 dark:bg-slate-100 dark:text-slate-900"
              >
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                Create Schedule
              </button>
            </div>
          </div>
        )}
      </form>

      {/* Schedules List */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-panel dark:border-slate-700 dark:bg-slate-900/70">
        <h3 className="mb-4 text-lg font-semibold text-slate-900 dark:text-slate-100">
          Tentative Schedules
        </h3>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
          </div>
        ) : schedules.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 py-8 text-center text-slate-500 dark:border-slate-700 dark:text-slate-400">
            No tentative schedules yet
          </div>
        ) : (
          <div className="space-y-4">
            {schedules.map((schedule) => {
              let productsData: any[] = [];
              try {
                const parsed = schedule.notes ? JSON.parse(schedule.notes) : null;
                productsData = parsed?.products || [];
              } catch {
                productsData = [];
              }

              const hasMultipleProducts = productsData.length > 0;

              return (
                <div
                  key={schedule.id}
                  className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/50"
                >
                  {/* Schedule Header */}
                  <div className="mb-3 flex items-start justify-between">
                    <div>
                      <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                        {schedule.supplier.name}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Schedule Date: {fmtDate(schedule.scheduleDate)} | Delivery: {fmtDate(schedule.orderDeliveryDate)}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Store: {schedule.store.name}
                      </p>
                    </div>
                    <button
                      onClick={() => handleDelete(schedule.id)}
                      className="inline-flex items-center gap-1 rounded-lg border border-red-200 px-2.5 py-1.5 text-red-600 shadow-sm transition-all duration-200 hover:scale-110 hover:bg-red-50 dark:border-red-900 dark:text-red-400 dark:hover:bg-red-950"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>

                  {/* Products List */}
                  {hasMultipleProducts ? (
                    <div className="space-y-2">
                      <p className="text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                        Products ({productsData.length})
                      </p>
                      {productsData.map((product: any, idx: number) => {
                        const productType = product.variant?.split(" - ")[0] || "-";
                        const diameter = product.variant?.split(" - ")[1] || "-";
                        const gst = product.totalPrice * GST_RATE;
                        const totalWithGst = product.totalPrice + gst;

                        return (
                          <div
                            key={idx}
                            className="rounded-lg border border-slate-200 bg-white p-3 dark:border-slate-600 dark:bg-slate-800"
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <p className="font-medium text-slate-900 dark:text-slate-100">
                                  {product.name}
                                </p>
                                <div className="mt-1 grid grid-cols-3 gap-x-3 text-xs text-slate-600 dark:text-slate-400">
                                  <p>Type: {productType}</p>
                                  <p>Diameter: {diameter}</p>
                                  <p>Code: {product.itemCode || "-"}</p>
                                  <p>Quantity: {product.quantity}</p>
                                  <p>Unit Price: ₹{product.unitPrice}</p>
                                  <p>Total: ₹{product.totalPrice.toFixed(2)}</p>
                                </div>
                              </div>
                              <div className="ml-3 rounded bg-slate-100 px-3 py-2 text-right dark:bg-slate-700">
                                <p className="text-xs text-slate-500 dark:text-slate-400">With GST</p>
                                <p className="font-semibold text-green-600 dark:text-green-400">
                                  ₹{totalWithGst.toFixed(2)}
                                </p>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="rounded-lg border border-slate-200 bg-white p-3 dark:border-slate-600 dark:bg-slate-800">
                      <p className="font-medium text-slate-900 dark:text-slate-100">
                        {schedule.item.name}
                      </p>
                      <div className="mt-1 grid grid-cols-3 gap-x-3 text-xs text-slate-600 dark:text-slate-400">
                        <p>Type: {schedule.type.name}</p>
                        <p>Quantity: {schedule.quantity}</p>
                        <p>Unit Price: ₹{schedule.unitPrice}</p>
                      </div>
                    </div>
                  )}

                  {/* Total Summary */}
                  <div className="mt-3 rounded-lg border border-blue-200 bg-blue-50 p-3 dark:border-blue-800 dark:bg-blue-950/30">
                    <div className="grid grid-cols-4 gap-3 text-sm">
                      <div>
                        <p className="text-xs text-slate-600 dark:text-slate-400">Total Items</p>
                        <p className="font-semibold text-slate-900 dark:text-slate-100">
                          {schedule.quantity}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-600 dark:text-slate-400">Base Total</p>
                        <p className="font-semibold text-slate-900 dark:text-slate-100">
                          ₹{schedule.totalPrice.toFixed(2)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-600 dark:text-slate-400">GST (18%)</p>
                        <p className="font-semibold text-orange-600 dark:text-orange-400">
                          ₹{schedule.gstAmount.toFixed(2)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-600 dark:text-slate-400">Total with GST</p>
                        <p className="font-semibold text-green-700 dark:text-green-400">
                          ₹{schedule.totalWithGst.toFixed(2)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
