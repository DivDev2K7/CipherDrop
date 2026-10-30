import prisma from '../lib/prisma.js';
import { deleteFile } from '../lib/storage.js';
import cron from 'node-cron';

/**
 * Clean up expired and exhausted shares
 */
export async function cleanupExpiredShares(): Promise<void> {
  console.log('🧹 Running cleanup job...');
  
  const now = new Date();
  
  // Find shares that are expired or have reached their download limit
  const sharesToCleanup = await prisma.share.findMany({
    where: {
      OR: [
        { expiresAt: { lt: now }, status: 'active' },
        { downloadCount: { gte: 1 }, maxDownloads: { lte: 1 }, status: 'active' },
      ],
    },
  });
  
  console.log(`Found ${sharesToCleanup.length} shares to clean up`);
  
  for (const share of sharesToCleanup) {
    try {
      // Delete the file from disk
      if (share.storagePath) {
        deleteFile(share.storagePath);
      }
      
      // Update status
      const newStatus = new Date(share.expiresAt) < now ? 'expired' : 'limit-reached';
      await prisma.share.update({
        where: { id: share.id },
        data: { status: newStatus },
      });
      
      // Log activity
      await prisma.activityLog.create({
        data: {
          action: 'Automated Cleanup',
          targetFile: share.filename,
          ipAddress: 'Internal Automated Shredder',
          status: 'warning',
          details: `Share ${share.code} marked as ${newStatus} and file deleted.`,
          shareId: share.id,
        },
      });
      
      console.log(`✅ Cleaned up share ${share.code}`);
    } catch (error) {
      console.error(`❌ Failed to clean up share ${share.code}:`, error);
      // Continue with next share
    }
  }
  
  console.log('🧹 Cleanup job completed');
}

/**
 * Start the cleanup cron job (runs every 5 minutes)
 */
export function startCleanupCron(): void {
  // Run immediately on startup
  cleanupExpiredShares().catch(console.error);
  
  // Then every 5 minutes
  cron.schedule('*/5 * * * *', () => {
    cleanupExpiredShares().catch(console.error);
  });
  
  console.log('✅ Cleanup cron job started (every 5 minutes)');
}
