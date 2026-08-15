import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth/permissions";
import { getStoreWhereClause, getStoreIdForCreate } from "@/lib/storeFiltering";

const HARDCODED_TYPES = ["Insert", "Drill", "HSS Drill", "Reamer", "Endmill", "Holemill"];

/** Validate Indian GSTIN format */
function validateGSTIN(gst: string): boolean {
  const gstinRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
  return gstinRegex.test(gst);
}

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

    const { name, code, gstNumber, contactEmail, contactPhone, address } = body;

    if (!name || !code) {
      return NextResponse.json(
        { success: false, message: "Name and code are required" },
        { status: 400 }
      );
    }

    // Validate GST Number - mandatory & must be valid GSTIN
    if (!gstNumber || !gstNumber.trim()) {
      return NextResponse.json(
        { success: false, message: "GST Number is required" },
        { status: 400 }
      );
    }

    if (!validateGSTIN(gstNumber.trim().toUpperCase())) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid GST Number. Must be a valid 15-character Indian GSTIN format (e.g., 22AAAAA0000A1Z5)",
        },
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

    // Check for duplicate name globally
    const existingName = await prisma.supplier.findFirst({
      where: { name },
    });

    if (existingName) {
      return NextResponse.json(
        {
          success: false,
          error: "Duplicate supplier",
          message: `Supplier "${name}" already exists in the system. Please use a different name.`,
        },
        { status: 409 }
      );
    }

    // Check for duplicate code globally
    const existingCode = await prisma.supplier.findFirst({
      where: { code },
    });

    if (existingCode) {
      return NextResponse.json(
        {
          success: false,
          error: "Duplicate supplier code",
          message: `Supplier code "${code}" already exists in the system. Please use a different code.`,
        },
        { status: 409 }
      );
    }

    const supplier = await prisma.supplier.create({
      data: {
        name,
        code,
        gstNumber: gstNumber.trim().toUpperCase(),
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
    console.error("Error in POST /api/suppliers:", error);
    return NextResponse.json(
      { success: false, message: "Failed to create supplier" },
      { status: 500 }
    );
  }
}
