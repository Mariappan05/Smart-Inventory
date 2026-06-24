"use client";

import { useEffect, useState } from "react";
import { Loader2, Trash2, Eye, EyeOff, Printer, X, Check } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

interface Schedule {
  id: string;
  customerName: string;
  componentName: string;
  componentCode: string;
  quantity: number;
  createdAt: string;
  scheduleType: string;
  status: string;
  supplierBillNumber: string | null;
  unitPrice: number;
  totalPrice: number;
  gstAmount: number;
  totalWithGst: number;
  notes: string | null;
  supplier?: {
    id: string;
    name: string;
    code: string;
    address: string | null;
  } | null;
  item?: {
    id: string;
    name: string;
    itemCode: string | null;
  } | null;
  store?: {
    id: string;
    name: string;
    code: string;
  } | null;
}

interface ScheduleGroup {
  scheduleNo: string;
  customerName: string;
  supplierName: string;
  supplierCode: string;
  supplierAddress: string;
  createdAt: string;
  status: string;
  poRef: string;
  storeCode: string;
  items: Array<{
    id: string;
    toolName: string;
    toolCode: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    gstAmount: number;
    totalWithGst: number;
    componentName: string;
    componentCode: string;
  }>;
}

interface FinalScheduleViewProps {
  refreshKey: number;
}

// Group schedules by supplierBillNumber (Schedule No)
const groupSchedules = (rawSchedules: Schedule[]): ScheduleGroup[] => {
  const groups: Record<string, ScheduleGroup> = {};
  
  rawSchedules.forEach((s) => {
    const groupKey = s.supplierBillNumber || s.id;
    
    if (!groups[groupKey]) {
      let poRef = "-1500007";
      if (s.notes && s.notes.includes("P.O. Ref:")) {
        poRef = s.notes.replace("P.O. Ref:", "").trim();
      }

      groups[groupKey] = {
        scheduleNo: groupKey,
        customerName: s.customerName || "AUTOTECH INDUSTRIES (INDIA) PRIVATE LIMITED",
        supplierName: s.supplier?.name || "Unknown Supplier",
        supplierCode: s.supplier?.code || "UNKNOWN",
        supplierAddress: s.supplier?.address || "AMBATTUR INDUSTRIAL ESTATE",
        createdAt: s.createdAt,
        status: s.status,
        poRef,
        storeCode: s.store?.code || "SP114",
        items: [],
      };
    }
    
    groups[groupKey].items.push({
      id: s.id,
      toolName: s.item?.name || s.componentName || "Unknown Tool",
      toolCode: s.item?.itemCode || s.componentCode || "N/A",
      quantity: s.quantity,
      unitPrice: s.unitPrice || 0,
      totalPrice: s.totalPrice || 0,
      gstAmount: s.gstAmount || 0,
      totalWithGst: s.totalWithGst || 0,
      componentName: s.componentName,
      componentCode: s.componentCode,
    });
  });
  
  return Object.values(groups);
};

