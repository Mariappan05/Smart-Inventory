"use client";

import { useState, useEffect } from "react";
import { Plus, Trash2, Edit2, Loader2, QrCode, Barcode } from "lucide-react";
import toast from "react-hot-toast";

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
  quantity: number;
  poNumber: string;
  invoiceNumber: string;
  invoiceDate: string;
  qrCode?: string;
  barcode?: string;
}

export function InwardView() {
  const [products, setProducts] = useState<Product[]>([]);
  const [poList, setPoList] = useState<SupplierPO[]>([]);
  const [pendingItems, setPendingItems] = useState<PendingInwardItem[]>([]);
  const [inwardRecords, setInwardRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [scanLoading, setScanLoading] = useState(false);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [showBarcodeModal, setShowBarcodeModal] = useState(false);
  const [barcodeType, setBarcodeType] = useState<"qr" | "barcode">("qr");
  const [useManualPO, setUseManualPO] = useState(false);
  const [scanType, setScanType] = useState<"qr" | "barcode" | null>(null);

  const [formData, setFormData] = useState({
    scanInput: "",
    productId: "",
    quantity: "",
    poNumber: "",
    manualPoNumber: "",
    invoiceNumber: "",
    invoiceDate: "",
  });

  const [editForm, setEditForm] = useState({
    quantity: "",
    poNumber: "",
    manualPoNumber: "",
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

  const handleScan = async () => {
    if (!formData.scanInput.trim()) {
      toast.error("Please enter a QR code or barcode");
      return;
    }

    setScanLoading(true);
    try {
      // Try to find product by serial number or barcode
      const matchedProduct = products.find(
        (p) =>
          p.serialNumber === formData.scanInput ||
          p.code === formData.scanInput
      );

      if (!matchedProduct) {
        toast.error("Product not found for scanned code");
        setScanLoading(false);
        return;
      }

      // Auto-populate form with product details
      setFormData((prev) => ({
        ...prev,
        productId: matchedProduct.id,
        scanInput: "",
      }));
      toast.success("Product details loaded");
    } catch (error: any) {
      toast.error(error.message || "Failed to process scan");
    } finally {
      setScanLoading(false);
    }
  };

  const handleAddItem = () => {
    if (!formData.productId) {
      toast.error("Please select a product");
      return;
    }
    if (!formData.quantity || parseInt(formData.quantity) <= 0) {
      toast.error("Please enter valid quantity");
      return;
    }
    if (!formData.invoiceNumber) {
      toast.error("Please enter invoice number");
      return;
    }
    if (!formData.invoiceDate) {
      toast.error("Please enter invoice date");
      return;
    }

    const poNumber = useManualPO ? formData.manualPoNumber : formData.poNumber;
    if (!poNumber) {
      toast.error("Please select or enter PO number");
      return;
    }

    const selectedProduct = products.find((p) => p.id === formData.productId);
    if (!selectedProduct) {
      toast.error("Selected product not found");
      return;
    }

    // Check for duplicate entries
    const isDuplicate = pendingItems.some(
      (item) =>
        item.product.id === formData.productId &&
        item.invoiceNumber === formData.invoiceNumber
    );

    if (isDuplicate) {
      toast.error("This product is already added with the same invoice");
      return;
    }

    const newItem: PendingInwardItem = {
      id: `temp-${Date.now()}`,
      product: selectedProduct,
      quantity: parseInt(formData.quantity),
      poNumber,
      invoiceNumber: formData.invoiceNumber,
      invoiceDate: formData.invoiceDate,
    };

    setPendingItems([...pendingItems, newItem]);
    toast.success("Item added to pending list");

    // Reset form
    setFormData({
      scanInput: "",
      productId: "",
      quantity: "",
      poNumber: "",
      manualPoNumber: "",
      invoiceNumber: "",
      invoiceDate: "",
    });
    setUseManualPO(false);
  };

  const handleEditItem = (item: PendingInwardItem) => {
    setEditingItemId(item.id);
    setEditForm({
      quantity: item.quantity.toString(),
      poNumber: item.poNumber,
      manualPoNumber: item.poNumber,
      invoiceNumber: item.invoiceNumber,
      invoiceDate: item.invoiceDate,
    });
  };

  const handleSaveEdit = (itemId: string) => {
    setPendingItems((items) =>
      items.map((item) => {
        if (item.id === itemId) {
          return {
            ...item,
            quantity: parseInt(editForm.quantity) || item.quantity,
            poNumber: editForm.poNumber || editForm.manualPoNumber,
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
      // Generate QR codes or barcodes for each item
      const itemsWithCodes = await Promise.all(
        pendingItems.map(async (item) => {
          const codeData = `${item.product.code}-${item.invoiceNumber}-${Date.now()}`;

          if (barcodeType === "qr") {
            // In a real scenario, you'd call a QR generation API
            return {
              ...item,
              qrCode: codeData,
            };
          } else {
            return {
              ...item,
              barcode: codeData,
            };
          }
        })
      );

      // Save all records to database
      const res = await fetch("/api/inward", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: itemsWithCodes.map((item) => ({
            productId: item.product.id,
            quantity: item.quantity,
            poNumber: item.poNumber,
            invoiceNumber: item.invoiceNumber,
            invoiceDate: item.invoiceDate,
            qrCode: item.qrCode,
            barcode: item.barcode,
          })),
        }),
      });

      const data = await res.json();
      if (data.success) {
        toast.success(`${itemsWithCodes.length} items recorded successfully`);
        setPendingItems([]);
        setShowBarcodeModal(false);
        fetchInwardRecords();
      } else {
        toast.error(data.message || "Failed to record items");
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to generate codes");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-slate-200 bg-white/70 p-6 shadow-panel dark:border-slate-700 dark:bg-slate-900/70">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">
          Product Inward
        </h1>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
          Record incoming products and generate QR codes for tracking
        </p>
      </div>

      {/* QR/Barcode Scan Section */}
      <div className="rounded-lg border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-800">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">
          Step 1: Choose Scan Type & Scan Product
        </h2>
        
        {/* Scan Type Selection */}
        {!scanType && (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 mb-6">
            <button
              onClick={() => setScanType("qr")}
              className="flex items-center justify-center gap-3 rounded-lg border-2 border-slate-200 bg-white p-6 hover:border-blue-500 hover:bg-blue-50 transition-all dark:border-slate-700 dark:bg-slate-700 dark:hover:bg-slate-600"
            >
              <QrCode className="h-8 w-8 text-slate-600 dark:text-slate-300" />
              <div className="text-left">
                <div className="font-semibold text-slate-900 dark:text-white">Scan QR Code</div>
                <div className="text-sm text-slate-600 dark:text-slate-400">Use QR code scanner</div>
              </div>
            </button>
            
            <button
              onClick={() => setScanType("barcode")}
              className="flex items-center justify-center gap-3 rounded-lg border-2 border-slate-200 bg-white p-6 hover:border-blue-500 hover:bg-blue-50 transition-all dark:border-slate-700 dark:bg-slate-700 dark:hover:bg-slate-600"
            >
              <Barcode className="h-8 w-8 text-slate-600 dark:text-slate-300" />
              <div className="text-left">
                <div className="font-semibold text-slate-900 dark:text-white">Scan Barcode</div>
                <div className="text-sm text-slate-600 dark:text-slate-400">Use barcode scanner</div>
              </div>
            </button>
          </div>
        )}
        
        {/* Scan Input */}
        {scanType && (
          <div>
            <div className="flex gap-3 mb-4">
              <div className="flex-1">
                <input
                  type="text"
                  value={formData.scanInput}
                  onChange={(e) => setFormData({ ...formData, scanInput: e.target.value })}
                  onKeyPress={(e) => e.key === "Enter" && handleScan()}
                  placeholder={`Scan ${scanType} code here`}
                  autoFocus
                  className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2 text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
                />
              </div>
              <button
                onClick={handleScan}
                disabled={scanLoading}
                className="flex items-center gap-2 rounded-lg bg-black px-6 py-2 text-white hover:bg-slate-900 disabled:bg-slate-400 transition-colors dark:bg-slate-950 dark:hover:bg-black"
              >
                {scanLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : (scanType === "qr" ? <QrCode className="h-4 w-4" /> : <Barcode className="h-4 w-4" />)}
                {scanLoading ? "Scanning..." : "Scan"}
              </button>
              <button
                onClick={() => setScanType(null)}
                className="rounded-lg border border-slate-300 px-4 py-2 text-slate-700 hover:bg-slate-50 transition-colors dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700"
              >
                Change Type
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Product Form Section */}
      <div className="rounded-lg border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-800">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">
          Step 2: Fill Product Details
        </h2>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* Product Selection */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Product
            </label>
            <select
              value={formData.productId}
              onChange={(e) => setFormData({ ...formData, productId: e.target.value })}
              className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2 text-slate-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
            >
              <option value="">Select product</option>
              {products.map((product) => (
                <option key={product.id} value={product.id}>
                  {product.name} ({product.code})
                </option>
              ))}
            </select>
          </div>

          {/* Quantity */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Quantity
            </label>
            <input
              type="number"
              min="1"
              value={formData.quantity}
              onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
              placeholder="Enter quantity"
              className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2 text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
            />
          </div>

          {/* PO Number Selection */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              PO Number
              <label className="ml-2 text-xs text-slate-600 dark:text-slate-400">
                <input
                  type="checkbox"
                  checked={useManualPO}
                  onChange={(e) => setUseManualPO(e.target.checked)}
                  className="mr-1"
                />
                Manual Entry
              </label>
            </label>
            {useManualPO ? (
              <input
                type="text"
                value={formData.manualPoNumber}
                onChange={(e) => setFormData({ ...formData, manualPoNumber: e.target.value })}
                placeholder="Enter PO number"
                className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2 text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
              />
            ) : (
              <select
                value={formData.poNumber}
                onChange={(e) => setFormData({ ...formData, poNumber: e.target.value })}
                className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2 text-slate-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
              >
                <option value="">Select PO</option>
                {poList.map((po) => (
                  <option key={po.id} value={po.poNumber}>
                    {po.poNumber} - {po.supplierName}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Invoice Number */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Invoice Number
            </label>
            <input
              type="text"
              value={formData.invoiceNumber}
              onChange={(e) => setFormData({ ...formData, invoiceNumber: e.target.value })}
              placeholder="Enter invoice number"
              className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2 text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
            />
          </div>

          {/* Invoice Date */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Invoice Date
            </label>
            <input
              type="date"
              value={formData.invoiceDate}
              onChange={(e) => setFormData({ ...formData, invoiceDate: e.target.value })}
              className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2 text-slate-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
            />
          </div>
        </div>

        <button
          onClick={handleAddItem}
          className="mt-6 flex items-center gap-2 rounded-lg bg-black px-6 py-2 text-white hover:bg-slate-900 transition-colors dark:bg-slate-950 dark:hover:bg-black"
        >
          <Plus className="h-4 w-4" />
          Add Item
        </button>
      </div>

      {/* Pending Items Table */}
      {pendingItems.length > 0 && (
        <div className="rounded-lg border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-800">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">
            Step 3: Review Pending Items ({pendingItems.length})
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
                        <td className="px-4 py-3">
                          <input
                            type="number"
                            min="1"
                            value={editForm.quantity}
                            onChange={(e) =>
                              setEditForm({ ...editForm, quantity: e.target.value })
                            }
                            className="w-20 rounded border border-slate-300 px-2 py-1 dark:border-slate-600 dark:bg-slate-700"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <input
                            type="text"
                            value={editForm.poNumber}
                            onChange={(e) =>
                              setEditForm({ ...editForm, poNumber: e.target.value })
                            }
                            className="w-32 rounded border border-slate-300 px-2 py-1 dark:border-slate-600 dark:bg-slate-700"
                          />
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
                            className="text-green-600 hover:text-green-700 mr-2"
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
                          {item.quantity}
                        </td>
                        <td className="px-4 py-3 text-slate-700 dark:text-slate-300">
                          {item.poNumber}
                        </td>
                        <td className="px-4 py-3 text-slate-700 dark:text-slate-300">
                          {item.invoiceNumber}
                        </td>
                        <td className="px-4 py-3 text-slate-700 dark:text-slate-300">
                          {new Date(item.invoiceDate).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3 text-center flex justify-center gap-2">
                          <button
                            onClick={() => handleEditItem(item)}
                            className="text-blue-600 hover:text-blue-700"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteItem(item.id)}
                            className="text-red-600 hover:text-red-700"
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
            onClick={() => setShowBarcodeModal(true)}
            disabled={loading}
            className="mt-6 flex items-center gap-2 rounded-lg bg-black px-6 py-2 text-white hover:bg-slate-900 disabled:bg-slate-400 transition-colors dark:bg-slate-950 dark:hover:bg-black"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Barcode className="h-4 w-4" />}
            {loading ? "Processing..." : "Record Inward & Generate QR/Barcode"}
          </button>
        </div>
      )}

      {/* Finalized Records Table */}
      {inwardRecords.length > 0 && (
        <div className="rounded-lg border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-800">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">
            Finalized Inward Records
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
                    Invoice
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-slate-700 dark:text-slate-300">
                    QR/Barcode
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-slate-700 dark:text-slate-300">
                    Date
                  </th>
                </tr>
              </thead>
              <tbody>
                {inwardRecords.map((record) => (
                  <tr key={record.id} className="border-b border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50">
                    <td className="px-4 py-3 text-slate-900 dark:text-slate-100">
                      {record.productName || "Product"}
                    </td>
                    <td className="px-4 py-3 text-slate-700 dark:text-slate-300">
                      {record.quantity}
                    </td>
                    <td className="px-4 py-3 text-slate-700 dark:text-slate-300">
                      {record.invoiceNumber}
                    </td>
                    <td className="px-4 py-3 text-slate-700 dark:text-slate-300">
                      {record.qrCode || record.barcode || "-"}
                    </td>
                    <td className="px-4 py-3 text-slate-700 dark:text-slate-300">
                      {new Date(record.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Barcode Type Modal */}
      {showBarcodeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="rounded-lg bg-white p-6 dark:bg-slate-800 max-w-md">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">
              Generate QR Code or Barcode?
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">
              Choose the type of code to generate for all pending items.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setBarcodeType("qr");
                  handleGenerateQRBarcode();
                }}
                className="flex-1 rounded-lg bg-black px-4 py-2 text-white hover:bg-slate-900 transition-colors flex items-center justify-center gap-2 dark:bg-slate-950 dark:hover:bg-black"
              >
                <QrCode className="h-4 w-4" />
                QR Code
              </button>
              <button
                onClick={() => {
                  setBarcodeType("barcode");
                  handleGenerateQRBarcode();
                }}
                className="flex-1 rounded-lg bg-black px-4 py-2 text-white hover:bg-slate-900 transition-colors flex items-center justify-center gap-2 dark:bg-slate-950 dark:hover:bg-black"
              >
                <Barcode className="h-4 w-4" />
                Barcode
              </button>
              <button
                onClick={() => setShowBarcodeModal(false)}
                className="rounded-lg border border-slate-300 px-4 py-2 text-slate-700 hover:bg-slate-50 transition-colors dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
