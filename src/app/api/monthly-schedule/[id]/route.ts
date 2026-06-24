import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { authCookieName } from "@/lib/auth/session";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(authCookieName)?.value;
    const { id } = await params;

    if (!token) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const decoded = jwt.verify(token, JWT_SECRET) as { role?: string };
    if (!["ADMIN", "ADMIN_MANAGER", "STORE_MANAGER"].includes(decoded.role || "")) {
      return NextResponse.json(
        { success: false, message: "Forbidden" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { customerName, componentName, componentCode, quantity } = body;

    // Validation
    if (!customerName?.trim() || !componentName?.trim() || !componentCode?.trim() || !quantity) {
      return NextResponse.json(
        { success: false, message: "Missing required fields" },
        { status: 400 }
      );
    }

    // Update the schedule
    const schedule = await prisma.schedule.update({
      where: { id },
      data: {
        customerName,
        componentName,
        componentCode,
        quantity: parseInt(quantity),
      },
    });

    return NextResponse.json({
      success: true,
      message: "Schedule updated successfully",
      schedule,
    });
  } catch (error) {
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
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(authCookieName)?.value;
    const { id } = await params;

    if (!token) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const decoded = jwt.verify(token, JWT_SECRET) as { role?: string };
    if (!["ADMIN", "ADMIN_MANAGER", "STORE_MANAGER"].includes(decoded.role || "")) {
      return NextResponse.json(
        { success: false, message: "Forbidden" },
        { status: 403 }
      );
    }

    // Delete the schedule
    await prisma.schedule.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: "Schedule deleted successfully",
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: "Failed to delete schedule" },
      { status: 500 }
    );
  }
}
