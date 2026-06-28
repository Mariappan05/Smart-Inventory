"use client";

import { useState, useEffect } from "react";
import { Upload, Loader2, CheckCircle, XCircle, Eye, Trash2, Lock } from "lucide-react";
import toast from "react-hot-toast";

interface SupplierPO {
  id: string;
  poNumber: string;
  supplierName: string;
  supplierCode?: string;
  totalAmount?: number;
  notes?: string;
  pdfUrl?: string;
  pdfFileName?: string;
  createdAt: string;
}

export function SupplierPOView() {
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [tools, setTools] = useState<any[]>([]);
  const [pos, setPos] = useState<SupplierPO[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedPOId, setSelectedPOId] = useState<string | null>(null);
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState<string | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    poNumber: "",
    supplierName: "",
    supplierCode: "",
    poDate: "",
    deliveryDate: "",
    toolId: "",
    quantity: "",
    unitPrice: "",
    paymentTerms: "Net 30",
    status: "Draft",
    notes: "",
  });

  const [pdfFile, setPdfFile] = useState<File | null>(null);

  useEffect(() => {
    fetchSuppliers();
    fetchTools();
    fetchPOs();
    // Fetch user role
    fetch("/api/auth/session")
      .then(res => res.json())
      .then(data => { if (data.role) setUserRole(data.role); })
      .catch(() => {});
  }, []);

  const isAdmin = userRole === "ADMIN";

  const fetchSuppliers = async () => {
    try {
      const res = await fetch("/api/suppliers");
      const data = await res.json();
      if (data.success) {
        setSuppliers(data.data);
      }
    } catch (error) {
      console.error("Error fetching suppliers:", error);
    }
  };

  const fetchTools = async () => {
    try {
      const res = await fetch("/api/tools");
      const data = await res.json();
      if (data.success) {
        setTools(data.data);
      }
    } catch (error) {
      console.error("Error fetching tools:", error);
    }
  };

  const fetchPOs = async () => {
    try {
      const res = await fetch("/api/supplier-po");
      const data = await res.json();
      if (data.success) {
        setPos(data.data);
      }
    } catch (error) {
      console.error("Error fetching POs:", error);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.includes("pdf")) {
        toast.error("Please select a PDF file");
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        toast.error("File size must be less than 10MB");
        return;
      }
      setPdfFile(file);
    }
  };

  const uploadPDF = async () => {
    if (!pdfFile) {
      toast.error("Please select a PDF file");
      return;
    }

    setUploading(true);
    try {
      const formDataToSend = new FormData();
      formDataToSend.append("file", pdfFile);

      const res = await fetch("/api/uploads/supplier-po", {
        method: "POST",
        body: formDataToSend,
      });

      const data = await res.json();
      if (data.success) {
        toast.success("PDF uploaded successfully");
        setFormData(prev => ({
          ...prev,
          pdfUrl: data.data.fileUrl,
        }));
        setPdfFile(null);
        (document.getElementById("pdfInput") as HTMLInputElement).value = "";
      } else {
        toast.error(data.message || "Upload failed");
      }
    } catch (error: any) {
      toast.error(error.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const totalAmount = (parseFloat(formData.quantity) * parseFloat(formData.unitPrice)) || 0;

      const payload = {
        poNumber: formData.poNumber || `PO-${Date.now()}`,
        supplierName: formData.supplierName,
        supplierCode: formData.supplierCode,
        totalAmount,
        notes: formData.notes,
        pdfUrl: (formData as any).pdfUrl,
        pdfFileName: pdfFile?.name,
      };

      const res = await fetch("/api/supplier-po", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.success) {
        toast.success("Purchase Order created successfully");
        setFormData({
          poNumber: "",
          supplierName: "",
          supplierCode: "",
          poDate: "",
          deliveryDate: "",
          toolId: "",
          quantity: "",
          unitPrice: "",
          paymentTerms: "Net 30",
          status: "Draft",
          notes: "",
        });
        setPdfFile(null);
        (document.getElementById("pdfInput") as HTMLInputElement).value = "";
        fetchPOs();
      } else {
        toast.error(data.message || "Failed to create PO");
      }
    } catch (error: any) {
      toast.error(error.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePO = async (poId: string) => {
    if (!confirm("Are you sure you want to delete this PO?")) return;

    try {
      const res = await fetch(`/api/supplier-po/${poId}`, { method: "DELETE" });
      const data = await res.json();

      if (data.success) {
        toast.success("PO deleted successfully");
        fetchPOs();
      } else {
        toast.error(data.message || "Failed to delete PO");
      }
    } catch (error: any) {
      toast.error(error.message || "An error occurred");
    }
  };

  const openPdfPreview = (url: string) => {
    setPdfPreviewUrl(url);
    setPreviewOpen(true);
  };

  const closePdfPreview = () => {
    setPreviewOpen(false);
    setPdfPreviewUrl(null);
  };

  const totalAmount = (parseFloat(formData.quantity) * parseFloat(formData.unitPrice)) || 0;

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-slate-200 bg-white/70 p-6 shadow-panel dark:border-slate-700 dark:bg-slate-900/70">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">
          Supplier Purchase Orders
        </h1>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
          Create and manage supplier purchase orders with PDF documentation
        </p>
      </div>

      {/* Create PO Form Section */}
      <div className="rounded-lg border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-800">
        <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-6">
          Create New Purchase Order
        </h2>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {/* Supplier */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Supplier Name
              </label>
              <input
                type="text"
                required
                value={formData.supplierName}
                onChange={(e) => setFormData({ ...formData, supplierName: e.target.value })}
                placeholder="Enter supplier name"
                className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2 text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
              />
            </div>

            {/* Supplier Code */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Supplier Code
              </label>
              <input
                type="text"
                value={formData.supplierCode}
                onChange={(e) => setFormData({ ...formData, supplierCode: e.target.value })}
                placeholder="Enter supplier code"
                className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2 text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
              />
            </div>

            {/* PO Date */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                PO Date
              </label>
              <input
                type="date"
                value={formData.poDate}
                onChange={(e) => setFormData({ ...formData, poDate: e.target.value })}
                className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2 text-slate-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
              />
            </div>

            {/* Expected Delivery Date */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Expected Delivery Date
              </label>
              <input
                type="date"
                value={formData.deliveryDate}
                onChange={(e) => setFormData({ ...formData, deliveryDate: e.target.value })}
                className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2 text-slate-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
              />
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

            {/* Unit Price — ADMIN only editable */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-2">
                Unit Price
                {!isAdmin && <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"><Lock className="h-3 w-3" /> Admin Only</span>}
              </label>
              {isAdmin ? (
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.unitPrice}
                  onChange={(e) => setFormData({ ...formData, unitPrice: e.target.value })}
                  placeholder="Enter unit price"
                  className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2 text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
                />
              ) : (
                <div className="w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-2 text-slate-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400 flex items-center gap-2">
                  <Lock className="h-4 w-4" />
                  <span className="text-sm">Restricted — Admin access required</span>
                </div>
              )}
            </div>

            {/* Total Amount — ADMIN only */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Total Amount
              </label>
              {isAdmin ? (
                <input
                  type="number"
                  disabled
                  value={totalAmount}
                  className="w-full rounded-lg border border-slate-300 bg-slate-50 px-4 py-2 text-slate-900 cursor-not-allowed dark:border-slate-600 dark:bg-slate-700 dark:text-slate-400"
                />
              ) : (
                <div className="w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-2 text-slate-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400 flex items-center gap-2">
                  <Lock className="h-4 w-4" />
                  <span className="text-sm">Hidden</span>
                </div>
              )}
            </div>

            {/* Payment Terms */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Payment Terms
              </label>
              <select
                value={formData.paymentTerms}
                onChange={(e) => setFormData({ ...formData, paymentTerms: e.target.value })}
                className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2 text-slate-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
              >
                <option>Net 30</option>
                <option>Net 60</option>
                <option>Prepaid</option>
                <option>COD</option>
              </select>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Notes/Remarks
            </label>
            <textarea
              rows={4}
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Enter any additional notes or remarks"
              className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2 text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
            ></textarea>
          </div>

          {/* PDF Upload Section */}
          <div className="border-t border-slate-200 dark:border-slate-700 pt-6">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">
              Upload PO Document
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  PDF File
                </label>
                <div className="flex gap-3">
                  <div className="flex-1">
                    <input
                      id="pdfInput"
                      type="file"
                      accept="application/pdf"
                      onChange={handleFileChange}
                      className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm text-slate-600 file:mr-3 file:bg-blue-50 file:border-0 file:px-3 file:py-2 file:text-slate-700 file:font-medium hover:file:bg-blue-100 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-400 dark:file:bg-slate-600"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={uploadPDF}
                    disabled={!pdfFile || uploading}
                    className="flex items-center gap-2 rounded-lg bg-black px-4 py-2 text-white hover:bg-slate-900 disabled:bg-slate-400 transition-colors dark:bg-slate-950 dark:hover:bg-black"
                  >
                    {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                    {uploading ? "Uploading..." : "Upload"}
                  </button>
                </div>
              </div>

              {(formData as any).pdfUrl && (
                <div className="flex items-center gap-3 rounded-lg bg-green-50 p-3 dark:bg-green-950">
                  <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                  <span className="text-sm text-green-700 dark:text-green-200">PDF uploaded successfully</span>
                  <button
                    type="button"
                    onClick={() => openPdfPreview((formData as any).pdfUrl)}
                    className="ml-auto text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400"
                  >
                    Preview
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="flex gap-3 border-t border-slate-200 dark:border-slate-700 pt-6">
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 rounded-lg bg-black px-6 py-2 text-white hover:bg-slate-900 disabled:bg-slate-400 transition-colors dark:bg-slate-950 dark:hover:bg-black"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create PO"}
            </button>
            <button
              type="reset"
              className="rounded-lg border border-slate-300 px-6 py-2 text-slate-900 hover:bg-slate-50 transition-colors dark:border-slate-600 dark:text-slate-100 dark:hover:bg-slate-700"
            >
              Clear
            </button>
          </div>
        </form>
      </div>

      {/* POs List Section */}
      <div className="rounded-lg border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-800">
        <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-6">
          Purchase Orders
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-700">
                <th className="px-4 py-3 text-left font-medium text-slate-700 dark:text-slate-300">
                  PO Number
                </th>
                <th className="px-4 py-3 text-left font-medium text-slate-700 dark:text-slate-300">
                  Supplier
                </th>
                <th className="px-4 py-3 text-left font-medium text-slate-700 dark:text-slate-300">
                  Total Amount
                </th>
                <th className="px-4 py-3 text-left font-medium text-slate-700 dark:text-slate-300">
                  Document
                </th>
                <th className="px-4 py-3 text-left font-medium text-slate-700 dark:text-slate-300">
                  Created Date
                </th>
                <th className="px-4 py-3 text-center font-medium text-slate-700 dark:text-slate-300">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {pos.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-6 text-center text-slate-500 dark:text-slate-400">
                    No purchase orders yet
                  </td>
                </tr>
              ) : (
                pos.map((po) => (
                  <tr key={po.id} className="border-b border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50">
                    <td className="px-4 py-3 text-slate-900 dark:text-slate-100">{po.poNumber}</td>
                    <td className="px-4 py-3 text-slate-700 dark:text-slate-300">{po.supplierName}</td>
                    <td className="px-4 py-3 text-slate-700 dark:text-slate-300">
                      {isAdmin
                        ? po.totalAmount ? `₹${po.totalAmount.toFixed(2)}` : "-"
                        : <span className="inline-flex items-center gap-1 text-xs text-slate-400"><Lock className="h-3 w-3" /> Hidden</span>}
                    </td>
                    <td className="px-4 py-3">
                      {po.pdfUrl ? (
                        <button
                          onClick={() => openPdfPreview(po.pdfUrl!)}
                          className="flex items-center gap-1 text-blue-600 hover:text-blue-700 dark:text-blue-400"
                        >
                          <Eye className="h-4 w-4" />
                          View
                        </button>
                      ) : (
                        <span className="text-slate-500 dark:text-slate-400">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-700 dark:text-slate-300">
                      {new Date(po.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 flex justify-center gap-2">
                      <button
                        onClick={() => handleDeletePO(po.id)}
                        className="text-red-600 hover:text-red-700 dark:text-red-400"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* PDF Preview Modal */}
      {previewOpen && pdfPreviewUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-4xl rounded-lg bg-white p-6 dark:bg-slate-800 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
                PDF Preview
              </h3>
              <button
                onClick={closePdfPreview}
                className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
              >
                <XCircle className="h-6 w-6" />
              </button>
            </div>
            <iframe
              src={pdfPreviewUrl}
              className="w-full h-[60vh] rounded-lg border border-slate-200 dark:border-slate-700"
              title="PDF Preview"
            />
          </div>
        </div>
      )}
    </div>
  );
}
