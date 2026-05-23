import type { ProductStatus } from "@/types/dashboard";
import { StatusPill } from "@/components/dashboard/StatusPill";
import { Package } from "lucide-react";
import Link from "next/link";

type ProductTableProps = {
  machines: ProductStatus[];
};

export function ProductTable({ machines }: ProductTableProps) {
  return (
    <div className="rounded-3xl border border-slate-200/70 bg-white/80 p-5 shadow-panel dark:border-slate-700 dark:bg-slate-900/70">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
            Asset Health
          </p>
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Product Status</h3>
        </div>
        <Link
          href="/products"
          className="rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800"
        >
          View all
        </Link>
      </div>
      <div className="mt-4 grid gap-3">
        {machines.map((product) => (
          <Link
            key={product.id}
            href={`/products/${product.id}`}
            className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-100 bg-white px-4 py-3 transition hover:border-slate-200 hover:shadow-sm dark:border-slate-700 dark:bg-slate-800/50 dark:hover:border-slate-600"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-lg bg-slate-100 dark:bg-slate-700">
                {product.imageUrl ? (
                  <img src={product.imageUrl} alt={product.name} className="h-full w-full object-cover" />
                ) : (
                  <Package className="h-5 w-5 text-slate-400" />
                )}
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{product.name}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">{product.location}</p>
              </div>
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400">
              <p>Last service</p>
              <p className="font-semibold text-slate-700 dark:text-slate-300">{product.lastService || "-"}</p>
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400">
              <p>Uptime</p>
              <p className="font-semibold text-slate-700 dark:text-slate-300">{product.uptime || "-"}</p>
            </div>
            <StatusPill status={product.status} />
          </Link>
        ))}
      </div>
    </div>
  );
}
