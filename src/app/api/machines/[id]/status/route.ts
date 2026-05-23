import { NextRequest, NextResponse } from "next/server";
import { productController } from "@/controllers/productController";

type RouteParams = {
  id: string;
};

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<RouteParams> }
) {
  const { id } = await Promise.resolve(context.params);
  if (!id) {
    return NextResponse.json({ success: false, message: "id is required" }, { status: 400 });
  }
  return await productController.updateStatus(req, id);
}
