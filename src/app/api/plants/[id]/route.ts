import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireStrictAdmin } from "@/lib/auth/permissions";

export async function DELETE(
  req: NextRequest,
  context: { params: { id: string } | Promise<{ id: string }> }
) {
  const authResult = await requireStrictAdmin(req);
  if (authResult instanceof NextResponse) return authResult;

  const { id } = await Promise.resolve(context.params);

  if (!id) {
    return NextResponse.json({ success: false, message: "Missing id" }, { status: 400 });
  }

  try {
    await prisma.store.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    if (error?.code === "P2003") {
      return NextResponse.json(
        { success: false, message: "Cannot delete store because it is referenced by products/logs" },
        { status: 409 }
      );
    }

    if (error?.code === "P2025") {
      return NextResponse.json({ success: false, message: "Store not found" }, { status: 404 });
    }

    return NextResponse.json({ success: false, message: "Failed to delete store" }, { status: 500 });
  }
}
