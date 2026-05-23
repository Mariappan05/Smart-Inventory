import type { Prisma, User } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { BaseRepository, type PageOptions, type PageResult } from "@/repositories/base/baseRepository";
import { toRepositoryError } from "@/repositories/base/repositoryError";
import type { IUserRepository } from "@/repositories/types";

export class UserRepository extends BaseRepository implements IUserRepository {
  async create(data: Prisma.UserCreateInput): Promise<User> {
    try {
      return await prisma.user.create({ data });
    } catch (error) {
      throw toRepositoryError(error, "Failed to create user");
    }
  }

  async update(id: string, data: Prisma.UserUpdateInput): Promise<User> {
    try {
      return await prisma.user.update({ where: { id }, data });
    } catch (error) {
      throw toRepositoryError(error, "Failed to update user");
    }
  }

  async delete(id: string): Promise<User> {
    try {
      return await prisma.user.delete({ where: { id } });
    } catch (error) {
      throw toRepositoryError(error, "Failed to delete user");
    }
  }

  async findById(id: string): Promise<User | null> {
    try {
      return await prisma.user.findUnique({ where: { id } });
    } catch (error) {
      throw toRepositoryError(error, "Failed to find user by id");
    }
  }

  async findAll(): Promise<User[]> {
    try {
      return await prisma.user.findMany({ 
        orderBy: { createdAt: "desc" },
        include: {
          images: {
            where: { isPrimary: true },
            take: 1
          },
          store: {
            select: {
              id: true,
              name: true
            }
          }
        }
      });
    } catch (error) {
      throw toRepositoryError(error, "Failed to fetch users");
    }
  }

  async findByEmail(email: string): Promise<User | null> {
    try {
      return await prisma.user.findUnique({ where: { email } });
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "Unknown error";
      if (errorMsg.includes("P1001") || errorMsg.includes("Can't reach database")) {
        throw new Error("Database connection failed");
      }
      throw toRepositoryError(error, "Failed to find user by email");
    }
  }

  async findByEmployeeNo(employeeNo: string): Promise<User | null> {
    try {
      return await prisma.user.findUnique({ where: { employeeNo } });
    } catch (error) {
      throw toRepositoryError(error, "Failed to find user by employee number");
    }
  }

  async search(term: string, options: PageOptions = {}): Promise<PageResult<User>> {
    const { page, pageSize, skip, take } = this.getPagination(options);
    const where: Prisma.UserWhereInput = {
      OR: [
        { name: { contains: term, mode: "insensitive" } },
        { email: { contains: term, mode: "insensitive" } },
        { employeeNo: { contains: term, mode: "insensitive" } },
      ],
    };

    try {
      const [data, total] = await prisma.$transaction([
        prisma.user.findMany({ where, skip, take, orderBy: { createdAt: "desc" } }),
        prisma.user.count({ where }),
      ]);

      return this.buildPageResult(data, total, page, pageSize);
    } catch (error) {
      throw toRepositoryError(error, "Failed to search users");
    }
  }

  async paginate(options: PageOptions = {}): Promise<PageResult<User>> {
    const { page, pageSize, skip, take } = this.getPagination(options);

    try {
      const [data, total] = await prisma.$transaction([
        prisma.user.findMany({ skip, take, orderBy: { createdAt: "desc" } }),
        prisma.user.count(),
      ]);

      return this.buildPageResult(data, total, page, pageSize);
    } catch (error) {
      throw toRepositoryError(error, "Failed to paginate users");
    }
  }
}
