import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth/permissions";

export async function POST(request: NextRequest) {
  const authResult = await requireAdmin(request);
  if (authResult instanceof NextResponse) return authResult;
  const session = authResult;

  try {
    const body = await request.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Tentative schedule ID is required" },
        { status: 400 }
      );
    }

    // Retrieve tentative monthly schedule with nested items and tools
    const tentativeSchedule = await prisma.tentativeMonthlySchedule.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            component: true,
            tools: {
              include: {
                tool: {
                  include: {
                    item: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!tentativeSchedule) {
      return NextResponse.json(
        { success: false, error: "Tentative schedule not found" },
        { status: 404 }
      );
    }

    const storeId = tentativeSchedule.storeId;
    if (!storeId) {
      return NextResponse.json(
        { success: false, error: "Tentative schedule is not associated with a store" },
        { status: 400 }
      );
    }

    // Fetch store details to get the store code
    const store = await prisma.store.findUnique({
      where: { id: storeId },
    });
    const storeCode = store?.code || "STORE";

    // Fallback supplier & type in case they are missing in tool items
    const fallbackSupplier = await prisma.supplier.findFirst({ where: { storeId } });
    const fallbackType = await prisma.type.findFirst({ where: { storeId } });

    // Group the items' tools by supplierCode
    const toolsBySupplier: Record<
      string,
      Array<{
        tool: any;
        quantity: number;
        componentName: string;
        componentCode: string;
      }>
    > = {};

    for (const item of tentativeSchedule.items) {
      for (const itemTool of item.tools) {
        const tool = itemTool.tool;
        const supplierCode = tool.supplierCode || "UNKNOWN";

        if (!toolsBySupplier[supplierCode]) {
          toolsBySupplier[supplierCode] = [];
        }

        const existingToolEntry = toolsBySupplier[supplierCode].find(
          (t) => t.tool.toolName === tool.toolName
        );

        if (existingToolEntry) {
          existingToolEntry.quantity += itemTool.quantity;
          if (!existingToolEntry.componentName.includes(item.component.name)) {
            existingToolEntry.componentName += `, ${item.component.name}`;
          }
          const codeStr = item.component.itemCode || "N/A";
          if (!existingToolEntry.componentCode.includes(codeStr)) {
            existingToolEntry.componentCode += `, ${codeStr}`;
          }
        } else {
          toolsBySupplier[supplierCode].push({
            tool,
            quantity: itemTool.quantity,
            componentName: item.component.name,
            componentCode: item.component.itemCode || "N/A",
          });
        }
      }
    }

    const createdSchedules = [];

    // Loop through each supplier group and generate a schedule/bill
    for (const [supplierCode, toolItems] of Object.entries(toolsBySupplier)) {
      // 1. Find Supplier
      let supplier = await prisma.supplier.findFirst({
        where: { code: supplierCode, storeId },
      });
      if (!supplier) {
        supplier = await prisma.supplier.findFirst({
          where: { code: supplierCode },
        });
      }
      const actualSupplier = supplier || fallbackSupplier;
      if (!actualSupplier) {
        return NextResponse.json(
          { success: false, error: `No supplier found or configured for code ${supplierCode}` },
          { status: 400 }
        );
      }

      // 2. Generate unique Schedule Number (SH-[StoreCode]-[Year][SequentialNumber])
      const year = new Date().getFullYear().toString().slice(-2);
      const prefix = `SH-${storeCode}-${year}`;
      
      const count = await prisma.schedule.count({
        where: {
          supplierBillNumber: {
            startsWith: prefix,
          },
        },
      });
      
      const sequentialNumber = String(count + 1).padStart(7, "0");
      const scheduleNo = `${prefix}${sequentialNumber}`;
      const poRef = `-${1500000 + count + 1}`;

      // 3. Create Schedule record for each tool under this supplier
      for (const entry of toolItems) {
        const { tool, quantity, componentName, componentCode } = entry;
        
        const unitPrice = tool.rate || 0;
        const totalPrice = unitPrice * quantity;
        const gstAmount = totalPrice * 0.18; // Standard 18% GST
        const totalWithGst = totalPrice + gstAmount;

        const typeId = tool.item.typeId || fallbackType?.id;
        if (!typeId) {
          return NextResponse.json(
            { success: false, error: "No item type configured in store" },
            { status: 400 }
          );
        }

        const schedule = await prisma.schedule.create({
          data: {
            scheduleDate: new Date(),
            orderDeliveryDate: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0), // End of current month
            supplierId: actualSupplier.id,
            typeId,
            itemId: tool.itemId,
            storeId,
            quantity,
            unitPrice,
            totalPrice,
            gstAmount,
            totalWithGst,
            status: "FINAL",
            isMonthlySchedule: true,
            customerName: tentativeSchedule.customerName,
            componentName,
            componentCode,
            scheduleType: "FINAL_MONTHLY",
            supplierBillNumber: scheduleNo, // Set the generated schedule no
            createdById: session.userId,
            notes: `P.O. Ref: ${poRef}`,
          },
        });

        createdSchedules.push(schedule);
      }
    }

    // 4. Delete the tentative schedule from database (migrated to Final Plan)
    await prisma.tentativeMonthlySchedule.delete({
      where: { id: tentativeSchedule.id },
    });

    return NextResponse.json({
      success: true,
      message: "Monthly schedule confirmed and moved to Final Plan successfully",
      schedulesCount: createdSchedules.length,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to confirm schedule" },
      { status: 500 }
    );
  }
}
