import { Router } from 'express';
import prisma from '../lib/prisma.js';

const router = Router();

// GET /api/v1/dashboard/stats
router.get('/stats', async (req, res) => {
  try {
    const now = new Date();
    
    const active = await prisma.share.count({
      where: {
        status: 'active',
        expiresAt: { gt: now },
      },
    });

    const shares = await prisma.share.findMany();
    const totalDownloads = shares.reduce((acc: number, s: any) => acc + (s.downloadCount || 0), 0);

    const expiringSoon = await prisma.share.count({
      where: {
        status: 'active',
        expiresAt: {
          gt: now,
          lt: new Date(now.getTime() + 2 * 60 * 60 * 1000), // < 2 hours
        },
      },
    });

    const passwordProtected = await prisma.share.count({
      where: {
        status: 'active',
        passwordHash: { not: null },
        expiresAt: { gt: now },
      },
    });

    res.json({
      activeShares: active,
      totalDownloads,
      expiringSoon,
      passwordProtected,
    });
  } catch {
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

// GET /api/v1/dashboard/logs
router.get('/logs', async (req, res) => {
  try {
    const logs = await prisma.activityLog.findMany({
      orderBy: { timestamp: 'desc' },
      take: 100,
    });
    res.json(logs);
  } catch {
    res.status(500).json({ error: 'Failed to fetch logs' });
  }
});

export { router };
