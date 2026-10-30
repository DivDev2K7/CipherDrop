import { Redis } from 'ioredis';
import prisma from './prisma.js';

let redis: Redis | null = null;

/**
 * Initialize Redis if REDIS_URL is set
 */
export function initRedis(): Redis | null {
  const redisUrl = process.env.REDIS_URL;
  if (redisUrl) {
    try {
      redis = new Redis(redisUrl);
      redis.on('error', (err: unknown) => {
        console.error('Redis error:', err);
      });
      console.log('✅ Redis connected');
    } catch (err) {
      console.error('Failed to connect to Redis:', err);
      redis = null;
    }
  }
  return redis;
}

/**
 * Get Redis client (may be null if not configured)
 */
export function getRedis(): Redis | null {
  return redis;
}

/**
 * Atomic decrement with Redis (fallback to DB)
 * Returns { allowed: boolean, newCount: number }
 */
export async function atomicDecrement(shareId: string, maxDownloads: number): Promise<{ allowed: boolean; newCount: number }> {
  const redis = getRedis();
  
  if (redis) {
    // Use Lua script for atomic check-and-decrement
    const script = `
      local count = redis.call('GET', KEYS[1])
      local newCount = tonumber(count) or 0
      if newCount < tonumber(ARGV[1]) then
        newCount = newCount + 1
        redis.call('SET', KEYS[1], newCount)
        redis.call('EXPIRE', KEYS[1], 3600) -- 1 hour TTL
        return {1, newCount}
      else
        return {0, newCount}
      end
    `;
    
    try {
      const result = (await redis.eval(script, 1, `share:${shareId}:downloads`, maxDownloads)) as [number, number];
      return { allowed: result[0] === 1, newCount: result[1] };
    } catch {
      // Fall through to DB
    }
  }
  
  // DB fallback
  const share = await prisma.share.findUnique({
    where: { id: shareId },
  });
  
  if (!share || share.downloadCount >= maxDownloads) {
    return { allowed: false, newCount: share?.downloadCount || maxDownloads };
  }
  
  const updated = await prisma.share.update({
    where: { id: shareId },
    data: { downloadCount: { increment: 1 } },
  });
  
  return { allowed: true, newCount: updated.downloadCount };
}

/**
 * Get current download count from Redis (fallback to DB)
 */
export async function getDownloadCount(shareId: string): Promise<number> {
  const redis = getRedis();
  if (redis) {
    try {
      const count = await redis.get(`share:${shareId}:downloads`);
      if (count) return parseInt(count, 10);
    } catch {}
  }
  
  const share = await prisma.share.findUnique({
    where: { id: shareId },
  });
  return share?.downloadCount || 0;
}
