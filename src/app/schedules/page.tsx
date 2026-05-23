import { AppShell } from "@/components/layout/AppShell";
import { ScheduleHubView } from "@/views/schedules/ScheduleHubView";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { verifyAuthToken } from "@/lib/auth/jwt";
import { authCookieName } from "@/lib/auth/session";

export const metadata = {
  title: "Schedule Management - Smart Inventory",
  description: "Manage tentative, final, and expired schedules",
};

export default async function SchedulePage() {
  // Get auth token from cookies
  const cookieStore = await cookies();
  const token = cookieStore.get(authCookieName)?.value;

  // Verify token and get user info
  let userRole: string | null = null;
  let userStoreId: string | null = null;
  
  if (token) {
    try {
      const payload = verifyAuthToken(token);
      userRole = payload.role;
      userStoreId = payload.storeId || null;
      
      // If storeId is missing from token, fetch from database
      if (!userStoreId) {
        const currentUser = await prisma.user.findUnique({
          where: { id: payload.sub },
          select: { storeId: true }
        });
        userStoreId = currentUser?.storeId || null;
      }
    } catch {
      userRole = null;
      userStoreId = null;
    }
  }

  // Check if user has access (Admin, Store Manager)
  if (!token || !["SUB_STORE_LOGIN", "ADMIN", "STORE_MANAGER"].includes(userRole || "")) {
    return (
      <AppShell>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-center">
            <h2 className="text-lg font-semibold text-red-900">Access Denied</h2>
            <p className="mt-2 text-sm text-red-800">
              You do not have permission to access the Schedule Management page.
            </p>
          </div>
        </div>
      </AppShell>
    );
  }

  if (!userStoreId) {
    return (
      <AppShell>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-6 text-center">
            <h2 className="text-lg font-semibold text-amber-900">No Store Assigned</h2>
            <p className="mt-2 text-sm text-amber-800">
              You do not have a store assigned to your account. Please contact an administrator.
            </p>
          </div>
        </div>
      </AppShell>
    );
  }

  const [suppliers, types, items, stores] = await Promise.all([
    prisma.supplier.findMany({
      where: { storeId: userStoreId },
      select: { id: true, name: true, code: true },
      orderBy: { name: "asc" },
    }),
    prisma.type.findMany({
      where: { storeId: userStoreId },
      select: { id: true, name: true, supplierId: true },
      orderBy: { name: "asc" },
    }),
    prisma.item.findMany({
      where: { storeId: userStoreId },
      select: {
        id: true,
        name: true,
        variant: true,
        itemCode: true,
        description: true,
        imagesJson: true,
        unitPrice: true,
        supplierId: true,
        typeId: true,
        stockQuantity: true,
        minimumQuantity: true,
        reorderQuantity: true,
      },
      orderBy: { name: "asc" },
    }),
    prisma.store.findMany({
      where: userStoreId ? { id: userStoreId } : {},
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);

  return (
    <AppShell>
      <ScheduleHubView
        suppliers={suppliers}
        types={types}
        items={items}
        stores={stores}
      />
    </AppShell>
  );
}
