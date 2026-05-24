import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAuthToken } from "@/lib/auth/jwt";
import { authCookieName } from "@/lib/auth/session";

// Force dynamic rendering
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // Get auth token from cookies
    const cookieHeader = request.headers.get("cookie");
    const token = cookieHeader
      ?.split(";")
      .find(c => c.trim().startsWith(authCookieName))
      ?.split("=")[1];

    if (!token) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Verify token
    let payload;
    try {
      payload = verifyAuthToken(token);
    } catch {
      return NextResponse.json(
        { success: false, error: "Invalid token" },
        { status: 401 }
      );
    }

    // Check if user is ADMIN or STORE_MANAGER
    if (!["ADMIN", "STORE_MANAGER"].includes(payload.role || "")) {
      return NextResponse.json(
        { success: false, error: "Forbidden" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const storeId = searchParams.get("storeId");

    if (!storeId) {
      return NextResponse.json(
        { success: false, error: "Store ID is required" },
        { status: 400 }
      );
    }

    // Check if the requested store is the default store
    const defaultStore = await prisma.store.findFirst({
      where: { isDefault: true },
    });

    if (!defaultStore || defaultStore.id !== storeId) {
      return NextResponse.json(
        { success: false, error: "Can only access incoming requests for the default store" },
        { status: 403 }
      );
    }

    // For STORE_MANAGER, verify they belong to the default store
    if (payload.role === "STORE_MANAGER") {
      const user = await prisma.user.findUnique({
        where: { id: payload.sub },
        select: { storeId: true },
      });

      if (user?.storeId !== defaultStore.id) {
        return NextResponse.json(
          { success: false, error: "You can only access incoming requests for your store" },
          { status: 403 }
        );
      }
    }

    const requests = await prisma.toolRequest.findMany({
      where: {
        targetStoreId: storeId,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({
      success: true,
      data: requests,
    });
  } catch (error) {
    console.error("Error fetching incoming requests:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch incoming requests" },
      { status: 500 }
    );
  }
}
