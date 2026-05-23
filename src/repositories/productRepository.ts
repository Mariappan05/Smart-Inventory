import type { DashboardData } from "@/types/dashboard";
import type { Prisma, Product } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { BaseRepository, type PageOptions, type PageResult } from "@/repositories/base/baseRepository";
import { toRepositoryError } from "@/repositories/base/repositoryError";
import type { IProductRepository } from "@/repositories/types";

export async function getDashboardSnapshot(storeId: string | null): Promise<DashboardData> {
  // Admin sees all stores (storeId = null), others see their store
  const storeFilter = storeId ? { storeId } : {};
  const movementFilter = storeId ? {
    OR: [
      { fromStoreId: storeId },
      { toStoreId: storeId }
    ]
  } : {};
  const alertFilter = storeId ? { storeId } : {};
  const scheduleFilter = storeId ? { storeId } : {};
  const toolFilter = storeId ? { storeId } : {};
  const inwardFilter = storeId ? { toStoreId: storeId } : {};
  const outwardFilter = storeId ? { fromStoreId: storeId } : {};
  const qrFilter = storeId ? { storeId } : {};

  const [
    // Product Entry
    totalProducts,
    availableProducts,
    inUseProducts,
    outOfStockProducts,
    
    // Tool Entry
    totalTools,
    
    // Schedules
    totalSchedules,
    tentativeSchedules,
    finalSchedules,
    
    // Monthly Schedules
    totalMonthlySchedules,
    
    // Inward Process
    totalInwardLogs,
    
    // Outward Process
    totalOutwardLogs,
    
    // QR Scan Activities
    totalQrScans,
    
    // Alerts
    openAlerts,
    totalAlerts,
    
    // Suppliers
    totalSuppliers,
    
    // Items (Machines/Components)
    totalItems,
    
    // Recent Activity
    recentAlerts,
    recentSchedules,
    recentInwardLogs,
    recentOutwardLogs,
    recentQrScans,
    recentTools,
  ] = await prisma.$transaction([
    // Product Entry counts
    prisma.product.count({ where: storeFilter }),
    prisma.product.count({ where: { ...storeFilter, status: "AVAILABLE" } }),
    prisma.product.count({ where: { ...storeFilter, status: "IN_USE" } }),
    prisma.product.count({ where: { ...storeFilter, status: "OUT_OF_STOCK" } }),
    
    // Tool Entry
    prisma.tool.count({ where: toolFilter }),
    
    // Schedules
    prisma.schedule.count({ where: scheduleFilter }),
    prisma.schedule.count({ where: { ...scheduleFilter, status: "TENTATIVE" } }),
    prisma.schedule.count({ where: { ...scheduleFilter, status: "FINAL" } }),
    
    // Monthly Schedules
    prisma.tentativeMonthlySchedule.count({ where: storeFilter }),
    
    // Inward Process
    prisma.productInLog.count({ where: inwardFilter }),
    
    // Outward Process
    prisma.productOutLog.count({ where: outwardFilter }),
    
    // QR Scans
    prisma.qrScanLog.count({ where: qrFilter }),
    
    // Alerts
    prisma.securityAlert.count({ where: { ...alertFilter, status: "OPEN" } }),
    prisma.securityAlert.count({ where: alertFilter }),
    
    // Suppliers
    prisma.supplier.count({ where: storeFilter }),
    
    // Items
    prisma.item.count({ where: storeFilter }),
    
    // Recent alerts
    prisma.securityAlert.findMany({
      where: alertFilter,
      take: 3,
      orderBy: { createdAt: "desc" },
    }),
    
    // Recent schedules
    prisma.schedule.findMany({
      where: scheduleFilter,
      take: 4,
      orderBy: { createdAt: "desc" },
      include: {
        item: { select: { name: true } },
        supplier: { select: { name: true } },
      },
    }),
    
    // Recent inward logs
    prisma.productInLog.findMany({
      where: inwardFilter,
      take: 3,
      orderBy: { inAt: "desc" },
      include: {
        product: {
          select: {
            serial: true,
            item: { select: { name: true } },
            images: { where: { isPrimary: true }, select: { url: true }, take: 1 },
          },
        },
        inBy: { 
          select: { 
            name: true,
            images: { where: { isPrimary: true }, select: { url: true }, take: 1 }
          } 
        },
      },
    }),
    
    // Recent outward logs
    prisma.productOutLog.findMany({
      where: outwardFilter,
      take: 3,
      orderBy: { outAt: "desc" },
      include: {
        product: {
          select: {
            serial: true,
            item: { select: { name: true } },
            images: { where: { isPrimary: true }, select: { url: true }, take: 1 },
          },
        },
        outBy: { 
          select: { 
            name: true,
            images: { where: { isPrimary: true }, select: { url: true }, take: 1 }
          } 
        },
      },
    }),
    
    // Recent QR scans
    prisma.qrScanLog.findMany({
      where: qrFilter,
      take: 3,
      orderBy: { scannedAt: "desc" },
      include: {
        product: {
          select: {
            serial: true,
            item: { select: { name: true } },
            images: { where: { isPrimary: true }, select: { url: true }, take: 1 },
          },
        },
        scannedBy: { 
          select: { 
            name: true,
            images: { where: { isPrimary: true }, select: { url: true }, take: 1 }
          } 
        },
      },
    }),
    
    // Recent tools
    prisma.tool.findMany({
      where: toolFilter,
      take: 3,
      orderBy: { createdAt: "desc" },
      include: {
        item: { select: { name: true } },
      },
    }),
  ]);

  const formatDate = (value: Date | null) => {
    if (!value) return "";
    const d = value;
    const dd = String(d.getDate()).padStart(2, "0");
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const yyyy = d.getFullYear();
    return `${dd}-${mm}-${yyyy}`;
  };

  const formatTime = (value: Date | null) => {
    if (!value) return "";
    return value.toLocaleTimeString("en-US", { 
      hour: "2-digit", 
      minute: "2-digit",
      hour12: true
    });
  };

  return {
    kpis: [
      {
        id: "kpi-products",
        label: "Total Products",
        value: String(totalProducts),
        delta: String(availableProducts),
        trend: "flat",
      },
      {
        id: "kpi-tools",
        label: "Total Tools",
        value: String(totalTools),
        delta: "0",
        trend: "flat",
      },
      {
        id: "kpi-schedules",
        label: "Total Schedules",
        value: String(totalSchedules),
        delta: String(tentativeSchedules),
        trend: "flat",
      },
      {
        id: "kpi-monthly-schedules",
        label: "Monthly Schedules",
        value: String(totalMonthlySchedules),
        delta: "0",
        trend: "flat",
      },
      {
        id: "kpi-inward",
        label: "Inward Activities",
        value: String(totalInwardLogs),
        delta: "0",
        trend: "flat",
      },
      {
        id: "kpi-outward",
        label: "Outward Activities",
        value: String(totalOutwardLogs),
        delta: "0",
        trend: "flat",
      },
      {
        id: "kpi-qr",
        label: "QR Scans",
        value: String(totalQrScans),
        delta: "0",
        trend: "flat",
      },
      {
        id: "kpi-alerts",
        label: "Open Alerts",
        value: String(openAlerts),
        delta: String(totalAlerts),
        trend: "flat",
      },
      {
        id: "kpi-suppliers",
        label: "Total Suppliers",
        value: String(totalSuppliers),
        delta: "0",
        trend: "flat",
      },
      {
        id: "kpi-items",
        label: "Total Items",
        value: String(totalItems),
        delta: "0",
        trend: "flat",
      },
    ],
    processCards: [
      {
        id: "process-products",
        name: "Product Entry",
        total: totalProducts,
        completed: availableProducts,
        pending: outOfStockProducts,
        color: "blue",
      },
      {
        id: "process-tools",
        name: "Tool Entry",
        total: totalTools,
        completed: totalTools,
        pending: 0,
        color: "indigo",
      },
      {
        id: "process-tentative-schedules",
        name: "Tentative Schedules",
        total: tentativeSchedules,
        completed: 0,
        pending: tentativeSchedules,
        color: "amber",
      },
      {
        id: "process-final-schedules",
        name: "Final Schedules",
        total: finalSchedules,
        completed: finalSchedules,
        pending: 0,
        color: "green",
      },
      {
        id: "process-inward",
        name: "Inward Process",
        total: totalInwardLogs,
        completed: totalInwardLogs,
        pending: 0,
        color: "purple",
      },
      {
        id: "process-outward",
        name: "Outward Process",
        total: totalOutwardLogs,
        completed: totalOutwardLogs,
        pending: 0,
        color: "rose",
      },
    ],
    recentRecords: [
      ...recentSchedules.map((schedule) => ({
        id: `schedule-${schedule.id}`,
        title: schedule.item?.name ?? "Schedule",
        description: `From ${schedule.supplier?.name ?? "Supplier"} - ${schedule.status}`,
        timestamp: formatDate(schedule.createdAt),
        type: "Schedule",
      })),
      ...recentTools.map((tool) => ({
        id: `tool-${tool.id}`,
        title: tool.toolName,
        description: `${tool.item?.name ?? "Tool"} - Rate: ${tool.rate}`,
        timestamp: formatDate(tool.createdAt),
        type: "Tool",
      })),
    ].sort((a, b) => {
      const dateA = a.timestamp.split("-").reverse().join("-");
      const dateB = b.timestamp.split("-").reverse().join("-");
      return dateB.localeCompare(dateA);
    }).slice(0, 5),
    activities: [
      ...recentInwardLogs.map((log) => ({
        id: `inward-${log.id}`,
        title: `${log.product?.item?.name ?? log.product?.serial ?? "Unknown"} — INWARD`,
        timestamp: formatDate(log.inAt),
        tag: "INWARD",
        imageUrl: log.product?.images?.[0]?.url ?? undefined,
        movedBy: log.inBy?.name ?? null,
        movedByImageUrl: log.inBy?.images?.[0]?.url ?? undefined,
      })),
      ...recentOutwardLogs.map((log) => ({
        id: `outward-${log.id}`,
        title: `${log.product?.item?.name ?? log.product?.serial ?? "Unknown"} — OUTWARD`,
        timestamp: formatDate(log.outAt),
        tag: "OUTWARD",
        imageUrl: log.product?.images?.[0]?.url ?? undefined,
        movedBy: log.outBy?.name ?? null,
        movedByImageUrl: log.outBy?.images?.[0]?.url ?? undefined,
      })),
      ...recentQrScans.map((scan) => ({
        id: `qr-${scan.id}`,
        title: `${scan.product?.item?.name ?? scan.product?.serial ?? "Unknown"} — QR SCANNED`,
        timestamp: formatDate(scan.scannedAt),
        tag: "QR_SCAN",
        imageUrl: scan.product?.images?.[0]?.url ?? undefined,
        movedBy: scan.scannedBy?.name ?? null,
        movedByImageUrl: scan.scannedBy?.images?.[0]?.url ?? undefined,
      })),
    ].sort((a, b) => {
      const dateA = a.timestamp.split("-").reverse().join("-");
      const dateB = b.timestamp.split("-").reverse().join("-");
      return dateB.localeCompare(dateA);
    }).slice(0, 8),
    alerts: recentAlerts.map((alert) => ({
      id: alert.id,
      title: alert.title,
      severity: alert.severity.toLowerCase() as "low" | "medium" | "high",
      description: alert.description ?? "",
    })),
  };
}

