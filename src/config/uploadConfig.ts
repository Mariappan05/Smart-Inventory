import path from "path";

const getUploadPaths = () => {
  if (typeof process === "undefined" || !process.cwd) {
    return {
      UPLOAD_DIR: "public/uploads",
      USER_UPLOAD_DIR: "public/uploads/users",
      MACHINE_UPLOAD_DIR: "public/uploads/machines",
    };
  }
  return {
    UPLOAD_DIR: path.join(process.cwd(), "public", "uploads"),
    USER_UPLOAD_DIR: path.join(process.cwd(), "public", "uploads", "users"),
    MACHINE_UPLOAD_DIR: path.join(process.cwd(), "public", "uploads", "machines"),
  };
};

export const UPLOAD_CONFIG = {
  ...getUploadPaths(),
  MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
  ALLOWED_MIME_TYPES: ["image/jpeg", "image/png", "image/webp", "image/gif"],
  ALLOWED_EXTENSIONS: [".jpg", ".jpeg", ".png", ".webp", ".gif"],
};

// Ensure upload directories exist (only in runtime, not at build time)
export function ensureUploadDirs() {
  if (typeof process === "undefined" || !process.cwd) {
    return;
  }
  
  try {
    const { existsSync, mkdirSync } = require("fs");
    const dirs = [
      UPLOAD_CONFIG.UPLOAD_DIR,
      UPLOAD_CONFIG.USER_UPLOAD_DIR,
      UPLOAD_CONFIG.MACHINE_UPLOAD_DIR,
    ];
    
    dirs.forEach((dir: string) => {
      if (!existsSync(dir)) {
        mkdirSync(dir, { recursive: true });
      }
    });
  } catch (error) {
    // Silently fail during build
  }
}

export function validateImageFile(file: {
  mimetype: string;
  size: number;
  originalname: string;
}): { valid: boolean; error?: string } {
  // Check MIME type
  if (!UPLOAD_CONFIG.ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    return {
      valid: false,
      error: `Invalid file type. Allowed types: ${UPLOAD_CONFIG.ALLOWED_MIME_TYPES.join(", ")}`,
    };
  }

  // Check file size
  if (file.size > UPLOAD_CONFIG.MAX_FILE_SIZE) {
    return {
      valid: false,
      error: `File size exceeds maximum limit of ${UPLOAD_CONFIG.MAX_FILE_SIZE / (1024 * 1024)}MB`,
    };
  }

  // Check file extension
  const ext = path.extname(file.originalname).toLowerCase();
  if (!UPLOAD_CONFIG.ALLOWED_EXTENSIONS.includes(ext)) {
    return {
      valid: false,
      error: `Invalid file extension. Allowed extensions: ${UPLOAD_CONFIG.ALLOWED_EXTENSIONS.join(", ")}`,
    };
  }

  return { valid: true };
}

export function generateFileName(originalName: string, entityId: string): string {
  const ext = path.extname(originalName).toLowerCase();
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  return `${entityId}-${timestamp}-${random}${ext}`;
}
