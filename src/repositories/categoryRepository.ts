import type { Prisma, Type } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { BaseRepository, type PageOptions, type PageResult } from "@/repositories/base/baseRepository";
import { toRepositoryError } from "@/repositories/base/repositoryError";
import type { ICategoryRepository } from "@/repositories/types";

export class CategoryRepository extends BaseRepository implements ICategoryRepository {
  async create(data: Prisma.TypeCreateInput): Promise<Type> {
    try {
      return await prisma.type.create({ data });
    } catch (error) {
      throw toRepositoryError(error, "Failed to create category");
    }
  }

  async update(id: string, data: Prisma.TypeUpdateInput): Promise<Type> {
    try {
      return await prisma.type.update({ where: { id }, data });
    } catch (error) {
      throw toRepositoryError(error, "Failed to update category");
    }
  }

  async delete(id: string): Promise<Type> {
    try {
      return await prisma.type.delete({ where: { id } });
    } catch (error) {
      throw toRepositoryError(error, "Failed to delete category");
    }
  }

  async findById(id: string): Promise<Type | null> {
    try {
      return await prisma.type.findUnique({ where: { id } });
    } catch (error) {
      throw toRepositoryError(error, "Failed to find category by id");
    }
  }

  async findAll(): Promise<Type[]> {
    try {
      return await prisma.type.findMany({ orderBy: { name: "asc" } });
    } catch (error) {
      throw toRepositoryError(error, "Failed to fetch categories");
    }
  }

  async search(term: string, options: PageOptions = {}): Promise<PageResult<Type>> {
    const { page, pageSize, skip, take } = this.getPagination(options);
    const where: Prisma.TypeWhereInput = {
      OR: [
        { name: { contains: term, mode: "insensitive" } },
      ],
    };

    try {
      const [data, total] = await prisma.$transaction([
        prisma.type.findMany({ where, skip, take, orderBy: { name: "asc" } }),
        prisma.type.count({ where }),
      ]);

      return this.buildPageResult(data, total, page, pageSize);
    } catch (error) {
      throw toRepositoryError(error, "Failed to search categories");
    }
  }

  async paginate(options: PageOptions = {}): Promise<PageResult<Type>> {
    const { page, pageSize, skip, take } = this.getPagination(options);

    try {
      const [data, total] = await prisma.$transaction([
        prisma.type.findMany({ skip, take, orderBy: { name: "asc" } }),
        prisma.type.count(),
      ]);

      return this.buildPageResult(data, total, page, pageSize);
    } catch (error) {
      throw toRepositoryError(error, "Failed to paginate categories");
    }
  }
}