export class ProductRepository extends BaseRepository implements IProductRepository {
  async create(data: Prisma.ProductCreateInput): Promise<Product> {
    try {
      return await prisma.product.create({ data });
    } catch (error) {
      throw toRepositoryError(error, "Failed to create product");
    }
  }

  async update(id: string, data: Prisma.ProductUpdateInput): Promise<Product> {
    try {
      return await prisma.product.update({ where: { id }, data });
    } catch (error) {
      throw toRepositoryError(error, "Failed to update product");
    }
  }

  async delete(id: string): Promise<Product> {
    try {
      return await prisma.product.delete({ where: { id } });
    } catch (error) {
      throw toRepositoryError(error, "Failed to delete product");
    }
  }

  async findById(id: string) {
    try {
      return await prisma.product.findUnique({ 
        where: { id },
        include: {
          images: true,
          type: true,
          item: true,
          supplier: true,
          store: true
        }
      });
    } catch (error) {
      throw toRepositoryError(error, "Failed to find product by id");
    }
  }

  async findAll(): Promise<Product[]> {
    try {
      return await prisma.product.findMany({ orderBy: { createdAt: "desc" } });
    } catch (error) {
      throw toRepositoryError(error, "Failed to fetch products");
    }
  }

  async search(term: string, options: PageOptions = {}, plantId?: string): Promise<PageResult<Product>> {
    const { page, pageSize, skip, take } = this.getPagination(options);
    
    // Build where clause with proper AND logic
    const where: Prisma.ProductWhereInput = {
      AND: [
        // Store filter (if storeId provided, MUST match)
        ...(plantId ? [{ storeId: plantId }] : []),
        // Search filter (only if term provided)
        ...(term ? [{
          OR: [
            { serial: { contains: term, mode: "insensitive" as const } },
            { item: { name: { contains: term, mode: "insensitive" as const } } },
          ],
        }] : [])
      ]
    };

    try {
      const [data, total] = await prisma.$transaction([
        prisma.product.findMany({ 
          where, 
          skip, 
          take, 
          orderBy: { createdAt: "desc" },
          include: {
            images: true,
            type: true,
            item: true,
            supplier: true,
            store: true
          }
        }),
        prisma.product.count({ where }),
      ]);

      return this.buildPageResult(data, total, page, pageSize);
    } catch (error) {
      throw toRepositoryError(error, "Failed to search products");
    }
  }

