import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth/permissions";

export async function GET(request: NextRequest) {
  const authResult = await requireAuth(request);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const requests = await prisma.toolRequest.findMany({
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, data: requests });
  } catch (error) {
    console.error("Failed to fetch requests:", error);
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
        createdById: session.userId,
      },
    });

    return NextResponse.json({ success: true, data: toolRequest });
  } catch (error) {
    console.error("Failed to create request:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create request" },
      { status: 500 }
    );
  }
}
