import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Fetch the schedule
    const schedule = await prisma.schedule.findUnique({
      where: { id },
      include: { item: true, supplier: true, type: true, store: true },
    });

    if (!schedule) {
      return NextResponse.json(
        { success: false, message: "Schedule not found" },
        { status: 404 }
      );
    }

    const billId = schedule.id.substring(0, 8).toUpperCase();
    const qrData = JSON.stringify({
      billId,
      scheduleId: schedule.id,
      item: schedule.item.name,
      quantity: schedule.quantity,
      supplier: schedule.supplier.name,
      totalAmount: schedule.totalWithGst,
      generatedAt: new Date().toISOString(),
    });
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(qrData)}`;

    // Return bill data as JSON (can be converted to PDF on client side or used for print)
    return NextResponse.json({
      success: true,
      data: {
        billId,
        scheduleId: schedule.id,
        item: {
          id: schedule.item.id,
          name: schedule.item.name,
        },
        supplier: {
          id: schedule.supplier.id,
          name: schedule.supplier.name,
          code: schedule.supplier.code,
        },
        type: {
          id: schedule.type.id,
          name: schedule.type.name,
        },
        store: {
          id: schedule.store.id,
          name: schedule.store.name,
        },
        quantity: schedule.quantity,
        unitPrice: schedule.unitPrice,
        totalPrice: schedule.totalPrice,
        gstAmount: schedule.gstAmount,
        totalWithGst: schedule.totalWithGst,
        scheduleDate: schedule.scheduleDate,
        orderDeliveryDate: schedule.orderDeliveryDate,
        status: schedule.status,
        qrCodeUrl,
        generatedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("Failed to fetch bill:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch bill" },
      { status: 500 }
    );
  }
}
