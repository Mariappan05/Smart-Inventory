import { AppShell } from "@/components/layout/AppShell";
import { IncomingRequestsView } from "@/views/requests/IncomingRequestsView";
import { cookies } from "next/headers";
import { verifyAuthToken } from "@/lib/auth/jwt";
import { authCookieName } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

export const metadata = {
  title: "Incoming Requests - Smart Inventory",
  description: "View and manage incoming tool requests",
};

export default async function IncomingRequestsPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get(authCookieName)?.value;

  let userRole: string | null = null;
  let storeId: string | null = null;

  if (token) {
    try {
      const payload = verifyAuthToken(token);
      userRole = payload.role;
      storeId = payload.storeId || null;

      if (!storeId) {
        const dbUser = await prisma.user.findUnique({
          where: { id: payload.sub },
          select: { storeId: true },
        });
        storeId = dbUser?.storeId || null;
      }
    } catch {
      userRole = null;
      storeId = null;
    }
  }

  // Check if user's store is the default store
  const defaultStore = await prisma.store.findFirst({
    where: { isDefault: true },
  });

  // Only allow ADMIN role users from the default store
  if (!token || userRole !== "ADMIN" || !defaultStore || storeId !== defaultStore.id) {
    return (
      <AppShell>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-center dark:border-red-900 dark:bg-red-950">
            <h2 className="text-lg font-semibold text-red-900 dark:text-red-100">Access Denied</h2>
            <p className="mt-2 text-sm text-red-800 dark:text-red-200">
              This page is only accessible to Admin users of the default store.
            </p>
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <IncomingRequestsView defaultStoreId={defaultStore.id} />
    </AppShell>
  );
}
