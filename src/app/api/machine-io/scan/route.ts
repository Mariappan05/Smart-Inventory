import { NextRequest } from "next/server";
import { scanController } from "@/controllers/scanController";

export async function POST(req: NextRequest) {
  return scanController.scan(req);
}
