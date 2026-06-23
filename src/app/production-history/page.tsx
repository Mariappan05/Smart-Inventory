'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { AppShell } from '@/components/layout/AppShell';
import { ModernDropdown } from '@/components/ui/ModernDropdown';
import {
  Eye,
  EyeOff,
  Loader2,
  Package,
  Wrench,
  ClipboardList,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

/* ─────────────────────────── Types ─────────────────────────── */

interface DropdownOption {
  value: string;
  label: string;
}

interface ProductInfo {
  id: string;
  name: string;         // componentName
  itemCode: string;     // componentCode
  description: string;  // "PRODUCT_<customerName>"
  lifeDuration: string; // rawMaterialType
  variant: string;      // rmSupplier
  unitPrice: number;    // rmPrice
  storeId: string;
  store?: {
    id: string;
    name: string;
    code: string;
  };
}

interface ToolOperation {
  name: string;
  lifeSpan: number;
}

interface Tool {
  id: string;
  toolType: string;
  toolName: string;
  supplierName: string;
  supplierCode: string;
  rate: number;
  operations: ToolOperation[];
  item?: { itemCode: string; name: string };
  store?: { name: string; code: string };
}

interface Production {
  id: string;
  date: string;
  componentCode: string;
  componentName: string;
  machineName: string;
  machineCode: string;
  operation: string;
  toolName: string;
  productionQuantity: number;
  createdAt: string;
  store?: { id: string; name: string; code: string };
  createdBy?: { name: string; employeeNo?: string };
}

interface HistoryData {
  productInfo: ProductInfo | null;
  tools: Tool[];
  productions: Production[];
}

/* ─────────────────────── Helper ─────────────────────── */

function customerNameFromDescription(description: string): string {
  if (description?.startsWith('PRODUCT_')) return description.substring(8);
  return description ?? '-';
}

function fmt(date: string) {
  if (!date) return '-';
  return new Date(date).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

/* ─────────────────────── Section Toggle ─────────────────────── */

function SectionCard({
  title,
  icon: Icon,
  badge,
  children,
}: {
  title: string;
  icon: React.ElementType;
  badge?: number;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(true);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-panel dark:border-slate-700 dark:bg-slate-900/70 overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-6 py-4 bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
      >
        <div className="flex items-center gap-3">
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-slate-900 dark:bg-slate-100">
            <Icon className="h-4 w-4 text-white dark:text-slate-900" />
          </span>
          <span className="text-base font-semibold text-slate-900 dark:text-white">{title}</span>
          {badge !== undefined && (
            <span className="inline-flex items-center rounded-full bg-slate-200 dark:bg-slate-700 px-2.5 py-0.5 text-xs font-semibold text-slate-700 dark:text-slate-200">
              {badge}
            </span>
          )}
        </div>
        {open ? (
          <ChevronUp className="h-4 w-4 text-slate-400" />
        ) : (
          <ChevronDown className="h-4 w-4 text-slate-400" />
        )}
      </button>
      {open && <div className="p-6">{children}</div>}
    </div>
  );
}

/* ─────────────────────── Info Field ─────────────────────── */

function InfoField({ label, value, mono = false }: { label: string; value: string | number; mono?: boolean }) {
  return (
    <div className="space-y-1">
      <p className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-400 dark:text-slate-500">
        {label}
      </p>
      <p
        className={`text-sm font-medium text-slate-800 dark:text-slate-100 ${
          mono ? 'font-mono bg-slate-100 dark:bg-slate-800 rounded px-2 py-0.5 inline-block' : ''
        }`}
      >
        {value || '-'}
      </p>
    </div>
  );
}

/* ─────────────────────── Page ─────────────────────── */

export default function ProductionHistoryPage() {
  const router = useRouter();

  const [pageLoading, setPageLoading] = useState(true);
  const [fetchLoading, setFetchLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Component codes from Products
  const [componentOptions, setComponentOptions] = useState<DropdownOption[]>([]);
  const [selectedCode, setSelectedCode] = useState<string>('');

  // History data
  const [historyData, setHistoryData] = useState<HistoryData | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  /* ── Auth + initial load ── */
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/profile');
        if (!res.ok) { router.push('/login'); return; }
        const data = await res.json();
        if (!data.success) { router.push('/login'); return; }
        await loadComponentCodes();
      } catch {
        setError('Failed to verify authorization');
      } finally {
        setPageLoading(false);
      }
    })();
  }, [router]);

  /* ── Load component codes from Products ── */
  const loadComponentCodes = useCallback(async () => {
    try {
      const res = await fetch('/api/production-component-codes');
      if (!res.ok) throw new Error('Failed to fetch component codes');
      const data = await res.json();

      // API returns [{ value, label }] objects — use them directly
      if (data.success && Array.isArray(data.data)) {
        const options: DropdownOption[] = data.data.map(
          (item: { value: string; label: string }) => ({
            value: String(item.value),
            label: String(item.label),
          })
        );
        setComponentOptions(options);
      }
    } catch (err) {
      console.error('Error loading component codes:', err);
    }
  }, []);

  /* ── Fetch history when a code is selected ── */
  const fetchHistory = async () => {
    if (!selectedCode) {
      setError('Please select a Component Code');
      return;
    }
    setFetchLoading(true);
    setError(null);
    setHistoryData(null);
    setShowDetails(false);

    try {
      const res = await fetch(
        `/api/production-history?componentCode=${encodeURIComponent(selectedCode)}`
      );
      if (!res.ok) throw new Error('Failed to fetch production history');

      const data = await res.json();
      if (data.success) {
        setHistoryData(data.data as HistoryData);
        setShowDetails(true);
      } else {
        setError(data.error ?? 'Failed to fetch production history');
      }
    } catch (err) {
      console.error('Fetch error:', err);
      setError('Failed to fetch production history');
    } finally {
      setFetchLoading(false);
    }
  };

  const hasData =
    historyData !== null &&
    (historyData.productInfo !== null ||
      historyData.tools.length > 0 ||
      historyData.productions.length > 0);

  /* ── Derived stats ── */
  const totalQty = historyData?.productions.reduce((s, p) => s + p.productionQuantity, 0) ?? 0;

  if (pageLoading) {
    return (
      <AppShell>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="w-full space-y-6 px-4 py-8 sm:px-6 lg:px-8">

        {/* ── Header ── */}
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-panel dark:border-slate-700 dark:bg-slate-900/70">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
            Production
          </p>
          <h1 className="mt-1 text-3xl font-bold text-slate-900 dark:text-white">
            Production History
          </h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            Select a Component Code to view product details, tool information, and full production history.
          </p>
        </div>

        {/* ── Error ── */}
        {error && (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 dark:border-red-800 dark:bg-red-950/40">
            <p className="text-sm font-medium text-red-700 dark:text-red-300">{error}</p>
          </div>
        )}

        {/* ── Filter / Search Card ── */}
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-panel dark:border-slate-700 dark:bg-slate-900/70">
          <h2 className="mb-5 text-base font-semibold text-slate-900 dark:text-white">
            Component Code Selection
          </h2>

          <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
            <div className="flex-1">
              <ModernDropdown
                label="Component Code"
                required
                options={componentOptions}
                value={selectedCode}
                onChange={(v) => setSelectedCode(String(v))}
                placeholder="Select or search component code..."
                searchPlaceholder="Search component codes..."
                searchable
                clearable
              />
            </div>

            <button
              onClick={fetchHistory}
              disabled={fetchLoading || !selectedCode}
              className="inline-flex items-center gap-2 rounded-xl bg-black px-6 py-2.5 text-sm font-semibold text-white transition-all hover:bg-slate-800 disabled:opacity-50 dark:bg-slate-950 dark:hover:bg-black sm:mb-0"
            >
              {fetchLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <ClipboardList className="h-4 w-4" />
              )}
              {fetchLoading ? 'Loading...' : 'View History'}
            </button>
          </div>
        </div>

        {/* ── Hide / View Toggle ── */}
        {hasData && (
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowDetails((v) => !v)}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-900 transition-all hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-white dark:hover:bg-slate-700"
            >
              {showDetails ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              {showDetails ? 'Hide Details' : 'View Details'}
            </button>

            {/* Quick stats */}
            <div className="flex flex-wrap gap-3">
              <span className="inline-flex items-center gap-1.5 rounded-xl bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                <Wrench className="h-3.5 w-3.5" />
                {historyData?.tools.length ?? 0} Tool{historyData?.tools.length !== 1 ? 's' : ''}
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-xl bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                <ClipboardList className="h-3.5 w-3.5" />
                {historyData?.productions.length ?? 0} Record{historyData?.productions.length !== 1 ? 's' : ''}
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-xl bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                <Package className="h-3.5 w-3.5" />
                {totalQty.toLocaleString()} Total Qty
              </span>
            </div>
          </div>
        )}

        {/* ── Details Sections (shown/hidden) ── */}
        {showDetails && hasData && (
          <div className="space-y-6 animate-slide-up">

            {/* 1. Product Details */}
            {historyData?.productInfo && (
              <SectionCard title="Product Information" icon={Package}>
                <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
                  <InfoField
                    label="Component Code"
                    value={historyData.productInfo.itemCode}
                    mono
                  />
                  <InfoField
                    label="Component Name"
                    value={historyData.productInfo.name}
                  />
                  <InfoField
                    label="Customer Name"
                    value={customerNameFromDescription(historyData.productInfo.description)}
                  />
                  <InfoField
                    label="Store Name"
                    value={historyData.productInfo.store?.name ?? '-'}
                  />
                  <InfoField
                    label="Store Code"
                    value={historyData.productInfo.store?.code ?? '-'}
                    mono
                  />
                  <InfoField
                    label="Raw Material Type"
                    value={historyData.productInfo.lifeDuration}
                  />
                  <InfoField
                    label="RM Supplier"
                    value={historyData.productInfo.variant}
                  />
                  <InfoField
                    label="RM Price"
                    value={
                      historyData.productInfo.unitPrice != null
                        ? `₹${Number(historyData.productInfo.unitPrice).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`
                        : '-'
                    }
                  />
                </div>
              </SectionCard>
            )}

            {/* 2. Tool Details */}
            <SectionCard
              title="Tool Information"
              icon={Wrench}
              badge={historyData?.tools.length ?? 0}
            >
              {!historyData?.tools.length ? (
                <p className="text-center text-sm text-slate-400 dark:text-slate-500 py-8">
                  No tools linked to this component.
                </p>
              ) : (
                <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50 dark:bg-slate-800/60">
                      <tr>
                        {[
                          'Tool Type',
                          'Tool Name',
                          'Supplier Name',
                          'Supplier Code',
                          'Life Span',
                          'Tool Price',
                          'Operations',
                        ].map((col) => (
                          <th
                            key={col}
                            className="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.15em] text-slate-500 dark:text-slate-400"
                          >
                            {col}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {historyData.tools.map((tool) => {
                        const ops = Array.isArray(tool.operations) ? tool.operations : [];
                        const avgLife =
                          ops.length > 0
                            ? (ops.reduce((s, o) => s + Number(o.lifeSpan), 0) / ops.length).toFixed(0)
                            : '-';
                        const opNames = ops.map((o) => o.name).join(', ') || '-';

                        return (
                          <tr
                            key={tool.id}
                            className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                          >
                            <td className="whitespace-nowrap px-4 py-3 text-slate-700 dark:text-slate-300">
                              {tool.toolType}
                            </td>
                            <td className="whitespace-nowrap px-4 py-3 font-medium text-slate-900 dark:text-white">
                              {tool.toolName}
                            </td>
                            <td className="whitespace-nowrap px-4 py-3 text-slate-600 dark:text-slate-300">
                              {tool.supplierName}
                            </td>
                            <td className="whitespace-nowrap px-4 py-3">
                              <code className="rounded bg-slate-100 px-2 py-0.5 font-mono text-xs text-slate-800 dark:bg-slate-700 dark:text-slate-200">
                                {tool.supplierCode}
                              </code>
                            </td>
                            <td className="whitespace-nowrap px-4 py-3 text-slate-600 dark:text-slate-300">
                              {avgLife !== '-' ? `${avgLife} units (avg)` : '-'}
                            </td>
                            <td className="whitespace-nowrap px-4 py-3 font-medium text-slate-900 dark:text-white">
                              ₹{Number(tool.rate).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                            </td>
                            <td className="px-4 py-3 text-slate-600 dark:text-slate-300 max-w-[200px] truncate">
                              {opNames}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </SectionCard>

            {/* 3. Production History */}
            <SectionCard
              title="Production Details"
              icon={ClipboardList}
              badge={historyData?.productions.length ?? 0}
            >
              {!historyData?.productions.length ? (
                <p className="text-center text-sm text-slate-400 dark:text-slate-500 py-8">
                  No production records found for this component.
                </p>
              ) : (
                <>
                  {/* Summary KPIs */}
                  <div className="mb-6 grid gap-4 sm:grid-cols-2">
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/40">
                      <p className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-400 dark:text-slate-500">
                        Total Production Qty
                      </p>
                      <p className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">
                        {totalQty.toLocaleString()}
                      </p>
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/40">
                      <p className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-400 dark:text-slate-500">
                        Total Records
                      </p>
                      <p className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">
                        {historyData.productions.length.toLocaleString()}
                      </p>
                    </div>
                  </div>

                  <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700">
                    <table className="w-full text-sm">
                      <thead className="bg-slate-50 dark:bg-slate-800/60">
                        <tr>
                          {[
                            'Production Date',
                            'Store Name',
                            'Store Code',
                            'Machine Name',
                            'Machine Code',
                            'Operation',
                            'Tool Name',
                            'Qty',
                            'Created Date',
                          ].map((col) => (
                            <th
                              key={col}
                              className="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.15em] text-slate-500 dark:text-slate-400"
                            >
                              {col}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {historyData.productions.map((prod) => (
                          <tr
                            key={prod.id}
                            className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                          >
                            <td className="whitespace-nowrap px-4 py-3 text-slate-700 dark:text-slate-300">
                              {fmt(prod.date)}
                            </td>
                            <td className="whitespace-nowrap px-4 py-3 text-slate-600 dark:text-slate-300">
                              {prod.store?.name ?? '-'}
                            </td>
                            <td className="whitespace-nowrap px-4 py-3">
                              <code className="rounded bg-slate-100 px-2 py-0.5 font-mono text-xs text-slate-800 dark:bg-slate-700 dark:text-slate-200">
                                {prod.store?.code ?? '-'}
                              </code>
                            </td>
                            <td className="whitespace-nowrap px-4 py-3 text-slate-600 dark:text-slate-300">
                              {prod.machineName}
                            </td>
                            <td className="whitespace-nowrap px-4 py-3">
                              <code className="rounded bg-slate-100 px-2 py-0.5 font-mono text-xs text-slate-800 dark:bg-slate-700 dark:text-slate-200">
                                {prod.machineCode}
                              </code>
                            </td>
                            <td className="whitespace-nowrap px-4 py-3 text-slate-600 dark:text-slate-300">
                              {prod.operation}
                            </td>
                            <td className="whitespace-nowrap px-4 py-3 text-slate-600 dark:text-slate-300">
                              {prod.toolName}
                            </td>
                            <td className="whitespace-nowrap px-4 py-3 text-center font-semibold text-slate-900 dark:text-white">
                              {prod.productionQuantity.toLocaleString()}
                            </td>
                            <td className="whitespace-nowrap px-4 py-3 text-slate-500 dark:text-slate-400">
                              {fmt(prod.createdAt)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </SectionCard>
          </div>
        )}

        {/* ── No data after search ── */}
        {historyData !== null && !hasData && (
          <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center dark:border-slate-700 dark:bg-slate-900/70">
            <Package className="mx-auto mb-3 h-10 w-10 text-slate-300 dark:text-slate-600" />
            <p className="text-base font-medium text-slate-600 dark:text-slate-400">
              No records found for{' '}
              <span className="font-semibold text-slate-900 dark:text-white">{selectedCode}</span>.
            </p>
            <p className="mt-1 text-sm text-slate-400 dark:text-slate-500">
              This component may not have any product, tool, or production data yet.
            </p>
          </div>
        )}
      </div>
    </AppShell>
  );
}
