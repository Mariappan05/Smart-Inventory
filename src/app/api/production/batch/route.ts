import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth/permissions";

export async function POST(request: NextRequest) {
  const authResult = await requireAuth(request);
  if (authResult instanceof NextResponse) return authResult;
  const session = authResult;

  try {
    const body = await request.json();
    const { productions } = body;

    if (!productions || !Array.isArray(productions) || productions.length === 0) {
      return NextResponse.json(
        { success: false, error: "No production records provided" },
        { status: 400 }
      );
    }

    // Create all production records
    const createdProductions = await Promise.all(
      productions.map((prod) =>
        prisma.production.create({
          data: {
            date: new Date(prod.date),
            storeId: prod.storeId,
            machineName: prod.machineName,
            machineCode: prod.machineCode,
            componentName: prod.componentName,
            componentCode: prod.componentCode,
            operation: prod.operation,
            toolName: prod.toolName,
            productionQuantity: prod.productionQuantity,
            createdById: session.userId,
          },
          select: {
            id: true,
            date: true,
            store: {
              select: {
                id: true,
                name: true,
                code: true,
              },
            },
            machineName: true,
            machineCode: true,
            componentName: true,
            componentCode: true,
            operation: true,
            toolName: true,
            productionQuantity: true,
            createdAt: true,
          },
        })
      )
    );

    return NextResponse.json({
      success: true,
      data: createdProductions,
      message: `${createdProductions.length} production record(s) created successfully`,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Failed to create production records" },
      { status: 500 }
    );
  }
}
