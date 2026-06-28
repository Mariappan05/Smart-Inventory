import { NextRequest, NextResponse } from "next/server";
import { ReportService } from "@/services/reportService";
import type { ReportType } from "@/types/reports";
import { requireAuth, canAccessAllStores } from "@/lib/auth/permissions";

const reportService = new ReportService();

function getFilters(req: NextRequest) {
  const url = new URL(req.url);
  return {
    type: (url.searchParams.get("type") || "productHistory") as ReportType,
    search: url.searchParams.get("search") || undefined,
    startDate: url.searchParams.get("startDate") || undefined,
    endDate: url.searchParams.get("endDate") || undefined,
    page: Number(url.searchParams.get("page") || "1"),
    pageSize: Number(url.searchParams.get("pageSize") || "10"),
    storeId: url.searchParams.get("storeId") || undefined,
    customerName: url.searchParams.get("customerName") || undefined,
    supplierName: url.searchParams.get("supplierName") || undefined,
    componentName: url.searchParams.get("componentName") || undefined,
    componentCode: url.searchParams.get("componentCode") || undefined,
    productName: url.searchParams.get("productName") || undefined,
    planNumber: url.searchParams.get("planNumber") || undefined,
    status: url.searchParams.get("status") || undefined,
    userName: url.searchParams.get("userName") || undefined,
    machineName: url.searchParams.get("machineName") || undefined,
  };
}

export class ReportController {
  async getReport(req: NextRequest) {
    const authResult = await requireAuth(req);
    if (authResult instanceof NextResponse) return authResult;
    const session = authResult;

    try {
      const filters = getFilters(req);
      const storeId = session.storeId || undefined;
      const data = await reportService.getReport(filters, storeId);
      const meta = await reportService.getMeta(filters, storeId);
      return NextResponse.json({ success: true, data, meta }, { status: 200 });
    } catch (error) {
      return NextResponse.json(
        { success: false, message: error instanceof Error ? error.message : "Failed to fetch report" },
        { status: 500 }
      );
    }
  }

  async exportExcel(req: NextRequest) {
    const authResult = await requireAuth(req);
    if (authResult instanceof NextResponse) return authResult;
    const session = authResult;

    try {
      const filters = getFilters(req);
      const storeId = session.storeId || undefined;
      const result = await reportService.exportReport(filters, "excel", storeId);
      const body = new Uint8Array(result.buffer);
      return new NextResponse(body, {
        status: 200,
        headers: {
          "Content-Type": result.contentType,
          "Content-Disposition": `attachment; filename=${result.fileName}`,
        },
      });
    } catch (error) {
      return NextResponse.json(
        { success: false, message: error instanceof Error ? error.message : "Failed to export Excel" },
        { status: 500 }
      );
    }
  }

  async exportPdf(req: NextRequest) {
    const authResult = await requireAuth(req);
    if (authResult instanceof NextResponse) return authResult;
    const session = authResult;

    try {
      const filters = getFilters(req);
      const storeId = session.storeId || undefined;
      const result = await reportService.exportReport(filters, "pdf", storeId);
      const body = new Uint8Array(result.buffer);
      return new NextResponse(body, {
        status: 200,
        headers: {
          "Content-Type": result.contentType,
          "Content-Disposition": `attachment; filename=${result.fileName}`,
        },
      });
    } catch (error) {
      return NextResponse.json(
        { success: false, message: error instanceof Error ? error.message : "Failed to export PDF" },
        { status: 500 }
      );
    }
  }
}

export const reportController = new ReportController();
