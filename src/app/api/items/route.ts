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
    
    const items = await prisma.item.findMany({
      where: storeFilter,
      include: {
        supplier: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, data: items });
  } catch (error) {
    console.error("Failed to fetch items:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch items" }, { status: 500 });
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

    const { name, supplierName, itemCode, description, lifeDuration, unitPrice, variant, imagesJson } = body;

    if (!name) {
      return NextResponse.json(
        { success: false, error: "Name is required", message: "Name is required" },
        { status: 400 }
      );
    }

    if (!supplierName) {
      return NextResponse.json(
        { success: false, error: "Supplier name is required", message: "Supplier name is required" },
        { status: 400 }
      );
    }

    if (!itemCode) {
      return NextResponse.json(
        { success: false, error: "Item code is required", message: "Item code is required" },
        { status: 400 }
      );
    }

    if (!description) {
      return NextResponse.json(
        { success: false, error: "Description is required", message: "Description is required" },
        { status: 400 }
      );
    }

    if (!lifeDuration) {
      return NextResponse.json(
        { success: false, error: "Life duration is required", message: "Life duration is required" },
        { status: 400 }
      );
    }

    if (!variant) {
      return NextResponse.json(
        { success: false, error: "Type variant is required", message: "Type variant is required" },
        { status: 400 }
      );
    }

    if (!imagesJson || JSON.parse(imagesJson).length === 0) {
      return NextResponse.json(
        { success: false, error: "At least one image is required", message: "At least one image is required" },
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

    // Find or create supplier
    let supplier = await prisma.supplier.findFirst({
      where: { 
        name: supplierName,
        storeId
      },
    });

    if (!supplier) {
      supplier = await prisma.supplier.create({
        data: {
          name: supplierName,
          code: supplierName.toUpperCase().substring(0, 40),
          storeId,
          createdById: session.userId,
        },
      });
    }

    // Check for duplicate: itemCode + description + variant (type) must be unique per store
    const existing = await prisma.item.findFirst({
      where: {
        itemCode,
        description,
        variant,
        storeId,
      },
    });

    if (existing) {
      return NextResponse.json(
        {
          success: false,
          error: "Duplicate product",
          message: `A product with the same Item Code, Type, and Description already exists in your store. Please use different values.`,
        },
        { status: 409 }
      );
    }

    const item = await prisma.item.create({
      data: {
        name,
        supplierId: supplier.id,
        itemCode,
        description,
        lifeDuration,
        unitPrice: unitPrice || 0,
        variant,
        imagesJson: imagesJson || null,
        storeId,
        createdById: session.userId,
      },
      include: {
        supplier: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json({ success: true, data: item }, { status: 201 });
  } catch (error) {
    console.error("Failed to create item:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create item", message: "Failed to create item" },
      { status: 500 }
    );
  }
}
