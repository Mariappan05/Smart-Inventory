"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight, Edit2, Eye, Trash2, Search, Loader2 } from "lucide-react";
import { StatusPill } from "@/components/dashboard/StatusPill";
import { useUserRole } from "@/hooks/useUserRole";

type Product = {
  id: string;
  serial: string;
  status: "AVAILABLE" | "IN_USE" | "MAINTENANCE" | "OUT_OF_STOCK";
  supplier?: { name: string };
  type?: { name: string };
  item?: { name: string };
  plant?: { name: string };
  price?: number;
  createdAt: string;
};

type ProductListProps = {
  initialProducts?: Product[];
  onDelete?: (id: string) => void;
};

export function ProductList({ initialProducts = [], onDelete }: ProductListProps) {
  const { isAdmin } = useUserRole();
  const searchParams = useSearchParams();
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [search, setSearch] = useState(searchParams.get("search") ?? "");
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        search,
        page: page.toString(),
        pageSize: pageSize.toString(),
      });

      const response = await fetch(`/api/machines?${params}`);
      if (response.ok) {
        const result = await response.json();
        setProducts(result.data?.data || []);
        setTotal(result.data?.total || 0);
      }
    } catch (error) {
      console.error("Failed to fetch products:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [search, page]);

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this product?")) {
      try {
        const response = await fetch(`/api/machines/${id}`, { method: "DELETE" });
        if (response.ok) {
          setProducts((prev) => prev.filter((m) => m.id !== id));
          onDelete?.(id);
        }
      } catch (error) {
        console.error("Failed to delete product:", error);
      }
    }
  };

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <div className="flex-1">
          <div className="flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-3 py-2.5 shadow-sm transition-all duration-200 hover:border-slate-400 hover:shadow-md focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-500/10 dark:border-slate-600 dark:bg-slate-800 dark:hover:border-slate-500 dark:focus-within:border-blue-400 dark:focus-within:ring-blue-400/10">
            <Search className="h-4 w-4 text-slate-500 transition-colors dark:text-slate-400" />
            <input
              type="text"
              placeholder="Search products..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="flex-1 border-0 bg-transparent text-sm outline-none dark:text-slate-100"
            />
          </div>
        </div>
        {isAdmin && (
          <Link
            href="/products/new"
            className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white shadow-lg transition-all duration-200 hover:scale-105 hover:bg-slate-800 hover:shadow-xl dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200"
          >
            Add Product
          </Link>
        )}
      </div>

      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800">
              <th className="px-4 py-3 text-left font-semibold text-slate-700 dark:text-slate-300">Serial</th>
              <th className="px-4 py-3 text-left font-semibold text-slate-700 dark:text-slate-300">Item</th>
              <th className="px-4 py-3 text-left font-semibold text-slate-700 dark:text-slate-300">Type</th>
              <th className="px-4 py-3 text-left font-semibold text-slate-700 dark:text-slate-300">Supplier</th>
              <th className="px-4 py-3 text-left font-semibold text-slate-700 dark:text-slate-300">Status</th>
              <th className="px-4 py-3 text-right font-semibold text-slate-700 dark:text-slate-300">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-slate-500 dark:text-slate-400">
                  <Loader2 className="mx-auto h-5 w-5 animate-spin" />
                </td>
              </tr>
            ) : products.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-slate-500 dark:text-slate-400">
                  No products found
                </td>
              </tr>
            ) : (
              products.map((product, index) => (
                <tr key={product.id} className="stagger-item border-b border-slate-200 transition-all duration-200 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800" style={{ animationDelay: `${index * 0.05}s` }}>
                  <td className="px-4 py-3 font-medium text-slate-900 dark:text-slate-100">{product.serial}</td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{product.item?.name || "-"}</td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{product.type?.name || "-"}</td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{product.supplier?.name || "-"}</td>
                  <td className="px-4 py-3">
                    <StatusPill status={product.status} />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      <Link
                        href={`/products/${product.id}`}
                        className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-slate-600 shadow-sm transition-all duration-200 hover:scale-110 hover:border-slate-300 hover:bg-slate-50 hover:shadow-md dark:border-slate-700 dark:text-slate-400 dark:hover:border-slate-600 dark:hover:bg-slate-800"
                      >
                        <Eye className="h-4 w-4" />
                      </Link>
                      {isAdmin && (
                        <>
                          <Link
                            href={`/products/${product.id}/edit`}
                            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-slate-600 shadow-sm transition-all duration-200 hover:scale-110 hover:border-slate-300 hover:bg-slate-50 hover:shadow-md dark:border-slate-700 dark:text-slate-400 dark:hover:border-slate-600 dark:hover:bg-slate-800"
                          >
                            <Edit2 className="h-4 w-4" />
                          </Link>
                          <button
                            onClick={() => handleDelete(product.id)}
                            className="inline-flex items-center gap-1 rounded-lg border border-red-200 px-2.5 py-1.5 text-red-600 shadow-sm transition-all duration-200 hover:scale-110 hover:border-red-300 hover:bg-red-50 hover:shadow-md dark:border-red-900 dark:text-red-400 dark:hover:border-red-800 dark:hover:bg-red-950"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Page {page} of {totalPages} ({total} total)
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="inline-flex items-center gap-1 rounded-xl border border-slate-300 px-3 py-2 text-sm shadow-sm transition-all duration-200 hover:scale-105 hover:border-slate-400 hover:bg-slate-50 hover:shadow-md disabled:scale-100 disabled:opacity-50 dark:border-slate-600 dark:hover:border-slate-500 dark:hover:bg-slate-800"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="inline-flex items-center gap-1 rounded-xl border border-slate-300 px-3 py-2 text-sm shadow-sm transition-all duration-200 hover:scale-105 hover:border-slate-400 hover:bg-slate-50 hover:shadow-md disabled:scale-100 disabled:opacity-50 dark:border-slate-600 dark:hover:border-slate-500 dark:hover:bg-slate-800"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
