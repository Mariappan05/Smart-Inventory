import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin, getUserSession } from "@/lib/auth/permissions";
import { getStoreWhereClause } from "@/lib/storeFiltering";

export async function GET(request: NextRequest) {
  const authResult = await requireAdmin(request);
  if (authResult instanceof NextResponse) return authResult;
  const session = authResult;

  try {
    const { searchParams } = new URL(request.url);
    const scheduleType = searchParams.get("type");

    const where: any = { 
      isMonthlySchedule: true,
      ...getStoreWhereClause(session),
    };
    if (scheduleType) {
      where.scheduleType = scheduleType;
    }

    const schedules = await prisma.schedule.findMany({
      where,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        customerName: true,
        componentName: true,
        componentCode: true,
        quantity: true,
        scheduleType: true,
        status: true,
        createdAt: true,
        store: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json({
      success: true,
      schedules,
    });
  } catch (error) {
    console.error("Error fetching schedules:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch schedules" },
      { status: 500 }
    );
  }
}
