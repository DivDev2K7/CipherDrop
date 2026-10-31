import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import prisma from '../lib/prisma.js';
import { saveFile } from '../lib/storage.js';
import { isS3Enabled, generatePresignedPutUrl } from '../lib/s3.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = Router();

// Ensure temp directory exists
const tempDir = path.join(__dirname, '../../temp');
if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir, { recursive: true });
}

// Configure multer for 100MB limit
const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, tempDir);
    },
    filename: (req, file, cb) => {
      cb(null, `${Date.now()}-${file.originalname}`);
    },
  }),
  limits: {
    fileSize: 100 * 1024 * 1024, // 100 MB
  },
});

// POST /api/v1/upload/:shareId - Upload a file for a share
// When S3 is enabled, returns a pre-signed PUT URL for direct client upload.
// When S3 is disabled, accepts multipart upload and stores on disk.
router.post('/:shareId', upload.single('file'), async (req, res) => {
  try {
    const share = await prisma.share.findUnique({
      where: { id: req.params.shareId },
    });

    if (!share) {
      if (req.file) {
        try { fs.unlinkSync(req.file.path); } catch {}
      }
      return res.status(404).json({ error: 'Share not found' });
    }

    // --- S3 path: direct client-to-S3 upload via pre-signed URL ---
    if (isS3Enabled()) {
      // Clean up any temp file from multer
      if (req.file) {
        try { fs.unlinkSync(req.file.path); } catch {}
      }

      const s3Key = `cipherdrop/${share.id}/${Date.now()}-${req.body.filename || share.filename}`;
      const contentType = req.body.fileType || 'application/octet-stream';

      const uploadUrl = await generatePresignedPutUrl(s3Key, contentType);

      // Store the S3 key as the storage path
      await prisma.share.update({
        where: { id: share.id },
        data: { storagePath: s3Key },
      });

      return res.json({
        success: true,
        storagePath: s3Key,
        uploadUrl,
        method: 'S3-presigned-PUT',
        filename: req.body.filename || share.filename,
      });
    }

    // --- Local disk path ---
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const storagePath = saveFile(share.id, req.file);

    await prisma.share.update({
      where: { id: share.id },
      data: { storagePath },
    });

    await prisma.activityLog.create({
      data: {
        action: 'File Uploaded',
        targetFile: req.file.originalname,
        ipAddress: req.ip || 'unknown',
        status: 'success',
        details: `File size: ${req.file.size} bytes`,
        shareId: share.id,
      },
    });

    res.json({
      success: true,
      storagePath,
      filename: req.file.originalname,
      size: req.file.size,
    });
  } catch (error) {
    console.error('Upload error:', error);
    if (req.file?.path) {
      try { fs.unlinkSync(req.file.path); } catch {}
    }
    res.status(500).json({ error: 'Failed to upload file' });
  }
});

// Error handler for multer (size limit exceeded)
router.use((err: any, req: any, res: any, next: any) => {
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({ error: 'File size exceeds 100MB limit' });
  }
  next(err);
});

export { router };