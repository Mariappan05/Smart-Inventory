import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth/permissions";

export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAuth(request);
    if (authResult instanceof NextResponse) return authResult;
    const session = authResult;

    const body = await request.json();
    const { requestId } = body;

    if (!requestId) {
      return NextResponse.json(
        { success: false, message: "Request ID is required" },
        { status: 400 }
      );
    }

    // Update request status to COMPLETED
    const updatedRequest = await prisma.toolRequest.update({
      where: { id: requestId },
      data: { status: "COMPLETED" },
    });

    return NextResponse.json({ success: true, data: updatedRequest });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || "Failed to process outward request" },
      { status: 500 }
    );
  }
}
