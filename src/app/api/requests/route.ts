import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth/permissions";

// Force dynamic rendering
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: NextRequest) {
  const authResult = await requireAuth(request);
  if (authResult instanceof NextResponse) return authResult;
  const session = authResult;

  try {
    // Get user's store information
    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: { storeId: true },
    });

    if (!user?.storeId) {
      return NextResponse.json(
        { success: false, error: "User has no store assigned" },
        { status: 400 }
      );
    }

    // Fetch only requests created by users from the same store
    const requests = await prisma.toolRequest.findMany({
      where: {
        createdById: session.userId,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, data: requests });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Failed to fetch requests" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const authResult = await requireAuth(request);
  if (authResult instanceof NextResponse) return authResult;
  const session = authResult;

  try {
    const body = await request.json();
    const {
      toolName,
      componentName,
      componentCode,
      productionQuantity,
      fromDate,
      toDate,
      machineNumber,
      machineCode,
      storeCode,
      storeName,
      targetStoreId,
    } = body;

    const toolRequest = await prisma.toolRequest.create({
      data: {
        toolName,
        componentName,
        componentCode,
        productionQuantity,
        fromDate: new Date(fromDate),
        toDate: new Date(toDate),
        machineNumber,
        machineCode,
        storeCode,
        storeName,
        targetStoreId,
        status: "PENDING",
        createdById: session.userId,
      },
    });

    return NextResponse.json({ success: true, data: toolRequest });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Failed to create request" },
      { status: 500 }
    );
  }
}
