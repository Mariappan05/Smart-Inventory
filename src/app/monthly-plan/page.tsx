import { AppShell } from "@/components/layout/AppShell";
import { MonthlyScheduleView } from "@/views/monthly-plan/MonthlyScheduleView";
import { cookies } from "next/headers";
import { verifyAuthToken } from "@/lib/auth/jwt";
import { authCookieName } from "@/lib/auth/session";

export const metadata = {
  title: "Monthly Plan - Smart Inventory",
  description: "Manage tentative and final monthly schedules",
};

export default async function MonthlyPlanPage() {
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

  // Check if user has access (Admin, Admin Manager, Store Manager only)
  if (!token || !["ADMIN", "ADMIN_MANAGER", "STORE_MANAGER"].includes(userRole || "")) {
    return (
      <AppShell>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-center">
            <h2 className="text-lg font-semibold text-red-900">Access Denied</h2>
            <p className="mt-2 text-sm text-red-800">
              You do not have permission to access the Monthly Plan page.
            </p>
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <MonthlyScheduleView />
    </AppShell>
  );
}
