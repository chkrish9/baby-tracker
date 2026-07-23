import fs from "fs/promises";
import path from "path";
import { createId } from "@paralleldrive/cuid2";

const UPLOADS_ROOT = path.join(process.cwd(), "uploads");

export async function saveFile(file: Express.Multer.File, relativeDirPath: string): Promise<string> {
  const ext = file.originalname.split(".").pop() ?? "bin";
  const filename = `${createId()}.${ext}`;
  const dir = path.join(UPLOADS_ROOT, relativeDirPath);
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(path.join(dir, filename), file.buffer);
  return `${relativeDirPath}/${filename}`;
}

export async function deleteFile(relativePath: string): Promise<void> {
  const abs = path.join(UPLOADS_ROOT, relativePath);
  await fs.unlink(abs);
}

export { UPLOADS_ROOT };
