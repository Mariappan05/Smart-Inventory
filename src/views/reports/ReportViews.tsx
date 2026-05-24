"use client";

import { useEffect, useMemo, useState } from "react";
import { Download, FileText, Search, Printer, RefreshCcw } from "lucide-react";
import toast from "react-hot-toast";
import type { ReportType } from "@/types/reports";
import { ModernDropdown } from "@/components/ui/ModernDropdown";

type ReportResponse = {
  data: {
    data: Array<Record<string, string | number | null>>;
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  };
  meta: {
    title: string;
    generatedAt: string;
  };
};

const reportLabels: Record<ReportType, string> = {
  machines: "Machine Reports",
  movement: "IN/OUT Reports",
  alerts: "Security Alert Reports",
  employees: "Employee Activity Reports",
};

export function ReportViews() {
  const [type, setType] = useState<ReportType>("machines");
  const [search, setSearch] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<ReportResponse["data"] | null>(null);

  const query = useMemo(() => {
    const params = new URLSearchParams();
    params.set("type", type);
    params.set("page", String(page));
    params.set("pageSize", String(pageSize));
    if (search) params.set("search", search);
    if (startDate) params.set("startDate", startDate);
    if (endDate) params.set("endDate", endDate);
    return params.toString();
  }, [type, search, startDate, endDate, page, pageSize]);

  useEffect(() => {
    void fetchReport();
  }, [query]);

  const fetchReport = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/reports?${query}`);
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to load report");
      }
      setReport(data.data);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to load report");
    } finally {
      setLoading(false);
    }
  };

  const download = async (format: "excel" | "pdf") => {
    try {
      const response = await fetch(`/api/reports/export/${format}?${query}`);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || `Failed to export ${format}`);
      }
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${type}-report.${format === "excel" ? "xlsx" : "pdf"}`;
      link.click();
      URL.revokeObjectURL(url);
      toast.success(`Downloaded ${format.toUpperCase()} report`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Export failed");
    }
  };

  const columns = report?.data?.[0] ? Object.keys(report.data[0]) : [];
  const totalPages = report?.totalPages ?? 1;

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-panel sm:p-6 dark:border-slate-700 dark:bg-slate-900/70">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Reports</p>
            <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">{reportLabels[type]}</h2>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">Date filtering, search, pagination and exports.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button onClick={() => download("excel")} className="inline-flex items-center gap-2 rounded-2xl bg-black px-4 py-3 text-sm font-semibold text-white hover:bg-slate-900 dark:bg-slate-950 dark:hover:bg-black">
              <Download className="h-4 w-4" /> Excel
            </button>
            <button onClick={() => download("pdf")} className="inline-flex items-center gap-2 rounded-2xl border border-slate-300 px-4 py-3 text-sm font-semibold text-slate-900 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-100 dark:hover:bg-slate-800">
              <Printer className="h-4 w-4" /> PDF
            </button>
          </div>
        </div>

        <div className="mt-5 grid gap-3 lg:grid-cols-[1.1fr_1fr_1fr_1fr_auto]">
          <ModernDropdown
            searchable={false}
            clearable={false}
            options={Object.entries(reportLabels).map(([value, label]) => ({ value, label }))}
            value={type}
            onChange={(value) => { setType(value as ReportType); setPage(1); }}
            placeholder="Select report type..."
          />
          <div className="flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-3 shadow-sm transition-all duration-200 hover:border-slate-400 hover:shadow-md focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-500/10 dark:border-slate-600 dark:bg-slate-800 dark:hover:border-slate-500 dark:focus-within:border-blue-400 dark:focus-within:ring-blue-400/10">
            <Search className="h-4 w-4 text-slate-400 transition-colors dark:text-slate-500" />
            <input value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} placeholder="Search reports" className="w-full bg-transparent text-sm outline-none transition-colors dark:text-slate-100 dark:placeholder:text-slate-500" />
          </div>
          <input type="date" value={startDate} onChange={(event) => { setStartDate(event.target.value); setPage(1); }} className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm shadow-sm transition-all duration-200 hover:border-slate-400 hover:shadow-md focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:hover:border-slate-500 dark:focus:border-blue-400 dark:focus:ring-blue-400/10" />
          <input type="date" value={endDate} onChange={(event) => { setEndDate(event.target.value); setPage(1); }} className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm shadow-sm transition-all duration-200 hover:border-slate-400 hover:shadow-md focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:hover:border-slate-500 dark:focus:border-blue-400 dark:focus:ring-blue-400/10" />
          <button onClick={fetchReport} className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 px-4 py-3 text-sm font-semibold text-slate-700 shadow-sm transition-all duration-200 hover:scale-105 hover:border-slate-400 hover:bg-slate-50 hover:shadow-md dark:border-slate-600 dark:text-slate-200 dark:hover:border-slate-500 dark:hover:bg-slate-700">
            <RefreshCcw className={`h-4 w-4 transition-transform ${loading ? "animate-spin" : ""}`} /> Refresh
          </button>
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-panel sm:p-6 dark:border-slate-700 dark:bg-slate-900/70">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Table</p>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Responsive Report View</h3>
          </div>
          <div className="text-sm text-slate-500 dark:text-slate-400">{report?.total ?? 0} rows</div>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-700">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-slate-600 dark:bg-slate-950/60 dark:text-slate-300">
              <tr>
                {columns.map((column) => (
                  <th key={column} className="whitespace-nowrap px-3 sm:px-4 py-3 text-xs sm:text-sm font-semibold uppercase tracking-[0.2em]">
                    {column.replace(/([A-Z])/g, " $1")}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={Math.max(columns.length, 1)} className="px-3 sm:px-4 py-8 text-center text-xs sm:text-sm text-slate-500 dark:text-slate-400">Loading...</td>
                </tr>
              ) : report?.data?.length ? (
                report.data.map((row, index) => (
                  <tr key={index} className="border-t border-slate-200 dark:border-slate-800">
                    {columns.map((column) => (
                      <td key={column} className="whitespace-nowrap px-3 sm:px-4 py-3 text-xs sm:text-sm text-slate-700 dark:text-slate-200">
                        {String(row[column] ?? "-")}
                      </td>
                    ))}
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={Math.max(columns.length, 1)} className="px-3 sm:px-4 py-8 text-center text-xs sm:text-sm text-slate-500 dark:text-slate-400">No records found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-4 flex items-center justify-between gap-4 text-sm text-slate-600 dark:text-slate-400">
          <p>Page {report?.page ?? 1} of {totalPages}</p>
          <div className="flex gap-2">
            <button disabled={(report?.page ?? 1) <= 1} onClick={() => setPage((current) => Math.max(1, current - 1))} className="rounded-xl border border-slate-300 px-4 py-2 shadow-sm transition-all duration-200 hover:scale-105 hover:border-slate-400 hover:shadow-md disabled:scale-100 disabled:opacity-50 dark:border-slate-600 dark:hover:border-slate-500">Prev</button>
            <button disabled={(report?.page ?? 1) >= totalPages} onClick={() => setPage((current) => Math.min(totalPages, current + 1))} className="rounded-xl border border-slate-300 px-4 py-2 shadow-sm transition-all duration-200 hover:scale-105 hover:border-slate-400 hover:shadow-md disabled:scale-100 disabled:opacity-50 dark:border-slate-600 dark:hover:border-slate-500">Next</button>
          </div>
        </div>
      </section>
    </div>
  );
}
