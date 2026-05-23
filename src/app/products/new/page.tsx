"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { Loader2, Plus, Trash2, Edit2, Upload, X } from "lucide-react";
import toast from "react-hot-toast";
import * as XLSX from "xlsx";

interface Product {
  id: string;
  name: string;
  itemCode: string;
  description: string;
  createdAt: string;
}

interface ExcelRow {
  customerName: string;
  componentName: string;
  componentCode: string;
  isDuplicate?: boolean;
  duplicateReason?: string;
}

export default function NewProductPage() {
  const router = useRouter();
  const [userRole, setUserRole] = useState<string | null>(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [form, setForm] = useState({
    customerName: "",
    componentName: "",
    componentCode: "",
  });
  const [products, setProducts] = useState<Product[]>([]);
  const [excelData, setExcelData] = useState<ExcelRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingExcel, setUploadingExcel] = useState(false);
  const [duplicateWarning, setDuplicateWarning] = useState<{
    isDuplicate: boolean;
    reason?: string;
  } | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);

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
      } catch (error) {
        router.push("/login");
      } finally {
        setIsCheckingAuth(false);
      }
    };

    checkAuth();
  }, [router]);

  // Fetch products on mount
  useEffect(() => {
    if (userRole) {
      fetchProducts();
    }
  }, [userRole]);

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

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/products");
      const data = await res.json();
      
      if (data.success) {
        setProducts(data.data);
      } else {
        toast.error(data.error || "Failed to fetch products");
      }
    } catch (error) {
      console.error("Error fetching products:", error);
      toast.error("Failed to fetch products");
    } finally {
      setLoading(false);
    }
  };

  // Similarity check for column names (Levenshtein-based)
  const calculateSimilarity = (str1: string, str2: string): number => {
    const s1 = str1.toLowerCase().replace(/[\s_-]/g, "");
    const s2 = str2.toLowerCase().replace(/[\s_-]/g, "");
    
    if (s1 === s2) return 1;
    
    const longer = s1.length > s2.length ? s1 : s2;
    const shorter = s1.length > s2.length ? s2 : s1;
    
    if (longer.length === 0) return 1.0;
    
    const editDistance = getEditDistance(longer, shorter);
    return (longer.length - editDistance) / longer.length;
  };

  const getEditDistance = (s1: string, s2: string): number => {
    const costs: number[] = [];
    for (let i = 0; i <= s1.length; i++) {
      let lastValue = i;
      for (let j = 0; j <= s2.length; j++) {
        if (i === 0) {
          costs[j] = j;
        } else if (j > 0) {
          let newValue = costs[j - 1];
          if (s1.charAt(i - 1) !== s2.charAt(j - 1)) {
            newValue = Math.min(Math.min(newValue, lastValue), costs[j]) + 1;
          }
          costs[j - 1] = lastValue;
          lastValue = newValue;
        }
      }
      if (i > 0) costs[s2.length] = lastValue;
    }
    return costs[s2.length];
  };

  const findBestMatchingColumn = (headerRow: any[], targetNames: string[]): string | null => {
    const headers = Object.keys(headerRow);
    
    for (const targetName of targetNames) {
      let bestMatch = "";
      let bestScore = 0;
      
      for (const header of headers) {
        const similarity = calculateSimilarity(header, targetName);
        if (similarity > bestScore && similarity > 0.6) {
          bestScore = similarity;
          bestMatch = header;
        }
      }
      
      if (bestMatch) return bestMatch;
    }
    
    return null;
  };

  const handleExcelUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadingExcel(true);
      const reader = new FileReader();

      reader.onload = (event) => {
        try {
          const data = new Uint8Array(event.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: "array" });
          const worksheet = workbook.Sheets[workbook.SheetNames[0]];
          const rows = XLSX.utils.sheet_to_json(worksheet) as any[];

          if (rows.length === 0) {
            toast.error("Excel file is empty");
            setUploadingExcel(false);
            return;
          }

          // Find best matching columns
          const firstRow = rows[0];
          const customerNameCol = findBestMatchingColumn(firstRow, [
            "Customer Name",
            "customer name",
            "customerName",
            "Customer",
            "customer",
          ]);
          const componentNameCol = findBestMatchingColumn(firstRow, [
            "Component Name",
            "component name",
            "componentName",
            "Component",
            "component",
          ]);
          const componentCodeCol = findBestMatchingColumn(firstRow, [
            "Component Code",
            "component code",
            "componentCode",
            "Code",
            "code",
          ]);

          if (!customerNameCol || !componentNameCol || !componentCodeCol) {
            toast.error(
              "Required columns not found. Please ensure Excel has: Customer Name, Component Name, Component Code"
            );
            setUploadingExcel(false);
            return;
          }

          // Extract and validate columns
          const parsedData: ExcelRow[] = rows
            .map((row) => ({
              customerName: String(row[customerNameCol] || "").trim(),
              componentName: String(row[componentNameCol] || "").trim(),
              componentCode: String(row[componentCodeCol] || "").trim(),
            }))
            .filter((row) => row.customerName && row.componentName && row.componentCode);

          if (parsedData.length === 0) {
            toast.error("No valid data found in Excel file");
            setUploadingExcel(false);
            return;
          }

          // Validate for duplicates
          const validatedData = validateDuplicates(parsedData);
          setExcelData(validatedData);

          const duplicateCount = validatedData.filter((row) => row.isDuplicate).length;
          const validCount = validatedData.filter((row) => !row.isDuplicate).length;

          if (validCount === 0) {
            toast.error("All rows are duplicates. No valid products to create.");
          } else {
            toast.success(
              `Excel imported successfully! ${validCount} valid product${validCount > 1 ? "s" : ""}${
                duplicateCount > 0 ? ` (${duplicateCount} duplicate${duplicateCount > 1 ? "s" : ""})` : ""
              }`
            );
          }
        } catch (error) {
          console.error("Error parsing Excel:", error);
          toast.error("Failed to parse Excel file. Please check the format.");
        } finally {
          setUploadingExcel(false);
        }
      };

      reader.readAsArrayBuffer(file);
    } catch (error) {
      console.error("Error reading Excel file:", error);
      toast.error("Failed to read Excel file");
      setUploadingExcel(false);
    }
  };

  const validateDuplicates = (excelRows: ExcelRow[]): ExcelRow[] => {
    const existingCodes = new Set(products.map((p) => p.itemCode.toLowerCase()));
    const seenInExcel = new Set<string>();
    const duplicateComponents = new Map<string, number>();

    return excelRows.map((row) => {
      const code = String(row.componentCode || "").toLowerCase().trim();
      const customerNameStr = String(row.customerName || "").toLowerCase().trim();
      const componentNameStr = String(row.componentName || "").toLowerCase().trim();
      const nameKey = `${customerNameStr}_${componentNameStr}_${code}`;

      // Check if it's a duplicate in Excel file
      if (seenInExcel.has(nameKey)) {
        duplicateComponents.set(nameKey, (duplicateComponents.get(nameKey) || 1) + 1);
        return {
          ...row,
          isDuplicate: true,
          duplicateReason: "Duplicate in uploaded file",
        };
      }

      // Check if it already exists in the system
      if (existingCodes.has(code)) {
        return {
          ...row,
          isDuplicate: true,
          duplicateReason: "Already exists in system",
        };
      }

      seenInExcel.add(nameKey);
      return row;
    });
  };

  const checkManualFormDuplicate = () => {
    const code = form.componentCode.toLowerCase().trim();
    
    if (!code) {
      setDuplicateWarning(null);
      return;
    }

    // Check if code already exists in database
    const existingProduct = products.find((p) => p.itemCode.toLowerCase() === code);
    
    if (existingProduct) {
      setDuplicateWarning({
        isDuplicate: true,
        reason: `Component code already exists: ${existingProduct.name} (${existingProduct.itemCode})`,
      });
    } else {
      setDuplicateWarning(null);
    }
  };

  const createProductsFromExcel = async () => {
    const validProducts = excelData.filter((row) => !row.isDuplicate);

    if (validProducts.length === 0) {
      toast.error("No valid products to create. Please remove all duplicates.");
      return;
    }

    try {
      setSubmitting(true);
      let successCount = 0;
      let failedProducts: string[] = [];

      for (const product of validProducts) {
        try {
          const res = await fetch("/api/products", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              customerName: product.customerName,
              componentName: product.componentName,
              componentCode: product.componentCode,
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
      if (successCount === validProducts.length) {
        toast.success(`✓ Successfully created ${successCount} product${successCount > 1 ? "s" : ""}!`);
      } else if (successCount > 0) {
        toast.success(
          `Created ${successCount} product${successCount > 1 ? "s" : ""}. ${failedProducts.length} failed.`
        );
      } else {
        toast.error("Failed to create products. " + failedProducts.join(", "));
      }

      // Clear Excel data
      setExcelData([]);

      // Reset file input
      const fileInput = document.getElementById("excel-upload") as HTMLInputElement;
      if (fileInput) fileInput.value = "";
    } catch (error) {
      console.error("Error creating products:", error);
      toast.error("Failed to create products. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.customerName.trim()) {
      toast.error("Customer name is required");
      return;
    }

    if (!form.componentName.trim()) {
      toast.error("Component name is required");
      return;
    }

    if (!form.componentCode.trim()) {
      toast.error("Component code is required");
      return;
    }

    // Check for duplicates before submission
    if (duplicateWarning?.isDuplicate) {
      toast.error(`Cannot create product: ${duplicateWarning.reason}`);
      return;
    }

    try {
      setSubmitting(true);
      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (data.success) {
        toast.success("Product created successfully");
        setForm({
          customerName: "",
          componentName: "",
          componentCode: "",
        });
        setDuplicateWarning(null);
        fetchProducts();
      } else {
        toast.error(data.error || "Failed to create product");
      }
    } catch (error) {
      console.error("Error creating product:", error);
      toast.error("Failed to create product");
    } finally {
      setSubmitting(false);
    }
  };

  const extractCustomerName = (description: string) => {
    if (description.startsWith("PRODUCT_")) {
      return description.replace("PRODUCT_", "");
    }
    return description;
  };

  const handleBulkDelete = async () => {
    try {
      setSubmitting(true);
      const deletePromises = Array.from(selectedIds).map(id =>
        fetch(`/api/products/${id}`, { method: "DELETE" })
      );
      
      const results = await Promise.all(deletePromises);
      const successCount = results.filter(r => r.ok).length;
      
      if (successCount > 0) {
        toast.success(`${successCount} product(s) deleted successfully`);
        setProducts(products.filter(p => !selectedIds.has(p.id)));
        setSelectedIds(new Set());
      }
      
      if (successCount < selectedIds.size) {
        toast.error(`Failed to delete ${selectedIds.size - successCount} product(s)`);
      }
      
      setShowBulkDeleteConfirm(false);
      fetchProducts();
    } catch (error) {
      toast.error("Failed to delete products");
    } finally {
      setSubmitting(false);
    }
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === products.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(products.map(p => p.id)));
    }
  };

  const toggleSelect = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="rounded-lg border border-slate-200 bg-white/70 p-6 shadow-panel dark:border-slate-700 dark:bg-slate-900/70">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">
            New Product Entry
          </h1>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
            Add a new product to the inventory
          </p>
        </div>

        {/* Form Section */}
        <div className="rounded-lg border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-800">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              {/* Customer Name */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Customer Name
                </label>
                <input
                  type="text"
                  placeholder="Enter customer name"
                  value={form.customerName}
                  onChange={(e) =>
                    setForm({ ...form, customerName: e.target.value })
                  }
                  className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2 text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
                />
              </div>

              {/* Component Name */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Component Name
                </label>
                <input
                  type="text"
                  placeholder="Enter component name"
                  value={form.componentName}
                  onChange={(e) =>
                    setForm({ ...form, componentName: e.target.value })
                  }
                  className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2 text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
                />
              </div>

              {/* Component Code */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Component Code
                </label>
                <input
                  type="text"
                  placeholder="Enter component code"
                  value={form.componentCode}
                  onChange={(e) => {
                    setForm({ ...form, componentCode: e.target.value });
                    // Check for duplicates as user types
                    setTimeout(() => {
                      const code = e.target.value.toLowerCase().trim();
                      if (code) {
                        const existingProduct = products.find((p) => p.itemCode.toLowerCase() === code);
                        if (existingProduct) {
                          setDuplicateWarning({
                            isDuplicate: true,
                            reason: `Code already exists: ${existingProduct.name} (${existingProduct.itemCode})`,
                          });
                        } else {
                          setDuplicateWarning(null);
                        }
                      } else {
                        setDuplicateWarning(null);
                      }
                    }, 300);
                  }}
                  className={`w-full rounded-lg border px-4 py-2 text-slate-900 placeholder-slate-400 focus:ring-1 dark:bg-slate-700 dark:text-white ${
                    duplicateWarning?.isDuplicate
                      ? "border-red-500 bg-red-50 dark:bg-red-900/20 focus:border-red-500 focus:ring-red-500"
                      : "border-slate-300 bg-white focus:border-blue-500 focus:ring-blue-500 dark:border-slate-600"
                  }`}
                />
              </div>
            </div>

            {/* Duplicate Warning Alert */}
            {duplicateWarning?.isDuplicate && (
              <div className="rounded-lg border border-red-300 bg-red-50 p-4 dark:border-red-900/50 dark:bg-red-900/20">
                <div className="flex gap-3">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-red-600 dark:text-red-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-sm font-semibold text-red-800 dark:text-red-300">
                      Duplicate Product Detected
                    </h3>
                    <p className="mt-1 text-sm text-red-700 dark:text-red-400">
                      {duplicateWarning.reason}
                    </p>
                    <p className="mt-2 text-xs text-red-600 dark:text-red-500">
                      This product cannot be created as it already exists in the system.
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="flex gap-3">
              <button
                type="submit"
                disabled={submitting || duplicateWarning?.isDuplicate}
                className="rounded-lg bg-black px-6 py-2 text-white hover:bg-slate-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 dark:bg-slate-950 dark:hover:bg-black"
              >
                {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                Create Product
              </button>
              <button
                type="button"
                className="rounded-lg border border-slate-300 px-6 py-2 text-slate-700 hover:bg-slate-50 transition-colors dark:border-slate-600 dark:text-slate-300"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>

        {/* Excel Upload Section */}
        <div className="rounded-lg border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-800">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">
            Bulk Upload from Excel
          </h2>
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  id="excel-upload"
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  onChange={handleExcelUpload}
                  disabled={uploadingExcel}
                  className="hidden"
                />
                <button
                  onClick={() => document.getElementById("excel-upload")?.click()}
                  disabled={uploadingExcel}
                  className="rounded-lg bg-black px-6 py-2 text-white hover:bg-slate-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 dark:bg-slate-950 dark:hover:bg-black"
                >
                  {uploadingExcel && <Loader2 className="h-4 w-4 animate-spin" />}
                  <Upload className="h-4 w-4" />
                  Upload Excel
                </button>
              </label>
            </div>
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-900/50 rounded p-3 text-sm text-blue-800 dark:text-blue-300">
              <p className="font-medium">Excel Format Requirements:</p>
              <ul className="mt-2 list-disc list-inside space-y-1">
                <li>Columns: Customer Name, Component Name, Component Code</li>
                <li>Column names are flexible (e.g., "customer_name", "Customer_Name", etc.)</li>
                <li>Supported formats: .xlsx, .xls, .csv</li>
                <li>Duplicates will be automatically detected and excluded</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Excel Data Preview Table */}
        {excelData.length > 0 && (
          <div className="rounded-lg border border-slate-200 dark:border-slate-700 overflow-x-auto">
            <div className="p-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800">
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                  Excel Preview ({excelData.length} rows total)
                </h3>
                <button
                  onClick={() => setExcelData([])}
                  className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="flex gap-4 text-sm">
                <div className="bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 px-3 py-1 rounded">
                  Valid: {excelData.filter((r) => !r.isDuplicate).length}
                </div>
                {excelData.filter((r) => r.isDuplicate).length > 0 && (
                  <div className="bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 px-3 py-1 rounded">
                    Duplicates: {excelData.filter((r) => r.isDuplicate).length} (will not be created)
                  </div>
                )}
              </div>
            </div>
            <table className="w-full">
              <thead className="border-b border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800">
                <tr>
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
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                {excelData.map((row, index) => (
                  <tr
                    key={index}
                    className={
                      row.isDuplicate
                        ? "bg-red-50 dark:bg-red-900/20"
                        : "hover:bg-slate-50 dark:hover:bg-slate-700/50"
                    }
                  >
                    <td
                      className={`px-6 py-4 text-sm ${
                        row.isDuplicate
                          ? "text-red-700 dark:text-red-400 font-medium"
                          : "text-slate-900 dark:text-slate-100"
                      }`}
                    >
                      {row.customerName}
                    </td>
                    <td
                      className={`px-6 py-4 text-sm ${
                        row.isDuplicate
                          ? "text-red-700 dark:text-red-400 font-medium"
                          : "text-slate-900 dark:text-slate-100"
                      }`}
                    >
                      {row.componentName}
                    </td>
                    <td
                      className={`px-6 py-4 text-sm font-mono ${
                        row.isDuplicate
                          ? "text-red-700 dark:text-red-400 font-medium"
                          : "text-slate-900 dark:text-slate-100"
                      }`}
                    >
                      {row.componentCode}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      {row.isDuplicate ? (
                        <span className="inline-block px-3 py-1 rounded-full bg-red-200 text-red-800 dark:bg-red-900/40 dark:text-red-400 text-xs font-semibold">
                          {row.duplicateReason}
                        </span>
                      ) : (
                        <span className="inline-block px-3 py-1 rounded-full bg-green-200 text-green-800 dark:bg-green-900/40 dark:text-green-400 text-xs font-semibold">
                          ✓ Valid
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {excelData.filter((r) => !r.isDuplicate).length > 0 && (
              <div className="p-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 flex justify-between items-center">
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  {excelData.filter((r) => r.isDuplicate).length > 0 && (
                    <>Duplicates will be skipped. </>
                  )}
                  Ready to create {excelData.filter((r) => !r.isDuplicate).length} product{excelData.filter((r) => !r.isDuplicate).length > 1 ? "s" : ""}
                </p>
                <button
                  onClick={createProductsFromExcel}
                  disabled={submitting}
                  className="rounded-lg bg-black px-6 py-2 text-white hover:bg-slate-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 dark:bg-slate-950 dark:hover:bg-black"
                >
                  {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                  Create Products
                </button>
              </div>
            )}
          </div>
        )}
        {/* Created Products Table */}
        <div className="rounded-lg border border-slate-200 dark:border-slate-700 overflow-x-auto">
          <div className="p-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
              All Created Products ({products.length} total)
            </h2>
          </div>
          
          {selectedIds.size > 0 && (
            <div className="bg-blue-50 dark:bg-blue-900/20 px-6 py-3 flex items-center justify-between border-b border-slate-200 dark:border-slate-700">
              <span className="text-sm text-slate-700 dark:text-slate-300">
                {selectedIds.size} product(s) selected
              </span>
              <button
                onClick={() => setShowBulkDeleteConfirm(true)}
                disabled={submitting}
                className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition text-sm disabled:opacity-50"
              >
                <Trash2 className="h-4 w-4" />
                Delete Selected
              </button>
            </div>
          )}
          
          <table className="w-full">
            <thead className="border-b border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900 dark:text-slate-100">
                  <input
                    type="checkbox"
                    checked={products.length > 0 && selectedIds.size === products.length}
                    onChange={toggleSelectAll}
                    className="rounded border-slate-300 dark:border-slate-600"
                  />
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
                  <td colSpan={6} className="px-6 py-8 text-center text-slate-500 dark:text-slate-400">
                    <div className="flex items-center justify-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Loading products...
                    </div>
                  </td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-slate-500 dark:text-slate-400">
                    No products created yet
                  </td>
                </tr>
              ) : (
                products.map((product) => {
                  const isMatchingDuplicate = duplicateWarning?.isDuplicate && 
                    product.itemCode.toLowerCase() === form.componentCode.toLowerCase().trim();
                  
                  return (
                    <tr 
                      key={product.id} 
                      className={`${
                        isMatchingDuplicate
                          ? "bg-red-50 dark:bg-red-900/20"
                          : "hover:bg-slate-50 dark:hover:bg-slate-700/50"
                      }`}
                    >
                      <td className="px-6 py-4">
                        <input
                          type="checkbox"
                          checked={selectedIds.has(product.id)}
                          onChange={() => toggleSelect(product.id)}
                          className="rounded border-slate-300 dark:border-slate-600"
                        />
                      </td>
                      <td className={`px-6 py-4 text-sm ${isMatchingDuplicate ? "text-red-700 dark:text-red-400 font-semibold" : "text-slate-900 dark:text-slate-100"}`}>
                        {extractCustomerName(product.description)}
                      </td>
                      <td className={`px-6 py-4 text-sm ${isMatchingDuplicate ? "text-red-700 dark:text-red-400 font-semibold" : "text-slate-900 dark:text-slate-100"}`}>
                        {product.name}
                      </td>
                      <td className={`px-6 py-4 text-sm font-mono ${isMatchingDuplicate ? "text-red-700 dark:text-red-400 font-semibold" : "text-slate-900 dark:text-slate-100"}`}>
                        {product.itemCode}
                        {isMatchingDuplicate && (
                          <div className="mt-1 inline-block ml-2 px-2 py-1 rounded bg-red-200 text-red-800 dark:bg-red-900/40 dark:text-red-400 text-xs font-semibold">
                            ✓ DUPLICATE
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">
                        {new Date(product.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <div className="flex items-center gap-2">
                          <button className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300">
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button className="p-1 rounded hover:bg-red-200 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Bulk Delete Confirmation Modal */}
        {showBulkDeleteConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-slate-900 rounded-lg p-6 max-w-sm mx-4">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">
                Delete {selectedIds.size} Product(s)?
              </h3>
              <p className="text-slate-600 dark:text-slate-400 mb-6">
                Are you sure you want to delete {selectedIds.size} selected product(s)? This action cannot be undone.
              </p>
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setShowBulkDeleteConfirm(false)}
                  disabled={submitting}
                  className="px-4 py-2 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-slate-100 hover:bg-slate-300 dark:hover:bg-slate-600 transition disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleBulkDelete}
                  disabled={submitting}
                  className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 transition disabled:opacity-50 flex items-center gap-2"
                >
                  {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                  Delete All
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
