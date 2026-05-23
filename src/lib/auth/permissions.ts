import { NextRequest, NextResponse } from "next/server";
import { verifyAuthToken } from "@/lib/auth/jwt";
import { authCookieName } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

export type UserRole = "ADMIN" | "ADMIN_MANAGER" | "STORE_MANAGER" | "EMPLOYEE" | "SUB_STORE_LOGIN" | "INWARD_PERSON" | "OUTWARD_PERSON";

export type UserSession = {
  userId: string;
  role: UserRole;
  email: string;
  name: string;
  storeId?: string | null;
};

// Admin-only paths (only ADMIN role can access)
export const strictAdminOnlyPaths = ["/users", "/stores"];

// Module-based access permissions based on requirements
export const moduleAccess: Record<string, UserRole[]> = {
  // Admin-only modules
  "/users": ["ADMIN"],
  "/stores": ["ADMIN"],
  
  // Monthly Plan - Admin, Store Manager, Admin Manager
  "/monthly-plan": ["ADMIN", "ADMIN_MANAGER", "STORE_MANAGER"],
  
  // Inward - Inward Person, Admin, Store Manager
  "/inward": ["INWARD_PERSON", "ADMIN", "STORE_MANAGER"],
  
  // Outward - Outward Person, Admin, Store Manager
  "/outward": ["OUTWARD_PERSON", "ADMIN", "STORE_MANAGER"],
  
  // Supplier Wise Schedule - Admin, Store Manager
  "/schedules/supplier": ["ADMIN", "STORE_MANAGER"],
  
  // Supplier Wise PO - Admin, Store Manager
  "/supplier-po": ["ADMIN", "STORE_MANAGER"],
  
  // Products - Admin, Store Manager
  "/products": ["ADMIN", "STORE_MANAGER"],
  "/products/new": ["ADMIN", "STORE_MANAGER"],
  
  // Tools - Admin, Store Manager
  "/tools": ["ADMIN", "STORE_MANAGER"],
  "/tools/new": ["ADMIN", "STORE_MANAGER"],
  
  // Suppliers - Admin, Store Manager
  "/suppliers": ["ADMIN", "STORE_MANAGER"],
  "/suppliers/new": ["ADMIN", "STORE_MANAGER"],
  
  // Machines - Admin, Store Manager 
  "/machines": ["ADMIN", "STORE_MANAGER"],
  "/machines/new": ["ADMIN", "STORE_MANAGER"],
  
  // QR Code - Store Manager, Admin
  "/qr": ["ADMIN", "STORE_MANAGER"],
  
  // Request - Sub Store, Admin, Store Manager
  "/products/request": ["SUB_STORE_LOGIN", "ADMIN", "STORE_MANAGER"],
  "/request": ["SUB_STORE_LOGIN", "ADMIN", "STORE_MANAGER"],
  
  // Schedules - Sub Store, Admin, Store Manager
  "/schedules": ["SUB_STORE_LOGIN", "ADMIN", "STORE_MANAGER"],
  "/schedules/tentative": ["ADMIN", "STORE_MANAGER"],
  "/schedules/final": ["ADMIN", "STORE_MANAGER"],
  "/schedules/expired": ["ADMIN", "STORE_MANAGER"],
  "/weekly-schedule": ["SUB_STORE_LOGIN", "ADMIN", "STORE_MANAGER"],
  
  // Production Entry - Sub Store, Admin, Store Manager
  "/production": ["SUB_STORE_LOGIN", "ADMIN", "STORE_MANAGER"],
  
  // Categories - Admin, Store Manager
  "/categories": ["ADMIN", "STORE_MANAGER"],
  
  // Store Rooms - Admin, Store Manager
  "/store-rooms": ["ADMIN", "STORE_MANAGER"],
  
  // Machine IO - Admin, Store Manager
  "/machine-io": ["ADMIN", "STORE_MANAGER"],
  
  // Maintenance - Admin, Store Manager
  "/maintenance": ["ADMIN", "STORE_MANAGER"],
  
  // Reports - Admin, Store Manager
  "/reports": ["ADMIN", "STORE_MANAGER"],
  
  // Alerts - Admin, Store Manager, Employee
  "/alerts": ["ADMIN", "ADMIN_MANAGER", "STORE_MANAGER", "EMPLOYEE"],
  
  // Profile - Accessible to all authenticated users
  "/profile": ["ADMIN", "ADMIN_MANAGER", "STORE_MANAGER", "EMPLOYEE", "SUB_STORE_LOGIN", "INWARD_PERSON", "OUTWARD_PERSON"],
  
  // Dashboard - Accessible to all authenticated users
  "/": ["ADMIN", "ADMIN_MANAGER", "STORE_MANAGER", "EMPLOYEE", "SUB_STORE_LOGIN", "INWARD_PERSON", "OUTWARD_PERSON"],
  "/dashboard": ["ADMIN", "ADMIN_MANAGER", "STORE_MANAGER", "EMPLOYEE", "SUB_STORE_LOGIN", "INWARD_PERSON", "OUTWARD_PERSON"],
};

