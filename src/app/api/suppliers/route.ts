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
    
    const suppliers = await prisma.supplier.findMany({
      where: storeFilter,
      orderBy: { name: "asc" },
    });

    return NextResponse.json(suppliers);
  } catch (error) {
    return NextResponse.json(
      { message: "Failed to fetch suppliers" },
      { status: 500 }
    );
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
        { success: false, message: "Invalid request body" },
        { status: 400 }
      );
    }

    const { name, code, contactEmail, contactPhone, address } = body;

    if (!name || !code) {
      return NextResponse.json(
        { success: false, message: "Name and code are required" },
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

    // Check for duplicate name within the same store
    const existingName = await prisma.supplier.findFirst({
      where: { 
        name,
        storeId
      },
    });

    if (existingName) {
      return NextResponse.json(
        {
          success: false,
          error: "Duplicate supplier",
          message: `Supplier "${name}" already exists in your store. Please use a different name.`,
        },
        { status: 409 }
      );
    }

    // Check for duplicate code within the same store
    const existingCode = await prisma.supplier.findFirst({
      where: { 
        code,
        storeId
      },
    });

    if (existingCode) {
      return NextResponse.json(
        {
          success: false,
          error: "Duplicate supplier code",
          message: `Supplier code "${code}" already exists in your store. Please use a different code.`,
        },
        { status: 409 }
      );
    }

    const supplier = await prisma.supplier.create({
      data: {
        name,
        code,
        contactEmail: contactEmail || null,
        contactPhone: contactPhone || null,
        address: address || null,
        storeId,
        createdById: session.userId,
      },
    });

    // Automatically create hardcoded types for the new supplier
    for (const typeName of HARDCODED_TYPES) {
      await prisma.type.create({
        data: {
          name: typeName,
          supplierId: supplier.id,
          storeId,
          createdById: session.userId,
        },
      });
    }

    return NextResponse.json({ success: true, data: supplier });
  } catch (error) {
    console.error("Failed to create supplier:", error);
    return NextResponse.json(
      { success: false, message: "Failed to create supplier" },
      { status: 500 }
    );
  }
}
