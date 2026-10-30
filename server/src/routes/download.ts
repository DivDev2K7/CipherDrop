import { Router } from 'express';
import prisma from '../lib/prisma.js';
import { verifyPassword, DUMMY_HASH } from '../lib/crypto.js';
import { atomicDecrement } from '../lib/redis.js';
import { getFilePath } from '../lib/storage.js';
import type { ShareMetadata } from '../types/index.js';

const router = Router();

const BASE_URL = process.env.BASE_URL || 'http://localhost:3001';

// Helper to map to ShareMetadata
function mapToShareMetadata(share: any): ShareMetadata {
  return {
    id: share.id,
    code: share.code,
    filename: share.filename,
    fileSize: share.fileSize,
    fileType: share.fileType,
    createdAt: share.createdAt.toISOString(),
    expiresAt: share.expiresAt.toISOString(),
    maxDownloads: share.maxDownloads,
    downloadCount: share.downloadCount,
    isPasswordProtected: !!share.passwordHash,
    encryptionLevel: share.encryptionLevel as 'standard' | 'military',
    status: share.status as any,
    demoUrl: `${BASE_URL}/vault/${share.code}`,
  };
}

// POST /api/v1/download/:code - Verify and download
router.post('/:code', async (req, res) => {
  try {
    const { password } = req.body;
    const code = req.params.code.toUpperCase();

    // Find share
    const share = await prisma.share.findUnique({
      where: { code },
    });

    // Constant-time: always run password check to prevent timing oracle
    let passwordValid = false;

    if (share) {
      // Check expiration
      if (new Date(share.expiresAt) < new Date() || share.status === 'expired') {
        // Still run dummy password check for constant time
        await verifyPassword('dummy', DUMMY_HASH);
        return res.status(403).json({
          success: false,
          error: 'This secure transfer has expired and the payload has been shredded.',
        });
      }

      // Check if already at limit
      if (share.status === 'limit-reached' || share.downloadCount >= share.maxDownloads) {
        await verifyPassword('dummy', DUMMY_HASH);
        return res.status(403).json({
          success: false,
          error: 'Maximum download limit reached for this ephemeral link.',
        });
      }

      // Check password if required
      if (share.passwordHash) {
        if (!password) {
          await verifyPassword('dummy', DUMMY_HASH);
          return res.status(403).json({
            success: false,
            error: 'Password required to unlock this transfer.',
          });
        }
        passwordValid = await verifyPassword(password, share.passwordHash);
      } else {
        // No password required - run dummy check for constant time
        await verifyPassword('dummy', DUMMY_HASH);
        passwordValid = true;
      }

      if (!passwordValid) {
        return res.status(403).json({
          success: false,
          error: 'Incorrect decryption password. Access denied.',
        });
      }

      // Atomic decrement
      const { allowed, newCount } = await atomicDecrement(share.id, share.maxDownloads);

      if (!allowed) {
        return res.status(403).json({
          success: false,
          error: 'Maximum download limit reached for this ephemeral link.',
        });
      }

      // Update DB count (Redis may have been used)
      await prisma.share.update({
        where: { id: share.id },
        data: { downloadCount: newCount },
      });

      // Check if limit reached
      if (newCount >= share.maxDownloads) {
        await prisma.share.update({
          where: { id: share.id },
          data: { status: 'limit-reached' },
        });
      }

      // Log activity
      await prisma.activityLog.create({
        data: {
          action: 'File Downloaded',
          targetFile: share.filename,
          ipAddress: req.ip || 'unknown',
          status: 'success',
          details: `Download ${newCount}/${share.maxDownloads} processed successfully.`,
          shareId: share.id,
        },
      });

      // Return success with share metadata
      return res.json({
        success: true,
        share: mapToShareMetadata(share),
        downloadUrl: share.storagePath ? `${BASE_URL}/api/v1/download/${share.code}/file` : null,
      });
    } else {
      // Share doesn't exist - run dummy password check for constant time
      await verifyPassword(password || 'dummy', DUMMY_HASH);
      return res.status(404).json({
        success: false,
        error: 'Share link not found or invalid token.',
      });
    }
  } catch (error) {
    console.error('Download error:', error);
    res.status(500).json({ error: 'Failed to process download' });
  }
});

// GET /api/v1/download/:code/file - Serve the actual file
router.get('/:code/file', async (req, res) => {
  try {
    const code = req.params.code.toUpperCase();
    const share = await prisma.share.findUnique({
      where: { code },
    });

    if (!share || !share.storagePath) {
      return res.status(404).send('File not found');
    }

    const filePath = getFilePath(share.storagePath);
    res.download(filePath, share.filename);
  } catch (error) {
    console.error('File download error:', error);
    res.status(500).send('Failed to download file');
  }
});

export { router };
