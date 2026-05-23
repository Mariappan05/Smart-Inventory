import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/middleware";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAdmin(request);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const { id } = await params;
    const body = await request.json();
    const { billReceivedDate, supplierBillNumber } = body;

    // Fetch the schedule
    const schedule = await prisma.schedule.findUnique({
      where: { id },
      include: { item: true, supplier: true },
    });

    if (!schedule) {
      return NextResponse.json(
        { success: false, message: "Schedule not found" },
        { status: 404 }
      );
    }

    if (schedule.status !== "BILL_GENERATED") {
      return NextResponse.json(
        { success: false, message: "Bill must be generated first" },
        { status: 400 }
      );
    }

    // Update schedule status to DELIVERED
    const updatedSchedule = await prisma.schedule.update({
      where: { id },
      data: {
        status: "DELIVERED",
        supplierBillNumber: supplierBillNumber || null,
        deliveryDate: new Date(billReceivedDate),
      },
      include: {
        item: true,
        supplier: true,
        store: true,
      },
    });

    // Create a product movement record (Product IN)
    // This represents the received goods going into stock
    // Note: This would be ProductInLog for actual product instances
    // For now, skip movement logging as items are logged at order level
    // const movement = await prisma.productInLog.create({
    //   data: {
    //     productId: schedule.itemId,  // This should be a specific product, not item
    //     toPlantId: schedule.plantId,
    //     conditionNote: `Bill received from ${schedule.supplier.name}`,
    //   },
    // });

    // Update item stock quantity
    await prisma.item.update({
      where: { id: schedule.itemId },
      data: {
        stockQuantity: {
          increment: schedule.quantity,
        },
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: "Bill confirmed and item stock updated",
        data: {
          schedule: updatedSchedule,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Failed to confirm bill receipt:", error);
    return NextResponse.json(
      { success: false, message: "Failed to confirm bill receipt" },
      { status: 500 }
    );
  }
}
