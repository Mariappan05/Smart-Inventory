import { NextRequest } from "next/server";
import { cookies } from "next/headers";
import { verifyAuthToken } from "@/lib/auth/jwt";
import { authCookieName } from "@/lib/auth/session";

export type CurrentUser = {
  userId: string;
  role: string;
  storeId: string | null;
  name?: string;
  email?: string;
};

/**
 * Get current user from NextRequest (for API routes)
 */
export async function getCurrentUserFromRequest(request: NextRequest): Promise<CurrentUser | null> {
  const token = request.cookies.get(authCookieName)?.value;
  if (!token) return null;

  try {
    const payload = verifyAuthToken(token);
    return {
      userId: payload.sub,
      role: payload.role,
      storeId: payload.storeId || null,
      name: payload.name,
    };
  } catch {
    return null;
  }
}

/**
 * Get current user from cookies (for Server Components)
 */
export async function getCurrentUserFromCookies(): Promise<CurrentUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(authCookieName)?.value;
  if (!token) return null;

  try {
    const payload = verifyAuthToken(token);
    return {
      userId: payload.sub,
      role: payload.role,
      storeId: payload.storeId || null,
      name: payload.name,
    };
  } catch {
    return null;
  }
}

/**
 * Check if user can access all stores (Admin/Admin Manager)
 */
export function canAccessAllStores(role: string): boolean {
  return ["ADMIN", "ADMIN_MANAGER"].includes(role);
}

/**
 * Get store filter for queries
 * Returns storeId for filtering or undefined for admin users
 */
export function getStoreFilterForUser(user: CurrentUser | null): string | undefined {
  if (!user) return undefined;
  if (canAccessAllStores(user.role)) return undefined;
  return user.storeId || undefined;
}