  async paginate(options: PageOptions = {}, plantId?: string): Promise<PageResult<Product>> {
    const { page, pageSize, skip, take } = this.getPagination(options);

    // Filter products by store if plantId is provided
    const where: Prisma.ProductWhereInput = plantId ? { storeId: plantId } : {};

    try {
      const [data, total] = await prisma.$transaction([
        prisma.product.findMany({ 
          where,
          skip, 
          take, 
          orderBy: { createdAt: "desc" },
          include: {
            images: true,
            type: true,
            item: true,
            supplier: true,
            store: true
          }
        }),
        prisma.product.count({ where }),
      ]);

      return this.buildPageResult(data, total, page, pageSize);
    } catch (error) {
      throw toRepositoryError(error, "Failed to paginate products");
    }
  }


  async findBySerial(serial: string): Promise<Product | null> {
    try {
      return await prisma.product.findUnique({ where: { serial } });
    } catch (error) {
      throw toRepositoryError(error, "Failed to find product by serial");
    }
  }

  async findByCategory(typeId: string): Promise<Product[]> {
    try {
      return await prisma.product.findMany({
        where: { typeId },
        orderBy: { createdAt: "desc" },
      });
    } catch (error) {
      throw toRepositoryError(error, "Failed to find products by type");
    }
  }

  async findBySupplier(supplierId: string): Promise<Product[]> {
    try {
      return await prisma.product.findMany({
        where: { supplierId },
        orderBy: { createdAt: "desc" },
      });
    } catch (error) {
      throw toRepositoryError(error, "Failed to find products by supplier");
    }
  }

  async findByStoreRoom(plantId: string): Promise<Product[]> {
    try {
      return await prisma.product.findMany({
        where: { storeId: plantId },
        orderBy: { createdAt: "desc" },
      });
    } catch (error) {
      throw toRepositoryError(error, "Failed to find products by store");
    }
  }


  async findByStatus(status: string): Promise<Product[]> {
    try {
      return await prisma.product.findMany({
        where: { status: status as any },
        orderBy: { createdAt: "desc" },
      });
    } catch (error) {
      throw toRepositoryError(error, "Failed to find products by status");
    }
  }
}
