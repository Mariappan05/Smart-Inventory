import { NextRequest, NextResponse } from "next/server";
import { uploadController } from "@/controllers/uploadController";

type RouteParams = {
  userId: string;
};

export async function GET(
  req: NextRequest,
  context: { params: Promise<RouteParams> }
) {
  const { userId } = await context.params;
  return await uploadController.getUserImages(userId);
}

export async function POST(
  req: NextRequest,
  context: { params: Promise<RouteParams> }
) {
  const { userId } = await context.params;
  return await uploadController.uploadUserImage(req, userId);
}
