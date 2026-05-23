import { NextRequest, NextResponse } from "next/server";
import { AlertService } from "@/services/alertService";
import { requireAuth, canAccessAllStores } from "@/lib/auth/permissions";

const alertService = new AlertService();

export class AlertController {
  async createSecurityAlert(req: NextRequest) {
    const authResult = await requireAuth(req);
    if (authResult instanceof NextResponse) return authResult;
    const session = authResult;

    try {
      const body = await req.json();
      const machineId = body.machineId as string | undefined;
      const title = body.title as string | undefined;

      if (!machineId || !title) {
        return NextResponse.json({ success: false, message: "machineId and title are required" }, { status: 400 });
      }

      const alert = await alertService.createSecurityAlert({
        machineId,
        title,
        description: body.description,
        severity: body.severity,
        reportedById: session.userId,
        storeId: session.storeId,
      });

      return NextResponse.json({ success: true, data: alert }, { status: 201 });
    } catch (error) {
      return NextResponse.json(
        { success: false, message: error instanceof Error ? error.message : "Failed to create alert" },
        { status: 500 }
      );
    }
  }

  async acknowledgeAlert(req: NextRequest, id: string) {
    try {
      const alert = await alertService.acknowledge(id);
      return NextResponse.json({ success: true, data: alert }, { status: 200 });
    } catch (error) {
      return NextResponse.json(
        { success: false, message: error instanceof Error ? error.message : "Failed to acknowledge alert" },
        { status: 500 }
      );
    }
  }

  async resolveAlert(req: NextRequest, id: string) {
    try {
      const alert = await alertService.resolve(id);
      return NextResponse.json({ success: true, data: alert }, { status: 200 });
    } catch (error) {
      return NextResponse.json(
        { success: false, message: error instanceof Error ? error.message : "Failed to resolve alert" },
        { status: 500 }
      );
    }
  }

  async getAlerts(req: NextRequest) {
    const authResult = await requireAuth(req);
    if (authResult instanceof NextResponse) return authResult;
    const session = authResult;

    try {
      const url = new URL(req.url);
      const machineId = url.searchParams.get("machineId");
      const page = Number(url.searchParams.get("page") ?? "1");
      const pageSize = Number(url.searchParams.get("pageSize") ?? "10");

      // Use user's assigned store for filtering
      const storeId = session.storeId || undefined;

      if (machineId) {
        const data = await alertService.findByMachineId(machineId);
        return NextResponse.json({ success: true, data }, { status: 200 });
      }

      const data = await alertService.paginate({ page, pageSize }, storeId);
      return NextResponse.json({ success: true, data }, { status: 200 });
    } catch (error) {
      return NextResponse.json(
        { success: false, message: error instanceof Error ? error.message : "Failed to fetch alerts" },
        { status: 500 }
      );
    }
  }

  async getRecentAlerts(req: NextRequest) {
    const authResult = await requireAuth(req);
    if (authResult instanceof NextResponse) return authResult;
    const session = authResult;

    try {
      const storeId = session.storeId || undefined;
      const data = await alertService.findRecentAlerts(10, storeId);
      return NextResponse.json({ success: true, data }, { status: 200 });
    } catch (error) {
      return NextResponse.json(
        { success: false, message: error instanceof Error ? error.message : "Failed to fetch recent alerts" },
        { status: 500 }
      );
    }
  }

  async getOpenAlerts(req: NextRequest) {
    const authResult = await requireAuth(req);
    if (authResult instanceof NextResponse) return authResult;
    const session = authResult;

    try {
      const storeId = session.storeId || undefined;
      const data = await alertService.findOpenAlerts(storeId);
      return NextResponse.json({ success: true, data }, { status: 200 });
    } catch (error) {
      return NextResponse.json(
        { success: false, message: error instanceof Error ? error.message : "Failed to fetch open alerts" },
        { status: 500 }
      );
    }
  }
}

export const alertController = new AlertController();
