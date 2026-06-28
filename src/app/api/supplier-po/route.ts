import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAuthToken } from "@/lib/auth/jwt";
import { authCookieName } from "@/lib/auth/session";

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get(authCookieName)?.value;
    if (!token) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const payload = verifyAuthToken(token);

    const pos = await prisma.supplierPO.findMany({
      orderBy: { createdAt: "desc" },
    });

    // For non-admin: mask price fields
    const isAdmin = payload.role === "ADMIN";
    const sanitized = pos.map((po) => ({
      ...po,
      totalAmount: isAdmin ? po.totalAmount : null,
      _priceHidden: !isAdmin,
    }));

    return NextResponse.json({ success: true, data: sanitized });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || "Failed to fetch supplier POs" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get(authCookieName)?.value;
    if (!token) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const payload = verifyAuthToken(token);
    if (!["ADMIN", "STORE_MANAGER"].includes(payload.role)) {
      return NextResponse.json({ success: false, message: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { poNumber, supplierName, supplierCode, totalAmount, notes, pdfUrl, pdfFileName } = body;

    if (!supplierName) {
      return NextResponse.json(
        { success: false, message: "Supplier name is required" },
        { status: 400 }
      );
    }

    // Only ADMIN can set price
    const resolvedAmount =
      payload.role === "ADMIN" && totalAmount !== undefined && totalAmount !== null
        ? parseFloat(totalAmount)
        : null;

    const po = await prisma.supplierPO.create({
      data: {
        poNumber: poNumber || `PO-${Date.now()}`,
        supplierName,
        supplierCode: supplierCode || null,
        totalAmount: resolvedAmount,
        notes: notes || null,
        pdfUrl: pdfUrl || null,
        pdfFileName: pdfFileName || null,
        createdById: payload.sub,
      },
    });

    return NextResponse.json({ success: true, data: po });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || "Failed to create supplier PO" },
      { status: 500 }
    );
  }
}
