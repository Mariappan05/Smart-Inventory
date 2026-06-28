"use client";

import { useState, useEffect } from "react";
import { Plus, Trash2, Edit2, Loader2, Barcode, AlertCircle, CheckCircle } from "lucide-react";
import toast from "react-hot-toast";
import { ModernDropdown } from "@/components/ui/ModernDropdown";
import { formatDate } from "@/utils/dateTimeFormat";

interface Product {
  id: string;
  name: string;
  code: string;
  serialNumber?: string;
  category?: string;
}

interface SupplierPO {
  id: string;
  poNumber: string;
  supplierName: string;
  totalAmount?: number;
}

interface PendingInwardItem {
  id: string;
  product: Product;
  expectedQuantity: number;
  receivedQuantity: number;
  poNumber: string;
  invoiceNumber: string;
  invoiceDate: string;
  invoicePrice?: number;
  status: string;
  missingProducts?: any[];
  poDetails?: {
    totalAmount?: number;
    supplierName?: string;
  };
}

export function InwardView() {
  const [products, setProducts] = useState<Product[]>([]);
  const [poList, setPoList] = useState<SupplierPO[]>([]);
  const [pendingItems, setPendingItems] = useState<PendingInwardItem[]>([]);
  const [inwardRecords, setInwardRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [scanLoading, setScanLoading] = useState(false);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [currentDate] = useState(new Date().toISOString().split('T')[0]);

  const [formData, setFormData] = useState({
    poNumber: "",
    invoiceDate: "",
    invoiceNumber: "",
    expectedQuantity: "",
    receivedQuantity: "",
    invoicePrice: "",
    barcodeInput: "",
    productName: "",
    supplierName: "",
  });

  const [selectedPoDetails, setSelectedPoDetails] = useState<SupplierPO | null>(null);

  const [editForm, setEditForm] = useState({
    expectedQuantity: "",
    receivedQuantity: "",
    invoicePrice: "",
    invoiceNumber: "",
    invoiceDate: "",
  });

  useEffect(() => {
    fetchProducts();
    fetchSupplierPOs();
    fetchInwardRecords();
  }, []);

  const fetchProducts = async () => {
    try {
      const res = await fetch("/api/products");
      const data = await res.json();
      if (data.success) {
        setProducts(data.data);
      }
    } catch (error) {
      console.error("Error fetching products:", error);
    }
  };

  const fetchSupplierPOs = async () => {
    try {
      const res = await fetch("/api/supplier-po");
      const data = await res.json();
      if (data.success) {
        setPoList(data.data);
      }
    } catch (error) {
      console.error("Error fetching POs:", error);
    }
  };

  const fetchInwardRecords = async () => {
    try {
      const res = await fetch("/api/inward");
      const data = await res.json();
      if (data.success) {
        setInwardRecords(data.data);
      }
    } catch (error) {
      console.error("Error fetching inward records:", error);
    }
  };

  const handleBarcodeScan = async () => {
    if (!formData.barcodeInput.trim()) {
      toast.error("Please scan a barcode");
      return;
    }

    setScanLoading(true);
    try {
      // Find product by barcode/code
      const matchedProduct = products.find(
        (p) => p.code === formData.barcodeInput
      );

      if (!matchedProduct) {
        toast.error("Product not found for scanned barcode");
        setScanLoading(false);
        return;
      }

      // Get supplier name from the selected PO
      const supplierName = selectedPoDetails?.supplierName || "";

      // Auto-populate form fields
      setFormData((prev) => ({
        ...prev,
        productName: matchedProduct.name,
        barcodeInput: "",
      }));
      
      // Supplier name is auto-filled from PO details
      toast.success("Product scanned successfully");
    } catch (error: any) {
      toast.error(error.message || "Failed to process barcode");
    } finally {
      setScanLoading(false);
    }
  };

  const handlePoNumberChange = async (poNumber: string) => {
    setFormData((prev) => ({ ...prev, poNumber }));

    // Find and set PO details
    const poDetails = poList.find((p) => p.poNumber === poNumber);
    if (poDetails) {
      setSelectedPoDetails(poDetails);
      setFormData((prev) => ({
        ...prev,
        supplierName: poDetails.supplierName,
      }));
    }
  };

  const checkValidationWarnings = () => {
    const warnings: string[] = [];

    if (selectedPoDetails?.totalAmount && formData.invoicePrice) {
      const invoicePrice = parseFloat(formData.invoicePrice);
      if (Math.abs(invoicePrice - (selectedPoDetails.totalAmount || 0)) > 0.01) {
        warnings.push("Invoice Price does not match PO amount");
      }
    }

    return warnings;
  };

  const handleAddItem = () => {
    if (!formData.poNumber) {
      toast.error("Please select PO number");
      return;
    }
    if (!formData.invoiceDate) {
      toast.error("Please enter invoice date");
      return;
    }
    if (!formData.invoiceNumber) {
      toast.error("Please enter invoice number");
      return;
    }
    if (!formData.expectedQuantity || parseInt(formData.expectedQuantity) <= 0) {
      toast.error("Please enter valid expected quantity");
      return;
    }
    if (!formData.receivedQuantity || parseInt(formData.receivedQuantity) < 0) {
      toast.error("Please enter valid received quantity");
      return;
    }
    if (parseInt(formData.receivedQuantity) > parseInt(formData.expectedQuantity)) {
      toast.error("Received quantity cannot exceed expected quantity");
      return;
    }
    if (!formData.invoicePrice || parseFloat(formData.invoicePrice) <= 0) {
      toast.error("Please enter valid price");
      return;
    }
    if (!formData.productName) {
      toast.error("Please scan barcode to select product");
      return;
    }

    const warnings = checkValidationWarnings();
    if (warnings.length > 0) {
      toast.error("Validation failed: " + warnings.join(", "));
      return;
    }

    // Check for duplicate entries
    const isDuplicate = pendingItems.some(
      (item) =>
        item.poNumber === formData.poNumber &&
        item.invoiceNumber === formData.invoiceNumber
    );

    if (isDuplicate) {
      toast.error("This PO and invoice combination already exists");
      return;
    }

    const expected = parseInt(formData.expectedQuantity);
    const received = parseInt(formData.receivedQuantity);
    const status = received < expected ? "PENDING" : "COMPLETED";

    const missingList = received < expected ? [
      {
        productName: formData.productName,
        expectedQuantity: expected,
        receivedQuantity: received,
        missingQuantity: expected - received,
      }
    ] : [];

    const newItem: PendingInwardItem = {
      id: `temp-${Date.now()}`,
      product: {
        id: "",
        name: formData.productName,
        code: "",
      },
      expectedQuantity: expected,
      receivedQuantity: received,
      poNumber: formData.poNumber,
      invoiceNumber: formData.invoiceNumber,
      invoiceDate: formData.invoiceDate,
      invoicePrice: parseFloat(formData.invoicePrice),
      status: status,
      missingProducts: missingList,
      poDetails: selectedPoDetails ? {
        totalAmount: selectedPoDetails.totalAmount,
        supplierName: selectedPoDetails.supplierName,
      } : undefined,
    };

    setPendingItems([...pendingItems, newItem]);
    toast.success("Item added to pending list");

    // Reset form
    setFormData({
      poNumber: "",
      invoiceDate: "",
      invoiceNumber: "",
      expectedQuantity: "",
      receivedQuantity: "",
      invoicePrice: "",
      barcodeInput: "",
      productName: "",
      supplierName: "",
    });
    setSelectedPoDetails(null);
  };

  const handleEditItem = (item: PendingInwardItem) => {
    setEditingItemId(item.id);
    setEditForm({
      expectedQuantity: item.expectedQuantity.toString(),
      receivedQuantity: item.receivedQuantity.toString(),
      invoicePrice: (item.invoicePrice || "").toString(),
      invoiceNumber: item.invoiceNumber,
      invoiceDate: item.invoiceDate,
    });
  };

  const handleSaveEdit = (itemId: string) => {
    setPendingItems((items) =>
      items.map((item) => {
        if (item.id === itemId) {
          const expected = parseInt(editForm.expectedQuantity) || item.expectedQuantity;
          const received = parseInt(editForm.receivedQuantity) || item.receivedQuantity;
          const status = received < expected ? "PENDING" : "COMPLETED";

          const missingList = received < expected ? [
            {
              productName: item.product.name,
              expectedQuantity: expected,
              receivedQuantity: received,
              missingQuantity: expected - received,
            }
          ] : [];

          return {
            ...item,
            expectedQuantity: expected,
            receivedQuantity: received,
            status: status,
            missingProducts: missingList,
            invoicePrice: parseFloat(editForm.invoicePrice) || item.invoicePrice,
            invoiceNumber: editForm.invoiceNumber,
            invoiceDate: editForm.invoiceDate,
          };
        }
        return item;
      })
    );
    setEditingItemId(null);
    toast.success("Item updated");
  };

  const handleDeleteItem = (itemId: string) => {
    setPendingItems((items) => items.filter((item) => item.id !== itemId));
    toast.success("Item removed from pending list");
  };

  const handleGenerateQRBarcode = async () => {
    if (pendingItems.length === 0) {
      toast.error("Please add items first");
      return;
    }

    setLoading(true);
    try {
      // Save all pending items to database
      const res = await fetch("/api/inward", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: pendingItems.map((item) => ({
            productName: item.product.name,
            expectedQuantity: item.expectedQuantity,
            receivedQuantity: item.receivedQuantity,
            poNumber: item.poNumber,
            invoiceNumber: item.invoiceNumber,
            invoiceDate: item.invoiceDate,
            invoicePrice: item.invoicePrice,
            status: item.status,
            missingProducts: item.missingProducts,
            supplierName: item.poDetails?.supplierName,
          })),
        }),
      });

      const data = await res.json();
      if (data.success) {
        toast.success(`${pendingItems.length} items recorded successfully`);
        setPendingItems([]);
        fetchInwardRecords();
      } else {
        toast.error(data.message || "Failed to record items");
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to record items");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-slate-200 bg-white/70 p-6 shadow-panel dark:border-slate-700 dark:bg-slate-900/70 flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">
            Product Inward
          </h1>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
            Record incoming products and generate tracking information
          </p>
        </div>
        <div className="text-right">
          <p className="text-sm text-slate-600 dark:text-slate-400">Current Date</p>
          <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{currentDate}</p>
        </div>
      </div>

      {/* Barcode Scan Section */}
      <div className="rounded-lg border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-800">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">
          Barcode Scan
        </h2>
        <div className="flex gap-3">
          <div className="flex-1">
            <input
              type="text"
              value={formData.barcodeInput}
              onChange={(e) => setFormData({ ...formData, barcodeInput: e.target.value })}
              onKeyPress={(e) => e.key === "Enter" && handleBarcodeScan()}
              placeholder="Scan barcode here"
              autoFocus
              className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2 text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
            />
          </div>
          <button
            onClick={handleBarcodeScan}
            disabled={scanLoading}
            className="flex items-center gap-2 rounded-lg bg-black px-6 py-2 text-white hover:bg-slate-900 disabled:bg-slate-400 transition-colors dark:bg-slate-950 dark:hover:bg-black"
          >
            {scanLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Barcode className="h-4 w-4" />}
            {scanLoading ? "Scanning..." : "Scan"}
          </button>
        </div>
      </div>

      {/* Form Section */}
      <div className="rounded-lg border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-800">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">
          Inward Details
        </h2>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* PO Number Selection */}
          <ModernDropdown
            label="PO Number"
            required
            options={poList.map((po) => ({
              value: po.poNumber,
              label: po.poNumber,
              subtitle: po.supplierName,
            }))}
            value={formData.poNumber}
            onChange={(value) => handlePoNumberChange(value as string)}
            placeholder="Select PO number..."
            searchPlaceholder="Search PO..."
            emptyMessage={poList.length === 0 ? "No POs available" : undefined}
          />

          {/* Invoice Date */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Invoice Date <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={formData.invoiceDate}
              onChange={(e) => setFormData({ ...formData, invoiceDate: e.target.value })}
              className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2 text-slate-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
            />
          </div>

          {/* Invoice Number */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Invoice Number <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.invoiceNumber}
              onChange={(e) => setFormData({ ...formData, invoiceNumber: e.target.value })}
              placeholder="Enter invoice number"
              className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2 text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
            />
          </div>

          {/* Expected Quantity */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Expected Quantity <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              min="1"
              value={formData.expectedQuantity}
              onChange={(e) => setFormData({ ...formData, expectedQuantity: e.target.value })}
              placeholder="Enter expected quantity"
              className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2 text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
            />
          </div>

          {/* Received Quantity */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Received Quantity <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              min="0"
              value={formData.receivedQuantity}
              onChange={(e) => setFormData({ ...formData, receivedQuantity: e.target.value })}
              placeholder="Enter received quantity"
              className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2 text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
            />
          </div>

          {/* Invoice Price */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Invoice Price <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              step="0.01"
              value={formData.invoicePrice}
              onChange={(e) => setFormData({ ...formData, invoicePrice: e.target.value })}
              placeholder="Enter price"
              className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2 text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
            />
          </div>

          {/* Product Name - Auto-filled from Barcode */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Product Name
            </label>
            <input
              type="text"
              value={formData.productName}
              disabled
              placeholder="Auto-filled from barcode scan"
              className="w-full rounded-lg border border-slate-300 bg-slate-50 px-4 py-2 text-slate-700 placeholder-slate-400 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-400 cursor-not-allowed"
            />
          </div>

          {/* Supplier Name - Auto-filled from PO */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Supplier Name
            </label>
            <input
              type="text"
              value={formData.supplierName}
              disabled
              placeholder="Auto-filled from PO selection"
              className="w-full rounded-lg border border-slate-300 bg-slate-50 px-4 py-2 text-slate-700 placeholder-slate-400 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-400 cursor-not-allowed"
            />
          </div>
        </div>

        {/* Validation Warnings */}
        {checkValidationWarnings().length > 0 && (
          <div className="mt-4 rounded-lg bg-yellow-50 border border-yellow-200 p-4 dark:bg-yellow-900/20 dark:border-yellow-700">
            {checkValidationWarnings().map((warning, idx) => (
              <div key={idx} className="flex items-center gap-2 text-sm text-yellow-800 dark:text-yellow-300">
                <AlertCircle className="h-4 w-4" />
                {warning}
              </div>
            ))}
          </div>
        )}

        <button
          onClick={handleAddItem}
          disabled={checkValidationWarnings().length > 0}
          className="mt-6 flex items-center gap-2 rounded-lg bg-black px-6 py-2 text-white hover:bg-slate-900 disabled:bg-slate-400 disabled:cursor-not-allowed transition-colors dark:bg-slate-950 dark:hover:bg-black"
        >
          <Plus className="h-4 w-4" />
          Add Inward Item
        </button>
      </div>

      {/* Pending Items Table */}
      {pendingItems.length > 0 && (
        <div className="rounded-lg border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-800">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">
            Pending Inward Items ({pendingItems.length})
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-700">
                  <th className="px-4 py-3 text-left font-medium text-slate-700 dark:text-slate-300">
                    Product
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-slate-700 dark:text-slate-300">
                    PO Number
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-slate-700 dark:text-slate-300">
                    Invoice
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-slate-700 dark:text-slate-300">
                    Expected Qty
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-slate-700 dark:text-slate-300">
                    Received Qty
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-slate-700 dark:text-slate-300">
                    Price
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-slate-700 dark:text-slate-300">
                    Date
                  </th>
                  <th className="px-4 py-3 text-center font-medium text-slate-700 dark:text-slate-300">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {pendingItems.map((item) => (
                  <tr key={item.id} className="border-b border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50">
                    {editingItemId === item.id ? (
                      <>
                        <td className="px-4 py-3 text-slate-900 dark:text-slate-100">
                          {item.product.name}
                        </td>
                        <td className="px-4 py-3 text-slate-700 dark:text-slate-300">
                          {item.poNumber}
                        </td>
                        <td className="px-4 py-3">
                          <input
                            type="text"
                            value={editForm.invoiceNumber}
                            onChange={(e) =>
                              setEditForm({ ...editForm, invoiceNumber: e.target.value })
                            }
                            className="w-24 rounded border border-slate-300 px-2 py-1 dark:border-slate-600 dark:bg-slate-700"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <input
                            type="number"
                            min="1"
                            value={editForm.expectedQuantity}
                            onChange={(e) =>
                              setEditForm({ ...editForm, expectedQuantity: e.target.value })
                            }
                            className="w-20 rounded border border-slate-300 px-2 py-1 dark:border-slate-600 dark:bg-slate-700"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <input
                            type="number"
                            min="0"
                            value={editForm.receivedQuantity}
                            onChange={(e) =>
                              setEditForm({ ...editForm, receivedQuantity: e.target.value })
                            }
                            className="w-20 rounded border border-slate-300 px-2 py-1 dark:border-slate-600 dark:bg-slate-700"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <input
                            type="number"
                            step="0.01"
                            value={editForm.invoicePrice}
                            onChange={(e) =>
                              setEditForm({ ...editForm, invoicePrice: e.target.value })
                            }
                            className="w-24 rounded border border-slate-300 px-2 py-1 dark:border-slate-600 dark:bg-slate-700"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <input
                            type="date"
                            value={editForm.invoiceDate}
                            onChange={(e) =>
                              setEditForm({ ...editForm, invoiceDate: e.target.value })
                            }
                            className="w-32 rounded border border-slate-300 px-2 py-1 dark:border-slate-600 dark:bg-slate-700"
                          />
                        </td>
                        <td className="px-4 py-3 text-center">
                          <button
                            onClick={() => handleSaveEdit(item.id)}
                            className="text-green-600 hover:text-green-700 mr-2 font-medium"
                          >
                            Save
                          </button>
                          <button
                            onClick={() => setEditingItemId(null)}
                            className="text-slate-600 hover:text-slate-700"
                          >
                            Cancel
                          </button>
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="px-4 py-3 text-slate-900 dark:text-slate-100">
                          {item.product.name}
                        </td>
                        <td className="px-4 py-3 text-slate-700 dark:text-slate-300">
                          {item.poNumber}
                        </td>
                        <td className="px-4 py-3 text-slate-700 dark:text-slate-300">
                          {item.invoiceNumber}
                        </td>
                        <td className="px-4 py-3 text-slate-700 dark:text-slate-300 font-semibold">
                          {item.expectedQuantity}
                        </td>
                        <td className="px-4 py-3 text-slate-700 dark:text-slate-300 font-semibold">
                          {item.receivedQuantity}
                        </td>
                        <td className="px-4 py-3 text-slate-700 dark:text-slate-300">
                          ${item.invoicePrice?.toFixed(2) || "0.00"}
                        </td>
                        <td className="px-4 py-3 text-slate-700 dark:text-slate-300">
                          {formatDate(item.invoiceDate)}
                        </td>
                        <td className="px-4 py-3 text-center flex justify-center gap-2">
                          <button
                            onClick={() => handleEditItem(item)}
                            className="text-blue-600 hover:text-blue-700"
                            title="Edit"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteItem(item.id)}
                            className="text-red-600 hover:text-red-700"
                            title="Delete"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <button
            onClick={handleGenerateQRBarcode}
            disabled={loading}
            className="mt-6 flex items-center gap-2 rounded-lg bg-black px-6 py-2 text-white hover:bg-slate-900 disabled:bg-slate-400 transition-colors dark:bg-slate-950 dark:hover:bg-black"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Barcode className="h-4 w-4" />}
            {loading ? "Processing..." : "Record Inward Items"}
          </button>
        </div>
      )}


      {/* Pending Inward Bills List */}
      {inwardRecords.some(r => r.status === "PENDING") && (
        <div className="rounded-lg border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-800">
          <div className="flex items-center gap-2 mb-4">
            <span className="h-2.5 w-2.5 rounded-full bg-amber-500 animate-pulse"></span>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
              Pending Inward Bills ({inwardRecords.filter(r => r.status === "PENDING").length})
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-700">
                  <th className="px-4 py-3 text-left font-medium text-slate-700 dark:text-slate-300">Product</th>
                  <th className="px-4 py-3 text-left font-medium text-slate-700 dark:text-slate-300">PO Number</th>
                  <th className="px-4 py-3 text-left font-medium text-slate-700 dark:text-slate-300">Invoice Number</th>
                  <th className="px-4 py-3 text-left font-medium text-slate-700 dark:text-slate-300">Expected Qty</th>
                  <th className="px-4 py-3 text-left font-medium text-slate-700 dark:text-slate-300">Received Qty</th>
                  <th className="px-4 py-3 text-left font-medium text-slate-700 dark:text-slate-300">Missing Qty</th>
                  <th className="px-4 py-3 text-left font-medium text-slate-700 dark:text-slate-300">Status</th>
                  <th className="px-4 py-3 text-left font-medium text-slate-700 dark:text-slate-300">Date</th>
                </tr>
              </thead>
              <tbody>
                {inwardRecords.filter(r => r.status === "PENDING").map((record) => {
                  const expected = record.expectedQuantity || record.quantity || 0;
                  const received = record.receivedQuantity || record.quantity || 0;
                  const missing = expected - received;
                  
                  let productName = "Product";
                  try {
                    const parsed = typeof record.productDetails === "string" ? JSON.parse(record.productDetails) : record.productDetails;
                    productName = parsed?.productName || record.productName || "Product";
                  } catch {
                    productName = record.productName || "Product";
                  }

                  return (
                    <tr key={record.id} className="border-b border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50">
                      <td className="px-4 py-3 text-slate-900 dark:text-slate-100">{productName}</td>
                      <td className="px-4 py-3 text-slate-700 dark:text-slate-300">{record.poNumber}</td>
                      <td className="px-4 py-3 text-slate-700 dark:text-slate-300">{record.invoiceNumber}</td>
                      <td className="px-4 py-3 text-slate-700 dark:text-slate-300 font-semibold">{expected}</td>
                      <td className="px-4 py-3 text-slate-700 dark:text-slate-300 font-semibold">{received}</td>
                      <td className="px-4 py-3 text-red-600 dark:text-red-400 font-bold">{missing}</td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-800 dark:bg-amber-900/30 dark:text-amber-400">
                          {record.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-700 dark:text-slate-300">{formatDate(record.createdAt)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Finalized Records Table */}
      {inwardRecords.filter(r => r.status !== "PENDING").length > 0 && (
        <div className="rounded-lg border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-800">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">
            Recorded Inward Items ({inwardRecords.filter(r => r.status !== "PENDING").length})
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-700">
                  <th className="px-4 py-3 text-left font-medium text-slate-700 dark:text-slate-300">
                    Product
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-slate-700 dark:text-slate-300">
                    Quantity
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-slate-700 dark:text-slate-300">
                    PO Number
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-slate-700 dark:text-slate-300">
                    Invoice
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-slate-700 dark:text-slate-300">
                    Date
                  </th>
                </tr>
              </thead>
              <tbody>
                {inwardRecords.filter(r => r.status !== "PENDING").map((record) => {
                  let productName = "Product";
                  try {
                    const parsed = typeof record.productDetails === "string" ? JSON.parse(record.productDetails) : record.productDetails;
                    productName = parsed?.productName || record.productName || "Product";
                  } catch {
                    productName = record.productName || "Product";
                  }
                  
                  return (
                    <tr key={record.id} className="border-b border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50">
                      <td className="px-4 py-3 text-slate-900 dark:text-slate-100">
                        {productName}
                      </td>
                      <td className="px-4 py-3 text-slate-700 dark:text-slate-300">
                        {record.quantity}
                      </td>
                      <td className="px-4 py-3 text-slate-700 dark:text-slate-300">
                        {record.poNumber}
                      </td>
                      <td className="px-4 py-3 text-slate-700 dark:text-slate-300">
                        {record.invoiceNumber}
                      </td>
                      <td className="px-4 py-3 text-slate-700 dark:text-slate-300">
                        {formatDate(record.createdAt)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
