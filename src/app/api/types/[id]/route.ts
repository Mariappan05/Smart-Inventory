import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function DELETE(
  req: NextRequest,
  context: { params: { id: string } | Promise<{ id: string }> }
) {
  const { id } = await Promise.resolve(context.params);

  if (!id) {
    return NextResponse.json({ success: false, message: "Missing id" }, { status: 400 });
  }

  try {
    await prisma.type.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    if (error?.code === "P2003") {
      return NextResponse.json(
        { success: false, message: "Cannot delete type because it is referenced by products" },
        { status: 409 }
      );
    }

    if (error?.code === "P2025") {
      return NextResponse.json({ success: false, message: "Type not found" }, { status: 404 });
    }

    return NextResponse.json({ success: false, message: "Failed to delete type" }, { status: 500 });
  }
}
