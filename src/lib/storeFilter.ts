import { UserSession } from "@/lib/auth/permissions";

/**
 * ALL users can ONLY access their assigned store data.
 * No role-based exceptions.
 */

export function getStoreWhereClause(session: UserSession) {
  if (!session.storeId) {
    return { storeId: "IMPOSSIBLE_STORE_ID" };
  }
  
  return { storeId: session.storeId };
}

export function canUserAccessStore(session: UserSession, storeId: string | null): boolean {
  return session.storeId === storeId;
}

export function getStoreIdForCreate(session: UserSession): string | null {
  return session.storeId || null;
}
