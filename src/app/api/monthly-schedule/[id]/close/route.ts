import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { authCookieName } from "@/lib/auth/session";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

export async function POST(
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

    const decoded = jwt.verify(token, JWT_SECRET) as { role?: string; sub?: string };
    if (!["ADMIN", "ADMIN_MANAGER", "STORE_MANAGER"].includes(decoded.role || "")) {
      return NextResponse.json(
        { success: false, message: "Forbidden" },
        { status: 403 }
      );
    }

    // Close the schedule
    const schedule = await prisma.schedule.update({
      where: { id },
      data: {
        status: "CLOSED",
        completedAt: new Date(),
        completedById: decoded.sub,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Schedule closed successfully",
      schedule,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: "Failed to close schedule" },
      { status: 500 }
    );
  }
}
