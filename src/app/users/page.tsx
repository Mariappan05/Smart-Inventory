import { AppShell } from "@/components/layout/AppShell";
import { prisma } from "@/lib/prisma";
import { UsersView } from "@/views/users/UsersView";
import { cookies } from "next/headers";
import { verifyAuthToken } from "@/lib/auth/jwt";
import { authCookieName } from "@/lib/auth/session";

export const metadata = {
  title: "Users - Smart Inventory",
  description: "User directory and access control",
};

export default async function UsersPage() {
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

  // Check if user is Admin (only Admin can manage users)
  if (!token || userRole !== "ADMIN") {
    return (
      <AppShell>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-center">
            <h2 className="text-lg font-semibold text-red-900">Access Denied</h2>
            <p className="mt-2 text-sm text-red-800">
              Only Admin users can access User Management.
            </p>
          </div>
        </div>
      </AppShell>
    );
  }

  let users: any[] = [];
  let stores: any[] = [];
  let dbError: string | null = null;

  try {
    // Get user's storeId from token
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

    [users, stores] = await Promise.all([
      prisma.user.findMany({
        where: isGlobalAdmin ? {} : {
          storeId: userStoreId
        },
        orderBy: [{ isActive: "desc" }, { name: "asc" }],
        select: {
          id: true,
          employeeNo: true,
          name: true,
          email: true,
          role: true,
          isActive: true,
          storeId: true,
          store: {
            select: {
              id: true,
              name: true,
            },
          },
          createdAt: true,
          images: {
            select: {
              url: true,
              isPrimary: true,
            },
            orderBy: {
              isPrimary: "desc",
            },
            take: 1,
          },
        },
      }),
      prisma.store.findMany({
        where: isGlobalAdmin ? {} : (userStoreId ? { id: userStoreId } : {}),
        select: {
          id: true,
          name: true,
        },
        orderBy: { name: "asc" },
      }),
    ]);
  } catch (error) {
    dbError = error instanceof Error ? error.message : "Failed to load data";
  }

  if (dbError) {
    return (
      <AppShell>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-6 text-center max-w-md">
            <h2 className="text-lg font-semibold text-amber-900">Database Connection Error</h2>
            <p className="mt-2 text-sm text-amber-800">
              Unable to connect to the database. Please ensure the database server is running and try again.
            </p>
            <p className="mt-3 text-xs text-amber-700 font-mono break-words">
              {dbError}
            </p>
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <UsersView 
        initialUsers={users.map((user: any) => ({
          ...user,
          imageUrl: user.images?.[0]?.url || null,
        }))}
        stores={stores}
      />
    </AppShell>
  );
}
