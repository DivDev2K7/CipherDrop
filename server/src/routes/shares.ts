import { Router } from 'express';
import prisma from '../lib/prisma.js';
import { generateShareCode, hashPassword } from '../lib/crypto.js';
import type { ShareMetadata } from '../types/index.js';

const router = Router();

// Helper to map Prisma Share to ShareMetadata
function mapToShareMetadata(share: any, baseUrl: string): ShareMetadata {
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
    demoUrl: `${baseUrl}/vault/${share.code}`,
  };
}

const BASE_URL = process.env.BASE_URL || 'http://localhost:3001';

// GET /api/v1/shares - List all shares
router.get('/', async (req, res) => {
  try {
    const shares = await prisma.share.findMany({
      orderBy: { createdAt: 'desc' },
    });
    const metadata = shares.map((s) => mapToShareMetadata(s, BASE_URL));
    res.json(metadata);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch shares' });
  }
});

// GET /api/v1/shares/:code - Get share by code
router.get('/:code', async (req, res) => {
  try {
    const share = await prisma.share.findUnique({
      where: { code: req.params.code.toUpperCase() },
    });
    if (!share) {
      return res.status(404).json({ error: 'Share not found' });
    }
    res.json(mapToShareMetadata(share, BASE_URL));
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch share' });
  }
});

// POST /api/v1/shares - Create a new share (metadata only)
router.post('/', async (req, res) => {
  try {
    const { filename, fileSize, fileType, expiryHours, maxDownloads, requirePassword, password, encryptionLevel } = req.body;

    if (!filename || !fileSize || !expiryHours || !maxDownloads) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const code = generateShareCode();
    const expiresAt = new Date(Date.now() + expiryHours * 60 * 60 * 1000);
    const passwordHash = requirePassword && password ? await hashPassword(password) : null;

    const share = await prisma.share.create({
      data: {
        code,
        filename,
        fileSize,
        fileType: fileType || 'application/octet-stream',
        expiresAt,
        maxDownloads,
        passwordHash,
        encryptionLevel: encryptionLevel || 'standard',
        status: 'active',
      },
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        action: 'Share Created',
        targetFile: filename,
        ipAddress: req.ip || 'unknown',
        status: 'success',
        details: `Expires in ${expiryHours}h. Max downloads: ${maxDownloads}. Protected: ${requirePassword ? 'Yes' : 'No'}`,
        shareId: share.id,
      },
    });

    res.status(201).json(mapToShareMetadata(share, BASE_URL));
  } catch (error) {
    console.error('Create share error:', error);
    res.status(500).json({ error: 'Failed to create share' });
  }
});

// DELETE /api/v1/shares/:id - Revoke a share
router.delete('/:id', async (req, res) => {
  try {
    const share = await prisma.share.findUnique({
      where: { id: req.params.id },
    });

    if (!share) {
      return res.status(404).json({ error: 'Share not found' });
    }

    await prisma.share.update({
      where: { id: req.params.id },
      data: { status: 'revoked' },
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        action: 'Manual Revocation',
        targetFile: share.filename,
        ipAddress: req.ip || 'unknown',
        status: 'warning',
        details: 'Revoked manually by owner prior to expiration.',
        shareId: share.id,
      },
    });

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to revoke share' });
  }
});

export { router };
