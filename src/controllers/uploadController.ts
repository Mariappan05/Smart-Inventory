import { NextRequest, NextResponse } from "next/server";
import { ImageUploadService } from "@/services/imageUploadService";
import { validateImageFile, UPLOAD_CONFIG, ensureUploadDirs } from "@/config/uploadConfig";

const imageUploadService = new ImageUploadService();

// Ensure upload directories exist on module load
ensureUploadDirs();

export class UploadController {
  async uploadUserImage(req: NextRequest, userId: string) {
    try {
      const formData = await req.formData();
      const file = formData.get("file") as File;

      if (!file) {
        return NextResponse.json(
          { success: false, message: "No file provided" },
          { status: 400 }
        );
      }

      // Validate file
      const validation = validateImageFile({
        mimetype: file.type,
        size: file.size,
        originalname: file.name,
      });

      if (!validation.valid) {
        return NextResponse.json(
          { success: false, message: validation.error },
          { status: 400 }
        );
      }

      // Convert file to buffer
      const buffer = Buffer.from(await file.arrayBuffer());

      // Generate unique filename
      const timestamp = Date.now();
      const random = Math.random().toString(36).substring(2, 8);
      const ext = file.name.split(".").pop();
      const filename = `${userId}-${timestamp}-${random}.${ext}`;

      // Save file to disk
      const fs = await import("fs").then((m) => m.promises);
      const filepath = `${UPLOAD_CONFIG.USER_UPLOAD_DIR}/${filename}`;
      await fs.writeFile(filepath, buffer);

      // Save to database
      const image = await imageUploadService.uploadUserImage(userId, {
        filename,
        path: filepath,
        mimetype: file.type,
        size: file.size,
      });

      return NextResponse.json(
        { success: true, data: image },
        { status: 201 }
      );
    } catch (error) {
      console.error("Upload error:", error);
      return NextResponse.json(
        { success: false, message: error instanceof Error ? error.message : "Upload failed" },
        { status: 500 }
      );
    }
  }

  async uploadMachineImages(req: NextRequest, machineId: string) {
    try {
      const formData = await req.formData();
      const files = formData.getAll("files") as File[];

      if (!files || files.length === 0) {
        return NextResponse.json(
          { success: false, message: "No files provided" },
          { status: 400 }
        );
      }

      const fs = await import("fs").then((m) => m.promises);
      const uploadedFiles: { filename: string; path: string; mimetype: string; size: number }[] =
        [];

      for (const file of files) {
        // Validate file
        const validation = validateImageFile({
          mimetype: file.type,
          size: file.size,
          originalname: file.name,
        });

        if (!validation.valid) {
          return NextResponse.json(
            { success: false, message: validation.error },
            { status: 400 }
          );
        }

        // Convert file to buffer
        const buffer = Buffer.from(await file.arrayBuffer());

        // Generate unique filename
        const timestamp = Date.now();
        const random = Math.random().toString(36).substring(2, 8);
        const ext = file.name.split(".").pop();
        const filename = `${machineId}-${timestamp}-${random}.${ext}`;

        // Save file to disk
        const filepath = `${UPLOAD_CONFIG.MACHINE_UPLOAD_DIR}/${filename}`;
        await fs.writeFile(filepath, buffer);

        uploadedFiles.push({
          filename,
          path: filepath,
          mimetype: file.type,
          size: file.size,
        });
      }

      // Save to database
      const images = await imageUploadService.uploadMultipleMachineImages(machineId, uploadedFiles);

      return NextResponse.json(
        { success: true, data: images },
        { status: 201 }
      );
    } catch (error) {
      console.error("Upload error:", error);
      return NextResponse.json(
        { success: false, message: error instanceof Error ? error.message : "Upload failed" },
        { status: 500 }
      );
    }
  }

  async getUserImages(userId: string) {
    try {
      const images = await imageUploadService.getUserImages(userId);
      return NextResponse.json({ success: true, data: images });
    } catch (error) {
      return NextResponse.json(
        { success: false, message: "Failed to fetch images" },
        { status: 500 }
      );
    }
  }

  async deleteUserImage(imageId: string) {
    try {
      await imageUploadService.deleteUserImage(imageId);
      return NextResponse.json({ success: true });
    } catch (error) {
      return NextResponse.json(
        { success: false, message: error instanceof Error ? error.message : "Delete failed" },
        { status: 500 }
      );
    }
  }

  async setUserImageAsPrimary(imageId: string) {
    try {
      const image = await imageUploadService.setUserImageAsPrimary(imageId);
      return NextResponse.json({ success: true, data: image });
    } catch (error) {
      return NextResponse.json(
        { success: false, message: "Failed to set primary image" },
        { status: 500 }
      );
    }
  }

  async getMachineImages(machineId: string) {
    try {
      const images = await imageUploadService.getMachineImages(machineId);
      return NextResponse.json({ success: true, data: images });
    } catch (error) {
      return NextResponse.json(
        { success: false, message: "Failed to fetch images" },
        { status: 500 }
      );
    }
  }

  async deleteMachineImage(imageId: string) {
    try {
      await imageUploadService.deleteMachineImage(imageId);
      return NextResponse.json({ success: true });
    } catch (error) {
      return NextResponse.json(
        { success: false, message: error instanceof Error ? error.message : "Delete failed" },
        { status: 500 }
      );
    }
  }

  async setMachineImageAsPrimary(imageId: string) {
    try {
      const image = await imageUploadService.setMachineImageAsPrimary(imageId);
      return NextResponse.json({ success: true, data: image });
    } catch (error) {
      return NextResponse.json(
        { success: false, message: "Failed to set primary image" },
        { status: 500 }
      );
    }
  }
}

export const uploadController = new UploadController();
