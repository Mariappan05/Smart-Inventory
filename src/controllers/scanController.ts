import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/permissions";
import { ScanService } from "@/services/scanService";
import { prisma } from "@/lib/prisma";

const scanService = new ScanService();

export class ScanController {
  async validateScan(req: NextRequest) {
    try {
      const body = await req.json();
      const payload = body.payload as string | undefined;

      if (!payload) {
        return NextResponse.json({ success: false, message: "payload is required" }, { status: 400 });
      }

      const data = await scanService.validateScan(payload);
      return NextResponse.json({ success: true, data }, { status: 200 });
    } catch (error) {
      return NextResponse.json(
        { success: false, message: error instanceof Error ? error.message : "Failed to validate QR" },
        { status: 500 }
      );
    }
  }

  async scan(req: NextRequest) {
    const authResult = await requireAuth(req);
    if (authResult instanceof NextResponse) return authResult;
    const session = authResult;

    try {
      const body = await req.json();
      const payload = body.payload as string | undefined;

      if (!payload) {
        return NextResponse.json({ success: false, message: "payload is required" }, { status: 400 });
      }

      const data = await scanService.scanQRCode({
        payload,
        scannedById: session.userId,
        storeId: session.storeId,
        source: body.source,
      });

      return NextResponse.json({ success: true, data }, { status: 200 });
    } catch (error) {
      return NextResponse.json(
        { success: false, message: error instanceof Error ? error.message : "Failed to scan QR" },
        { status: 500 }
      );
    }
  }

  async markOut(req: NextRequest) {
    const authResult = await requireAuth(req);
    if (authResult instanceof NextResponse) return authResult;
    const session = authResult;

    try {
      const body = await req.json();
      const payload = body.payload as string | undefined;

      if (!payload) {
        return NextResponse.json({ success: false, message: "payload is required" }, { status: 400 });
      }

      const data = await scanService.markMachineOut({
        payload,
        userId: session.userId,
        storeId: session.storeId,
        issuedTo: body.issuedTo,
        issuedToId: body.issuedToId,
        isInternalTransfer: body.isInternalTransfer,
        transferToUserId: body.transferToUserId,
        reason: body.reason,
        expectedReturnAt: body.expectedReturnAt,
        source: body.source,
      });

      return NextResponse.json({ success: true, data }, { status: 201 });
    } catch (error) {
      console.error("Mark OUT error:", error);
      return NextResponse.json(
        { success: false, message: error instanceof Error ? error.message : "Failed to mark machine OUT" },
        { status: 500 }
      );
    }
  }

  async markIn(req: NextRequest) {
    const authResult = await requireAuth(req);
    if (authResult instanceof NextResponse) return authResult;
    const session = authResult;

    try {
      const body = await req.json();
      const payload = body.payload as string | undefined;

      if (!payload) {
        return NextResponse.json({ success: false, message: "payload is required" }, { status: 400 });
      }

      const data = await scanService.markMachineIn({
        payload,
        userId: session.userId,
        storeId: session.storeId,
        conditionNote: body.conditionNote,
        toStoreRoomId: body.toStoreRoomId,
        source: body.source,
      });

      return NextResponse.json({ success: true, data }, { status: 201 });
    } catch (error) {
      return NextResponse.json(
        { success: false, message: error instanceof Error ? error.message : "Failed to mark machine IN" },
        { status: 500 }
      );
    }
  }

  async getLogs(req: NextRequest) {
    const authResult = await requireAuth(req);
    if (authResult instanceof NextResponse) return authResult;
    const session = authResult;

    try {
      const url = new URL(req.url);
      const machineId = url.searchParams.get("machineId");
      const page = Number(url.searchParams.get("page") ?? "1");
      const pageSize = Number(url.searchParams.get("pageSize") ?? "10");
      const filterByUser = url.searchParams.get("filterByUser") === "true";

      if (machineId) {
        const data = await scanService.getMachineLogs(machineId);
        return NextResponse.json({ success: true, data }, { status: 200 });
      }

      // Filter by user if requested, otherwise filter by store
      const data = await scanService.getLogs(
        page, 
        pageSize, 
        filterByUser ? session.userId : undefined, 
        session.storeId || undefined
      );
      return NextResponse.json({ success: true, data }, { status: 200 });
    } catch (error) {
      console.error("Get logs error:", error);
      return NextResponse.json(
        { success: false, message: error instanceof Error ? error.message : "Failed to fetch logs" },
        { status: 500 }
      );
    }
  }

  async getMachineState(req: NextRequest) {
    try {
      const url = new URL(req.url);
      const machineId = url.searchParams.get("machineId");

      if (!machineId) {
        return NextResponse.json({ success: false, message: "machineId is required" }, { status: 400 });
      }

      const data = await scanService.getLatestMachineState(machineId);
      return NextResponse.json({ success: true, data }, { status: 200 });
    } catch (error) {
      return NextResponse.json(
        { success: false, message: error instanceof Error ? error.message : "Failed to fetch machine state" },
        { status: 500 }
      );
    }
  }
}

export const scanController = new ScanController();
