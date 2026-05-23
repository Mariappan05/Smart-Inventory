import { NextRequest, NextResponse } from "next/server";
import { uploadController } from "@/controllers/uploadController";

type RouteParams = {
  imageId: string;
};

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<RouteParams> }
) {
  const { imageId } = await context.params;
  return await uploadController.deleteUserImage(imageId);
}

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<RouteParams> }
) {
  const { imageId } = await context.params;
  const body = await req.json();

  if (body.action === "setPrimary") {
    return await uploadController.setUserImageAsPrimary(imageId);
  }

  return NextResponse.json(
    { success: false, message: "Invalid action" },
    { status: 400 }
  );
}
