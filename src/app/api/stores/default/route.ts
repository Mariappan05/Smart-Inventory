import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const { storeId } = await request.json();

    if (!storeId) {
      return NextResponse.json(
        { success: false, error: "Store ID is required" },
        { status: 400 }
      );
    }

    // Unset all default stores
    await prisma.store.updateMany({
      where: { isDefault: true },
      data: { isDefault: false },
    });

    // Set the new default store
    const store = await prisma.store.update({
      where: { id: storeId },
      data: { isDefault: true },
    });

    return NextResponse.json({
      success: true,
      data: store,
      message: "Default store updated successfully",
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Failed to set default store" },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const defaultStore = await prisma.store.findFirst({
      where: { isDefault: true },
    });

    return NextResponse.json({
      success: true,
      data: defaultStore,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Failed to fetch default store" },
      { status: 500 }
    );
  }
}
