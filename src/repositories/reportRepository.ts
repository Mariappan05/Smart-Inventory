import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { BaseRepository, type PageOptions, type PageResult } from "@/repositories/base/baseRepository";
import { toRepositoryError } from "@/repositories/base/repositoryError";
import type {
  ReportFilters,
  MachineReportRow,
  MovementReportRow,
  AlertReportRow,
  EmployeeActivityRow,
  ReportType,
} from "@/types/reports";

export class ReportRepository extends BaseRepository {
  private buildDateWhere(startDate?: string, endDate?: string) {
    const where: Record<string, unknown> = {};
    if (startDate || endDate) {
      where.createdAt = {
        ...(startDate ? { gte: new Date(startDate) } : {}),
        ...(endDate ? { lte: new Date(endDate) } : {}),
      };
    }
    return where;
  }

  async getMachineReport(filters: ReportFilters, storeId?: string): Promise<PageResult<MachineReportRow>> {
    const { page, pageSize, skip, take } = this.getPagination(filters);
    const search = filters.search?.trim() || "";
    const where: Prisma.ProductWhereInput = {
      AND: [
        storeId ? { storeId } : {},
        filters.startDate || filters.endDate
          ? {
              updatedAt: {
                ...(filters.startDate ? { gte: new Date(filters.startDate) } : {}),
                ...(filters.endDate ? { lte: new Date(filters.endDate) } : {}),
              },
            }
          : {},
        search
          ? {
              OR: [
                { serial: { contains: search, mode: "insensitive" } },
                { type: { name: { contains: search, mode: "insensitive" } } },
                { supplier: { name: { contains: search, mode: "insensitive" } } },
                { store: { name: { contains: search, mode: "insensitive" } } },
              ],
            }
          : {},
      ],
    };

    try {
      const [rows, total] = await prisma.$transaction([
        prisma.product.findMany({
          where,
          skip,
          take,
          orderBy: { updatedAt: "desc" },
          include: { type: true, supplier: true, store: true },
        }),
        prisma.product.count({ where }),
      ]);

      return this.buildPageResult(
        rows.map((product) => ({
          id: product.id,
          assetTag: product.serial,
          name: product.serial,
          status: product.status,
          category: product.type?.name ?? "-",
          supplier: product.supplier?.name ?? "-",
          storeRoom: product.store?.name ?? "-",
          serial: product.serial,
          purchaseDate: product.createdAt ? product.createdAt.toISOString() : null,
          updatedAt: product.updatedAt.toISOString(),
        })),
        total,
        page,
        pageSize
      );
    } catch (error) {
      throw toRepositoryError(error, "Failed to fetch machine report");
    }
  }

  async getMovementReport(filters: ReportFilters, storeId?: string): Promise<PageResult<MovementReportRow>> {
    // TODO: ProductMovementLog model not available in Prisma schema
    // Disabled until model is added or replaced with ProductInLog/ProductOutLog
    const { page, pageSize } = this.getPagination(filters);
    return this.buildPageResult([], 0, page, pageSize);
  }

