import { prisma } from "@/lib/prisma";

/**
 * Check if it's the 25th of the month and send tentative schedule reminders
 */
export async function checkAndSendTentativeReminders() {
  const today = new Date();
  const dayOfMonth = today.getDate();

  // Check if today is the 25th
  if (dayOfMonth !== 25) {
    return { sent: false, message: "Not the 25th of the month" };
  }

  try {
    // Get all tentative monthly schedules that haven't had reminders sent
    const tentativeSchedules = await prisma.schedule.findMany({
      where: {
        isMonthlySchedule: true,
        scheduleType: "TENTATIVE_MONTHLY",
        reminderSent: false,
      },
      select: {
        id: true,
        customerName: true,
      },
    });

    if (tentativeSchedules.length === 0) {
      return { sent: false, message: "No tentative schedules found" };
    }

    // Mark all as reminder sent
    await prisma.schedule.updateMany({
      where: {
        isMonthlySchedule: true,
        scheduleType: "TENTATIVE_MONTHLY",
        reminderSent: false,
      },
      data: {
        reminderSent: true,
      },
    });

    // Create notifications for all users with appropriate roles
    // Note: Notification types are currently limited to order-related types in the schema
    // TODO: Add SCHEDULE_REMINDER to NotificationType enum if schedule notifications are needed
    const users = await prisma.user.findMany({
      where: {
        role: {
          in: ["ADMIN", "ADMIN_MANAGER", "STORE_MANAGER"],
        },
        isActive: true,
      },
    });

    // Temporarily disabled until NotificationType enum includes schedule reminder type
    // const notifications = users.map((user: any) => ({
    //   userId: user.id,
    //   title: "Tentative Schedule Reminder",
    //   message: `Please review and update ${tentativeSchedules.length} tentative schedule(s)`,
    //   type: "order_created",
    // }));

    // if (notifications.length > 0) {
    //   await prisma.notification.createMany({
    //     data: notifications,
    //   });
    // }

    return {
      sent: true,
      count: tentativeSchedules.length,
      message: `Reminders sent for ${tentativeSchedules.length} tentative schedule(s)`,
    };
  } catch (error) {
    console.error("Error sending tentative reminders:", error);
    return { sent: false, message: "Error sending reminders" };
  }
}

/**
 * Check if it's the 5th of the month and send final schedule editing reminders
 */
export async function checkAndSendFinalReminders() {
  const today = new Date();
  const dayOfMonth = today.getDate();

  // Check if today is the 5th
  if (dayOfMonth !== 5) {
    return { sent: false, message: "Not the 5th of the month" };
  }

  try {
    // Check if there are any tentative schedules
    const tentativeSchedules = await prisma.schedule.findMany({
      where: {
        isMonthlySchedule: true,
        scheduleType: "TENTATIVE_MONTHLY",
      },
      select: {
        id: true,
      },
    });

    // Only send reminders if tentative schedules exist
    if (tentativeSchedules.length === 0) {
      return { sent: false, message: "No tentative schedules available" };
    }

    // Create notifications for all users with appropriate roles
    // Note: Notification types are currently limited to order-related types in the schema
    // TODO: Add FINAL_SCHEDULE_REMINDER to NotificationType enum if schedule notifications are needed
    const users = await prisma.user.findMany({
      where: {
        role: {
          in: ["ADMIN", "ADMIN_MANAGER", "STORE_MANAGER"],
        },
        isActive: true,
      },
    });

    // Temporarily disabled until NotificationType enum includes schedule reminder type
    // const notifications = users.map((user: any) => ({
    //   userId: user.id,
    //   title: "Final Schedule Reminder",
    //   message: `Please review and finalize ${tentativeSchedules.length} tentative schedule(s)`,
    //   type: "order_created",
    // }));

    // if (notifications.length > 0) {
    //   await prisma.notification.createMany({
    //     data: notifications,
    //   });
    // }

    return {
      sent: true,
      count: tentativeSchedules.length,
      message: `Final schedule reminders sent for ${tentativeSchedules.length} schedule(s)`,
    };
  } catch (error) {
    console.error("Error sending final reminders:", error);
    return { sent: false, message: "Error sending reminders" };
  }
}

/**
 * Check both reminders - can be called from a scheduled job
 */
export async function checkAndSendScheduleReminders() {
  const tentativeResult = await checkAndSendTentativeReminders();
  const finalResult = await checkAndSendFinalReminders();

  return {
    tentative: tentativeResult,
    final: finalResult,
  };
}
