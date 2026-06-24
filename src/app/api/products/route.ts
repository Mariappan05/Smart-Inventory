import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth/permissions";
import { getStoreWhereClause } from "@/lib/storeFiltering";
import { parseBody, createProductSchema } from "@/validations/schemas";

export async function GET(request: NextRequest) {
  const authResult = await requireAuth(request);
  if (authResult instanceof NextResponse) return authResult;
  const session = authResult;

  try {
    // Hydrate storeId from DB if missing in token
    if (!session.storeId) {
      const user = await prisma.user.findUnique({
        where: { id: session.userId },
        select: { storeId: true, email: true },
      });
      session.storeId = user?.storeId || null;
      session.email = session.email || user?.email || "";
    }

    const storeFilter = getStoreWhereClause(session);

    const products = await prisma.item.findMany({
      where: {
        description: { startsWith: "PRODUCT_" },
        ...storeFilter,
      },
      select: {
        id: true,
        name: true,
        itemCode: true,
        description: true,
        lifeDuration: true,
        variant: true,
        unitPrice: true,
        storeId: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, data: products });
  } catch {
    return NextResponse.json(
      { success: false, error: "Failed to fetch products" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const authResult = await requireAuth(request);
  if (authResult instanceof NextResponse) return authResult;
  const session = authResult;

  let rawBody: unknown;
  try {
    rawBody = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, error: "Invalid request body" },
      { status: 400 }
    );
  }

  // Zod validation
  const parsed = parseBody(createProductSchema, rawBody);
  if ("error" in parsed) return parsed.error;
  const { customerName, componentName, componentCode, storeId, rawMaterialType, rmSupplier, rmPrice } = parsed.data;

  try {
    // Check for duplicate itemCode within the same store
    const existingProduct = await prisma.item.findFirst({
      where: { itemCode: componentCode, storeId },
    });

    if (existingProduct) {
      return NextResponse.json(
        { success: false, error: `Component code "${componentCode}" already exists in this store` },
        { status: 409 }
      );
    }

    const product = await prisma.item.create({
      data: {
        name: componentName,
        itemCode: componentCode,
        description: `PRODUCT_${customerName}`,
        lifeDuration: rawMaterialType,
        variant: rmSupplier,
        unitPrice: rmPrice,
        stockQuantity: 0,
        minimumQuantity: 0,
        reorderQuantity: 0,
        storeId,
        createdById: session.userId,
      },
      select: {
        id: true,
        name: true,
        itemCode: true,
        description: true,
        lifeDuration: true,
        variant: true,
        unitPrice: true,
        storeId: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ success: true, data: product }, { status: 201 });
  } catch {
    return NextResponse.json(
      { success: false, error: "Failed to create product" },
      { status: 500 }
    );
  }
}
