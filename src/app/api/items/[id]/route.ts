import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth/permissions";
import { getStoreWhereClause, getStoreIdForCreate } from "@/lib/storeFiltering";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAuth(request);
  if (authResult instanceof NextResponse) return authResult;
  const session = authResult;

  try {
    const { id } = await params;
    const storeFilter = getStoreWhereClause(session);

    const item = await prisma.item.findUnique({
      where: { id, ...storeFilter },
      include: {
        supplier: { select: { id: true, name: true } },
      },
    });

    if (!item) {
      return NextResponse.json(
        { success: false, message: "Item not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: item });
  } catch (error) {
    console.error("Failed to fetch item:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch item" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAuth(request);
  if (authResult instanceof NextResponse) return authResult;
  const session = authResult;

  try {
    const { id } = await params;
    const body = await request.json();
    const { name, supplierName, itemCode, description, lifeDuration, unitPrice, variant, imagesJson } = body;

    // Validate required fields
    if (!name || !supplierName || !itemCode || !description || !lifeDuration || !variant) {
      return NextResponse.json(
        { success: false, message: "All fields are required" },
        { status: 400 }
      );
    }

    if (!imagesJson || JSON.parse(imagesJson).length === 0) {
      return NextResponse.json(
        { success: false, message: "At least one image is required" },
        { status: 400 }
      );
    }

    const storeId = getStoreIdForCreate(session);
    const storeFilter = getStoreWhereClause(session);

    // Verify item exists and belongs to user's store
    const existingItem = await prisma.item.findUnique({
      where: { id, ...storeFilter },
      include: { supplier: true },
    });

    if (!existingItem) {
      return NextResponse.json(
        { success: false, message: "Item not found" },
        { status: 404 }
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

    // Check if itemCode is unique (excluding current item)
    if (itemCode !== existingItem.itemCode) {
      const duplicateCode = await prisma.item.findUnique({
        where: { itemCode_storeId: { itemCode, storeId: existingItem.storeId || '' } },
      });

      if (duplicateCode) {
        return NextResponse.json(
          {
            success: false,
            message: `Item code "${itemCode}" already exists`,
          },
          { status: 409 }
        );
      }
    }

    // Update item
    const updatedItem = await prisma.item.update({
      where: { id },
      data: {
        name,
        supplierId: supplier.id,
        itemCode,
        description,
        lifeDuration,
        unitPrice: unitPrice || 0,
        variant,
        imagesJson: imagesJson || null,
      },
      include: {
        supplier: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json({ success: true, data: updatedItem }, { status: 200 });
  } catch (error) {
    console.error("Failed to update item:", error);
    return NextResponse.json(
      { success: false, message: "Failed to update item" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  context: { params: { id: string } | Promise<{ id: string }> }
) {
  const { id } = await Promise.resolve(context.params);

  if (!id) {
    return NextResponse.json({ success: false, message: "Missing id" }, { status: 400 });
  }

  try {
    await prisma.item.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    if (error?.code === "P2003") {
      return NextResponse.json(
        { success: false, message: "Cannot delete item because it is referenced by products" },
        { status: 409 }
      );
    }

    if (error?.code === "P2025") {
      return NextResponse.json({ success: false, message: "Item not found" }, { status: 404 });
    }

    return NextResponse.json({ success: false, message: "Failed to delete item" }, { status: 500 });
  }
}
