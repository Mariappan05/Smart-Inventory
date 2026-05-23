import type { Prisma, Store } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { BaseRepository, type PageOptions, type PageResult } from "@/repositories/base/baseRepository";
import { toRepositoryError } from "@/repositories/base/repositoryError";
import type { IStoreRoomRepository } from "@/repositories/types";

export class StoreRoomRepository extends BaseRepository implements IStoreRoomRepository {
  async create(data: Prisma.StoreCreateInput): Promise<Store> {
    try {
      return await prisma.store.create({ data });
    } catch (error) {
      throw toRepositoryError(error, "Failed to create store room");
    }
  }

  async update(id: string, data: Prisma.StoreUpdateInput): Promise<Store> {
    try {
      return await prisma.store.update({ where: { id }, data });
    } catch (error) {
      throw toRepositoryError(error, "Failed to update store room");
    }
  }

  async delete(id: string): Promise<Store> {
    try {
      return await prisma.store.delete({ where: { id } });
    } catch (error) {
      throw toRepositoryError(error, "Failed to delete store room");
    }
  }

  async findById(id: string): Promise<Store | null> {
    try {
      return await prisma.store.findUnique({ where: { id } });
    } catch (error) {
      throw toRepositoryError(error, "Failed to find store room by id");
    }
  }

  async findAll(): Promise<Store[]> {
    try {
      return await prisma.store.findMany({ orderBy: { name: "asc" } });
    } catch (error) {
      throw toRepositoryError(error, "Failed to fetch store rooms");
    }
  }

  async search(term: string, options: PageOptions = {}): Promise<PageResult<Store>> {
    const { page, pageSize, skip, take } = this.getPagination(options);
    const where: Prisma.StoreWhereInput = {
      OR: [
        { name: { contains: term, mode: "insensitive" } },
      ],
    };

    try {
      const [data, total] = await prisma.$transaction([
        prisma.store.findMany({ where, skip, take, orderBy: { name: "asc" } }),
        prisma.store.count({ where }),
      ]);

      return this.buildPageResult(data, total, page, pageSize);
    } catch (error) {
      throw toRepositoryError(error, "Failed to search store rooms");
    }
  }

  async paginate(options: PageOptions = {}): Promise<PageResult<Store>> {
    const { page, pageSize, skip, take } = this.getPagination(options);

    try {
      const [data, total] = await prisma.$transaction([
        prisma.store.findMany({ skip, take, orderBy: { name: "asc" } }),
        prisma.store.count(),
      ]);

      return this.buildPageResult(data, total, page, pageSize);
    } catch (error) {
      throw toRepositoryError(error, "Failed to paginate store rooms");
    }
  }
}
