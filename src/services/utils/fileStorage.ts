import { promises as fs } from "fs";
import path from "path";

export type StoredFile = {
  diskPath: string;
  relativePath: string;
};

export async function ensureDir(dirPath: string) {
  await fs.mkdir(dirPath, { recursive: true });
}

export async function writeFileToUploads(
  fileName: string,
  data: Buffer,
  subfolder = ""
): Promise<StoredFile> {
  const uploadsRoot = path.join(process.cwd(), "uploads");
  const safeFolder = subfolder.replace(/[^a-zA-Z0-9-_\/]/g, "");
  const targetFolder = path.join(uploadsRoot, safeFolder);
  await ensureDir(targetFolder);

  const diskPath = path.join(targetFolder, fileName);
  await fs.writeFile(diskPath, data);

  const relativePath = path.join("uploads", safeFolder, fileName).replace(/\\/g, "/");
  return { diskPath, relativePath };
}
