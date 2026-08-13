import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth/permissions";

export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAuth(request);
    if (authResult instanceof NextResponse) return authResult;
    const session = authResult;

    const body = await request.json();
    const { productName, productCode, reason } = body;

    if (!productName || !productCode) {
      return NextResponse.json(
        { success: false, error: "Product name and code are required" },
        { status: 400 }
      );
    }

    // Fetch user and store details if available
    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      include: { store: true },
    });

    const log = await prisma.unauthorizedExitLog.create({
      data: {
        productName,
        productCode,
        storeId: user?.storeId || null,
        storeName: user?.store?.name || null,
        userId: session.userId,
        userName: user?.name || session.name || "Unknown User",
        reason: reason || "Scanned product does not match any items in the selected incoming request",
      },
    });

    return NextResponse.json({ success: true, data: log });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to log unauthorized exit" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAuth(request);
    if (authResult instanceof NextResponse) return authResult;

    const logs = await prisma.unauthorizedExitLog.findMany({
      orderBy: { detectedAt: "desc" },
      include: {
        store: { select: { name: true, code: true } },
        user: { select: { name: true, role: true } },
      },
    });

    return NextResponse.json({ success: true, data: logs });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch logs" },
      { status: 500 }
    );
  }
}
