import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    
    return NextResponse.json({
      success: true,
      database: "connected",
      jwtSecret: !!process.env.JWT_SECRET ? "configured" : "missing",
      databaseUrl: !!process.env.DATABASE_URL ? "configured" : "missing"
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  }
}
