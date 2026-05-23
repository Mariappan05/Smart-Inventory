import { NextRequest } from "next/server";
import { reportController } from "@/controllers/reportController";

export async function GET(req: NextRequest) {
  return reportController.exportExcel(req);
}
