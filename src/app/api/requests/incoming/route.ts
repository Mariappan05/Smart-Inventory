import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAuthToken } from "@/lib/auth/jwt";
import { authCookieName } from "@/lib/auth/session";

// Force dynamic rendering
export const dynamic = 'force-dynamic';
export const revalidate = 0;

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
    let storeId = searchParams.get("storeId");

    // If no storeId provided, fetch from user session
    if (!storeId) {
      const user = await prisma.user.findUnique({
        where: { id: payload.sub },
        select: { storeId: true },
      });

      storeId = user?.storeId || null;
    }

    // If still no storeId, get the default store
    if (!storeId) {
      const defaultStore = await prisma.store.findFirst({
        where: { isDefault: true },
        select: { id: true },
      });
      storeId = defaultStore?.id || null;
    }

    if (!storeId) {
      return NextResponse.json(
        { success: false, error: "Unable to determine store" },
        { status: 400 }
      );
    }

    const requests = await prisma.toolRequest.findMany({
      where: {
        targetStoreId: storeId,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Fetch user details for each request
    const requestsWithUsers = await Promise.all(
      requests.map(async (request) => {
        let userName = "System";
        let userEmail: string | undefined;

        if (request.createdById) {
          const user = await prisma.user.findUnique({
            where: { id: request.createdById },
            select: { name: true, email: true },
          });
          if (user) {
            userName = user.name;
            userEmail = user.email;
          }
        }

        return {
          ...request,
          userName,
          userEmail,
        };
      })
    );

    return NextResponse.json({
      success: true,
      data: requestsWithUsers,
    });
  } catch (error) {
    console.error("Error fetching incoming requests:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch incoming requests" },
      { status: 500 }
    );
  }
}
