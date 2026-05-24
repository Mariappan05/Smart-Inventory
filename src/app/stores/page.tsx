import { AppShell } from "@/components/layout/AppShell";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { verifyAuthToken } from "@/lib/auth/jwt";
import { authCookieName } from "@/lib/auth/session";
import { StoresManagementView } from "@/views/stores/StoresManagementView";

export const metadata = {
  title: "Stores - Smart Inventory",
  description: "Manage stores and locations",
};

export default async function StoresPage() {
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

  if (!token || userRole !== "ADMIN") {
    return (
      <AppShell>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-center dark:border-red-900 dark:bg-red-950">
            <h2 className="text-lg font-semibold text-red-900 dark:text-red-100">Access Denied</h2>
            <p className="mt-2 text-sm text-red-700 dark:text-red-200">
              Only Admin users can access Store Management.
            </p>
          </div>
        </div>
      </AppShell>
    );
  }

  let stores: any[] = [];
  let dbError: string | null = null;
  let nextStoreCode = "S001";

  try {
    // Get user's store only (unless global admin)
    const payload = verifyAuthToken(token!);
    let userStoreId = payload.storeId;
    let userEmail = payload.email;

    // If storeId or email is missing from token, fetch from database
    if (!userStoreId || !userEmail) {
      const currentUser = await prisma.user.findUnique({
        where: { id: payload.sub },
        select: { storeId: true, email: true }
      });
      userStoreId = userStoreId || currentUser?.storeId || null;
      userEmail = userEmail || currentUser?.email || "";
    }

    const isGlobalAdmin = userEmail === "admin@your-company.local";

    if (!userStoreId && !isGlobalAdmin) {
      return (
        <AppShell>
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-6 text-center dark:border-amber-900 dark:bg-amber-950">
              <h2 className="text-lg font-semibold text-amber-900 dark:text-amber-100">No Store Assigned</h2>
              <p className="mt-2 text-sm text-amber-700 dark:text-amber-200">You do not have a store assigned to your account. Please contact an administrator.</p>
            </div>
          </div>
        </AppShell>
      );
    }

    // Get next store code
    const lastStore = await prisma.store.findFirst({
      orderBy: { code: "desc" },
      select: { code: true },
    });

    if (lastStore && lastStore.code) {
      const match = lastStore.code.match(/S(\d+)/);
      if (match) {
        const number = parseInt(match[1], 10) + 1;
        nextStoreCode = `S${String(number).padStart(3, "0")}`;
      }
    }

    // Get only user's store (or all stores for global admin)
    stores = await prisma.store.findMany({
      where: isGlobalAdmin ? {} : (userStoreId ? { id: userStoreId } : {}),
      select: {
        id: true,
        name: true,
        code: true,
        isDefault: true,
        createdAt: true,
        updatedAt: true,
        users: {
          select: { id: true, name: true },
        },
        products: {
          select: { id: true },
        },
      },
      orderBy: { code: "asc" },
    });
  } catch (error) {
    dbError = error instanceof Error ? error.message : "Failed to load stores";
  }

  if (dbError) {
    return (
      <AppShell>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-6 text-center dark:border-amber-900 dark:bg-amber-950">
            <h2 className="text-lg font-semibold text-amber-900 dark:text-amber-100">Database Error</h2>
            <p className="mt-2 text-sm text-amber-700 dark:text-amber-200">{dbError}</p>
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <StoresManagementView stores={stores} userRole={userRole} initialStoreCode={nextStoreCode} />
    </AppShell>
  );
}
