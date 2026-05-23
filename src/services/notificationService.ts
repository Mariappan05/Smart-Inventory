import { prisma } from "@/lib/prisma";

export type NotificationType = "order_created" | "order_allocated" | "order_completed" | "order_delivered" | "order_closed";

export async function createNotification(
  userId: string,
  title: string,
  message: string,
  type: NotificationType,
  productId?: string
) {
  try {
    const notification = await prisma.notification.create({
      data: {
        userId,
        title,
        message,
        type,
        productId,
      },
    });
    return notification;
  } catch (error) {
    console.error("Error creating notification:", error);
    return null;
  }
}

export async function notifyPlantAdminsForNewOrder(
  targetStoreId: string,
  sourceStoreName: string,
  itemName: string,
  quantity: number,
  scheduleId: string
) {
  try {
    const admins = await prisma.user.findMany({
      where: { storeId: targetStoreId, role: "ADMIN" },
    });

    await Promise.all(
      admins.map((admin) =>
        createNotification(
          admin.id,
          "New Order Created",
          `${sourceStoreName} has created a new schedule for ${itemName} (Qty: ${quantity}).`,
          "order_created",
          undefined
        )
      )
    );
    return true;
  } catch (error) {
    console.error("Error notifying store admins:", error);
    return false;
  }
}

export async function notifyPlantAdminOrderAllocated(
  targetStoreId: string,
  sourceStoreName: string,
  itemName: string,
  quantity: number,
  scheduleId: string
) {
  try {
    const admins = await prisma.user.findMany({
      where: { storeId: targetStoreId, role: "ADMIN" },
    });

    await Promise.all(
      admins.map((admin) =>
        createNotification(
          admin.id,
          "Order Allocated to You",
          `This order has been allocated to you. ${sourceStoreName} requires ${itemName} (Qty: ${quantity}). Please scan the QR code to confirm delivery.`,
          "order_allocated",
          undefined
        )
      )
    );
    return true;
  } catch (error) {
    console.error("Error notifying allocated order:", error);
    return false;
  }
}

export async function notifySourcePlantOrderClosed(
  sourceStoreId: string,
  deliveredByAdminName: string,
  deliveredByStoreName: string,
  itemName: string
) {
  try {
    const admins = await prisma.user.findMany({
      where: { storeId: sourceStoreId, role: "ADMIN" },
    });

    await Promise.all(
      admins.map((admin) =>
        createNotification(
          admin.id,
          "Order Closed",
          `${deliveredByStoreName} admin (${deliveredByAdminName}) has confirmed delivery of ${itemName}. The order is now closed.`,
          "order_closed",
          undefined
        )
      )
    );
    return true;
  } catch (error) {
    console.error("Error notifying order closed:", error);
    return false;
  }
}

export async function getUserNotifications(userId: string, limit = 50) {
  try {
    return await prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: limit,
    });
  } catch (error) {
    console.error("Error fetching notifications:", error);
    return [];
  }
}

export async function markNotificationAsRead(notificationId: string) {
  try {
    return await prisma.notification.update({
      where: { id: notificationId },
      data: { isRead: true },
    });
  } catch (error) {
    console.error("Error marking notification as read:", error);
    return null;
  }
}
