import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, requireAdmin } from "@/lib/auth/permissions";

export async function GET(request: NextRequest) {
  const authResult = await requireAuth(request);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const stores = await prisma.store.findMany({
      orderBy: { name: "asc" },
    });

    // Back-compat: treat "store rooms" as "stores"
    return NextResponse.json(stores);
  } catch (error) {
    return NextResponse.json(
      { message: "Failed to fetch store rooms" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const authResult = await requireAdmin(request);
  if (authResult instanceof NextResponse) return authResult;
  try {
    const body = await request.json();
    const { name } = body as { name?: string };

    if (!name) {
      return NextResponse.json(
        { success: false, message: "Name is required" },
        { status: 400 }
      );
    }

    // Generate auto-incremented code
    const lastStoreRoom = await prisma.store.findFirst({
      orderBy: { code: "desc" },
      select: { code: true },
    });

    let nextCode = "S001";
    if (lastStoreRoom?.code) {
      const match = lastStoreRoom.code.match(/S(\d+)/);
      if (match) {
        const number = parseInt(match[1], 10) + 1;
        nextCode = `S${String(number).padStart(3, "0")}`;
      }
    }

    const storeRoom = await prisma.store.create({
      data: { name, code: nextCode },
    });

    return NextResponse.json({ success: true, data: storeRoom });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: "Failed to create store room" },
      { status: 500 }
    );
  }
}
