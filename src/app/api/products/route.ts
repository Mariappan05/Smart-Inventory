import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth/permissions";
import { getStoreWhereClause, getStoreIdForCreate } from "@/lib/storeFiltering";

export async function GET(request: NextRequest) {
  const authResult = await requireAuth(request);
  if (authResult instanceof NextResponse) return authResult;
  const session = authResult;

  try {
    // If storeId is missing from session, fetch from database
    if (!session.storeId) {
      const user = await prisma.user.findUnique({
        where: { id: session.userId },
        select: { storeId: true, email: true }
      });
      session.storeId = user?.storeId || null;
      session.email = session.email || user?.email || "";
    }

    const storeFilter = getStoreWhereClause(session);
    
    const products = await prisma.item.findMany({
      where: {
        description: {
          startsWith: "PRODUCT_",
        },
        ...storeFilter,
      },
      select: {
        id: true,
        name: true,
        itemCode: true,
        description: true,
        storeId: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, data: products });
  } catch (error) {
    console.error("Failed to fetch products:", error);
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

  try {
    let body;
    try {
      const text = await request.text();
      console.log("[Products API] Raw request body:", text);
      
      if (!text || text.trim() === "") {
        return NextResponse.json(
          { success: false, error: "Request body is empty" },
          { status: 400 }
        );
      }
      
      body = JSON.parse(text);
      console.log("[Products API] Parsed body:", body);
    } catch (jsonError) {
      console.error("[Products API] JSON parse error:", jsonError);
      return NextResponse.json(
        { success: false, error: "Invalid request body - must be valid JSON" },
        { status: 400 }
      );
    }

    const { customerName, componentName, componentCode } = body;
    console.log("[Products API] Extracted fields:", { customerName, componentName, componentCode });

    // Validation
    if (!customerName || !customerName.trim()) {
      console.log("[Products API] Validation failed: Customer name missing");
      return NextResponse.json(
        { success: false, error: "Customer name is required" },
        { status: 400 }
      );
    }

    if (!componentName || !componentName.trim()) {
      console.log("[Products API] Validation failed: Component name missing");
      return NextResponse.json(
        { success: false, error: "Component name is required" },
        { status: 400 }
      );
    }

    if (!componentCode || !componentCode.trim()) {
      console.log("[Products API] Validation failed: Component code missing");
      return NextResponse.json(
        { success: false, error: "Component code is required" },
        { status: 400 }
      );
    }

    let storeId = getStoreIdForCreate(session);
    console.log("[Products API] Store ID from session:", storeId);
    
    // If storeId is missing from session, fetch from database
    if (!storeId) {
      const user = await prisma.user.findUnique({
        where: { id: session.userId },
        select: { storeId: true }
      });
      storeId = user?.storeId || null;
      console.log("[Products API] Store ID from database:", storeId);
    }
    
    if (!storeId) {
      console.log("[Products API] Validation failed: No store assigned");
      return NextResponse.json(
        { success: false, error: "Store assignment required" },
        { status: 400 }
      );
    }

    // Check for duplicate itemCode within the same store
    const existingProduct = await prisma.item.findFirst({
      where: {
        itemCode: componentCode.trim(),
        storeId: storeId
      }
    });

    if (existingProduct) {
      console.log("[Products API] Validation failed: Duplicate item code in store");
      return NextResponse.json(
        { success: false, error: `Component code "${componentCode}" already exists in this store` },
        { status: 409 }
      );
    }

    // Create product as an item with a special description prefix
    const product = await prisma.item.create({
      data: {
        name: componentName.trim(),
        itemCode: componentCode.trim(),
        description: `PRODUCT_${customerName.trim()}`,
        lifeDuration: "N/A",
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
        storeId: true,
        createdAt: true,
      },
    });

    console.log("[Products API] Product created successfully:", product.id);
    return NextResponse.json({ success: true, data: product });
  } catch (error) {
    console.error("[Products API] Failed to create product:", error);
    return NextResponse.json(
      { 
        success: false, 
        error: "Failed to create product",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}
