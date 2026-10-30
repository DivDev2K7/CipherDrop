import { describe, it, expect } from 'vitest';
import { generateShareCode, hashPassword, verifyPassword, DUMMY_HASH } from '../src/lib/crypto.js';

describe('Crypto Utilities', () => {
  it('generates share codes matching SEC-XXXX-XXXX format', () => {
    const code = generateShareCode();
    expect(code).toMatch(/^SEC-[A-Z0-9]{4}-[A-Z0-9]{4}$/);
  });

  it('generates unique codes across invocations', () => {
    const codes = new Set(Array.from({ length: 20 }, () => generateShareCode()));
    expect(codes.size).toBe(20);
  });

  it('hashes and verifies passwords correctly', async () => {
    const password = 'my-secret-password-123';
    const hash = await hashPassword(password);
    expect(hash).not.toBe(password);
    expect(await verifyPassword(password, hash)).toBe(true);
    expect(await verifyPassword('wrong-password', hash)).toBe(false);
  });

  it('verifies dummy hash safely', async () => {
    const isValid = await verifyPassword('arbitrary', DUMMY_HASH);
    expect(isValid).toBe(false);
  });
});
