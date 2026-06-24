import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth/permissions";
import { getStoreWhereClause } from "@/lib/storeFiltering";

/**
 * GET /api/monthly-schedule/data
 * Fetch unique customer names from products
 */
export async function GET(request: NextRequest) {
  const authResult = await requireAuth(request);
  if (authResult instanceof NextResponse) return authResult;
  const session = authResult;

  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get("action");
    
    // Ensure storeId is available
    let storeId = session.storeId;
    if (!storeId) {
      try {
        const user = await prisma.user.findUnique({
          where: { id: session.userId },
          select: { storeId: true }
        });
        storeId = user?.storeId || null;
      } catch (dbError) {
        return NextResponse.json(
          { success: false, error: "Database connection error. Please try again." },
          { status: 503 }
        );
      }
    }
    
    if (!storeId) {
      return NextResponse.json(
        { success: false, error: "User not assigned to any store" },
        { status: 400 }
      );
    }
    
    const storeFilter = { storeId };

    // Get unique customer names from products (Items with PRODUCT_ prefix)
    if (action === "customer-names") {
      
      try {
        const items = await prisma.item.findMany({
          where: {
            description: {
              startsWith: "PRODUCT_",
            },
            ...storeFilter,
          },
          select: {
            description: true,
          },
        });

        // Extract unique customer names
        const customerNamesSet = new Set<string>();
        items.forEach((item) => {
          const customerName = item.description.replace("PRODUCT_", "");
          if (customerName) {
            customerNamesSet.add(customerName);
          }
        });

        const customerNames = Array.from(customerNamesSet).sort();

        return NextResponse.json({ success: true, data: customerNames });
      } catch (error) {
        return NextResponse.json(
          { success: false, error: "Failed to fetch customer names. Database may be unavailable." },
          { status: 503 }
        );
      }
    }

    // Get components for a customer
    if (action === "components") {
      const customerName = searchParams.get("customerName");
      if (!customerName) {
        return NextResponse.json(
          { success: false, error: "Customer name is required" },
          { status: 400 }
        );
      }

      try {
        const components = await prisma.item.findMany({
          where: {
            description: `PRODUCT_${customerName}`,
            ...storeFilter,
          },
          select: {
            id: true,
            name: true,
            itemCode: true,
            description: true,
          },
          orderBy: { name: "asc" },
        });

        return NextResponse.json({ success: true, data: components });
      } catch (error) {
        return NextResponse.json(
          { success: false, error: "Failed to fetch components. Database may be unavailable." },
          { status: 503 }
        );
      }
    }

    // Get tools for components
    if (action === "tools") {
      const componentIds = searchParams.getAll("componentIds");
      if (!componentIds || componentIds.length === 0) {
        return NextResponse.json(
          { success: false, error: "Component IDs are required" },
          { status: 400 }
        );
      }

      try {
        const tools = await prisma.tool.findMany({
          where: {
            itemId: {
              in: componentIds,
            },
            ...storeFilter,
          },
          include: {
            item: {
              select: {
                id: true,
                name: true,
              },
            },
          },
          orderBy: { createdAt: "asc" },
        });

        return NextResponse.json({ success: true, data: tools });
      } catch (error) {
        return NextResponse.json(
          { success: false, error: "Failed to fetch tools. Database may be unavailable." },
          { status: 503 }
        );
      }
    }

    return NextResponse.json(
      { success: false, error: "Invalid action" },
      { status: 400 }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    
    if (errorMessage.includes("P1001") || errorMessage.includes("Can't reach database")) {
      return NextResponse.json(
        { success: false, error: "Database connection failed. Please try again later." },
        { status: 503 }
      );
    }
    
    return NextResponse.json(
      { success: false, error: "Failed to fetch monthly schedule data" },
      { status: 500 }
    );
  }
}
