import { randomUUID } from 'crypto';
import bcrypt from 'bcrypt';

const SHARE_CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const SHARE_CODE_LENGTH = 4;

/**
 * Generate a share code like SEC-XXXX-XXXX
 */
export function generateShareCode(): string {
  const randomPart = () => {
    let result = '';
    for (let i = 0; i < SHARE_CODE_LENGTH; i++) {
      result += SHARE_CODE_CHARS[Math.floor(Math.random() * SHARE_CODE_CHARS.length)];
    }
    return result;
  };
  return `SEC-${randomPart()}-${randomPart()}`;
}

/**
 * Hash a password with bcrypt
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

/**
 * Verify a password against a hash (constant-time)
 */
export async function verifyPassword(attempt: string, hash: string): Promise<boolean> {
  return bcrypt.compare(attempt, hash);
}

// Dummy hash for constant-time comparison when share doesn't exist
export const DUMMY_HASH = '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj0fGdA7WVGi';
