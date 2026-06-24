import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth/permissions";

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAuth(req);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const { id } = await context.params;
    const body = await req.json();
    const { customerName, name, itemCode, rawMaterialType, rmSupplier, rmPrice } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Missing id" },
        { status: 400 }
      );
    }

    if (!customerName || !name || !itemCode || !rawMaterialType || !rmSupplier || rmPrice === undefined) {
      return NextResponse.json(
        { success: false, error: "All fields are required" },
        { status: 400 }
      );
    }

    // Verify product exists
    const product = await prisma.item.findUnique({
      where: { id },
    });

    if (!product) {
      return NextResponse.json(
        { success: false, error: "Product not found" },
        { status: 404 }
      );
    }

    // Check for duplicate itemCode in same store (excluding current product)
    const duplicate = await prisma.item.findFirst({
      where: {
        itemCode,
        storeId: product.storeId,
        id: { not: id },
      },
    });

    if (duplicate) {
      return NextResponse.json(
        { success: false, error: "Item code already exists in this store" },
        { status: 409 }
      );
    }

    // Update product
    const updated = await prisma.item.update({
      where: { id },
      data: { 
        name, 
        itemCode,
        description: `PRODUCT_${customerName}`,
        lifeDuration: rawMaterialType,
        variant: rmSupplier,
        unitPrice: parseFloat(rmPrice)
      },
    });

    return NextResponse.json({
      success: true,
      data: updated,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: "Failed to update product" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAuth(req);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const { id } = await context.params;

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Missing id" },
        { status: 400 }
      );
    }

    // Verify product exists
    const product = await prisma.item.findUnique({
      where: { id },
    });

    if (!product) {
      return NextResponse.json(
        { success: false, error: "Product not found" },
        { status: 404 }
      );
    }

    // Delete product
    await prisma.item.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: "Product deleted successfully",
    });
  } catch (error: any) {

    if (error?.code === "P2003") {
      return NextResponse.json(
        {
          success: false,
          error: "Cannot delete product because it is referenced by other records",
        },
        { status: 409 }
      );
    }

    if (error?.code === "P2025") {
      return NextResponse.json(
        { success: false, error: "Product not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { success: false, error: "Failed to delete product" },
      { status: 500 }
    );
  }
}