// Role-based permissions for rolePermissions
export const rolePermissions: Record<UserRole, string[]> = {
  ADMIN: [
    "*", // Admin has full access to all routes
  ],
  ADMIN_MANAGER: [
    "/monthly-plan",
    "/alerts",
    "/profile",
    "/",
  ],
  STORE_MANAGER: [
    "/monthly-plan",
    "/inward",
    "/outward",
    "/schedules/supplier",
    "/supplier-po",
    "/products/new",
    "/tools/new",
    "/tools",
    "/suppliers/new",
    "/machines/new",
    "/qr",
    "/products/request",
    "/request",
    "/schedules",
    "/weekly-schedule",
    "/production",
    "/alerts",
    "/reports",
    "/profile",
    "/",
  ],
  EMPLOYEE: [
    "/inward",
    "/outward",
    "/alerts",
    "/profile",
    "/",
  ],
  INWARD_PERSON: [
    "/inward",
    "/profile",
    "/",
  ],
  OUTWARD_PERSON: [
    "/outward",
    "/profile",
    "/",
  ],
  SUB_STORE_LOGIN: [
    "/products/request",
    "/request",
    "/schedules",
    "/weekly-schedule",
    "/production",
    "/profile",
    "/",
  ],
};

export async function getUserSession(request: NextRequest): Promise<UserSession | null> {
  const token = request.cookies.get(authCookieName)?.value;
  
  if (!token) {
    return null;
  }

  try {
    const payload = verifyAuthToken(token);
    
    return {
      userId: payload.sub,
      role: payload.role,
      email: payload.email || "",
      name: payload.name || "",
      storeId: payload.storeId || null,
    };
  } catch {
    return null;
  }
}

export function canAccessAllStores(role: UserRole): boolean {
  return ["ADMIN", "ADMIN_MANAGER"].includes(role);
}

export async function requireAuth(request: NextRequest): Promise<UserSession | NextResponse> {
  const session = await getUserSession(request);
  
  if (!session) {
    return NextResponse.json(
      { success: false, message: "Unauthorized" },
      { status: 401 }
    );
  }
  
  return session;
}

export async function requireStrictAdmin(request: NextRequest): Promise<UserSession | NextResponse> {
  const session = await getUserSession(request);
  
  if (!session) {
    return NextResponse.json(
      { success: false, message: "Unauthorized" },
      { status: 401 }
    );
  }
  
  if (session.role !== "ADMIN") {
    return NextResponse.json(
      { success: false, message: "Forbidden - Admin only access" },
      { status: 403 }
    );
  }
  
  return session;
}

export async function requireAdmin(request: NextRequest): Promise<UserSession | NextResponse> {
  const session = await getUserSession(request);
  
  if (!session) {
    return NextResponse.json(
      { success: false, message: "Unauthorized" },
      { status: 401 }
    );
  }
  
  if (!["ADMIN", "ADMIN_MANAGER", "STORE_MANAGER"].includes(session.role)) {
    return NextResponse.json(
      { success: false, message: "Forbidden - Admin access required" },
      { status: 403 }
    );
  }
  
  return session;
}

export function canAccessPath(role: UserRole, pathname: string): boolean {
  // Admin has full access to everything
  if (role === "ADMIN") {
    return true;
  }

  // Check strict admin-only paths first
  if (strictAdminOnlyPaths.some(path => pathname === path || pathname.startsWith(path + "/"))) {
    return false;
  }

  const permissions = rolePermissions[role];

  // Full access check
  if (permissions.includes("*")) {
    return true;
  }

  // Check if pathname matches any allowed path
  return permissions.some(allowedPath => {
    if (allowedPath === pathname) return true;
    if (pathname.startsWith(allowedPath + "/")) return true;
    return false;
  });
}

export function canAccessModule(role: UserRole, modulePath: string): boolean {
  // Admin has full access to all modules
  if (role === "ADMIN") {
    return true;
  }

  // Find the module in moduleAccess by checking exact match or prefix
  let allowedRoles: UserRole[] | undefined;
  
  // Try exact match first
  if (moduleAccess[modulePath]) {
    allowedRoles = moduleAccess[modulePath];
  } else {
    // Try prefix match
    for (const [path, roles] of Object.entries(moduleAccess)) {
      if (modulePath.startsWith(path + "/") || modulePath.startsWith(path)) {
        allowedRoles = roles;
        break;
      }
    }
  }
  
  if (!allowedRoles) {
    return false;
  }
  
  return allowedRoles.includes(role);
}

export function hasFullAccess(role: UserRole): boolean {
  // Only ADMIN has full system access
  return role === "ADMIN";
}
