import { AppShell } from "@/components/layout/AppShell";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { verifyAuthToken } from "@/lib/auth/jwt";
import { authCookieName } from "@/lib/auth/session";

export const metadata = {
  title: "Maintenance - Smart Inventory",
  description: "Maintenance logs and schedules",
};

export default async function MaintenancePage() {
  // Get auth token from cookies
  const cookieStore = await cookies();
  const token = cookieStore.get(authCookieName)?.value;

  // Verify token and get user role
  let userRole: string | null = null;
  if (token) {
    try {
      const payload = verifyAuthToken(token);
      userRole = payload.role;
    } catch {
      userRole = null;
    }
  }

  // Check if user has access (Admin only)
  if (!token || userRole !== "ADMIN") {
    return (
      <AppShell>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-center">
            <h2 className="text-lg font-semibold text-red-900">Access Denied</h2>
            <p className="mt-2 text-sm text-red-800">
              You do not have permission to access the Maintenance page.
            </p>
          </div>
        </div>
      </AppShell>
    );
  }

  // TODO: Fix productMaintenanceLog model reference - model doesn't exist in schema
  const logs: any[] = [];

  return (
    <AppShell>
      <div className="space-y-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
            Operations
          </p>
          <h1 className="text-3xl font-semibold text-slate-900 dark:text-slate-100">Maintenance</h1>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-950/40">
                <th className="px-4 py-3 text-left font-semibold text-slate-700 dark:text-slate-200">
                  Product
                </th>
                <th className="px-4 py-3 text-left font-semibold text-slate-700 dark:text-slate-200">
                  Type
                </th>
                <th className="px-4 py-3 text-left font-semibold text-slate-700 dark:text-slate-200">
                  Started
                </th>
                <th className="px-4 py-3 text-left font-semibold text-slate-700 dark:text-slate-200">
                  Completed
                </th>
                <th className="px-4 py-3 text-left font-semibold text-slate-700 dark:text-slate-200">
                  Performed By
                </th>
              </tr>
            </thead>
            <tbody>
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-slate-500 dark:text-slate-400">
                    No maintenance logs found
                  </td>
                </tr>
              ) : (
                logs.map((log: any) => (
                  <tr
                    key={log.id}
                    className="border-b border-slate-200 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-white/5"
                  >
                    <td className="px-4 py-3 font-medium text-slate-900 dark:text-slate-100">
                      {log.product.item?.name ?? log.product.serial}
                      <div className="text-xs font-normal text-slate-500 dark:text-slate-400">
                        {log.product.serial}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{log.maintenanceType}</td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                      {new Date(log.startedAt).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                      {log.completedAt ? new Date(log.completedAt).toLocaleString() : "-"}
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                      {log.performedBy ? `${log.performedBy.name} (${log.performedBy.employeeNo})` : "-"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </AppShell>
  );
}
