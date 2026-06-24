import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { toolType, toolName, operations, supplierName, supplierCode, rate } = body;

    // Verify tool exists
    const tool = await prisma.tool.findUnique({
      where: { id },
    });

    if (!tool) {
      return NextResponse.json(
        { success: false, error: "Tool not found" },
        { status: 404 }
      );
    }

    // Validation
    if (!toolType || !toolType.trim()) {
      return NextResponse.json(
        { success: false, error: "Tool type is required" },
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
      const lifeSpan = typeof op.lifeSpan === 'string' ? parseFloat(op.lifeSpan) : op.lifeSpan;
      if (lifeSpan === undefined || lifeSpan === null || isNaN(lifeSpan) || lifeSpan <= 0) {
        return NextResponse.json(
          { success: false, error: "Each operation must have a valid life span greater than 0" },
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

    // Update tool
    const updatedTool = await prisma.tool.update({
      where: { id },
      data: {
        toolType: toolType.trim(),
        toolName: toolName.trim(),
        operations: operations.map((op: { name: string; lifeSpan: string | number }) => ({
          name: op.name.trim(),
          lifeSpan: typeof op.lifeSpan === 'string' ? parseFloat(op.lifeSpan) : Number(op.lifeSpan),
        })),
        supplierName: supplierName.trim(),
        supplierCode: supplierCode.trim(),
        rate: typeof rate === 'string' ? parseFloat(rate) : Number(rate),
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

    return NextResponse.json({ success: true, data: updatedTool });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Failed to update tool" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Verify tool exists
    const tool = await prisma.tool.findUnique({
      where: { id },
    });

    if (!tool) {
      return NextResponse.json(
        { success: false, error: "Tool not found" },
        { status: 404 }
      );
    }

    // Delete tool
    await prisma.tool.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: "Tool deleted successfully" });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Failed to delete tool" },
      { status: 500 }
    );
  }
}
