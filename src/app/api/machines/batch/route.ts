import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth/permissions";

export async function POST(request: NextRequest) {
  const authResult = await requireAuth(request);
  if (authResult instanceof NextResponse) return authResult;
  const session = authResult;

  try {
    const body = await request.json();
    const { machines } = body;

    if (!machines || !Array.isArray(machines) || machines.length === 0) {
      return NextResponse.json(
        { success: false, error: "No machines provided" },
        { status: 400 }
      );
    }

    // Create all machines
    const createdMachines = await Promise.all(
      machines.map((machine) =>
        prisma.machine.create({
          data: {
            name: machine.name,
            code: machine.code,
            storeId: machine.storeId,
            createdById: session.userId,
          },
          select: {
            id: true,
            name: true,
            code: true,
            store: {
              select: {
                id: true,
                name: true,
                code: true,
              },
            },
          },
        })
      )
    );

    return NextResponse.json({
      success: true,
      data: createdMachines,
      message: `${createdMachines.length} machine(s) created successfully`,
    });
  } catch (error) {
    console.error("Failed to create machines:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create machines" },
      { status: 500 }
    );
  }
}
