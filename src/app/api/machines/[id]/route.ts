import { NextRequest, NextResponse } from "next/server";
import { productController } from "@/controllers/productController";
import { requireAuth, requireAdmin } from "@/lib/auth/permissions";

type RouteParams = {
  id: string;
};

export async function GET(
  req: NextRequest,
  context: { params: Promise<RouteParams> }
) {
  const authResult = await requireAuth(req);
  if (authResult instanceof NextResponse) return authResult;

  const { id } = await context.params;
  return await productController.getProduct(id);
}

export async function PUT(
  req: NextRequest,
  context: { params: Promise<RouteParams> }
) {
  const authResult = await requireAdmin(req);
  if (authResult instanceof NextResponse) return authResult;

  const { id } = await context.params;
  return await productController.updateProduct(req, id);
}

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<RouteParams> }
) {
  const authResult = await requireAdmin(req);
  if (authResult instanceof NextResponse) return authResult;

  const { id } = await context.params;
  return await productController.deleteProduct(id);
}
