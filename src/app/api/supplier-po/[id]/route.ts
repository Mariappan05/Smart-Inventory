import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAuthToken } from "@/lib/auth/jwt";
import { authCookieName } from "@/lib/auth/session";

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const token = request.cookies.get(authCookieName)?.value;
    if (!token) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const payload = verifyAuthToken(token);
    if (!["ADMIN", "STORE_MANAGER"].includes(payload.role)) {
      return NextResponse.json({ success: false, message: "Forbidden" }, { status: 403 });
    }

    const poId = params.id;

    const po = await prisma.supplierPO.delete({
      where: { id: poId },
    });

    return NextResponse.json({ success: true, data: po });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || "Failed to delete supplier PO" },
      { status: 500 }
    );
  }
}
