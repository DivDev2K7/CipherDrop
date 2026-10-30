import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import prisma from '../lib/prisma.js';
import { saveFile } from '../lib/storage.js';

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
router.post('/:shareId', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const share = await prisma.share.findUnique({
      where: { id: req.params.shareId },
    });

    if (!share) {
      // Clean up temp file
      try { fs.unlinkSync(req.file.path); } catch {}
      return res.status(404).json({ error: 'Share not found' });
    }

    // Save file to permanent storage
    const storagePath = saveFile(share.id, req.file);

    // Update share with storage path
    await prisma.share.update({
      where: { id: share.id },
      data: { storagePath },
    });

    // Log activity
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
    // Clean up temp file if it exists
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
