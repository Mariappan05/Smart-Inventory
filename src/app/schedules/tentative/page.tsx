import { AppShell } from "@/components/layout/AppShell";
import { TentativeScheduleView } from "@/views/schedules/TentativeScheduleView";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { verifyAuthToken } from "@/lib/auth/jwt";
import { authCookieName } from "@/lib/auth/session";

export const metadata = {
  title: "Tentative Schedule - Smart Inventory",
  description: "Create and manage tentative schedules",
};

export default async function TentativeSchedulePage() {
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

  // Check if user has access (Admin, Store Manager)
  if (!token || !["ADMIN", "ADMIN_MANAGER", "STORE_MANAGER"].includes(userRole || "")) {
    return (
      <AppShell>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-center">
            <h2 className="text-lg font-semibold text-red-900">Access Denied</h2>
            <p className="mt-2 text-sm text-red-800">
              You do not have permission to access the Tentative Schedule page.
            </p>
          </div>
        </div>
      </AppShell>
    );
  }

  const [suppliers, types, items, stores] = await Promise.all([
    prisma.supplier.findMany({
      select: { id: true, name: true, code: true },
      orderBy: { name: "asc" },
    }),
    prisma.type.findMany({
      select: { id: true, name: true, supplierId: true },
      orderBy: { name: "asc" },
    }),
    prisma.item.findMany({
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
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);

  return (
    <AppShell>
      <TentativeScheduleView
        suppliers={suppliers}
        types={types}
        items={items}
        stores={stores}
      />
    </AppShell>
  );
}
