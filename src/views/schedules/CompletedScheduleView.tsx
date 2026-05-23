"use client";

import { useState, useEffect } from "react";
import { CheckCircle2, Clock, Loader2, Printer, Download } from "lucide-react";
import { fmtDate } from "@/utils/dateFormat";
import toast from "react-hot-toast";

type Schedule = {
  id: string;
  scheduleDate: string;
  supplier: { name: string; code: string };
  item: { name: string };
  Store: { name: string };
  quantity: number;
  unitPrice: number;
  orderDeliveryDate: string;
  status: string;
  completedAt?: string;
  completedBy?: { id: string; name: string } | null;
  completedByPlant?: { id: string; name: string } | null;
  deliveredAt?: string | null;
  deliveredBy?: { id: string; name: string } | null;
  notes?: string | null;
  createdAt: string;
};

export function CompletedScheduleView() {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchSchedules();
  }, []);

  const fetchSchedules = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/schedules?status=COMPLETED");
      const data = await response.json();
      if (data.success) {
        setSchedules(data.data);
      }
    } catch (error) {
      toast.error("Failed to fetch completed schedules");
    } finally {
      setLoading(false);
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

    const baseTotal = schedule.quantity * schedule.unitPrice;
    const gstAmount = baseTotal * 0.18;
    const totalWithGst = baseTotal + gstAmount;

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
          
          .header {
            text-align: center;
            margin-bottom: 50px;
            border-bottom: 3px solid #1e293b;
            padding-bottom: 30px;
          }
          .company-name {
            font-size: 32px;
            font-weight: 700;
            color: #1e293b;
            margin-bottom: 10px;
            letter-spacing: 1px;
          }
          .bill-title {
            font-size: 28px;
            font-weight: 600;
            color: #0f172a;
            margin: 15px 0;
            text-transform: uppercase;
            letter-spacing: 2px;
          }
          .bill-date {
            font-size: 16px;
            color: #64748b;
            margin-top: 15px;
          }
          .status-badge {
            display: inline-block;
            background: #10b981;
            color: white;
            padding: 8px 16px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: 600;
            margin-top: 10px;
          }
          
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
          }
          .detail-row {
            display: flex;
            justify-content: space-between;
            padding: 12px 0;
            border-bottom: 1px solid #e2e8f0;
          }
          .detail-label {
            font-weight: 600;
            color: #334155;
            font-size: 16px;
          }
          .detail-value {
            color: #1e293b;
            font-size: 16px;
            font-weight: 500;
            text-align: right;
          }
          
          .items-table {
            width: 100%;
            border-collapse: collapse;
            margin: 40px 0;
            background: #f8fafc;
            border-radius: 8px;
            overflow: hidden;
          }
          .items-table thead {
            background: #1e293b;
            color: white;
          }
          .items-table th {
            padding: 20px;
            text-align: left;
            font-weight: 700;
            font-size: 15px;
          }
          .items-table td {
            padding: 20px;
            font-size: 16px;
            color: #1e293b;
            border-bottom: 1px solid #e2e8f0;
          }
          .items-table .qty { text-align: right; }
          .items-table .amount { text-align: right; color: #059669; font-weight: 600; }
          
          .summary {
            margin: 40px 0;
            text-align: right;
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
          
          .footer {
            margin-top: 60px;
            padding-top: 30px;
            border-top: 2px solid #1e293b;
            text-align: center;
            color: #64748b;
            font-size: 13px;
          }
          
          @media print {
            body { background: white; padding: 0; }
            .bill-container { box-shadow: none; border-radius: 0; }
            .print-button { display: none !important; }
          }
          
          .print-button {
            display: block;
            margin: 30px auto 0;
            padding: 15px 40px;
            background: #1e293b;
            color: white;
            border: none;
            border-radius: 6px;
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
          }
        </style>
      </head>
      <body>
        <div class="bill-container">
          <div class="header">
            <div class="company-name">Smart Product Inventory System</div>
            <div class="bill-title">Order Delivery Bill (Completed)</div>
            <div class="bill-date">Date: <strong>${new Date().toLocaleDateString('en-GB', { year: 'numeric', month: '2-digit', day: '2-digit' })}</strong></div>
            <div class="status-badge">✓ Order Completed</div>
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
                <th>Description</th>
                <th class="qty">Quantity</th>
                <th style="text-align: right;">Unit (₹)</th>
                <th class="amount">Amount (₹)</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>${schedule.item.name}</td>
                <td class="qty">${schedule.quantity}</td>
                <td style="text-align: right;">₹${schedule.unitPrice.toFixed(2)}</td>
                <td class="amount">₹${baseTotal.toFixed(2)}</td>
              </tr>
            </tbody>
          </table>
          
          <div class="summary">
            <div class="summary-row">
              <span class="summary-label">Subtotal:</span>
              <span class="summary-value">₹${baseTotal.toFixed(2)}</span>
            </div>
            <div class="summary-row">
              <span class="summary-label">GST (18%):</span>
              <span class="summary-value">₹${gstAmount.toFixed(2)}</span>
            </div>
            <div class="summary-row" style="margin-top: 20px; padding-top: 15px; border-top: 2px solid #1e293b;">
              <span class="summary-label" style="font-weight: 700; font-size: 18px;">Total (with GST):</span>
              <span class="summary-value" style="font-weight: 700; font-size: 18px; color: #10b981;">₹${totalWithGst.toFixed(2)}</span>
            </div>
          </div>
          
          <div class="footer">
            <div>This is a completed order document from Smart Product Inventory System.</div>
            <div style="margin-top: 10px;">Generated on ${new Date().toLocaleString('en-US', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' })}</div>
          </div>
        </div>
        
        <button class="print-button" onclick="window.print()">🖨️ Print</button>
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
          Completed Schedules
        </h1>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
          View all completed orders and their details
        </p>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-panel dark:border-slate-700 dark:bg-slate-900/70">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
          </div>
        ) : schedules.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 py-8 text-center text-slate-500 dark:border-slate-700 dark:text-slate-400">
            No completed schedules
          </div>
        ) : (
          <div className="space-y-4">
            {schedules.map((schedule) => (
              <div
                key={schedule.id}
                className="rounded-xl border border-slate-200 bg-slate-50 p-4 transition dark:border-slate-700 dark:bg-slate-800"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-slate-900 dark:text-slate-100">
                      {schedule.supplier.name}
                    </h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      {schedule.item.name} • {schedule.Store.name}
                    </p>
                  </div>
                  <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold ${
                    schedule.status === "CLOSED" || schedule.status === "DELIVERED"
                      ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                      : "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                  }`}>
                    <CheckCircle2 className="h-3 w-3" />
                    {schedule.status === "CLOSED" ? "Delivered" : schedule.status === "DELIVERED" ? "Delivered" : "Completed"}
                  </span>
                </div>

                {(schedule.completedBy || schedule.completedByPlant) && (
                  <div className="mb-3 rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm dark:border-green-800 dark:bg-green-900/20">
                    <p className="text-xs font-semibold uppercase tracking-wide text-green-700 dark:text-green-400 mb-1">Completed By</p>
                    <p className="text-slate-800 dark:text-slate-200">
                      {schedule.completedBy?.name ?? "—"}
                      {schedule.completedByPlant && (
                        <span className="ml-2 text-slate-500 dark:text-slate-400">({schedule.completedByPlant.name})</span>
                      )}
                    </p>
                  </div>
                )}

                {schedule.deliveredBy && (
                  <div className="mb-3 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-sm dark:border-blue-800 dark:bg-blue-900/20">
                    <p className="text-xs font-semibold uppercase tracking-wide text-blue-700 dark:text-blue-400 mb-1">Delivered & Confirmed By</p>
                    <p className="text-slate-800 dark:text-slate-200">
                      {schedule.deliveredBy.name}
                      {schedule.deliveredAt && (
                        <span className="ml-2 text-slate-500 dark:text-slate-400">
                          on {new Date(schedule.deliveredAt).toLocaleDateString('en-GB', { year: 'numeric', month: '2-digit', day: '2-digit' })}
                        </span>
                      )}
                    </p>
                  </div>
                )}

                <div className="grid gap-3 text-sm sm:grid-cols-4">
                  <div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Schedule Date</p>
                    <p className="font-semibold text-slate-900 dark:text-slate-100">{fmtDate(schedule.scheduleDate)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Delivery Date</p>
                    <p className="font-semibold text-slate-900 dark:text-slate-100">{fmtDate(schedule.orderDeliveryDate)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Quantity</p>
                    <p className="font-semibold text-slate-900 dark:text-slate-100">{schedule.quantity}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Unit Price</p>
                    <p className="font-semibold text-slate-900 dark:text-slate-100">₹{schedule.unitPrice.toFixed(2)}</p>
                  </div>
                </div>

                <div className="mt-3 rounded-lg border border-slate-300 bg-white p-3 dark:border-slate-600 dark:bg-slate-900">
                  <div className="grid gap-2 sm:grid-cols-3">
                    <div>
                      <p className="text-xs text-slate-500 dark:text-slate-400">Subtotal</p>
                      <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                        ₹{(schedule.quantity * schedule.unitPrice).toFixed(2)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 dark:text-slate-400">GST (18%)</p>
                      <p className="text-sm font-semibold text-orange-600 dark:text-orange-400">
                        ₹{(schedule.quantity * schedule.unitPrice * 0.18).toFixed(2)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 dark:text-slate-400">Total</p>
                      <p className="text-sm font-semibold text-green-700 dark:text-green-400">
                        ₹{(schedule.quantity * schedule.unitPrice * 1.18).toFixed(2)}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    onClick={() => printBill(schedule)}
                    className="inline-flex items-center gap-1 rounded-lg border border-blue-300 bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-100 dark:border-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                  >
                    <Printer className="h-4 w-4" />
                    Reprint Bill
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
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
