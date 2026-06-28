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
  productHistory: "Product History Report",
  schedule: "Schedule Report",
  request: "Request Report",
};

export function ReportViews() {
  const [type, setType] = useState<ReportType>("productHistory");
  const [search, setSearch] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<ReportResponse["data"] | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);


  // Lists for dropdown filters
  const [stores, setStores] = useState<any[]>([]);

  // Specific Filters
  const [selectedStore, setSelectedStore] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [supplierName, setSupplierName] = useState("");
  const [componentName, setComponentName] = useState("");
  const [componentCode, setComponentCode] = useState("");
  const [productName, setProductName] = useState("");
  const [planNumber, setPlanNumber] = useState("");
  const [status, setStatus] = useState("");
  const [userName, setUserName] = useState("");
  const [machineName, setMachineName] = useState("");

  // Sort State
  const [sortField, setSortField] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  // Fetch stores list
  useEffect(() => {
    fetch("/api/stores")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.data)) {
          setStores(data.data);
        }
      })
      .catch((err) => console.error("Error loading stores:", err));
  }, []);

  const query = useMemo(() => {
    const params = new URLSearchParams();
    params.set("type", type);
    params.set("page", String(page));
    params.set("pageSize", String(pageSize));
    if (search) params.set("search", search);
    if (startDate) params.set("startDate", startDate);
    if (endDate) params.set("endDate", endDate);
    if (selectedStore) params.set("storeId", selectedStore);

    if (type === "productHistory") {
      if (customerName) params.set("customerName", customerName);
      if (supplierName) params.set("supplierName", supplierName);
      if (componentName) params.set("componentName", componentName);
      if (componentCode) params.set("componentCode", componentCode);
      if (productName) params.set("productName", productName);
    } else if (type === "schedule") {
      if (customerName) params.set("customerName", customerName);
      if (supplierName) params.set("supplierName", supplierName);
      if (componentName) params.set("componentName", componentName);
      if (planNumber) params.set("planNumber", planNumber);
      if (status) params.set("status", status);
    } else if (type === "request") {
      if (status) params.set("status", status);
      if (userName) params.set("userName", userName);
      if (componentName) params.set("componentName", componentName);
      if (machineName) params.set("machineName", machineName);
    }

    return params.toString();
  }, [
    type,
    search,
    startDate,
    endDate,
    page,
    pageSize,
    selectedStore,
    customerName,
    supplierName,
    componentName,
    componentCode,
    productName,
    planNumber,
    status,
    userName,
    machineName,
  ]);

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

  const handlePrint = () => {
    window.print();
  };

  // Reset page and specific filters when report type changes
  const handleTypeChange = (newType: string) => {
    setType(newType as ReportType);
    setPage(1);
    setSearch("");
    setStartDate("");
    setEndDate("");
    setSelectedStore("");
    setCustomerName("");
    setSupplierName("");
    setComponentName("");
    setComponentCode("");
    setProductName("");
    setPlanNumber("");
    setStatus("");
    setUserName("");
    setMachineName("");
    setSortField(null);
  };

  const rawColumns = report?.data?.[0] ? Object.keys(report.data[0]) : [];
  
  // Enforce specific order of table columns requested by user
  const columns = useMemo(() => {
    if (type === "productHistory") {
      return [
        "storeName",
        "storeCode",
        "customerName",
        "supplierName",
        "componentName",
        "componentCode",
        "productName",
        "productCode",
        "rawMaterialType",
        "rmSupplier",
        "rmPrice",
        "createdBy",
        "createdDate",
      ];
    } else if (type === "schedule") {
      return [
        "planNumber",
        "storeName",
        "customerName",
        "supplierName",
        "componentName",
        "componentCode",
        "toolName",
        "quantity",
        "planDate",
        "status",
        "createdBy",
        "createdDate",
      ];
    } else if (type === "request") {
      return [
        "requestNumber",
        "storeName",
        "storeCode",
        "userName",
        "componentName",
        "componentCode",
        "machineName",
        "machineCode",
        "requestedQuantity",
        "approvedQuantity",
        "status",
        "createdDate",
      ];
    }
    return rawColumns;
  }, [type, rawColumns]);

  const totalPages = report?.totalPages ?? 1;

  // Sorting logic
  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
  };

  const sortedData = useMemo(() => {
    if (!report?.data) return [];
    if (!sortField) return report.data;

    const dataCopy = [...report.data];
    dataCopy.sort((a, b) => {
      const valA = a[sortField];
      const valB = b[sortField];

      if (valA === null || valA === undefined) return 1;
      if (valB === null || valB === undefined) return -1;

      if (typeof valA === "number" && typeof valB === "number") {
        return sortOrder === "asc" ? valA - valB : valB - valA;
      }

      const strA = String(valA).toLowerCase();
      const strB = String(valB).toLowerCase();

      return sortOrder === "asc" ? strA.localeCompare(strB) : strB.localeCompare(strA);
    });

    return dataCopy;
  }, [report?.data, sortField, sortOrder]);

  const formatCellValue = (value: unknown): string => {
    if (value === null || value === undefined) return "-";
    return String(value);
  };

  const getHeaderLabel = (col: string) => {
    const labels: Record<string, string> = {
      storeName: "Store Name",
      storeCode: "Store Code",
      customerName: "Customer Name",
      supplierName: "Supplier Name",
      componentName: "Component Name",
      componentCode: "Component Code",
      productName: "Product Name",
      productCode: "Product Code",
      rawMaterialType: "Raw Material Type",
      rmSupplier: "RM Supplier",
      rmPrice: "RM Price",
      createdBy: "Created By",
      createdDate: "Created Date",
      planNumber: "Plan Number",
      toolName: "Tool Name",
      quantity: "Quantity",
      planDate: "Plan Date",
      status: "Status",
      requestNumber: "Request Number",
      userName: "User Name",
      machineName: "Machine Name",
      machineCode: "Machine Code",
      requestedQuantity: "Requested Qty",
      approvedQuantity: "Approved Qty",
    };
    return labels[col] || col.replace(/([A-Z])/g, " $1");
  };

  return (
    <div className="space-y-6 print:space-y-0">
      
      {/* Control / Filter Panel */}
      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-panel sm:p-6 dark:border-slate-700 dark:bg-slate-900/70 print:hidden">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Reports</p>
            <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">{reportLabels[type]}</h2>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">Apply column filters, date ranges, search, and export data.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button onClick={() => download("excel")} className="inline-flex items-center gap-2 rounded-xl bg-black px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-900 transition-colors">
              <Download className="h-4 w-4" /> Excel
            </button>
            <button onClick={() => download("pdf")} className="inline-flex items-center gap-2 rounded-xl bg-black px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-900 transition-colors">
              <Download className="h-4 w-4" /> PDF
            </button>
            <button onClick={handlePrint} className="inline-flex items-center gap-2 rounded-xl bg-black px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-900 transition-colors">
              <Printer className="h-4 w-4" /> Print
            </button>
          </div>
        </div>

        {/* Tab Selection */}
        <div className="mt-5 flex gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
          {Object.entries(reportLabels).map(([key, label]) => (
            <button
              key={key}
              onClick={() => handleTypeChange(key)}
              className={`rounded-xl px-4 py-2 text-xs sm:text-sm font-semibold transition-all ${
                type === key
                  ? "bg-black text-white dark:bg-white dark:text-black"
                  : "bg-slate-50 text-slate-600 hover:bg-slate-100 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Global Search and Date Range */}
        <div className="mt-4 grid gap-3 grid-cols-1 sm:grid-cols-2 md:grid-cols-4 items-end">
          
          {/* Store Filter */}
          <ModernDropdown
            label="Store"
            options={[
              { value: "", label: "All Stores" },
              ...stores.map((s) => ({ value: s.name, label: s.name })),
            ]}
            value={selectedStore}
            onChange={(val) => { setSelectedStore(String(val)); setPage(1); }}
            placeholder="Select Store..."
          />

          {/* Search Box */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-slate-500">General Search</label>
            <div className="flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-3 py-2 shadow-sm transition-all focus-within:border-black dark:border-slate-600 dark:bg-slate-800">
              <Search className="h-4 w-4 text-slate-400" />
              <input
                value={search}
                onChange={(event) => { setSearch(event.target.value); setPage(1); }}
                placeholder="Search..."
                className="w-full bg-transparent text-sm outline-none dark:text-slate-100"
              />
            </div>
          </div>

          {/* From Date */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-slate-500">From Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(event) => { setStartDate(event.target.value); setPage(1); }}
              className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm transition-all focus:border-black dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
            />
          </div>

          {/* To Date */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-slate-500">To Date</label>
            <input
              type="date"
              value={endDate}
              onChange={(event) => { setEndDate(event.target.value); setPage(1); }}
              className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm transition-all focus:border-black dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
            />
          </div>
        </div>

        {/* Advanced Filters based on active report type */}
        <div className="mt-4 border-t border-slate-100 dark:border-slate-800 pt-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Column-specific Filters</p>
          <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-5">
            
            {type === "productHistory" && (
              <>
                <input
                  type="text"
                  placeholder="Filter Customer..."
                  value={customerName}
                  onChange={(e) => { setCustomerName(e.target.value); setPage(1); }}
                  className="rounded-xl border border-slate-300 px-3 py-2 text-xs bg-white dark:border-slate-600 dark:bg-slate-800"
                />
                <input
                  type="text"
                  placeholder="Filter Supplier..."
                  value={supplierName}
                  onChange={(e) => { setSupplierName(e.target.value); setPage(1); }}
                  className="rounded-xl border border-slate-300 px-3 py-2 text-xs bg-white dark:border-slate-600 dark:bg-slate-800"
                />
                <input
                  type="text"
                  placeholder="Filter Component Name..."
                  value={componentName}
                  onChange={(e) => { setComponentName(e.target.value); setPage(1); }}
                  className="rounded-xl border border-slate-300 px-3 py-2 text-xs bg-white dark:border-slate-600 dark:bg-slate-800"
                />
                <input
                  type="text"
                  placeholder="Filter Component Code..."
                  value={componentCode}
                  onChange={(e) => { setComponentCode(e.target.value); setPage(1); }}
                  className="rounded-xl border border-slate-300 px-3 py-2 text-xs bg-white dark:border-slate-600 dark:bg-slate-800"
                />
                <input
                  type="text"
                  placeholder="Filter Product Name..."
                  value={productName}
                  onChange={(e) => { setProductName(e.target.value); setPage(1); }}
                  className="rounded-xl border border-slate-300 px-3 py-2 text-xs bg-white dark:border-slate-600 dark:bg-slate-800"
                />
              </>
            )}

            {type === "schedule" && (
              <>
                <input
                  type="text"
                  placeholder="Filter Customer..."
                  value={customerName}
                  onChange={(e) => { setCustomerName(e.target.value); setPage(1); }}
                  className="rounded-xl border border-slate-300 px-3 py-2 text-xs bg-white dark:border-slate-600 dark:bg-slate-800"
                />
                <input
                  type="text"
                  placeholder="Filter Supplier..."
                  value={supplierName}
                  onChange={(e) => { setSupplierName(e.target.value); setPage(1); }}
                  className="rounded-xl border border-slate-300 px-3 py-2 text-xs bg-white dark:border-slate-600 dark:bg-slate-800"
                />
                <input
                  type="text"
                  placeholder="Filter Component Name..."
                  value={componentName}
                  onChange={(e) => { setComponentName(e.target.value); setPage(1); }}
                  className="rounded-xl border border-slate-300 px-3 py-2 text-xs bg-white dark:border-slate-600 dark:bg-slate-800"
                />
                <input
                  type="text"
                  placeholder="Filter Plan Number..."
                  value={planNumber}
                  onChange={(e) => { setPlanNumber(e.target.value); setPage(1); }}
                  className="rounded-xl border border-slate-300 px-3 py-2 text-xs bg-white dark:border-slate-600 dark:bg-slate-800"
                />
                <ModernDropdown
                  options={[
                    { value: "", label: "All Statuses" },
                    { value: "TENTATIVE", label: "TENTATIVE" },
                    { value: "FINAL", label: "FINAL" },
                    { value: "COMPLETED", label: "COMPLETED" },
                  ]}
                  value={status}
                  onChange={(val) => { setStatus(String(val)); setPage(1); }}
                  placeholder="Filter Status..."
                />
              </>
            )}

            {type === "request" && (
              <>
                <ModernDropdown
                  options={[
                    { value: "", label: "All Statuses" },
                    { value: "PENDING", label: "PENDING" },
                    { value: "APPROVED", label: "APPROVED" },
                    { value: "REJECTED", label: "REJECTED" },
                    { value: "COMPLETED", label: "COMPLETED" },
                  ]}
                  value={status}
                  onChange={(val) => { setStatus(String(val)); setPage(1); }}
                  placeholder="Filter Status..."
                />
                <input
                  type="text"
                  placeholder="Filter User Name..."
                  value={userName}
                  onChange={(e) => { setUserName(e.target.value); setPage(1); }}
                  className="rounded-xl border border-slate-300 px-3 py-2 text-xs bg-white dark:border-slate-600 dark:bg-slate-800"
                />
                <input
                  type="text"
                  placeholder="Filter Component Name..."
                  value={componentName}
                  onChange={(e) => { setComponentName(e.target.value); setPage(1); }}
                  className="rounded-xl border border-slate-300 px-3 py-2 text-xs bg-white dark:border-slate-600 dark:bg-slate-800"
                />
                <input
                  type="text"
                  placeholder="Filter Machine Name..."
                  value={machineName}
                  onChange={(e) => { setMachineName(e.target.value); setPage(1); }}
                  className="rounded-xl border border-slate-300 px-3 py-2 text-xs bg-white dark:border-slate-600 dark:bg-slate-800"
                />
              </>
            )}

            <button
              onClick={fetchReport}
              className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-300"
            >
              <RefreshCcw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} /> Refresh
            </button>
          </div>
        </div>
      </section>

      {/* Table Section */}
      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-panel sm:p-6 dark:border-slate-700 dark:bg-slate-900/70 print:border-none print:shadow-none print:p-0">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 print:hidden">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Table</p>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Report Output Details</h3>
          </div>
          <div className="text-sm text-slate-500 dark:text-slate-400">{report?.total ?? 0} rows</div>
        </div>

        {/* Print Header */}
        <div className="hidden print:block mb-6 border-b pb-4">
          <h1 className="text-2xl font-bold">{reportLabels[type]}</h1>
          <p className="text-xs text-slate-500 mt-1">Generated at: {mounted ? new Date().toLocaleString() : ""}</p>
          <p className="text-xs text-slate-500">Total Records: {report?.total ?? 0}</p>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-700 print:border-none">
          <table className="w-full text-xs sm:text-sm text-left">
            <thead className="bg-slate-50 text-slate-600 dark:bg-slate-950/60 dark:text-slate-300 uppercase tracking-wider font-semibold">
              <tr className="border-b border-slate-200 dark:border-slate-700">
                {columns.map((column) => (
                  <th
                    key={column}
                    onClick={() => handleSort(column)}
                    className="whitespace-nowrap px-4 py-3 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 select-none"
                  >
                    <div className="flex items-center gap-1">
                      {getHeaderLabel(column)}
                      {sortField === column && (
                        <span>{sortOrder === "asc" ? "▲" : "▼"}</span>
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-800 dark:text-slate-200">
              {loading ? (
                <tr>
                  <td colSpan={columns.length} className="px-4 py-12 text-center text-slate-500 dark:text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <RefreshCcw className="h-6 w-6 animate-spin text-slate-400" />
                      Loading report data...
                    </div>
                  </td>
                </tr>
              ) : sortedData.length ? (
                sortedData.map((row, index) => (
                  <tr key={index} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20">
                    {columns.map((column) => (
                      <td key={column} className="whitespace-nowrap px-4 py-3">
                        {formatCellValue(row[column])}
                      </td>
                    ))}
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={columns.length} className="px-4 py-12 text-center text-slate-500 dark:text-slate-400">
                    No records found matching filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Panel */}
        <div className="mt-4 flex items-center justify-between gap-4 text-xs sm:text-sm text-slate-600 dark:text-slate-400 print:hidden">
          <p>Page {report?.page ?? 1} of {totalPages}</p>
          <div className="flex gap-2">
            <button
              disabled={(report?.page ?? 1) <= 1}
              onClick={() => setPage((current) => Math.max(1, current - 1))}
              className="rounded-xl border border-slate-300 px-4 py-2 hover:bg-slate-50 disabled:opacity-50 dark:border-slate-600 dark:hover:bg-slate-800"
            >
              Prev
            </button>
            <button
              disabled={(report?.page ?? 1) >= totalPages}
              onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
              className="rounded-xl border border-slate-300 px-4 py-2 hover:bg-slate-50 disabled:opacity-50 dark:border-slate-600 dark:hover:bg-slate-800"
            >
              Next
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
