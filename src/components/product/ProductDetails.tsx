"use client";

import Link from "next/link";
import { ArrowLeft, Edit2, Trash2, QrCode, Image as ImageIcon, ArrowRightLeft, Wrench } from "lucide-react";
import { StatusPill } from "@/components/dashboard/StatusPill";
import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

type Movement = {
  id: string;
  movementType: string;
  movedAt: string;
  notes?: string | null;
  movedBy?: { name: string } | null;
};

type Maintenance = {
  id: string;
  maintenanceType: string;
  startedAt: string;
  completedAt?: string | null;
  notes?: string | null;
  performedBy?: { name: string } | null;
};

type Machine = {
  id: string;
  serial: string;
  status: string;
  supplier?: { id: string; name: string } | null;
  type?: { id: string; name: string } | null;
  item?: { id: string; name: string } | null;
  plant?: { id: string; name: string } | null;
  price?: number | null;
  createdAt: string;
  updatedAt: string;
  images?: { id: string; url: string; isPrimary: boolean }[];
  movements?: Movement[];
  maintenance?: Maintenance[];
};

import { fmtDate, fmtDateTime } from "@/utils/dateFormat";

const fmt = fmtDate;

export function ProductDetails({ product }: { product: Machine }) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);
  const [activeImage, setActiveImage] = useState(
    product.images?.find((i) => i.isPrimary)?.url ?? product.images?.[0]?.url ?? null
  );

  const handleDelete = async () => {
    if (!confirm("Delete this product? This cannot be undone.")) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/machines/${product.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete product");
      toast.success("Product deleted");
      router.push("/products");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to delete product");
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link href="/products" className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900">
          <ArrowLeft className="h-4 w-4" /> Back to Products
        </Link>
        <div className="flex flex-wrap gap-2">
          <Link href={`/qr/${product.id}/print`} className="inline-flex items-center gap-2 rounded-xl border border-slate-300 px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50">
            <QrCode className="h-4 w-4" /> QR Print
          </Link>
          <Link href={`/products/${product.id}/images`} className="inline-flex items-center gap-2 rounded-xl border border-slate-300 px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50">
            <ImageIcon className="h-4 w-4" /> Gallery
          </Link>
          <Link href={`/products/${product.id}/edit`} className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-800">
            <Edit2 className="h-4 w-4" /> Edit
          </Link>
          <button onClick={handleDelete} disabled={deleting} className="inline-flex items-center gap-2 rounded-xl border border-red-300 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50">
            <Trash2 className="h-4 w-4" /> Delete
          </button>
        </div>
      </div>

      {/* Images */}
      {product.images && product.images.length > 0 && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-900">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Product Photos</p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="flex-1 overflow-hidden rounded-xl border border-slate-200 bg-slate-50 dark:border-slate-700">
              {activeImage
                ? <img src={activeImage} alt="Product" className="h-64 w-full object-contain" />
                : <div className="flex h-64 items-center justify-center text-slate-400"><ImageIcon className="h-12 w-12" /></div>
              }
            </div>
            {product.images.length > 1 && (
              <div className="flex flex-row gap-2 sm:flex-col">
                {product.images.map((img) => (
                  <button key={img.id} onClick={() => setActiveImage(img.url)}
                    className={`h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg border-2 transition ${activeImage === img.url ? "border-slate-900" : "border-slate-200 hover:border-slate-400"}`}>
                    <img src={img.url} alt="" className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Core Details */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-900">
        <div className="mb-6 flex items-start justify-between gap-4 border-b border-slate-200 pb-6 dark:border-slate-700">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Product Details</p>
            <h1 className="text-3xl font-semibold text-slate-900 dark:text-slate-100">
              {product.item?.name || "Product"}
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Serial: <span className="font-medium text-slate-700 dark:text-slate-300">{product.serial}</span>
            </p>
          </div>
          <StatusPill status={product.status as any} />
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {[
            { label: "Supplier", value: product.supplier?.name },
            { label: "Type", value: product.type?.name },
            { label: "Item", value: product.item?.name },
            { label: "Store", value: product.plant?.name },
            { label: "Price", value: product.price != null ? `₹${Number(product.price).toFixed(2)}` : "-" },
            { label: "Created", value: fmtDateTime(product.createdAt) },
            { label: "Last Updated", value: fmtDateTime(product.updatedAt) },
          ].map(({ label, value }) => (
            <div key={label}>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">{label}</p>
              <p className="mt-1 text-sm font-medium text-slate-900 dark:text-slate-100">{value || "-"}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Movement History */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-900">
        <div className="mb-4 flex items-center gap-2">
          <ArrowRightLeft className="h-4 w-4 text-slate-500" />
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Movement History</p>
        </div>
        {!product.movements?.length ? (
          <p className="text-sm text-slate-400">No movement records found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-700">
                  <th className="pb-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Type</th>
                  <th className="pb-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Date</th>
                  <th className="pb-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">By</th>
                  <th className="pb-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {product.movements.map((m) => (
                  <tr key={m.id}>
                    <td className="py-2.5 pr-4">
                      <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${m.movementType === "CHECKOUT" ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700"}`}>
                        {m.movementType}
                      </span>
                    </td>
                    <td className="py-2.5 pr-4 text-slate-600 dark:text-slate-400">{fmtDateTime(m.movedAt)}</td>
                    <td className="py-2.5 pr-4 text-slate-600 dark:text-slate-400">{m.movedBy?.name ?? "-"}</td>
                    <td className="py-2.5 text-slate-500 dark:text-slate-400">{m.notes ?? "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Maintenance History */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-900">
        <div className="mb-4 flex items-center gap-2">
          <Wrench className="h-4 w-4 text-slate-500" />
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Maintenance History</p>
        </div>
        {!product.maintenance?.length ? (
          <p className="text-sm text-slate-400">No maintenance records found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-700">
                  <th className="pb-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Type</th>
                  <th className="pb-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Started</th>
                  <th className="pb-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Completed</th>
                  <th className="pb-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">By</th>
                  <th className="pb-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {product.maintenance.map((m) => (
                  <tr key={m.id}>
                    <td className="py-2.5 pr-4">
                      <span className="inline-flex rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-semibold text-blue-700">
                        {m.maintenanceType}
                      </span>
                    </td>
                    <td className="py-2.5 pr-4 text-slate-600 dark:text-slate-400">{fmtDateTime(m.startedAt)}</td>
                    <td className="py-2.5 pr-4 text-slate-600 dark:text-slate-400">{fmtDateTime(m.completedAt)}</td>
                    <td className="py-2.5 pr-4 text-slate-600 dark:text-slate-400">{m.performedBy?.name ?? "-"}</td>
                    <td className="py-2.5 text-slate-500 dark:text-slate-400">{m.notes ?? "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