export function FinalScheduleView({ refreshKey }: FinalScheduleViewProps) {
  const { toast } = useToast();
  const [rawSchedules, setRawSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFinalPlans, setShowFinalPlans] = useState(true);
  const [previewGroup, setPreviewGroup] = useState<ScheduleGroup | null>(null);
  const [printGroup, setPrintGroup] = useState<ScheduleGroup | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchSchedules = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/monthly-schedule?type=FINAL_MONTHLY");
      if (!response.ok) throw new Error("Failed to fetch schedules");
      const data = await response.json();
      setRawSchedules(data.schedules || []);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch schedules",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSchedules();
  }, [refreshKey]);

  const handleDeleteGroup = async (group: ScheduleGroup) => {
    if (!confirm(`Are you sure you want to delete the schedule ${group.scheduleNo}?`)) return;
    
    try {
      setDeleting(true);
      for (const item of group.items) {
        const response = await fetch(`/api/monthly-schedule/${item.id}`, {
          method: "DELETE",
        });
        if (!response.ok) throw new Error(`Failed to delete item ${item.toolName}`);
      }
      
      toast({
        title: "Success",
        description: "Schedule deleted successfully",
      });
      fetchSchedules();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete schedule",
        variant: "destructive",
      });
    } finally {
      setDeleting(false);
    }
  };

  const handlePrint = (group: ScheduleGroup) => {
    setPrintGroup(group);
    setTimeout(() => {
      window.print();
      setPrintGroup(null);
    }, 200);
  };

  const scheduleGroups = groupSchedules(rawSchedules);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* CSS print-specific style overrides */}
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          body * {
            visibility: hidden;
          }
          #print-area, #print-area * {
            visibility: visible;
          }
          #print-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            background: white;
            color: black;
          }
        }
      ` }} />

      {/* Hidden Print Container */}
      {printGroup && (
        <div id="print-area" className="hidden print:block p-8">
          <PrintSheet group={printGroup} />
        </div>
      )}

      <div className="rounded-lg border border-slate-200 bg-white/50 p-4 dark:border-slate-700 dark:bg-slate-900/50">
        <p className="text-sm text-slate-600 dark:text-slate-400">
          {scheduleGroups.length === 0
            ? "No final plans available. Create and confirm plans in the Tentative Plan tab."
            : `${scheduleGroups.length} supplier schedule(s) currently finalized`}
        </p>
      </div>

      {/* Schedules Table */}
      <div className="rounded-lg border border-slate-200 dark:border-slate-700 overflow-x-auto">
        <div className="border-b border-slate-200 bg-slate-50 px-6 py-3 dark:border-slate-700 dark:bg-slate-800/50 flex justify-between items-center">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
            Final Plans ({scheduleGroups.length})
          </h2>
          <button
            onClick={() => setShowFinalPlans(!showFinalPlans)}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 text-sm font-medium transition-colors"
            title={showFinalPlans ? "Hide Final Plans" : "View Final Plans"}
          >
            {showFinalPlans ? (
              <>
                <EyeOff className="h-4 w-4" />
                Hide Final Plans
              </>
            ) : (
              <>
                <Eye className="h-4 w-4" />
                View Final Plans
              </>
            )}
          </button>
        </div>

        {showFinalPlans && (
          <table className="w-full text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800/50">
              <tr>
                <th className="px-6 py-3 text-left font-semibold text-slate-900 dark:text-slate-100">
                  Schedule No
                </th>
                <th className="px-6 py-3 text-left font-semibold text-slate-900 dark:text-slate-100">
                  Supplier Name
                </th>
                <th className="px-6 py-3 text-center font-semibold text-slate-900 dark:text-slate-100 w-28">
                  Items Count
                </th>
                <th className="px-6 py-3 text-right font-semibold text-slate-900 dark:text-slate-100 w-36">
                  Grand Total
                </th>
                <th className="px-6 py-3 text-left font-semibold text-slate-900 dark:text-slate-100 w-36">
                  Created At
                </th>
                <th className="px-6 py-3 text-center font-semibold text-slate-900 dark:text-slate-100 w-36">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
              {deleting ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-slate-500 dark:text-slate-400">
                    <div className="flex items-center justify-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Deleting schedule group...
                    </div>
                  </td>
                </tr>
              ) : scheduleGroups.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-slate-500 dark:text-slate-400">
                    No finalized plans available
                  </td>
                </tr>
              ) : (
                scheduleGroups.map((group) => {
                  const totalSum = group.items.reduce((sum, item) => sum + item.totalWithGst, 0);
                  return (
                    <tr key={group.scheduleNo} className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                      <td className="px-6 py-4 text-sm font-semibold text-slate-900 dark:text-slate-100">
                        {group.scheduleNo}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-900 dark:text-slate-100">
                        {group.supplierName}
                      </td>
                      <td className="px-6 py-4 text-sm text-center text-slate-600 dark:text-slate-400">
                        {group.items.length} item{group.items.length !== 1 ? "s" : ""}
                      </td>
                      <td className="px-6 py-4 text-sm text-right font-mono font-medium text-blue-600 dark:text-blue-400">
                        ₹{totalSum.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">
                        {new Date(group.createdAt).toLocaleDateString("en-GB", {
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric",
                        })}
                      </td>
                      <td className="px-6 py-4 text-sm text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => setPreviewGroup(group)}
                            title="Preview PDF Layout"
                            className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-blue-600 dark:text-blue-400"
                          >
                            <Eye className="h-4.5 w-4.5" />
                          </button>
                          <button
                            onClick={() => handlePrint(group)}
                            title="Print Bill"
                            className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-green-600 dark:text-green-400"
                          >
                            <Printer className="h-4.5 w-4.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteGroup(group)}
                            title="Delete Schedule"
                            className="p-1.5 rounded hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400"
                          >
                            <Trash2 className="h-4.5 w-4.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        )}
        {!showFinalPlans && (
          <div className="px-6 py-8 text-center text-slate-500 dark:text-slate-400">
            Click 'View Final Plans' to see all plans
          </div>
        )}
      </div>

      {/* Bill Preview Modal */}
      {previewGroup && (
        <div className="fixed inset-0 z-50 flex flex-col bg-slate-900/60 backdrop-blur-sm overflow-y-auto p-4 md:p-6">
          <div className="bg-white dark:bg-slate-900 rounded-xl max-w-[900px] w-full mx-auto shadow-2xl flex flex-col min-h-[90vh]">
            {/* Header */}
            <div className="flex justify-between items-center px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900">
              <div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">Confirmed Bill/Schedule</h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                  Schedule No: <span className="font-mono font-semibold">{previewGroup.scheduleNo}</span>
                </p>
              </div>
              <button
                onClick={() => setPreviewGroup(null)}
                className="p-2 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Content Body */}
            <div className="flex-1 p-6 overflow-y-auto max-h-[calc(90vh-140px)] flex flex-col space-y-6">
              <div className="border border-slate-300 dark:border-slate-700 bg-white p-8 shadow-sm max-w-[700px] w-full mx-auto">
                <PrintSheet group={previewGroup} />
              </div>

              {/* Calculations Summary Card */}
              <div className="bg-slate-50 dark:bg-slate-800/50 p-5 rounded-lg border border-slate-200 dark:border-slate-700 max-w-[700px] w-full mx-auto">
                <h4 className="font-semibold text-slate-900 dark:text-white text-sm mb-3">
                  Billing Calculations Summary
                </h4>
                <div className="space-y-3 text-xs md:text-sm">
                  <div className="space-y-2 max-h-[150px] overflow-y-auto pr-2">
                    {previewGroup.items.map((item, idx) => (
                      <div key={idx} className="flex justify-between font-mono text-slate-600 dark:text-slate-400">
                        <span>
                          {item.toolName} ({item.quantity} NOS &times; ₹{item.unitPrice.toFixed(2)})
                        </span>
                        <span>₹{item.totalPrice.toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                  <div className="border-t border-slate-200 dark:border-slate-700 pt-3 space-y-1.5 font-sans">
                    <div className="flex justify-between text-slate-600 dark:text-slate-400">
                      <span>Subtotal</span>
                      <span className="font-mono">₹{previewGroup.items.reduce((sum, i) => sum + i.totalPrice, 0).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-slate-600 dark:text-slate-400">
                      <span>GST (18%)</span>
                      <span className="font-mono">₹{previewGroup.items.reduce((sum, i) => sum + i.gstAmount, 0).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between font-bold text-base text-blue-600 dark:text-blue-400 pt-2 border-t border-dashed border-slate-200 dark:border-slate-700">
                      <span>Grand Total (incl. GST)</span>
                      <span className="font-mono">
                        ₹{previewGroup.items.reduce((sum, i) => sum + i.totalWithGst, 0).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 flex justify-end gap-3 rounded-b-xl">
              <button
                onClick={() => setPreviewGroup(null)}
                className="rounded-lg border border-slate-300 px-5 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700 font-medium"
              >
                Close
              </button>
              <button
                onClick={() => handlePrint(previewGroup)}
                className="inline-flex items-center gap-2 rounded-lg bg-black px-6 py-2 text-sm text-white hover:bg-gray-900 transition-colors font-medium dark:bg-slate-950 dark:hover:bg-black"
              >
                <Printer className="h-4 w-4" />
                Print Bill
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Print Sheet Component matching PDF Format
function PrintSheet({ group }: { group: ScheduleGroup }) {
  const monthYearStr = (() => {
    try {
      const d = new Date(group.createdAt);
      return `${d.toLocaleString('default', { month: 'short' }).toUpperCase()}'${d.getFullYear().toString().slice(-2)}`;
    } catch {
      return "MAY'26";
    }
  })();

  const fullMonthStr = (() => {
    try {
      return new Date(group.createdAt).toLocaleString('default', { month: 'long' }).toUpperCase();
    } catch {
      return "MAY";
    }
  })();

  const yearNum = (() => {
    try {
      return new Date(group.createdAt).getFullYear();
    } catch {
      return 2026;
    }
  })();

  return (
    <div className="bg-white text-slate-850 font-sans text-[11px] leading-relaxed select-none w-full print:p-0">
      
      {/* Autotech Letterhead */}
      <div className="flex justify-between border-b border-slate-400 pb-4 mb-5">
        <div className="space-y-1">
          <p className="text-[10px] text-slate-500 font-mono">PM/SCH/{yearNum - 1}-{yearNum}</p>
          <p className="text-[10px] font-bold text-slate-800">GSTIN: 33AABCA9902B1Z9</p>
          <p className="text-[10px] font-bold text-slate-800">CIN: U29309TN1997PTC039348</p>
        </div>
        <div className="text-right text-slate-900">
          <h2 className="text-[12px] font-bold tracking-wide uppercase">
            AUTOTECH INDUSTRIES (INDIA) PRIVATE LIMITED
          </h2>
          <p className="text-[10px] text-slate-700">SP114,</p>
          <p className="text-[10px] text-slate-700">AMBATTUR INDUSTRIAL ESTATE</p>
          <p className="text-[10px] text-slate-700">CHENNAI</p>
          <p className="text-[10px] text-slate-700">Phone:2688 0151, 2688 0329</p>
          <p className="text-[9px] text-blue-600 font-mono">WWW.AUTOTECHINDUSTRIES.COM</p>
        </div>
      </div>

      {/* Supplier & Reference Info */}
      <div className="grid grid-cols-2 gap-4 mb-5 text-slate-900">
        <div>
          <p className="font-bold uppercase text-slate-950">TO</p>
          <p className="font-bold text-[11px]">M/s. {group.supplierName},</p>
          <p className="text-slate-700 uppercase">DP NO.120A,(SP),,</p>
          <p className="text-slate-700 uppercase">AMBATTUR INDUSTRIAL ESTATE,,</p>
          <p className="text-slate-700 uppercase">CHENNAI-600058,</p>
          <p className="text-slate-700 font-mono">600058</p>
        </div>
        <div className="text-right space-y-1">
          <p><span className="font-bold">P.O. Ref. :</span> {group.poRef}</p>
          <p>
            <span className="font-bold">Schedule No. :</span> {group.scheduleNo}
          </p>
          <p>
            <span className="font-bold">Date :</span> {new Date(group.createdAt).toLocaleDateString("en-GB")}
          </p>
          <p><span className="font-bold">Date :</span> {new Date(group.createdAt).toLocaleDateString("en-GB")}</p>
        </div>
      </div>

      {/* Subject */}
      <div className="border-y border-slate-400 py-2 mb-5 text-center font-bold text-slate-950 uppercase tracking-wider bg-slate-50">
        SUB : SCHEDULE FOR THE MONTH OF {monthYearStr}
      </div>

      <p className="mb-3 text-slate-900">Dear Sir,</p>
      <p className="mb-5 text-slate-900">
        WE GIVE BELOW OUR SCHEDULE FOR THE MONTH OF {fullMonthStr} &nbsp;&nbsp;&nbsp;&nbsp; PLEASE STRICTLY ADHERE THE CONDITION MENTIONED BELOW
      </p>

      <h3 className="text-center font-bold text-slate-950 tracking-wider mb-3 uppercase">
        CONFIRMED SCHEDULE
      </h3>

      {/* Table */}
      <table className="w-full border-collapse border border-slate-400 text-[10px] mb-6 text-slate-900">
        <thead>
          <tr className="bg-slate-50/60">
            <th className="border border-slate-400 px-3 py-2 text-center w-16 font-bold">S.NO</th>
            <th className="border border-slate-400 px-4 py-2 text-left font-bold">ITEM</th>
            <th className="border border-slate-400 px-4 py-2 text-center w-32 font-bold">{monthYearStr}</th>
          </tr>
        </thead>
        <tbody>
          {group.items.map((item, idx) => (
            <tr key={idx} className="hover:bg-slate-50/30">
              <td className="border border-slate-400 px-3 py-2 text-center font-mono">{idx + 1}</td>
              <td className="border border-slate-400 px-4 py-2 font-mono">{item.toolName}</td>
              <td className="border border-slate-400 px-4 py-2 text-center font-bold font-mono">{item.quantity} NOS</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Standard Notes & Signatures */}
      <div className="space-y-3 text-[9px] text-slate-700 leading-relaxed border-t border-slate-300 pt-3">
        <p className="font-bold text-slate-900 uppercase">
          THIS SCHEDULE SUPERCEDES ALL THE EARLIER SCHEDULES. Kindly note to FOLLOW the DATES of delivery STRICTLY.
        </p>
        <p>
          <span className="font-bold text-slate-900">NOTE :</span> Kindly complete the scheduled work before &nbsp;
          <span className="font-bold text-slate-900">30 {fullMonthStr} {yearNum}</span>&nbsp; of every month. We will appreciate your confirmation by return fax and look forward to receive despatch plan at the earliest.
        </p>
        <p>
          Kindly note to submit your bills and materials at our &nbsp;
          <span className="font-bold text-slate-900">F5, AMBATTUR INDUSTRIAL ESTATE AMBATTUR CHENNAI 600058</span>.
        </p>
        <p>
          Bills should be in the name of Autotech Industries(India) Pvt. Ltd., SP-114, Ambattur Industrial Estate, Chennai-600 058.
        </p>
        <div className="flex justify-between pt-6 items-end">
          <div>
            <p className="font-bold text-slate-900 uppercase">REGARDS,</p>
            <p className="h-8"></p>
            <p className="font-bold text-slate-900 uppercase">SIGNATURE</p>
          </div>
        </div>
      </div>

      {/* Bottom running metadata */}
      <div className="flex justify-between border-t border-slate-350 mt-6 pt-1 text-[8px] text-slate-400 font-mono">
        <p>POM4255 Run By : MURALI</p>
        <p>Page 1 of 1</p>
        <p>Run On : {new Date(group.createdAt).toLocaleDateString("en-GB")} {new Date(group.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</p>
      </div>
    </div>
  );
}
