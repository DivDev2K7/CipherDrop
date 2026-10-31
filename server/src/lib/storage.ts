import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { isS3Enabled, deleteS3Object, getS3, S3_BUCKET } from './s3.js';
import { GetObjectCommand } from '@aws-sdk/client-s3';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const UPLOAD_DIR = process.env.UPLOAD_DIR
  ? path.resolve(process.cwd(), process.env.UPLOAD_DIR)
  : path.join(__dirname, '../../uploads');

// Ensure upload directory exists (local dev)
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

/**
 * Save an uploaded file to disk (local) or return the S3 key.
 * When S3 is enabled, the caller uploads directly via pre-signed URL;
 * this function handles the local-disk path only.
 * @returns Relative path from UPLOAD_DIR (local) or S3 key
 */
export function saveFile(shareId: string, file: Express.Multer.File): string {
  // If S3 is enabled, files arrive via pre-signed PUT, not multer.
  // The route handler stores the S3 key directly in the DB.
  if (isS3Enabled()) {
    // S3 key pattern: cipherdrop/<shareId>/<timestamp>-<originalname>
    return `cipherdrop/${shareId}/${Date.now()}-${file.originalname}`;
  }

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
 * Delete a file from disk (local) or S3.
 */
export async function deleteFileAsync(storagePath: string): Promise<void> {
  if (isS3Enabled()) {
    await deleteS3Object(storagePath);
    return;
  }
  deleteFile(storagePath);
}

/**
 * Delete a file from disk (synchronous, local only).
 */
export function deleteFile(storagePath: string): void {
  const fullPath = path.join(UPLOAD_DIR, storagePath);
  try {
    fs.unlinkSync(fullPath);
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
 * Get full path for a stored file (local disk).
 */
export function getFilePath(storagePath: string): string {
  return path.join(UPLOAD_DIR, storagePath);
}

/**
 * Stream a file from S3 to the response.
 */
export async function streamS3Object(
  storagePath: string,
  res: any,
  filename: string
): Promise<void> {
  const client = getS3();
  if (!client) throw new Error('S3 not configured');

  const command = new GetObjectCommand({
    Bucket: S3_BUCKET,
    Key: storagePath,
  });

  const response = await client.send(command);
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.setHeader('Content-Type', response.ContentType || 'application/octet-stream');

  // Stream the body (S3 SDK v3 returns a Readable stream)
  if (response.Body) {
    const readable = response.Body as unknown as NodeJS.ReadableStream;
    readable.pipe(res);
  } else {
    res.status(404).send('File not found');
  }
}

// Cleanup all uploads (for testing)
export function cleanupAllUploads(): void {
  try {
    fs.rmSync(UPLOAD_DIR, { recursive: true, force: true });
  } catch {
    // Ignore
  }
}