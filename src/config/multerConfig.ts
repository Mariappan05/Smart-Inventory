import multer, { StorageEngine, FileFilterCallback } from "multer";
import path from "path";
import { UPLOAD_CONFIG, generateFileName } from "@/config/uploadConfig";
import type { Request } from "express";

interface CustomRequest extends Request {
  userId?: string;
}

export function createUploadMiddleware(uploadDir: string): multer.Multer {
  const storage: StorageEngine = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, uploadDir);
    },
    filename: (req: CustomRequest, file, cb) => {
      const entityId = req.userId || "unknown";
      const fileName = generateFileName(file.originalname, entityId);
      cb(null, fileName);
    },
  });

  const fileFilter = (
    req: CustomRequest,
    file: Express.Multer.File,
    cb: FileFilterCallback
  ) => {
    const ext = path.extname(file.originalname).toLowerCase();

    if (!UPLOAD_CONFIG.ALLOWED_EXTENSIONS.includes(ext)) {
      cb(new Error(`Invalid file extension: ${ext}`));
      return;
    }

    if (!UPLOAD_CONFIG.ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      cb(new Error(`Invalid MIME type: ${file.mimetype}`));
      return;
    }

    cb(null, true);
  };

  return multer({
    storage,
    fileFilter,
    limits: {
      fileSize: UPLOAD_CONFIG.MAX_FILE_SIZE,
    },
  });
}

export const userUpload = createUploadMiddleware(UPLOAD_CONFIG.USER_UPLOAD_DIR);
export const machineUpload = createUploadMiddleware(UPLOAD_CONFIG.MACHINE_UPLOAD_DIR);
