import { NextRequest } from "next/server";
import { alertController } from "@/controllers/alertController";

export async function GET(req: NextRequest) {
  return alertController.getRecentAlerts(req);
}
