import type { UserImage, ProductImage, Prisma } from "@prisma/client";
import { UploadRepository } from "@/repositories/uploadRepository";
import { toServiceError } from "@/services/base/serviceError";
import { promises as fs } from "fs";
import path from "path";
import { writeFileToUploads } from "@/services/utils/fileStorage";

export type UploadInput = {
  fileName: string;
  data: Buffer;
  folder?: string;
};

export type UploadResult = {
  fileName: string;
  relativePath: string;
};

export class ImageUploadService {
  private uploadRepository: UploadRepository;

  constructor() {
    this.uploadRepository = new UploadRepository();
  }

  // Legacy method for file upload
  async uploadImage(input: UploadInput): Promise<UploadResult> {
    try {
      const sanitizedName = path.basename(input.fileName);
      const stored = await writeFileToUploads(sanitizedName, input.data, input.folder ?? "images");
      return { fileName: sanitizedName, relativePath: stored.relativePath };
    } catch (error) {
      throw toServiceError(error, "Failed to upload image");
    }
  }

  // User Image Methods
  async uploadUserImage(
    userId: string,
    file: { filename: string; path: string; mimetype: string; size: number }
  ): Promise<UserImage> {
    try {
      // Get primary image count to set first as primary
      const existingImages = await this.uploadRepository.getUserImages(userId);
      const isPrimary = existingImages.length === 0;

      // Calculate relative URL path
      const url = `/uploads/users/${file.filename}`;

      return await this.uploadRepository.createUserImage({
        url,
        isPrimary,
        user: { connect: { id: userId } },
      });
    } catch (error) {
      // Clean up file if database operation fails
      try {
        await fs.unlink(file.path);
      } catch {}
      throw toServiceError(error, "Failed to upload user image");
    }
  }

  async getUserImages(userId: string): Promise<UserImage[]> {
    try {
      return await this.uploadRepository.getUserImages(userId);
    } catch (error) {
      throw toServiceError(error, "Failed to fetch user images");
    }
  }

  async deleteUserImage(imageId: string): Promise<void> {
    try {
      const image = await this.uploadRepository.getUserImage(imageId);

      if (!image) {
        throw new Error("Image not found");
      }

      // Delete from database
      await this.uploadRepository.deleteUserImage(imageId);

      // Delete from file system
      const filePath = path.join(process.cwd(), "public", image.url);
      try {
        await fs.unlink(filePath);
      } catch (error) {
        console.error("Failed to delete image file:", error);
      }
    } catch (error) {
      throw toServiceError(error, "Failed to delete user image");
    }
  }

  async setUserImageAsPrimary(imageId: string): Promise<UserImage> {
    try {
      const image = await this.uploadRepository.getUserImage(imageId);

      if (!image) {
        throw new Error("Image not found");
      }

      return await this.uploadRepository.setUserImageAsPrimary(imageId, image.userId);
    } catch (error) {
      throw toServiceError(error, "Failed to set primary user image");
    }
  }

  async getUserPrimaryImage(userId: string): Promise<UserImage | null> {
    try {
      return await this.uploadRepository.getUserPrimaryImage(userId);
    } catch (error) {
      throw toServiceError(error, "Failed to fetch primary user image");
    }
  }

  // Machine Image Methods
  async uploadMachineImage(
    machineId: string,
    file: { filename: string; path: string; mimetype: string; size: number }
  ): Promise<ProductImage> {
    try {
      // Get primary image count to set first as primary
      const existingImages = await this.uploadRepository.getMachineImages(machineId);
      const isPrimary = existingImages.length === 0;

      // Calculate relative URL path
      const url = `/uploads/machines/${file.filename}`;

      return await this.uploadRepository.createMachineImage({
        url,
        isPrimary,
        product: { connect: { id: machineId } },
      });
    } catch (error) {
      // Clean up file if database operation fails
      try {
        await fs.unlink(file.path);
      } catch {}
      throw toServiceError(error, "Failed to upload machine image");
    }
  }

  async getMachineImages(machineId: string): Promise<ProductImage[]> {
    try {
      return await this.uploadRepository.getMachineImages(machineId);
    } catch (error) {
      throw toServiceError(error, "Failed to fetch machine images");
    }
  }

  async deleteMachineImage(imageId: string): Promise<void> {
    try {
      const image = await this.uploadRepository.getMachineImage(imageId);

      if (!image) {
        throw new Error("Image not found");
      }

      // Delete from database
      await this.uploadRepository.deleteMachineImage(imageId);

      // Delete from file system
      const filePath = path.join(process.cwd(), "public", image.url);
      try {
        await fs.unlink(filePath);
      } catch (error) {
        console.error("Failed to delete image file:", error);
      }
    } catch (error) {
      throw toServiceError(error, "Failed to delete machine image");
    }
  }

  async setMachineImageAsPrimary(imageId: string): Promise<ProductImage> {
    try {
      const image = await this.uploadRepository.getMachineImage(imageId);

      if (!image) {
        throw new Error("Image not found");
      }

      return await this.uploadRepository.setMachineImageAsPrimary(imageId, image.productId);
    } catch (error) {
      throw toServiceError(error, "Failed to set primary machine image");
    }
  }

  async getMachinePrimaryImage(machineId: string): Promise<ProductImage | null> {
    try {
      return await this.uploadRepository.getMachinePrimaryImage(machineId);
    } catch (error) {
      throw toServiceError(error, "Failed to fetch primary machine image");
    }
  }

  async uploadMultipleMachineImages(
    machineId: string,
    files: { filename: string; path: string; mimetype: string; size: number }[]
  ): Promise<ProductImage[]> {
    try {
      const images: ProductImage[] = [];

      for (let i = 0; i < files.length; i++) {
        const image = await this.uploadMachineImage(machineId, files[i]);
        images.push(image);
      }

      return images;
    } catch (error) {
      // Clean up all uploaded files on error
      for (const file of files) {
        try {
          await fs.unlink(file.path);
        } catch {}
      }
      throw toServiceError(error, "Failed to upload machine images");
    }
  }
}
