import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    // Find the latest product with serial starting with 'S'
    const latestProduct = await prisma.product.findFirst({
      where: {
        serial: {
          startsWith: "S",
        },
      },
      orderBy: {
        serial: "desc",
      },
      select: {
        serial: true,
      },
    });

    let nextNumber = 1;

    if (latestProduct) {
      // Extract number from serial (e.g., "S01" -> 1, "S123" -> 123)
      const match = latestProduct.serial.match(/^S(\d+)/);
      if (match) {
        nextNumber = parseInt(match[1], 10) + 1;
      }
    }

    // Format with leading zeros (S01, S02, ..., S99, S100, etc.)
    const serial = `S${String(nextNumber).padStart(2, "0")}`;

    return NextResponse.json({ serial });
  } catch (error) {
    console.error("Failed to generate next serial:", error);
    return NextResponse.json(
      { error: "Failed to generate serial number" },
      { status: 500 }
    );
  }
}
