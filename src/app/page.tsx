import { cookies } from "next/headers";
import { getDashboardData } from "@/controllers/dashboardController";
import { DashboardView } from "@/views/dashboard/DashboardView";
import { AuthController } from "@/controllers/authController";
import { authCookieName } from "@/lib/auth/session";
import type { UserRole } from "@/lib/auth/permissions";
import { prisma } from "@/lib/prisma";
import { AppShell } from "@/components/layout/AppShell";
import { redirect } from "next/navigation";

const authController = new AuthController();

async function getCurrentUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get(authCookieName)?.value;
  if (!token) return null;

  try {
    const payload = await authController.validateSession(token);
    let storeId = payload.storeId || null;
    
    // If storeId is missing from token, fetch from database
    if (!storeId) {
      const dbUser = await prisma.user.findUnique({
        where: { id: payload.sub },
        select: { storeId: true }
      });
      storeId = dbUser?.storeId || null;
    }
    
    return {
      id: payload.sub,
      role: payload.role as UserRole,
      storeId
    };
  } catch {
    return null;
  }
}

export default async function Home() {
  const user = await getCurrentUser();
  
  if (!user) {
    redirect("/login");
  }
  
  if (!user.storeId) {
    return (
      <AppShell>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-center dark:border-red-900 dark:bg-red-950">
            <h2 className="text-lg font-semibold text-red-900 dark:text-red-100">Store Not Assigned</h2>
            <p className="mt-2 text-sm text-red-800 dark:text-red-200">
              You are not assigned to any store. Please contact your administrator to assign you to a store.
            </p>
            <p className="mt-2 text-xs text-red-700 dark:text-red-300">
              If you just assigned a store, please log out and log back in.
            </p>
          </div>
        </div>
      </AppShell>
    );
  }
  
  const data = await getDashboardData(user.storeId);

  return <DashboardView data={data} />;
}
