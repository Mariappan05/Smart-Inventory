import type { Prisma, Supplier } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { BaseRepository, type PageOptions, type PageResult } from "@/repositories/base/baseRepository";
import { toRepositoryError } from "@/repositories/base/repositoryError";
import type { ISupplierRepository } from "@/repositories/types";

export class SupplierRepository extends BaseRepository implements ISupplierRepository {
  async create(data: Prisma.SupplierCreateInput): Promise<Supplier> {
    try {
      return await prisma.supplier.create({ data });
    } catch (error) {
      throw toRepositoryError(error, "Failed to create supplier");
    }
  }

  async update(id: string, data: Prisma.SupplierUpdateInput): Promise<Supplier> {
    try {
      return await prisma.supplier.update({ where: { id }, data });
    } catch (error) {
      throw toRepositoryError(error, "Failed to update supplier");
    }
  }

  async delete(id: string): Promise<Supplier> {
    try {
      return await prisma.supplier.delete({ where: { id } });
    } catch (error) {
      throw toRepositoryError(error, "Failed to delete supplier");
    }
  }

  async findById(id: string): Promise<Supplier | null> {
    try {
      return await prisma.supplier.findUnique({ where: { id } });
    } catch (error) {
      throw toRepositoryError(error, "Failed to find supplier by id");
    }
  }

  async findAll(): Promise<Supplier[]> {
    try {
      return await prisma.supplier.findMany({ orderBy: { name: "asc" } });
    } catch (error) {
      throw toRepositoryError(error, "Failed to fetch suppliers");
    }
  }

  async search(term: string, options: PageOptions = {}): Promise<PageResult<Supplier>> {
    const { page, pageSize, skip, take } = this.getPagination(options);
    const where: Prisma.SupplierWhereInput = {
      OR: [
        { name: { contains: term, mode: "insensitive" } },
        { code: { contains: term, mode: "insensitive" } },
        { contactEmail: { contains: term, mode: "insensitive" } },
      ],
    };

    try {
      const [data, total] = await prisma.$transaction([
        prisma.supplier.findMany({ where, skip, take, orderBy: { name: "asc" } }),
        prisma.supplier.count({ where }),
      ]);

      return this.buildPageResult(data, total, page, pageSize);
    } catch (error) {
      throw toRepositoryError(error, "Failed to search suppliers");
    }
  }

  async paginate(options: PageOptions = {}): Promise<PageResult<Supplier>> {
    const { page, pageSize, skip, take } = this.getPagination(options);

    try {
      const [data, total] = await prisma.$transaction([
        prisma.supplier.findMany({ skip, take, orderBy: { name: "asc" } }),
        prisma.supplier.count(),
      ]);

      return this.buildPageResult(data, total, page, pageSize);
    } catch (error) {
      throw toRepositoryError(error, "Failed to paginate suppliers");
    }
  }
}
