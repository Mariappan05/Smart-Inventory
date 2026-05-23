import { NextRequest, NextResponse } from "next/server";
import { QRService } from "@/services/qrService";
import { isValidQRPayload } from "@/utils/qr";
import { requireAuth, canAccessAllStores } from "@/lib/auth/permissions";

const qrService = new QRService();

export class QRController {
  async generateMachineQR(req: NextRequest) {
    try {
      const body = await req.json();
      const machineId = body.machineId as string | undefined;
      const width = body.width ? Number(body.width) : 320;

      if (!machineId) {
        return NextResponse.json({ success: false, message: "machineId is required" }, { status: 400 });
      }

      const qr = await qrService.generateMachineQR(machineId, width);

      return NextResponse.json({ success: true, data: qr }, { status: 200 });
    } catch (error) {
      return NextResponse.json(
        { success: false, message: error instanceof Error ? error.message : "Failed to generate QR code" },
        { status: 500 }
      );
    }
  }

  async validateQR(req: NextRequest) {
    try {
      const body = await req.json();
      const payload = body.payload as string | undefined;

      if (!payload) {
        return NextResponse.json({ success: false, message: "payload is required" }, { status: 400 });
      }

      if (!isValidQRPayload(payload)) {
        return NextResponse.json({ success: false, valid: false, message: "Invalid QR payload format" }, { status: 200 });
      }

      const result = await qrService.validatePayload(payload);

      return NextResponse.json({ success: true, ...result }, { status: 200 });
    } catch (error) {
      return NextResponse.json(
        { success: false, valid: false, message: error instanceof Error ? error.message : "Failed to validate QR code" },
        { status: 500 }
      );
    }
  }

  async scanQR(req: NextRequest) {
    try {
      const body = await req.json();
      const payload = body.payload as string | undefined;
      const scannedById = (body.scannedById as string | undefined) ?? null;
      const rawSource = body.source as "MOBILE" | "KIOSK" | "API" | "WEB" | undefined;
      const source = rawSource === "WEB" ? "KIOSK" : rawSource;

      if (!payload) {
        return NextResponse.json({ success: false, message: "payload is required" }, { status: 400 });
      }

      const log = await qrService.logScan({ payload, scannedById, source });

      return NextResponse.json({ success: true, data: log }, { status: 201 });
    } catch (error) {
      return NextResponse.json(
        { success: false, message: error instanceof Error ? error.message : "Failed to log scan" },
        { status: 500 }
      );
    }
  }

  async listScanLogs(req: NextRequest) {
    const authResult = await requireAuth(req);
    if (authResult instanceof NextResponse) return authResult;
    const session = authResult;

    try {
      const url = new URL(req.url);
      const page = Number(url.searchParams.get("page") ?? "1");
      const pageSize = Number(url.searchParams.get("pageSize") ?? "10");
      const machineId = url.searchParams.get("machineId");

      if (machineId) {
        const data = await qrService.getMachineScanLogs(machineId);
        return NextResponse.json({ success: true, data }, { status: 200 });
      }

      // Use user's assigned store for filtering
      const storeId = session.storeId || undefined;
      const data = await qrService.getScanLogs(page, pageSize, storeId);
      return NextResponse.json({ success: true, data }, { status: 200 });
    } catch (error) {
      return NextResponse.json(
        { success: false, message: error instanceof Error ? error.message : "Failed to fetch scan logs" },
        { status: 500 }
      );
    }
  }
}

export const qrController = new QRController();
