import { AppShell } from "@/components/layout/AppShell";
import { SuppliersView } from "@/views/suppliers/SuppliersView";
import { cookies } from "next/headers";
import { verifyAuthToken } from "@/lib/auth/jwt";
import { authCookieName } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { getStoreWhereClause } from "@/lib/storeFiltering";

export const metadata = {
  title: "Suppliers - Smart Inventory",
  description: "View and manage suppliers",
};

type Session = {
  userId: string;
  role: string;
  storeId?: string;
};

export default async function SuppliersPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get(authCookieName)?.value;

  let session: Session | null = null;
  if (token) {
    try {
      const payload = verifyAuthToken(token);
      session = {
        userId: payload.sub || "",
        role: payload.role || "EMPLOYEE",
        storeId: payload.storeId || undefined,
      };
    } catch {
      session = null;
    }
  }

  if (!token || !session) {
    return (
      <AppShell>
        <div className="rounded-lg border border-red-200 bg-red-50 p-6 dark:border-red-900 dark:bg-red-950">
          <h1 className="text-xl font-bold text-red-900 dark:text-red-100">
            Access Denied
          </h1>
          <p className="mt-2 text-sm text-red-700 dark:text-red-200">
            You must be logged in to access this page.
          </p>
        </div>
      </AppShell>
    );
  }

  try {
    // Fetch suppliers for the user's store
    const storeFilter = {
      ...(session.storeId ? { storeId: session.storeId } : {}),
    };

    const suppliers = await prisma.supplier.findMany({
      where: storeFilter,
      include: {
        _count: {
          select: { products: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return (
      <AppShell>
        <SuppliersView initialSuppliers={suppliers} />
      </AppShell>
    );
  } catch (error) {
    console.error("Failed to fetch suppliers:", error);
    return (
      <AppShell>
        <div className="rounded-lg border border-red-200 bg-red-50 p-6 dark:border-red-900 dark:bg-red-950">
          <h1 className="text-xl font-bold text-red-900 dark:text-red-100">
            Error
          </h1>
          <p className="mt-2 text-sm text-red-700 dark:text-red-200">
            Failed to load suppliers. Please try again later.
          </p>
        </div>
      </AppShell>
    );
  }
}
