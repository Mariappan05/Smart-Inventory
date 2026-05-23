import { UserSession } from "@/lib/auth/permissions";

/**
 * Store-Based Filtering Utility
 * 
 * ADMIN role has full access to all stores across all pages.
 * Other roles see only their assigned store data.
 */

/**
 * Check if user has global access to all stores based on role
 */
function hasGlobalAccess(session: UserSession): boolean {
  return session.role === "ADMIN";
}

/**
 * Get WHERE clause for filtering by store
 * Admin sees all stores, other roles see only their assigned store
 */
export function getStoreWhereClause(session: UserSession, allowGlobalAccess: boolean = false) {
  if (hasGlobalAccess(session)) {
    return {}; // No filter - Admin sees all stores
  }
  
  if (!session.storeId) {
    return { storeId: "IMPOSSIBLE_STORE_ID" };
  }
  
  return { storeId: session.storeId };
}

/**
 * Get WHERE clause for tables with fromStoreId (like ProductOutLog)
 */
export function getFromStoreWhereClause(session: UserSession) {
  if (hasGlobalAccess(session)) {
    return {}; // Admin sees all stores
  }
  
  if (!session.storeId) {
    return { fromStoreId: "IMPOSSIBLE_STORE_ID" };
  }
  
  return { fromStoreId: session.storeId };
}

/**
 * Get WHERE clause for tables with toStoreId (like ProductInLog)
 */
export function getToStoreWhereClause(session: UserSession) {
  if (hasGlobalAccess(session)) {
    return {}; // Admin sees all stores
  }
  
  if (!session.storeId) {
    return { toStoreId: "IMPOSSIBLE_STORE_ID" };
  }
  
  return { toStoreId: session.storeId };
}

/**
 * Get WHERE clause for movement logs (fromStoreId OR toStoreId)
 */
export function getMovementStoreWhereClause(session: UserSession) {
  if (hasGlobalAccess(session)) {
    return {}; // Admin sees all stores
  }
  
  if (!session.storeId) {
    return { 
      OR: [
        { fromStoreId: "IMPOSSIBLE_STORE_ID" },
        { toStoreId: "IMPOSSIBLE_STORE_ID" }
      ]
    };
  }
  
  return {
    OR: [
      { fromStoreId: session.storeId },
      { toStoreId: session.storeId }
    ]
  };
}

/**
 * Check if user can access a specific store
 * Admin can access all stores
 */
export function canUserAccessStore(session: UserSession, storeId: string | null, allowGlobalAccess: boolean = false): boolean {
  if (hasGlobalAccess(session)) {
    return true; // Admin can access any store
  }
  return session.storeId === storeId;
}

/**
 * Get storeId for create operations
 * Admin can create in any store (use provided storeId or null)
 * Other roles use their assigned store
 */
export function getStoreIdForCreate(session: UserSession, requestedStoreId?: string | null): string | null {
  if (hasGlobalAccess(session)) {
    return requestedStoreId || session.storeId || null;
  }
  return session.storeId || null;
}

/**
 * Validate that user can create in the requested store
 */
export function validateStoreAccess(session: UserSession, requestedStoreId?: string | null): boolean {
  if (hasGlobalAccess(session)) {
    return true; // Admin can create in any store
  }
  
  if (!requestedStoreId) {
    return !!session.storeId;
  }
  
  return session.storeId === requestedStoreId;
}

/**
 * Build complete WHERE clause with store filtering
 * Merges custom where conditions with store filter
 */
export function buildStoreAwareWhere(
  session: UserSession,
  customWhere: any = {}
): any {
  const storeFilter = getStoreWhereClause(session);
  
  return {
    ...customWhere,
    ...storeFilter
  };
}

/**
 * Get data for create operation with store context
 */
export function getCreateDataWithStore(
  session: UserSession,
  data: any
): any {
  const storeId = getStoreIdForCreate(session);
  
  return {
    ...data,
    storeId,
    createdById: session.userId
  };
}

/**
 * Module-specific store filtering configurations
 */
export const MODULE_STORE_FILTERS = {
  products: { field: "storeId", type: "direct" },
  items: { field: "storeId", type: "direct" },
  tools: { field: "storeId", type: "direct" },
  suppliers: { field: "storeId", type: "direct" },
  types: { field: "storeId", type: "direct" },
  schedules: { field: "storeId", type: "direct" },
  monthlySchedules: { field: "storeId", type: "direct" },
  alerts: { field: "storeId", type: "direct" },
  qrScans: { field: "storeId", type: "direct" },
  maintenance: { field: "storeId", type: "direct" },
  outward: { field: "fromStoreId", type: "from" },
  inward: { field: "toStoreId", type: "to" },
  movements: { field: "both", type: "movement" },
} as const;

/**
 * Get appropriate WHERE clause based on module type
 */
export function getModuleStoreFilter(
  session: UserSession,
  module: keyof typeof MODULE_STORE_FILTERS
): any {
  const config = MODULE_STORE_FILTERS[module];
  
  if (!config) {
    return getStoreWhereClause(session);
  }
  
  switch (config.type) {
    case "direct":
      return getStoreWhereClause(session);
    case "from":
      return getFromStoreWhereClause(session);
    case "to":
      return getToStoreWhereClause(session);
    case "movement":
      return getMovementStoreWhereClause(session);
    default:
      return getStoreWhereClause(session);
  }
}

/**
 * Error messages for store access violations
 */
export const STORE_ACCESS_ERRORS = {
  NO_STORE_ASSIGNED: "User has no store assigned",
  INVALID_STORE_ACCESS: "You do not have access to this store",
  STORE_REQUIRED: "Store ID is required for this operation",
  CROSS_STORE_ACCESS_DENIED: "Cannot access data from other stores",
} as const;

/**
 * Throw error if user doesn't have store access
 */
export function requireStoreAccess(session: UserSession, storeId?: string | null, allowGlobalAccess: boolean = false): void {
  if (hasGlobalAccess(session)) {
    return; // Admin has access to all stores
  }
  
  if (!session.storeId) {
    throw new Error(STORE_ACCESS_ERRORS.NO_STORE_ASSIGNED);
  }
  
  if (storeId && !canUserAccessStore(session, storeId, allowGlobalAccess)) {
    throw new Error(STORE_ACCESS_ERRORS.INVALID_STORE_ACCESS);
  }
}
