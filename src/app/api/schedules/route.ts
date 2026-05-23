import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin, getUserSession } from "@/lib/auth/permissions";
import { notifyPlantAdminsForNewOrder } from "@/services/notificationService";
import { getStoreWhereClause, getStoreIdForCreate } from "@/lib/storeFiltering";

const GST_RATE = 0.18;

export async function GET(request: NextRequest) {
  const authResult = await requireAdmin(request);
  if (authResult instanceof NextResponse) return authResult;
  const session = authResult;

  try {
    const url = new URL(request.url);
    const status = url.searchParams.get("status");
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let where: any = {
      ...getStoreWhereClause(session),
    };

    if (status === "TENTATIVE") {
      where.status = "TENTATIVE";
    } else if (status === "FINAL") {
      where.status = { in: ["TENTATIVE", "FINAL"] };
      where.orderDeliveryDate = { gte: today };
    } else if (status === "EXPIRED") {
      where.status = { in: ["TENTATIVE", "FINAL"] };
      where.orderDeliveryDate = { lt: today };
    } else if (status === "COMPLETED") {
      where.status = { in: ["COMPLETED", "DELIVERED", "CLOSED"] };
    }

    const schedules = await prisma.schedule.findMany({
      where,
      include: {
        supplier: { select: { id: true, name: true, code: true } },
        type: { select: { id: true, name: true } },
        item: { select: { id: true, name: true } },
        store: { select: { id: true, name: true } },
        completedBy: { select: { id: true, name: true, employeeNo: true } },
        completedByStore: { select: { id: true, name: true } },
        deliveredBy: { select: { id: true, name: true, employeeNo: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, data: schedules });
  } catch (error) {
    console.error("Failed to fetch schedules:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch schedules" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const authResult = await requireAdmin(request);
  if (authResult instanceof NextResponse) return authResult;
  const session = authResult;

  try {
    const body = await request.json();
    let { scheduleDate, supplierId, typeId, itemId, storeId, quantity, unitPrice, orderDeliveryDate } = body;

    // If user doesn't have access to all stores, use their assigned store
    if (session.storeId && !storeId) {
      storeId = session.storeId;
    }

    if (!scheduleDate || !supplierId || !itemId || !storeId || quantity === undefined || unitPrice === undefined || !orderDeliveryDate) {
      return NextResponse.json(
        { success: false, message: "All fields are required" },
        { status: 400 }
      );
    }

    const unitPriceValue = parseFloat(unitPrice);
    const quantityValue = parseInt(quantity);
    const totalPrice = quantityValue * unitPriceValue;
    const gstAmount = totalPrice * GST_RATE;
    const totalWithGst = totalPrice + gstAmount;

    const item = await prisma.item.findUnique({ where: { id: itemId } });

    // VALIDATION: Only create schedule if stock < minimum quantity
    if (!item) {
      return NextResponse.json(
        { success: false, message: "Item not found" },
        { status: 404 }
      );
    }

    if (item.stockQuantity >= item.minimumQuantity) {
      return NextResponse.json(
        { success: false, message: `Cannot create schedule. Current stock (${item.stockQuantity}) is not below minimum (${item.minimumQuantity}). Schedule will be auto-created when stock drops below minimum.` },
        { status: 400 }
      );
    }

    // Get or create type from item variant
    let finalTypeId = typeId;
    if (!finalTypeId && item.variant) {
      const typeName = item.variant.split(" - ")[0];
      let type = await prisma.type.findFirst({
        where: {
          name: typeName,
          supplierId: supplierId,
          storeId,
        },
      });

      if (!type) {
        type = await prisma.type.create({
          data: {
            name: typeName,
            supplierId: supplierId,
            storeId,
            createdById: session.userId,
          },
        });
      }
      finalTypeId = type.id;
    }

    if (!finalTypeId) {
      return NextResponse.json(
        { success: false, message: "Type information is missing" },
        { status: 400 }
      );
    }

    // Get the creator's own store for the notification source name
    const creatorStore = session
      ? await prisma.user.findUnique({
          where: { id: session.userId },
          select: { store: { select: { name: true } } },
        })
      : null;
    const sourceStoreName = creatorStore?.store?.name ?? "Headquarters";

    const schedule = await prisma.schedule.create({
      data: {
        scheduleDate: new Date(scheduleDate),
        supplierId,
        typeId: finalTypeId,
        itemId,
        storeId,
        quantity: parseInt(quantity),
        unitPrice: parseFloat(unitPrice),
        totalPrice,
        gstAmount,
        totalWithGst,
        orderDeliveryDate: new Date(orderDeliveryDate),
        status: "TENTATIVE",
        createdById: session.userId, // Save logged-in user ID
      },
      include: {
        supplier: true,
        type: true,
        item: true,
        store: true,
      },
    });

    if (item) {
      await notifyPlantAdminsForNewOrder(
        storeId,
        sourceStoreName,
        item.name,
        quantityValue,
        schedule.id
      );
    }

    return NextResponse.json({ success: true, data: schedule }, { status: 201 });
  } catch (error) {
    console.error("Failed to create schedule:", error);
    return NextResponse.json(
      { success: false, message: "Failed to create schedule" },
      { status: 500 }
    );
  }
}
