import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth/permissions";
import { getStoreWhereClause, getStoreIdForCreate } from "@/lib/storeFiltering";

export async function GET(request: NextRequest) {
  const authResult = await requireAuth(request);
  if (authResult instanceof NextResponse) return authResult;
  const session = authResult;

  try {
    const storeFilter = getStoreWhereClause(session);
    const types = await prisma.type.findMany({
      where: storeFilter,
      orderBy: { name: "asc" },
      include: { supplier: true },
    });

    // Back-compat: treat "categories" as "types"
    return NextResponse.json(types);
  } catch (error) {
    return NextResponse.json(
      { message: "Failed to fetch categories" },
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
    const { name, supplierId } = body as { name?: string; supplierId?: string };

    if (!name) {
      return NextResponse.json(
        { success: false, message: "Name is required" },
        { status: 400 }
      );
    }

    const storeId = getStoreIdForCreate(session);
    
    if (!storeId) {
      return NextResponse.json(
        { success: false, message: "Store assignment required" },
        { status: 400 }
      );
    }

    // Check for duplicate
    const existing = await prisma.type.findFirst({
      where: {
        name,
        supplierId: supplierId || null,
        storeId,
      },
    });

    if (existing) {
      return NextResponse.json(
        {
          success: false,
          error: "Duplicate category",
          message: `Category "${name}" already exists for this supplier. Please use a different name.`,
        },
        { status: 409 }
      );
    }

    const category = await prisma.type.create({
      data: {
        name,
        storeId,
        createdById: session.userId,
        ...(supplierId ? { supplierId } : {}),
      },
    });

    return NextResponse.json({ success: true, data: category });
  } catch (error) {
    console.error("Failed to create category:", error);
    return NextResponse.json(
      { success: false, message: "Failed to create category" },
      { status: 500 }
    );
  }
}
