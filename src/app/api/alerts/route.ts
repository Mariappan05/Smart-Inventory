import { NextRequest } from "next/server";
import { alertController } from "@/controllers/alertController";

export async function GET(req: NextRequest) {
  return alertController.getAlerts(req);
}

export async function POST(req: NextRequest) {
  return alertController.createSecurityAlert(req);
}
