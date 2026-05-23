import { NextRequest } from "next/server";
import { qrController } from "@/controllers/qrController";

export async function GET(req: NextRequest) {
  return qrController.listScanLogs(req);
}
