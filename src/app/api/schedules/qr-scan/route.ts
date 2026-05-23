import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth/permissions";

export async function POST(request: NextRequest) {
  const authResult = await requireAdmin(request);
  if (authResult instanceof NextResponse) return authResult;
  const session = authResult;

  try {
    const { billId } = await request.json();

    if (!billId?.trim()) {
      return NextResponse.json({ success: false, message: "Bill ID is required" }, { status: 400 });
    }

    const trimmedBillId = billId.trim().toUpperCase();

    // Search for schedule where the first 8 characters of the ID match the scanned billId
    // IDs are cuid format; prefix-match by fetching only COMPLETED schedules
    const allSchedules = await prisma.schedule.findMany({
      where: { status: "COMPLETED" },
      include: {
        supplier: true,
        type: true,
        item: true,
        store: true,
        completedBy: { select: { id: true, name: true } },
        completedByStore: { select: { id: true, name: true } },
      },
    });

    // Find the schedule where the first 8 characters (uppercase) match the billId
    const schedule = allSchedules.find((s: any) => s.id.substring(0, 8).toUpperCase() === trimmedBillId);

    if (!schedule) {
      return NextResponse.json({ success: false, message: "Bill not found. Please check the QR code and try again." }, { status: 404 });
    }

    // Check if the order is completed
    if (schedule.status !== "COMPLETED") {
      return NextResponse.json(
        { 
          success: false, 
          message: `This order is not ready for delivery. Current status: ${schedule.status}. Only orders marked as COMPLETED can be scanned for delivery confirmation.`,
          currentStatus: schedule.status
        },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: { storeId: true },
    });

    if (user?.storeId && schedule.completedByStoreId && user.storeId !== schedule.completedByStoreId) {
      return NextResponse.json(
        { success: false, message: "This order is not assigned to your store.", accessDenied: true },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        id: schedule.id,
        scheduleDate: schedule.scheduleDate,
        supplier: schedule.supplier,
        type: schedule.type,
        item: schedule.item,
        store: schedule.store,
        quantity: schedule.quantity,
        unitPrice: schedule.unitPrice,
        totalPrice: schedule.totalPrice,
        gstAmount: schedule.gstAmount,
        totalWithGst: schedule.totalWithGst,
        orderDeliveryDate: schedule.orderDeliveryDate,
        status: schedule.status,
        notes: schedule.notes,
        completedAt: schedule.completedAt,
        completedBy: schedule.completedBy,
        completedByStore: schedule.completedByStore,
        createdAt: schedule.createdAt,
      },
    });
  } catch (error) {
    console.error("QR Scan error:", error);
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}
