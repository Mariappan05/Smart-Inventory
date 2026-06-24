import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth/permissions";
import { getStoreWhereClause, getStoreIdForCreate } from "@/lib/storeFiltering";

const HARDCODED_TYPES = ["Insert", "Drill", "HSS Drill", "Reamer", "Endmill", "Holemill"];

export async function GET(request: NextRequest) {
  const authResult = await requireAuth(request);
  if (authResult instanceof NextResponse) return authResult;
  const session = authResult;

  try {
    const storeFilter = getStoreWhereClause(session);
    
    // Get suppliers from user's store
    const suppliers = await prisma.supplier.findMany({
      where: storeFilter,
      select: { id: true },
    });

    // Ensure hardcoded types exist for all suppliers in user's store
    const storeId = session.storeId;
    for (const supplier of suppliers) {
      for (const typeName of HARDCODED_TYPES) {
        await prisma.type.upsert({
          where: {
            supplierId_name: {
              supplierId: supplier.id,
              name: typeName,
            },
          },
          update: {},
          create: {
            name: typeName,
            supplierId: supplier.id,
            storeId,
            createdById: session.userId,
          },
        });
      }
    }

    const types = await prisma.type.findMany({
      where: storeFilter,
      select: {
        id: true,
        name: true,
        supplierId: true,
      },
      orderBy: { name: "asc" },
    });

    return NextResponse.json(types);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch types" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const authResult = await requireAuth(request);
  if (authResult instanceof NextResponse) return authResult;
  const session = authResult;

  try {
    let body;
    try {
      body = await request.json();
    } catch (jsonError) {
      return NextResponse.json(
        { success: false, error: "Invalid request body", message: "Invalid request body" },
        { status: 400 }
      );
    }

    const { name, supplierId } = body;

    if (!name) {
      return NextResponse.json(
        { success: false, error: "Name is required", message: "Name is required" },
        { status: 400 }
      );
    }

    const storeId = getStoreIdForCreate(session);
    
    if (!storeId) {
      return NextResponse.json(
        { success: false, error: "Store assignment required", message: "Store assignment required" },
        { status: 400 }
      );
    }

    // Check for duplicate within the same store
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
          error: "Duplicate type",
          message: `Type "${name}" already exists for this supplier in your store. Please use a different name.`,
        },
        { status: 409 }
      );
    }

    const type = await prisma.type.create({
      data: {
        name,
        supplierId: supplierId || null,
        storeId,
        createdById: session.userId,
      },
    });

    return NextResponse.json({ success: true, data: type }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Failed to create type", message: "Failed to create type" },
      { status: 500 }
    );
  }
}
