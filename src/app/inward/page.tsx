import { AppShell } from "@/components/layout/AppShell";
import { cookies } from "next/headers";
import { verifyAuthToken } from "@/lib/auth/jwt";
import { authCookieName } from "@/lib/auth/session";

export default async function InwardPage() {
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

  if (!token || !["INWARD_PERSON", "ADMIN", "STORE_MANAGER"].includes(userRole || "")) {
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
            Product Inward
          </h1>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
            Record incoming products and generate QR codes for tracking
          </p>
        </div>

        {/* Form Section */}
        <div className="rounded-lg border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-800">
          <form className="space-y-6">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              {/* Supplier Name */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Supplier Name
                </label>
                <select className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2 text-slate-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:border-slate-600 dark:bg-slate-700 dark:text-white">
                  <option>Select supplier</option>
                </select>
              </div>

              {/* Tool Name */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Tool Name
                </label>
                <select className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2 text-slate-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:border-slate-600 dark:bg-slate-700 dark:text-white">
                  <option>Select tool</option>
                </select>
              </div>

              {/* Quantity Inwarded */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Quantity Inwarded
                </label>
                <input
                  type="number"
                  min="0"
                  placeholder="Enter quantity"
                  className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2 text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
                />
              </div>

              {/* Date */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Date
                </label>
                <input
                  type="date"
                  className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2 text-slate-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
                />
              </div>
            </div>

            <div className="flex gap-3">
              <button
                type="submit"
                className="rounded-lg bg-black px-6 py-2 text-white hover:bg-slate-900 transition-colors dark:bg-slate-950 dark:hover:bg-black"
              >
                Record Inward & Generate QR
              </button>
              <button
                type="button"
                className="rounded-lg border border-slate-300 px-6 py-2 text-slate-700 hover:bg-slate-50 transition-colors dark:border-slate-600 dark:text-slate-300"
              >
                Cancel
              </button>
            </div>
          </form>

          <div className="mt-8 border-t border-slate-200 pt-8 dark:border-slate-700">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">
              Generated QR Codes
            </h3>
            <p className="text-slate-600 dark:text-slate-400">
              QR codes will be displayed here after inward records are created
            </p>
            <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {/* QR Code placeholders */}
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
