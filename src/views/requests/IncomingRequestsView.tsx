"use client";

import { useState, useEffect } from "react";
import { Loader2, CheckCircle, XCircle, Clock } from "lucide-react";
import { toast } from "react-hot-toast";
import { formatDate } from "@/utils/dateTimeFormat";

type Request = {
  id: string;
  toolName: string;
  componentName: string;
  componentCode: string;
  productionQuantity: number;
  fromDate: string;
  toDate: string;
  machineNumber: string;
  machineCode: string;
  storeCode: string;
  storeName: string;
  status: string;
  createdAt: string;
};

type Props = {
  defaultStoreId: string;
};

export function IncomingRequestsView({ defaultStoreId }: Props) {
  const [requests, setRequests] = useState<Request[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRequests();
  }, [defaultStoreId]);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/requests/incoming?storeId=${defaultStoreId}`);
      const data = await res.json();

      if (data.success) {
        setRequests(data.data);
      } else {
        toast.error("Failed to fetch requests");
      }
    } catch (error) {
      console.error("Error fetching requests:", error);
      toast.error("Failed to fetch requests");
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      PENDING: { icon: Clock, color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400" },
      APPROVED: { icon: CheckCircle, color: "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400" },
      REJECTED: { icon: XCircle, color: "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400" },
      COMPLETED: { icon: CheckCircle, color: "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400" },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.PENDING;
    const Icon = config.icon;

    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
        <Icon className="h-3 w-3" />
        {status}
      </span>
    );
  };

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
          Incoming Requests
        </h1>
        <p className="mt-2 text-slate-600 dark:text-slate-400">
          View and manage tool requests sent to the main store
        </p>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-700/50">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900 dark:text-slate-100">
                  Store
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900 dark:text-slate-100">
                  Component
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900 dark:text-slate-100">
                  Tool
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900 dark:text-slate-100">
                  Quantity
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900 dark:text-slate-100">
                  Date Range
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900 dark:text-slate-100">
                  Machine
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900 dark:text-slate-100">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900 dark:text-slate-100">
                  Date
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-6 py-8 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
                      <span className="text-sm text-slate-500 dark:text-slate-400">
                        Loading requests...
                      </span>
                    </div>
                  </td>
                </tr>
              ) : requests.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-8 text-center text-slate-500 dark:text-slate-400 text-sm">
                    No incoming requests
                  </td>
                </tr>
              ) : (
                requests.map((request) => (
                  <tr key={request.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30">
                    <td className="px-6 py-4 text-sm">
                      <div>
                        <div className="font-medium text-slate-900 dark:text-slate-100">
                          {request.storeName}
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">
                          {request.storeCode}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <div>
                        <div className="font-medium text-slate-900 dark:text-slate-100">
                          {request.componentName}
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">
                          {request.componentCode}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-900 dark:text-slate-100">
                      {request.toolName}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-900 dark:text-slate-100">
                      {request.productionQuantity}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">
                      <div className="text-xs">
                        <div>{formatDate(request.fromDate)}</div>
                        <div>to {formatDate(request.toDate)}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <div>
                        <div className="text-slate-900 dark:text-slate-100">
                          {request.machineNumber}
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">
                          {request.machineCode}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      {getStatusBadge(request.status)}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">
                      {formatDate(request.createdAt)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
