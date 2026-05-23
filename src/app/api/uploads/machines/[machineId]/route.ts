import { NextRequest, NextResponse } from "next/server";
import { uploadController } from "@/controllers/uploadController";

type RouteParams = {
  machineId: string;
};

export async function GET(
  req: NextRequest,
  context: { params: Promise<RouteParams> }
) {
  const { machineId } = await context.params;
  return await uploadController.getMachineImages(machineId);
}

export async function POST(
  req: NextRequest,
  context: { params: Promise<RouteParams> }
) {
  const { machineId } = await context.params;
  return await uploadController.uploadMachineImages(req, machineId);
}
