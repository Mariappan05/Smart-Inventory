import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { BaseRepository, type PageResult } from "@/repositories/base/baseRepository";
import { toRepositoryError } from "@/repositories/base/repositoryError";
import type {
  ReportFilters,
  ProductHistoryRow,
  ScheduleReportRow,
  RequestReportRow,
} from "@/types/reports";
import { formatDateTime } from "@/utils/dateTimeFormat";

export class ReportRepository extends BaseRepository {
  
  async getProductHistoryReport(filters: ReportFilters, storeId?: string): Promise<PageResult<ProductHistoryRow>> {
    const { page, pageSize, skip, take } = this.getPagination(filters);
    const search = filters.search?.trim().toLowerCase() || "";

    const where: Prisma.ItemWhereInput = {
      description: { startsWith: "PRODUCT_" },
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
      ],
    };

    try {
      const allItems = await prisma.item.findMany({
        where,
        orderBy: { createdAt: "desc" },
        include: { store: true, supplier: true, createdBy: true },
      });

      // Filter and map in memory to support virtual fields like customerName
      const mappedRows: ProductHistoryRow[] = allItems.map((item) => {
        const customerName = item.description.startsWith("PRODUCT_")
          ? item.description.replace("PRODUCT_", "")
          : "-";

        return {
          storeName: item.store?.name ?? "-",
          storeCode: item.store?.code ?? "-",
          customerName,
          supplierName: item.supplier?.name ?? "-",
          componentName: item.name,
          componentCode: item.itemCode ?? "-",
          productName: item.name,
          productCode: item.itemCode ?? "-",
          rawMaterialType: item.lifeDuration ?? "-",
          rmSupplier: item.variant ?? "-",
          rmPrice: item.unitPrice ? `$${item.unitPrice.toFixed(2)}` : "$0.00",
          createdBy: item.createdBy?.name ?? "-",
          createdDate: formatDateTime(item.createdAt),
        };
      });

      // Apply search filters
      const filteredRows = mappedRows.filter((row) => {
        if (!search) return true;
        return (
          row.storeName.toLowerCase().includes(search) ||
          row.storeCode.toLowerCase().includes(search) ||
          row.customerName.toLowerCase().includes(search) ||
          row.supplierName.toLowerCase().includes(search) ||
          row.componentName.toLowerCase().includes(search) ||
          row.componentCode.toLowerCase().includes(search)
        );
      });

      // Apply column-specific filters
      const finalRows = filteredRows.filter((row) => {
        if (filters.storeId && row.storeName !== filters.storeId) return false;
        if (filters.customerName && !row.customerName.toLowerCase().includes(filters.customerName.toLowerCase())) return false;
        if (filters.supplierName && !row.supplierName.toLowerCase().includes(filters.supplierName.toLowerCase())) return false;
        if (filters.componentName && !row.componentName.toLowerCase().includes(filters.componentName.toLowerCase())) return false;
        if (filters.componentCode && !row.componentCode.toLowerCase().includes(filters.componentCode.toLowerCase())) return false;
        if (filters.productName && !row.productName.toLowerCase().includes(filters.productName.toLowerCase())) return false;
        return true;
      });

      const total = finalRows.length;
      const paginated = finalRows.slice(skip, skip + take);

      return this.buildPageResult(paginated, total, page, pageSize);
    } catch (error) {
      throw toRepositoryError(error, "Failed to fetch product history report");
    }
  }

  async getScheduleReport(filters: ReportFilters, storeId?: string): Promise<PageResult<ScheduleReportRow>> {
    const { page, pageSize, skip, take } = this.getPagination(filters);
    const search = filters.search?.trim().toLowerCase() || "";

    try {
      // 1. Fetch Tentative Plans
      const tentativeSchedules = await prisma.tentativeMonthlySchedule.findMany({
        where: {
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
          ],
        },
        include: {
          store: true,
          createdBy: true,
          items: {
            include: {
              component: true,
              tools: {
                include: {
                  tool: true,
                },
              },
            },
          },
        },
      });

      // 2. Fetch Final Plans
      const finalSchedules = await prisma.schedule.findMany({
        where: {
          isMonthlySchedule: true,
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
          ],
        },
        include: {
          store: true,
          supplier: true,
          item: true,
          createdBy: true,
        },
      });

      // Fetch all tools to resolve final plan tool names
      const allTools = await prisma.tool.findMany();

      const rows: ScheduleReportRow[] = [];

      // Map tentative plans
      tentativeSchedules.forEach((sched) => {
        sched.items.forEach((item) => {
          item.tools.forEach((it) => {
            rows.push({
              planNumber: `Plan-${sched.id.slice(-6).toUpperCase()}`,
              storeName: sched.store?.name ?? "-",
              customerName: sched.customerName,
              supplierName: it.tool.supplierName ?? "-",
              componentName: item.component.name,
              componentCode: item.component.itemCode ?? "-",
              toolName: it.tool.toolName,
              quantity: it.quantity,
              planDate: formatDateTime(sched.createdAt),
              status: "TENTATIVE",
              createdBy: sched.createdBy?.name ?? "-",
              createdDate: formatDateTime(sched.createdAt),
            });
          });
        });
      });

      // Map final plans
      finalSchedules.forEach((sched) => {
        // Resolve tool name
        const tool = allTools.find(
          (t) => t.itemId === sched.itemId && t.supplierCode === sched.supplier?.code
        );

        rows.push({
          planNumber: sched.supplierBillNumber ?? sched.id,
          storeName: sched.store?.name ?? "-",
          customerName: sched.customerName ?? "-",
          supplierName: sched.supplier?.name ?? "-",
          componentName: sched.componentName ?? sched.item?.name ?? "-",
          componentCode: sched.componentCode ?? sched.item?.itemCode ?? "-",
          toolName: tool?.toolName ?? "-",
          quantity: sched.quantity,
          planDate: formatDateTime(sched.scheduleDate),
          status: sched.status,
          createdBy: sched.createdBy?.name ?? "-",
          createdDate: formatDateTime(sched.createdAt),
        });
      });

      // Search filter
      const filtered = rows.filter((row) => {
        if (!search) return true;
        return (
          row.planNumber.toLowerCase().includes(search) ||
          row.customerName.toLowerCase().includes(search) ||
          row.componentName.toLowerCase().includes(search) ||
          row.toolName.toLowerCase().includes(search) ||
          row.supplierName.toLowerCase().includes(search)
        );
      });

      // Advanced filters
      const finalRows = filtered.filter((row) => {
        if (filters.storeId && row.storeName !== filters.storeId) return false;
        if (filters.customerName && !row.customerName.toLowerCase().includes(filters.customerName.toLowerCase())) return false;
        if (filters.supplierName && !row.supplierName.toLowerCase().includes(filters.supplierName.toLowerCase())) return false;
        if (filters.componentName && !row.componentName.toLowerCase().includes(filters.componentName.toLowerCase())) return false;
        if (filters.planNumber && !row.planNumber.toLowerCase().includes(filters.planNumber.toLowerCase())) return false;
        if (filters.status && row.status.toLowerCase() !== filters.status.toLowerCase()) return false;
        return true;
      });

      // Sort newest first
      finalRows.sort((a, b) => b.createdDate.localeCompare(a.createdDate));

      const total = finalRows.length;
      const paginated = finalRows.slice(skip, skip + take);

      return this.buildPageResult(paginated, total, page, pageSize);
    } catch (error) {
      throw toRepositoryError(error, "Failed to fetch schedule report");
    }
  }

  async getRequestReport(filters: ReportFilters, storeId?: string): Promise<PageResult<RequestReportRow>> {
    const { page, pageSize, skip, take } = this.getPagination(filters);
    const search = filters.search?.trim().toLowerCase() || "";

    let userStoreCode = "";
    try {
      if (storeId) {
        const store = await prisma.store.findUnique({
          where: { id: storeId },
          select: { code: true }
        });
        if (store) {
          userStoreCode = store.code;
        }
      }
    } catch (err) {
      console.error("Error looking up store code:", err);
    }

    const where: Prisma.ToolRequestWhereInput = {
      AND: [
        userStoreCode
          ? {
              OR: [
                { storeCode: userStoreCode },
                { targetStoreId: storeId },
              ],
            }
          : {},
        filters.startDate || filters.endDate
          ? {
              createdAt: {
                ...(filters.startDate ? { gte: new Date(filters.startDate) } : {}),
                ...(filters.endDate ? { lte: new Date(filters.endDate) } : {}),
              },
            }
          : {},
      ],
    };

    try {
      const [requests, allUsers] = await Promise.all([
        prisma.toolRequest.findMany({
          where,
          orderBy: { createdAt: "desc" },
        }),
        prisma.user.findMany({
          select: { id: true, name: true },
        }),
      ]);

      const mappedRows: RequestReportRow[] = requests.map((req) => {
        const creator = allUsers.find((u) => u.id === req.createdById);
        return {
          requestNumber: `REQ-${req.id.slice(-6).toUpperCase()}`,
          storeName: req.storeName,
          storeCode: req.storeCode,
          userName: creator?.name ?? "-",
          componentName: req.componentName,
          componentCode: req.componentCode,
          machineName: req.machineNumber,
          machineCode: req.machineCode,
          requestedQuantity: req.productionQuantity,
          approvedQuantity:
            req.status === "APPROVED" || req.status === "COMPLETED"
              ? String(req.productionQuantity)
              : "-",
          status: req.status,
          createdDate: formatDateTime(req.createdAt),
        };
      });

      // Search filter
      const filtered = mappedRows.filter((row) => {
        if (!search) return true;
        return (
          row.requestNumber.toLowerCase().includes(search) ||
          row.userName.toLowerCase().includes(search) ||
          row.componentName.toLowerCase().includes(search) ||
          row.machineName.toLowerCase().includes(search) ||
          row.status.toLowerCase().includes(search)
        );
      });

      // Advanced filters
      const finalRows = filtered.filter((row) => {
        if (filters.storeId && row.storeName !== filters.storeId) return false;
        if (filters.status && row.status.toLowerCase() !== filters.status.toLowerCase()) return false;
        if (filters.userName && !row.userName.toLowerCase().includes(filters.userName.toLowerCase())) return false;
        if (filters.componentName && !row.componentName.toLowerCase().includes(filters.componentName.toLowerCase())) return false;
        if (filters.machineName && !row.machineName.toLowerCase().includes(filters.machineName.toLowerCase())) return false;
        return true;
      });

      const total = finalRows.length;
      const paginated = finalRows.slice(skip, skip + take);

      return this.buildPageResult(paginated, total, page, pageSize);
    } catch (error) {
      throw toRepositoryError(error, "Failed to fetch request report");
    }
  }
}
