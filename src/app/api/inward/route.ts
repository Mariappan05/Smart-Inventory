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

    verifyAuthToken(token);

    const entries = await prisma.inwardEntry.findMany({
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    return NextResponse.json({ success: true, data: entries });
  } catch (error: any) {
    console.error("Failed to fetch inward entries:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Failed to fetch inward entries" },
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
    if (!["INWARD_PERSON", "ADMIN", "STORE_MANAGER"].includes(payload.role)) {
      return NextResponse.json({ success: false, message: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { items } = body;

    // Check if it's a batch request or single item
    if (items && Array.isArray(items) && items.length > 0) {
      // Batch create inward entries
      const createdEntries = await Promise.all(
        items.map((item: any) =>
          prisma.inwardEntry.create({
            data: {
              poNumber: item.poNumber || null,
              invoiceNumber: item.invoiceNumber || null,
              invoiceDate: item.invoiceDate || null,
              productDetails: {
                productId: item.productId,
                quantity: item.quantity,
              },
              qrCode: item.qrCode || null,
              barcode: item.barcode || null,
              storeId: payload.storeId || null,
              createdById: payload.sub,
            },
          })
        )
      );

      return NextResponse.json({
        success: true,
        data: createdEntries,
        message: `${createdEntries.length} items recorded successfully`,
      });
    } else {
      // Single item creation (backward compatibility)
      const {
        poNumber,
        invoiceNumber,
        invoiceDate,
        productDetails,
        qrCode,
        barcode,
        storeId,
      } = body;

      const entry = await prisma.inwardEntry.create({
        data: {
          poNumber: poNumber || null,
          invoiceNumber: invoiceNumber || null,
          invoiceDate: invoiceDate || null,
          productDetails: productDetails || {},
          qrCode: qrCode || null,
          barcode: barcode || null,
          storeId: storeId || payload.storeId || null,
          createdById: payload.sub,
        },
      });

      return NextResponse.json({ success: true, data: entry });
    }
  } catch (error: any) {
    console.error("Failed to create inward entry:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Failed to create inward entry" },
      { status: 500 }
    );
  }
}
