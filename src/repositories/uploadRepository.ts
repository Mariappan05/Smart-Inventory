import type { UserImage, ProductImage, Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { BaseRepository } from "@/repositories/base/baseRepository";
import { toRepositoryError } from "@/repositories/base/repositoryError";

export class UploadRepository extends BaseRepository {
  // User Image Methods
  async createUserImage(data: Prisma.UserImageCreateInput): Promise<UserImage> {
    try {
      return await prisma.userImage.create({ data });
    } catch (error) {
      throw toRepositoryError(error, "Failed to create user image");
    }
  }

  async getUserImages(userId: string): Promise<UserImage[]> {
    try {
      return await prisma.userImage.findMany({
        where: { userId },
        orderBy: [{ isPrimary: "desc" }, { createdAt: "desc" }],
      });
    } catch (error) {
      throw toRepositoryError(error, "Failed to fetch user images");
    }
  }

  async getUserImage(id: string): Promise<UserImage | null> {
    try {
      return await prisma.userImage.findUnique({ where: { id } });
    } catch (error) {
      throw toRepositoryError(error, "Failed to fetch user image");
    }
  }

  async deleteUserImage(id: string): Promise<UserImage> {
    try {
      return await prisma.userImage.delete({ where: { id } });
    } catch (error) {
      throw toRepositoryError(error, "Failed to delete user image");
    }
  }

  async setUserImageAsPrimary(id: string, userId: string): Promise<UserImage> {
    try {
      // Unset all other primary images
      await prisma.userImage.updateMany({
        where: { userId },
        data: { isPrimary: false },
      });

      // Set this image as primary
      return await prisma.userImage.update({
        where: { id },
        data: { isPrimary: true },
      });
    } catch (error) {
      throw toRepositoryError(error, "Failed to set primary user image");
    }
  }

  async getUserPrimaryImage(userId: string): Promise<UserImage | null> {
    try {
      return await prisma.userImage.findFirst({
        where: { userId, isPrimary: true },
      });
    } catch (error) {
      throw toRepositoryError(error, "Failed to fetch primary user image");
    }
  }

  // Product Image Methods (kept as "Machine" methods for backward compatibility)
  async createMachineImage(data: Prisma.ProductImageCreateInput): Promise<ProductImage> {
    try {
      return await prisma.productImage.create({ data });
    } catch (error) {
      throw toRepositoryError(error, "Failed to create machine image");
    }
  }

  async getMachineImages(machineId: string): Promise<ProductImage[]> {
    try {
      return await prisma.productImage.findMany({
        where: { productId: machineId },
        orderBy: [{ isPrimary: "desc" }, { createdAt: "desc" }],
      });
    } catch (error) {
      throw toRepositoryError(error, "Failed to fetch machine images");
    }
  }

  async getMachineImage(id: string): Promise<ProductImage | null> {
    try {
      return await prisma.productImage.findUnique({ where: { id } });
    } catch (error) {
      throw toRepositoryError(error, "Failed to fetch machine image");
    }
  }

  async deleteMachineImage(id: string): Promise<ProductImage> {
    try {
      return await prisma.productImage.delete({ where: { id } });
    } catch (error) {
      throw toRepositoryError(error, "Failed to delete machine image");
    }
  }

  async setMachineImageAsPrimary(id: string, machineId: string): Promise<ProductImage> {
    try {
      // Unset all other primary images
      await prisma.productImage.updateMany({
        where: { productId: machineId },
        data: { isPrimary: false },
      });

      // Set this image as primary
      return await prisma.productImage.update({
        where: { id },
        data: { isPrimary: true },
      });
    } catch (error) {
      throw toRepositoryError(error, "Failed to set primary machine image");
    }
  }

  async getMachinePrimaryImage(machineId: string): Promise<ProductImage | null> {
    try {
      return await prisma.productImage.findFirst({
        where: { productId: machineId, isPrimary: true },
      });
    } catch (error) {
      throw toRepositoryError(error, "Failed to fetch primary machine image");
    }
  }
}
