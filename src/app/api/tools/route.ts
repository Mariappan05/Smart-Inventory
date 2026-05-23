import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth/permissions";
import { getStoreWhereClause, getStoreIdForCreate } from "@/lib/storeFiltering";

export async function GET(request: NextRequest) {
  const authResult = await requireAuth(request);
  if (authResult instanceof NextResponse) return authResult;
  const session = authResult;

  try {
    const { searchParams } = new URL(request.url);
    const itemId = searchParams.get("itemId");

    const storeFilter = getStoreWhereClause(session);
    let whereClause: any = { ...storeFilter };
    
    if (itemId) {
      whereClause.itemId = itemId;
    }

    const tools = await prisma.tool.findMany({
      where: whereClause,
      include: {
        item: {
          select: {
            id: true,
            name: true,
            itemCode: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, data: tools });
  } catch (error) {
    console.error("Failed to fetch tools:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch tools" },
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
        { success: false, error: "Invalid request body" },
        { status: 400 }
      );
    }

    const { itemId, toolName, operations, supplierName, supplierCode, rate } = body;

    // Validation
    if (!itemId || !itemId.trim()) {
      return NextResponse.json(
        { success: false, error: "Component is required" },
        { status: 400 }
      );
    }

    if (!toolName || !toolName.trim()) {
      return NextResponse.json(
        { success: false, error: "Tool name is required" },
        { status: 400 }
      );
    }

    if (!operations || !Array.isArray(operations) || operations.length === 0) {
      return NextResponse.json(
        { success: false, error: "At least one operation is required" },
        { status: 400 }
      );
    }

    // Validate each operation has name and valid lifeSpan
    for (const op of operations) {
      if (!op.name || !op.name.trim()) {
        return NextResponse.json(
          { success: false, error: "Each operation must have a name" },
          { status: 400 }
        );
      }
      if (op.lifeSpan === undefined || op.lifeSpan === null || isNaN(op.lifeSpan) || op.lifeSpan < 0) {
        return NextResponse.json(
          { success: false, error: "Each operation must have a valid life span" },
          { status: 400 }
        );
      }
    }

    if (!supplierName || !supplierName.trim()) {
      return NextResponse.json(
        { success: false, error: "Supplier name is required" },
        { status: 400 }
      );
    }

    if (!supplierCode || !supplierCode.trim()) {
      return NextResponse.json(
        { success: false, error: "Supplier code is required" },
        { status: 400 }
      );
    }

    if (rate === undefined || rate === null || isNaN(rate) || rate < 0) {
      return NextResponse.json(
        { success: false, error: "Valid rate is required" },
        { status: 400 }
      );
    }

    const storeId = getStoreIdForCreate(session);
    
    if (!storeId) {
      return NextResponse.json(
        { success: false, error: "Store assignment required" },
        { status: 400 }
      );
    }

    // Verify item exists and belongs to same store
    const item = await prisma.item.findFirst({
      where: { 
        id: itemId.trim(),
        storeId
      },
    });

    if (!item) {
      return NextResponse.json(
        { success: false, error: "Selected component does not exist or is not accessible" },
        { status: 400 }
      );
    }

    // Check for duplicates within the same store
    const existingTool = await prisma.tool.findFirst({
      where: {
        itemId: itemId.trim(),
        toolName: toolName.trim(),
        supplierCode: supplierCode.trim(),
        storeId,
      },
    });

    if (existingTool) {
      return NextResponse.json(
        { success: false, error: "A tool with the same name, component, and supplier code already exists in your store" },
        { status: 400 }
      );
    }

    // Create tool
    const tool = await prisma.tool.create({
      data: {
        itemId: itemId.trim(),
        toolName: toolName.trim(),
        operations: operations.map((op: { name: string; lifeSpan: number }) => ({
          name: op.name.trim(),
          lifeSpan: parseFloat(op.lifeSpan.toString()),
        })),
        supplierName: supplierName.trim(),
        supplierCode: supplierCode.trim(),
        rate: parseFloat(rate),
        storeId,
        createdById: session.userId,
      },
      include: {
        item: {
          select: {
            id: true,
            name: true,
            itemCode: true,
          },
        },
      },
    });

    return NextResponse.json({ success: true, data: tool });
  } catch (error) {
    console.error("Failed to create tool:", error);
    if ((error as any).code === "P2002") {
      return NextResponse.json(
        { success: false, error: "A tool with the same name, product, and supplier code already exists" },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { success: false, error: "Failed to create tool" },
      { status: 500 }
    );
  }
}
