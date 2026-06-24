import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth/permissions";

type RouteParams = {
  id: string;
};

export async function GET(
  req: NextRequest,
  context: { params: Promise<RouteParams> }
) {
  const authResult = await requireAuth(req);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const { id } = await context.params;

    const production = await prisma.production.findUnique({
      where: { id },
      include: {
        store: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        machine: {
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
    });

    if (!production) {
      return NextResponse.json(
        { success: false, error: "Production record not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: production,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Failed to fetch production record" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<RouteParams> }
) {
  const authResult = await requireAuth(req);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const { id } = await context.params;

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
