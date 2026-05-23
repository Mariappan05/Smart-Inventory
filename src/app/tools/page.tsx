import { AppShell } from "@/components/layout/AppShell";
import { ToolEntryView } from "@/views/tools/ToolEntryView";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { verifyAuthToken } from "@/lib/auth/jwt";
import { authCookieName } from "@/lib/auth/session";

export const metadata = {
  title: "Tool Entry - Smart Inventory",
  description: "Add and manage tools for products",
};

export default async function ToolEntryPage() {
  // Get auth token from cookies
  const cookieStore = await cookies();
  const token = cookieStore.get(authCookieName)?.value;

  // Verify token and get user info
  let userRole: string | null = null;
  let storeId: string | null = null;
  if (token) {
    try {
      const payload = verifyAuthToken(token);
      userRole = payload.role;
      storeId = payload.storeId || null;
      
      // If storeId is missing from token, fetch from database
      if (!storeId) {
        const dbUser = await prisma.user.findUnique({
          where: { id: payload.sub },
          select: { storeId: true }
        });
        storeId = dbUser?.storeId || null;
      }
    } catch {
      userRole = null;
      storeId = null;
    }
  }

  // Check if user has access
  if (!token || !["ADMIN", "STORE_MANAGER"].includes(userRole || "")) {
    return (
      <AppShell>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-center">
            <h2 className="text-lg font-semibold text-red-900">Access Denied</h2>
            <p className="mt-2 text-sm text-red-800">
              You do not have permission to access the Tool Entry page.
            </p>
          </div>
        </div>
      </AppShell>
    );
  }

  // Check if user has store assigned (Admin can access without store assignment)
  if (!storeId && userRole !== "ADMIN") {
    return (
      <AppShell>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-center">
            <h2 className="text-lg font-semibold text-red-900">Store Not Assigned</h2>
            <p className="mt-2 text-sm text-red-800">
              You are not assigned to any store. Please contact administrator.
            </p>
          </div>
        </div>
      </AppShell>
    );
  }

  // Fetch items/components filtered by user's store (Admin sees all stores)
  const items = await prisma.item.findMany({
    where: userRole === "ADMIN" ? {} : {
      storeId
    },
    select: {
      id: true,
      name: true,
      itemCode: true,
      variant: true,
      description: true,
      supplier: {
        select: {
          id: true,
          name: true,
        },
      },
    },
    orderBy: { name: "asc" },
  });

  return (
    <AppShell>
      <ToolEntryView items={items} />
    </AppShell>
  );
}
