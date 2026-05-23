import { AppShell } from "@/components/layout/AppShell";
import { cookies } from "next/headers";
import { verifyAuthToken } from "@/lib/auth/jwt";
import { authCookieName } from "@/lib/auth/session";

export default async function SupplierSchedulePage() {
  const cookieStore = await cookies();
  const token = cookieStore.get(authCookieName)?.value;

  let userRole: string | null = null;
  if (token) {
    try {
      const payload = verifyAuthToken(token);
      userRole = payload.role;
    } catch {
      userRole = null;
    }
  }

  if (!token || !["ADMIN", "STORE_MANAGER"].includes(userRole || "")) {
    return (
      <AppShell>
        <div className="rounded-lg border border-red-200 bg-red-50 p-6 dark:border-red-900 dark:bg-red-950">
          <h1 className="text-xl font-bold text-red-900 dark:text-red-100">
            Access Denied
          </h1>
          <p className="mt-2 text-sm text-red-700 dark:text-red-200">
            You do not have permission to access this page.
          </p>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="rounded-lg border border-slate-200 bg-white/70 p-6 shadow-panel dark:border-slate-700 dark:bg-slate-900/70">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">
            Supplier Schedule
          </h1>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
            Manage tentative and final schedules for suppliers
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-4 border-b border-slate-200 dark:border-slate-700">
          <button className="px-4 py-3 font-medium border-b-2 border-blue-500 text-blue-600 dark:text-blue-400">
            Tentative Schedule
          </button>
          <button className="px-4 py-3 font-medium text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100">
            Final Schedule
          </button>
        </div>

        {/* Content Placeholder */}
        <div className="rounded-lg border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-800">
          <p className="text-slate-600 dark:text-slate-400">
            Supplier Schedule management interface
          </p>
        </div>
      </div>
    </AppShell>
  );
}
