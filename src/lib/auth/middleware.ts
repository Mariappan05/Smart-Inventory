import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { authCookieName } from "./session";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

export async function requireAdmin(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(authCookieName)?.value;

    if (!token) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const decoded = jwt.verify(token, JWT_SECRET) as { role?: string; id?: string };

    if (!["ADMIN", "ADMIN_MANAGER", "STORE_MANAGER"].includes(decoded.role || "")) {
      return NextResponse.json(
        { success: false, message: "Admin access required" },
        { status: 403 }
      );
    }

    return null; // Indicates success
  } catch (error) {
    console.error("Auth verification failed:", error);
    return NextResponse.json(
      { success: false, message: "Unauthorized" },
      { status: 401 }
    );
  }
}

export async function requireRole(request: NextRequest, requiredRoles: string[]) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(authCookieName)?.value;

    if (!token) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const decoded = jwt.verify(token, JWT_SECRET) as { role?: string; id?: string };

    if (!requiredRoles.includes(decoded.role || "")) {
      return NextResponse.json(
        { success: false, message: "Access denied" },
        { status: 403 }
      );
    }

    return null; // Indicates success
  } catch (error) {
    console.error("Auth verification failed:", error);
    return NextResponse.json(
      { success: false, message: "Unauthorized" },
      { status: 401 }
    );
  }
}

export async function requireStoreManager(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(authCookieName)?.value;

    if (!token) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const decoded = jwt.verify(token, JWT_SECRET) as { role?: string; id?: string };

    if (!["ADMIN", "ADMIN_MANAGER", "STORE_MANAGER"].includes(decoded.role || "")) {
      return NextResponse.json(
        { success: false, message: "Store Manager access required" },
        { status: 403 }
      );
    }

    return null; // Indicates success
  } catch (error) {
    console.error("Auth verification failed:", error);
    return NextResponse.json(
      { success: false, message: "Unauthorized" },
      { status: 401 }
    );
  }
}
