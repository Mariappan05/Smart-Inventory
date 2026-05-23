import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth/permissions";
import { getStoreWhereClause, getStoreIdForCreate } from "@/lib/storeFiltering";

export async function POST(request: NextRequest) {
  const authResult = await requireAuth(request);
  if (authResult instanceof NextResponse) return authResult;
  const session = authResult;

  try {
    const body = await request.json();
    const { customerName, items: scheduleItems } = body;

    // Validation
    if (!customerName || !customerName.trim()) {
      return NextResponse.json(
        { success: false, error: "Customer name is required" },
        { status: 400 }
      );
    }

    if (!scheduleItems || !Array.isArray(scheduleItems) || scheduleItems.length === 0) {
      return NextResponse.json(
        { success: false, error: "At least one component with tools is required" },
        { status: 400 }
      );
    }

    // Validate each item
    for (const item of scheduleItems) {
      if (!item.componentId || !item.quantity || item.quantity < 1) {
        return NextResponse.json(
          { success: false, error: "Each component must have a valid quantity" },
          { status: 400 }
        );
      }
      if (!item.tools || !Array.isArray(item.tools) || item.tools.length === 0) {
        return NextResponse.json(
          { success: false, error: "Each component must have at least one tool" },
          { status: 400 }
        );
      }
    }

    const storeId = getStoreIdForCreate(session);
    if (!storeId) {
      return NextResponse.json(
        { success: false, error: "Store assignment required" },
        { status: 400 }
      );
    }

    // Create the tentative schedule with items and tools
    const schedule = await prisma.tentativeMonthlySchedule.create({
      data: {
        customerName: customerName.trim(),
        storeId,
        createdById: session.userId,
        items: {
          create: scheduleItems.map((item: any) => ({
            componentId: item.componentId,
            quantity: parseInt(item.quantity),
            tools: {
              create: item.tools.map((tool: any) => ({
                toolId: tool.toolId,
                quantity: parseInt(tool.quantity),
              })),
            },
          })),
        },
      },
      include: {
        items: {
          include: {
            component: {
              select: {
                id: true,
                name: true,
                itemCode: true,
              },
            },
            tools: {
              include: {
                tool: {
                  select: {
                    id: true,
                    toolName: true,
                    supplierName: true,
                    supplierCode: true,
                    rate: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    return NextResponse.json({ success: true, data: schedule });
  } catch (error) {
    console.error("Failed to create tentative monthly schedule:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create tentative monthly schedule" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  const authResult = await requireAuth(request);
  if (authResult instanceof NextResponse) return authResult;
  const session = authResult;

  try {
    const { searchParams } = new URL(request.url);
    const scheduleId = searchParams.get("id");
    const storeFilter = getStoreWhereClause(session);

    if (scheduleId) {
      const schedule = await prisma.tentativeMonthlySchedule.findFirst({
        where: { 
          id: scheduleId,
          ...storeFilter
        },
        include: {
          items: {
            include: {
              component: {
                select: {
                  id: true,
                  name: true,
                  itemCode: true,
                },
              },
              tools: {
                include: {
                  tool: {
                    select: {
                      id: true,
                      toolName: true,
                      supplierName: true,
                      supplierCode: true,
                      rate: true,
                    },
                  },
                },
              },
            },
          },
        },
      });

      if (!schedule) {
        return NextResponse.json(
          { success: false, error: "Schedule not found" },
          { status: 404 }
        );
      }

      return NextResponse.json({ success: true, data: schedule });
    }

    // Get all tentative schedules for user's store
    const schedules = await prisma.tentativeMonthlySchedule.findMany({
      where: storeFilter,
      include: {
        items: {
          include: {
            component: {
              select: {
                id: true,
                name: true,
                itemCode: true,
              },
            },
            tools: {
              include: {
                tool: {
                  select: {
                    id: true,
                    toolName: true,
                    supplierName: true,
                    supplierCode: true,
                    rate: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, data: schedules });
  } catch (error) {
    console.error("Failed to fetch tentative monthly schedules:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch tentative monthly schedules" },
      { status: 500 }
    );
  }
}
