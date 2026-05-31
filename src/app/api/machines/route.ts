import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth/permissions";

export async function GET(req: NextRequest) {
  const authResult = await requireAuth(req);
  if (authResult instanceof NextResponse) return authResult;

  try {
    // Get pagination parameters
    const page = parseInt(req.nextUrl.searchParams.get("page") || "1", 10);
    const pageSize = parseInt(
      req.nextUrl.searchParams.get("pageSize") || "50",
      10
    );
    const skip = (page - 1) * pageSize;

    // Get total count
    const total = await prisma.machine.count();

    // Get machines
    const machines = await prisma.machine.findMany({
      skip,
      take: pageSize,
      select: {
        id: true,
        name: true,
        code: true,
        storeId: true,
        store: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        createdAt: true,
        updatedAt: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        data: machines,
        total,
        page,
        pageSize,
      },
    });
  } catch (error) {
    console.error("Failed to fetch machines:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch machines" },
      { status: 500 }
    );
  }
}