  async getSecurityAlertReport(filters: ReportFilters, storeId?: string): Promise<PageResult<AlertReportRow>> {
    const { page, pageSize, skip, take } = this.getPagination(filters);
    const search = filters.search?.trim() || "";
    const where: Prisma.SecurityAlertWhereInput = {
      AND: [
        storeId ? { storeId } : {},
        filters.startDate || filters.endDate
          ? {
              createdAt: {
                ...(filters.startDate ? { gte: new Date(filters.startDate) } : {}),
                ...(filters.endDate ? { lte: new Date(filters.endDate) } : {}),
              },
            }
          : {},
        search
          ? {
              OR: [
                { title: { contains: search, mode: "insensitive" } },
                { description: { contains: search, mode: "insensitive" } },
                { product: { serial: { contains: search, mode: "insensitive" } } },
                { reportedBy: { name: { contains: search, mode: "insensitive" } } },
              ],
            }
          : {},
      ],
    };

    try {
      const [rows, total] = await prisma.$transaction([
        prisma.securityAlert.findMany({
          where,
          skip,
          take,
          orderBy: { createdAt: "desc" },
          include: { product: true, reportedBy: true },
        }),
        prisma.securityAlert.count({ where }),
      ]);

      return this.buildPageResult(
        rows.map((alert) => ({
          id: alert.id,
          machine: alert.product.serial,
          assetTag: alert.product.serial,
          title: alert.title,
          severity: alert.severity,
          status: alert.status,
          reportedBy: alert.reportedBy?.name ?? "-",
          createdAt: alert.createdAt.toISOString(),
          resolvedAt: alert.resolvedAt ? alert.resolvedAt.toISOString() : null,
        })),
        total,
        page,
        pageSize
      );
    } catch (error) {
      throw toRepositoryError(error, "Failed to fetch alert report");
    }
  }

  async getEmployeeActivityReport(filters: ReportFilters, storeId?: string): Promise<PageResult<EmployeeActivityRow>> {
    const { page, pageSize, skip, take } = this.getPagination(filters);
    const search = filters.search?.trim() || "";
    const dateFilter = {
      ...(filters.startDate ? { gte: new Date(filters.startDate) } : {}),
      ...(filters.endDate ? { lte: new Date(filters.endDate) } : {}),
    };

    try {
      const [scanLogs, alertLogs] = await Promise.all([
        prisma.qrScanLog.findMany({
          where: {
            ...(storeId ? { storeId } : {}),
            ...(filters.startDate || filters.endDate ? { scannedAt: dateFilter } : {}),
            ...(search
              ? {
                  OR: [
                    { payload: { contains: search, mode: "insensitive" } },
                    { product: { serial: { contains: search, mode: "insensitive" } } },
                    { scannedBy: { name: { contains: search, mode: "insensitive" } } },
                  ],
                }
              : {}),
          },
          include: { product: true, scannedBy: true },
          orderBy: { scannedAt: "desc" },
        }),
        // TODO: ProductMovementLog model not available - disabled until model is added
        // prisma.productMovementLog.findMany() removed
        prisma.securityAlert.findMany({
          where: {
            ...(storeId ? { storeId } : {}),
            ...(filters.startDate || filters.endDate ? { createdAt: dateFilter } : {}),
            ...(search
              ? {
                  OR: [
                    { title: { contains: search, mode: "insensitive" } },
                    { product: { serial: { contains: search, mode: "insensitive" } } },
                    { reportedBy: { name: { contains: search, mode: "insensitive" } } },
                  ],
                }
              : {}),
          },
          include: { product: true, reportedBy: true },
          orderBy: { createdAt: "desc" },
        }),
      ]);

      const rows: EmployeeActivityRow[] = [
        ...scanLogs.map((scan) => ({
          id: scan.id,
          employee: scan.scannedBy?.name ?? "-",
          employeeNo: scan.scannedBy?.employeeNo ?? "-",
          activityType: "QR Scan",
          machine: scan.product.serial,
          detail: scan.source,
          occurredAt: scan.scannedAt.toISOString(),
        })),
        ...alertLogs.map((alert) => ({
          id: alert.id,
          employee: alert.reportedBy?.name ?? "-",
          employeeNo: alert.reportedBy?.employeeNo ?? "-",
          activityType: "Security Alert",
          machine: alert.product.serial,
          detail: alert.title,
          occurredAt: alert.createdAt.toISOString(),
        })),
      ].sort((left, right) => right.occurredAt.localeCompare(left.occurredAt));

      const total = rows.length;
      const paginated = rows.slice(skip, skip + take);

      return this.buildPageResult(paginated, total, page, pageSize);
    } catch (error) {
      throw toRepositoryError(error, "Failed to fetch employee activity report");
    }
  }
}
