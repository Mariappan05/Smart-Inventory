import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const storeId = searchParams.get("storeId");

    if (!storeId) {
      return NextResponse.json(
        { success: false, error: "Store ID is required" },
        { status: 400 }
      );
    }

    const count = await prisma.toolRequest.count({
      where: {
        targetStoreId: storeId,
        status: "PENDING",
      },
    });

    return NextResponse.json({
      success: true,
      data: { count },
    });
  } catch (error) {
    console.error("Error fetching incoming requests count:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch count" },
      { status: 500 }
    );
  }
}
