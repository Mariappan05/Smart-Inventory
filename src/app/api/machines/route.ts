import { NextRequest, NextResponse } from "next/server";
import { productController } from "@/controllers/productController";
import { requireAuth } from "@/lib/auth/permissions";

export async function GET(req: NextRequest) {
  const authResult = await requireAuth(req);
  if (authResult instanceof NextResponse) return authResult;

  return await productController.listProducts(req);
}

export async function POST(req: NextRequest) {
  const authResult = await requireAuth(req);
  if (authResult instanceof NextResponse) return authResult;

  return await productController.createProduct(req);
}
