import { NextRequest } from "next/server";
import { alertController } from "@/controllers/alertController";

type RouteParams = {
  id: string;
};

export async function PATCH(req: NextRequest, context: { params: Promise<RouteParams> }) {
  const { id } = await context.params;
  return alertController.resolveAlert(req, id);
}
