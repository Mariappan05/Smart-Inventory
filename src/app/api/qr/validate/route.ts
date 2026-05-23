import { NextRequest } from "next/server";
import { qrController } from "@/controllers/qrController";

export async function POST(req: NextRequest) {
  return qrController.validateQR(req);
}
