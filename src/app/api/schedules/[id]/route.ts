import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin, getUserSession } from "@/lib/auth/permissions";
import { notifyPlantAdminOrderAllocated, notifySourcePlantOrderClosed } from "@/services/notificationService";

const GST_RATE = 0.18;

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAdmin(request);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const { id } = await params;
    const body = await request.json();
    const { scheduleDate, supplierId, itemId, storeId, quantity, unitPrice, orderDeliveryDate, status, notes, targetPlantId, itemName } = body;

    const updateData: any = {};

    if (scheduleDate) updateData.scheduleDate = new Date(scheduleDate);
    if (supplierId) updateData.supplierId = supplierId;
    if (body.typeId) updateData.typeId = body.typeId;
    if (itemId) updateData.itemId = itemId;
    if (storeId) updateData.storeId = storeId;
    if (orderDeliveryDate) updateData.orderDeliveryDate = new Date(orderDeliveryDate);
    if (notes !== undefined) updateData.notes = notes;

    if (quantity || unitPrice) {
      const currentSchedule = await prisma.schedule.findUnique({ where: { id } });
      if (!currentSchedule) {
        return NextResponse.json(
          { success: false, message: "Schedule not found" },
          { status: 404 }
        );
      }

      const newQuantity = quantity ? parseInt(quantity) : currentSchedule.quantity;
      const newUnitPrice = unitPrice ? parseFloat(unitPrice) : currentSchedule.unitPrice;

      updateData.quantity = newQuantity;
      updateData.unitPrice = newUnitPrice;
      updateData.totalPrice = newQuantity * newUnitPrice;
      updateData.gstAmount = updateData.totalPrice * GST_RATE;
      updateData.totalWithGst = updateData.totalPrice + updateData.gstAmount;
    }

    // Handle status transitions
    if (status === "COMPLETED") {
      updateData.status = "COMPLETED";
      updateData.completedAt = new Date();

      const session = await getUserSession(request);
      if (session) {
        updateData.completedById = session.userId;
        const user = await prisma.user.findUnique({
          where: { id: session.userId },
          select: { storeId: true },
        });
        if (user?.storeId) updateData.completedByStoreId = user.storeId;
      }

      // Notify the target plant admin that the order is allocated to them
      const sourceSchedule = await prisma.schedule.findUnique({
        where: { id },
        include: { store: true, item: true },
      });
      if (sourceSchedule) {
        await notifyPlantAdminOrderAllocated(
          sourceSchedule.storeId,
          sourceSchedule.store.name,
          sourceSchedule.item.name,
          sourceSchedule.quantity,
          id
        );
      }
    } else if (status === "DELIVERED") {
      // QR scan confirmed — mark as CLOSED immediately
      updateData.status = "CLOSED";
      updateData.deliveredAt = new Date();

      const session = await getUserSession(request);
      if (session) {
        updateData.deliveredById = session.userId;
      }

      const schedule = await prisma.schedule.findUnique({
        where: { id },
        include: { store: true, item: true, completedBy: true, completedByStore: true },
      });

      if (schedule?.completedBy && schedule?.completedByStore) {
        await notifySourcePlantOrderClosed(
          schedule.storeId,
          schedule.completedBy.name,
          schedule.completedByStore.name,
          schedule.item.name
        );
      }
    } else if (status === "FINAL" || status === "EXPIRED" || status === "CLOSED") {
      updateData.status = status;
    }

    const schedule = await prisma.schedule.update({
      where: { id },
      data: updateData,
      include: {
        supplier: true,
        item: true,
        store: true,
        completedBy: { select: { id: true, name: true } },
        completedByStore: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json({ success: true, data: schedule });
  } catch (error) {
    console.error("Failed to update schedule:", error);
    return NextResponse.json(
      { success: false, message: "Failed to update schedule" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAdmin(request);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const { id } = await params;

    await prisma.schedule.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: "Schedule deleted" });
  } catch (error) {
    console.error("Failed to delete schedule:", error);
    return NextResponse.json(
      { success: false, message: "Failed to delete schedule" },
      { status: 500 }
    );
  }
}
