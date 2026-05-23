import type { Prisma, SecurityAlert } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { BaseRepository, type PageOptions, type PageResult } from "@/repositories/base/baseRepository";
import { toRepositoryError } from "@/repositories/base/repositoryError";
import type { IAlertRepository } from "@/repositories/types";

export class AlertRepository extends BaseRepository implements IAlertRepository {
  async create(data: Prisma.SecurityAlertCreateInput): Promise<SecurityAlert> {
    try {
      return await prisma.securityAlert.create({ data });
    } catch (error) {
      throw toRepositoryError(error, "Failed to create alert");
    }
  }

  async update(id: string, data: Prisma.SecurityAlertUpdateInput): Promise<SecurityAlert> {
    try {
      return await prisma.securityAlert.update({ where: { id }, data });
    } catch (error) {
      throw toRepositoryError(error, "Failed to update alert");
    }
  }

  async delete(id: string): Promise<SecurityAlert> {
    try {
      return await prisma.securityAlert.delete({ where: { id } });
    } catch (error) {
      throw toRepositoryError(error, "Failed to delete alert");
    }
  }

  async findById(id: string): Promise<SecurityAlert | null> {
    try {
      return await prisma.securityAlert.findUnique({ where: { id } });
    } catch (error) {
      throw toRepositoryError(error, "Failed to find alert by id");
    }
  }

  async findAll(): Promise<SecurityAlert[]> {
    try {
      return await prisma.securityAlert.findMany({ orderBy: { createdAt: "desc" } });
    } catch (error) {
      throw toRepositoryError(error, "Failed to fetch alerts");
    }
  }

  async search(term: string, options: PageOptions = {}): Promise<PageResult<SecurityAlert>> {
    const { page, pageSize, skip, take } = this.getPagination(options);
    const where: Prisma.SecurityAlertWhereInput = {
      OR: [
        { title: { contains: term, mode: "insensitive" } },
        { description: { contains: term, mode: "insensitive" } },
        { product: { serial: { contains: term, mode: "insensitive" } } },
      ],
    };

    try {
      const [data, total] = await prisma.$transaction([
        prisma.securityAlert.findMany({ where, skip, take, orderBy: { createdAt: "desc" } }),
        prisma.securityAlert.count({ where }),
      ]);

      return this.buildPageResult(data, total, page, pageSize);
    } catch (error) {
      throw toRepositoryError(error, "Failed to search alerts");
    }
  }

  async paginate(options: PageOptions = {}, storeId?: string): Promise<PageResult<SecurityAlert>> {
    const { page, pageSize, skip, take } = this.getPagination(options);

    // Filter by store if provided
    const where: Prisma.SecurityAlertWhereInput = storeId ? { storeId } : {};

    try {
      const [data, total] = await prisma.$transaction([
        prisma.securityAlert.findMany({ where, skip, take, orderBy: { createdAt: "desc" } }),
        prisma.securityAlert.count({ where }),
      ]);

      return this.buildPageResult(data, total, page, pageSize);
    } catch (error) {
      throw toRepositoryError(error, "Failed to paginate alerts");
    }
  }

  async findOpenAlerts(storeId?: string): Promise<SecurityAlert[]> {
    try {
      const where: Prisma.SecurityAlertWhereInput = {
        status: "OPEN",
        ...(storeId ? { storeId } : {}),
      };
      return await prisma.securityAlert.findMany({
        where,
        orderBy: { createdAt: "desc" },
      });
    } catch (error) {
      throw toRepositoryError(error, "Failed to fetch open alerts");
    }
  }

  async findRecentAlerts(limit = 10, storeId?: string): Promise<SecurityAlert[]> {
    try {
      const where: Prisma.SecurityAlertWhereInput = storeId ? { storeId } : {};
      return await prisma.securityAlert.findMany({
        where,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: { product: true, reportedBy: true },
      });
    } catch (error) {
      throw toRepositoryError(error, "Failed to fetch recent alerts");
    }
  }

  async findByMachineId(machineId: string): Promise<SecurityAlert[]> {
    try {
      return await prisma.securityAlert.findMany({
        where: { productId: machineId },
        orderBy: { createdAt: "desc" },
      });
    } catch (error) {
      throw toRepositoryError(error, "Failed to fetch alerts by machine");
    }
  }
}
