import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAuthToken } from "@/lib/auth/jwt";
import { authCookieName } from "@/lib/auth/session";

// Force dynamic rendering
export const dynamic = 'force-dynamic';
export const revalidate = 0;

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
        items.map((item: any) => {
          const expected = item.expectedQuantity != null ? parseInt(item.expectedQuantity) : parseInt(item.quantity);
          const received = item.receivedQuantity != null ? parseInt(item.receivedQuantity) : parseInt(item.quantity);
          const status = received < expected ? "PENDING" : "COMPLETED";
          
          let missingList = item.missingProducts;
          if (!missingList && received < expected) {
            missingList = [
              {
                productName: item.productName,
                expectedQuantity: expected,
                receivedQuantity: received,
                missingQuantity: expected - received,
              }
            ];
          }

          return prisma.inwardEntry.create({
            data: {
              poNumber: item.poNumber || null,
              invoiceNumber: item.invoiceNumber || null,
              invoiceDate: item.invoiceDate || null,
              productDetails: {
                productId: item.productId || "",
                productName: item.productName || "",
                quantity: received,
              },
              qrCode: item.qrCode || null,
              barcode: item.barcode || null,
              storeId: payload.storeId || null,
              createdById: payload.sub,
              status: status,
              supplierName: item.supplierName || null,
              expectedQuantity: expected,
              receivedQuantity: received,
              missingProducts: (missingList ? JSON.stringify(missingList) : null) as any,
            },
          });
        })
      );

      return NextResponse.json({
        success: true,
        data: createdEntries,
        message: `${createdEntries.length} items recorded successfully`,
      });
    } else {
      // Single item creation
      const {
        poNumber,
        invoiceNumber,
        invoiceDate,
        productDetails,
        qrCode,
        barcode,
        storeId,
        status,
        supplierName,
        expectedQuantity,
        receivedQuantity,
        missingProducts,
      } = body;

      const expected = expectedQuantity != null ? parseInt(expectedQuantity) : (productDetails?.quantity || 0);
      const received = receivedQuantity != null ? parseInt(receivedQuantity) : (productDetails?.quantity || 0);
      const resolvedStatus = status || (received < expected ? "PENDING" : "COMPLETED");

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
          status: resolvedStatus,
          supplierName: supplierName || null,
          expectedQuantity: expected,
          receivedQuantity: received,
          missingProducts: (missingProducts ? (typeof missingProducts === "string" ? missingProducts : JSON.stringify(missingProducts)) : null) as any,
        },
      });

      return NextResponse.json({ success: true, data: entry });
    }
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || "Failed to create inward entry" },
      { status: 500 }
    );
  }
}
