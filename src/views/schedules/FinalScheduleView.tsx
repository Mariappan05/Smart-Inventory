"use client";

import { useState, useEffect } from "react";
import { CheckCircle2, Edit2, Loader2, Printer, Download, X } from "lucide-react";
import { Select } from "@/components/ui/Select";
import toast from "react-hot-toast";
import { fmtDate } from "@/utils/dateFormat";

const GST_RATE = 0.18;

type Supplier = { id: string; name: string; code: string };
type Type = { id: string; name: string; supplierId: string | null };
type Item = {
  id: string;
  name: string;
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
  Store: Store;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  gstAmount: number;
  totalWithGst: number;
  orderDeliveryDate: string;
  deliveryDate?: string | null;
  supplierBillNumber?: string | null;
  status: string;
  notes?: string | null;
  billUrl?: string | null;
  qrCode?: string | null;
  createdAt: string;
};

type Props = {
  suppliers?: Supplier[];
  types?: Type[];
  items?: Item[];
  stores?: Store[];
};

export function FinalScheduleView({ suppliers = [], types = [], items = [], stores = [] }: Props) {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({
    scheduleDate: "",
    supplierId: "",
    typeId: "",
    itemId: "",
    storeId: "",
    quantity: "",
    unitPrice: "",
    orderDeliveryDate: "",
    notes: "",
  });
  const [priceType, setPriceType] = useState<"unit" | "total">("unit");
  const [totalPrice, setTotalPrice] = useState("");

  useEffect(() => {
    fetchSchedules();
  }, []);

  const fetchSchedules = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/schedules?status=FINAL");
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

  const startEdit = (schedule: Schedule) => {
    setEditingId(schedule.id);
    setPriceType("unit");
    setTotalPrice("");
    setEditForm({
      scheduleDate: new Date(schedule.scheduleDate).toISOString().split("T")[0],
      supplierId: schedule.supplier.id,
      typeId: schedule.type.id,
      itemId: schedule.item.id,
      storeId: schedule.Store.id,
      quantity: schedule.quantity.toString(),
      unitPrice: schedule.unitPrice.toString(),
      orderDeliveryDate: new Date(schedule.orderDeliveryDate).toISOString().split("T")[0],
      notes: schedule.notes || "",
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setPriceType("unit");
    setTotalPrice("");
    setEditForm({ scheduleDate: "", supplierId: "", typeId: "", itemId: "", storeId: "", quantity: "", unitPrice: "", orderDeliveryDate: "", notes: "" });
  };

  const saveEdit = async (id: string) => {
    try {
      // Only save quantity in Final Schedule view
      const response = await fetch(`/api/schedules/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          quantity: parseInt(editForm.quantity),
        }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message);
      }

      toast.success("Quantity updated");
      setEditingId(null);
      fetchSchedules();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update schedule");
    }
  };

  const markComplete = async (id: string, targetPlantId: string, itemName: string) => {
    if (!confirm("Mark this order as completed? A notification will be sent to the assigned store admin.")) return;

    try {
      const response = await fetch(`/api/schedules/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          status: "COMPLETED",
          targetPlantId,
          itemName,
        }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message);
      }

      toast.success("Order marked as completed. Notification sent to assigned store admin.");
      fetchSchedules();
    } catch (error) {
      toast.error("Failed to complete order");
    }
  };

  const generateBill = async (id: string) => {
    if (!confirm("Generate bill for this schedule? This will create QR code and prepare for print.")) return;

    try {
      const response = await fetch(`/api/schedules/${id}/generate-bill`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message);
      }

      toast.success("Bill generated successfully!");
      fetchSchedules();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to generate bill");
    }
  };

  const confirmBillReceipt = async (id: string, supplierName: string) => {
    const billNumber = prompt(`Enter supplier bill number for ${supplierName}:`);
    if (!billNumber) return;

    try {
      const response = await fetch(`/api/schedules/${id}/confirm-bill`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          billReceivedDate: new Date().toISOString(),
          supplierBillNumber: billNumber,
        }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message);
      }

      toast.success("Bill confirmed! Item moved to Product IN/OUT.");
      fetchSchedules();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to confirm bill receipt");
    }
  };

  const downloadQRCode = (schedule: Schedule) => {
    const billId = schedule.id.substring(0, 8).toUpperCase();
    const link = document.createElement("a");
    link.href = `/api/qr/schedule-download?data=${encodeURIComponent(billId)}`;
    link.download = `bill-qr-${billId}.png`;
    link.click();
    toast.success("QR code downloaded");
  };

  const printBill = (schedule: Schedule) => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    const billId = schedule.id.substring(0, 8).toUpperCase();
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(billId)}`;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Order Delivery Bill - ${schedule.supplier.name}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { 
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
            background: #f5f5f5;
            padding: 20px;
          }
          .bill-container {
            background: white;
            max-width: 900px;
            margin: 0 auto;
            padding: 60px 40px;
            box-shadow: 0 0 30px rgba(0,0,0,0.1);
            border-radius: 8px;
          }
          
          /* Header Section */
          .header {
            text-align: center;
            margin-bottom: 50px;
            padding-bottom: 30px;
            background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
            color: white;
            border-radius: 12px;
            padding: 40px;
            position: relative;
            overflow: hidden;
          }
          .header::before {
            content: '';
            position: absolute;
            top: 0;
            right: 0;
            width: 200px;
            height: 200px;
            background: rgba(255,255,255,0.05);
            border-radius: 50%;
            transform: translate(50%, -50%);
          }
          .company-name {
            font-size: 32px;
            font-weight: 700;
            margin-bottom: 10px;
            letter-spacing: 1px;
            position: relative;
            z-index: 1;
          }
          .bill-title {
            font-size: 28px;
            font-weight: 600;
            margin: 15px 0;
            text-transform: uppercase;
            letter-spacing: 2px;
            position: relative;
            z-index: 1;
          }
          .bill-date {
            font-size: 16px;
            margin-top: 15px;
            opacity: 0.95;
            position: relative;
            z-index: 1;
          }
          .bill-no {
            font-size: 14px;
            margin-top: 8px;
            font-weight: 500;
            opacity: 0.9;
            position: relative;
            z-index: 1;
          }
          
          /* Details Section */
          .details-section {
            margin: 40px 0;
          }
          .details-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 40px;
            margin-bottom: 40px;
          }
          .detail-group {
            display: flex;
            flex-direction: column;
            gap: 20px;
            padding: 25px;
            background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
            border-radius: 10px;
            border-left: 4px solid #0284c7;
          }
          .detail-group:nth-child(even) {
            border-left-color: #10b981;
          }
          .detail-row {
            display: flex;
            justify-content: space-between;
            padding: 12px 0;
            border-bottom: 1px solid #e2e8f0;
          }
          .detail-row:last-child {
            border-bottom: none;
          }
          .detail-label {
            font-weight: 600;
            color: #334155;
            font-size: 16px;
            min-width: 150px;
          }
          .detail-value {
            color: #1e293b;
            font-size: 16px;
            font-weight: 500;
            text-align: right;
          }
          
          /* Items Table */
          .items-table {
            width: 100%;
            border-collapse: collapse;
            margin: 40px 0;
            background: white;
            border-radius: 10px;
            overflow: hidden;
            box-shadow: 0 4px 15px rgba(0,0,0,0.08);
          }
          .items-table thead {
            background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
            color: white;
          }
          .items-table th {
            padding: 20px;
            text-align: left;
            font-weight: 700;
            font-size: 15px;
            letter-spacing: 0.5px;
          }
          .items-table td {
            padding: 20px;
            font-size: 16px;
            color: #1e293b;
            border-bottom: 1px solid #e2e8f0;
          }
          .items-table tbody tr:hover {
            background: #f8fafc;
          }
          .items-table tbody tr:last-child td {
            border-bottom: none;
          }
          .items-table .qty {
            text-align: right;
            font-weight: 600;
          }
          .items-table .amount {
            text-align: right;
            font-weight: 600;
            color: #059669;
          }
          
          /* Summary Section */
          .summary-section {
            margin: 40px 0;
            padding: 25px;
            text-align: right;
            background: linear-gradient(135deg, #f0f4f8 0%, #e8ecf1 100%);
            border-radius: 10px;
            border-right: 4px solid #0284c7;
          }
          .summary-row {
            display: flex;
            justify-content: flex-end;
            margin: 15px 0;
            gap: 100px;
          }
          .summary-label {
            font-size: 16px;
            font-weight: 500;
            color: #475569;
            min-width: 150px;
          }
          .summary-value {
            font-size: 16px;
            font-weight: 600;
            color: #1e293b;
            min-width: 100px;
            text-align: right;
          }
          
          /* Footer */
          .footer {
            margin-top: 60px;
            padding-top: 30px;
            padding-bottom: 20px;
            border-top: 3px solid #1e293b;
            text-align: center;
            color: #64748b;
            font-size: 13px;
            line-height: 1.8;
          }
          .footer-text {
            margin: 8px 0;
          }
          .footer-text:first-child {
            font-weight: 600;
            color: #334155;
          }
          
          /* Print Styles */
          @media print {
            body {
              background: white;
              padding: 0;
            }
            .bill-container {
              box-shadow: none;
              padding: 40px 30px;
              border-radius: 0;
            }
            .print-button {
              display: none !important;
            }
          }
          
          /* Print Button */
          .print-button {
            display: block;
            margin: 30px auto 0;
            padding: 15px 40px;
            background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
            color: white;
            border: none;
            border-radius: 8px;
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s ease;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
          }
          .print-button:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 20px rgba(0,0,0,0.2);
          }
          
          /* QR Section */
          .qr-section {
            text-align: center;
            margin: 20px 0 40px 0;
            padding: 30px;
            background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
            border: 2px dashed #cbd5e1;
            border-radius: 10px;
          }
          .qr-code {
            margin: 10px auto;
            padding: 15px;
            background: white;
            border: 3px solid #1e293b;
            border-radius: 10px;
            display: inline-block;
            box-shadow: 0 4px 12px rgba(0,0,0,0.1);
          }
          .qr-code img {
            display: block;
          }
          .qr-label {
            font-size: 13px;
            color: #475569;
            margin-top: 8px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 1px;
          }
          
          .controls {
            display: flex;
            gap: 10px;
            justify-content: center;
            margin: 30px auto 0;
            flex-wrap: wrap;
          }
        </style>
      </head>
      <body>
        <div class="bill-container">
          <div class="header">
            <div class="company-name">Smart Product Inventory System</div>
            <div class="bill-title">Order Delivery Bill</div>
            <div class="bill-date">Date: <strong>${new Date().toLocaleDateString('en-GB', { year: 'numeric', month: '2-digit', day: '2-digit' })}</strong></div>
            <div class="bill-no">Bill ID: <strong>${billId}</strong></div>
          </div>
          
          <div class="qr-section">
            <div class="qr-code">
              <img src="${qrUrl}" alt="QR Code" />
            </div>
            <div class="qr-label">Scan to verify bill</div>
          </div>
          
          <div class="details-section">
            <div class="details-grid">
              <div class="detail-group">
                <div style="font-weight: 700; font-size: 18px; color: #1e293b; margin-bottom: 10px;">Supplier Information</div>
                <div class="detail-row">
                  <span class="detail-label">Company Name</span>
                  <span class="detail-value">${schedule.supplier.name}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Supplier Code</span>
                  <span class="detail-value">${schedule.supplier.code}</span>
                </div>
              </div>
              
              <div class="detail-group">
                <div style="font-weight: 700; font-size: 18px; color: #1e293b; margin-bottom: 10px;">Order Information</div>
                <div class="detail-row">
                  <span class="detail-label">Schedule Date</span>
                  <span class="detail-value">${new Date(schedule.scheduleDate).toLocaleDateString('en-GB', { year: 'numeric', month: '2-digit', day: '2-digit' })}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Delivery Date</span>
                  <span class="detail-value">${new Date(schedule.orderDeliveryDate).toLocaleDateString('en-GB', { year: 'numeric', month: '2-digit', day: '2-digit' })}</span>
                </div>
              </div>
            </div>
            
            <div class="details-grid">
              <div class="detail-group">
                <div style="font-weight: 700; font-size: 18px; color: #1e293b; margin-bottom: 10px;">Item Details</div>
                <div class="detail-row">
                  <span class="detail-label">Item Description</span>
                  <span class="detail-value">${schedule.item.name}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Store Name</span>
                  <span class="detail-value">${schedule.Store.name}</span>
                </div>
              </div>
            </div>
          </div>
          
          <table class="items-table">
            <thead>
              <tr>
                <th style="text-align: left;">Description</th>
                <th class="qty">Quantity</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>${schedule.item.name}</td>
                <td class="qty">${schedule.quantity}</td>
              </tr>
            </tbody>
          </table>
          
          ${schedule.notes ? `
          <div class="details-section">
            <div style="font-weight: 700; font-size: 16px; color: #1e293b; margin-bottom: 12px;">Additional Notes</div>
            <div style="padding: 15px; background: #f1f5f9; border-left: 4px solid #1e293b; color: #334155; line-height: 1.6;">
              ${schedule.notes}
            </div>
          </div>
          ` : ''}
          
          <div class="footer">
            <div class="footer-text">This is a computer-generated document and does not require a signature.</div>
            <div class="footer-text">Generated on ${new Date().toLocaleString('en-US', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' })}</div>
            <div class="footer-text" style="margin-top: 15px; font-size: 12px; color: #94a3b8;">Thank you for your business!</div>
          </div>
        </div>
        
        <div class="controls">
          <button class="print-button" onclick="window.print()">🖨️ Print Bill</button>
        </div>
      </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
          Schedule Management
        </p>
        <h1 className="text-3xl font-semibold text-slate-900 dark:text-slate-100">
          Final Schedule
        </h1>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
          Manage and complete order schedules before delivery date
        </p>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-panel dark:border-slate-700 dark:bg-slate-900/70">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
          </div>
        ) : schedules.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 py-8 text-center text-slate-500 dark:border-slate-700 dark:text-slate-400">
            No active schedules
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
                className="rounded-xl border border-slate-200 bg-slate-50 p-4 transition dark:border-slate-700 dark:bg-slate-800"
              >
                {editingId === schedule.id ? (
                  <div className="space-y-4">
                    <h3 className="font-semibold text-slate-900 dark:text-slate-100">Edit All Schedule Details</h3>
                    
                    <div className="grid gap-4 sm:grid-cols-2">
                      {/* Read-only Fields */}
                      <div>
                        <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
                          Supplier
                        </label>
                        <div className="w-full rounded-lg border border-slate-300 bg-slate-100 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100">
                          {editForm.supplierId ? suppliers.find((s) => s.id === editForm.supplierId)?.name : "-"}
                        </div>
                      </div>

                      <div>
                        <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
                          Type
                        </label>
                        <div className="w-full rounded-lg border border-slate-300 bg-slate-100 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100">
                          {editForm.typeId ? types.find((t) => t.id === editForm.typeId)?.name : "-"}
                        </div>
                      </div>

                      <div>
                        <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
                          Item
                        </label>
                        <div className="w-full rounded-lg border border-slate-300 bg-slate-100 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100">
                          {editForm.itemId ? items.find((i) => i.id === editForm.itemId)?.name : "-"}
                        </div>
                      </div>

                      <div>
                        <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
                          Store </label>
                        <div className="w-full rounded-lg border border-slate-300 bg-slate-100 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100">
                          {editForm.storeId ? stores.find((p) => p.id === editForm.storeId)?.name : "-"}
                        </div>
                      </div>

                      <div>
                        <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
                          Unit Price (₹)
                        </label>
                        <div className="w-full rounded-lg border border-slate-300 bg-slate-100 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100">
                          ₹{parseFloat(editForm.unitPrice).toFixed(2)}
                        </div>
                      </div>

                      {/* Editable Field - Quantity Only */}
                      <div>
                        <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
                          Quantity <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="number"
                          min="1"
                          value={editForm.quantity}
                          onChange={(e) => setEditForm({ ...editForm, quantity: e.target.value })}
                          className="w-full rounded-lg border border-blue-400 bg-blue-50 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 dark:border-blue-600 dark:bg-blue-900/30 dark:text-slate-100"
                        />
                      </div>
                    </div>

                    <div className="mt-4 rounded-lg border border-blue-200 bg-blue-50 p-3 dark:border-blue-800 dark:bg-blue-900/20">
                      <p className="text-sm text-blue-700 dark:text-blue-400">
                        ℹ️ Only the Quantity field can be modified in the Final Schedule. Other details are locked.
                      </p>
                    </div>

                    <div className="mt-4 rounded-lg border border-blue-200 bg-blue-50 p-3 dark:border-blue-800 dark:bg-blue-900/20">
                      <p className="text-sm text-blue-700 dark:text-blue-400">
                        ℹ️ Only the Quantity field can be modified in the Final Schedule. Other details are locked.
                      </p>
                    </div>

                    <div className="flex gap-2 pt-4">
                      <button
                        onClick={() => saveEdit(schedule.id)}
                        className="rounded-lg bg-black px-4 py-2 text-sm font-semibold text-white hover:bg-slate-900 dark:bg-slate-950 dark:hover:bg-black"
                      >
                        Save Quantity
                      </button>
                      <button
                        onClick={cancelEdit}
                        className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="mb-3 flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold text-slate-900 dark:text-slate-100">
                          {schedule.supplier.name}
                        </h3>
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                          Schedule: {fmtDate(schedule.scheduleDate)} | Delivery: {fmtDate(schedule.orderDeliveryDate)}
                        </p>
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                          Store: {schedule.Store.name}
                        </p>
                      </div>
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        schedule.status === "COMPLETED"
                          ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                          : "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                      }`}>
                        {schedule.status}
                      </span>
                    </div>

                    {/* Products List */}
                    {hasMultipleProducts ? (
                      <div className="mb-3 space-y-2">
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
                              className="rounded-lg border border-slate-200 bg-white p-3 dark:border-slate-600 dark:bg-slate-700"
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
                                <div className="ml-3 rounded bg-slate-100 px-3 py-2 text-right dark:bg-slate-600">
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
                      <div className="mb-3 rounded-lg border border-slate-200 bg-white p-3 dark:border-slate-600 dark:bg-slate-700">
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
                    <div className="mt-3 grid gap-2 rounded-lg border border-blue-200 bg-blue-50 p-3 sm:grid-cols-4 dark:border-blue-800 dark:bg-blue-950/30">
                      <div>
                        <p className="text-xs text-slate-600 dark:text-slate-400">Total Items</p>
                        <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{schedule.quantity}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-600 dark:text-slate-400">Base Total</p>
                        <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">₹{schedule.totalPrice.toFixed(2)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-600 dark:text-slate-400">GST (18%)</p>
                        <p className="text-sm font-semibold text-orange-600 dark:text-orange-400">₹{schedule.gstAmount.toFixed(2)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-600 dark:text-slate-400">Total with GST</p>
                        <p className="text-sm font-semibold text-green-700 dark:text-green-400">₹{schedule.totalWithGst.toFixed(2)}</p>
                      </div>
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <button
                        onClick={() => startEdit(schedule)}
                        className="inline-flex items-center gap-1 rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700"
                      >
                        <Edit2 className="h-4 w-4" />
                        Edit Quantity
                      </button>
                      {schedule.status === "FINAL" && (
                        <button
                          onClick={() => generateBill(schedule.id)}
                          className="inline-flex items-center gap-1 rounded-lg bg-amber-600 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-700"
                        >
                          <Loader2 className="h-4 w-4" />
                          Generate Bill
                        </button>
                      )}
                      {schedule.status === "BILL_GENERATED" && (
                        <>
                          <button
                            onClick={() => confirmBillReceipt(schedule.id, schedule.supplier.name)}
                            className="inline-flex items-center gap-1 rounded-lg bg-black px-4 py-2 text-sm font-semibold text-white hover:bg-slate-900 dark:bg-slate-950 dark:hover:bg-black"
                          >
                            <CheckCircle2 className="h-4 w-4" />
                            Confirm Bill Receipt
                          </button>
                        </>
                      )}
                      <button
                        onClick={() => printBill(schedule)}
                        className="inline-flex items-center gap-1 rounded-lg border border-blue-300 bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-100 dark:border-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                      >
                        <Printer className="h-4 w-4" />
                        Print Bill
                      </button>
                      <button
                        onClick={() => downloadQRCode(schedule)}
                        className="inline-flex items-center gap-1 rounded-lg border border-purple-300 bg-purple-50 px-4 py-2 text-sm font-semibold text-purple-700 hover:bg-purple-100 dark:border-purple-700 dark:bg-purple-900/30 dark:text-purple-400"
                      >
                        <Download className="h-4 w-4" />
                        Download QR
                      </button>
                    </div>
                  </div>
                )}
              </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
