import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const UPLOAD_DIR = process.env.UPLOAD_DIR 
  ? path.resolve(process.cwd(), process.env.UPLOAD_DIR)
  : path.join(__dirname, '../../uploads');

// Ensure upload directory exists
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

/**
 * Save an uploaded file to disk
 * @returns Relative path from UPLOAD_DIR
 */
export function saveFile(shareId: string, file: Express.Multer.File): string {
  const shareDir = path.join(UPLOAD_DIR, shareId);
  if (!fs.existsSync(shareDir)) {
    fs.mkdirSync(shareDir, { recursive: true });
  }
  
  const destPath = path.join(shareDir, file.originalname);
  try {
    fs.renameSync(file.path, destPath);
  } catch {
    fs.copyFileSync(file.path, destPath);
    try { fs.unlinkSync(file.path); } catch {}
  }
  
  // Return relative path for storage in DB
  return path.relative(UPLOAD_DIR, destPath);
}

/**
 * Delete a file from disk
 */
export function deleteFile(storagePath: string): void {
  const fullPath = path.join(UPLOAD_DIR, storagePath);
  try {
    fs.unlinkSync(fullPath);
    // Also try to remove the share directory if empty
    const dir = path.dirname(fullPath);
    try {
      fs.rmdirSync(dir);
    } catch {
      // Directory not empty, ignore
    }
  } catch {
    // File doesn't exist, ignore
  }
}

/**
 * Get full path for a stored file
 */
export function getFilePath(storagePath: string): string {
  return path.join(UPLOAD_DIR, storagePath);
}

// Cleanup all uploads (for testing)
export function cleanupAllUploads(): void {
  try {
    fs.rmSync(UPLOAD_DIR, { recursive: true, force: true });
  } catch {
    // Ignore
  }
}
