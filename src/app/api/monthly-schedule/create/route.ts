import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth/permissions";
import { getStoreIdForCreate } from "@/lib/storeFiltering";

export async function POST(request: NextRequest) {
  const authResult = await requireAuth(request);
  if (authResult instanceof NextResponse) return authResult;
  const session = authResult;

  // Check role permissions
  if (!["ADMIN", "ADMIN_MANAGER", "STORE_MANAGER"].includes(session.role || "")) {
    return NextResponse.json(
      { success: false, message: "Forbidden" }, 
      { status: 403 }
    );
  }

  try {
    const body = await request.json();
    const { customerName, componentName, componentCode, quantity, scheduleType } = body;

    // Validation
    if (!customerName?.trim() || !componentName?.trim() || !componentCode?.trim() || !quantity) {
      return NextResponse.json(
        { success: false, message: "Missing required fields" },
        { status: 400 }
      );
    }

    const storeId = getStoreIdForCreate(session);
    if (!storeId) {
      return NextResponse.json(
        { success: false, message: "Store assignment required" },
        { status: 400 }
      );
    }

    // Get a default supplier from user's store
    const defaultSupplier = await prisma.supplier.findFirst({
      where: { storeId }
    });
    if (!defaultSupplier) {
      return NextResponse.json(
        { success: false, message: "No supplier configured in your store" },
        { status: 400 }
      );
    }

    // Get a default type from user's store
    const defaultType = await prisma.type.findFirst({
      where: { storeId }
    });
    if (!defaultType) {
      return NextResponse.json(
        { success: false, message: "No type configured in your store" },
        { status: 400 }
      );
    }

    // Get a default item from user's store
    const defaultItem = await prisma.item.findFirst({
      where: { storeId }
    });
    if (!defaultItem) {
      return NextResponse.json(
        { success: false, message: "No item configured in your store" },
        { status: 400 }
      );
    }

    // Create the schedule
    const schedule = await prisma.schedule.create({
      data: {
        scheduleDate: new Date(),
        orderDeliveryDate: new Date(),
        supplierId: defaultSupplier.id,
        typeId: defaultType.id,
        itemId: defaultItem.id,
        storeId,
        quantity: parseInt(quantity),
        unitPrice: 0,
        totalPrice: 0,
        gstAmount: 0,
        totalWithGst: 0,
        status: "TENTATIVE",
        isMonthlySchedule: true,
        customerName,
        componentName,
        componentCode,
        scheduleType,
        createdById: session.userId,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Schedule created successfully",
      schedule,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: "Failed to create schedule" },
      { status: 500 }
    );
  }
}
