import type { Prisma, QrScanLog } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { BaseRepository, type PageOptions, type PageResult } from "@/repositories/base/baseRepository";
import { toRepositoryError } from "@/repositories/base/repositoryError";
import type { IQRRepository } from "@/repositories/types";

export class QRRepository extends BaseRepository implements IQRRepository {
  async createScanLog(data: Prisma.QrScanLogCreateInput): Promise<QrScanLog> {
    return this.create(data);
  }

  async create(data: Prisma.QrScanLogCreateInput): Promise<QrScanLog> {
    try {
      return await prisma.qrScanLog.create({ data });
    } catch (error) {
      throw toRepositoryError(error, "Failed to create QR scan log");
    }
  }

  async update(id: string, data: Prisma.QrScanLogUpdateInput): Promise<QrScanLog> {
    try {
      return await prisma.qrScanLog.update({ where: { id }, data });
    } catch (error) {
      throw toRepositoryError(error, "Failed to update QR scan log");
    }
  }

  async delete(id: string): Promise<QrScanLog> {
    try {
      return await prisma.qrScanLog.delete({ where: { id } });
    } catch (error) {
      throw toRepositoryError(error, "Failed to delete QR scan log");
    }
  }

  async findById(id: string): Promise<QrScanLog | null> {
    try {
      return await prisma.qrScanLog.findUnique({ where: { id } });
    } catch (error) {
      throw toRepositoryError(error, "Failed to find QR scan log by id");
    }
  }

  async findAll(): Promise<QrScanLog[]> {
    try {
      return await prisma.qrScanLog.findMany({ orderBy: { scannedAt: "desc" } });
    } catch (error) {
      throw toRepositoryError(error, "Failed to fetch QR scan logs");
    }
  }

  async search(term: string, options: PageOptions = {}): Promise<PageResult<QrScanLog>> {
    const { page, pageSize, skip, take } = this.getPagination(options);
    const where: Prisma.QrScanLogWhereInput = {
      OR: [
        { payload: { contains: term, mode: "insensitive" } },
        { product: { serial: { contains: term, mode: "insensitive" } } },
      ],
    };

    try {
      const [data, total] = await prisma.$transaction([
        prisma.qrScanLog.findMany({ where, skip, take, orderBy: { scannedAt: "desc" } }),
        prisma.qrScanLog.count({ where }),
      ]);

      return this.buildPageResult(data, total, page, pageSize);
    } catch (error) {
      throw toRepositoryError(error, "Failed to search QR scan logs");
    }
  }

  async paginate(options: PageOptions = {}, storeId?: string): Promise<PageResult<QrScanLog>> {
    const { page, pageSize, skip, take } = this.getPagination(options);

    // Filter by store if provided
    const where: Prisma.QrScanLogWhereInput = storeId ? { storeId } : {};

    try {
      const [data, total] = await prisma.$transaction([
        prisma.qrScanLog.findMany({ 
          where,
          skip, 
          take, 
          orderBy: { scannedAt: "desc" },
          include: {
            product: {
              select: {
                id: true,
                serial: true,
                item: { select: { name: true } },
                images: { where: { isPrimary: true }, take: 1 }
              }
            }
          }
        }),
        prisma.qrScanLog.count({ where }),
      ]);

      return this.buildPageResult(data, total, page, pageSize);
    } catch (error) {
      throw toRepositoryError(error, "Failed to paginate QR scan logs");
    }
  }

  async findByMachineId(machineId: string): Promise<QrScanLog[]> {
    try {
      return await prisma.qrScanLog.findMany({
        where: { productId: machineId },
        orderBy: { scannedAt: "desc" },
      });
    } catch (error) {
      throw toRepositoryError(error, "Failed to fetch QR scan logs by machine");
    }
  }

  async findLatestByMachineId(machineId: string): Promise<QrScanLog | null> {
    try {
      return await prisma.qrScanLog.findFirst({
        where: { productId: machineId },
        orderBy: { scannedAt: "desc" },
      });
    } catch (error) {
      throw toRepositoryError(error, "Failed to fetch latest QR scan log");
    }
  }

  async findByPayload(payload: string): Promise<QrScanLog | null> {
    try {
      return await prisma.qrScanLog.findFirst({ where: { payload } });
    } catch (error) {
      throw toRepositoryError(error, "Failed to fetch QR scan log by payload");
    }
  }
}
