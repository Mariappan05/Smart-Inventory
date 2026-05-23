import { NextRequest } from "next/server";
import { scanController } from "@/controllers/scanController";

export async function GET(req: NextRequest) {
  return scanController.getMachineState(req);
}
