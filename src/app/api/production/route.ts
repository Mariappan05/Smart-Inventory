import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth/permissions";

export async function GET(req: NextRequest) {
  const authResult = await requireAuth(req);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const pageSize = parseInt(searchParams.get("pageSize") || "50", 10);
    const skip = (page - 1) * pageSize;

    const [productions, total] = await Promise.all([
      prisma.production.findMany({
        skip,
        take: pageSize,
        orderBy: { createdAt: "desc" },
        include: {
          store: {
            select: {
              id: true,
              name: true,
              code: true,
            },
          },
          createdBy: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      }),
      prisma.production.count(),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        data: productions,
        total,
        page,
        pageSize,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Failed to fetch production records" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  context?: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAuth(req);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Production ID is required" },
        { status: 400 }
      );
    }

    const production = await prisma.production.findUnique({
      where: { id },
    });

    if (!production) {
      return NextResponse.json(
        { success: false, error: "Production record not found" },
        { status: 404 }
      );
    }

    await prisma.production.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: "Production record deleted successfully",
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Failed to delete production record" },
      { status: 500 }
    );
  }
}
