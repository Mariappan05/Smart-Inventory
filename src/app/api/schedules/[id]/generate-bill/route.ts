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

    if (schedule.status !== "FINAL") {
      return NextResponse.json(
        { success: false, message: "Only FINAL schedules can generate bills" },
        { status: 400 }
      );
    }

    // Generate bill ID
    const billId = schedule.id.substring(0, 8).toUpperCase();

    // Generate QR code data (JSON format with order information)
    const qrData = JSON.stringify({
      billId,
      scheduleId: schedule.id,
      item: schedule.item.name,
      quantity: schedule.quantity,
      supplier: schedule.supplier.name,
      totalAmount: schedule.totalWithGst,
      generatedAt: new Date().toISOString(),
    });

    // Generate QR code using external service
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(qrData)}`;

    // Generate bill PDF URL (store for later use)
    const billUrl = `/api/schedules/${id}/bill-pdf`;

    // Update schedule with bill info
    const updatedSchedule = await prisma.schedule.update({
      where: { id },
      data: {
        billUrl,
        qrCode: qrCodeUrl,
        status: "BILL_GENERATED",
      },
      include: {
        item: true,
        supplier: true,
        type: true,
        store: true,
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: "Bill generated successfully",
        data: {
          billId,
          schedule: updatedSchedule,
          qrCodeUrl,
          billUrl,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Failed to generate bill:", error);
    return NextResponse.json(
      { success: false, message: "Failed to generate bill" },
      { status: 500 }
    );
  }
}
