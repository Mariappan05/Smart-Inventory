import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireStrictAdmin } from "@/lib/auth/permissions";

export async function GET() {
  try {
    const stores = await prisma.store.findMany({
      select: {
        id: true,
        name: true,
        code: true,
        createdAt: true,
        users: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        _count: {
          select: {
            products: true,
            items: true,
          },
        },
      },
      orderBy: { name: "asc" },
    });

    return NextResponse.json({ success: true, data: stores });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch stores" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const authResult = await requireStrictAdmin(request);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const body = await request.json();
    const { name } = body;

    if (!name) {
      return NextResponse.json(
        { success: false, error: "Name is required", message: "Name is required" },
        { status: 400 }
      );
    }

    // Check for duplicate
    const existing = await prisma.store.findUnique({
      where: { name },
    });

    if (existing) {
      return NextResponse.json(
        {
          success: false,
          error: "Duplicate store",
          message: `Store "${name}" already exists. Please use a different name.`,
        },
        { status: 409 }
      );
    }

    // Generate auto-incremented code
    const lastStore = await prisma.store.findFirst({
      orderBy: { code: "desc" },
      select: { code: true },
    });

    let nextCode = "S001";
    if (lastStore?.code) {
      const match = lastStore.code.match(/S(\d+)/);
      if (match) {
        const number = parseInt(match[1], 10) + 1;
        nextCode = `S${String(number).padStart(3, "0")}`;
      }
    }

    const store = await prisma.store.create({
      data: { name, code: nextCode },
    });

    return NextResponse.json({ success: true, data: store }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Failed to create store", message: "Failed to create store" },
      { status: 500 }
    );
  }
}
